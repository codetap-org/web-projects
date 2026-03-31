const scene = document.getElementById("scene");
const W = () => window.innerWidth;
const H = () => window.innerHeight;
const crossY = () => H() * 0.5;
const crossHalf = 55;
const stopGap = 26;

const laneXs = [W() * 0.415, W() * 0.463, W() * 0.537, W() * 0.585];

const vehicles = [];
const people = [];

let verticalPower = 0;
let horizontalPower = 0;
let crossingMode = false;
let lastMouseX = W() / 2;
let lastMouseY = H() / 2;
let lastMoveTime = performance.now();

function createVehicle(type, laneIndex, y, speed, cls) {
	const el = document.createElement("div");
	el.className = `vehicle ${type} ${cls}`;
	el.innerHTML = `
      <div class="body"></div>
      <div class="roof"></div>
      <div class="windowTop"></div>
      <div class="windowBottom"></div>
      <div class="wheel w1"></div>
      <div class="wheel w2"></div>
      <div class="wheel w3"></div>
      <div class="wheel w4"></div>
    `;
	scene.appendChild(el);

	const direction = laneIndex < 2 ? -1 : 1;
	const h = type === "bus" ? 88 : 64;

	const vehicle = {
		el,
		laneIndex,
		x: laneXs[laneIndex],
		y,
		baseSpeed: speed * direction,
		currentSpeed: speed * direction,
		w: type === "bus" ? 42 : 36,
		h,
		waiting: false
	};

	vehicles.push(vehicle);
	return vehicle;
}

function createPerson(side, offset, palette) {
	const el = document.createElement("div");
	el.className = "person";
	el.innerHTML = `
      <div class="head"></div>
      <div class="body"></div>
      <div class="legs"></div>
    `;
	el.querySelector(".body").style.background = palette;
	scene.appendChild(el);

	const p = {
		el,
		side,
		row: offset,
		x:
			side === "left"
				? W() * 0.39 - 70 - offset * 18
				: W() * 0.61 + 70 + offset * 18,
		y: crossY() + ((offset % 3) - 1) * 16,
		targetX: 0,
		speed: 0,
		phase: Math.random() * Math.PI * 2
	};

	people.push(p);
	return p;
}

function resetPeopleTargets() {
	people.forEach((p) => {
		p.targetX = crossingMode
			? p.side === "left"
				? W() * 0.61 + 70
				: W() * 0.39 - 70
			: p.side === "left"
			? W() * 0.39 - 70
			: W() * 0.61 + 70;

		p.speed = 1.1 + Math.random() * 0.7;
	});
}

function init() {
	createVehicle("car", 0, H() * 0.18, 1.8, "car1");
	createVehicle("bus", 1, H() * 0.48, 1.2, "bus");
	createVehicle("car", 0, H() * 0.78, 1.6, "car2");
	createVehicle("car", 1, H() * 0.92, 1.9, "car3");
	createVehicle("bus", 2, H() * 0.16, 1.05, "bus");
	createVehicle("car", 3, H() * 0.35, 1.7, "car4");
	createVehicle("car", 2, H() * 0.68, 1.5, "car2");
	createVehicle("car", 3, H() * 0.88, 1.85, "car1");

	createPerson("left", 0, "#6a5cff");
	createPerson("left", 1, "#ff6b6b");
	createPerson("left", 2, "#ffd84d");
	createPerson("right", 0, "#00c2a8");
	createPerson("right", 1, "#ff8c42");
	createPerson("right", 2, "#8d6bff");

	resetPeopleTargets();
}

function applyPositions() {
	vehicles.forEach((v) => {
		v.x = laneXs[v.laneIndex];
		v.el.style.left = `${v.x}px`;
		v.el.style.top = `${v.y}px`;
	});

	people.forEach((p) => {
		p.el.style.left = `${p.x}px`;
		p.el.style.top = `${
			p.y + Math.sin(performance.now() * 0.01 + p.phase) * 0.6
		}px`;
	});
}

function resizeAll() {
	laneXs[0] = W() * 0.415;
	laneXs[1] = W() * 0.463;
	laneXs[2] = W() * 0.537;
	laneXs[3] = W() * 0.585;

	people.forEach((p, i) => {
		if (!crossingMode) {
			p.x =
				p.side === "left"
					? W() * 0.39 - 70 - (i % 3) * 18
					: W() * 0.61 + 70 + (i % 3) * 18;
		}
		p.y = crossY() + ((i % 3) - 1) * 16;
	});

	applyPositions();
}

function getStopLine(v) {
	if (v.baseSpeed < 0) {
		return crossY() + crossHalf + stopGap + v.h / 2;
	}
	return crossY() - crossHalf - stopGap - v.h / 2;
}

function vehicleWouldEnterCrosswalk(v, nextY) {
	const front = nextY + (v.baseSpeed < 0 ? -v.h / 2 : v.h / 2);
	const crossTop = crossY() - crossHalf;
	const crossBottom = crossY() + crossHalf;

	if (v.baseSpeed < 0) {
		return front <= crossBottom && v.y > crossBottom;
	}

	return front >= crossTop && v.y < crossTop;
}

function updateVehicles() {
	vehicles.forEach((v) => {
		if (crossingMode) {
			const stopLine = getStopLine(v);
			const desired = 0;

			if (v.baseSpeed < 0) {
				if (v.y <= stopLine) {
					v.waiting = true;
					v.y = stopLine;
					v.currentSpeed += (desired - v.currentSpeed) * 0.22;
					v.currentSpeed = 0;
				} else {
					v.waiting = false;
					const slowTarget = Math.max(v.baseSpeed * 0.9, -2.2);
					v.currentSpeed += (slowTarget - v.currentSpeed) * 0.08;
					const nextY = v.y + v.currentSpeed;
					if (vehicleWouldEnterCrosswalk(v, nextY)) {
						v.y = stopLine;
						v.currentSpeed = 0;
						v.waiting = true;
					} else {
						v.y = nextY;
					}
				}
			} else {
				if (v.y >= stopLine) {
					v.waiting = true;
					v.y = stopLine;
					v.currentSpeed += (desired - v.currentSpeed) * 0.22;
					v.currentSpeed = 0;
				} else {
					v.waiting = false;
					const slowTarget = Math.min(v.baseSpeed * 0.9, 2.2);
					v.currentSpeed += (slowTarget - v.currentSpeed) * 0.08;
					const nextY = v.y + v.currentSpeed;
					if (vehicleWouldEnterCrosswalk(v, nextY)) {
						v.y = stopLine;
						v.currentSpeed = 0;
						v.waiting = true;
					} else {
						v.y = nextY;
					}
				}
			}
		} else {
			v.waiting = false;
			const extra = verticalPower * 4;
			const target = v.baseSpeed + extra;
			v.currentSpeed += (target - v.currentSpeed) * 0.08;
			v.y += v.currentSpeed;
		}

		if (!crossingMode) {
			if (v.currentSpeed < 0 && v.y < -120) v.y = H() + 120;
			if (v.currentSpeed > 0 && v.y > H() + 120) v.y = -120;
		} else {
			if (v.baseSpeed < 0 && v.y < -120) v.y = H() + 120;
			if (v.baseSpeed > 0 && v.y > H() + 120) v.y = -120;
		}
	});
}

function updatePeople() {
	people.forEach((p, i) => {
		const dx = p.targetX - p.x;

		if (Math.abs(dx) > 1) {
			p.x += Math.sign(dx) * p.speed;
		}

		if (crossingMode) {
			const offsetY = ((i % 3) - 1) * 16;
			p.y += (crossY() + offsetY - p.y) * 0.12;
		} else {
			const homeY = crossY() + ((i % 3) - 1) * 16;
			p.y += (homeY - p.y) * 0.08;
		}
	});
}

scene.addEventListener("mousemove", (e) => {
	const now = performance.now();
	const dx = e.clientX - lastMouseX;
	const dy = e.clientY - lastMouseY;
	const dt = Math.max(16, now - lastMoveTime);

	horizontalPower = Math.max(-1, Math.min(1, (dx / dt) * 9));
	verticalPower = Math.max(-1, Math.min(1, (dy / dt) * 9));

	const nextCrossingMode =
		Math.abs(horizontalPower) > Math.abs(verticalPower) &&
		Math.abs(horizontalPower) > 0.12;

	if (nextCrossingMode !== crossingMode) {
		crossingMode = nextCrossingMode;
		resetPeopleTargets();
	}

	lastMouseX = e.clientX;
	lastMouseY = e.clientY;
	lastMoveTime = now;
});

scene.addEventListener("mouseleave", () => {
	verticalPower = 0;
	horizontalPower = 0;
	crossingMode = false;
	resetPeopleTargets();
});

function loop() {
	updateVehicles();
	updatePeople();
	applyPositions();
	requestAnimationFrame(loop);
}

init();
resizeAll();
loop();

window.addEventListener("resize", resizeAll);