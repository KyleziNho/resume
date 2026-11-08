// Finale: envelope (photobooth pics + a greeting card with the letter) → results bouquet → kiss coupons → anniversary + petal shower.
const COUPONS = [
  "one (1) kiss. anytime, anywhere, even mid-sentence",
  "one (1) kiss + u pick dinner (no 'what do u want' / 'U')",
  "one (1) skyjo game where i don't say it's rigged",
  "one (1) kiss + i don't complain when 11:30 means 11:59",
  "one (1) spoon. biggest spoon. best feeling in the world",
  "one (1) hotpot date (i'll pretend the spice is fine)",
  "one (1) airport-arrivals kiss, big run-up included",
  "one (1) kiss + i carry all the bags",
];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const W = (ms) => wait(reduced() ? Math.min(ms, 60) : ms);
const fmtTime = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const center = (el) => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
const smooth = () => (reduced() ? "auto" : "smooth");
/** tap or Enter/Space on an element → resolves once */
const tapOnce = (el) => new Promise((res) => {
  const go = (e) => { if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return; e.preventDefault?.(); el.removeEventListener("click", go); el.removeEventListener("keydown", go); res(); };
  el.addEventListener("click", go); el.addEventListener("keydown", go);
});

export async function run(root, ctx) {
  const { art, sfx, config, state } = ctx;
  const demo = !state.roundScores || !state.roundScores.length;
  const nRounds = Math.max(config.rounds?.length || 0, state.roundScores?.length || 0) || 5;
  const scores = demo ? [4210, 2980, 4870, 1650, 5000]
    : Array.from({ length: nRounds }, (_, i) => Math.max(0, Math.min(5000, Math.round(state.roundScores[i] || 0))));
  const puzzleMs = state.puzzleTimeMs || (demo ? 192000 : 0);
  const kisses = Math.max(1, demo && !state.kissesOwed ? 3 : state.kissesOwed || 0);
  const her = esc(config.herName), him = esc(config.hisName);
  const label = String(config.anniversaryLabel || "Happy Anniversary");
  const photos = (Array.isArray(state.photos) ? state.photos : []).filter((p) => p && typeof p.src === "string" && p.src);
  const boothPolaroid = photos.find((p) => p.type === "polaroid");
  root.classList.add("finale", "scroll-scene");
  const page = (html, cls = "") => { root.innerHTML = `<div class="fin-page ${cls}">${html}</div>`; root.scrollTop = 0; return root.firstElementChild; };
  const next = (btn) => new Promise((res) => btn.addEventListener("click", () => { sfx.pop(); res(); }, { once: true }));

  /* ── (a) the envelope: photobooth pics + a card with the letter ── */
  const keeps = photos.length ? photos.map((p) => ({ ...p, type: p.type === "strip" ? "strip" : "polaroid" }))
    : [{ type: "polaroid", src: String(config.puzzle?.photo || ""), fallback: true }];
  const firstStrip = keeps.find((k) => k.type === "strip"), firstPol = keeps.find((k) => k.type === "polaroid");
  const peek = `<div class="mail-peek" aria-hidden="true">
      ${firstStrip ? `<img class="pk-strip" src="${esc(firstStrip.src)}" alt="">` : ""}
      ${firstPol ? `<div class="pk-pol${firstPol.fallback ? " framed" : ""}"><img src="${esc(firstPol.src)}" alt=""></div>` : ""}
      <div class="pk-card">${art.peony(40, { seed: 21, color: 0 })}</div>
    </div>`;
  const anniv = annivDate(config.togetherSince);
  const words = label.split(" ");
  const greet = words.length > 1 ? `<span>${esc(words[0])}</span><b>${esc(words.slice(1).join(" "))}</b>` : `<b>${esc(label)}</b>`;
  const capFor = (k, i) => k.fallback ? esc(config.puzzle?.caption || "us ♥")
    : k.type === "strip" ? ctx.pick(["exhibit A: us being cute (mostly u)", "4 frames of pure chaos 🤣", "evidence (v incriminating)"])
    : ctx.pick(["fridge-worthy", "a keeper. like u", "my cutie patootie ♥"]);
  const TAPES = [["mint", "dots"], ["pink", "stripes"], ["yellow", "grid"], ["sky", "hearts"], ["lilac", "dots"]];
  const p0 = page(`
    <h2 class="fin-title small mail-title">you've got mail</h2>
    <div class="mail-env">${art.envelope({ seed: 8, sealLabel: "break the seal", inner: peek,
      face: `<div class="env-to">for <span>${her}</span></div><div class="env-addr">from: ${him} 🥒 · courier: pip</div><div class="env-stamp sticker">${art.stamp("1 year", 78, { seed: 44, flower: "lily" })}</div>` })}</div>
    <p class="env-hint">tap the wax seal</p>
    <div class="spread" hidden>
      ${keeps.map((k, i) => {
        const [c, pat] = TAPES[i % TAPES.length];
        return `<figure class="keep keep-${k.type}${k.fallback ? " polaroid fallback" : ""}" data-k="${i}" style="--r:${[-5, 4, -2, 6, -4][i % 5]}deg" role="button" tabindex="0" aria-label="${k.type === "strip" ? "photo strip" : "polaroid"}: tap to look closer" hidden>
          <span class="keep-tape" style="--tr:${i % 2 ? 8 : -7}deg">${art.washi(96, c, pat, { seed: 60 + i })}</span>
          <img src="${esc(k.src)}" alt="${k.type === "strip" ? "our photobooth strip" : "our polaroid"}" draggable="false">
          <figcaption>${capFor(k, i)}</figcaption>
        </figure>`;
      }).join("")}
      <div class="card-slot" hidden>
        <div class="fcard" role="button" tabindex="0" aria-label="open the card">
          <div class="fc-inside">
            <div class="letter-text" aria-live="off"></div>
            <div class="sign" hidden><span>love u sm,</span><b>${him} 🥒</b>${art.heart(34, "#e0728f", { seed: 9 })}</div>
            <div class="ps-note" hidden>p.s. i have a problem. i love u too much 😙</div>
          </div>
          <div class="fc-front">
            <div class="fc-face fc-cover">
              <div class="fc-art">${art.cardPosy(200, { seed: 17 })}</div>
              <h3 class="fc-greet">${greet}</h3>
              <p class="fc-for">for ${her}</p>
            </div>
            <div class="fc-face fc-back">
              <div class="fc-pressed sticker">${art.lily(86, { seed: 51, color: "white" })}</div>
              <p class="fc-date">${anniv}</p>
              <p class="fc-one">one whole year<br>of my pumpkin ${art.heart(26, "#e0728f", { seed: 12 })}</p>
              <p class="fc-pip">(pip was not allowed to read the inside. it's v soppy)</p>
              <div class="fc-mini sticker">${art.peony(54, { seed: 33, color: 2 })}</div>
            </div>
          </div>
        </div>
        <p class="card-hint">tap the card to open it</p>
      </div>
    </div>
    <p class="skip-hint" hidden>(tap the card to skip ahead)</p>
    <button class="btn next" hidden>wait there's more →</button>
    <div class="lightbox" hidden role="dialog" aria-modal="true" aria-label="photo">
      <div class="lb-in"><img alt=""><div class="lb-btns"><button class="btn save">save 💾</button><button class="btn alt close">close ✕</button></div><p class="lb-note"></p></div>
    </div>`, "pg-mail");
  ctx.say(ctx.pick([
    `psst. ${him} left this with pip for "my cutie pumpkin". pip guarded it w his life (and one nap)`,
    `special delivery for ${her}! pip has no arms. pip carried it anyway. respect it 😤`,
  ]), 0);
  const env = p0.querySelector(".envelope");
  const sealHint = p0.querySelector(".env-hint");
  env.addEventListener("click", (e) => {
    if (e.target.closest(".env-seal") || env.classList.contains("opening")) return;
    sfx.nope(); env.classList.remove("shake"); void env.offsetWidth; env.classList.add("shake");
    ctx.say("no not there 🤣 the shiny pink seal 👆", 2000);
  });
  await new Promise((res) => p0.querySelector(".env-seal").addEventListener("click", res, { once: true }));
  ctx.say("");
  sealHint.hidden = true;
  await art.openEnvelope(env);
  await W(500);
  p0.querySelector(".mail-env").classList.add("gone");
  await W(450);
  p0.querySelector(".mail-env").hidden = true;
  p0.querySelector(".mail-title").textContent = photos.length ? "look what was inside 👀" : "a little something";
  const spread = p0.querySelector(".spread");
  spread.hidden = false;

  // photos come out one by one
  const lbEl = p0.querySelector(".lightbox");
  document.body.appendChild(lbEl);   // outside the (transformed) scene so position:fixed means the viewport
  const lightbox = setupLightbox(lbEl, sfx, config, () => ctx.say(""));
  const keepEls = [...spread.querySelectorAll(".keep")];
  keepEls.forEach((el) => {
    const k = keeps[+el.dataset.k];
    const open = () => { sfx.pop(); lightbox.show(k, el.querySelector("img")); };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    const img = el.querySelector("img");
    img.onerror = () => { el.classList.add("no-photo"); img.remove(); };
  });
  for (const el of keepEls) {
    el.hidden = false; sfx.pick();
    await W(520);
  }
  if (photos.some((p) => p.type === "strip")) {
    art.setMood("love");
    ctx.say(ctx.pick(["the photobooth pics made it!! tap one to see it big + save it 💾", "fresh from the booth, still warm. tap one to look closer + save it 💾"]), 0);
  } else {
    ctx.say("a polaroid! tap it to look closer 💾", 0);
  }
  await W(1300);

  // then the card
  const slot = spread.querySelector(".card-slot"), card = slot.querySelector(".fcard");
  slot.hidden = false; sfx.whoosh();
  await W(500);
  slot.scrollIntoView({ behavior: smooth(), block: "nearest" });
  ctx.say(`and a card!! pip didn't read it<br>jk pip read it<br>pip cried 😭`, 0);
  await tapOnce(card);
  ctx.say("");
  sfx.whoosh();
  card.setAttribute("aria-label", "the card from " + config.hisName);
  card.removeAttribute("tabindex");
  spread.classList.add("reading");
  slot.querySelector(".card-hint").hidden = true;
  await new Promise((r) => requestAnimationFrame(r));
  card.classList.add("open");
  await W(250);
  slot.scrollIntoView({ behavior: smooth(), block: "start" });
  await W(1000);
  ctx.burst(...center(card.querySelector(".fc-inside")), 12);
  p0.querySelector(".skip-hint").hidden = false;
  await typeLetter(card.querySelector(".letter-text"), String(config.letter || ""), card, sfx, root);
  p0.querySelector(".skip-hint").hidden = true;
  card.querySelector(".sign").hidden = false;
  sfx.chime(7);
  await W(700);
  card.querySelector(".ps-note").hidden = false;
  const b0 = p0.querySelector(".next"); b0.hidden = false;
  spread.classList.add("read");
  b0.scrollIntoView({ behavior: smooth(), block: "nearest" });
  art.setMood("love");
  ctx.say(photos.length ? `the pics r urs to keep (tap one to save 💾)<br>${him} says that letter wasn't sincere enough. needs more text effects ✨` : `${him} says that letter wasn't sincere enough. it needs more text effects ✨`, 0);
  await next(b0);
  lightbox.close();
  lbEl.remove();

  /* ── (b) results → bouquet (brisk; tap to hurry it along) ── */
  const total = scores.reduce((a, b) => a + b, 0), max = scores.length * 5000;
  const frac = total / max;
  const rank = frac >= 0.85 ? "chlo 13–9 pickle levels 🌏" : frac >= 0.6 ? "frequent flyer ✈️" : frac >= 0.35 ? "lowk getting there 🧭" : "lost but adorable 🐣";
  const kinds = scores.map((s, i) => (s <= 0 ? "bud" : i % 2 ? "lily" : "peony"));
  const scales = scores.map((s) => (s <= 0 ? 1 : 0.6 + 0.55 * (s / 5000)));
  const p = page(`
    <h2 class="fin-title">the results r in!!</h2>
    <div class="results">
      <div class="score-sheet card">
        <div class="tape" style="top:-13px;left:30%;transform:rotate(-4deg)"></div>
        <h3>official score sheet</h3>
        <ul class="lines">
          ${puzzleMs ? `<li class="ln"><span>🧩 jigsaw</span><i></i><b>${fmtTime(puzzleMs)}</b></li>` : ""}
          ${scores.map((s, i) => `<li class="ln"><span>${esc(config.rounds?.[i]?.answer || `round ${i + 1}`)}</span><i></i><b>${s.toLocaleString()}</b></li>`).join("")}
        </ul>
        <div class="total ln"><span>total</span><i></i><b><span class="tot">0</span> / ${max.toLocaleString()}</b></div>
        <div class="rank">rank: <span>${rank}</span></div>
        ${demo ? '<div class="demo-note">(demo scores, play the full game for real ones)</div>' : ""}
      </div>
      <div class="bq-wrap">
        <div class="bq">${art.bouquet(scores.length, 300, { animate: true, kinds, scales, seed: 7 })}</div>
        <div class="bq-tag"><span>for ${her}</span><small>every point = a petal</small></div>
      </div>
    </div>
    <button class="btn next" hidden>ooh what else →</button>`, "pg-results");
  let fast = false;
  p.addEventListener("pointerdown", () => (fast = true), { once: true });
  const F = (ms) => wait(fast || reduced() ? Math.min(ms, 40) : ms);
  ctx.say("every point u scored grew into a flower. watch 👀", 0);
  const lines = [...p.querySelectorAll(".lines .ln")];
  const off = puzzleMs ? 1 : 0;
  await F(450);
  if (puzzleMs) {
    lines[0].classList.add("on"); sfx.pick();
    const m = puzzleMs / 60000;
    ctx.say(m < 2 ? "that jigsaw time is acc suspicious. speedrunner? 🤨" : m < 6 ? `v respectable jigsaw time. ${him} took longer to cut the pieces` : "u took ur time w the jigsaw and that's valid", 0);
    await F(900);
  }
  for (let i = 0; i < scores.length; i++) {
    lines[i + off].classList.add("on");
    p.querySelectorAll(`[data-i="${i}"]`).forEach((el) => el.classList.add("on"));
    await F(320);
    sfx.chime(i + 2);
    const bloom = p.querySelector(`.bq-bloom[data-i="${i}"]`);
    if (bloom && !reduced() && !fast) setTimeout(() => ctx.burst(...center(bloom), Math.round(4 + scores[i] / 700)), 250);
    if (scores[i] === 5000) { art.setMood("wow"); ctx.say("5000?! PERFECT SCORE. IM SOOO PROUD OF U", 1800); }
    else if (scores[i] <= 0) { art.setMood("sad"); ctx.say("that one's a bud. skill issue 🤣 jk it's trying its best 🥺", 1800); }
    await F(420);
  }
  const tot = p.querySelector(".tot");
  p.querySelector(".total").classList.add("on");
  await countUp(tot, total, reduced() || fast ? 0 : 900);
  p.querySelector(".bq-ribbon").classList.add("on");
  p.querySelector(".rank").classList.add("on");
  p.querySelector(".bq-tag").classList.add("on");
  sfx.win(); ctx.burst(...center(p.querySelector(".bq")), 30);
  art.setMood("love");
  ctx.say(`${total.toLocaleString()} points of love, tied w a bow 🎀 pip did the ribbon. pip has no thumbs`, 0);
  const b1 = p.querySelector(".next"); b1.hidden = false;
  await next(b1);

  /* ── (c) kiss coupons ── */
  const p2 = page(`
    <h2 class="fin-title">u earned some <span class="hl">coupons</span></h2>
    <p class="fin-sub">${state.kissesOwed ? `u bought ${state.kissesOwed} hint${state.kissesOwed > 1 ? "s" : ""} w kisses. ${him} has been keeping a v official record 😏` : demo ? "hints bought with kisses get printed here. very official." : "zero hints?! smart AND cute. here's a bonus one anyway 😙"}</p>
    <div class="booklet">
      <div class="stub"><div class="stub-in"><b>KISS<br>COUPONS</b><small>booklet no. 001<br>issued by ${him}</small>${art.heart(30)}</div><div class="staple s1"></div><div class="staple s2"></div></div>
      <div class="stack"></div>
    </div>
    <p class="tear-hint">drag a coupon to tear it off ↗ <small>(or just tap)</small></p>
    <div class="wallet" aria-live="polite"><span class="wallet-label">your stash: <b class="wn">0</b>/${kisses}</span><div class="pile"></div></div>
    <button class="btn next" hidden>keep them safe. next →</button>`, "pg-coupons");
  const stack = p2.querySelector(".stack");
  for (let i = kisses - 1; i >= 0; i--) {
    const c = document.createElement("div");
    c.className = "coupon";
    c.style.setProperty("--k", Math.min(i, 4));
    c.innerHTML = `<div class="c-in"><div class="c-top"><span>ADMIT ONE</span><span>No. ${String(i + 1).padStart(4, "0")}</span></div>
      <div class="c-main">${art.heart(34, "#e0728f", { seed: i + 3 })}<span>good for ${esc(COUPONS[i % COUPONS.length])}</span></div>
      <div class="c-fine">valid forever (ur stuck with me unfortunately) · redeemable on ${him} only</div></div>`;
    c.setAttribute("role", "button"); c.setAttribute("tabindex", i === 0 ? "0" : "-1"); c.setAttribute("aria-label", "tear off coupon");
    stack.appendChild(c);
  }
  ctx.say(kisses > 1 ? `${kisses} kiss coupons. tear them out, they're all urs ✂️` : "one (1) kiss coupon. tear it out, it's urs ✂️", 0);
  let torn = 0;
  const pile = p2.querySelector(".pile"), wn = p2.querySelector(".wn"), b2 = p2.querySelector(".next");
  {
    const arm = () => {
      const c = [...stack.querySelectorAll(".coupon:not(.torn)")].pop();
      if (!c) return;
      c.classList.add("top"); c.tabIndex = 0; c.style.setProperty("--k", 0);
      tearable(c, sfx, () => {
        torn++; wn.textContent = torn;
        const [x, y] = center(c);
        ctx.burst(x, y, 10); sfx.kiss();
        const mini = document.createElement("div");
        mini.className = "mini-coupon"; mini.style.setProperty("--r", `${(Math.random() - 0.5) * 30}deg`);
        mini.innerHTML = art.heart(16);
        pile.appendChild(mini);
        setTimeout(() => c.remove(), 700);
        b2.hidden = false;
        if (torn === kisses) {
          art.setMood("love");
          ctx.say(ctx.pick([`all urs. ${him} has been notified. he's acc thrilled`, "coupons secured. pip recommends redeeming one immediately 😙", "10/10 tearing technique. u slayedddd"]), 0);
          p2.querySelector(".tear-hint").textContent = "all collected ♥";
        } else {
          ctx.say(ctx.pick(["rrrip! so satisfying", "another one!!", "wow a natural", `${kisses - torn} to go`]), 2000);
          setTimeout(arm, 250);
        }
      });
    };
    arm();
  }
  await next(b2);

  /* ── (d) happy anniversary ── */
  let li = 0;
  const letters = label.split(" ").map((w) => `<span class="word">${[...w].map((ch) => `<span class="ch" style="--i:${li++}">${esc(ch)}</span>`).join("")}</span>`).join(" ");
  const endImg = boothPolaroid
    ? `<div class="end-photo booth"><div class="tape" style="top:-14px;left:calc(50% - 55px);transform:rotate(3deg)"></div><img src="${esc(boothPolaroid.src)}" alt="us, in the photobooth"></div>`
    : `<div class="end-photo polaroid"><div class="tape" style="top:-14px;left:calc(50% - 55px);transform:rotate(3deg)"></div><img src="${esc(config.puzzle?.photo || "")}" alt="us"><p>${esc(config.puzzle?.caption || "us ♥")}</p></div>`;
  const p4 = page(`
    ${art.flowerBorder(190, { seed: 3 })}
    <div class="end-center">
      <h1 class="end-title" aria-label="${esc(label)}">${letters}</h1>
      <p class="end-sub">${her} &amp; ${him} · ${new Date().getFullYear()}</p>
      ${endImg}
      <p class="end-more">here's to many more places together<br>and 217 more years, minimum 😙</p>
      <div class="end-btns">
        <button class="btn kiss-btn">send a kiss 💋</button>
        <button class="btn alt again">play again ↺</button>
      </div>
      <p class="kiss-count" hidden></p>
    </div>`, "pg-end");
  p4.querySelector(".end-photo img").onerror = function () { this.parentElement.classList.add("no-photo"); this.remove(); };
  sfx.win();
  ctx.burst(innerWidth / 2, innerHeight * 0.3, 40);
  const stop = art.petalShower(document.getElementById("fx"), { rate: 5 });
  if (typeof confetti === "function" && !reduced()) {
    confetti({ particleCount: 90, spread: 100, origin: { y: 0.35 }, colors: ["#f2a7b8", "#e0728f", "#fff7f0", "#f6d36b", "#8fb38a"], scalar: 0.9 });
  }
  art.setMood("love");
  ctx.say("ok NOW it's sincere enough. text effects ✓ confetti ✓ pip crying ✗ (it's dew)", 0);
  p4.addEventListener("pointerdown", (e) => { if (!e.target.closest("button")) { ctx.burst(e.clientX, e.clientY, 8); sfx.chime(Math.floor(Math.random() * 10)); } });
  let sent = 0;
  const kc = p4.querySelector(".kiss-count");
  const kissLines = ["kiss delivered ✓", "another one?! ok ok 😙", `${him} just got a jump scare. his heart is racing`, "the kiss tank is now full", `${him} says he has a problem. he loves u too much`, "I", "LOVE", "YOU", "SO", "MUCH", `I love you sooo much ${her} ❤️❤️❤️`];
  p4.querySelector(".kiss-btn").onclick = (e) => {
    sent++; sfx.kiss(); ctx.burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 14);
    kc.hidden = false; kc.textContent = `kisses sent: ${sent}`;
    art.setMood(sent % 3 ? "love" : "wow");
    ctx.say(kissLines[Math.min(sent - 1, kissLines.length - 1)], 2500);
  };
  await new Promise((res) => (p4.querySelector(".again").onclick = res));
  stop();
  sfx.whoosh();
  location.href = location.pathname;
  await wait(2000);
}

/* ── helpers ── */
/** "9 · 11 · 2026": the first anniversary of config.togetherSince (falls back to today) */
function annivDate(since) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(since || ""));
  const d = m ? new Date(+m[1] + 1, +m[2] - 1, +m[3]) : new Date();
  return `${d.getDate()} · ${d.getMonth() + 1} · ${d.getFullYear()}`;
}

/** enlarged photo + save. On phones with the share sheet, "save" hands over a real file (→ "Save Image"). */
function setupLightbox(lb, sfx, config, onShow) {
  const img = lb.querySelector("img"), save = lb.querySelector(".save"), note = lb.querySelector(".lb-note");
  let cur = null, file = null, lastFocus = null;
  const slug = String(config.herName || "us").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const close = () => {
    if (lb.hidden) return;
    lb.classList.remove("on");
    lb.hidden = true; cur = null; file = null;
    lastFocus?.focus?.({ preventScroll: true });
  };
  const prep = async (k) => {
    try {
      const blob = await (await fetch(k.src)).blob();
      const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
      if (cur === k) file = new File([blob], `${slug}-${k.fallback ? "us" : "photobooth-" + k.type}.${ext}`, { type: blob.type || "image/png" });
    } catch { /* download link fallback still works */ }
  };
  save.onclick = async () => {
    if (!cur) return;
    sfx.pop();
    const coarse = matchMedia("(pointer: coarse)").matches;
    if (coarse && file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); note.textContent = "saved? pip hopes so 💾"; return; }
      catch (e) { if (e?.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = file ? URL.createObjectURL(file) : cur.src;
    a.download = file?.name || `${slug}-photobooth.png`;
    document.body.appendChild(a); a.click(); a.remove();
    if (file) setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    note.textContent = "saved to your downloads ✓";
  };
  lb.querySelector(".close").onclick = () => { sfx.pop(); close(); };
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", function onKey(e) {
    if (!lb.isConnected) return document.removeEventListener("keydown", onKey);
    if (e.key === "Escape") close();
  });
  return {
    close,
    show(k, fromImg) {
      lastFocus = document.activeElement;
      cur = k; file = null;
      onShow?.();
      img.src = k.src; img.alt = fromImg?.alt || "";
      lb.classList.toggle("framed", !!k.fallback);
      note.textContent = matchMedia("(pointer: coarse)").matches ? "(or press and hold the photo to save it)" : "";
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("on"));
      save.focus({ preventScroll: true });
      prep(k);
    },
  };
}

function countUp(el, target, ms) {
  return new Promise((done) => {
    if (!ms) { el.textContent = target.toLocaleString(); return done(); }
    const t0 = performance.now();
    const f = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString();
      k < 1 ? requestAnimationFrame(f) : done();
    };
    requestAnimationFrame(f);
  });
}

/** drag (or tap) to rip a coupon off its perforated edge */
function tearable(c, sfx, onTorn) {
  let id = null, sx = 0, sy = 0, dx = 0, dy = 0, lastCrinkle = 0, done = false;
  const THRESH = 90;
  const set = () => { c.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.06 + dy * 0.03}deg)`; };
  const rip = (vx, vy) => {
    if (done) return; done = true;
    c.onpointerdown = c.onpointermove = c.onpointerup = c.onpointercancel = c.onkeydown = null;
    sfx.tear();
    c.classList.add("torn");
    const len = Math.hypot(vx, vy) || 1;
    const fx = (vx / len) * 380, fy = (vy / len) * 380 - 120;
    c.style.transition = "transform .7s cubic-bezier(.3,.6,.5,1), opacity .7s";
    requestAnimationFrame(() => { c.style.transform = `translate(${fx}px, ${fy}px) rotate(${vx > 0 ? 35 : -35}deg) scale(.6)`; c.style.opacity = "0"; });
    onTorn();
  };
  c.onpointerdown = (e) => {
    id = e.pointerId; c.setPointerCapture(id); sx = e.clientX; sy = e.clientY; dx = dy = 0;
    c.style.transition = "none"; c.classList.add("grabbed"); sfx.pick();
  };
  c.onpointermove = (e) => {
    if (e.pointerId !== id) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    // resistance: paper doesn't want to let go
    const d = Math.hypot(dx, dy), k = d > 0 ? Math.min(1, 0.35 + d / 400) : 1;
    dx *= k; dy *= k; set();
    c.classList.toggle("ripping", d > 30);
    if (d > 30 && performance.now() - lastCrinkle > 70) { sfx.crinkle(); lastCrinkle = performance.now(); }
  };
  const up = (e) => {
    if (e.pointerId !== id) return; id = null; c.classList.remove("grabbed", "ripping");
    const d = Math.hypot(dx, dy);
    if (d < 6) return rip(1, -0.3);             // tap
    if (d > THRESH) return rip(dx, dy);
    c.style.transition = "transform .45s cubic-bezier(.3,1.8,.5,1)"; dx = dy = 0; set();   // snap back
  };
  c.onpointerup = up; c.onpointercancel = up;
  c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rip(1, -0.3); } };
}

/** handwriting typewriter; tap the letter to finish instantly */
function typeLetter(el, text, letterEl, sfx, scroller) {
  return new Promise((resolve) => {
    const paras = text.split(/\n/);
    let skip = reduced();
    const onSkip = () => (skip = true);
    letterEl.addEventListener("pointerdown", onSkip);
    const finish = () => { letterEl.removeEventListener("pointerdown", onSkip); resolve(); };
    el.innerHTML = "";
    let pi = 0, ci = 0, cur = null, caret = document.createElement("span");
    caret.className = "caret";
    const newPara = () => { cur = document.createElement("p"); el.appendChild(cur); cur.appendChild(caret); };
    newPara();
    const step = () => {
      if (skip) {
        // dump the rest
        cur.textContent = cur.textContent + (paras[pi] || "").slice(ci);
        for (let j = pi + 1; j < paras.length; j++) { const pp = document.createElement("p"); pp.textContent = paras[j]; el.appendChild(pp); }
        caret.remove(); return finish();
      }
      const para = paras[pi];
      if (ci >= para.length) {
        pi++; ci = 0;
        if (pi >= paras.length) { caret.remove(); return finish(); }
        newPara(); return setTimeout(step, 260);
      }
      const ch = para[ci++];
      caret.before(document.createTextNode(ch));
      if (ci % 3 === 0) sfx.scratch();
      const box = scroller.getBoundingClientRect(), cb = caret.getBoundingClientRect();
      if (cb.bottom > box.bottom - 90) scroller.scrollTop += cb.bottom - box.bottom + 120;
      setTimeout(step, /[.!?]/.test(ch) ? 320 : /[,;:—]/.test(ch) ? 160 : 26 + Math.random() * 40);
    };
    setTimeout(step, 300);
  });
}
