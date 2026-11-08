// Jigsaw scene: the Chongqing photo gets cut into real tab-and-blank pieces,
// scattered over a cork board, and she drags them back into the dotted frame.
// Pieces are one <canvas> each (clipped photo + ink outline); positions live in
// "photo units" (the frame is 0..W × 0..H) and are mapped to the screen by one
// scale + offset, so resizing/rotating the phone just re-maps everything.

// one size only: 12 pieces. k = how much cork there is around the frame.
const LEVEL = { label: "12 pieces", cols: 4, rows: 3, k: 2.3 };

const LINES = {
  first: [
    "first piece! 🌸",
    "one down 👀",
  ],
  half: [
    "halfway there!",
    "half done, nice 💕",
  ],
  cheeky: [
    "careful, that's my good side 😏",
    "you're good at this",
    "that one was hiding",
    "this is the most attention my face has ever gotten",
  ],
  near: [
    "so close!",
    "almost, wiggle it a bit",
  ],
  idle: [
    "hello? 😴",
    "the pieces miss you",
  ],
  peek: [
    "ok, one little peek 👀",
    "peeking again? 🤨",
    "you were literally there when we took this 🤣",
  ],
  last: [
    "last one! 🥁",
  ],
  win: [
    "we're whole again 💕",
    "you did it!!",
  ],
};

const PALETTE = ["#f2a7b8", "#e0728f", "#fde0e6", "#fff7f0", "#f6d36b"];

export async function run(root, ctx) {
  const { config } = ctx;
  root.classList.add("pz-scene");
  const photo = await loadPhoto(config.puzzle.photo);
  const W = photo.width, H = photo.height;

  const cleanups = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); cleanups.push(() => el.removeEventListener(ev, fn, opt)); };

  try {
    setTimeout(() => ctx.say("can you put our photo back together? 🧩", 3500), 400);
    await playPuzzle(root, ctx, photo, W, H, LEVEL, on);
  } finally {
    cleanups.forEach((f) => f());
  }
}

/* ───────────── the puzzle ───────────── */

function playPuzzle(root, ctx, photo, W, H, level, on) {
  return new Promise((resolve) => {
    const { cols, rows } = level;
    const pw = W / cols, ph = H / rows;
    const M = Math.ceil(Math.max(pw, ph) * 0.3); // canvas margin for tabs
    const N = cols * rows;

    root.innerHTML = `
      <div class="pz-cork"></div>
      <header class="pz-bar">
        <h2 class="pz-title">fix our photo</h2>
        <div class="pz-timer" aria-label="time">0:00</div>
        <div class="pz-count">0/${N}</div>
        <button class="btn alt pz-peek" type="button">👀 peek</button>
      </header>
      <div class="pz-board">
        <svg class="pz-frame" aria-hidden="true"></svg>
        <div class="pz-frame-label">put us back in chongqing ♡</div>
        <img class="pz-ghost" alt="" src="${photo.src}">
      </div>`;
    const board = root.querySelector(".pz-board");
    const frameSvg = root.querySelector(".pz-frame");
    const frameLabel = root.querySelector(".pz-frame-label");
    const ghost = root.querySelector(".pz-ghost");
    const timerEl = root.querySelector(".pz-timer");
    const countEl = root.querySelector(".pz-count");
    const peekBtn = root.querySelector(".pz-peek");

    const edges = makeEdges(cols, rows, pw, ph);
    const hitCtx = document.createElement("canvas").getContext("2d");

    // layout: region (photo units) that must fit in the board; frame sits at 0,0
    const L = { s: 1, ox: 0, oy: 0, rx: 0, ry: 0, rw: W, rh: H };

    const pieces = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const hx = c * pw, hy = r * ph;
      const path = new Path2D(piecePath(edges, c, r, pw, ph));
      const el = document.createElement("canvas");
      el.className = "pz-piece";
      board.appendChild(el);
      pieces.push({ c, r, hx, hy, x: 0, y: 0, rot: 0, placed: false, path, el, z: 0 });
    }

    let zTop = 10;
    let placedCount = 0;
    let done = false;
    let startT = performance.now();
    let lastAct = performance.now();
    let idleSaid = 0;
    let lastSay = 0;
    let peeks = 0;
    const said = new Set();
    const say = (t, ms = 3500) => { lastSay = performance.now(); ctx.say(t, ms); };

    /* ── layout ── */
    function layout() {
      const bw = board.clientWidth, bh = board.clientHeight;
      if (!bw || !bh) return;
      const A = bw / bh;
      const pad = Math.max(pw, ph) * 0.12;
      let rw = Math.sqrt(level.k * W * H * A), rh = rw / A;
      const minW = W + pad * 2, minH = H + pad * 2;
      if (rw < minW) { rw = minW; rh = rw / A; }
      if (rh < minH) { rh = minH; rw = rh * A; }
      L.rw = rw; L.rh = rh;
      L.rx = -(rw - W) / 2;
      L.ry = -(rh - H) / 2;
      L.s = bw / rw;
      L.ox = -L.rx * L.s;
      L.oy = -L.ry * L.s;
      drawFrame(bw, bh);
      const fx = L.ox, fy = L.oy, fw = W * L.s, fh = H * L.s;
      Object.assign(ghost.style, { left: fx + "px", top: fy + "px", width: fw + "px", height: fh + "px" });
      Object.assign(frameLabel.style, { left: fx + "px", top: fy + "px", width: fw + "px", height: fh + "px",
        fontSize: Math.max(18, Math.min(44, fw / 14)) + "px" });
    }

    function drawFrame(bw, bh) {
      frameSvg.setAttribute("width", bw);
      frameSvg.setAttribute("height", bh);
      frameSvg.innerHTML = "";
      const x = L.ox, y = L.oy, w = W * L.s, h = H * L.s;
      if (window.rough) {
        const rc = window.rough.svg(frameSvg);
        frameSvg.appendChild(rc.rectangle(x, y, w, h, {
          stroke: "rgba(59,47,47,.55)", strokeWidth: 2, roughness: 1.4, bowing: 1.5,
          strokeLineDash: [3, 9], fill: "rgba(251,245,234,.45)", fillStyle: "solid", seed: 7,
        }));
      } else {
        frameSvg.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(251,245,234,.45)" stroke="rgba(59,47,47,.55)" stroke-width="2" stroke-dasharray="3 9"/>`;
      }
    }

    function renderPiece(p) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = (pw + 2 * M) * L.s, chh = (ph + 2 * M) * L.s;
      const el = p.el;
      el.width = Math.max(1, Math.round(cw * dpr));
      el.height = Math.max(1, Math.round(chh * dpr));
      el.style.width = cw + "px";
      el.style.height = chh + "px";
      const g = el.getContext("2d");
      const k = L.s * dpr;
      g.setTransform(k, 0, 0, k, -(p.hx - M) * k, -(p.hy - M) * k);
      g.save();
      g.clip(p.path);
      g.drawImage(photo, 0, 0, W, H);
      // a soft cardboard sheen from the top-left
      const grad = g.createLinearGradient(p.hx - M, p.hy - M, p.hx + pw + M, p.hy + ph + M);
      grad.addColorStop(0, "rgba(255,247,240,.16)");
      grad.addColorStop(1, "rgba(59,47,47,.10)");
      g.fillStyle = grad;
      g.fillRect(p.hx - M, p.hy - M, pw + 2 * M, ph + 2 * M);
      g.restore();
      // ink outline, drawn twice slightly offset so it reads as hand-traced
      const lw = 1.7 / L.s;
      g.lineJoin = "round";
      g.strokeStyle = "rgba(255,247,240,.55)";
      g.lineWidth = lw * 2.2;
      g.save(); g.clip(p.path); g.stroke(p.path); g.restore(); // light inner edge = cut cardboard
      g.strokeStyle = "rgba(59,47,47,.9)";
      g.lineWidth = lw;
      g.stroke(p.path);
      g.strokeStyle = "rgba(59,47,47,.35)";
      g.lineWidth = lw * 0.7;
      g.translate(0.7 / L.s, 0.5 / L.s);
      g.stroke(p.path);
    }

    function place(p) {
      const sx = L.ox + (p.x - M) * L.s, sy = L.oy + (p.y - M) * L.s;
      p.el.style.transform = `translate3d(${sx}px, ${sy}px, 0) rotate(${p.rot}deg)`;
      p.el.style.zIndex = p.placed ? 1 + (p.r * cols + p.c) % 2 : p.z;
    }

    /* ── scatter (best-candidate sampling so piles look even) ── */
    function scatterOne(p, others) {
      const minX = L.rx + M * 0.4, maxX = L.rx + L.rw - pw - M * 0.4;
      const minY = L.ry + M * 0.4, maxY = L.ry + L.rh - ph - M * 0.4;
      const gap = Math.min(pw, ph) * 0.15;
      let best = null, bestD = -Infinity;
      for (let i = 0; i < 40; i++) {
        const x = rand(minX, Math.max(minX, maxX)), y = rand(minY, Math.max(minY, maxY));
        // overlap with the frame (fraction of piece area)
        const ox = Math.max(0, Math.min(x + pw, W + gap) - Math.max(x, -gap));
        const oy = Math.max(0, Math.min(y + ph, H + gap) - Math.max(y, -gap));
        const overlap = (ox * oy) / (pw * ph);
        let d = Infinity;
        for (const o of others) d = Math.min(d, Math.hypot(o.x - x, o.y - y));
        if (d === Infinity) d = 1e6;
        const score = d - overlap * Math.max(pw, ph) * 4;
        if (score > bestD) { bestD = score; best = { x, y }; }
      }
      if (!best) best = { x: minX, y: minY }; // no valid sample (NaN layout) — fall back to the corner
      p.x = best.x; p.y = best.y;
    }

    function scatterAll() {
      const loose = shuffle(pieces.filter((p) => !p.placed));
      const fixed = pieces.filter((p) => p.placed).map((p) => ({ x: p.x, y: p.y }));
      const others = [...fixed];
      for (const p of loose) {
        scatterOne(p, others);
        others.push(p);
        p.rot = rand(-14, 14);
        p.z = ++zTop;
      }
    }

    // keep loose pieces inside the region after a resize
    function reclamp() {
      const out = pieces.filter((p) => !p.placed && (p.x < L.rx || p.y < L.ry || p.x + pw > L.rx + L.rw || p.y + ph > L.ry + L.rh));
      const others = pieces.filter((p) => !out.includes(p));
      for (const p of out) { scatterOne(p, others); others.push(p); }
    }

    let lastSize = "";
    function refresh(force) {
      const size = board.clientWidth + "x" + board.clientHeight;
      if (!force && size === lastSize) return;
      lastSize = size;
      layout();
      if (!force) reclamp();
      pieces.forEach((p) => { renderPiece(p); place(p); });
    }

    layout();
    scatterAll();
    refresh(true);
    // fly-in: start everything stacked in the frame, then let CSS ease them out
    board.classList.add("pz-dealing");
    const final = pieces.map((p) => ({ x: p.x, y: p.y, rot: p.rot }));
    pieces.forEach((p) => { p.x = W / 2 - pw / 2 + rand(-20, 20); p.y = H / 2 - ph / 2 + rand(-20, 20); p.rot = rand(-40, 40); place(p); });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pieces.forEach((p, i) => {
        Object.assign(p, final[i]);
        p.el.style.transitionDelay = (i * 0.015) + "s";
        place(p);
      });
      setTimeout(() => { board.classList.remove("pz-dealing"); pieces.forEach((p) => (p.el.style.transitionDelay = "")); startT = performance.now(); lastAct = startT; }, 700 + N * 15);
    }));

    let resizeRaf = 0;
    const onResize = () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(() => refresh(false)); };
    on(window, "resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(board);

    /* ── dragging ── */
    let drag = null;

    function boardPoint(e) {
      const b = board.getBoundingClientRect();
      return { x: (e.clientX - b.left - L.ox) / L.s, y: (e.clientY - b.top - L.oy) / L.s };
    }

    function hitTest(p, pt) {
      // pointer → piece's home coords (undo rotation about the cell centre)
      const cx = p.x + pw / 2, cy = p.y + ph / 2;
      const a = -p.rot * Math.PI / 180;
      const dx = pt.x - cx, dy = pt.y - cy;
      const lx = dx * Math.cos(a) - dy * Math.sin(a) + p.hx + pw / 2;
      const ly = dx * Math.sin(a) + dy * Math.cos(a) + p.hy + ph / 2;
      return hitCtx.isPointInPath(p.path, lx, ly);
    }

    on(board, "pointerdown", (e) => {
      if (done || drag || board.classList.contains("pz-dealing")) return;
      const pt = boardPoint(e);
      const loose = pieces.filter((p) => !p.placed).sort((a, b) => b.z - a.z);
      let hit = loose.find((p) => hitTest(p, pt));
      if (!hit) {
        // forgiving touch: grab the nearest loose piece whose centre is close
        const tol = Math.max(pw, ph) * 0.45;
        let bd = Infinity;
        for (const p of loose) {
          const d = Math.hypot(p.x + pw / 2 - pt.x, p.y + ph / 2 - pt.y);
          if (d < tol && d < bd) { bd = d; hit = p; }
        }
      }
      if (!hit) return;
      e.preventDefault();
      board.setPointerCapture(e.pointerId);
      drag = { p: hit, id: e.pointerId, dx: pt.x - hit.x, dy: pt.y - hit.y, rot0: hit.rot };
      hit.z = ++zTop;
      hit.el.classList.add("pz-lifted");
      hit.rot = hit.rot * 0.5;
      place(hit);
      ctx.sfx.pick();
      activity();
    });

    on(board, "pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const pt = boardPoint(e);
      const p = drag.p;
      p.x = clamp(pt.x - drag.dx, L.rx - pw * 0.3, L.rx + L.rw - pw * 0.7);
      p.y = clamp(pt.y - drag.dy, L.ry - ph * 0.3, L.ry + L.rh - ph * 0.7);
      place(p);
      lastAct = performance.now();
    });

    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = drag.p;
      drag = null;
      p.el.classList.remove("pz-lifted");
      const d = Math.hypot(p.x - p.hx, p.y - p.hy);
      const tol = Math.min(pw, ph) * 0.3;
      if (d < tol) {
        snap(p);
      } else {
        place(p);
        if (d < tol * 2.2 && Math.random() < 0.35 && performance.now() - lastSay > 5000) say(ctx.pick(LINES.near), 2200);
      }
      activity();
    };
    on(board, "pointerup", endDrag);
    on(board, "pointercancel", endDrag);

    function snap(p, quiet = false) {
      p.placed = true;
      p.x = p.hx; p.y = p.hy; p.rot = 0;
      p.el.classList.add("pz-snapping", "pz-placed");
      place(p);
      setTimeout(() => p.el.classList.remove("pz-snapping"), 260);
      placedCount++;
      countEl.textContent = `${placedCount}/${N}`;
      if (quiet) return;
      ctx.sfx.pop();
      const b = board.getBoundingClientRect();
      ctx.burst(b.left + L.ox + (p.hx + pw / 2) * L.s, b.top + L.oy + (p.hy + ph / 2) * L.s, 10);
      if (placedCount === N) return finish();
      commentOnSnap();
    }

    function commentOnSnap() {
      const half = Math.ceil(N / 2);
      if (placedCount === 1 && !said.has("first")) { said.add("first"); say(ctx.pick(LINES.first)); }
      else if (placedCount >= half && !said.has("half")) { said.add("half"); say(ctx.pick(LINES.half)); }
      else if (placedCount === N - 1) say(ctx.pick(LINES.last));
      else if (Math.random() < 0.22 && performance.now() - lastSay > 7000) say(ctx.pick(LINES.cheeky));
    }

    function activity() { lastAct = performance.now(); idleSaid = 0; }

    /* ── peek ── */
    let peekTimer;
    peekBtn.onclick = () => {
      if (done) return;
      ctx.sfx.pop();
      say(LINES.peek[Math.min(peeks, LINES.peek.length - 1)], 2800);
      peeks++;
      ghost.classList.add("pz-show");
      peekBtn.disabled = true;
      clearTimeout(peekTimer);
      peekTimer = setTimeout(() => { ghost.classList.remove("pz-show"); peekBtn.disabled = false; }, 2200);
      activity();
    };

    /* ── timer + idle nagging ── */
    const tick = setInterval(() => {
      if (done) return;
      timerEl.textContent = fmt(performance.now() - startT);
      const idle = performance.now() - lastAct;
      if (idle > 25000 * (idleSaid + 1) && idleSaid < LINES.idle.length) {
        say(LINES.idle[idleSaid], 4000);
        idleSaid++;
      }
    }, 500);

    /* ── dev aid: "s" solves ── */
    on(window, "keydown", (e) => {
      if (done || e.key !== "s" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      drag = null;
      pieces.filter((p) => !p.placed).forEach((p) => { p.el.classList.remove("pz-lifted"); snap(p, true); });
      ctx.sfx.pop();
      finish();
    });

    /* ── win ── */
    function finish() {
      if (done) return;
      done = true;
      const ms = Math.round(performance.now() - startT);
      clearInterval(tick);
      clearTimeout(peekTimer);
      timerEl.textContent = fmt(ms);
      ctx.state.puzzleTimeMs = ms;
      ctx.state.puzzleDifficulty = level.label;
      peekBtn.disabled = true;

      // 1) pieces melt into one photo
      setTimeout(() => {
        ghost.classList.remove("pz-show");
        ghost.classList.add("pz-merged");
        board.classList.add("pz-merging");
        ctx.sfx.win();
        say(ctx.pick(LINES.win), 0);
        fireConfetti();
      }, 350);

      // 2) the photo becomes a taped polaroid
      setTimeout(() => {
        ro.disconnect();
        const wrap = document.createElement("div");
        wrap.className = "pz-win";
        wrap.innerHTML = `
          <figure class="polaroid pz-polaroid">
            <span class="tape" style="top:-12px;left:-26px;transform:rotate(-38deg)"></span>
            <span class="tape mint" style="top:-12px;right:-26px;transform:rotate(36deg)"></span>
            <img src="${photo.src}" alt="us in Chongqing">
            <figcaption>${escapeHtml(ctx.config.puzzle.caption)}</figcaption>
            <div class="pz-sticker">${ctx.art.heart(46)}</div>
          </figure>
          <p class="pz-result">solved in <b>${fmt(ms)}</b></p>
          <button class="btn pz-next" type="button">next →</button>`;
        root.appendChild(wrap);
        // start the polaroid exactly where the frame was, then let it fly to centre
        const b = board.getBoundingClientRect();
        const fig = wrap.querySelector(".pz-polaroid");
        const img = fig.querySelector("img");
        const startRect = { x: b.left + L.ox, y: b.top + L.oy, w: W * L.s };
        requestAnimationFrame(() => {
          // FLIP: put the polaroid's photo exactly over the old frame, then animate to rest
          const ir = img.getBoundingClientRect();
          const fr = fig.getBoundingClientRect();
          const sc = startRect.w / ir.width;
          fig.style.transition = "none";
          const ox = startRect.x - (ir.left - fr.left) * sc;
          const oy = startRect.y - (ir.top - fr.top) * sc;
          fig.style.transformOrigin = "0 0";
          fig.style.transform = `translate(${ox - fr.left}px, ${oy - fr.top}px) scale(${sc})`;
          fig.getBoundingClientRect();
          board.classList.add("pz-gone");
          root.querySelector(".pz-bar").classList.add("pz-gone");
          requestAnimationFrame(() => {
            fig.style.transition = "";
            fig.classList.add("pz-landed");
            fig.style.transform = "";
            wrap.classList.add("pz-in");
          });
        });
        wrap.querySelector(".pz-next").onclick = () => { ctx.sfx.pop(); ctx.say(""); resolve(); };
        setTimeout(() => say(`${fmt(ms)}! ${ms < 120000 ? "that was fast 😤" : "worth the wait 😙"}`, 4000), 1600);
      }, 1500);
    }

    function fireConfetti() {
      const c = window.confetti;
      if (!c) return;
      let shapes;
      try {
        const heart = c.shapeFromPath({ path: "M16 28 C4 19 2 12 6 8 C10 4 14 6 16 10 C18 6 22 4 26 8 C30 12 28 19 16 28Z" });
        shapes = [heart, "circle", heart];
      } catch { shapes = ["circle", "square"]; }
      const opts = { colors: PALETTE, shapes, scalar: 1.3, ticks: 260, zIndex: 70, disableForReducedMotion: true };
      c({ ...opts, particleCount: 90, spread: 80, origin: { x: 0.5, y: 0.55 } });
      setTimeout(() => {
        c({ ...opts, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
        c({ ...opts, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
      }, 350);
    }
  });
}

/* ───────────── jigsaw geometry ───────────── */

// Each internal edge gets a random tab direction + jitter. Horizontal edges are
// stored left→right, vertical edges top→bottom, as 10-point cubic chains.
function makeEdges(cols, rows, pw, ph) {
  const h = [], v = [];
  for (let r = 0; r <= rows; r++) {
    h[r] = [];
    for (let c = 0; c < cols; c++) {
      const A = [c * pw, r * ph], B = [(c + 1) * pw, r * ph];
      h[r][c] = r === 0 || r === rows ? null : edgePoints(A, B);
    }
  }
  for (let c = 0; c <= cols; c++) {
    v[c] = [];
    for (let r = 0; r < rows; r++) {
      const A = [c * pw, r * ph], B = [c * pw, (r + 1) * ph];
      v[c][r] = c === 0 || c === cols ? null : edgePoints(A, B);
    }
  }
  return { h, v, cols, rows };
}

function edgePoints(A, B) {
  const t = 0.1 + rand(-0.008, 0.012);
  const j = 0.04;
  const a = rand(-j, j), b = rand(-j, j), c = rand(-j, j), d = rand(-j, j), e = rand(-j, j);
  const flip = Math.random() < 0.5 ? 1 : -1;
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const P = (u, w) => [A[0] + dx * u + nx * w * flip * len, A[1] + dy * u + ny * w * flip * len];
  return [
    P(0, 0),
    P(0.2, a), P(0.5 + b + d, -t + c), P(0.5 - t + b, t + c),
    P(0.5 - 2 * t + b - d, 3 * t + c), P(0.5 + 2 * t + b - d, 3 * t + c), P(0.5 + t + b, t + c),
    P(0.5 + b + d, -t + c), P(0.8, e), P(1, 0),
  ];
}

function piecePath(E, c, r, pw, ph) {
  const x0 = c * pw, y0 = r * ph, x1 = x0 + pw, y1 = y0 + ph;
  let d = `M${x0} ${y0}`;
  const seg = (pts, rev) => {
    if (!pts) return null;
    const p = rev ? [...pts].reverse() : pts;
    let s = "";
    for (let i = 1; i < 10; i += 3) s += `C${p[i][0]} ${p[i][1]} ${p[i + 1][0]} ${p[i + 1][1]} ${p[i + 2][0]} ${p[i + 2][1]}`;
    return s;
  };
  d += seg(E.h[r][c], false) ?? `L${x1} ${y0}`;
  d += seg(E.v[c + 1][r], false) ?? `L${x1} ${y1}`;
  d += seg(E.h[r + 1][c], true) ?? `L${x0} ${y1}`;
  d += seg(E.v[c][r], true) ?? `L${x0} ${y0}`;
  return d + "Z";
}

/* ───────────── utils ───────────── */

function loadPhoto(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      // fallback so the scene still works if the photo is missing
      const cv = document.createElement("canvas");
      cv.width = 1600; cv.height = 900;
      const g = cv.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 1600, 900);
      grad.addColorStop(0, "#f2a7b8"); grad.addColorStop(1, "#a9cfe6");
      g.fillStyle = grad; g.fillRect(0, 0, 1600, 900);
      g.fillStyle = "#3b2f2f"; g.font = "120px Caveat, cursive"; g.textAlign = "center";
      g.fillText("(photo goes here ♡)", 800, 480);
      const im = new Image();
      im.onload = () => resolve(im);
      im.src = cv.toDataURL();
    };
    img.src = src;
  });
}

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fmt(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); }
