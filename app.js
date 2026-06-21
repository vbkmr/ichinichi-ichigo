// 🍓 一日一語 — site logic. Daily-word math must stay identical to the widget:
// sort by id, then index = epochDay % length.
const $ = (s) => document.querySelector(s);
const sortById = (a, b) => a.id.localeCompare(b.id);

(async () => {
  let index;
  try {
    index = (await (await fetch("data/index.json")).json()).sort(sortById);
  } catch {
    $("#word").textContent = "…";
    $("#hint").textContent = "couldn't load the word list";
    return;
  }
  if (!index.length) {
    $("#word").textContent = "🍓";
    $("#hint").textContent = "no words yet";
    return;
  }

  const epochDay = Math.floor(Date.now() / 86400000); // changes once per day
  const dayIdx = epochDay % index.length;
  const today = index[dayIdx];
  const fromHash = location.hash.slice(1);
  const entry = index.find((e) => e.id === fromHash) || today;
  const entryIdx = index.indexOf(entry);

  $("#word").textContent = entry.word;
  $("#reading").textContent = entry.reading || "";
  $("#meta").textContent = `第 ${entryIdx + 1} 日 · ${entry.meaning || ""}`;
  document.title = `${entry.word} — 🍓 一日一語`;

  let full = null;
  const panel = $("#panel");
  const word = $("#word");

  // Auto-open the explanation when the URL asks for it (e.g. a widget deep-link
  // like /?open#<id>), so the card is one tap away.
  if (new URLSearchParams(location.search).has("open")) {
    queueMicrotask(() => word.click());
  }

  word.addEventListener("click", async () => {
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      word.setAttribute("aria-expanded", "false");
      $("#hint").textContent = "tap the word ↑";
      return;
    }
    if (!full) {
      try {
        full = await (await fetch("data/goi.json")).json();
      } catch {
        full = [];
      }
    }
    const w = full.find((e) => e.id === entry.id);
    panel.innerHTML = marked.parse(w?.explanation || "*まだ説明がありません。*");
    panel.classList.remove("hidden");
    word.setAttribute("aria-expanded", "true");
    $("#hint").textContent = "tap again to fold";
  });
})();
