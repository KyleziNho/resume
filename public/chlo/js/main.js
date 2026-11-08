// Scene flow: start → sabra → gta → cheongsing → skyjo (year in numbers) → intro → puzzle → geo → photobooth → finale.
// Every scene module exports `async function run(root, ctx)` and resolves when the scene is finished.
//   root  – an empty .scene <div> already attached to #stage; render everything inside it.
//   ctx   – shared helpers + state (see below). Scenes may add results to ctx.state.
import { CONFIG } from "../config.js";
import * as art from "./art.js";
import * as sfx from "./sfx.js";
import * as intro from "./intro.js";
import * as puzzle from "./puzzle.js";
import * as geo from "./geo.js";
import * as photobooth from "./photobooth.js";
import * as finale from "./finale.js";
import { sabra, gta, cheongsing, skyjo } from "./sabra.js";
import * as start from "./start.js";

const stage = document.getElementById("stage");
const mascotEl = document.getElementById("mascot");

let sayTimer;
const ctx = {
  config: CONFIG,
  art,   // SVG doodle helpers (strings)
  sfx,   // tiny WebAudio sound effects
  state: {
    puzzleTimeMs: 0,
    puzzleDifficulty: "",
    roundScores: [],   // numbers 0..5000, one per geo round
    kissesOwed: 0,     // hints "paid for" with kisses → redeemable coupons in finale
    photos: [],        // photobooth output: [{ type: "strip" | "polaroid", src: dataURL }] → tucked into the finale envelope
  },
  /** Mascot says something. ms=0 keeps it until the next say(). say("") hides it. */
  say(text, ms = 4000) {
    clearTimeout(sayTimer);
    if (!text) { mascotEl.hidden = true; return; }
    mascotEl.hidden = false;
    mascotEl.innerHTML = `<div class="mascot-face">${art.mascot()}</div><div class="bubble">${text}</div>`;
    sfx.blip();
    if (ms) sayTimer = setTimeout(() => (mascotEl.hidden = true), ms);
  },
  /** Pick a random item. Handy for funny line variety. */
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  /** Burst of petals/hearts at x,y (viewport px). */
  burst(x, y, n = 18) { art.burst(document.getElementById("fx"), x, y, n); },
};

async function play(mod) {
  const root = document.createElement("div");
  root.className = "scene";
  stage.appendChild(root);
  try {
    await mod.run(root, ctx);
  } catch (err) {
    console.error(err);
  }
  ctx.say("");
  root.classList.add("leaving");
  await new Promise((r) => setTimeout(r, 450));
  root.remove();
}

// Dev shortcut: index.html?scene=geo jumps straight to a scene.
const only = new URLSearchParams(location.search).get("scene");
const scenes = { start, intro, puzzle, geo, photobooth, sabra, gta, cheongsing, skyjo, finale };

(async () => {
  if (only && scenes[only]) {
    await play(scenes[only]);
    return;
  }
  for (const s of [start, sabra, gta, cheongsing, skyjo, intro, puzzle, geo, photobooth, finale]) await play(s);
})();
