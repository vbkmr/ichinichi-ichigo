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

// daily streak — counts the consecutive days the site is opened, kept in
// localStorage. It extends by one on the next calendar day, and resets to 1
// after any gap. Computed once on load; the count shows where 第 N 日 used to.
const STREAK_KEY = "ichigo.streak";
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const daysApart = (a, b) =>
  Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const streak = (() => {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(STREAK_KEY));
  } catch {
    /* ignore — treated as a first visit */
  }
  const today = todayStr();
  if (!s || !s.last) s = { last: today, count: 1 };
  else {
    const d = daysApart(s.last, today);
    if (d === 1) {
      s.count += 1; // next calendar day — extend the streak
      s.last = today;
    } else if (d > 1) {
      s.count = 1; // missed a day — start over
      s.last = today;
    } else s.last = today; // same day (or clock skew) — leave the count
  }
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  } catch {
    /* ignore — streak just won't persist */
  }
  return s.count;
})();

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
    // Sanitize the rendered markdown before it touches the DOM. The data is
    // author-written today, but this keeps a stray <script>/onerror out of
    // innerHTML if the dataset ever ingests anything not hand-written.
    panel.innerHTML = DOMPurify.sanitize(
      marked.parse(w?.explanation || "*まだ説明がありません。*"),
    );
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

  // streak is the same all session, so render it once into the meta slot
  meta.textContent = `🔥 ${streak} 日連続`;

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
