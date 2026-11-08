// GeoGuessr scene: "where in the world were we?"
// Street View (Maps JS API when CONFIG.googleMapsKey is set, keyless embed as fallback),
// a folded paper Leaflet map to guess on, kiss-funded hints, and a handwritten scoreboard.

const MAX = 5000;
const SCALE_KM = 1.5; // tight: right city ≠ right street

/* ───────────────────────── funny lines ───────────────────────── */
const ladder = (n) => [
  [0.05, ["perfect. are you stalking me? 😳", "right on top of it 🎯"]],
  [0.2, [`${n}, how?? 😳`, "suspiciously accurate 👀"]],
  [2, ["so close 😌", "basically a local"]],
  [50, ["close-ish, i'll allow it 🤏", "right area at least"]],
  [500, ["hmm, not quite", `${n}… you were there with me 😐`]],
  [3000, ["wrong country?? 😭", "aiyo."]],
  [Infinity, ["was the map upside down? 🙃", `wrong continent, ${n}`]],
];
const RECEIPTS = [
  "a hint costs <b>1 kiss</b> 💋",
  "another one? <b>+1 kiss</b> 🤨",
  "adding it to your tab. <b>+1 kiss</b> 😏",
  "last one, this is basically cheating. <b>+1 kiss</b> 🔍",
];
const BROKE_LINES = ["no hints left, you're on your own 🧠"];

/* ───────────────────────── tiny helpers ───────────────────────── */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function haversineKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
const scoreFor = (km, scale) => Math.round(MAX * Math.exp(-km / scale));
function fmtKm(km) {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}
const reactionFor = (km, pick, name) => pick(ladder(name).find(([lim]) => km < lim)[1]);
const NO_MEMORY = ["another dot on our map ♡", "i'd go back here with you"];

function continentOf({ lat, lng }) {
  if (lat < -10 && lng > 110) return "Oceania 🦘";
  if (lat > -12 && lng > 60 && lng <= 180) return "Asia 🥢";
  if (lat > 35 && lng > -25 && lng <= 60) return "Europe 🥐";
  if (lat > -36 && lat <= 37 && lng > -20 && lng <= 52) return "Africa 🦒";
  if (lat > 35 && lng > 25 && lng <= 60) return "Asia 🥢";
  if (lat > 12 && lng > -170 && lng <= -50) return "North America 🍔";
  if (lng > -82 && lng <= -34) return "South America 🦙";
  if (lat < -60) return "Antarctica 🐧 (??)";
  return "somewhere with a lot of water 🌊";
}
// rough boxes as an offline fallback for the "country" hint
const COUNTRY_BOXES = [
  ["Singapore 🇸🇬", 1.15, 1.48, 103.6, 104.1],
  ["Malaysia 🇲🇾", 0.85, 7.4, 99.6, 119.3],
  ["Taiwan 🇹🇼", 21.8, 25.4, 119.9, 122.1],
  ["Hong Kong 🇭🇰", 22.15, 22.57, 113.82, 114.45],
  ["Japan 🇯🇵", 24, 45.6, 129, 146],
  ["South Korea 🇰🇷", 33, 38.6, 125.5, 129.6],
  ["Thailand 🇹🇭", 5.6, 20.5, 97.3, 105.7],
  ["United Kingdom 🇬🇧", 49.8, 60.9, -8.7, 1.8],
  ["China 🇨🇳", 18, 53.6, 73.5, 135],
];
async function countryOf(r) {
  if (r.country) return r.country;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&accept-language=en&lat=${r.lat}&lon=${r.lng}`, { signal: ctl.signal });
    const j = await res.json();
    if (j?.address?.country) return j.address.country;
  } catch { /* offline: fall through */ }
  const hit = COUNTRY_BOXES.find(([, a, b, c, d]) => r.lat >= a && r.lat <= b && r.lng >= c && r.lng <= d);
  return hit ? hit[0] : "the internet won't say 😅";
}

// roughjs should be global (index.html), but load it ourselves if that script failed.
let roughPromise;
function ensureRough() {
  if (window.rough) return Promise.resolve(window.rough);
  roughPromise ||= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js";
    s.onload = () => resolve(window.rough);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return roughPromise;
}

/* ───────────────────────── Street View backends ───────────────────────── */
let mapsApiPromise;
function loadMapsApi(key) {
  if (window.google?.maps?.StreetViewPanorama) return Promise.resolve(window.google.maps);
  mapsApiPromise ||= new Promise((resolve, reject) => {
    const cb = "__geoMapsReady" + Date.now();
    window[cb] = () => google.maps.importLibrary("streetView").then(() => resolve(google.maps), reject);
    window.gm_authFailure = () => reject(new Error("Maps API auth failure"));
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => reject(new Error("Maps API failed to load"));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error("Maps API timeout")), 12000);
  });
  return mapsApiPromise;
}

async function mountGooglePano(host, r, key) {
  const gm = await loadMapsApi(key);
  const div = el(`<div class="geo-gpano"></div>`);
  host.appendChild(div);
  // Prefer Google's own outdoor imagery right at the spot; fall back to any outdoor pano nearby.
  const svc = new gm.StreetViewService(), S = gm.StreetViewSource;
  const find = (radius, sources) => svc.getPanorama({
    location: { lat: r.lat, lng: r.lng }, radius, sources, preference: gm.StreetViewPreference.NEAREST,
  });
  const { data } = await find(60, [S.GOOGLE, S.OUTDOOR]).catch(() => find(250, [S.OUTDOOR]));
  new gm.StreetViewPanorama(div, {
    pano: data.location.pano,
    pov: { heading: r.heading || 0, pitch: 0 }, zoom: 0,
    addressControl: false, showRoadLabels: false, fullscreenControl: false,
    enableCloseButton: false, motionTracking: false, motionTrackingControl: false,
    linksControl: true, panControl: true, zoomControl: true, clickToGo: true,
  });
  return { labelCovered: false };
}

function mountEmbed(host, r) {
  // Keyless: legacy svembed URL (301s to google.com/maps/embed?pb=!6m7…, which is frameable).
  const src = `https://maps.google.com/maps?layer=c&cbll=${r.lat},${r.lng}&cbp=12,${r.heading || 0},0,0,0&output=svembed`;
  host.insertAdjacentHTML("beforeend", `
    <iframe class="geo-sv" src="${src}" title="street view" allow="accelerometer *; gyroscope *" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe>
    <div class="geo-peek-note" aria-hidden="true"><i class="tape yellow"></i>no peeking 🙈<small>(the answer was here)</small></div>
    <div class="geo-credit-tape tape mint" aria-hidden="true">✿ photos by google ✿</div>`);
  return { labelCovered: true };
}

/* ───────────────────────── markup ───────────────────────── */
function sceneMarkup(rounds) {
  return `
  <div class="geo">
    <header class="geo-strip">
      <h2 class="geo-strip-title">where in the world<br><span>were we?</span></h2>
      <ol class="geo-rounds">
        ${rounds.map((r, i) => `
          <li class="geo-mini" data-i="${i}" style="--tilt:${[-4, 3, -2, 4, -3][i % 5]}deg">
            <div class="geo-mini-photo">${i + 1}</div>
            <div class="geo-mini-score">?</div>
          </li>`).join("")}
      </ol>
      <div class="geo-strip-right">
        <div class="geo-total">total: <b>0</b></div>
        <button class="btn alt geo-hint-btn" type="button">hint <span class="nowrap">(1 kiss 💋)</span></button>
        <div class="geo-kisses">kisses owed: <b>0</b> 💋</div>
      </div>
    </header>

    <section class="geo-viewer">
      <i class="tape tl"></i><i class="tape mint tr"></i><i class="tape yellow bl"></i><i class="tape br"></i>
      <div class="geo-view-slot"></div>
      <div class="geo-round-label"></div>
      <ul class="geo-hints"></ul>
    </section>

    <aside class="geo-map-card" aria-label="guess map">
      <div class="geo-map-head">
        <span class="geo-map-name">📍 our map <small>(open me)</small></span>
        <button class="geo-map-close" type="button" aria-label="fold the map">fold ✕</button>
      </div>
      <div class="geo-map-wrap">
        <div class="geo-map"></div>
        <div class="geo-map-creases"></div>
        <svg class="geo-rough"></svg>
      </div>
      <button class="btn green geo-guess" type="button" disabled>drop a pin first 📍</button>
    </aside>

    <div class="geo-result" hidden></div>
    <div class="geo-modal" hidden></div>
  </div>`;
}

/* ───────────────────────── the scene ───────────────────────── */
export async function run(root, ctx) {
  const { config, art, sfx, state, say, pick } = ctx;
  const rounds = (config.rounds || []).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
  if (!rounds.length) return;
  state.roundScores = [];
  const name = config.herName || "babe";

  root.innerHTML = sceneMarkup(rounds);
  const $ = (s) => root.querySelector(s);
  const card = $(".geo-map-card"), mapEl = $(".geo-map"), roughSvg = $(".geo-rough");
  const slot = $(".geo-view-slot"), guessBtn = $(".geo-guess"), hintBtn = $(".geo-hint-btn");
  const resultEl = $(".geo-result"), modal = $(".geo-modal"), hintList = $(".geo-hints");

  /* ── map ── */
  const homeView = [[28, 70], 2];
  ensureRough();
  const map = L.map(mapEl, { zoomControl: true, worldCopyJump: true, attributionControl: true, tap: true }).setView(...homeView);
  // (CARTO raster basemaps now need an API key and serve a placeholder without one; OSM is keyless)
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  map.attributionControl.setPrefix(false);
  const ro = new ResizeObserver(() => { map.invalidateSize({ animate: false }); drawRough(); });
  ro.observe(mapEl);

  const pinIcon = L.divIcon({ className: "geo-pin", html: art.pin(40), iconSize: [40, 40], iconAnchor: [20, 40] });
  const flowerIcon = (i) => L.divIcon({
    className: "geo-truth", html: `${i % 2 ? art.lily(52) : art.peony(52)}<span>here!</span>`, iconSize: [52, 52], iconAnchor: [26, 26],
  });

  let guessMarker = null, truthMarker = null, hintCircle = null, line = null;
  let roundState = null; // { r, i, done, resolveGuess }

  const touchy = () => matchMedia("(hover: none), (max-width: 700px)").matches;
  const openMap = (on = true) => {
    if (card.classList.contains("open") === on) return;
    card.classList.toggle("open", on);
    if (on) sfx.whoosh();
  };
  $(".geo-map-close").addEventListener("click", (e) => { e.stopPropagation(); openMap(false); });
  card.addEventListener("pointerdown", () => { if (touchy() && !card.classList.contains("result")) openMap(true); });
  card.addEventListener("mouseenter", () => { if (!touchy() && !card.classList.contains("result")) sfx.whoosh(); });

  function placeGuess(latlng) {
    if (!roundState || roundState.done) return;
    if (guessMarker) guessMarker.setLatLng(latlng);
    else guessMarker = L.marker(latlng, { icon: pinIcon, keyboard: false }).addTo(map);
    guessMarker.getElement()?.classList.remove("plop"); void guessMarker.getElement()?.offsetWidth;
    guessMarker.getElement()?.classList.add("plop");
    guessBtn.disabled = false;
    guessBtn.textContent = "lock it in 💘";
    sfx.pop();
  }
  map.on("click", (e) => {
    // On touch, the first tap only unfolds the mini map.
    if (touchy() && !card.classList.contains("open")) return;
    placeGuess(e.latlng);
  });

  function drawRough() {
    roughSvg.innerHTML = "";
    if (!line || !window.rough) return;
    const a = map.latLngToContainerPoint(line[0]), b = map.latLngToContainerPoint(line[1]);
    const rc = window.rough.svg(roughSvg);
    const opts = { roughness: 2.2, bowing: 4, stroke: "#e0728f", strokeWidth: 3, seed: 7, strokeLineDash: [10, 7] };
    roughSvg.appendChild(rc.line(a.x, a.y, b.x, b.y, opts));
    roughSvg.appendChild(rc.line(a.x, a.y, b.x, b.y, { ...opts, stroke: "#3b2f2f", strokeWidth: 1.2, seed: 11, strokeLineDash: undefined, roughness: 2.8 }));
  }
  map.on("move zoom viewreset", drawRough);

  /* ── scoreboard ── */
  const minis = [...root.querySelectorAll(".geo-mini")];
  const results = [];
  const renderStrip = (cur) => {
    minis.forEach((m, i) => {
      m.classList.toggle("current", i === cur);
      const res = results[i];
      m.classList.toggle("done", !!res);
      if (res) m.querySelector(".geo-mini-score").textContent = res.score.toLocaleString();
    });
    $(".geo-total b").textContent = state.roundScores.reduce((a, b) => a + b, 0).toLocaleString();
    $(".geo-kisses b").textContent = state.kissesOwed;
  };

  /* ── modal (custom confirm, never window.confirm) ── */
  function ask(html, yes, no) {
    return new Promise((resolve) => {
      modal.innerHTML = `<div class="card geo-modal-card"><i class="tape"></i><p>${html}</p>
        <div class="geo-modal-btns"><button class="btn" data-v="1">${yes}</button><button class="btn alt" data-v="0">${no}</button></div></div>`;
      modal.hidden = false;
      modal.onclick = (e) => {
        const b = e.target.closest("button[data-v]");
        if (!b && e.target !== modal) return;
        modal.hidden = true; modal.onclick = null;
        resolve(b?.dataset.v === "1");
      };
    });
  }

  /* ── hints ── */
  async function buyHint() {
    if (!roundState || roundState.done) return;
    const n = roundState.hints;
    if (n >= 4) { say(pick(BROKE_LINES), 3500); return; }
    const ok = await ask(RECEIPTS[n], n === 0 ? "deal 😙" : "fine 💋", "no thanks");
    if (!ok) { say(pick(["confident, i like it 😤"]), 2500); return; }
    if (!roundState || roundState.done) return;
    const { r } = roundState;
    roundState.hints++;
    state.kissesOwed++;
    renderStrip(roundState.i);
    sfx.pop();
    const b = hintBtn.getBoundingClientRect();
    ctx.burst(b.left + b.width / 2, b.top + b.height / 2, 10);

    let text;
    if (n === 0) text = `continent: <b>${esc(r.continent || continentOf(r))}</b>`;
    else if (n === 1) { addHint("country: <i>asking the internet…</i>"); text = `country: <b>${esc(await countryOf(r))}</b>`; hintList.lastElementChild.remove(); }
    else if (n === 2) {
      const place = (r.answer || "??").split(",")[0].trim();
      text = `it starts with <b>“${esc(place[0])}…”</b> (${place.replace(/[^\p{L}\p{N}]/gu, "").length} letters/numbers)`;
    } else {
      // dashed circle somewhere around (not centred on!) the answer
      const radius = 1200;
      const ang = (roundState.i * 2.39) % (Math.PI * 2), off = (radius * 0.55) / 111320;
      const c = [r.lat + off * Math.sin(ang), r.lng + (off * Math.cos(ang)) / Math.cos((r.lat * Math.PI) / 180)];
      hintCircle = L.circle(c, { radius, color: "#e0728f", weight: 3, dashArray: "8 8", fillColor: "#f2a7b8", fillOpacity: 0.18 }).addTo(map);
      openMap(true);
      setTimeout(() => map.flyToBounds(hintCircle.getBounds(), { duration: 1.2, padding: [10, 10] }), 350);
      text = `it's in the <b>pink circle</b> 🔍`;
    }
    addHint(text);
    say(pick(["added to your tab 😏"]), 2500);
    if (roundState.hints >= 4) { hintBtn.disabled = true; hintBtn.textContent = "no hints left 🔒"; }
  }
  function addHint(html) {
    const li = el(`<li style="--tilt:${(Math.random() * 6 - 3).toFixed(1)}deg">${html}</li>`);
    hintList.appendChild(li);
  }
  hintBtn.addEventListener("click", buyHint);

  /* ── dev aid: "g" = perfect guess ── */
  const onKey = (e) => {
    if (e.key !== "g" || e.metaKey || e.ctrlKey || e.altKey || !roundState || roundState.done || !modal.hidden) return;
    placeGuess(L.latLng(roundState.r.lat, roundState.r.lng));
    guessBtn.click();
  };
  window.addEventListener("keydown", onKey);

  guessBtn.addEventListener("click", () => {
    if (!roundState || roundState.done || !guessMarker) return;
    roundState.resolveGuess(guessMarker.getLatLng());
  });

  /* ── view: street view ── */
  async function showView(r) {
    slot.innerHTML = "";
    const host = el(`<div class="geo-sv-host"><div class="geo-sv-loading">loading… 🛵</div></div>`);
    slot.appendChild(host);
    if (config.googleMapsKey) {
      try { await mountGooglePano(host, r, config.googleMapsKey); return; }
      catch (err) { console.warn("[geo] Maps API failed, using keyless embed:", err); host.querySelector(".geo-gpano")?.remove(); }
    }
    mountEmbed(host, r);
  }

  /* ── result card ── */
  function showResult({ r, i, guess, km, score }) {
    const flower = i % 2 ? art.lily(70) : art.peony(70);
    const last = i === rounds.length - 1;
    resultEl.innerHTML = `
      <div class="card geo-result-card" style="--tilt:${i % 2 ? 1.5 : -1.5}deg">
        <i class="tape tl"></i><i class="tape mint tr"></i>
        <div class="geo-res-top">
          <div class="geo-res-score"><b>${score.toLocaleString()}</b><small>/ ${MAX.toLocaleString()}</small></div>
          <div class="geo-res-dist">${guess ? `you were <b>${fmtKm(km)}</b> away` : "no guess? 😭"}</div>
        </div>
        <div class="geo-meter"><i style="width:${(score / MAX) * 100}%"></i></div>
        <div class="geo-res-answer">it was: <span class="scribble-underline">${esc(r.answer || "here!")}</span></div>
        <div class="geo-memory">
          <div class="geo-memory-flower">${flower}</div>
          <p>${esc(r.memory || pick(NO_MEMORY))}</p>
        </div>
        <button class="btn geo-next" type="button">${last ? "how did i do →" : "next one →"}</button>
      </div>`;
    resultEl.hidden = false;
    return new Promise((res) => resultEl.querySelector(".geo-next").addEventListener("click", () => { sfx.pop(); res(); }, { once: true }));
  }

  /* ── one round ── */
  async function playRound(r, i) {
    roundState = { r, i, done: false, hints: 0 };
    renderStrip(i);
    resultEl.hidden = true;
    hintList.innerHTML = "";
    hintBtn.disabled = false;
    hintBtn.innerHTML = `hint <span class="nowrap">(1 kiss 💋)</span>`;
    guessBtn.disabled = true;
    guessBtn.textContent = "drop a pin first 📍";
    card.classList.remove("result", "open");
    roughSvg.innerHTML = ""; line = null;
    [guessMarker, truthMarker, hintCircle].forEach((m) => m && m.remove());
    guessMarker = truthMarker = hintCircle = null;
    map.setView(...homeView, { animate: false });
    $(".geo-round-label").textContent = r.title || `Round ${i + 1}`;

    await showView(r);
    say(pick(["wawaWEWA", "bumhole", "WAWAWEEEWA"]), 4500);

    const guess = await new Promise((resolve) => (roundState.resolveGuess = resolve));
    roundState.done = true;
    guessBtn.disabled = true;
    hintBtn.disabled = true;

    const truth = L.latLng(r.lat, r.lng);
    const km = haversineKm(guess, truth);
    const score = scoreFor(km, r.scaleKm || SCALE_KM);
    state.roundScores.push(score);
    results[i] = { score, km };

    // reveal on the big map
    card.classList.remove("open");
    card.classList.add("result");
    truthMarker = L.marker(truth, { icon: flowerIcon(i), keyboard: false, zIndexOffset: 500 }).addTo(map);
    line = [guess, truth];
    await sleep(380); // let the card grow first
    map.invalidateSize({ animate: false });
    await ensureRough();
    if (km < 0.03) map.setView(truth, 16, { animate: true });
    else map.fitBounds(L.latLngBounds([guess, truth]), { padding: [60, 60], maxZoom: 17, animate: true });
    drawRough();
    roughSvg.classList.remove("draw"); void roughSvg.getBoundingClientRect(); roughSvg.classList.add("draw");

    say(reactionFor(km, pick, name), 5200);
    if (score >= 2500) {
      sfx.win();
      window.confetti?.({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ["#f2a7b8", "#e0728f", "#f6d36b", "#8fb38a", "#fff7f0"] });
    } else if (km > 50) sfx.sad(); else sfx.pop();
    renderStrip(i);
    const m = minis[i]; m.classList.remove("stamped"); void m.offsetWidth; m.classList.add("stamped");

    await showResult({ r, i, guess, km, score });
    resultEl.hidden = true;
  }

  /* ── summary ── */
  async function summary() {
    const total = state.roundScores.reduce((a, b) => a + b, 0), max = MAX * rounds.length;
    const pct = total / max;
    const title = pct > 0.8 ? "human GPS 🛰️" : pct > 0.55 ? "great travel buddy 🧳" : pct > 0.3 ? "cute but lost 🧭" : "very lost (ily) 🙈";
    const kisses = state.kissesOwed;
    card.classList.add("hide");
    hintBtn.hidden = true;
    slot.innerHTML = "";
    $(".geo-round-label").textContent = "the results are in";
    hintList.innerHTML = "";
    renderStrip(-1);
    resultEl.innerHTML = `
      <div class="card geo-result-card geo-summary">
        <i class="tape tl"></i><i class="tape mint tr"></i><i class="tape yellow bl"></i>
        <div class="geo-sum-stamp">${art.stamp("★", 84)}</div>
        <h2>total score</h2>
        <div class="geo-sum-total"><b>${total.toLocaleString()}</b> <small>/ ${max.toLocaleString()}</small></div>
        <div class="geo-sum-title">rank: <span class="scribble-underline">${title}</span></div>
        <ol class="geo-sum-list">
          ${rounds.map((r, i) => `<li><span>${esc((r.answer || `round ${i + 1}`).split(",")[0])}</span><b>${(results[i]?.score ?? 0).toLocaleString()}</b></li>`).join("")}
        </ol>
        <p class="geo-sum-kiss">${kisses ? `you owe me <b>${kisses} kiss${kisses > 1 ? "es" : ""}</b> 💋` : "no hints used. impressive 💋"}</p>
        <p class="geo-sum-cash">points = photobooth credits 📸</p>
        <button class="btn geo-next" type="button">cash in 🎟️</button>
      </div>`;
    resultEl.hidden = false;
    say(pct > 0.55 ? "you know all our places 🥹" : `guess we'll just have to travel more, ${name} ✈️`, 5000);
    const b = resultEl.querySelector(".geo-sum-total").getBoundingClientRect();
    ctx.burst(b.left + b.width / 2, b.top + b.height / 2, 26);
    window.confetti?.({ particleCount: 140, spread: 100, origin: { y: 0.55 }, colors: ["#f2a7b8", "#e0728f", "#f6d36b", "#8fb38a"] });
    sfx.win();
    await new Promise((res) => resultEl.querySelector(".geo-next").addEventListener("click", res, { once: true }));
    sfx.pop();
  }

  try {
    for (let i = 0; i < rounds.length; i++) {
      await playRound(rounds[i], i);
    }
    roundState = null;
    await summary();
  } finally {
    window.removeEventListener("keydown", onKey);
    ro.disconnect();
    map.remove();
  }
}
