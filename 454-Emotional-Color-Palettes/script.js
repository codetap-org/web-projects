// --- Configuration & State ---
const canvas = document.getElementById("liquidCanvas");
const ctx = canvas.getContext("2d");

let width, height;
let particles = [];
let mouse = { x: 0, y: 0, isActive: false };

// predefined palettes (The CodePen Challenge "Heart")
// Each palette has 5 colors (or 6 as per challenge suggestion, but 5 is visually cleaner for this design)
const PALETTES = {
	joy: {
		name: "Joy",
		colors: ["#FFD166", "#FFD166", "#06D6A0", "#118AB2", "#EF476F"],
		bg: "#1a1a00" // Deep Gold/Dark Yellowish Black
	},
	serenity: {
		name: "Serenity",
		colors: ["#E0F7FA", "#B2EBF2", "#80DEEA", "#4DD0E1", "#26C6DA"],
		bg: "#001a1a" // Deep Teal Black
	},
	energy: {
		name: "Energy",
		colors: ["#FF5733", "#C70039", "#900C3F", "#FFC300", "#FF5733"],
		bg: "#1a0505" // Deep Red Black
	},
	melancholy: {
		name: "Melancholy",
		colors: ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"],
		bg: "#0a0a0f" // Deep Blue Black
	},
	mystery: {
		name: "Mystery",
		colors: ["#32004B", "#5D008F", "#8300D4", "#B400FE", "#E1ADFF"],
		bg: "#0f0016" // Deep Purple Black
	}
};

let currentPalette = PALETTES.joy;
const PARTICLE_COUNT = 150; // Increased for denser fluid

// --- Setup ---

function resize() {
	width = window.innerWidth;
	height = window.innerHeight;
	canvas.width = width;
	canvas.height = height;
}

window.addEventListener("resize", resize);
resize();

// --- Input Handling ---
// Mouse smoothing
let targetMouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
	targetMouse.x = e.clientX;
	targetMouse.y = e.clientY;
	mouse.isActive = true;
});

window.addEventListener("touchstart", (e) => {
	targetMouse.x = e.touches[0].clientX;
	targetMouse.y = e.touches[0].clientY;
	mouse.isActive = true;
});

window.addEventListener("touchend", () => {
	mouse.isActive = false;
});

// --- Particle Logic ---

// --- Color Interpolation Helper ---
function lerp(start, end, t) {
	return start * (1 - t) + end * t;
}

class Particle {
	constructor() {
		this.reset(true);
	}

	reset(initial = false) {
		this.x = Math.random() * width;
		this.y = Math.random() * height;

		// Organic organic movement (Perlin-ish via sine/cos later)
		this.vx = (Math.random() - 0.5) * 1.5;
		this.vy = (Math.random() - 0.5) * 1.5;

		this.radius = Math.random() * 50 + 30; // Larger particles for better merging
		this.baseRadius = this.radius;

		// Color State (RGB for smooth lerp)
		const hex = this.pickColor();
		this.targetRgb = hexToRgb(hex);
		this.currentRgb = { ...this.targetRgb }; // Clone

		this.angle = Math.random() * Math.PI * 2;
		this.speed = Math.random() * 0.01 + 0.005;
	}

	pickColor() {
		// Pick random color from current palette
		const colors = currentPalette.colors;
		return colors[Math.floor(Math.random() * colors.length)];
	}

	update() {
		// --- Color Transition ---
		// Smoothly interpolate current RGB to target RGB
		const lerpSpeed = 0.05; // 5% per frame
		this.currentRgb.r = lerp(this.currentRgb.r, this.targetRgb.r, lerpSpeed);
		this.currentRgb.g = lerp(this.currentRgb.g, this.targetRgb.g, lerpSpeed);
		this.currentRgb.b = lerp(this.currentRgb.b, this.targetRgb.b, lerpSpeed);

		// 1. Organic Float (Sine Wave Noise)
		this.angle += this.speed;
		this.vx += Math.cos(this.angle) * 0.02;
		this.vy += Math.sin(this.angle) * 0.02;

		// Friction to prevent over-speeding
		this.vx *= 0.98;
		this.vy *= 0.98;

		// Apply velocity
		this.x += this.vx;
		this.y += this.vy;

		// 2. Mouse Interaction (Repulsion)
		// Smooth mouse following
		mouse.x += (targetMouse.x - mouse.x) * 0.1;
		mouse.y += (targetMouse.y - mouse.y) * 0.1;

		if (mouse.isActive) {
			const dx = mouse.x - this.x;
			const dy = mouse.y - this.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const forceRadius = 300; // Large radius

			if (distance < forceRadius) {
				const force = (forceRadius - distance) / forceRadius;
				const angle = Math.atan2(dy, dx);

				// Repel drastically
				this.vx -= Math.cos(angle) * force * 1;
				this.vy -= Math.sin(angle) * force * 1;

				// Shrink slightly when pushed (visual feedback)
				// this.radius = this.baseRadius * (1 - force * 0.3);
			}
		}

		// return radius to normal
		this.radius += (this.baseRadius - this.radius) * 0.05;

		// 3. Screen Boundaries (Wrap around for fluid feel)
		const buffer = this.radius * 2;
		if (this.x < -buffer) this.x = width + buffer;
		if (this.x > width + buffer) this.x = -buffer;
		if (this.y < -buffer) this.y = height + buffer;
		if (this.y > height + buffer) this.y = -buffer;
	}

	draw() {
		ctx.beginPath();

		// Just draw simple circles, the CSS filter handles the blending/liquid look
		// Using gradient here is actually counter-productive to the 'flat' liquid look if we use strong blur+contrast.
		// But for 'glowing' liquid, gradient is good.
		// Let's stick to gradient for depth.

		const gradient = ctx.createRadialGradient(
			this.x,
			this.y,
			0,
			this.x,
			this.y,
			this.radius
		);

		// Construct CSS color string from current RGB values
		const colorString = `rgb(${Math.round(this.currentRgb.r)}, ${Math.round(
			this.currentRgb.g
		)}, ${Math.round(this.currentRgb.b)})`;

		gradient.addColorStop(0, colorString);
		gradient.addColorStop(0.7, colorString);
		gradient.addColorStop(1, "rgba(0,0,0,0)"); // Soft edge important for merging

		ctx.fillStyle = gradient;

		// 'screen' or 'lighter' is key for the glowing blobs
		ctx.globalCompositeOperation = "screen";
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalCompositeOperation = "source-over";
	}
}

function initParticles() {
	particles = [];
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		particles.push(new Particle());
	}
}

// --- Hex to RGB helper for Color Transition (Optional enhancement) ---
function hexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
		  }
		: null;
}

// --- Animation Loop ---

function animate() {
	// Clear with a trail effect for extra "fluidity"
	// ctx.clearRect(0, 0, width, height);

	// Use semi-transparent clear for trails?
	// Actually for 'blob' simulation we usually clear fully.
	ctx.clearRect(0, 0, width, height);

	// Update and draw particles
	particles.forEach((p) => {
		p.update();
		p.draw();
	});

	requestAnimationFrame(animate);
}

// --- UI Logic ---

const moodButtons = document.querySelectorAll(".mood-btn");
const swatchContainer = document.getElementById("paletteDisplay");
const swatches = swatchContainer.querySelectorAll(".swatch");

function setMood(moodKey) {
	if (!PALETTES[moodKey]) return;

	currentPalette = PALETTES[moodKey];

	// Update Active Button
	moodButtons.forEach((btn) => btn.classList.remove("active"));
	document.querySelector(`[data-mood="${moodKey}"]`)?.classList.add("active");

	// Update Background
	document.body.style.backgroundColor = currentPalette.bg;

	// Update Particles
	// To make it look cool, we assign each particle a random color from the NEW palette
	particles.forEach((p) => {
		const newHex = p.pickColor();
		p.targetRgb = hexToRgb(newHex);
		// We do NOT set currentRgb here, let it lerp naturally in update()
	});

	// Update Palette UI
	swatches.forEach((swatch, index) => {
		const color = currentPalette.colors[index % currentPalette.colors.length];
		swatch.style.setProperty("--color", color);
		swatch.querySelector("span").innerText = color;

		// Copy to clipboard feature
		swatch.onclick = () => {
			navigator.clipboard.writeText(color).then(() => {
				const span = swatch.querySelector("span");
				const oldText = span.innerText;
				span.innerText = "COPIED!";
				setTimeout(() => (span.innerText = oldText), 1000);
			});
		};
	});
}

// Initialize
moodButtons.forEach((btn) => {
	btn.addEventListener("click", () => {
		const mood = btn.getAttribute("data-mood");
		setMood(mood);
	});
});

initParticles();
setMood("joy"); // Default
animate();