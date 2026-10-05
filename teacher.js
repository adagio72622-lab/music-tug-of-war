const socket = io();

const els = {
  nextQuestion: document.querySelector("#nextQuestion"),
  resetGame: document.querySelector("#resetGame"),
  scoreA: document.querySelector("#scoreA"),
  scoreB: document.querySelector("#scoreB"),
  streakA: document.querySelector("#streakA"),
  streakB: document.querySelector("#streakB"),
  questionNumber: document.querySelector("#questionNumber"),
  gameStatus: document.querySelector("#gameStatus"),
  lastEvent: document.querySelector("#lastEvent"),
  rope: document.querySelector("#rope"),
  staff: document.querySelector("#staff"),
  questionTitle: document.querySelector("#questionTitle"),
  answerReveal: document.querySelector("#answerReveal"),
  blueCharacter: document.querySelector("#blueCharacter"),
  redCharacter: document.querySelector("#redCharacter")
};

const blueLink = document.querySelector("#blueLink");
const redLink = document.querySelector("#redLink");

fetch("/api/links")
  .then((response) => response.json())
  .then((links) => {
    blueLink.textContent = links.blueTeam;
    redLink.textContent = links.redTeam;
  })
  .catch(() => {
    blueLink.textContent = `${window.location.origin}/team.html?team=A`;
    redLink.textContent = `${window.location.origin}/team.html?team=B`;
  });

els.nextQuestion.addEventListener("click", () => socket.emit("teacher:next"));
els.resetGame.addEventListener("click", () => socket.emit("teacher:reset"));

socket.on("state", (state) => {
  els.scoreA.textContent = state.scores.A;
  els.scoreB.textContent = state.scores.B;
  els.streakA.textContent = `連答：${state.streaks.A}`;
  els.streakB.textContent = `連答：${state.streaks.B}`;
  els.questionNumber.textContent = state.questionNumber ? `第 ${state.questionNumber} 題` : "尚未開始";
  els.lastEvent.textContent = state.lastEvent;
  els.gameStatus.textContent = state.winner ? `${teamDisplayName(state.winner)}勝利！` : state.status === "playing" ? "搶答中" : "請按下一題";
  els.questionTitle.textContent = state.question ? "這個音是什麼？" : "等待老師出題";
  els.answerReveal.textContent = state.question ? "學生作答後，可從事件列看到答題結果。" : "答案會在隊伍作答後顯示於事件列。";

  const movePercent = state.tugPosition * 5.8;
  els.rope.style.transform = `translateX(${movePercent}%)`;
  els.blueCharacter.style.transform = `translateX(${movePercent * 0.45}%)`;
  els.redCharacter.style.transform = `translateX(${movePercent * 0.45}%) scaleX(-1)`;

  els.nextQuestion.disabled = Boolean(state.winner);
  drawStaff(els.staff, state.question);
});
