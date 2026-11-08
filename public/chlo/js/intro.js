// Intro: sealed envelope → cover page with days counter → terms & conditions → start ♥

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
             <div class="env-stamp sticker">${art.stamp("MY ♥", 78, { seed: 21, flower: "peony" })}</div>
             <div class="env-postmark">${postmark()}</div>
             <div class="env-tape">${art.washi(90, "mint", "dots", { seed: 3 })}</div>`,
      inner: `<div class="peek">${art.peony(56, { seed: 4 })}${art.lily(50, { seed: 5 })}</div>`,
    })}
    <p class="env-hint">tap the wax seal</p>
  </div>`;
  const env = step.querySelector(".envelope");
  const seal = env.querySelector(".env-seal");
  ctx.say("a letter came for you", 0);
  const nudge = setTimeout(() => { art.setMood("smug"); ctx.say("try the wax seal", 0); }, 7000);
  env.addEventListener("click", (e) => {
    if (e.target.closest(".env-seal") || env.classList.contains("opening")) return;
    sfx.nope(); env.classList.remove("shake"); void env.offsetWidth; env.classList.add("shake");
    ctx.say(ctx.pick(["not there, the seal", "the pink circle in the middle"]), 3000);
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

  /* ── 2. the cover: {her} + days together ── */
  const since = new Date(config.togetherSince + "T00:00:00");
  const days = Math.max(0, Math.floor((Date.now() - since.getTime()) / 864e5));
  step.innerHTML = `<div class="cover card">
    <div class="tape" style="top:-14px;left:calc(50% - 55px);transform:rotate(-3deg)"></div>
    <div class="cover-flower f1 sticker">${art.peony(92, { seed: 11, color: 0 })}</div>
    <div class="cover-flower f2 sticker">${art.lily(84, { seed: 12, color: "pink" })}</div>
    <div class="cover-flower f3 sticker">${art.peony(60, { seed: 13, color: 1 })}</div>
    <h1 class="cover-name">${her}</h1>
    <div class="cover-squiggle">${art.squiggle(240, undefined, { seed: 2 })}</div>
    <div class="days"><span class="days-num">0</span><span class="days-word">days together</span></div>
    <button class="btn next">let's go →</button>
  </div>`;
  const num = step.querySelector(".days-num");
  countUp(num, days, reduced() ? 0 : 1600, () => { sfx.pop(1.3); ctx.burst(...center(num), 10); });
  await wait(500);
  art.setMood("love");
  ctx.say(`hi, i'm <b>${art.MASCOT_NAME}</b>. i'll be your guide today`, 0);
  await click(step.querySelector(".next"), sfx);

  /* ── 3. terms & conditions ── */
  step.innerHTML = `<div class="tnc card">
    <div class="tape mint" style="top:-12px;left:18px;transform:rotate(-8deg)"></div>
    <div class="tape yellow" style="top:-12px;right:18px;transform:rotate(6deg)"></div>
    <h2>terms &amp; conditions</h2>
    <p class="tnc-sub">nobody reads these anyway</p>
    <ol class="fine">
      <li>You agree to have fun.</li>
      <li>Hints cost kisses. ${him} is keeping count.</li>
      <li>If you lose a round, skill issue. If ${him} loses, it was rigged.</li>
      <li>Kisses are non-refundable and paid in person.</li>
      <li>Pip is a flower and can't be held responsible for anything.</li>
      <li>You're stuck with ${him}. No end date.</li>
    </ol>
    <label class="check"><input type="checkbox" class="agree"><span class="box">${tick()}</span><span>I agree to <b>1 kiss</b> per correct answer</span></label>
    <label class="check"><input type="checkbox" class="news" checked><span class="box">${tick()}</span><span>Subscribe to ${him}'s newsletter</span></label>
    <button class="btn start">start ♥</button>
  </div>`;
  ctx.say("sign this first", 0);
  const agree = step.querySelector(".agree"), news = step.querySelector(".news"), start = step.querySelector(".start");
  agree.onchange = () => {
    sfx.pop(agree.checked ? 1.2 : 0.8);
    if (agree.checked) { art.setMood("love"); ctx.say("legally binding", 3500); ctx.burst(...center(agree.parentElement), 10); }
    else { art.setMood("sad"); ctx.say("you can't un-agree to kisses", 3500); }
  };
  let newsTries = 0;
  news.onchange = () => {
    if (news.checked) return;
    sfx.nope();
    setTimeout(() => { news.checked = true; sfx.pop(); }, 450);
    art.setMood("smug");
    ctx.say(["sorry, that one's mandatory", "it's checked again. weird", "you can't unsubscribe, see clause 7", "there is no clause 7. still no"][newsTries++ % 4], 3500);
  };
  await new Promise((res) => {
    start.onclick = () => {
      if (!agree.checked) {
        sfx.nope(); start.classList.remove("shake"); void start.offsetWidth; start.classList.add("shake");
        art.setMood("sad"); ctx.say("you have to agree to the kiss one first", 3500);
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
  ctx.say("let's go ♥", 1500);
  await wait(reduced() ? 100 : 900);
}

/* ── helpers ── */
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
