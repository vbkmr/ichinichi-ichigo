// 🍓 一日一語 — site logic.
// • Arriving via a widget deep-link (/#<id>) shows that exact word and keeps it
//   on refresh — so the widget's daily word and the site stay in sync.
// • A plain visit shows a random word, and each refresh shows a new one.
// • Single tap reveals/folds the explanation; double tap jumps to a new word.
const $ = (s) => document.querySelector(s);
const sortById = (a, b) => a.id.localeCompare(b.id);
const HINT_CLOSED = "tap to reveal · double-tap for a new word";
// external links shown at the foot of the revealed card (edit / reorder freely)
const CARD_LINKS = [
  { label: "🔊 pronunciation (Forvo)", site: "Forvo", url: (w) => `https://forvo.com/word/${encodeURIComponent(w)}/#ja` },
  { label: "📖 look up on Jisho", site: "Jisho", url: (w) => `https://jisho.org/search/${encodeURIComponent(w)}` },
];

(async () => {
  const word = $("#word"),
    panel = $("#panel"),
    reading = $("#reading"),
    meta = $("#meta"),
    hint = $("#hint");

  let index;
  try {
    index = (await (await fetch("data/index.json")).json()).sort(sortById);
  } catch {
    word.textContent = "…";
    hint.textContent = "couldn't load the word list";
    return;
  }
  if (!index.length) {
    word.textContent = "🍓";
    hint.textContent = "no words yet";
    return;
  }

  let full = null;
  let current = null;

  const randomIndex = (exclude) => {
    if (index.length === 1) return 0;
    let i;
    do {
      i = Math.floor(Math.random() * index.length);
    } while (i === exclude);
    return i;
  };

  function fold() {
    panel.classList.add("hidden");
    word.setAttribute("aria-expanded", "false");
    hint.textContent = HINT_CLOSED;
  }

  function show(entry) {
    current = entry;
    word.textContent = entry.word;
    reading.textContent = entry.reading || "";
    meta.textContent = `第 ${index.indexOf(entry) + 1} 日`;
    document.title = `${entry.word} — 🍓 一日一語`;
    fold();
  }

  async function reveal() {
    if (!panel.classList.contains("hidden")) {
      fold();
      return;
    }
    if (!full) {
      try {
        full = await (await fetch("data/goi.json")).json();
      } catch {
        full = [];
      }
    }
    const w = full.find((e) => e.id === current.id);
    panel.innerHTML = marked.parse(w?.explanation || "*まだ説明がありません。*");
    // wrap tables so wide ones scroll inside the card instead of widening the page
    panel.querySelectorAll("table").forEach((t) => {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.replaceWith(wrap);
      wrap.appendChild(t);
    });
    // external links at the foot of the card
    const links = document.createElement("div");
    links.className = "card-links";
    for (const L of CARD_LINKS) {
      const a = document.createElement("a");
      a.href = L.url(current.word);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.setAttribute("aria-label", `${current.word} on ${L.site} (opens in a new tab)`);
      a.innerHTML = `<span>${L.label} ↗</span>`;
      links.appendChild(a);
    }
    panel.appendChild(links);
    panel.classList.remove("hidden");
    word.setAttribute("aria-expanded", "true");
    hint.textContent = "tap again to fold";
  }

  const shuffle = () => show(index[randomIndex(index.indexOf(current))]);

  // initial word: widget deep-link is stable, a plain visit is random
  const start = index.find((e) => e.id === location.hash.slice(1));
  show(start || index[randomIndex(-1)]);
  if (new URLSearchParams(location.search).has("open")) queueMicrotask(reveal);

  // disambiguate single tap (reveal) from double tap (new word)
  let clickTimer = null;
  word.addEventListener("click", () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      shuffle();
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        reveal();
      }, 240);
    }
  });
})();
