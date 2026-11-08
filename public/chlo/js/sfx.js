// ─────────────────────────────────────────────────────────────
//  sfx.js: tiny synthesized WebAudio sounds (no audio files).
//  Every export is safe to call before a user gesture: it just no-ops until the
//  AudioContext is unlocked by the first pointerdown/keydown.
//  Also mounts the mute 🔈 / music ♫ stickers (top-right, .sfx-toggles in base.css).
// ─────────────────────────────────────────────────────────────
let ac = null, out = null, musicBus = null, noiseBuf = null;
let muted = false, musicOn = false, musicTimer = 0, nextNote = 0, step = 0;
try { muted = localStorage.getItem("sfx-muted") === "1"; } catch {}
const VOL = 0.55;

function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch { return; }
    const comp = ac.createDynamicsCompressor();
    out = ac.createGain();
    out.gain.value = muted ? 0 : VOL;
    out.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.5; musicBus.connect(out);
  }
  if (ac.state === "suspended") ac.resume().catch(() => {});
}
if (typeof window !== "undefined") {
  for (const ev of ["pointerdown", "touchstart", "keydown"]) window.addEventListener(ev, unlock, { capture: true, passive: true });
}
const ok = () => ac && out && !muted && ac.state !== "closed";

function tone(freq, { t = 0, dur = 0.15, type = "sine", vol = 0.3, a = 0.006, to = null, toT = null, dest = out, detune = 0 } = {}) {
  const now = ac.currentTime + t;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.detune.value = detune;
  o.frequency.setValueAtTime(freq, now);
  if (to) o.frequency.exponentialRampToValueAtTime(to, now + (toT ?? dur));
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + a);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(dest);
  o.start(now); o.stop(now + dur + 0.05);
  return o;
}
function noise({ t = 0, dur = 0.2, vol = 0.2, type = "bandpass", f = 1200, fTo = null, q = 1, a = 0.005 } = {}) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const now = ac.currentTime + t;
  const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true;
  fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, now);
  if (fTo) fl.frequency.exponentialRampToValueAtTime(fTo, now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + a);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(fl); fl.connect(g); g.connect(out);
  src.start(now, Math.random() * 0.5); src.stop(now + dur + 0.05);
}
/** music-box tine: sine + bell partials, quick attack, long decay */
function tine(f, t = 0, vol = 0.18, dest = out) {
  tone(f, { t, dur: 1.1, vol, a: 0.004, dest });
  tone(f * 4.02, { t, dur: 0.25, vol: vol * 0.22, a: 0.002, dest });
  tone(f * 2, { t, dur: 0.5, vol: vol * 0.18, type: "triangle", dest });
}
const hz = (semi) => 523.25 * Math.pow(2, semi / 12); // semitones from C5

let lastBlip = 0;
/** mascot talks: two tiny chirpy syllables */
export const blip = () => {
  if (!ok()) return;
  const n = performance.now(); if (n - lastBlip < 90) return; lastBlip = n;
  const b = 560 + Math.random() * 320;
  tone(b, { type: "triangle", dur: 0.07, vol: 0.13, to: b * 1.35 });
  tone(b * 1.18, { t: 0.085, dur: 0.08, vol: 0.11, type: "triangle", to: b * 0.92 });
};
/** piece snaps / button. Optional pitch multiplier. */
export const pop = (pitch = 1) => {
  if (!ok()) return;
  tone(760 * pitch, { dur: 0.13, vol: 0.32, to: 190 * pitch, toT: 0.1 });
  noise({ dur: 0.03, vol: 0.06, f: 3200, q: 0.7 });
};
/** pick up a piece */
export const pick = () => {
  if (!ok()) return;
  tone(380, { type: "triangle", dur: 0.1, vol: 0.16, to: 820, toT: 0.08 });
};
/** success: little music-box jingle */
export const win = () => {
  if (!ok()) return;
  [0, 4, 7, 12, 16].forEach((s, i) => tine(hz(s + 12), i * 0.1, 0.16));
  [12, 16, 19].forEach((s) => tine(hz(s + 12), 0.6, 0.1));
  tone(hz(36), { t: 0.62, dur: 0.6, vol: 0.03 });
};
/** bad guess: wah-wah-wah-waaah trombone */
export const sad = () => {
  if (!ok()) return;
  const notes = [[311, 0, 0.36], [294, 0.4, 0.36], [277, 0.8, 0.36], [262, 1.2, 1.1]];
  for (const [f, t, d] of notes) {
    const now = ac.currentTime + t;
    const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(f * 1.03, now); o.frequency.exponentialRampToValueAtTime(f, now + 0.08);
    if (d > 0.5) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 6; lg.gain.value = 7; l.connect(lg); lg.connect(o.frequency); l.start(now + 0.2); l.stop(now + d); }
    fl.type = "lowpass"; fl.Q.value = 6;
    fl.frequency.setValueAtTime(350, now); fl.frequency.exponentialRampToValueAtTime(1400, now + 0.12); fl.frequency.exponentialRampToValueAtTime(500, now + d);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.16, now + 0.04); g.gain.setValueAtTime(0.16, now + d - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(fl); fl.connect(g); g.connect(out); o.start(now); o.stop(now + d + 0.05);
  }
};
/** scene transition / map open */
export const whoosh = () => {
  if (!ok()) return;
  noise({ dur: 0.5, vol: 0.22, f: 280, fTo: 2600, q: 0.9, a: 0.18 });
};

/* ── extras (optional for other scenes) ── */
/** paper rip */
export const tear = () => {
  if (!ok()) return;
  for (let i = 0; i < 9; i++) noise({ t: i * 0.028 + Math.random() * 0.012, dur: 0.035, vol: 0.12 + Math.random() * 0.1, type: "highpass", f: 1800 + Math.random() * 2500, q: 0.6 });
  noise({ dur: 0.28, vol: 0.06, f: 2400, q: 0.5, a: 0.02 });
};
/** small crinkle tick while dragging paper */
export const crinkle = () => { if (ok()) noise({ dur: 0.025, vol: 0.06, type: "highpass", f: 3000 + Math.random() * 2000 }); };
/** wax seal crack: thump + crunch */
export const crack = () => {
  if (!ok()) return;
  tone(160, { dur: 0.16, vol: 0.4, to: 60 });
  for (let i = 0; i < 4; i++) noise({ t: i * 0.03, dur: 0.05, vol: 0.18, f: 1200 + i * 600, q: 1.5 });
};
/** "mwah" */
export const kiss = () => {
  if (!ok()) return;
  tone(260, { dur: 0.22, vol: 0.18, type: "triangle", to: 900, toT: 0.18 });
  noise({ t: 0.17, dur: 0.05, vol: 0.18, f: 2200, q: 2 });
};
/** pen scratch, for typing text */
export const scratch = () => { if (ok()) noise({ dur: 0.03, vol: 0.035, type: "bandpass", f: 3500 + Math.random() * 2500, q: 2 }); };
/** a single music-box note; i walks up a pentatonic scale */
export const chime = (i = 0) => {
  if (!ok()) return;
  const scale = [0, 2, 4, 7, 9];
  tine(hz(scale[i % 5] + 12 * Math.floor(i / 5)), 0, 0.17);
};
/** denied / nope: low double boop */
export const nope = () => {
  if (!ok()) return;
  tone(220, { type: "square", dur: 0.09, vol: 0.06 });
  tone(165, { t: 0.11, type: "square", dur: 0.14, vol: 0.06 });
};

/* ── mute + background music ── */
export const setMuted = (m) => {
  muted = !!m;
  try { localStorage.setItem("sfx-muted", muted ? "1" : "0"); } catch {}
  if (out) out.gain.setTargetAtTime(muted ? 0 : VOL, ac.currentTime, 0.02);
  syncButtons();
};
export const isMuted = () => muted;

// gentle music-box loop: [semitone from C5 | null, …] one per eighth note
const MELODY = [4, null, 7, 9, 7, null, 4, 2, 0, null, 2, 4, 2, null, null, null, 4, null, 7, 9, 12, null, 9, 7, 9, null, 7, 4, 7, null, null, null];
const BASS = [-12, -5, -8, -3];
function schedule() {
  if (!ac || !musicOn) return;
  while (nextNote < ac.currentTime + 0.6) {
    const t = nextNote - ac.currentTime;
    const n = MELODY[step % MELODY.length];
    if (n != null) tine(hz(n), Math.max(0, t), 0.07, musicBus);
    if (step % 8 === 0) tine(hz(BASS[(step / 8) % 4]), Math.max(0, t), 0.05, musicBus);
    step++; nextNote += 0.34;
  }
}
export const startMusic = () => {
  unlock();
  if (!ac || musicOn) return;
  musicOn = true; nextNote = ac.currentTime + 0.1;
  musicTimer = setInterval(schedule, 200); schedule(); syncButtons();
};
export const stopMusic = () => { musicOn = false; clearInterval(musicTimer); syncButtons(); };
export const toggleMusic = () => (musicOn ? stopMusic() : startMusic());
export const isMusicOn = () => musicOn;

/* ── the sticker buttons ── */
const INK = "#3b2f2f";
const speaker = `<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true"><path d="M7 15.5 L13 15 L21 8 Q22.5 7.6 22.6 9 L22.4 31 Q22 32.4 20.6 31.6 L13 25 L7 24.6 Q5.6 24.2 5.8 22.8 L6 17 Q6.2 15.6 7 15.5Z" fill="#fde0e6" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  <g class="on"><path d="M27 14 q4 6 0 12" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M31 10 q7 10 0 20" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/></g>
  <g class="off"><path d="M27 15 l8 10 M35 15 l-8 10" stroke="#e0728f" stroke-width="3" stroke-linecap="round"/></g></svg>`;
const note = `<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true"><path d="M15 29 L15.5 10 L32 6.5 L31.6 25" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="11.5" cy="29.5" rx="5" ry="4" fill="#f2a7b8" stroke="${INK}" stroke-width="2.2"/><ellipse cx="28" cy="26" rx="5" ry="4" fill="#f2a7b8" stroke="${INK}" stroke-width="2.2"/><path class="off" d="M6 6 L34 34" stroke="#e0728f" stroke-width="3" stroke-linecap="round"/></svg>`;
function syncButtons() {
  const m = document.querySelector(".sfx-mute"), mu = document.querySelector(".sfx-music");
  if (m) { m.classList.toggle("is-off", muted); m.setAttribute("aria-pressed", String(muted)); m.title = muted ? "sound off" : "sound on"; }
  if (mu) { mu.classList.toggle("is-off", !musicOn); mu.setAttribute("aria-pressed", String(musicOn)); mu.title = musicOn ? "music on" : "music off"; }
}
function mount() {
  if (document.querySelector(".sfx-toggles")) return;
  const w = document.createElement("div");
  w.className = "sfx-toggles";
  w.innerHTML = `<button class="sfx-btn sfx-mute" aria-label="toggle sound">${speaker}</button><button class="sfx-btn sfx-music" aria-label="toggle music">${note}</button>`;
  document.body.appendChild(w);
  w.querySelector(".sfx-mute").onclick = () => { setMuted(!muted); if (!muted) pop(); };
  w.querySelector(".sfx-music").onclick = () => toggleMusic();
  syncButtons();
}
if (typeof document !== "undefined") {
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
}
