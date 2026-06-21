// 🍓 一日一語 — daily word widget (Scriptable)
// Paste into a new Scriptable script, add a Scriptable home-screen widget, and
// point it at this script. Set "When Interacting → Open URL" so a tap opens the
// site on the day's word.
const BASE = "https://vbkmr.github.io/ichinichi-ichigo";

const list = await new Request(`${BASE}/data/index.json`).loadJSON();
list.sort((a, b) => a.id.localeCompare(b.id)); // same fixed order as the site
const epochDay = Math.floor(Date.now() / 86400000); // changes once per day
const w = list[epochDay % list.length];

const widget = new ListWidget();
widget.backgroundColor = new Color("#11213f"); // 紺 (dark card)
widget.setPadding(20, 20, 20, 20);

const eyebrow = widget.addText("🍓 一日一語");
eyebrow.font = new Font("Menlo", 11);
eyebrow.textColor = new Color("#f8b500"); // 山吹色

widget.addSpacer();

const word = widget.addText(w.word);
word.font = new Font("HiraMinProN-W6", 40); // 明朝 — Hiragino Mincho (on iOS)
word.textColor = new Color("#f0e8d6"); // 練色
word.minimumScaleFactor = 0.4;
word.lineLimit = 1;

widget.addSpacer(6);
const reading = widget.addText(w.reading || "");
reading.font = new Font("Menlo", 13);
reading.textColor = new Color("#f5b1aa"); // 珊瑚色

widget.addSpacer(8);
const meaning = widget.addText(w.meaning || "");
meaning.font = Font.systemFont(13);
meaning.textColor = new Color("#d8d3c4");
meaning.lineLimit = 2;

widget.addSpacer();
const foot = widget.addText(`第 ${(epochDay % list.length) + 1} 日`);
foot.font = new Font("Menlo", 10.5);
foot.textColor = new Color("#a9adb0"); // 銀鼠

widget.url = `${BASE}/#${w.id}`; // tap opens the site on this word
widget.refreshAfterDate = new Date(Date.now() + 3600 * 1000);
Script.setWidget(widget);
Script.complete();
