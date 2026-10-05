const socket = io();
const team = getTeamFromUrl();

const els = {
  teamHeader: document.querySelector("#teamHeader"),
  teamName: document.querySelector("#teamName"),
  teamQuestion: document.querySelector("#teamQuestion"),
  teamEvent: document.querySelector("#teamEvent"),
  answerGrid: document.querySelector("#answerGrid")
};

els.teamHeader.classList.add(team === "A" ? "blue-team" : "red-team");
els.teamName.textContent = teamDisplayName(team);

function renderButtons(disabled = true) {
  els.answerGrid.innerHTML = NOTE_OPTIONS.map(
    (note) => `
      <button class="answer-button" data-note-id="${note.id}" ${disabled ? "disabled" : ""}>
        <span>${note.solfege}</span>
        <small>${note.label} / ${note.letter}</small>
      </button>
    `
  ).join("");
}

renderButtons(true);

els.answerGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-note-id]");
  if (!button || button.disabled) return;
  socket.emit("answer", { team, noteId: button.dataset.noteId });
  renderButtons(true);
  els.teamEvent.textContent = "已送出答案，請看老師畫面。";
});

socket.on("state", (state) => {
  const locked = state.lockedTeams[team];
  const canAnswer = Boolean(state.question && state.status === "playing" && !state.winner && !locked);
  renderButtons(!canAnswer);

  if (state.winner) {
    els.teamQuestion.textContent = "遊戲結束";
    els.teamEvent.textContent = state.winner === team ? "恭喜，你們獲勝了！" : "再挑戰一次！";
    return;
  }

  if (!state.question) {
    els.teamQuestion.textContent = "等待老師出題";
    els.teamEvent.textContent = "準備好後，老師會按下一題。";
    return;
  }

  els.teamQuestion.textContent = `第 ${state.questionNumber} 題`;
  els.teamEvent.textContent = locked ? "本題已作答，等待下一題。" : "請選出老師畫面上的音名。";
});
