// Photobooth: geo points → arcade tickets → insert the token → curtain opens → 4-shot strip.
// Output: ctx.state.photos = [{ type: "strip", src }, { type: "polaroid", src }] (JPEG dataURLs) → the finale envelope.
import { isMuted } from "./sfx.js";
// ✏️ Kyle: prices, prompts and captions live right here.
const PRICE = 50;               // tickets needed to use the booth
const PTS_PER_TICKET = 250;     // 5000 pts/round → 20 tickets
const POSE_FIRST = "first one: ur biggest smile 😁";
const POSE_LAST = "last one… kiss the camera 😙😙😙";
const POSES = [
  "ur 'skill issue' face 😤",
  "pretend u just beat me at skyjo 🏆",
  "ur 'I wouldn't go that far' face 🤨",
  "act like ur 11:59 for an 11:30 🏃‍♀️",
  "chongqing hotpot spice face 🌶️",
  "show me ur 'go book an nhs appointment' face",
  "ur best 'aiyo' face",
  "look like u just guessed bath first try 🏠",
  "act nonchalant (u can't) 😏",
];
const POLA_CAPTION = "my favourite pumpkin";

const SHOTS = 4;
const FW = 640, FH = 480;       // raw frame size (4:3, same crop as the preview window)
const FILTERS = [
  { id: "film", label: "warm film", css: "sepia(.28) saturate(1.25) contrast(1.06) brightness(1.04)", sw: "linear-gradient(135deg,#f6d36b,#e98c7b)" },
  { id: "bw", label: "b&w", css: "grayscale(1) contrast(1.2) brightness(1.05)", sw: "linear-gradient(135deg,#eee,#555)" },
  { id: "pink", label: "pink", css: "saturate(1.1) brightness(1.04)", sw: "linear-gradient(135deg,#fde0e6,#e0728f)" },
  { id: "plain", label: "au naturel", css: "none", sw: "linear-gradient(135deg,#a9cfe6,#8fb38a)" },
];
const BORDERS = [
  { id: "cream", label: "cream", c: "#fbf5ea" },
  { id: "kraft", label: "kraft", c: "#d9bf98" },
  { id: "blush", label: "blush", c: "#fde0e6" },
];
const INK = "#3b2f2f";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const center = (el) => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
const touchy = () => matchMedia("(pointer: coarse)").matches;
const mkCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const once = (el, ev = "click") => new Promise((r) => el.addEventListener(ev, r, { once: true }));

export async function run(root, ctx) {
  const S = { stream: null, gen: 0, alive: true, filter: "film", border: "cream", frames: [], polaIdx: 0, stickers: [], source: "camera", art: ctx.art, config: ctx.config };
  root.classList.add("pb", "scroll-scene");
  root.addEventListener("pointerdown", () => au(), { capture: true });
  try {
    await unlockView(root, ctx);
    let first = true;
    for (;;) {
      const B = boothView(root, ctx, S, first);
      if (first) { await B.insertCoin(); first = false; } else B.light();
      const got = await getFrames(B, ctx, S);
      if (got === "skip") { await storeSkip(ctx); return; }
      await B.print();
      if ((await resultsView(root, ctx, S)) === "keep") return;
    }
  } finally {
    S.alive = false;
    stopCam(S);
  }
}

/* ───────────────────────── 1 · tickets ───────────────────────── */
async function unlockView(root, ctx) {
  const { art, sfx } = ctx;
  const q = new URLSearchParams(location.search).get("pbscore");
  let scores = (ctx.state.roundScores || []).map((s) => Math.max(0, Math.min(5000, Math.round(+s || 0))));
  const demo = !scores.length;
  if (demo) scores = q === "low" ? [820, 0, 1460, 230, 390] : [4120, 2877, 4950, 1203, 3550];
  const tix = scores.map((s) => Math.round(s / PTS_PER_TICKET));
  const total = tix.reduce((a, b) => a + b, 0);

  root.innerHTML = `<div class="pb-desk" aria-hidden="true">${deskStickers(art)}</div>
  <div class="pb-view pb-unlockview"><div class="pb-unlock card">
    <div class="tape" style="top:-13px;left:calc(50% - 55px);transform:rotate(-2deg)"></div>
    <div class="pb-u-flower f1 sticker">${art.peony(78, { seed: 61, color: 0 })}</div>
    <div class="pb-u-flower f2 sticker">${art.lily(70, { seed: 62, color: "pink" })}</div>
    <h2 class="pb-u-title"><span class="t-a">cashing in ur points…</span><span class="t-b">u did ittt!!</span></h2>
    <p class="pb-u-sub"><span class="t-a">every geo point = arcade tickets 🎟</span><span class="t-b">ur officially rich enough for the <span class="hl">photobooth machine</span> 📸</span></p>
    <ul class="pb-rounds">${scores.map((s, i) => `<li><span>round ${i + 1}</span><i></i><b>${s.toLocaleString()} pts</b><em>+${tix[i]} 🎟</em></li>`).join("")}</ul>
    <div class="pb-disp">
      <div class="pb-disp-head"><span class="pb-disp-mouth"></span><span class="pb-disp-label">TICKETS</span></div>
      <div class="pb-counter"><span class="pb-cnt">0</span><small>🎟</small></div>
    </div>
    <div class="pb-pile"></div>
    <div class="pb-meter"><div class="pb-meter-bar"><i></i></div><span>booth price: <b>${PRICE} 🎟</b></span></div>
    <p class="pb-u-note"></p>
    <div class="pb-u-stamp">UNLOCKED</div>
    <button class="btn pb-u-go" hidden>to the booth →</button>
    ${demo ? `<p class="pb-demo">(practice numbers, u haven't played geo yet)</p>` : ""}
  </div></div>`;
  const card = root.querySelector(".pb-unlock");
  const cnt = card.querySelector(".pb-cnt"), pile = card.querySelector(".pb-pile"), bar = card.querySelector(".pb-meter-bar i");
  const note = card.querySelector(".pb-u-note");
  const rm = reduced();
  let shown = 0;
  const setCount = (n) => { shown = n; cnt.textContent = n; bar.style.transform = `scaleX(${Math.min(1, n / PRICE)})`; };

  art.setMood("wow");
  ctx.say(ctx.pick(["ok so every geo point = arcade tickets<br>let's see how rich u are 🤑", "cha-ching time. pip is the cashier today 🧾<br>no refunds"]), 0);
  await wait(rm ? 200 : 900);

  const spill = async (n, from, kind = "admit") => {
    const vis = rm ? Math.min(n, 2) : Math.min(n, 9);
    const step = rm ? 0 : Math.max(55, Math.min(110, 700 / Math.max(1, vis)));
    for (let k = 0; k < vis; k++) {
      dropTicket(pile, kind);
      snd.tick();
      setCount(Math.round(from + ((k + 1) / vis) * n));
      if (step) await wait(step);
    }
    setCount(from + n);
  };
  const rows = card.querySelectorAll(".pb-rounds li");
  let acc = 0;
  for (let i = 0; i < tix.length; i++) {
    rows[i].classList.add("on");
    await wait(rm ? 60 : 260);
    if (tix[i] > 0) await spill(tix[i], acc); else { sfx.nope(); }
    acc += tix[i];
    await wait(rm ? 40 : 200);
  }
  sfx.pop(1.2);

  if (total >= PRICE) {
    const spare = total - PRICE;
    note.innerHTML = spare ? `✓ that's enough!! <b>+${spare}</b> spare 🎟 (redeemable for 1 teh tarik, ask kyle)` : `✓ exactly ${PRICE}. down to the last ticket. acc iconic`;
    note.classList.add("on");
    art.setMood("love");
    ctx.say(total >= 80 ? "ur lowk a photobooth millionaire 💅" : "look at u go, ballin' 💸", 0);
  } else {
    note.innerHTML = `hmm… that's <b>${PRICE - total}</b> 🎟 short`;
    note.classList.add("on");
    sfx.sad();
    art.setMood("sad");
    ctx.say("oh<br>ohhh<br>hold on…", 0);
    await wait(rm ? 400 : 1700);
    note.innerHTML = `…<b>kyle topped up the rest</b> 💸 <small>(he has a tab here 😏)</small>`;
    note.classList.add("topup");
    await spill(PRICE - total, total, "iou");
    art.setMood("smug");
    ctx.say("kyle says don't worry about it 😌<br>(he also said skill issue 🤣)", 0);
  }
  await wait(rm ? 100 : 500);
  card.classList.add("done");
  const stamp = card.querySelector(".pb-u-stamp");
  sfx.crack(); sfx.win();
  ctx.burst(...center(stamp), 24);
  const go = card.querySelector(".pb-u-go");
  go.hidden = false;
  await once(go);
  sfx.pop();
  ctx.say("");
}

function dropTicket(pile, kind) {
  const w = pile.clientWidth, h = pile.clientHeight;
  const t = document.createElement("div");
  t.className = "pb-tix " + kind;
  const colors = kind === "iou" ? ["#d9c6ef", "#cbb6ea"] : ["#f6d36b", "#f2a7b8", "#a8d6be", "#f9cdc3"];
  t.innerHTML = ticketSVG(colors[Math.floor(Math.random() * colors.length)], kind === "iou" ? "IOU ♡" : "ADMIT ♡");
  const x = 6 + Math.random() * (w - 70), y = h - 34 - Math.random() * Math.min(46, h * 0.5);
  t.style.cssText = `--sx:${w / 2 - 32}px;--x:${x}px;--y:${y}px;--r:${Math.round((Math.random() - 0.5) * 70)}deg;--r0:${Math.round((Math.random() - 0.5) * 300)}deg`;
  pile.appendChild(t);
  if (pile.children.length > 60) pile.firstElementChild.remove();
}
const ticketSVG = (c, label) => `<svg viewBox="0 0 64 34" width="64" height="34" aria-hidden="true"><path d="M6 3 H58 Q58 9 62 9 V25 Q58 25 58 31 H6 Q6 25 2 25 V9 Q6 9 6 3Z" fill="${c}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M16 6 V28" stroke="${INK}" stroke-width="1.4" stroke-dasharray="2 2.5"/><text x="38" y="21.5" text-anchor="middle" font-family="Patrick Hand, cursive" font-size="12" fill="${INK}">${label}</text></svg>`;

function deskStickers(art) {
  const spots = [
    [3, 10, -12, art.peony(96, { seed: 71, color: 0 })], [88, 8, 12, art.lily(84, { seed: 72, color: "white" })],
    [5, 78, 9, art.lily(80, { seed: 73, color: "pink" })], [86, 76, -10, art.peony(100, { seed: 74, color: 1 })],
    [16, 44, 18, art.heart(36, "#f2a7b8", { seed: 75 })], [80, 44, -16, art.sparkle(28)],
    [12, 58, -24, art.washi(110, "mint", "dots", { seed: 76 })], [66, 90, 8, art.stamp("cheese!", 70, { seed: 77, flower: "peony" })],
  ];
  return spots.map(([x, y, r, s], i) => `<div class="pb-ds sticker${i % 3 === 2 ? " opt" : ""}" style="left:${x}%;top:${y}%;--r:${r}deg;--d:${i * 70}ms">${s}</div>`).join("");
}

/* ───────────────────────── 2 · the booth ───────────────────────── */
const coinSVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="#f6d36b" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="50" r="45" fill="url(#art-hatch)" opacity=".18"/><circle cx="50" cy="50" r="35" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 5" opacity=".55"/><path d="M50 70 C30 56 28 44 34 38 S47 34 50 42 C53 34 60 32 66 38 S70 56 50 70Z" fill="#e0728f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M24 34 q7 -12 20 -15" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/></svg>`;

function boothView(root, ctx, S, locked) {
  const { art, sfx } = ctx;
  root.innerHTML = `<div class="pb-desk" aria-hidden="true">${deskStickers(art)}</div>
  <div class="pb-view pb-boothview">
    <div class="pb-stagewrap">
      <div class="pb-booth${locked ? " locked" : ""}">
        <div class="pb-sign">
          <div class="pb-bulbs">${"<i></i>".repeat(11)}</div>
          <b>photo<span>♡</span>booth</b>
          <div class="pb-bulbs">${"<i></i>".repeat(11)}</div>
          <div class="pb-sign-flower sticker">${art.peony(64, { seed: 81, color: 0 })}</div>
          <div class="pb-sign-star sticker">${art.sparkle(30)}</div>
        </div>
        <div class="pb-body">
          <div class="pb-frame">
            <div class="pb-window">
              <video playsinline muted autoplay></video>
              <div class="pb-tint"></div>
              <div class="pb-wmsg"></div>
              <div class="pb-cap"></div>
              <div class="pb-shotno"></div>
              <div class="pb-count"></div>
              <div class="pb-curtain l"></div><div class="pb-curtain r"></div>
              <div class="pb-valance"></div>
              ${locked ? `<div class="pb-lock"><span class="pb-lock-str"></span><div class="pb-lock-tag">🔒 <b>${PRICE} 🎟</b><small>pay up cutie</small></div></div>` : ""}
            </div>
          </div>
          <div class="pb-row">
            <div class="pb-filters" role="group" aria-label="filter">${FILTERS.map((f, i) => `<button class="pb-chip${f.id === S.filter ? " on" : ""}" data-f="${f.id}" style="--r:${[-3, 2, -1, 3][i]}deg"><i style="background:${f.sw}"></i>${f.label}</button>`).join("")}</div>
            <div class="pb-thumbs">${"<i></i>".repeat(SHOTS)}</div>
          </div>
          <div class="pb-panel">
            <div class="pb-coinbox"><span class="pb-slit"></span><small>insert<br>♡ coin</small></div>
            <button class="btn pb-shoot" disabled>📸 take photos</button>
          </div>
          <div class="pb-outslot"><span class="pb-slit wide"></span><small>photos come out here ↓</small><div class="pb-out"><img draggable="false" alt="your photo strip"></div></div>
          <div class="pb-side-lily sticker">${art.lily(70, { seed: 82, color: "white" })}</div>
          <div class="pb-side-heart sticker">${art.heart(34, "#e0728f", { seed: 83 })}</div>
        </div>
        <div class="pb-feet"><i></i><i></i></div>
      </div>
      ${locked ? `<div class="pb-wallet">
        <div class="pb-coin" role="button" tabindex="0" aria-label="booth token: drag it into the coin slot, or tap it">${coinSVG}</div>
        <p>ur booth token<br><small>(traded for ${PRICE} 🎟)</small><br><b class="pb-arrow"><span class="m">drag it up into the slot ↑</span><span class="d">← drop it in the slot</span></b></p>
      </div>` : ""}
    </div>
    <button class="pb-skip" hidden>camera shy? skip the booth →</button>
  </div>`;
  root.scrollTop = 0;
  const $ = (s) => root.querySelector(s);
  const booth = $(".pb-booth"), win = $(".pb-window"), video = $("video"), tint = $(".pb-tint");
  const wmsg = $(".pb-wmsg"), cap = $(".pb-cap"), count = $(".pb-count"), shotno = $(".pb-shotno");
  const shootBtn = $(".pb-shoot"), skipBtn = $(".pb-skip");
  const thumbs = root.querySelectorAll(".pb-thumbs i");
  const applyFilter = () => {
    const f = FILTERS.find((x) => x.id === S.filter);
    video.style.filter = f.css;
    tint.style.opacity = S.filter === "pink" ? 1 : 0;
  };
  applyFilter();
  root.querySelectorAll(".pb-filters .pb-chip").forEach((b) => (b.onclick = () => {
    S.filter = b.dataset.f;
    root.querySelectorAll(".pb-filters .pb-chip").forEach((x) => x.classList.toggle("on", x === b));
    applyFilter(); sfx.pop(1.1);
  }));
  const skipP = new Promise((r) => (skipBtn.onclick = () => { sfx.pop(0.8); r("skip"); }));

  const B = {
    video, skipP,
    light() { booth.classList.remove("locked"); booth.classList.add("lit"); skipBtn.hidden = false; },
    async insertCoin() {
      const coin = $(".pb-coin"), slot = $(".pb-coinbox");
      art.setMood("smug");
      ctx.say(touchy() ? "🔒 locked lol. pip swapped ur tickets for a token<br>drag it into the coin slot (or just tap it)" : "🔒 locked lol. pip swapped ur tickets for a token<br>drag it into the coin slot (or just click it)", 0);
      await new Promise((res) => {
        let id = null, sx = 0, sy = 0, moved = false, ox = 0, oy = 0;
        const inSlot = () => {
          const a = coin.getBoundingClientRect(), b = slot.getBoundingClientRect();
          const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
          return cx > b.left - 40 && cx < b.right + 40 && cy > b.top - 40 && cy < b.bottom + 40;
        };
        const done = () => { coin.onpointerdown = coin.onpointermove = coin.onpointerup = coin.onpointercancel = coin.onkeydown = null; res(); };
        coin.onpointerdown = (e) => { id = e.pointerId; coin.setPointerCapture(id); sx = e.clientX - ox; sy = e.clientY - oy; moved = false; coin.classList.add("held"); sfx.pick(); };
        coin.onpointermove = (e) => {
          if (e.pointerId !== id) return;
          ox = e.clientX - sx; oy = e.clientY - sy;
          if (Math.hypot(ox, oy) > 6) moved = true;
          coin.style.translate = `${ox}px ${oy}px`;
          slot.classList.toggle("hot", inSlot());
        };
        coin.onpointerup = coin.onpointercancel = (e) => {
          if (e.pointerId !== id) return;
          id = null; coin.classList.remove("held");
          if (!moved || inSlot()) return done();
          sfx.nope(); ox = oy = 0; coin.style.translate = ""; slot.classList.remove("hot");
          ctx.say(ctx.pick(["closerrr… the little slot on the machine 👉", "into the slot!! the dark one that says 'insert ♡ coin'"]), 3000);
        };
        coin.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); done(); } };
      });
      // fly into the slot
      const a = coin.getBoundingClientRect(), b = $(".pb-slit").getBoundingClientRect();
      const tx = b.left + b.width / 2 - (a.left + a.width / 2), ty = b.top + b.height / 2 - (a.top + a.height / 2);
      const [cx0, cy0] = [parseFloat(coin.style.translate) || 0, parseFloat((coin.style.translate || "0 0").split(" ")[1]) || 0];
      coin.style.translate = "";
      const ms = reduced() ? 10 : 520;
      await coin.animate([
        { transform: `translate(${cx0}px,${cy0}px) scale(1) rotateY(0)` },
        { transform: `translate(${cx0 + (tx - cx0) * 0.85}px,${cy0 + (ty - cy0) * 0.85 - 30}px) scale(.62) rotateY(0)`, offset: 0.6 },
        { transform: `translate(${tx}px,${ty - 8}px) scale(.5) rotateY(80deg)`, offset: 0.85 },
        { transform: `translate(${tx}px,${ty + 6}px) scale(.45) rotateY(88deg)`, opacity: 0 },
      ], { duration: ms, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
      snd.clink();
      $(".pb-coinbox").classList.remove("hot"); $(".pb-coinbox").classList.add("fed");
      $(".pb-wallet").classList.add("gone");
      await wait(reduced() ? 100 : 380);
      const lock = $(".pb-lock");
      lock.classList.add("drop");
      this.light();
      sfx.win();
      ctx.burst(...center(booth.querySelector(".pb-sign")), 22);
      art.setMood("wow");
      ctx.say("ding ding ding!! ✨ booth is open for business", 0);
      await wait(reduced() ? 150 : 700);
      lock.remove();
    },
    async open() {
      if (booth.classList.contains("open")) return;
      sfx.whoosh();
      booth.classList.add("open");
      await wait(reduced() ? 50 : 900);
    },
    async close() { booth.classList.remove("open"); sfx.whoosh(); await wait(reduced() ? 50 : 800); },
    msg(t) { wmsg.innerHTML = t ? `<div>${t}</div>` : ""; wmsg.classList.toggle("on", !!t); },
    async attach(stream) {
      video.srcObject = stream;
      try { await video.play(); } catch {}
      const t0 = performance.now();
      while (!video.videoWidth && performance.now() - t0 < 6000) await wait(80);
      win.classList.toggle("live", !!video.videoWidth);
      return !!video.videoWidth;
    },
    detach() { video.srcObject = null; win.classList.remove("live"); },
    waitShoot() {
      shootBtn.disabled = false;
      return Promise.race([once(shootBtn).then(() => "shoot"), skipP]).finally(() => (shootBtn.disabled = true));
    },
    shooting(on) {
      booth.classList.toggle("shooting", on);
      skipBtn.hidden = on;
      if (on) thumbs.forEach((t) => { t.style.backgroundImage = ""; t.classList.remove("got"); });
    },
    caption(t) { cap.textContent = t || ""; cap.classList.toggle("on", !!t); },
    shotNo(i) { shotno.textContent = i ? `${i}/${SHOTS}` : ""; },
    async countdown() {
      for (const n of [3, 2, 1]) {
        count.textContent = n; count.classList.remove("pop"); void count.offsetWidth; count.classList.add("pop");
        snd.beep(n);
        await wait(760);
      }
      count.textContent = ""; count.classList.remove("pop");
    },
    flash() {
      const f = document.createElement("div");
      f.className = "pb-flash" + (reduced() ? " soft" : "");
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 700);
      snd.shutter();
    },
    thumb(i, c) {
      const t = thumbs[i];
      const small = mkCanvas(96, 72); small.getContext("2d").drawImage(filtered(c, S.filter), 0, 0, 96, 72);
      t.style.backgroundImage = `url(${small.toDataURL("image/jpeg", 0.7)})`;
      t.classList.add("got");
    },
    async fallback(reason) {
      const why = {
        denied: "the camera said no (fair tbh). if that was an accident, tap the 🔒 / ⓘ next to the web address → allow camera, then try again",
        insecure: "browsers only share the camera on a secure <b>https://</b> link and this one isn't 😭 u can still upload a pic!",
        unsupported: "this browser doesn't do cameras sadly 😭 u can still upload a pic!",
        nocam: "pip looked everywhere but couldn't find a camera on this device 🙈 u can still upload a pic!",
        busy: "the camera's busy in another app or tab. close that one and try again?",
        other: "the camera got shy and wouldn't turn on (relatable). try again or upload a pic?",
      }[reason] || "the camera got shy and wouldn't turn on (relatable). try again or upload a pic?";
      const note = document.createElement("div");
      note.className = "pb-note card";
      const t = touchy();
      note.innerHTML = `<div class="tape mint" style="top:-12px;left:20px;transform:rotate(-7deg)"></div>
        <div class="tape yellow" style="top:-12px;right:20px;transform:rotate(6deg)"></div>
        <h3>pip can't see u 🙈</h3>
        <p class="pb-why">${why}</p>
        <div class="pb-note-btns">
          <button class="btn alt pb-retry">try again ↻</button>
          <label class="btn pb-upl">${t ? "📷 snap one" : "🖼 upload a photo"}<input type="file" accept="image/*" ${t ? 'capture="user"' : "multiple"}></label>
          ${t ? `<label class="btn alt pb-upl">🖼 from gallery<input type="file" accept="image/*" multiple></label>` : ""}
        </div>
        <button class="pb-skiplink">skip, just tuck in our puzzle pic →</button>`;
      $(".pb-body").appendChild(note);
      skipBtn.hidden = true;
      art.setMood("sad");
      ctx.say("pip can't see u 😭 but we can still make a strip!!", 5000);
      const choice = await new Promise((res) => {
        note.querySelector(".pb-retry").onclick = () => res("retry");
        note.querySelector(".pb-skiplink").onclick = () => res("skip");
        skipP.then(res);
        note.querySelectorAll("input[type=file]").forEach((inp) => (inp.onchange = async () => {
          const files = [...inp.files].filter((f) => /^image\//.test(f.type) || /\.(heic|jpe?g|png|webp|gif)$/i.test(f.name)).slice(0, SHOTS);
          if (!files.length) return;
          const imgs = (await Promise.all(files.map(loadFile))).filter(Boolean);
          if (imgs.length) res({ images: imgs });
          else { sfx.nope(); ctx.say("hmm pip couldn't open that one. try a jpg or png?", 3500); }
        }));
      });
      sfx.pop();
      note.remove();
      skipBtn.hidden = false;
      return choice;
    },
    async print() {
      ctx.say("");
      skipBtn.hidden = true;
      await this.close();
      booth.classList.add("printing");
      art.setMood("wow");
      ctx.say(ctx.pick(["ooh it's printinggg ✨ don't touch, it's developing!", "bzzzt… printing… pip is very professional rn"]), 0);
      const strip = await renderStrip(S, { stickers: false });
      const img = root.querySelector(".pb-out img");
      img.src = strip.toDataURL("image/jpeg", 0.9);
      await img.decode().catch(() => {});
      snd.whirr(reduced() ? 0.6 : 2.4);
      const out = root.querySelector(".pb-out");
      out.classList.add("go");
      setTimeout(() => out.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "nearest" }), 300);
      await wait(reduced() ? 600 : 3600);
      booth.classList.remove("printing");
      sfx.pop(1.3);
    },
  };
  return B;
}

async function getFrames(B, ctx, S) {
  const { art, sfx } = ctx;
  for (;;) {
    B.msg("pip is asking to borrow ur camera… 👀<br><small>tap <b>allow</b>!</small>");
    const camP = startCam(S);
    await B.open();
    const cam = await Promise.race([camP, B.skipP.then(() => ({ skip: true }))]);
    if (cam.skip) { stopCam(S); return "skip"; }
    let choice;
    if (cam.ok && (await B.attach(S.stream))) {
      B.msg("");
      art.setMood("love");
      ctx.say(ctx.pick(["there u are!! 🥹 pick a filter, then hit <b>take photos</b>", "hi cutie patootie 😙 pick a filter &amp; press <b>take photos</b> when ur ready"]), 6000);
      if ((await B.waitShoot()) === "skip") { stopCam(S); return "skip"; }
      if (await shoot(B, ctx, S)) { stopCam(S); B.detach(); S.source = "camera"; return "shot"; }
      stopCam(S); B.detach();
      choice = await B.fallback("other");
    } else {
      stopCam(S); B.msg("");
      choice = await B.fallback(cam.reason || "other");
    }
    if (choice === "skip") return "skip";
    if (choice === "retry") continue;
    S.frames = framesFromImages(choice.images);
    S.source = "upload";
    sfx.win();
    return "shot";
  }
}

async function shoot(B, ctx, S) {
  const { art, sfx } = ctx;
  const pool = [...POSES].sort(() => Math.random() - 0.5);
  const prompts = [POSE_FIRST, pool[0], pool[1], POSE_LAST];
  const moods = ["happy", "smug", "wow", "love"];
  S.frames = [];
  B.shooting(true);
  B.video.closest(".pb-stagewrap").scrollIntoView({ block: "start", behavior: "auto" });
  for (let i = 0; i < SHOTS; i++) {
    art.setMood(moods[i]);
    ctx.say(prompts[i], 0);
    B.caption(prompts[i]);
    B.shotNo(i + 1);
    await wait(i ? 1500 : 1100);
    await B.countdown();
    const f = grabVideo(B.video);
    if (!f) { B.shooting(false); B.caption(""); B.shotNo(0); return false; }
    S.frames.push(f);
    B.flash();
    B.thumb(i, f);
    if (i === SHOTS - 1) setTimeout(() => sfx.kiss(), 250);
    await wait(700);
  }
  B.caption(""); B.shotNo(0);
  B.shooting(false);
  return true;
}

/* ───────────────────────── camera ───────────────────────── */
async function startCam(S) {
  stopCam(S);
  const gen = S.gen;
  if (!window.isSecureContext) return { ok: false, reason: "insecure" };
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { ok: false, reason: "unsupported" };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    if (gen !== S.gen || !S.alive) { stream.getTracks().forEach((t) => t.stop()); return { ok: false, reason: "stale" }; }
    S.stream = stream;
    return { ok: true };
  } catch (e) {
    const n = e && e.name;
    const reason = n === "NotAllowedError" || n === "SecurityError" || n === "PermissionDeniedError" ? "denied"
      : n === "NotFoundError" || n === "OverconstrainedError" || n === "DevicesNotFoundError" ? "nocam"
      : n === "NotReadableError" || n === "AbortError" || n === "TrackStartError" ? "busy" : "other";
    return { ok: false, reason };
  }
}
function stopCam(S) {
  S.gen++;
  if (S.stream) { S.stream.getTracks().forEach((t) => t.stop()); S.stream = null; }
}

function grabVideo(video) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return null;
  const c = mkCanvas(FW, FH), g = c.getContext("2d");
  const s = Math.max(FW / vw, FH / vh), w = vw * s, h = vh * s;
  g.translate(FW, 0); g.scale(-1, 1); // mirrored, like the preview
  g.drawImage(video, (FW - w) / 2, (FH - h) / 2, w, h);
  return c;
}
function loadFile(file) {
  return new Promise((res) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
/** uploaded photos → 4 frames. One photo gets four slightly different crops, like a real strip. */
function framesFromImages(imgs) {
  const crops = [[1, 0.5, 0.5], [1.18, 0.42, 0.45], [1.32, 0.58, 0.4], [1.08, 0.5, 0.55]];
  return Array.from({ length: SHOTS }, (_, i) => {
    const img = imgs[i % imgs.length];
    const [z, fx, fy] = imgs.length > 1 ? [1, 0.5, 0.5] : crops[i];
    const c = mkCanvas(FW, FH), g = c.getContext("2d");
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(FW / iw, FH / ih) * z, w = iw * s, h = ih * s;
    g.drawImage(img, (FW - w) * fx, (FH - h) * fy, w, h);
    return c;
  });
}

/* ───────────────────────── pixels ───────────────────────── */
const filterCache = new WeakMap();
function filtered(src, id) {
  if (id === "plain") return src;
  let m = filterCache.get(src);
  if (!m) filterCache.set(src, (m = {}));
  if (m[id]) return m[id];
  const c = mkCanvas(src.width, src.height), g = c.getContext("2d");
  g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let i = 0; i < p.length; i += 4) {
    let r = p[i], gg = p[i + 1], b = p[i + 2];
    const n = (Math.random() - 0.5) * 16;
    if (id === "film") {
      r = (r * 1.06 + 14 - 128) * 1.05 + 128; gg = (gg * 1.0 + 6 - 128) * 1.05 + 128; b = (b * 0.84 + 10 - 128) * 1.05 + 128;
      r = Math.max(r, 22) + n; gg = Math.max(gg, 16) + n; b = Math.max(b, 14) + n;
    } else if (id === "bw") {
      let l = 0.3 * r + 0.59 * gg + 0.11 * b;
      l = (l - 128) * 1.22 + 132 + n * 1.2;
      r = l + 5; gg = l + 1; b = l - 5;
    } else if (id === "pink") {
      r = r * 0.8 + 242 * 0.2 + 10; gg = gg * 0.8 + 167 * 0.2 + 2; b = b * 0.8 + 184 * 0.2 + 6;
      r += n * 0.5; gg += n * 0.5; b += n * 0.5;
    }
    p[i] = cl(r); p[i + 1] = cl(gg); p[i + 2] = cl(b);
  }
  g.putImageData(d, 0, 0);
  if (id === "film" || id === "bw") {
    const v = g.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.35, c.width / 2, c.height / 2, c.width * 0.68);
    v.addColorStop(0, "rgba(40,25,20,0)"); v.addColorStop(1, "rgba(40,25,20,.38)");
    g.fillStyle = v; g.fillRect(0, 0, c.width, c.height);
  }
  if (id === "pink") {
    g.fillStyle = "rgba(255,240,245,.08)"; g.fillRect(0, 0, c.width, c.height);
  }
  return (m[id] = c);
}

/* ───────────────────────── composing ───────────────────────── */
const imgCache = new Map();
/** an art.js SVG string → <img> at px size (shared hatch/washi <defs> are inlined so patterns survive) */
function svgImage(str, px) {
  const key = px + "|" + str;
  if (imgCache.has(key)) return imgCache.get(key);
  const defs = (document.getElementById("art-defs") || {}).innerHTML || "";
  let s = str.replace(/\swidth="[\d.]+"/, ` width="${px}"`).replace(/\sheight="[\d.]+"/, ` height="${Math.round(px * aspect(str))}"`);
  s = s.replace(/<svg([^>]*)>/, `<svg$1>${defs}`);
  if (!/xmlns=/.test(s)) s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const p = new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  });
  imgCache.set(key, p);
  return p;
}
function aspect(str) {
  const m = str.match(/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/);
  return m ? +m[2] / +m[1] : 1;
}
/** draw an SVG doodle like a die-cut sticker: white outline + soft shadow */
async function drawSticker(g, str, cx, cy, w, rot = 0, outline = true) {
  const img = await svgImage(str, Math.round(w * 2));
  if (!img) return;
  const h = w * aspect(str);
  g.save();
  g.translate(cx, cy); g.rotate((rot * Math.PI) / 180);
  if (outline) {
    const o = Math.max(2, w * 0.035), pad = Math.ceil(o * 2 + 6);
    const sc = mkCanvas(Math.ceil(w + pad * 2), Math.ceil(h + pad * 2)), sg = sc.getContext("2d");
    for (let a = 0; a < 16; a++) sg.drawImage(img, pad + Math.cos((a / 16) * Math.PI * 2) * o, pad + Math.sin((a / 16) * Math.PI * 2) * o, w, h);
    sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#fff"; sg.fillRect(0, 0, sc.width, sc.height);
    g.shadowColor = "rgba(59,47,47,.25)"; g.shadowBlur = w * 0.05; g.shadowOffsetX = w * 0.02; g.shadowOffsetY = w * 0.035;
    g.drawImage(sc, -w / 2 - pad, -h / 2 - pad);
    g.shadowColor = "transparent";
  }
  g.drawImage(img, -w / 2, -h / 2, w, h);
  g.restore();
}
function paper(g, w, h, color) {
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  const kraft = color === "#d9bf98";
  for (let i = 0; i < (w * h) / 90; i++) {
    g.fillStyle = Math.random() < 0.5 ? "rgba(59,47,47,.05)" : "rgba(255,255,255,.12)";
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
  if (kraft) {
    g.strokeStyle = "rgba(90,60,30,.12)"; g.lineWidth = 1;
    for (let i = 0; i < (w * h) / 900; i++) {
      const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI, l = 4 + Math.random() * 10;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }
}
/** a pen line around a rectangle that wobbles a little (drawn twice like a sketch) */
function wobblyRect(g, x, y, w, h, color = INK, lw = 2.2) {
  const pts = [];
  const side = (x0, y0, x1, y1) => { const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 60)); for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]); };
  side(x, y, x + w, y); side(x + w, y, x + w, y + h); side(x + w, y + h, x, y + h); side(x, y + h, x, y);
  g.strokeStyle = color; g.lineJoin = "round"; g.lineCap = "round";
  for (let pass = 0; pass < 2; pass++) {
    g.globalAlpha = pass ? 0.35 : 0.9; g.lineWidth = pass ? lw * 0.6 : lw;
    g.beginPath();
    const j = () => (Math.random() - 0.5) * (pass ? 2.6 : 1.6);
    pts.forEach(([px, py], i) => (i ? g.lineTo(px + j(), py + j()) : g.moveTo(px + j(), py + j())));
    g.closePath(); g.stroke();
  }
  g.globalAlpha = 1;
}
function fitFont(g, text, weight, maxPx, family, maxW) {
  let px = maxPx;
  do { g.font = `${weight} ${px}px ${family}`; px -= 2; } while (g.measureText(text).width > maxW && px > 12);
}
function annivDate(config) {
  const since = new Date((config.togetherSince || "2025-11-09") + "T00:00:00");
  if (isNaN(since)) return "09.11.2026";
  const yrs = Math.max(1, Math.round((Date.now() - since) / (365.25 * 864e5)));
  const d = new Date(since); d.setFullYear(since.getFullYear() + yrs);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
async function fonts() {
  try { await Promise.all(["700 48px Caveat", "500 30px Caveat", "18px 'Patrick Hand'"].map((f) => document.fonts.load(f))); } catch {}
}

async function renderStrip(S, { stickers = true } = {}) {
  await fonts();
  const art = S.art, config = S.config;
  const W = 480, M = 30, FWs = W - 2 * M, FHs = Math.round((FWs * 3) / 4), GAP = 16, FOOT = 206;
  const H = M + SHOTS * FHs + (SHOTS - 1) * GAP + FOOT;
  const c = mkCanvas(W, H), g = c.getContext("2d");
  const border = BORDERS.find((b) => b.id === S.border) || BORDERS[0];
  paper(g, W, H, border.c);
  S.frames.forEach((f, i) => {
    const y = M + i * (FHs + GAP);
    g.drawImage(filtered(f, S.filter), M, y, FWs, FHs);
    wobblyRect(g, M, y, FWs, FHs);
  });
  // tiny doodles in the margins
  const hy = M + FHs + GAP / 2;
  await drawSticker(g, art.heart(40, "#e0728f", { seed: 91 }), M - 4, hy, 22, -14, false);
  await drawSticker(g, art.sparkle(24), W - M + 3, M + 2 * (FHs + GAP) - GAP / 2, 20, 0, false);
  await drawSticker(g, art.heart(40, "#f2a7b8", { seed: 92 }), W - M + 2, M + 3 * (FHs + GAP) - GAP / 2, 18, 12, false);
  // footer
  const y0 = M + SHOTS * FHs + (SHOTS - 1) * GAP;
  const ink = INK, soft = border.id === "kraft" ? "#5c4740" : "#7a6460";
  g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "alphabetic";
  const name = `${config.hisName} ♡ ${config.herName}`;
  g.save(); g.translate(W / 2, y0 + 72); g.rotate(-0.025);
  fitFont(g, name, 700, 54, "Caveat, cursive", W - 50);
  g.fillText(name, 0, 0); g.restore();
  // squiggle underline
  g.strokeStyle = "#e0728f"; g.lineWidth = 3.2; g.lineCap = "round"; g.beginPath();
  for (let x = 120; x <= W - 120; x += 6) { const yy = y0 + 86 + Math.sin(x / 9) * 3; x === 120 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
  g.stroke();
  g.fillStyle = soft; g.font = "500 34px Caveat, cursive";
  g.fillText(annivDate(config), W / 2, y0 + 134);
  g.font = "17px 'Patrick Hand', cursive"; g.fillStyle = soft;
  g.fillText("✿ first anniversary edition ✿", W / 2, y0 + 172);
  await drawSticker(g, art.peony(100, { seed: 93, color: 0 }), 62, y0 + 128, 92, -10);
  await drawSticker(g, art.lily(100, { seed: 94, color: "pink" }), W - 60, y0 + 130, 86, 12);
  if (stickers) for (const s of S.stickers) await drawSticker(g, s.svg, s.x * W, s.y * H, s.s * W, s.rot);
  return c;
}
async function renderPolaroid(S, src, { caption = POLA_CAPTION, sub = null, cover = false } = {}) {
  await fonts();
  const art = S.art, config = S.config;
  const W = 540, P = 32, PH = W - 2 * P, H = P + PH + 150;
  const c = mkCanvas(W, H), g = c.getContext("2d");
  paper(g, W, H, "#fffdf8");
  // square crop of the source
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2, sy = cover ? (sh - side) * 0.4 : (sh - side) / 2;
  g.drawImage(src, sx, sy, side, side, P, P, PH, PH);
  g.strokeStyle = "rgba(59,47,47,.25)"; g.lineWidth = 1.5; g.strokeRect(P, P, PH, PH);
  g.fillStyle = INK; g.textAlign = "center";
  g.save(); g.translate(W / 2 - 22, P + PH + 76); g.rotate(-0.03);
  fitFont(g, caption, 700, 50, "Caveat, cursive", W - 140);
  const tw = g.measureText(caption).width;
  g.fillText(caption, 0, 0); g.restore();
  g.font = "500 26px Caveat, cursive"; g.fillStyle = "#7a6460"; g.textAlign = "right";
  g.fillText(sub || annivDate(config), W - P - 4, P + PH + 126);
  await drawSticker(g, art.heart(40, "#e0728f", { seed: 95 }), W / 2 - 22 + tw / 2 + 30, P + PH + 58, 40, 14, false);
  return c;
}
const jpg = (c, q = 0.85) => c.toDataURL("image/jpeg", q);

async function storeSkip(ctx) {
  const S = { art: ctx.art, config: ctx.config };
  ctx.art.setMood("love");
  ctx.say("no worries!! pip will tuck in this one instead 💌", 0);
  try {
    const img = new Image();
    img.src = ctx.config.puzzle.photo;
    await img.decode();
    const c = await renderPolaroid(S, img, { caption: "us ♡", sub: ctx.config.puzzle.caption || annivDate(ctx.config), cover: true });
    ctx.state.photos = [{ type: "polaroid", src: jpg(c) }];
  } catch (e) {
    console.warn("photobooth: couldn't load the puzzle photo", e);
    ctx.state.photos = [];
  }
  await wait(reduced() ? 300 : 1400);
}

/* ───────────────────────── 3 · results ───────────────────────── */
const STICKERS = [
  ["peony", (a) => a.peony(120, { seed: 101, color: 0 }), 0.3],
  ["peony2", (a) => a.peony(120, { seed: 102, color: 1 }), 0.26],
  ["lily", (a) => a.lily(120, { seed: 103, color: "pink" }), 0.3],
  ["lily2", (a) => a.lily(120, { seed: 104, color: "white" }), 0.28],
  ["heart", (a) => a.heart(80, "#e0728f", { seed: 105 }), 0.18],
  ["crown", (a) => a.crown(90), 0.24],
  ["sparkle", (a) => a.sparkle(60), 0.14],
  ["pip", (a) => a.mascot(110, "love"), 0.28],
];

const STK_LABEL = { peony: "peony", peony2: "second peony", lily: "pink lily", lily2: "white lily", heart: "heart", crown: "crown", sparkle: "sparkle", pip: "pip" };

async function resultsView(root, ctx, S) {
  const { art, sfx, config } = ctx;
  S.art = art; S.config = config;
  S.stickers = []; S.polaIdx = 0;
  const her = esc(config.herName);
  const tray = STICKERS.map(([k, mk]) => ({ k, svg: mk(art) }));
  root.innerHTML = `<div class="pb-desk" aria-hidden="true">${deskStickers(art)}</div>
  <div class="pb-view pb-results">
    <h2 class="pb-r-title">look at my cutie pumpkin <span>🥹</span></h2>
    <div class="pb-r-grid">
      <div class="pb-r-strip">
        <div class="tape" style="top:-12px;left:calc(50% - 45px);width:90px;transform:rotate(-4deg)"></div>
        <div class="pb-strip-box"><img class="pb-strip" draggable="false" alt="your photobooth strip"><div class="pb-stk-layer"></div></div>
      </div>
      <div class="pb-r-pola">
        <div class="tape yellow" style="top:-10px;right:18%;width:80px;transform:rotate(8deg)"></div>
        <img class="pb-pola developing" draggable="false" alt="your polaroid">
        <p class="pb-r-hint">shake it! (tap)</p>
        <div class="pb-pick" role="group" aria-label="pick the polaroid photo"><span>polaroid pic:</span>${S.frames.map((_, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="use photo ${i + 1}"></button>`).join("")}</div>
      </div>
      <div class="pb-r-tools card">
        <div class="tape mint" style="top:-11px;left:24px;transform:rotate(-5deg)"></div>
        <h3>filter</h3>
        <div class="pb-r-filters">${FILTERS.map((f, i) => `<button class="pb-chip${f.id === S.filter ? " on" : ""}" data-f="${f.id}" style="--r:${[-3, 2, -1, 3][i]}deg"><i style="background:${f.sw}"></i>${f.label}</button>`).join("")}</div>
        <h3>border</h3>
        <div class="pb-r-borders">${BORDERS.map((b, i) => `<button class="pb-chip${b.id === S.border ? " on" : ""}" data-b="${b.id}" style="--r:${[2, -2, 1][i]}deg"><i style="background:${b.c}"></i>${b.label}</button>`).join("")}</div>
        <h3>stickers <small>tap to stick · drag to move · drag off to peel</small></h3>
        <div class="pb-tray">${tray.map((t, i) => `<button class="pb-tray-item sticker" data-i="${i}" aria-label="add ${STK_LABEL[t.k] || t.k} sticker" style="--r:${[-8, 6, -4, 9, -6, 5, -3, 7][i]}deg">${t.svg}</button>`).join("")}</div>
      </div>
      <div class="pb-r-actions">
        <button class="btn alt pb-retake">↻ retake</button>
        <button class="btn alt pb-dl">⤓ save a copy</button>
        <button class="btn pb-keep">keep it ♡</button>
      </div>
    </div>
  </div>`;
  root.scrollTop = 0;
  const $ = (s) => root.querySelector(s);
  const stripImg = $(".pb-strip"), polaImg = $(".pb-pola"), layer = $(".pb-stk-layer");
  const redrawStrip = async () => { const c = await renderStrip(S, { stickers: false }); stripImg.src = c.toDataURL("image/jpeg", 0.9); };
  const redrawPola = async (develop) => {
    const c = await renderPolaroid(S, filtered(S.frames[S.polaIdx], S.filter));
    polaImg.src = c.toDataURL("image/jpeg", 0.9);
    if (develop) { polaImg.classList.remove("developing"); void polaImg.offsetWidth; polaImg.classList.add("developing"); }
  };
  await Promise.all([redrawStrip(), redrawPola(false)]);
  const picks = root.querySelectorAll(".pb-pick button");
  picks.forEach((b, i) => { b.style.backgroundImage = `url(${filteredThumb(S, i)})`; });

  art.setMood("love");
  ctx.say(ctx.pick([`omg framing this (pip is not crying, ur crying)<br>add some stickers if u want!`, `${her} ur unreal 😙<br>but kyle says not sincere enough… needs more stickers ✨`]), 6000);

  // polaroid: tap to shake
  polaImg.onclick = () => { polaImg.classList.remove("shook"); void polaImg.offsetWidth; polaImg.classList.add("shook", "dev-fast"); sfx.crinkle(); sfx.crinkle(); };
  picks.forEach((b) => (b.onclick = async () => {
    S.polaIdx = +b.dataset.i; picks.forEach((x) => x.classList.toggle("on", x === b)); sfx.pop(1.1);
    polaImg.classList.remove("dev-fast");
    await redrawPola(true);
  }));
  root.querySelectorAll(".pb-r-filters .pb-chip").forEach((b) => (b.onclick = async () => {
    S.filter = b.dataset.f; root.querySelectorAll(".pb-r-filters .pb-chip").forEach((x) => x.classList.toggle("on", x === b)); sfx.pop(1.1);
    await Promise.all([redrawStrip(), redrawPola(false)]);
    picks.forEach((p, i) => (p.style.backgroundImage = `url(${filteredThumb(S, i)})`));
  }));
  root.querySelectorAll(".pb-r-borders .pb-chip").forEach((b) => (b.onclick = async () => {
    S.border = b.dataset.b; root.querySelectorAll(".pb-r-borders .pb-chip").forEach((x) => x.classList.toggle("on", x === b)); sfx.pop(1.1);
    await redrawStrip();
  }));

  // stickers on the strip
  const addSticker = (t, x, y) => {
    const [, , size] = STICKERS.find(([k]) => k === t.k);
    const s = { k: t.k, svg: t.svg, x, y, s: size, rot: Math.round((Math.random() - 0.5) * 36) };
    S.stickers.push(s);
    const el = document.createElement("div");
    el.className = "pb-stk sticker";
    el.innerHTML = t.svg;
    const place = () => { el.style.left = s.x * 100 + "%"; el.style.top = s.y * 100 + "%"; el.style.width = s.s * 100 + "%"; el.style.setProperty("--r", s.rot + "deg"); };
    place();
    layer.appendChild(el);
    let id = null, gx = 0, gy = 0;
    el.addEventListener("pointerdown", (e) => {
      id = e.pointerId; el.setPointerCapture(id);
      const r = layer.getBoundingClientRect();
      gx = e.clientX - (r.left + s.x * r.width); gy = e.clientY - (r.top + s.y * r.height);
      el.classList.add("peeled"); layer.appendChild(el); sfx.pick();
      S.stickers.push(S.stickers.splice(S.stickers.indexOf(s), 1)[0]); // bring to front
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerId !== id) return;
      const r = layer.getBoundingClientRect();
      s.x = (e.clientX - gx - r.left) / r.width; s.y = (e.clientY - gy - r.top) / r.height;
      place();
      el.classList.toggle("off", s.x < -0.12 || s.x > 1.12 || s.y < -0.03 || s.y > 1.03);
    });
    const up = (e) => {
      if (e.pointerId !== id) return;
      id = null; el.classList.remove("peeled");
      if (el.classList.contains("off")) {
        S.stickers.splice(S.stickers.indexOf(s), 1);
        el.classList.add("bye"); sfx.tear(); setTimeout(() => el.remove(), 300);
      } else sfx.pop(0.9);
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    sfx.pop(1.2);
  };
  root.querySelectorAll(".pb-tray-item").forEach((b) => (b.onclick = () => {
    const t = tray[+b.dataset.i];
    const n = S.stickers.length;
    const frame = n % SHOTS, side = n % 2 ? 0.8 : 0.2;
    addSticker(t, side + (Math.random() - 0.5) * 0.12, 0.03 + (frame + 0.25 + Math.random() * 0.5) * 0.2);
    if (n === 0) { art.setMood("wow"); ctx.say("cuteee!! drag it wherever. drag it off the strip to peel it off", 3500); }
  }));

  const bake = async () => {
    const strip = await renderStrip(S, { stickers: true });
    const pola = await renderPolaroid(S, filtered(S.frames[S.polaIdx], S.filter));
    return { strip: jpg(strip), pola: jpg(pola) };
  };
  $(".pb-dl").onclick = async () => {
    sfx.pop();
    const { strip } = await bake();
    const a = document.createElement("a");
    a.href = strip; a.download = `${config.hisName}-${config.herName}-photobooth.jpg`.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
    document.body.appendChild(a); a.click(); a.remove();
    art.setMood("happy"); ctx.say("saved!! one for ur camera roll, one for the envelope 📥", 3000);
  };
  return new Promise((res) => {
    $(".pb-retake").onclick = () => { sfx.pop(0.9); art.setMood("wow"); ctx.say("again!! again!! 🤣", 1500); res("retake"); };
    $(".pb-keep").onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true;
      const { strip, pola } = await bake();
      ctx.state.photos = [{ type: "strip", src: strip }, { type: "polaroid", src: pola }];
      sfx.win(); ctx.burst(...center(btn), 30);
      $(".pb-results").classList.add("kept");
      art.setMood("love");
      ctx.say("tucked away somewhere safe… u'll see 😏", 0);
      await wait(reduced() ? 400 : 1800);
      res("keep");
    };
  });
}
function filteredThumb(S, i) {
  const c = mkCanvas(80, 60); c.getContext("2d").drawImage(filtered(S.frames[i], S.filter), 0, 0, 80, 60);
  return c.toDataURL("image/jpeg", 0.7);
}

/* ───────────────────────── sounds (own tiny synth; respects the mute sticker) ───────────────────────── */
let AC = null, NB = null;
function au() {
  if (isMuted()) return null;
  if (!AC && navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C(); AC.o = AC.createGain(); AC.o.gain.value = 0.5; AC.o.connect(AC.destination);
    }
    if (AC.state === "suspended") AC.resume().catch(() => {});
    return AC.state === "closed" ? null : AC;
  } catch { return null; }
}
function tn(f, { t = 0, dur = 0.15, type = "sine", vol = 0.2, to = null } = {}) {
  const a = au(); if (!a) return;
  const now = a.currentTime + t, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, now);
  if (to) o.frequency.exponentialRampToValueAtTime(to, now + dur);
  g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(a.o); o.start(now); o.stop(now + dur + 0.05);
}
function nz({ t = 0, dur = 0.05, vol = 0.2, type = "highpass", f = 2000, q = 0.7 } = {}) {
  const a = au(); if (!a) return;
  if (!NB) { NB = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const now = a.currentTime + t, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = NB; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(fl); fl.connect(g); g.connect(a.o); s.start(now, Math.random() * 0.5); s.stop(now + dur + 0.05);
}
const snd = {
  /** coin: metallic clink, a bounce, then a thunk inside the machine */
  clink() {
    [2637, 3951, 5588].forEach((f, i) => tn(f, { dur: 0.4 - i * 0.1, vol: 0.13 - i * 0.03 }));
    [2690, 4230].forEach((f) => tn(f, { t: 0.12, dur: 0.22, vol: 0.06 }));
    tn(150, { t: 0.3, dur: 0.14, vol: 0.2, to: 70 });
    nz({ t: 0.3, dur: 0.1, vol: 0.08, type: "bandpass", f: 900, q: 1 });
  },
  shutter() {
    nz({ dur: 0.03, vol: 0.4, f: 2800 });
    tn(1400, { dur: 0.02, vol: 0.08, type: "square" });
    nz({ t: 0.08, dur: 0.05, vol: 0.28, type: "bandpass", f: 1700, q: 1.2 });
    tn(320, { t: 0.085, dur: 0.06, vol: 0.1, type: "triangle", to: 120 });
  },
  beep(n) { tn(n === 1 ? 1319 : 988, { dur: 0.14, vol: 0.12, type: "triangle" }); },
  tick() { tn(1800 + Math.random() * 500, { dur: 0.03, vol: 0.05, type: "square" }); nz({ dur: 0.02, vol: 0.05, f: 4000 }); },
  whirr(d = 2.4) {
    const a = au(); if (!a) return;
    const now = a.currentTime, o = a.createOscillator(), fl = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
    o.type = "sawtooth"; o.frequency.value = 82; fl.type = "lowpass"; fl.frequency.value = 520;
    l.frequency.value = 11; lg.gain.value = 0.025; l.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.06, now + 0.12); g.gain.setValueAtTime(0.06, now + d - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(fl); fl.connect(g); g.connect(a.o); o.start(now); l.start(now); o.stop(now + d + 0.05); l.stop(now + d + 0.05);
  },
};
