const NOTE_OPTIONS = [
  { id: "C4", solfege: "Do", label: "中央 Do", letter: "C", staffStep: 0 },
  { id: "D4", solfege: "Re", label: "Re", letter: "D", staffStep: 1 },
  { id: "E4", solfege: "Mi", label: "Mi", letter: "E", staffStep: 2 },
  { id: "F4", solfege: "Fa", label: "Fa", letter: "F", staffStep: 3 },
  { id: "G4", solfege: "Sol", label: "Sol", letter: "G", staffStep: 4 },
  { id: "A4", solfege: "La", label: "La", letter: "A", staffStep: 5 },
  { id: "B4", solfege: "Si", label: "Si", letter: "B", staffStep: 6 },
  { id: "C5", solfege: "高音 Do", label: "高音 Do", letter: "C", staffStep: 7 }
];

function drawStaff(target, note) {
  if (!target) return;
  if (!note) {
    target.innerHTML = `<div class="empty-staff">按「下一題」後，這裡會出現音符。</div>`;
    return;
  }

  const lineGap = 26;
  const topLineY = 56;
  const bottomLineY = topLineY + lineGap * 4;
  const c4Y = bottomLineY + lineGap;
  const y = c4Y - note.staffStep * (lineGap / 2);
  const x = 250;
  const ledger = note.id === "C4" ? `<line x1="210" y1="${y}" x2="294" y2="${y}" class="ledger" />` : "";

  target.innerHTML = `
    <svg viewBox="0 0 520 230" role="img" aria-label="五線譜音符">
      <text x="32" y="148" class="clef">𝄞</text>
      ${[0, 1, 2, 3, 4]
        .map((line) => `<line x1="112" y1="${topLineY + line * lineGap}" x2="470" y2="${topLineY + line * lineGap}" class="staff-line" />`)
        .join("")}
      ${ledger}
      <ellipse cx="${x}" cy="${y}" rx="24" ry="17" class="note-head" transform="rotate(-18 ${x} ${y})" />
      <line x1="${x + 22}" y1="${y - 3}" x2="${x + 22}" y2="${Math.max(30, y - 92)}" class="stem" />
    </svg>
  `;
}

function getTeamFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("team") === "B" ? "B" : "A";
}

function teamDisplayName(team) {
  return team === "A" ? "藍隊" : "紅隊";
}
