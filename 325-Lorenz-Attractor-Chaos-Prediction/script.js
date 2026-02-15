const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

let particles = [];
let N = 50000;

const sigma = 10;
const rho = 28;
const beta = 8 / 3;
const dt = 0.005;

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function reset() {
	particles = [];
	for (let i = 0; i < N; i++) {
		particles.push({
			x: (Math.random() - 0.5) * 40,
			y: (Math.random() - 0.5) * 40,
			z: (Math.random() - 0.5) * 40
		});
	}
}

document.getElementById("slider").oninput = e => {
	N = +e.target.value;
	document.getElementById("count").textContent = N;
	reset();
};

document.getElementById("count").textContent = N;
reset();

function step() {
	ctx.fillStyle = "#111525";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.scale(8, 8);

	ctx.fillStyle = "#00ffaa";

	for (let p of particles) {
		const dx = sigma * (p.y - p.x);
		const dy = p.x * (rho - p.z) - p.y;
		const dz = p.x * p.y - beta * p.z;

		p.x += dx * dt;
		p.y += dy * dt;
		p.z += dz * dt;

		ctx.fillRect(p.x, p.z, 0.15, 0.15);
	}

	ctx.restore();
	requestAnimationFrame(step);
}

step();