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

const state = {
  notes: NOTES,
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

function randomQuestion() {
  const note = NOTES[Math.floor(Math.random() * NOTES.length)];
  return { ...note };
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

  socket.on("answer", ({ team, noteId }) => {
    if (!["A", "B"].includes(team)) return;
    if (!state.question || state.status !== "playing" || state.winner) return;
    if (state.lockedTeams[team]) return;

    state.lockedTeams[team] = true;
    const isCorrect = noteId === state.question.id;

    if (isCorrect) {
      state.scores[team] += 1;
      state.streaks[team] += 1;
      const bonus = state.streaks[team] > 0 && state.streaks[team] % 3 === 0 ? 1 : 0;
      const pull = 1 + bonus;
      state.tugPosition += team === "A" ? -pull : pull;
      state.lastEvent = `${teamName(team)}答對了！${bonus ? "三連答，加強拉力！" : ""}`;
    } else {
      state.streaks[team] = 0;
      const correct = `${state.question.label} / ${state.question.letter}`;
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
