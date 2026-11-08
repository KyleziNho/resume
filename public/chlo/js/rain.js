// Reusable "stat rain" scene: a big counter while N images rain down and pile up
// until they fill the screen. Uses Matter.js (loaded globally in index.html).
//
// rainScene({ total, img, shape: "circle" | "rect", label, sub, punch, fill, fillPhone })
//   total  – how many things fall (and what the counter counts to)
//   label  – text after the number, e.g. "hours" (optional)
//   sub    – line under the number
//   punch  – optional line that pops in a beat after everything has landed
//   zoomFrom – optional: start zoomed in this much on the first few, then pull out once to 1×

const W8 = (ms) => new Promise((r) => setTimeout(r, ms));
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export function rainScene(o) {
  const SPAWN_MS = o.spawnMs || 7000;
  return { run: (root, ctx) => run(root, ctx, o, SPAWN_MS) };
}

async function run(root, ctx, o, SPAWN_MS) {
  const M = window.Matter, TOTAL = o.total;
  root.classList.add("sb-scene");
  root.innerHTML = `
    <canvas class="sb-canvas"></canvas>
    <div class="sb-label">
      <div class="sb-num"><span>0</span>${o.label ? ` <small>${o.label}</small>` : ""}</div>
      <div class="sb-sub">${o.sub}</div>
      ${o.punch ? `<div class="sb-punch" hidden>${o.punch}</div>` : ""}
    </div>
    <button class="btn sb-next" hidden>next →</button>`;
  const canvas = root.querySelector(".sb-canvas");
  const numEl = root.querySelector(".sb-num span");
  const next = root.querySelector(".sb-next");

  const finish = async () => {
    root.classList.add("sb-done");
    ctx.sfx.win?.();
    const punch = root.querySelector(".sb-punch");
    if (punch) { await W8(1400); punch.hidden = false; ctx.sfx.pop?.(); await W8(900); }
    else await W8(1500);
    next.hidden = false;
    await new Promise((r) => next.addEventListener("click", () => { ctx.sfx.pop?.(); r(); }, { once: true }));
  };

  let img;
  try { img = await loadImg(o.img); } catch { img = null; }
  if (!M || !img) { numEl.textContent = TOTAL.toLocaleString(); await finish(); return; }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = root.clientWidth, H = root.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  const g = canvas.getContext("2d");

  // size things so TOTAL of them roughly fill the screen
  const fill = W < 700 ? (o.fillPhone || 1.45) : (o.fill || 1.08);
  const area = (W * H * fill) / TOTAL;
  const aspect = img.width / img.height;
  const isCircle = o.shape === "circle";
  const ZOOM0 = o.zoomFrom || 1;
  let zoom = ZOOM0;
  // camera: zoom around the bottom-centre of the screen
  const toWorld = (sx, sy) => ({ x: (sx - W / 2) / zoom + W / 2, y: (sy - H) / zoom + H });
  const base = isCircle ? Math.sqrt(area / Math.PI) : Math.sqrt(area / aspect);   // radius, or height for rects

  const sizes = [0.88, 1, 1.12].map((k) => {
    const w = isCircle ? base * 2 * k : base * aspect * k, h = isCircle ? w : base * k;
    const c = document.createElement("canvas");
    const q = Math.min(dpr * ZOOM0, img.width / w);   // render sharp enough for the zoomed-in start
    c.width = Math.ceil(w * Math.max(q, dpr)); c.height = Math.ceil(h * Math.max(q, dpr));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return { w, h, c };
  });

  const engine = M.Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.1;
  const wall = { isStatic: true, friction: 0.4 }, T = 400;
  M.Composite.add(engine.world, [
    M.Bodies.rectangle(W / 2, H + T / 2, W + 2 * T, T, wall),
    M.Bodies.rectangle(-T / 2, -H, T, H * 5, wall),
    M.Bodies.rectangle(W + T / 2, -H, T, H * 5, wall),
  ]);

  const items = [];
  let spawned = 0, running = true, last = performance.now();
  const t0 = last;
  function spawn(n) {
    for (let i = 0; i < n && spawned < TOTAL; i++, spawned++) {
      const sz = sizes[Math.floor(Math.random() * sizes.length)];
      const half = Math.max(sz.w, sz.h) / 2;
      const vw = W / zoom, left = W / 2 - vw / 2, top = H - H / zoom;
      const x = left + half + Math.random() * Math.max(1, vw - 2 * half), y = top - half - Math.random() * 120 / zoom;
      const opts = { restitution: 0.2, friction: 0.3, frictionAir: 0.008, density: 0.002, angle: (Math.random() - 0.5) * (isCircle ? 6.3 : 1.2) };
      const b = isCircle
        ? M.Bodies.circle(x, y, sz.w / 2, opts)
        : M.Bodies.rectangle(x, y, sz.w, sz.h, { ...opts, chamfer: { radius: Math.min(sz.w, sz.h) * 0.08 } });
      M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: 2 + Math.random() * 4 });
      M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.15);
      b.sz = sz;
      items.push(b);
      M.Composite.add(engine.world, b);
    }
    numEl.textContent = spawned.toLocaleString();
  }

  const reach = Math.max(sizes[1].w, sizes[1].h) * 3.5;
  const poke = (e) => {
    const r = canvas.getBoundingClientRect(), { x, y } = toWorld(e.clientX - r.left, e.clientY - r.top);
    for (const b of items) {
      const dx = b.position.x - x, dy = b.position.y - y, d = Math.hypot(dx, dy);
      if (d < reach) {
        M.Sleeping.set(b, false);
        const f = (1 - d / reach) * 0.06 * b.mass;
        M.Body.applyForce(b, b.position, { x: (dx / (d + 1)) * f, y: -f * 1.4 });
      }
    }
    ctx.sfx.pop?.();
  };
  canvas.addEventListener("pointerdown", poke);

  function frame(now) {
    if (!running) return;
    const dt = Math.min(now - last, 33); last = now;
    const p = Math.min(1, (now - t0) / SPAWN_MS);   // drizzle → downpour
    spawn(Math.round(TOTAL * p * p) - spawned);
    if (ZOOM0 > 1) {   // hold close-up, then one smooth pull-out
      const z = Math.min(1, Math.max(0, (p - 0.25) / 0.45)), e = z * z * (3 - 2 * z);
      zoom = ZOOM0 + (1 - ZOOM0) * e;
    }
    M.Engine.update(engine, dt);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of items) {
      const { w, h, c } = b.sz, { x, y } = b.position;
      if (y < -Math.max(w, h)) continue;
      const sx = (x - W / 2) * zoom + W / 2, sy = (y - H) * zoom + H;
      if (sy < -Math.max(w, h) * zoom) continue;
      g.setTransform(dpr * zoom, 0, 0, dpr * zoom, sx * dpr, sy * dpr);
      g.rotate(b.angle);
      g.drawImage(c, -w / 2, -h / 2, w, h);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  while (spawned < TOTAL) await W8(200);
  await finish();
  running = false;
  canvas.removeEventListener("pointerdown", poke);
  M.Engine.clear(engine);
}
