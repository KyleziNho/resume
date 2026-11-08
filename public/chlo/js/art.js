// ─────────────────────────────────────────────────────────────
//  art.js: the hand-drawn doodle kit 🌸
//  All art is original & procedural: shapes are sampled, jittered with a seeded RNG and
//  smoothed (Catmull-Rom → cubic Bézier) so every outline wobbles like a pen line.
//  Every function returns an SVG *string* (inline-able via innerHTML) unless noted.
//  Pass {seed} in opts for a stable drawing; otherwise every call is a slightly different doodle.
// ─────────────────────────────────────────────────────────────
import * as sfx from "./sfx.js";

const INK = "#3b2f2f";
const K = {
  peony: "#f2a7b8", deep: "#e0728f", blush: "#fde0e6", lily: "#fff7f0", throat: "#f6d36b",
  leaf: "#8fb38a", leafDeep: "#5f8a5b", kraft: "#d9bf98", paper: "#fbf5ea",
};
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── tiny geometry helpers ─────────────────────────────────── */
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let seedCounter = 1234;
const newSeed = () => (seedCounter = (seedCounter * 16807 + 11) % 2147483647);
const R = (o) => rng(o && o.seed != null ? o.seed : newSeed());
const n1 = (v) => Math.round(v * 10) / 10;
const J = (r, a) => (r() - 0.5) * 2 * a;
let uid = 0;

function closed(pts) {
  const n = pts.length;
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}
function open(pts) {
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d;
}
const wob = (pts, r, a) => pts.map(([x, y]) => [x + J(r, a), y + J(r, a)]);
/** scalloped ruffle outline: k rounded lobes with inward cusps (peony petals) */
function ruffle(cx, cy, Rad, k, depth, rot, r, squash = 1, n = 60) {
  const amps = Array.from({ length: k }, () => 0.9 + r() * 0.2);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const u = (t * k) / 2 + rot;
    const lobe = ((Math.floor(u / Math.PI) % k) + k) % k;
    const s = Math.abs(Math.sin(u));
    const rr = Rad * (1 - depth + depth * Math.pow(s, 0.55)) * amps[lobe] + Rad * 0.025 * Math.sin(t * k * 3 + rot * 5);
    pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * squash]);
  }
  return pts;
}
function blob(cx, cy, rx, ry, r, j = 0.06, n = 14) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + J(r, j);
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  return closed(pts);
}
const svg = (w, h, vb, body, cls = "") =>
  `<svg class="doodle ${cls}" width="${w}" height="${h}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" overflow="visible">${body}</svg>`;
const stroke = (w = 2.6, extra = "") => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;

/* shared <defs>: pencil hatching + washi patterns (injected once into the document) */
(function ensureDefs() {
  if (typeof document === "undefined" || document.getElementById("art-defs")) return;
  const d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  d.id = "art-defs";
  d.setAttribute("width", "0"); d.setAttribute("height", "0"); d.setAttribute("aria-hidden", "true");
  d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  d.innerHTML = `<defs>
    <pattern id="art-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="1" y1="0" x2="1" y2="4" stroke="${INK}" stroke-width=".7" opacity=".55"/></pattern>
    <pattern id="art-hatch-w" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><line x1="1" y1="0" x2="1" y2="5" stroke="#fff" stroke-width="1" opacity=".6"/></pattern>
    <pattern id="art-p-stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="#fff" opacity=".45"/></pattern>
    <pattern id="art-p-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.8" fill="#fff" opacity=".8"/><circle cx="9" cy="9" r="1.3" fill="#fff" opacity=".6"/></pattern>
    <pattern id="art-p-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0H8M0 0V8" stroke="#fff" stroke-width="1.2" opacity=".55"/></pattern>
    <pattern id="art-p-hearts" width="16" height="14" patternUnits="userSpaceOnUse"><path d="M8 11C3 8 3 5 5 4S8 4 8 6C8 4 9 3 11 4S13 8 8 11Z" fill="#fff" opacity=".75"/></pattern>
  </defs>`;
  (document.body || document.documentElement).prepend(d);
})();

/* ── flowers ───────────────────────────────────────────────── */
const PEONY_PAL = [
  ["#f2a7b8", "#f7bfcc", "#fbd3dc", "#e0728f"], // classic pink
  ["#e0728f", "#ec95aa", "#f5b5c4", "#c4506d"], // deep raspberry
  ["#f6b9ad", "#f9cdc3", "#fde2db", "#e98c7b"], // coral charm
  ["#fbd3dc", "#fde6eb", "#fff4f6", "#f2a7b8"], // blush white
];
function peonyBody(r, pal) {
  const layers = [
    { Rd: 45, k: 7, d: 0.24, cy: 53, c: pal[0] },
    { Rd: 35, k: 6, d: 0.27, cy: 49, c: pal[1] },
    { Rd: 24, k: 5, d: 0.3, cy: 46, c: pal[2] },
  ];
  let s = "";
  layers.forEach((l, i) => {
    const p = closed(ruffle(50, l.cy, l.Rd, l.k, l.d, r() * 6, r, 0.9));
    s += `<path d="${p}" fill="${l.c}" ${stroke(2.6)}/>`;
    if (i === 0) s += `<path d="${p}" fill="url(#art-hatch)" opacity=".28"/>`;
    s += `<path d="${p}" fill="none" ${stroke(1)} opacity=".4" transform="rotate(${n1(J(r, 4))} 50 ${l.cy}) translate(${n1(J(r, 1.2))} ${n1(J(r, 1.2))})"/>`;
  });
  // petal creases
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + r() * 0.5;
    const r0 = i % 2 ? 26 : 37, r1 = r0 + 4 + r() * 3;
    s += `<path d="M${n1(50 + Math.cos(a) * r0)} ${n1(48 + Math.sin(a) * r0 * 0.9)} Q${n1(50 + Math.cos(a + 0.12) * (r0 + r1) / 2)} ${n1(48 + Math.sin(a + 0.12) * (r0 + r1) / 2 * 0.9)} ${n1(50 + Math.cos(a) * r1)} ${n1(48 + Math.sin(a) * r1 * 0.9)}" fill="none" ${stroke(1.3)} opacity=".45"/>`;
  }
  // cupped heart of the flower
  s += `<path d="${closed(ruffle(50, 44, 13, 4, 0.38, r() * 6, r, 0.85, 36))}" fill="${pal[3]}" ${stroke(2.2)}/>`;
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2, rr = 2 + r() * 7;
    const x = 50 + Math.cos(a) * rr, y = 44 + Math.sin(a) * rr * 0.6;
    s += `<path d="M${n1(x - 3.5)} ${n1(y + 1)} q3.5 ${n1(-3.5 - r() * 2)} 7 0" fill="none" ${stroke(1.5)} opacity=".75"/>`;
  }
  // a little white shine on the mid layer
  s += `<path d="M30 40 q4 -9 13 -12" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`;
  return s;
}
/** peony(size, {seed, color: 0..3}) */
export const peony = (size = 80, opts = {}) => {
  const r = R(opts);
  const pal = PEONY_PAL[opts.color != null ? opts.color % PEONY_PAL.length : Math.floor(r() * PEONY_PAL.length)];
  return svg(size, size, "0 0 100 100", peonyBody(r, pal), "peony");
};

const LILY_PAL = {
  white: { petal: "#fff7f0", stripe: "#f9cfd8", speck: "#d65f7e" },
  pink: { petal: "#f9c8d3", stripe: "#e0728f", speck: "#b23d5c" }, // stargazer
};
function lilyPetal(r, L, w, pal) {
  const tx = J(r, 3);
  const d = `M0 2 C${n1(w + J(r, 2))} ${n1(-L * 0.22)} ${n1(w * 0.95 + J(r, 2))} ${n1(-L * 0.68)} ${n1(tx)} ${-L} C${n1(-w * 0.95 + J(r, 2))} ${n1(-L * 0.68)} ${n1(-w + J(r, 2))} ${n1(-L * 0.22)} 0 2Z`;
  let s = `<path d="${d}" fill="${pal.petal}" ${stroke(2.4)}/>`;
  s += `<path d="M0 -4 Q${n1(J(r, 2))} ${n1(-L * 0.5)} ${n1(tx * 0.7)} ${n1(-L * 0.82)}" fill="none" stroke="${pal.stripe}" stroke-width="${n1(w * 0.55)}" stroke-linecap="round" opacity=".85"/>`;
  s += `<path d="M0 -4 Q${n1(J(r, 1.5))} ${n1(-L * 0.5)} ${n1(tx * 0.8)} ${n1(-L * 0.9)}" fill="none" ${stroke(1)} opacity=".45"/>`;
  for (let i = 0; i < 7; i++) {
    const t = 0.15 + r() * 0.4;
    s += `<circle cx="${n1(J(r, w * 0.5))}" cy="${n1(-L * t)}" r="${n1(0.9 + r() * 0.9)}" fill="${pal.speck}"/>`;
  }
  return s;
}
function lilyBody(r, pal) {
  const rot0 = r() * 60;
  let s = "";
  for (let i = 0; i < 3; i++) s += `<g transform="translate(50 50) rotate(${n1(rot0 + i * 120 + J(r, 6))})">${lilyPetal(r, 46, 15, pal)}</g>`;
  for (let i = 0; i < 3; i++) s += `<g transform="translate(50 50) rotate(${n1(rot0 + 60 + i * 120 + J(r, 6))})">${lilyPetal(r, 43, 12.5, pal)}</g>`;
  // yellow-green throat
  const th = [];
  for (let i = 0; i < 36; i++) { const t = (i / 36) * Math.PI * 2; const rr = 8 + 3.5 * Math.cos(6 * (t - (rot0 * Math.PI) / 180)); th.push([50 + Math.cos(t) * rr, 50 + Math.sin(t) * rr]); }
  s += `<path d="${closed(th)}" fill="${K.throat}" opacity=".9"/>`;
  s += `<circle cx="50" cy="50" r="4" fill="#cfe0a8"/>`;
  // stamens
  for (let i = 0; i < 6; i++) {
    const a = ((rot0 + 30 + i * 60 + J(r, 12)) * Math.PI) / 180, len = 20 + r() * 6;
    const ex = 50 + Math.cos(a) * len, ey = 50 + Math.sin(a) * len;
    const mx = 50 + Math.cos(a + 0.25) * len * 0.5, my = 50 + Math.sin(a + 0.25) * len * 0.5;
    s += `<path d="M50 50 Q${n1(mx)} ${n1(my)} ${n1(ex)} ${n1(ey)}" fill="none" stroke="#9cb57a" stroke-width="1.6" stroke-linecap="round"/>`;
    s += `<ellipse cx="${n1(ex)}" cy="${n1(ey)}" rx="3.6" ry="1.7" transform="rotate(${n1((a * 180) / Math.PI + 90)} ${n1(ex)} ${n1(ey)})" fill="#b5562f" ${stroke(1)}/>`;
  }
  s += `<path d="M50 50 q${n1(J(r, 4))} -10 ${n1(J(r, 6))} -24" fill="none" stroke="#86a868" stroke-width="2" stroke-linecap="round"/>`;
  return s;
}
/** lily(size, {seed, color: "white"|"pink"}) */
export const lily = (size = 80, opts = {}) => {
  const r = R(opts);
  const pal = LILY_PAL[opts.color] || (r() < 0.45 ? LILY_PAL.pink : LILY_PAL.white);
  return svg(size, size, "0 0 100 100", lilyBody(r, pal), "lily");
};

function budBody(r, c = K.peony) {
  let s = `<path d="M50 96 Q${n1(48 + J(r, 3))} 75 50 62" fill="none" stroke="${K.leafDeep}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<path d="${closed(wob([[50, 20], [62, 34], [64, 50], [56, 63], [44, 63], [36, 50], [38, 34]], r, 1.5))}" fill="${c}" ${stroke(2.5)}/>`;
  s += `<path d="M50 24 Q46 40 48 60" fill="none" ${stroke(1.3)} opacity=".5"/>`;
  s += `<path d="M38 52 Q44 70 50 64 Q56 70 62 52 Q56 60 50 58 Q44 60 38 52Z" fill="${K.leaf}" ${stroke(2)}/>`;
  return s;
}
/** a closed bud on a short stem: for "almost" moments */
export const bud = (size = 50, opts = {}) => svg(size, size, "0 0 100 100", budBody(R(opts), opts.fill), "bud");

function leafBody(r, color = K.leaf) {
  const L = 34, w = 10;
  const d = `M0 0 C${n1(w + J(r, 2))} ${n1(-L * 0.25)} ${n1(w * 0.8 + J(r, 2))} ${n1(-L * 0.75)} ${n1(J(r, 2))} ${-L} C${n1(-w * 0.8 + J(r, 2))} ${n1(-L * 0.75)} ${n1(-w + J(r, 2))} ${n1(-L * 0.25)} 0 0Z`;
  let s = `<path d="${d}" fill="${color}" ${stroke(2.2)}/><path d="${d}" fill="url(#art-hatch)" opacity=".25" transform="translate(2 0)"/>`;
  s += `<path d="M0 -2 Q${n1(J(r, 2))} ${-L / 2} 0 ${-L + 5}" fill="none" ${stroke(1.3)} opacity=".6"/>`;
  for (let i = 1; i < 4; i++) { const y = -L * (i / 4.5); s += `<path d="M0 ${n1(y)} l${i % 2 ? 5 : -5} -4" fill="none" ${stroke(1)} opacity=".45"/>`; }
  return s;
}
/** leaf(size, color) */
export const leaf = (size = 40, color = K.leaf, opts = {}) =>
  svg(size, size, "0 0 40 40", `<g transform="translate(20 38) rotate(${opts.angle ?? 30})">${leafBody(R(opts), color)}</g>`, "leaf");

/* ── hearts, sparkles, small stuff ─────────────────────────── */
function heartPath(r, cx = 20, cy = 18.5, s = 1.05, j = 0.5) {
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const t = (i / 30) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([cx + x * s + J(r, j), cy + y * s + J(r, j)]);
  }
  return closed(pts);
}
export const heart = (size = 32, fill = "#e0728f", opts = {}) => {
  const r = R(opts);
  const p = heartPath(r);
  return svg(size, size, "0 0 40 40",
    `<path d="${p}" fill="${fill}" ${stroke(2.4)}/><path d="${p}" fill="url(#art-hatch)" opacity=".18"/>` +
    `<path d="M10 13 q2 -5 7 -4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>`, "heart");
};
export const sparkle = (size = 24, fill = K.throat) =>
  svg(size, size, "0 0 24 24", `<path d="M12 1 Q13.5 10.5 23 12 Q13.5 13.5 12 23 Q10.5 13.5 1 12 Q10.5 10.5 12 1Z" fill="${fill}" ${stroke(1.6)}/>`, "sparkle");
/** wavy hand-drawn underline */
export const squiggle = (width = 200, color = K.deep, opts = {}) => {
  const r = R(opts), pts = [];
  for (let x = 4; x <= width - 4; x += 12) pts.push([x, 8 + Math.sin(x / 9) * 3.5 + J(r, 0.8)]);
  return svg(width, 16, `0 0 ${width} 16`, `<path d="${open(pts)}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`, "squiggle");
};
export const crown = (size = 40, fill = K.throat) =>
  svg(size, size * 0.7, "0 0 40 28", `<path d="M4 24 L3 8 L12 15 L20 3 L28 15 L37 8 L36 24 Z" fill="${fill}" ${stroke(2.2)}/><circle cx="20" cy="3" r="2.4" fill="${K.deep}" ${stroke(1.4)}/><circle cx="3" cy="8" r="2" fill="${K.peony}" ${stroke(1.2)}/><circle cx="37" cy="8" r="2" fill="${K.peony}" ${stroke(1.2)}/><path d="M6 20 H34" ${stroke(1.4)} opacity=".5"/>`, "crown");
/** a very handsome potato (artist's impression of Kyle) */
export const potato = (size = 80, opts = {}) => {
  const r = R({ seed: opts.seed ?? 77 });
  let s = `<ellipse cx="50" cy="90" rx="30" ry="4" fill="${INK}" opacity=".12"/>`;
  s += `<path d="${blob(50, 55, 34, 30, r, 0.08, 12)}" fill="#dcae7a" ${stroke(2.6)}/>`;
  s += `<path d="${blob(54, 58, 30, 26, r, 0.05, 10)}" fill="url(#art-hatch)" opacity=".25"/>`;
  for (let i = 0; i < 4; i++) s += `<circle cx="${n1(28 + r() * 44)}" cy="${n1(38 + r() * 34)}" r="${n1(1.3 + r())}" fill="#a77b4c"/>`;
  s += `<circle cx="40" cy="52" r="3.2" fill="${INK}"/><circle cx="60" cy="52" r="3.2" fill="${INK}"/><circle cx="41" cy="51" r="1" fill="#fff"/><circle cx="61" cy="51" r="1" fill="#fff"/>`;
  s += `<path d="M44 63 q6 5 12 0" fill="none" ${stroke(2.2)}/>`;
  s += `<ellipse cx="33" cy="61" rx="4.5" ry="2.6" fill="${K.peony}" opacity=".8"/><ellipse cx="67" cy="61" rx="4.5" ry="2.6" fill="${K.peony}" opacity=".8"/>`;
  s += `<path d="M76 30 q4 6 0 9 q-4 -3 0 -9Z" fill="${K.sky || "#a9cfe6"}" ${stroke(1.4)}/>`; // nervous sweat drop
  return svg(size, size, "0 0 100 100", s, "potato");
};

/* ── map pin + postage stamp + wax seal ────────────────────── */
/** square SVG; the pin's tip is at bottom-centre → anchor at [size/2, size] */
export const pin = (size = 40, opts = {}) => {
  const r = R(opts), fill = opts.fill || K.deep;
  const p = `M20 39 C${n1(14 + J(r, 1))} 30 ${n1(6.5 + J(r, 0.6))} 23 7 15 C${n1(7 + J(r, 0.5))} 7 ${n1(13 + J(r, 0.5))} 2 20 2 C${n1(27 + J(r, 0.5))} 2 ${n1(33 + J(r, 0.5))} 7 33 15 C${n1(33.5 + J(r, 0.6))} 23 ${n1(26 + J(r, 1))} 30 20 39Z`;
  return svg(size, size, "0 0 40 40",
    `<path d="${p}" fill="${fill}" ${stroke(2.3)}/><path d="${p}" fill="url(#art-hatch)" opacity=".2"/>` +
    `<circle cx="20" cy="15" r="7.4" fill="#fff" ${stroke(1.6)}/>` +
    `<path d="${heartPath(r, 20, 14.3, 0.32, 0.15)}" fill="${K.peony}" ${stroke(1.1)}/>` +
    `<path d="M10.5 11 q2 -5 6 -6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`, "pin");
};

/** postage stamp with perforated edge; text sits at the bottom */
export const stamp = (text = "♥", size = 90, opts = {}) => {
  const r = R(opts), id = `artstm${++uid}`;
  const bg = opts.bg || ["#fde0e6", "#d7ead2", "#dcebf5", "#fbefc9"][Math.floor(r() * 4)];
  let holes = "";
  for (let x = 5; x <= 85; x += 8) holes += `<circle cx="${x}" cy="4" r="3.1"/><circle cx="${x}" cy="86" r="3.1"/>`;
  for (let y = 13; y <= 77; y += 8) holes += `<circle cx="4" cy="${y}" r="3.1"/><circle cx="86" cy="${y}" r="3.1"/>`;
  const art = opts.flower === "lily" || (opts.flower == null && r() < 0.5)
    ? lilyBody(r, LILY_PAL.white) : peonyBody(r, PEONY_PAL[Math.floor(r() * 3)]);
  return svg(size, size, "0 0 90 90",
    `<defs><mask id="${id}"><rect width="90" height="90" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>` +
    `<g mask="url(#${id})"><rect x="1" y="1" width="88" height="88" fill="#fff"/></g>` +
    `<rect x="11" y="11" width="68" height="68" fill="${bg}" ${stroke(1.8)}/>` +
    `<g transform="translate(19 13) scale(.52)">${art}</g>` +
    `<text x="45" y="74" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="15" fill="${INK}">${text}</text>` +
    `<text x="73" y="22" text-anchor="end" font-family="Caveat, cursive" font-size="10" fill="${INK}" opacity=".7">RM1</text>`, "stamp");
};

export const waxSeal = (size = 80, color = "#c9506f", opts = {}) => {
  const r = R({ seed: opts.seed ?? 9 });
  const outer = closed(ruffle(50, 50, 44, 9, 0.12, 0.4, r, 1, 54));
  let s = `<path d="${outer}" fill="${color}" ${stroke(2.6)}/>`;
  s += `<ellipse cx="22" cy="86" rx="6" ry="8" fill="${color}" ${stroke(2.2)}/><ellipse cx="80" cy="80" rx="5" ry="6" fill="${color}" ${stroke(2.2)}/>`;
  s += `<path d="${outer}" fill="url(#art-hatch)" opacity=".18"/>`;
  s += `<path d="${blob(50, 50, 29, 29, r, 0.04, 16)}" fill="#b23f5f" stroke="#8f2e49" stroke-width="2.2"/>`;
  s += `<path d="${heartPath(r, 50, 47.5, 0.95, 0.4)}" fill="#a3354f" stroke="#e98aa3" stroke-width="2" />`;
  s += `<path d="M24 32 q6 -12 20 -14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>`;
  return svg(size, size, "0 0 100 100", s, "wax-seal");
};

/* ── washi tape strip ──────────────────────────────────────── */
const TAPE = { pink: "rgba(242,167,184,.82)", mint: "rgba(168,214,190,.82)", yellow: "rgba(246,211,107,.78)", sky: "rgba(169,207,230,.82)", lilac: "rgba(201,182,228,.82)" };
/** washi(width, color: pink|mint|yellow|sky|lilac, pattern: stripes|dots|grid|hearts|plain) */
export const washi = (width = 120, color = "pink", pattern = "stripes", opts = {}) => {
  const r = R(opts), h = opts.height || 28;
  const pts = [];
  for (let y = 0; y <= h; y += 4) pts.push(`${n1(2 + (y / 4) % 2 * 3 + J(r, 1))},${y}`);
  const right = [];
  for (let y = h; y >= 0; y -= 4) right.push(`${n1(width - 2 - (y / 4) % 2 * 3 + J(r, 1))},${y}`);
  const poly = [...pts, ...right].join(" ");
  const fill = TAPE[color] || color;
  const pat = pattern === "plain" ? "" : `<polygon points="${poly}" fill="url(#art-p-${pattern})"/>`;
  return svg(width, h, `0 0 ${width} ${h}`, `<polygon points="${poly}" fill="${fill}"/>${pat}`, "washi");
};

/* ── mascot: Pip the peony-bun ─────────────────────────────── */
export const MASCOT_NAME = "Pip";
let nextMood = null;
/** One-shot: the next mascot() call (e.g. the next ctx.say) uses this mood. happy|love|sad|wow|smug */
export const setMood = (m) => { nextMood = m; };
export const mascot = (size = 64, mood) => {
  mood = mood || nextMood || "happy";
  nextMood = null;
  const r = rng(42);
  let s = `<ellipse cx="50" cy="95" rx="24" ry="3.5" fill="${INK}" opacity=".14"/>`;
  // feet
  s += `<ellipse cx="39" cy="90" rx="7" ry="4.5" fill="#f7bfcc" ${stroke(2.2)}/><ellipse cx="61" cy="90" rx="7" ry="4.5" fill="#f7bfcc" ${stroke(2.2)}/>`;
  // arms (right one waves when excited)
  s += `<g class="m-arm-l"><ellipse cx="20" cy="66" rx="6" ry="8" transform="rotate(25 20 66)" fill="#fbd3dc" ${stroke(2.2)}/></g>`;
  const wave = mood === "wow" || mood === "love";
  s += `<g class="m-arm-r${wave ? " waving" : ""}"><ellipse cx="80" cy="${wave ? 52 : 66}" rx="6" ry="8" transform="rotate(${wave ? 30 : -25} 80 ${wave ? 52 : 66})" fill="#fbd3dc" ${stroke(2.2)}/></g>`;
  // body
  const body = blob(50, 64, 31, 27, r, 0.04, 16);
  s += `<path d="${body}" fill="#fde0e6" ${stroke(2.8)}/>`;
  s += `<path d="M66 82 q12 -6 14 -20" fill="none" stroke="url(#art-hatch)" stroke-width="7" opacity=".5"/>`;
  s += `<path d="${body}" fill="none" ${stroke(1)} opacity=".35" transform="rotate(2 50 64) translate(.8 .5)"/>`;
  // petal hair
  s += `<path d="M71 33 q10 -14 22 -9 q-6 12 -22 9Z" fill="${K.leaf}" ${stroke(2)}/><path d="M73 32 q8 -6 17 -7" fill="none" ${stroke(1.2)} opacity=".6"/>`;
  const crownP = closed(ruffle(50, 40, 25, 6, 0.3, 0.9, r, 0.62, 48));
  s += `<path d="${crownP}" fill="${K.peony}" ${stroke(2.6)}/><path d="${crownP}" fill="url(#art-hatch)" opacity=".22"/>`;
  s += `<path d="${closed(ruffle(50, 35, 13, 4, 0.35, 0.2, r, 0.7, 30))}" fill="${K.deep}" ${stroke(2.2)}/>`;
  s += `<path d="M44 34 q6 -5 12 0" fill="none" ${stroke(1.4)} opacity=".7"/>`;
  s += `<path d="M30 38 q4 -6 10 -7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
  // cheeks
  s += `<ellipse cx="32" cy="71" rx="5.5" ry="3.3" fill="${K.peony}" opacity=".85"/><ellipse cx="68" cy="71" rx="5.5" ry="3.3" fill="${K.peony}" opacity=".85"/>`;
  // eyes
  let eyes;
  if (mood === "love") eyes = `<path d="${heartPath(r, 39, 62, 0.3, 0.1)}" fill="${K.deep}" ${stroke(1.4)}/><path d="${heartPath(r, 61, 62, 0.3, 0.1)}" fill="${K.deep}" ${stroke(1.4)}/>`;
  else if (mood === "sad") eyes = `<path d="M34 61 q5 4 10 0 M56 61 q5 4 10 0" fill="none" ${stroke(2.4)}/><path d="M37 66 q-2.5 5 0 7 q2.5 -2 0 -7Z" fill="#a9cfe6" ${stroke(1.2)}/>`;
  else if (mood === "smug") eyes = `<path d="M34 63 h9 M57 63 h9" ${stroke(2.6)}/><path d="M34 60 q4 -2 9 0 M57 60 q4 -2 9 0" fill="none" ${stroke(1.4)} opacity=".6"/>`;
  else { const big = mood === "wow" ? 1.25 : 1;
    eyes = `<g class="m-eyes"><ellipse cx="39" cy="62" rx="${n1(3.6 * big)}" ry="${n1(4.6 * big)}" fill="${INK}"/><ellipse cx="61" cy="62" rx="${n1(3.6 * big)}" ry="${n1(4.6 * big)}" fill="${INK}"/><circle cx="40.3" cy="60.2" r="1.4" fill="#fff"/><circle cx="62.3" cy="60.2" r="1.4" fill="#fff"/></g>`; }
  s += eyes;
  // mouth
  const mouth = {
    happy: `<path d="M45 71 q2.5 3.5 5 0 q2.5 3.5 5 0" fill="none" ${stroke(2.2)}/>`,
    love: `<path d="M44 70 q6 7 12 0 Z" fill="${K.deep}" ${stroke(2)}/>`,
    sad: `<path d="M45 75 q5 -4 10 0" fill="none" ${stroke(2.2)}/>`,
    wow: `<ellipse cx="50" cy="73" rx="3.5" ry="4.2" fill="${K.deep}" ${stroke(2)}/>`,
    smug: `<path d="M44 72 q7 3 12 -2" fill="none" ${stroke(2.2)}/>`,
  }[mood] || "";
  s += `<g class="m-mouth">${mouth}</g>`;
  return svg(size, size, "0 0 100 100", s, `mascot mood-${mood}`);
};

/* ── compositions ──────────────────────────────────────────── */
const place = (body, x, y, scale) => `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(scale * 100) / 100}) translate(-50 -50)">${body}</g>`;
const placeLeaf = (r, x, y, ang, sc = 1, c) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(ang)}) scale(${sc})">${leafBody(r, c)}</g>`;

/** a cluster of peonies + lily + leaves for a corner (drawn for the top-left corner) */
export const flowerCorner = (size = 180, opts = {}) => {
  const r = R(opts);
  let s = "";
  s += placeLeaf(r, 70, 70, 75, 1.5) + placeLeaf(r, 66, 70, 160, 1.4, K.leafDeep) + placeLeaf(r, 90, 40, 115, 1.2) + placeLeaf(r, 40, 95, 200, 1.2);
  s += place(budBody(r), 150, 38, 0.45);
  s += place(lilyBody(r, r() < 0.5 ? LILY_PAL.pink : LILY_PAL.white), 112, 34, 0.68);
  s += place(peonyBody(r, PEONY_PAL[Math.floor(r() * 4)]), 30, 128, 0.58);
  s += place(peonyBody(r, PEONY_PAL[Math.floor(r() * 3)]), 48, 46, 0.95);
  return svg(size, size, "0 0 180 180", s, "flower-corner-svg");
};
/** HTML for 4 flower clusters in the corners of a positioned parent (styled in base.css) */
export const flowerBorder = (size = 170, opts = {}) => {
  const base = opts.seed ?? newSeed();
  return `<div class="flower-border" aria-hidden="true">${["tl", "tr", "bl", "br"].map((c, i) => `<div class="fc ${c}">${flowerCorner(size, { seed: base + i * 97 })}</div>`).join("")}</div>`;
};

/**
 * bouquet(n, size, {scales: [0..1.2], kinds: ["peony"|"lily"|"bud"], animate, seed})
 * With animate:true every stem/leaf/bloom gets data-i; add class "on" to [data-i="k"] to grow flower k
 * and add "on" to .bq-ribbon to tie the bow (transitions in base.css).
 */
export const bouquet = (n = 5, size = 240, opts = {}) => {
  const r = R(opts);
  n = Math.max(1, n);
  const T = [120, 208];
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) - 0.5 : 0;
    const ang = t * 104 + J(r, 5);
    const len = 128 - Math.abs(t) * 52 + J(r, 6) - (n > 5 ? (i % 2) * 22 : 0);
    const a = (ang * Math.PI) / 180;
    items.push({ i, ang, x: T[0] + Math.sin(a) * len, y: T[1] - Math.cos(a) * len, kind: (opts.kinds && opts.kinds[i]) || (i % 2 ? "lily" : "peony"), sc: opts.scales && opts.scales[i] != null ? opts.scales[i] : 1 });
  }
  const di = (i) => (opts.animate ? ` data-i="${i}"` : "");
  let s = "";
  // tissue paper peeking behind
  s += `<path d="${closed(ruffle(120, 172, 62, 7, 0.25, 1, r, 0.42, 40))}" fill="${K.blush}" ${stroke(2)}/>`;
  // stems
  items.forEach((it) => {
    const bx = T[0] + (it.i - (n - 1) / 2) * 5;
    const mid = [(T[0] + it.x) / 2 + J(r, 6), (T[1] + it.y) / 2];
    s += `<path class="bq-stem"${di(it.i)} pathLength="1" d="${open([[bx, 292], [T[0] + (it.i - (n - 1) / 2) * 2, T[1]], mid, [it.x, it.y]])}" fill="none" stroke="${K.leafDeep}" stroke-width="3.4" stroke-linecap="round"/>`;
  });
  items.forEach((it) => {
    if (it.i % 2 === 0 || n <= 3) {
      const lx = T[0] + (it.x - T[0]) * 0.42, ly = T[1] + (it.y - T[1]) * 0.42;
      s += `<g transform="translate(${n1(lx)} ${n1(ly)})"><g class="bq-leaf"${di(it.i)}>${placeLeaf(r, 0, 0, it.ang + (it.i % 4 ? 48 : -48), 0.9, it.i % 3 ? K.leaf : K.leafDeep)}</g></g>`;
    }
  });
  // blooms (outer first so the middle sits on top)
  [...items].sort((a, b) => Math.abs(b.i - (n - 1) / 2) - Math.abs(a.i - (n - 1) / 2)).forEach((it) => {
    const body = it.kind === "bud" ? budBody(r) : it.kind === "lily" ? lilyBody(r, r() < 0.5 ? LILY_PAL.pink : LILY_PAL.white) : peonyBody(r, PEONY_PAL[it.i % 4]);
    const sc = (it.kind === "bud" ? 0.5 : 0.8) * it.sc;
    s += `<g transform="translate(${n1(it.x)} ${n1(it.y)})"><g class="bq-bloom"${di(it.i)}>${place(body, 0, it.kind === "bud" ? -10 : 0, sc)}</g></g>`;
  });
  // kraft wrap
  const wrap = closed(wob([[48, 160], [92, 178], [120, 170], [148, 178], [192, 160], [150, 222], [140, 296], [100, 296], [90, 222]], r, 1.5));
  s += `<path d="${wrap}" fill="${K.kraft}" ${stroke(2.6)}/><path d="${wrap}" fill="url(#art-hatch)" opacity=".22"/>`;
  s += `<path d="M120 172 Q114 230 112 294" fill="none" ${stroke(1.4)} opacity=".45"/><path d="M70 170 Q96 200 104 222" fill="none" ${stroke(1.2)} opacity=".35"/>`;
  // ribbon bow
  s += `<g class="bq-ribbon${opts.animate ? "" : " on"}">
    <path d="M118 222 q-30 -24 -38 -4 q-4 14 38 4Z" fill="${K.deep}" ${stroke(2.4)}/>
    <path d="M122 222 q30 -24 38 -4 q4 14 -38 4Z" fill="${K.deep}" ${stroke(2.4)}/>
    <path d="M116 226 q-12 22 -22 40 l8 -2 l2 8 q10 -20 18 -42Z" fill="${K.deep}" ${stroke(2.2)}/>
    <path d="M124 226 q12 22 20 38 l-8 0 l0 8 q-10 -20 -18 -42Z" fill="${K.deep}" ${stroke(2.2)}/>
    <path d="${blob(120, 223, 7, 6, r, 0.05, 10)}" fill="#c9506f" ${stroke(2.2)}/>
    <path d="M88 214 q8 -6 14 -2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/></g>`;
  return svg(size, size * 1.25, "0 0 240 300", s, `bouquet${opts.animate ? " bq-anim" : ""}`);
};

/* ── envelope (shared by intro + finale; styles in intro.css) ─ */
/** HTML string. face = HTML on the front; inner = HTML on the letter peeking out. */
export const envelope = (opts = {}) => {
  const r = R({ seed: opts.seed ?? 5 });
  const edge = (pts) => closed(wob(pts, r, 1.6));
  return `<div class="envelope">
    <svg class="env-back" viewBox="0 0 440 290" preserveAspectRatio="none" aria-hidden="true"><path d="${edge([[4, 4], [436, 4], [436, 286], [4, 286]])}" fill="#e6cfae" ${stroke(3)}/></svg>
    <div class="env-letter"><div class="env-letter-inner">${opts.inner || ""}</div></div>
    <svg class="env-front" viewBox="0 0 440 290" preserveAspectRatio="none" aria-hidden="true">
      <path d="${edge([[4, 6], [220, 168], [436, 6], [436, 286], [4, 286]])}" fill="#f6ead6" ${stroke(3)}/>
      <path d="${edge([[4, 6], [220, 168], [436, 6], [436, 286], [4, 286]])}" fill="url(#art-hatch)" opacity=".1"/>
      <path d="M6 284 L190 150 M434 284 L250 150" fill="none" ${stroke(2)} opacity=".5"/>
    </svg>
    <div class="env-face">${opts.face || ""}</div>
    <div class="env-flap"><svg viewBox="0 0 440 180" preserveAspectRatio="none" aria-hidden="true"><path d="${closed(wob([[4, 4], [436, 4], [222, 172]], r, 1.5))}" fill="#efdcbd" ${stroke(3)}/><path d="M30 10 L220 150 L410 10" fill="none" ${stroke(1.2)} opacity=".25"/></svg></div>
    <button class="env-seal" aria-label="${opts.sealLabel || "break the wax seal"}"><span class="half l">${waxSeal(80)}</span><span class="half r">${waxSeal(80)}</span></button>
  </div>`;
};
/** DOM: crack the seal, flip the flap, slide the letter up. Resolves when done (~1.7s). */
export function openEnvelope(env) {
  if (env.classList.contains("opening")) return Promise.resolve();
  const q = reduced() ? 0.2 : 1;
  env.classList.add("opening", "cracked");
  sfx.crack();
  const seal = env.querySelector(".env-seal").getBoundingClientRect();
  burst(document.getElementById("fx") || document.body, seal.left + seal.width / 2, seal.top + seal.height / 2, 12);
  return new Promise((res) => {
    setTimeout(() => { env.classList.add("flap-open"); sfx.whoosh(); }, 380 * q);
    setTimeout(() => env.classList.add("flap-behind"), 700 * q);
    setTimeout(() => { env.classList.add("letter-out"); sfx.pick(); }, 900 * q);
    setTimeout(res, 1750 * q);
  });
}

/* ── particles: tumbling petals + hearts with gravity ──────── */
const peonyPetalSvg = (size, c) => svg(size, size, "0 0 30 30",
  `<path d="M15 28 C5 22 2 12 5 6 C8 3 10 6 12 4 C14 2 16 2 18 4 C20 6 23 3 25 6 C28 12 25 22 15 28Z" fill="${c}" ${stroke(1.8)}/><path d="M15 26 Q14 16 15 9" fill="none" ${stroke(1)} opacity=".4"/>`);
const lilyPetalSvg = (size, c, sp) => svg(size, size, "0 0 30 30",
  `<path d="M15 29 C9 22 8 10 15 1 C22 10 21 22 15 29Z" fill="${c}" ${stroke(1.7)}/><path d="M15 26 Q15 15 15 6" fill="none" stroke="${K.peony}" stroke-width="3" opacity=".7" stroke-linecap="round"/><circle cx="13" cy="19" r="1" fill="${sp}"/><circle cx="17" cy="16" r="1" fill="${sp}"/><circle cx="14" cy="13" r=".8" fill="${sp}"/>`);
const PIECES = [
  () => peonyPetalSvg(22, K.peony), () => peonyPetalSvg(20, "#f7bfcc"), () => peonyPetalSvg(20, K.deep),
  () => lilyPetalSvg(24, K.lily, "#d65f7e"), () => lilyPetalSvg(22, "#f9c8d3", "#b23d5c"),
  () => heart(18, K.deep, { seed: 3 }), () => heart(16, K.peony, { seed: 8 }), () => sparkle(14),
];
let pieceCache = null;
const pieces = () => (pieceCache ||= PIECES.map((f) => f()));
const parts = [];
let raf = 0;
function tick() {
  const now = performance.now();
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    const dt = Math.min(2.5, (now - p.last) / 16.67); p.last = now;
    p.vy += p.g * dt; p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
    if (p.vy > p.term) p.vy = p.term;
    p.x += (p.vx + Math.sin((now - p.born) / 400 + p.ph) * p.sway) * dt; p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const age = (now - p.born) / p.life;
    const flip = Math.cos((now - p.born) / p.flipT + p.ph);
    p.el.style.transform = `translate3d(${p.x}px,${p.y}px,0) rotate(${p.rot}deg) scale(${p.s * flip},${p.s})`;
    p.el.style.opacity = age > 0.7 ? Math.max(0, (1 - age) / 0.3) : 1;
    if (age >= 1 || p.y > innerHeight + 60) { p.el.remove(); parts.splice(i, 1); }
  }
  raf = parts.length ? requestAnimationFrame(tick) : 0;
}
function spawn(container, x, y, o) {
  const el = document.createElement("div");
  el.className = "fx-piece";
  el.innerHTML = pieces()[Math.floor(Math.random() * pieces().length)];
  el.style.cssText = "position:fixed;left:0;top:0;will-change:transform;pointer-events:none;margin:-11px 0 0 -11px";
  container.appendChild(el);
  const now = performance.now();
  parts.push({ el, x, y, last: now, born: now, rot: Math.random() * 360, vr: (Math.random() - 0.5) * 12, ph: Math.random() * 6, flipT: 120 + Math.random() * 260, s: 0.7 + Math.random() * 0.6, ...o });
  if (!raf) raf = requestAnimationFrame(tick);
}
/** DOM side-effect: spawn n tumbling petals/hearts bursting from viewport x,y inside container. */
export function burst(container, x, y, n = 18) {
  if (!container) return;
  const rm = reduced();
  n = rm ? Math.min(n, 6) : n;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
    const sp = rm ? 1 : 5 + Math.random() * 8;
    spawn(container, x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: rm ? 0 : 0.28, drag: 0.975, term: 4.5, sway: rm ? 0 : 0.6, life: rm ? 900 : 1700 + Math.random() * 900 });
  }
}
/** DOM: gentle petals falling from the top. Returns stop(). rate = petals per second. */
export function petalShower(container, { rate = 6, duration = 0 } = {}) {
  if (!container) return () => {};
  if (reduced()) rate = Math.min(rate, 1.5);
  const iv = setInterval(() => {
    spawn(container, Math.random() * innerWidth, -30, { vx: (Math.random() - 0.5) * 0.8, vy: 0.5 + Math.random(), g: 0.02, drag: 0.995, term: 1.4 + Math.random() * 1.2, sway: 0.9 + Math.random() * 0.8, life: 9000 });
  }, 1000 / rate);
  const stop = () => clearInterval(iv);
  if (duration) setTimeout(stop, duration);
  return stop;
}

/* ── greeting-card cover (finale) ──────────────────────────── */
/** a little posy for a card front: one big peony, a lily, a bud, leaves, tied with a ribbon. */
export const cardPosy = (size = 200, opts = {}) => {
  const r = R(opts);
  let s = "";
  // stems
  const stems = [[100, 70], [148, 52], [62, 58], [128, 92]];
  stems.forEach(([x, y]) => { s += `<path d="M${n1(100 + J(r, 3))} 186 Q${n1((100 + x) / 2 + J(r, 6))} ${n1((186 + y) / 2)} ${x} ${y}" fill="none" stroke="${K.leafDeep}" stroke-width="3" stroke-linecap="round"/>`; });
  s += placeLeaf(r, 96, 150, -40, 1.4) + placeLeaf(r, 104, 146, 45, 1.3, K.leafDeep) + placeLeaf(r, 92, 120, -70, 1.1) + placeLeaf(r, 110, 118, 70, 1.1);
  s += place(budBody(r), 60, 50, 0.5);
  s += place(lilyBody(r, LILY_PAL.white), 146, 54, 0.72);
  s += place(peonyBody(r, PEONY_PAL[opts.color ?? 0]), 92, 74, 1.05);
  s += place(lilyBody(r, LILY_PAL.pink), 134, 104, 0.42);
  // ribbon bow
  s += `<path d="M86 158 Q70 146 66 160 Q70 172 88 164Z M114 158 Q130 146 134 160 Q130 172 112 164Z" fill="${K.peony}" ${stroke(2.2)}/>`;
  s += `<path d="M94 164 q-8 14 -14 26 l7 -1 l2 6 q6 -14 9 -28Z M106 164 q8 14 14 26 l-7 -1 l-2 6 q-6 -14 -9 -28Z" fill="${K.deep}" ${stroke(2)}/>`;
  s += `<path d="${blob(100, 161, 8, 7, r, 0.06, 10)}" fill="${K.deep}" ${stroke(2.2)}/>`;
  return svg(size, size, "0 0 200 200", s, "card-posy");
};
