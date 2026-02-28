var colorA = document.getElementById("colorA");
var colorB = document.getElementById("colorB");
var tracksEl = document.getElementById("tracks");
var presetsEl = document.getElementById("presets");

var spaces = [
	{ label: "srgb", css: "in srgb" },
	{ label: "hsl", css: "in hsl" },
	{ label: "hwb", css: "in hwb" },
	{ label: "oklab", css: "in oklab" },
	{ label: "oklch", css: "in oklch", highlight: true },
	{ label: "oklch longer", css: "in oklch longer hue", highlight: true },
	{ label: "lab", css: "in lab" },
	{ label: "lch", css: "in lch" }
];

var presets = [
	["#0066ff", "#ff6600"],
	["#e02050", "#20e0a0"],
	["#6020e0", "#e0e020"],
	["#ff0080", "#00ff80"],
	["#003366", "#ffcc00"]
];

var gradEls = [];

function buildTracks() {
	tracksEl.innerHTML = "";
	gradEls = [];
	for (var i = 0; i < spaces.length; i++) {
		var track = document.createElement("div");
		track.className = "track";

		var label = document.createElement("div");
		label.className = "track-label";
		if (spaces[i].highlight) {
			label.innerHTML = '<span class="highlight">' + spaces[i].label + "</span>";
		} else {
			label.textContent = spaces[i].label;
		}

		var grad = document.createElement("div");
		grad.className = "grad";

		track.appendChild(label);
		track.appendChild(grad);
		tracksEl.appendChild(track);
		gradEls.push(grad);
	}
}

function buildPresets() {
	presetsEl.innerHTML = "";
	for (var i = 0; i < presets.length; i++) {
		(function (p) {
			var btn = document.createElement("button");
			btn.className = "preset-btn";
			btn.setAttribute("aria-label", "Preset " + p[0] + " to " + p[1]);
			var h1 = document.createElement("div");
			h1.className = "preset-half";
			h1.style.backgroundColor = p[0];
			var h2 = document.createElement("div");
			h2.className = "preset-half";
			h2.style.backgroundColor = p[1];
			btn.appendChild(h1);
			btn.appendChild(h2);
			btn.addEventListener("click", function () {
				colorA.value = p[0];
				colorB.value = p[1];
				render();
			});
			presetsEl.appendChild(btn);
		})(presets[i]);
	}
}

function render() {
	var a = colorA.value;
	var b = colorB.value;
	for (var i = 0; i < spaces.length; i++) {
		gradEls[i].style.background =
			"linear-gradient(to right " + spaces[i].css + ", " + a + ", " + b + ")";
	}
}

buildTracks();
buildPresets();
render();

colorA.addEventListener("input", render);
colorB.addEventListener("input", render);