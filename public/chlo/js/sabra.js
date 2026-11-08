// Year-in-numbers screens. Each one rains its picture down until the screen is full.
import { rainScene } from "./rain.js";

export const sabra = rainScene({
  total: 835, img: "assets/img/sabra.png", shape: "circle",
  sub: "sabra hummus bought this year",
});

export const gta = rainScene({
  total: 531, img: "assets/img/gta-mac.png", shape: "rect", label: "hours",
  sub: "of guess the asian played",
  punch: "(on opa night)",
  fill: 1.0, fillPhone: 1.3,
  zoomFrom: 4, spawnMs: 10000,
});

export const cheongsing = rainScene({
  total: 47, img: "assets/img/cheongsing.jpg", shape: "rect", spawnMs: 5000,
  sub: "cheong sing takeaways",
  fill: 0.95, fillPhone: 1.1,
});

export const skyjo = rainScene({
  total: 312, img: "assets/img/skyjo.png", shape: "rect",
  sub: "games of skyjo",
  fill: 1.0, fillPhone: 1.3,
});
