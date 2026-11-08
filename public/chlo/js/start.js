// Start screen: a big wobbling Sabra tub. Waits for the recap images to load,
// then tapping it pops the tub and kicks off the hummus rain.
const PRELOAD = ["assets/img/sabra.png", "assets/img/gta-mac.png", "assets/img/cheongsing.jpg", "assets/img/skyjo.png"];
const load = (src) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = src; });

export async function run(root, ctx) {
  root.classList.add("st-scene");
  root.innerHTML = `
    <h1 class="st-title">chlo simulator</h1>
    <button class="st-tub" aria-label="start" disabled>
      <img src="assets/img/sabra.png" alt="" draggable="false">
    </button>
    <p class="st-hint">loading…</p>`;
  const tub = root.querySelector(".st-tub"), hint = root.querySelector(".st-hint");

  await Promise.all([...PRELOAD.map(load), document.fonts?.ready]);
  tub.disabled = false;
  root.classList.add("ready");
  hint.textContent = "tap the hummus to start";

  await new Promise((r) => tub.addEventListener("click", r, { once: true }));
  ctx.sfx.pop?.();
  const b = tub.getBoundingClientRect();
  ctx.burst(b.left + b.width / 2, b.top + b.height / 2, 24);
  root.classList.add("go");
  await new Promise((r) => setTimeout(r, 650));
}
