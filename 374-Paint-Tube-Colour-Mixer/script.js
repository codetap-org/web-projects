const COLOR_POOL = [
	{ name: "Hot Pink", hex: "#E84EC8" },
	{ name: "Deep Purple", hex: "#5B2A8E" },
	{ name: "Magenta", hex: "#C0228A" },
	{ name: "Golden", hex: "#C9A825" },
	{ name: "Forest", hex: "#1D7B1D" },
	{ name: "Royal Blue", hex: "#2E40A0" },
	{ name: "Lime", hex: "#8DB81A" },
	{ name: "Orchid", hex: "#E060C0" },
	{ name: "Dark Green", hex: "#2D6E18" },
	{ name: "Cyan", hex: "#18D0D0" },
	{ name: "Vermillion", hex: "#E8401A" },
	{ name: "Tangerine", hex: "#F07820" },
	{ name: "Cobalt", hex: "#1255CC" },
	{ name: "Scarlet", hex: "#D01030" },
	{ name: "Olive", hex: "#7A8818" },
	{ name: "Teal", hex: "#0A9B8A" },
	{ name: "Raspberry", hex: "#C0154A" },
	{ name: "Sky", hex: "#28A8E0" },
	{ name: "Ochre", hex: "#CC8A10" },
	{ name: "Indigo", hex: "#3820A8" },
	{ name: "Jade", hex: "#00A06A" },
	{ name: "Coral", hex: "#F05040" },
	{ name: "Plum", hex: "#8B1A6B" },
	{ name: "Amber", hex: "#F0A800" },
	{ name: "Crimson", hex: "#B80020" },
	{ name: "Cerulean", hex: "#0068C8" },
	{ name: "Chartreuse", hex: "#78C800" },
	{ name: "Fuchsia", hex: "#D8108C" },
	{ name: "Viridian", hex: "#188060" },
	{ name: "Saffron", hex: "#F8B800" },
	{ name: "Ultramarine", hex: "#1428B8" },
	{ name: "Carmine", hex: "#D81840" },
	{ name: "Turquoise", hex: "#00C8A8" },
	{ name: "Burnt Orange", hex: "#D84800" },
	{ name: "Electric Blue", hex: "#0050F0" },
	{ name: "Neon Green", hex: "#40D820" },
	{ name: "Wine", hex: "#6A0830" },
	{ name: "Aqua", hex: "#10C8C0" },
	{ name: "Sunflower", hex: "#F8C800" },
	{ name: "Violet", hex: "#7010C0" }
];

const PALETTE_SIZE = 8;

function hexToRgbObj(hex) {
	return {
		r: parseInt(hex.slice(1, 3), 16),
		g: parseInt(hex.slice(3, 5), 16),
		b: parseInt(hex.slice(5, 7), 16)
	};
}

function pickPalette() {
	// Sample PALETTE_SIZE unique colors from the pool
	const pool = [...COLOR_POOL];
	const picked = [];
	for (let i = 0; i < PALETTE_SIZE; i++) {
		const j = Math.floor(Math.random() * pool.length);
		const c = pool.splice(j, 1)[0];
		picked.push({ ...c, ...hexToRgbObj(c.hex) });
	}
	return picked;
}

let TUBES = pickPalette();

const MAX_PER_TUBE = 8;
const CANVAS_W = 260,
	CANVAS_H = 260;

let counts = new Array(PALETTE_SIZE).fill(0);
let total = 0;
let blobList = []; // for canvas redraw

const canvas = document.getElementById("mixCanvas");
const ctx = canvas.getContext("2d");

// ══════════════════════════════════════════
//  BUILD TUBES UI
// ══════════════════════════════════════════
const rack = document.getElementById("tubesRack");

function buildTubes() {
	rack.innerHTML = "";
	TUBES.forEach((t, i) => {
		const wrap = document.createElement("div");
		wrap.className = "tube-wrap";
		wrap.id = `tube-${i}`;
		wrap.title = `${t.name}\nClick to add`;
		if (counts[i] > 0) wrap.classList.add("used");

		wrap.innerHTML = `
      <div class="tube">
        <div class="tube-body" style="background:linear-gradient(160deg,${lighten(
									t.hex,
									30
								)} 0%,${t.hex} 45%,${darken(t.hex, 20)} 100%)"></div>
        <div class="tube-crimp"></div>
        <div class="tube-neck"></div>
        <div class="tube-cap"></div>
        <div class="tube-shine"></div>
      </div>
      <div class="tube-count" id="count-${i}">${counts[i] || ""}</div>
      <div class="tube-name">${t.name}</div>
    `;

		wrap.addEventListener("click", () => addDrop(i, wrap));
		rack.appendChild(wrap);
	});
}

function shuffleTubes() {
	// Pick a completely fresh set of colours
	TUBES = pickPalette();
	counts = new Array(PALETTE_SIZE).fill(0);

	// Animate tubes jumping out before rebuild
	Array.from(rack.children).forEach((el) => el.classList.add("shuffling"));
	setTimeout(() => buildTubes(), 260);
}

buildTubes();

// ══════════════════════════════════════════
//  ADD DROP
// ══════════════════════════════════════════
function addDrop(i, wrapEl) {
	if (counts[i] >= MAX_PER_TUBE) return;

	counts[i]++;
	total++;

	// Animate tube squeeze via CSS
	const tubeEl = wrapEl.querySelector(".tube");
	tubeEl.style.transition = "transform 0.1s ease";
	tubeEl.style.transform = "translateY(4px) scaleY(0.93)";
	setTimeout(() => {
		tubeEl.style.transform = "";
	}, 150);

	// Update count badge
	wrapEl.classList.add("used");
	document.getElementById(`count-${i}`).textContent = counts[i];

	// Flying splat from tube to bowl
	const tubeRect = wrapEl.getBoundingClientRect();
	const bowlRect = document.getElementById("bowlOuter").getBoundingClientRect();
	spawnSplat(
		tubeRect.left + tubeRect.width / 2,
		tubeRect.top + tubeRect.height * 0.2,
		bowlRect,
		TUBES[i].hex
	);

	// Draw blob after flight delay
	setTimeout(() => paintBlob(i), 300);
	document.getElementById("emptyMsg").style.opacity = "0";
}

function spawnSplat(x, y, bowlRect, hex) {
	const el = document.createElement("div");
	el.className = "splat";
	el.style.cssText = `left:${x}px;top:${y}px;background:${hex};`;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 700);

	// second splat at bowl landing
	setTimeout(() => {
		const bx = bowlRect.left + bowlRect.width / 2 + (Math.random() - 0.5) * 50;
		const by = bowlRect.top + bowlRect.height / 2 + (Math.random() - 0.5) * 50;
		const el2 = document.createElement("div");
		el2.className = "splat";
		el2.style.cssText = `left:${bx}px;top:${by}px;width:30px;height:30px;background:${hex};`;
		document.body.appendChild(el2);
		setTimeout(() => el2.remove(), 600);
	}, 250);
}

// ══════════════════════════════════════════
//  CANVAS PAINT BLOBS
// ══════════════════════════════════════════
function paintBlob(tubeIdx) {
	const t = TUBES[tubeIdx];
	const cx = CANVAS_W / 2,
		cy = CANVAS_H / 2,
		R = CANVAS_W / 2 - 2;

	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, R, 0, Math.PI * 2);
	ctx.clip();

	// White base on first drop so canvas isn't transparent
	if (blobList.length === 0) {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
	}

	// Large splodge: radius 55–95px fills the bowl visibly
	const bx = cx + (Math.random() - 0.5) * R * 0.65;
	const by = cy + (Math.random() - 0.5) * R * 0.65;
	const br = 55 + Math.random() * 40;

	ctx.save();
	ctx.translate(bx, by);
	const sx = 0.85 + Math.random() * 0.5;
	const sy = 0.85 + Math.random() * 0.5;
	ctx.scale(sx, sy);

	ctx.globalCompositeOperation = "source-over";

	// Soft halo edge
	const halo = ctx.createRadialGradient(0, 0, br * 0.2, 0, 0, br);
	halo.addColorStop(0, hexToRgba(t.hex, 0.78));
	halo.addColorStop(0.6, hexToRgba(t.hex, 0.55));
	halo.addColorStop(1, hexToRgba(t.hex, 0));
	ctx.fillStyle = halo;
	ctx.beginPath();
	ctx.arc(0, 0, br, 0, Math.PI * 2);
	ctx.fill();

	// Solid opaque centre
	ctx.fillStyle = hexToRgba(t.hex, 0.92);
	ctx.beginPath();
	ctx.arc(0, 0, br * 0.42, 0, Math.PI * 2);
	ctx.fill();

	ctx.restore();
	ctx.restore();

	blobList.push({ tubeIdx, bx, by, br, sx, sy });
	updateMix();
}

function redrawCanvas() {
	const cx = CANVAS_W / 2,
		cy = CANVAS_H / 2,
		R = CANVAS_W / 2 - 2;
	ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
	if (blobList.length === 0) return;
	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, R, 0, Math.PI * 2);
	ctx.clip();
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
	ctx.restore();
	blobList.forEach((b) => {
		const t = TUBES[b.tubeIdx];
		ctx.save();
		ctx.beginPath();
		ctx.arc(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W / 2 - 4, 0, Math.PI * 2);
		ctx.clip();
		ctx.save();
		ctx.translate(b.bx, b.by);
		ctx.scale(b.sx || 1, b.sy || 1);
		const halo = ctx.createRadialGradient(0, 0, b.br * 0.2, 0, 0, b.br);
		halo.addColorStop(0, hexToRgba(t.hex, 0.78));
		halo.addColorStop(0.6, hexToRgba(t.hex, 0.55));
		halo.addColorStop(1, hexToRgba(t.hex, 0));
		ctx.fillStyle = halo;
		ctx.beginPath();
		ctx.arc(0, 0, b.br, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = hexToRgba(t.hex, 0.92);
		ctx.beginPath();
		ctx.arc(0, 0, b.br * 0.42, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
		ctx.restore();
	});
}

// ══════════════════════════════════════════
//  MIX CALCULATION
// ══════════════════════════════════════════
function updateMix() {
	if (total === 0) {
		document.getElementById("resultHex").textContent = "#——";
		document.getElementById("resultSwatch").style.background = "var(--paper2)";
		document.getElementById("snippetCode").innerHTML =
			'<span style="color:var(--rule)">// squeeze tubes to see formula</span>';
		document.getElementById("btnClear").classList.remove("active");
		return;
	}

	let tr = 0,
		tg = 0,
		tb = 0;
	counts.forEach((c, i) => {
		if (c === 0) return;
		tr += TUBES[i].r * c;
		tg += TUBES[i].g * c;
		tb += TUBES[i].b * c;
	});
	tr = Math.round(tr / total);
	tg = Math.round(tg / total);
	tb = Math.round(tb / total);

	const hex = rgbToHex(tr, tg, tb);
	document.getElementById("resultHex").textContent = hex;
	document.getElementById("resultHex").style.color = hex;
	document.getElementById("resultSwatch").style.background = hex;
	document.getElementById(
		"resultSwatch"
	).style.boxShadow = `0 4px 24px ${hexToRgba(
		hex,
		0.4
	)}, inset 0 1px 0 rgba(255,255,255,0.3)`;

	updateSnippet(hex);

	document.getElementById("btnClear").classList.add("active");
}

function updateSnippet(finalHex) {
	const used = TUBES.filter((_, i) => counts[i] > 0);
	if (used.length === 0) return;

	// Build progressive color-mix chain
	let lines = [`<span class="snippet-prop">background</span>: `];

	if (used.length === 1) {
		lines.push(`<span class="snippet-val">${used[0].hex}</span>;`);
	} else {
		// nest color-mix calls
		const weights = used.map((t) => {
			const idx = TUBES.indexOf(t);
			return { hex: t.hex, w: counts[idx] / total };
		});

		let expr = `<span class="snippet-val">${weights[0].hex}</span>`;
		for (let i = 1; i < weights.length; i++) {
			const pct = Math.round(weights[i].w * 100);
			expr = `<span class="snippet-fn">color-mix</span>(in oklab,\n  ${expr},\n  <span class="snippet-val">${weights[i].hex}</span> ${pct}%)`;
		}
		lines.push(expr + ";");
	}
	lines.push(`\n/* → <span class="snippet-val">${finalHex}</span> */`);
	document.getElementById("snippetCode").innerHTML = lines.join("");
}

// ══════════════════════════════════════════
//  CLEAR & PALETTE
// ══════════════════════════════════════════
function clearBowl() {
	counts = new Array(PALETTE_SIZE).fill(0);
	total = 0;
	blobList = [];
	ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
	document
		.querySelectorAll(".tube-wrap")
		.forEach((w) => w.classList.remove("used"));
	document
		.querySelectorAll(".tube-count")
		.forEach((el, i) => (el.textContent = "0"));
	document.getElementById("emptyMsg").style.opacity = "1";
	updateMix();
}

// ══════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════
function copyHex() {
	const hex = document.getElementById("resultHex").textContent;
	if (hex === "#——") return;
	copyToClipboard(hex);
}

function copyToClipboard(text) {
	navigator.clipboard.writeText(text).catch(() => {});
	showToast(`Copied ${text}`);
}

function showToast(msg) {
	const t = document.getElementById("toast");
	t.textContent = msg;
	t.classList.add("show");
	setTimeout(() => t.classList.remove("show"), 2200);
}

function rgbToHex(r, g, b) {
	return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgba(hex, alpha) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex, amount) {
	let [r, g, b] = hexToRgbArr(hex);
	return rgbToHex(
		Math.min(255, r + amount),
		Math.min(255, g + amount),
		Math.min(255, b + amount)
	);
}
function darken(hex, amount) {
	let [r, g, b] = hexToRgbArr(hex);
	return rgbToHex(
		Math.max(0, r - amount),
		Math.max(0, g - amount),
		Math.max(0, b - amount)
	);
}
function hexToRgbArr(hex) {
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16)
	];
}