const minEl = document.getElementById("min");
const prefEl = document.getElementById("pref");
const maxEl = document.getElementById("max");
const vwEl = document.getElementById("vw");

const text = document.getElementById("text");
const curve = document.getElementById("curve");

const cssCode = document.getElementById("cssCode");
const jsCode = document.getElementById("jsCode");
const values = document.getElementById("values");

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function update() {
  const min = parseFloat(minEl.value);
  const pref = parseFloat(prefEl.value);
  const max = parseFloat(maxEl.value);
  const vw = parseFloat(vwEl.value);

  const prefPx = vw * (pref / 100);
  const size = clamp(prefPx, min, max);

  text.style.fontSize = size + "px";

  cssCode.innerHTML = `CSS<br><code>font-size: clamp(${min}px, ${pref}vw, ${max}px)</code>`;

  jsCode.innerHTML = `JS<br><code>Math.min(Math.max(v, ${min}), ${max})</code>`;

  values.innerHTML = `viewport = ${vw}px<br>
preferred = ${prefPx.toFixed(2)}px<br>
result = <b>${size.toFixed(2)}px</b>`;

  const points = [];

  for (let x = 0; x <= 100; x++) {
    const vwSim = 320 + (x / 100) * (1600 - 320);
    const val = clamp(vwSim * (pref / 100), min, max);

    const y = 100 - (val / max) * 100;

    points.push(`${x},${y}`);
  }

  curve.setAttribute("d", "M" + points.join(" L"));
}

[minEl, prefEl, maxEl, vwEl].forEach((e) =>
  e.addEventListener("input", update)
);

update();