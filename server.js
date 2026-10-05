const express = require("express");
const http = require("http");
const os = require("os");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_PULL = 7;

const NOTES = [
  { id: "C4", solfege: "Do", label: "中央 Do", letter: "C", staffStep: 0 },
  { id: "D4", solfege: "Re", label: "Re", letter: "D", staffStep: 1 },
  { id: "E4", solfege: "Mi", label: "Mi", letter: "E", staffStep: 2 },
  { id: "F4", solfege: "Fa", label: "Fa", letter: "F", staffStep: 3 },
  { id: "G4", solfege: "Sol", label: "Sol", letter: "G", staffStep: 4 },
  { id: "A4", solfege: "La", label: "La", letter: "A", staffStep: 5 },
  { id: "B4", solfege: "Si", label: "Si", letter: "B", staffStep: 6 },
  { id: "C5", solfege: "高音 Do", label: "高音 Do", letter: "C", staffStep: 7 }
];

const INTERVALS = [
  { id: "C4-D4", start: NOTES[0], end: NOTES[1], answer: "whole", label: "Do → Re" },
  { id: "D4-E4", start: NOTES[1], end: NOTES[2], answer: "whole", label: "Re → Mi" },
  { id: "E4-F4", start: NOTES[2], end: NOTES[3], answer: "half", label: "Mi → Fa" },
  { id: "F4-G4", start: NOTES[3], end: NOTES[4], answer: "whole", label: "Fa → Sol" },
  { id: "G4-A4", start: NOTES[4], end: NOTES[5], answer: "whole", label: "Sol → La" },
  { id: "A4-B4", start: NOTES[5], end: NOTES[6], answer: "whole", label: "La → Si" },
  { id: "B4-C5", start: NOTES[6], end: NOTES[7], answer: "half", label: "Si → 高音 Do" }
];

const MODES = {
  note: {
    id: "note",
    name: "認譜模式",
    prompt: "這個音是什麼？"
  },
  interval: {
    id: "interval",
    name: "全音半音模式",
    prompt: "這兩個音之間是全音還是半音？"
  }
};

const state = {
  notes: NOTES,
  modes: MODES,
  mode: "note",
  question: null,
  questionNumber: 0,
  tugPosition: 0,
  scores: { A: 0, B: 0 },
  streaks: { A: 0, B: 0 },
  lockedTeams: { A: false, B: false },
  status: "waiting",
  winner: null,
  lastEvent: "請老師按「下一題」開始遊戲。"
};

function publicState() {
  return {
    ...state,
    lockedTeams: { ...state.lockedTeams },
    scores: { ...state.scores },
    streaks: { ...state.streaks }
  };
}

function randomNoteQuestion() {
  const note = NOTES[Math.floor(Math.random() * NOTES.length)];
  return { type: "note", ...note };
}

function randomIntervalQuestion() {
  const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
  return {
    type: "interval",
    id: interval.id,
    label: interval.label,
    start: interval.start,
    end: interval.end,
    answer: interval.answer
  };
}

function randomQuestion() {
  return state.mode === "interval" ? randomIntervalQuestion() : randomNoteQuestion();
}

function nextQuestion() {
  state.question = randomQuestion();
  state.questionNumber += 1;
  state.lockedTeams = { A: false, B: false };
  state.status = "playing";
  state.winner = null;
  state.lastEvent = `第 ${state.questionNumber} 題：請判斷五線譜上的音。`;
}

function resetGame() {
  state.question = null;
  state.questionNumber = 0;
  state.tugPosition = 0;
  state.scores = { A: 0, B: 0 };
  state.streaks = { A: 0, B: 0 };
  state.lockedTeams = { A: false, B: false };
  state.status = "waiting";
  state.winner = null;
  state.lastEvent = "遊戲已重設，請老師按「下一題」開始。";
}

function teamName(team) {
  return team === "A" ? "藍隊" : "紅隊";
}

function answerIsCorrect(noteId) {
  if (!state.question) return false;
  if (state.question.type === "interval") {
    return noteId === state.question.answer;
  }
  return noteId === state.question.id;
}

function correctAnswerLabel() {
  if (!state.question) return "";
  if (state.question.type === "interval") {
    return state.question.answer === "whole" ? "全音" : "半音";
  }
  return `${state.question.label} / ${state.question.letter}`;
}

function emitState() {
  io.emit("state", publicState());
}

function getLocalAddresses() {
  const addresses = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

app.use(express.static("public"));

app.get("/api/links", (_req, res) => {
  const hosts = getLocalAddresses();
  const requestHost = _req.get("host");
  const protocol = _req.get("x-forwarded-proto") || _req.protocol || "http";
  const currentBaseUrl = requestHost ? `${protocol}://${requestHost}` : null;
  const localBaseUrls = hosts.length ? hosts.map((host) => `http://${host}:${PORT}`) : [`http://localhost:${PORT}`];
  const baseUrls = currentBaseUrl ? [currentBaseUrl, ...localBaseUrls] : localBaseUrls;
  res.json({
    baseUrls,
    teacher: `${baseUrls[0]}/teacher.html`,
    blueTeam: `${baseUrls[0]}/team.html?team=A`,
    redTeam: `${baseUrls[0]}/team.html?team=B`
  });
});

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

io.on("connection", (socket) => {
  socket.emit("state", publicState());

  socket.on("teacher:next", () => {
    if (state.winner) return;
    nextQuestion();
    emitState();
  });

  socket.on("teacher:reset", () => {
    resetGame();
    emitState();
  });

  socket.on("teacher:mode", (mode) => {
    if (!MODES[mode]) return;
    resetGame();
    state.mode = mode;
    state.lastEvent = `已切換到${MODES[mode].name}，請按「下一題」開始。`;
    emitState();
  });

  socket.on("answer", ({ team, noteId }) => {
    if (!["A", "B"].includes(team)) return;
    if (!state.question || state.status !== "playing" || state.winner) return;
    if (state.lockedTeams[team]) return;

    state.lockedTeams[team] = true;
    const isCorrect = answerIsCorrect(noteId);

    if (isCorrect) {
      state.scores[team] += 1;
      state.streaks[team] += 1;
      const bonus = state.streaks[team] > 0 && state.streaks[team] % 3 === 0 ? 1 : 0;
      const pull = 1 + bonus;
      state.tugPosition += team === "A" ? -pull : pull;
      state.lastEvent = `${teamName(team)}答對了！${bonus ? "三連答，加強拉力！" : ""}`;
    } else {
      state.streaks[team] = 0;
      const correct = correctAnswerLabel();
      state.lastEvent = `${teamName(team)}答錯了，正確答案是 ${correct}。`;
    }

    if (state.tugPosition <= -MAX_PULL) {
      state.tugPosition = -MAX_PULL;
      state.winner = "A";
      state.status = "finished";
      state.lastEvent = "藍隊勝利！";
    }

    if (state.tugPosition >= MAX_PULL) {
      state.tugPosition = MAX_PULL;
      state.winner = "B";
      state.status = "finished";
      state.lastEvent = "紅隊勝利！";
    }

    emitState();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`五線譜拔河大戰已啟動：http://localhost:${PORT}`);
  for (const address of getLocalAddresses()) {
    console.log(`同一個 Wi‑Fi 的 iPad 可開啟：http://${address}:${PORT}`);
  }
});
