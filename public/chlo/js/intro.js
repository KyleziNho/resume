// Intro: sealed envelope → cover page with days counter → player select → terms & conditions → start ♥
// ✏️ Kyle: the joke stats live right here, edit freely.
const P1_STATS = [
  // [label, bar 0..10 (above 10 = bursts out of the card), value text]
  ["arriving on time", 3, "11:30 = 11:59"],
  ["guess the asian", 10, "13–9 vs pickle"],
  ["spice tolerance", 10, "malaysian (max)"],
  ["photos per trip", 9, "~847"],
  ["patience with kyle", 30, "999"],
];
const P1_SPECIAL = "\"that's a skill issue\" (999 damage, zero emotion)";
const P1_WEAKNESS = "cute dogs, matcha, skyjo, me";
const P2_STATS = [["nonchalant", 0, "0/10"], ["vinted jacket hunt", 1, "day 47"], ["losing gracefully", 1, "it's acc rigged"], ["loving you", 30, "∞"]];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export async function run(root, ctx) {
  const { art, sfx, config } = ctx;
  const her = esc(config.herName), him = esc(config.hisName);
  root.classList.add("intro", "scroll-scene");
  root.innerHTML = `<div class="desk" aria-hidden="true"></div><div class="intro-step"></div>`;
  scatterStickers(root.querySelector(".desk"), art, sfx);
  const step = root.querySelector(".intro-step");
  const fx = document.getElementById("fx");
  const center = (el) => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };

  /* ── 1. the envelope ── */
  step.innerHTML = `<div class="env-wrap">
    ${art.envelope({
      face: `<div class="env-to">for <span>${her}</span></div>
             <div class="env-addr">to: the cutest pumpkin from Malaysia <span class="l2">(currently: wherever we are)</span></div>
             <div class="env-stamp sticker">${art.stamp("MY ♥", 78, { seed: 21, flower: "peony" })}</div>
             <div class="env-postmark">${postmark()}</div>
             <div class="env-tape">${art.washi(90, "mint", "dots", { seed: 3 })}</div>`,
      inner: `<div class="peek">${art.peony(56, { seed: 4 })}${art.lily(50, { seed: 5 })}</div>`,
    })}
    <p class="env-hint">psst… tap the wax seal 👀</p>
  </div>`;
  const env = step.querySelector(".envelope");
  const seal = env.querySelector(".env-seal");
  ctx.say(ctx.pick(["…oh! a letter. for u. it looks acc important 👀", "a letter came for u!! very official. very pink.<br>kyle says open it rn"]), 0);
  const nudge = setTimeout(() => { art.setMood("smug"); ctx.say("the wax seal. poke it 👉<br>u know u want to 😏", 0); }, 7000);
  env.addEventListener("click", (e) => {
    if (e.target.closest(".env-seal") || env.classList.contains("opening")) return;
    sfx.nope(); env.classList.remove("shake"); void env.offsetWidth; env.classList.add("shake");
    ctx.say(ctx.pick(["not there. the seal lah 😤", "closer… the pink blob in the middle", "it's the round wax thing. pip believes in u"]), 3000);
  });
  await new Promise((res) => seal.addEventListener("click", res, { once: true }));
  clearTimeout(nudge);
  ctx.say("");
  await art.openEnvelope(env);
  const [ex, ey] = center(env);
  ctx.burst(ex, ey - 60, 26);
  sfx.win();
  step.querySelector(".env-wrap").classList.add("gone");
  await wait(reduced() ? 50 : 450);

  /* ── 2. the cover: for {her} + days together ── */
  const since = new Date(config.togetherSince + "T00:00:00");
  const days = Math.max(0, Math.floor((Date.now() - since.getTime()) / 864e5));
  step.innerHTML = `<div class="cover card">
    <div class="tape" style="top:-14px;left:calc(50% - 55px);transform:rotate(-3deg)"></div>
    <div class="cover-flower f1 sticker">${art.peony(92, { seed: 11, color: 0 })}</div>
    <div class="cover-flower f2 sticker">${art.lily(84, { seed: 12, color: "pink" })}</div>
    <div class="cover-flower f3 sticker">${art.peony(60, { seed: 13, color: 1 })}</div>
    <p class="cover-small">a tiny game i made with way too much love, for</p>
    <h1 class="cover-name">${her}</h1>
    <div class="cover-squiggle">${art.squiggle(240, undefined, { seed: 2 })}</div>
    <p class="cover-small">we've been an "us" for</p>
    <div class="days"><span class="days-num">0</span><span class="days-word">days</span></div>
    <p class="days-sub">that's <b>${(days * 24).toLocaleString()}</b> hours, and roughly <b>${Math.max(1, Math.round(days / 7)).toLocaleString()}</b> rounds of<br>"what do u want?" "U"</p>
    <button class="btn next">ok wait what is this →</button>
  </div>`;
  const num = step.querySelector(".days-num");
  countUp(num, days, reduced() ? 0 : 1600, () => { sfx.pop(1.3); ctx.burst(...center(num), 10); });
  await wait(500);
  art.setMood("love");
  ctx.say(`hiii i'm <b>${art.MASCOT_NAME}</b> 🌸 a peony bun<br>${him} doodled me at 2am to be ur guide today`, 0);
  await click(step.querySelector(".next"), sfx);

  /* ── 3. player select ── */
  ctx.say("ok first things first<br>choose ur fighter 😏", 0);
  step.innerHTML = `<div class="ps">
    <h2 class="ps-title"><span>★</span> select your player <span>★</span></h2>
    <div class="ps-cards">
      <button class="pcard p1" aria-label="select player 1, ${her}">
        <div class="ptag">PLAYER 1</div>
        <div class="avatar"><div class="crown">${art.crown(46)}</div>${art.lily(96, { seed: 31, color: "pink" })}</div>
        <div class="pname">${her}</div>
        <div class="pclass">class: lily queen · lvl ${Math.max(1, Math.floor(days / 365) + 1)}</div>
        <ul class="stats">${P1_STATS.map(statRow).join("")}</ul>
        <p class="pnote"><b>special move:</b> ${esc(P1_SPECIAL)}</p>
        <p class="pnote"><b>weakness:</b> ${esc(P1_WEAKNESS)}</p>
        <div class="ready-stamp">READY!</div>
      </button>
      <button class="pcard p2" aria-label="player 2 is locked">
        <div class="ptag">PLAYER 2 · CPU</div>
        <div class="avatar sm">${art.potato(70)}</div>
        <div class="pname">${him}</div>
        <div class="pclass">a.k.a. pickle · (artist's impression)</div>
        <ul class="stats">${P2_STATS.map(statRow).join("")}</ul>
        <div class="locked">🔒 not selectable</div>
      </button>
    </div>
  </div>`;
  const p1 = step.querySelector(".p1"), p2 = step.querySelector(".p2");
  const p2Lines = ["player 2 is busy. he built a whole app for this. he builds apps for everything lah", "nope. player 2 says he's nonchalant 🤣 (he is not)", "he's an npc today. his only line is 'u look so cute pumpkin'", "🔒 locked. reason: he loves u too much<br>pip told him to go book an nhs appointment"];
  let p2i = 0;
  p2.onclick = () => {
    sfx.nope(); p2.classList.remove("shake"); void p2.offsetWidth; p2.classList.add("shake");
    art.setMood("smug"); ctx.say(p2Lines[p2i++ % p2Lines.length], 3500);
  };
  await new Promise((res) => (p1.onclick = res));
  p1.onclick = null; p2.onclick = null;
  p1.classList.add("chosen"); p2.classList.add("faded");
  sfx.pop(); sfx.win(); ctx.burst(...center(p1), 24);
  art.setMood("wow"); ctx.say("excellent choice. acc the only choice tbh", 0);
  await wait(reduced() ? 300 : 1600);

  /* ── 4. terms & conditions ── */
  step.innerHTML = `<div class="tnc card">
    <div class="tape mint" style="top:-12px;left:18px;transform:rotate(-8deg)"></div>
    <div class="tape yellow" style="top:-12px;right:18px;transform:rotate(6deg)"></div>
    <h2>terms &amp; conditions</h2>
    <p class="tnc-sub">please read carefully (or don't, icl nobody does)</p>
    <ol class="fine">
      <li>Player 1 ("u") agrees to have fun. This is not optional. If it gets boring we play skyjo for 18 hours instead.</li>
      <li>Hints may be purchased with kisses. Kisses are collected at the end. Kyle is keeping count.</li>
      <li>If Player 1 loses a round, that's a skill issue. If Kyle loses a round, it's acc rigged.</li>
      <li>All kisses are non-refundable, non-transferable, and must be delivered in person.</li>
      <li>Pip is a flower and cannot be held legally responsible for anything.</li>
      <li>By pressing start, Player 1 accepts she is stuck with Kyle forever, unfortunately. Current term: 217 more years (subject to going up).</li>
    </ol>
    <label class="check"><input type="checkbox" class="agree"><span class="box">${tick()}</span><span>I agree to give at least <b>1 kiss</b> per correct answer</span></label>
    <label class="check"><input type="checkbox" class="news" checked><span class="box">${tick()}</span><span>Send me Kyle's newsletter (daily, in person, mostly about food lah)</span></label>
    <button class="btn start">start ♥</button>
  </div>`;
  ctx.say("before we start, my lawyer says u have to sign this", 0);
  const agree = step.querySelector(".agree"), news = step.querySelector(".news"), start = step.querySelector(".start");
  agree.onchange = () => {
    sfx.pop(agree.checked ? 1.2 : 0.8);
    if (agree.checked) { art.setMood("love"); ctx.say("legally binding!! pip is a notary btw ✍️", 3500); ctx.burst(...center(agree.parentElement), 10); }
    else { art.setMood("sad"); ctx.say("…u un-agreed. to kisses. pip is shaken 😭", 3500); }
  };
  let newsTries = 0;
  news.onchange = () => {
    if (news.checked) return;
    sfx.nope();
    setTimeout(() => { news.checked = true; sfx.pop(); }, 450);
    art.setMood("smug");
    ctx.say(["ah that one's mandatory sorry, house rules", "it's checked again. weird. must be the wind 🤣", "u can't unsubscribe from kyle, it's in clause 7", "clause 7 doesn't exist but u still can't"][newsTries++ % 4], 3500);
  };
  await new Promise((res) => {
    start.onclick = () => {
      if (!agree.checked) {
        sfx.nope(); start.classList.remove("shake"); void start.offsetWidth; start.classList.add("shake");
        art.setMood("sad"); ctx.say("ah ah ah 🙅 u have to agree to the kiss clause first", 3500);
        const l = agree.parentElement; l.classList.remove("flash"); void l.offsetWidth; l.classList.add("flash");
        return;
      }
      res();
    };
  });
  ctx.state.agreedToTerms = true;
  sfx.whoosh();
  ctx.burst(...center(start), 30);
  art.setMood("wow");
  ctx.say("let's gooo ♥", 1500);
  await wait(reduced() ? 100 : 900);
}

/* ── helpers ── */
function statRow([label, v, txt]) {
  const over = v > 10;
  return `<li class="stat${over ? " over" : ""}"><span class="s-label">${esc(label)}</span><span class="s-bar"><i style="--v:${Math.min(v, 10) / 10}"></i>${over ? '<i class="overflow"></i>' : ""}</span><span class="s-val">${esc(txt)}</span></li>`;
}
const tick = () => `<svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true"><path d="M5 16 L12 23 L26 5" pathLength="1" fill="none" stroke="#e0728f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function postmark() {
  return `<svg viewBox="0 0 150 70" width="130" height="60" aria-hidden="true" fill="none" stroke="#3b2f2f" stroke-width="1.6" opacity=".55">
    <circle cx="35" cy="35" r="27"/><circle cx="35" cy="35" r="21" stroke-dasharray="2 3"/>
    <text x="35" y="31" text-anchor="middle" font-family="Caveat" font-size="11" fill="#3b2f2f" stroke="none">KL ✈ BATH ✈ ♥</text>
    <text x="35" y="45" text-anchor="middle" font-family="Caveat" font-size="12" fill="#3b2f2f" stroke="none">♥ ${new Date().getFullYear()} ♥</text>
    <path d="M66 22 q10 -6 20 0 t20 0 t20 0 t20 0 M66 35 q10 -6 20 0 t20 0 t20 0 t20 0 M66 48 q10 -6 20 0 t20 0 t20 0 t20 0"/></svg>`;
}
function countUp(el, target, ms, done) {
  if (!ms) { el.textContent = target.toLocaleString(); done(); return; }
  const t0 = performance.now();
  const f = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString();
    if (k < 1) requestAnimationFrame(f); else done();
  };
  requestAnimationFrame(f);
}
function click(btn, sfx) {
  return new Promise((res) => btn.addEventListener("click", () => { sfx.pop(); res(); }, { once: true }));
}
/** cute stickers scattered on the desk; she can peel & move them */
function scatterStickers(desk, art, sfx) {
  const spots = [
    [4, 8, -12, () => art.peony(110, { color: 0 })], [86, 6, 14, () => art.lily(100, { color: "pink" })],
    [2, 70, 8, () => art.lily(90, { color: "white" })], [84, 74, -10, () => art.peony(120, { color: 1 })],
    [18, 40, 20, () => art.heart(44)], [78, 42, -18, () => art.heart(36, "#f2a7b8")],
    [46, 3, 4, () => art.washi(130, "pink", "hearts")], [12, 88, -6, () => art.stamp("cuti-cuti ♥", 76)],
    [64, 88, 10, () => art.peony(70, { color: 2 })], [92, 34, 24, () => art.sparkle(30)], [30, 92, 0, () => art.leaf(48)],
    [70, 18, -8, () => art.sparkle(22, "#f2a7b8")],
  ];
  const small = innerWidth < 600;
  spots.forEach(([x, y, rot, mk], i) => {
    if (small && i % 3 === 2) return;
    const el = document.createElement("div");
    el.className = "desk-sticker sticker";
    el.innerHTML = mk();
    el.style.cssText = `left:${x}%;top:${y}%;--r:${rot}deg;--d:${i * 70}ms`;
    if (small) el.style.scale = ".7";
    desk.appendChild(el);
    drag(el, sfx);
  });
}
function drag(el, sfx) {
  let sx, sy, ox = 0, oy = 0, id = null;
  el.addEventListener("pointerdown", (e) => {
    id = e.pointerId; el.setPointerCapture(id); sx = e.clientX - ox; sy = e.clientY - oy;
    el.classList.add("peeled"); sfx.pick();
  });
  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    ox = e.clientX - sx; oy = e.clientY - sy;
    el.style.translate = `${ox}px ${oy}px`;
  });
  const up = (e) => { if (e.pointerId !== id) return; id = null; el.classList.remove("peeled"); sfx.pop(0.9); };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
}
