import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/addons/controls/OrbitControls.js";
import {
	CSS2DRenderer,
	CSS2DObject
} from "https://esm.sh/three/addons/renderers/CSS2DRenderer.js";

// --- setup scene: mystical twilight ambiance ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617); // deep indigo night
scene.fog = new THREE.FogExp2(0x020617, 0.006);

// camera with dramatic angle
const camera = new THREE.PerspectiveCamera(
	48,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.set(9, 6.5, 11);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// CSS2 labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.left = "0px";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

// --- controls with auto-rotate optional but disabled for better user control ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.8;
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.rotateSpeed = 0.9;
controls.target.set(0, 1.4, 0);

// --- LIGHTS: otherworldly dual tone ---
const ambientLight = new THREE.AmbientLight(0x1a1a2e);
scene.add(ambientLight);

// main directional light (moonlight)
const moonLight = new THREE.DirectionalLight(0x88aaff, 0.85);
moonLight.position.set(-3, 8, 4);
moonLight.castShadow = true;
moonLight.receiveShadow = false;
moonLight.shadow.mapSize.width = 1024;
moonLight.shadow.mapSize.height = 1024;
scene.add(moonLight);

// warm fill from fire side (right/east)
const warmFill = new THREE.PointLight(0xff6633, 0.9);
warmFill.position.set(5, 1.8, 1);
scene.add(warmFill);

// cool fill from water side (west)
const coolFill = new THREE.PointLight(0x3388ff, 0.85);
coolFill.position.set(-5, 1.5, -1);
scene.add(coolFill);

// dynamic central glow (steam clash)
const clashGlow = new THREE.PointLight(0xcc88ff, 0.6);
clashGlow.position.set(0, 1.2, 0);
scene.add(clashGlow);

// back rim light
const rimLight = new THREE.PointLight(0xffaa66, 0.5);
rimLight.position.set(2, 3, -6);
scene.add(rimLight);

// --- TERRAIN: dramatic fractured valley with two distinct basins ---
const width = 20;
const depth = 22;
const segments = 160;
const terrainGeo = new THREE.PlaneGeometry(width, depth, segments, segments);
terrainGeo.rotateX(-Math.PI / 2);

const positions = terrainGeo.attributes.position.array;
// sculpt a central rift with opposite sloping channels
for (let i = 0; i < positions.length; i += 3) {
	let x = positions[i];
	let z = positions[i + 2];
	let y = 0;

	// central mountain ridge along Z axis with asymmetry
	const ridgeFactor = Math.sin(x * 0.9) * 0.35 * Math.exp(-Math.abs(x) * 0.4);
	y += ridgeFactor;

	// undulating base
	y += Math.sin(x * 1.3) * 0.12 * Math.cos(z * 0.7);
	y += Math.sin(z * 1.1) * 0.1;

	// --- FIRE CHANNEL (north-east zone: positive Z and sloping eastward) ---
	// region: z between 2.5 and 6, x between -3 and 6
	if (z > 2.2 && z < 6.2) {
		let trenchDepth = 0.35 * (1 - Math.abs(z - 4.2) / 3.0);
		trenchDepth = Math.max(0, trenchDepth);
		// eastward slope: lower as x increases
		let slope = (x + 2) * -0.09;
		slope = Math.min(0.1, Math.max(-0.7, slope));
		y += slope * trenchDepth;
		y -= 0.2 * trenchDepth;
		// add glowing ember texture effect via height
	}

	// --- WATER CHANNEL (south-west zone: negative Z, sloping westward) ---
	// region: z between -6 and -2, x between -5 and 4
	if (z < -1.8 && z > -6.5) {
		let trenchDepth = 0.4 * (1 - Math.abs(z + 4.0) / 3.2);
		trenchDepth = Math.max(0, trenchDepth);
		// westward slope: lower as x decreases
		let slope = x * 0.08;
		slope = Math.min(0.2, Math.max(-0.65, -slope));
		y += slope * trenchDepth;
		y -= 0.25 * trenchDepth;
	}

	// additional small craters for drama
	y += Math.sin(x * 2.4) * 0.04 * Math.cos(z * 2.2);

	// clamp
	y = Math.min(1.3, Math.max(-0.85, y));
	positions[i + 1] = y;
}
terrainGeo.computeVertexNormals();

// multitexture material: custom shader-like appearance with two-tone vertex colors? Use standard material with emissive map feel
const terrainMat = new THREE.MeshStandardMaterial({
	color: 0x2c1e2a,
	roughness: 0.65,
	metalness: 0.25,
	emissive: 0x1a0f18,
	emissiveIntensity: 0.2
});
const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
terrainMesh.receiveShadow = true;
terrainMesh.castShadow = true;
scene.add(terrainMesh);

// add decorative glowing cracks on fire side
const crackGeo = new THREE.BufferGeometry();
const crackVertices = [];
for (let i = 0; i < 800; i++) {
	let x = 2 + Math.random() * 6;
	let z = 2.5 + Math.random() * 3.8;
	let y = -0.15 + Math.sin(x * 1.5) * 0.05;
	crackVertices.push(x, y, z);
}
crackGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(new Float32Array(crackVertices), 3)
);
const crackPoints = new THREE.Points(
	crackGeo,
	new THREE.PointsMaterial({
		color: 0xff7733,
		size: 0.045,
		transparent: true,
		blending: THREE.AdditiveBlending
	})
);
scene.add(crackPoints);

// --- FIRE STREAM: intense lava particles flowing EAST (+X) ---
const fireCount = 2400;
const fireParticleGeo = new THREE.BufferGeometry();
const firePosArray = new Float32Array(fireCount * 3);
const fireData = [];
// fire region along Z: 2.5 to 5.8
for (let i = 0; i < fireCount; i++) {
	let x = -5 + Math.random() * 11;
	let z = 3.0 + Math.random() * 3.2;
	let y = -0.2 + Math.sin(x) * 0.1 + (x + 3) * -0.07;
	y = Math.max(-0.45, Math.min(0.25, y));
	firePosArray[i * 3] = x;
	firePosArray[i * 3 + 1] = y + 0.08;
	firePosArray[i * 3 + 2] = z;
	fireData.push({
		speedX: 0.024 + Math.random() * 0.014,
		driftZ: (Math.random() - 0.5) * 0.008,
		resetX: -6.2,
		baseZ: z
	});
}
fireParticleGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(firePosArray, 3)
);
const fireMat = new THREE.PointsMaterial({
	color: 0xff5533,
	size: 0.11,
	transparent: true,
	blending: THREE.AdditiveBlending,
	opacity: 0.95
});
const fireSystem = new THREE.Points(fireParticleGeo, fireMat);
scene.add(fireSystem);

// secondary fire: sparks (faster, smaller)
const sparkCount = 1500;
const sparkGeo = new THREE.BufferGeometry();
const sparkPos = new Float32Array(sparkCount * 3);
const sparkVel = [];
for (let i = 0; i < sparkCount; i++) {
	let x = -4.5 + Math.random() * 10;
	let z = 2.8 + Math.random() * 3.5;
	let y = -0.1 + Math.random() * 0.4;
	sparkPos[i * 3] = x;
	sparkPos[i * 3 + 1] = y;
	sparkPos[i * 3 + 2] = z;
	sparkVel.push({ speedX: 0.032, resetX: -6.5, resetZ: z });
}
sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
const sparkMat = new THREE.PointsMaterial({
	color: 0xff8844,
	size: 0.065,
	blending: THREE.AdditiveBlending,
	transparent: true
});
const sparkSystem = new THREE.Points(sparkGeo, sparkMat);
scene.add(sparkSystem);

// --- WATER STREAM: fluid particles flowing WEST (-X) ---
const waterCount = 2600;
const waterParticleGeo = new THREE.BufferGeometry();
const waterPosArray = new Float32Array(waterCount * 3);
const waterData = [];
// water channel region: z between -5.5 and -1.8
for (let i = 0; i < waterCount; i++) {
	let x = 6 - Math.random() * 12;
	let z = -3.2 + Math.random() * 2.8;
	let y = -0.25 + Math.cos(x * 1.2) * 0.08;
	if (z < -1.5 && z > -5) y -= 0.1;
	waterPosArray[i * 3] = x;
	waterPosArray[i * 3 + 1] = y + 0.07;
	waterPosArray[i * 3 + 2] = z;
	waterData.push({
		speedX: -0.022 + Math.random() * -0.008,
		driftZ: (Math.random() - 0.5) * 0.007,
		resetX: 7.0,
		baseZ: z
	});
}
waterParticleGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(waterPosArray, 3)
);
const waterMatPoints = new THREE.PointsMaterial({
	color: 0x44bbff,
	size: 0.1,
	transparent: true,
	blending: THREE.AdditiveBlending,
	opacity: 0.85
});
const waterSystem = new THREE.Points(waterParticleGeo, waterMatPoints);
scene.add(waterSystem);

// water mist / droplets (extra)
const mistCount = 1800;
const mistGeo = new THREE.BufferGeometry();
const mistPos = new Float32Array(mistCount * 3);
const mistVel = [];
for (let i = 0; i < mistCount; i++) {
	let x = 5 - Math.random() * 11;
	let z = -3.0 + Math.random() * 3.2;
	let y = -0.1 + Math.random() * 0.35;
	mistPos[i * 3] = x;
	mistPos[i * 3 + 1] = y;
	mistPos[i * 3 + 2] = z;
	mistVel.push({ speedX: -0.018, resetX: 6.8 });
}
mistGeo.setAttribute("position", new THREE.BufferAttribute(mistPos, 3));
const mistMat = new THREE.PointsMaterial({
	color: 0x88ddff,
	size: 0.055,
	transparent: true,
	opacity: 0.6,
	blending: THREE.AdditiveBlending
});
const mistSystem = new THREE.Points(mistGeo, mistMat);
scene.add(mistSystem);

// --- STEAM CLOUDS (collision zone) dynamic swirl ---
const steamCount = 1400;
const steamCloudGeo = new THREE.BufferGeometry();
const steamPositions = new Float32Array(steamCount * 3);
for (let i = 0; i < steamCount; i++) {
	steamPositions[i * 3] = (Math.random() - 0.5) * 9;
	steamPositions[i * 3 + 1] = 0.2 + Math.random() * 1.1;
	steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 7;
}
steamCloudGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(steamPositions, 3)
);
const steamMaterial = new THREE.PointsMaterial({
	color: 0xcceeff,
	size: 0.085,
	transparent: true,
	opacity: 0.45,
	blending: THREE.AdditiveBlending
});
const steamParticles = new THREE.Points(steamCloudGeo, steamMaterial);
scene.add(steamParticles);

// --- dynamic glowing orbs along the streams for direction emphasis ---
const orbCount = 40;
const orbGroup = [];
for (let i = 0; i < orbCount; i++) {
	const isFire = i < 20;
	const color = isFire ? 0xff6633 : 0x3399ff;
	const sphereGeo = new THREE.SphereGeometry(0.08, 8, 8);
	const mat = new THREE.MeshStandardMaterial({
		color: color,
		emissive: color,
		emissiveIntensity: 0.7
	});
	const orb = new THREE.Mesh(sphereGeo, mat);
	orb.userData = {
		type: isFire ? "fire" : "water",
		progress: Math.random(),
		speed: 0.003 + Math.random() * 0.002
	};
	scene.add(orb);
	orbGroup.push(orb);
}

// --- decorative LAVA RIVERBED glowing strip ---
const lavaRibbonGeo = new THREE.BufferGeometry();
const ribbonPoints = [];
for (let x = -4.5; x <= 6.5; x += 0.12) {
	let z = 3.7 + Math.sin(x * 1.2) * 0.2;
	let y = -0.25 + (x + 3) * -0.08;
	ribbonPoints.push(x, y, z);
}
lavaRibbonGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(new Float32Array(ribbonPoints), 3)
);
const ribbonMat = new THREE.PointsMaterial({
	color: 0xff5533,
	size: 0.07,
	blending: THREE.AdditiveBlending
});
const lavaRibbon = new THREE.Points(lavaRibbonGeo, ribbonMat);
scene.add(lavaRibbon);

const waterRibbonGeo = new THREE.BufferGeometry();
const waterRibbonPoints = [];
for (let x = -5; x <= 6; x += 0.12) {
	let z = -3.2 + Math.cos(x * 1.1) * 0.2;
	let y = -0.2 + x * 0.05;
	waterRibbonPoints.push(x, y, z);
}
waterRibbonGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(new Float32Array(waterRibbonPoints), 3)
);
const waterRibbonMat = new THREE.PointsMaterial({
	color: 0x44aaff,
	size: 0.07,
	blending: THREE.AdditiveBlending
});
const waterRibbon = new THREE.Points(waterRibbonGeo, waterRibbonMat);
scene.add(waterRibbon);

// --- CSS2D LABELS (elegant)---
function addLabel(text, color, pos, fontSize = "0.85rem") {
	const div = document.createElement("div");
	div.textContent = text;
	div.style.color = color;
	div.style.fontFamily = "'Segoe UI', 'Orbitron', monospace";
	div.style.fontWeight = "bold";
	div.style.fontSize = fontSize;
	div.style.textShadow = "0 0 8px black";
	div.style.background = "rgba(0,0,0,0.5)";
	div.style.padding = "5px 14px";
	div.style.borderRadius = "40px";
	div.style.backdropFilter = "blur(8px)";
	div.style.borderLeft = `3px solid ${color}`;
	div.style.borderRight = `1px solid ${color}`;
	const label = new CSS2DObject(div);
	label.position.copy(pos);
	scene.add(label);
}

addLabel(
	"🔥 INFERNO CURRENT → EAST",
	"#ff8855",
	new THREE.Vector3(5.2, 1.5, 4.2),
	"0.8rem"
);
addLabel(
	"💧 AQUA DRIFT → WEST",
	"#55bbff",
	new THREE.Vector3(-5.5, 1.3, -3.8),
	"0.8rem"
);
addLabel(
	"🌀 ELEMENTAL FRONTIER",
	"#ffccaa",
	new THREE.Vector3(0, 1.4, 0.2),
	"0.75rem"
);
addLabel(
	"⟳ OPPOSING DYNAMICS",
	"#aa99ff",
	new THREE.Vector3(2, 2.0, -1.5),
	"0.7rem"
);

// --- floating runes / particles ambiance ---
const runeCount = 800;
const runeGeo = new THREE.BufferGeometry();
const runePos = new Float32Array(runeCount * 3);
for (let i = 0; i < runeCount; i++) {
	runePos[i * 3] = (Math.random() - 0.5) * 18;
	runePos[i * 3 + 1] = Math.random() * 1.6;
	runePos[i * 3 + 2] = (Math.random() - 0.5) * 16;
}
runeGeo.setAttribute("position", new THREE.BufferAttribute(runePos, 3));
const runeMatPoints = new THREE.PointsMaterial({
	color: 0xaa99cc,
	size: 0.045,
	transparent: true,
	opacity: 0.35
});
const runeField = new THREE.Points(runeGeo, runeMatPoints);
scene.add(runeField);

// --- Animation update: particles moving opposite directions + orb motion ---
let timeAcc = 0;

function updateParticles() {
	// Fire stream update (east)
	const fireAttr = fireSystem.geometry.attributes.position.array;
	for (let i = 0; i < fireCount; i++) {
		let idx = i * 3;
		fireAttr[idx] += fireData[i].speedX;
		fireAttr[idx + 2] += fireData[i].driftZ;
		if (fireAttr[idx] > 7.2) {
			fireAttr[idx] = fireData[i].resetX;
			fireAttr[idx + 2] = fireData[i].baseZ + (Math.random() - 0.5) * 1.5;
			let newY = -0.2 + (fireAttr[idx] + 3) * -0.07;
			fireAttr[idx + 1] = newY + 0.1 + Math.random() * 0.15;
		}
		if (fireAttr[idx + 2] > 6.2) fireAttr[idx + 2] = 2.5;
		if (fireAttr[idx + 2] < 2.2) fireAttr[idx + 2] = 5.8;
	}
	fireSystem.geometry.attributes.position.needsUpdate = true;

	const sparkAttr = sparkSystem.geometry.attributes.position.array;
	for (let i = 0; i < sparkCount; i++) {
		sparkAttr[i * 3] += 0.034;
		if (sparkAttr[i * 3] > 7.3) sparkAttr[i * 3] = -6.2;
		sparkAttr[i * 3 + 1] = -0.15 + Math.sin(timeAcc * 5 + i) * 0.1;
	}
	sparkSystem.geometry.attributes.position.needsUpdate = true;

	// Water stream update (west)
	const waterAttr = waterSystem.geometry.attributes.position.array;
	for (let i = 0; i < waterCount; i++) {
		let idx = i * 3;
		waterAttr[idx] += waterData[i].speedX;
		waterAttr[idx + 2] += waterData[i].driftZ;
		if (waterAttr[idx] < -7.0) {
			waterAttr[idx] = waterData[i].resetX;
			waterAttr[idx + 2] = waterData[i].baseZ + (Math.random() - 0.5) * 1.2;
			let newY = -0.2 + waterAttr[idx] * 0.055;
			waterAttr[idx + 1] = newY + 0.08;
		}
		if (waterAttr[idx + 2] > -1.3) waterAttr[idx + 2] = -5.2;
		if (waterAttr[idx + 2] < -6.2) waterAttr[idx + 2] = -2.0;
	}
	waterSystem.geometry.attributes.position.needsUpdate = true;

	const mistAttr = mistSystem.geometry.attributes.position.array;
	for (let i = 0; i < mistCount; i++) {
		mistAttr[i * 3] -= 0.019;
		if (mistAttr[i * 3] < -7.2) mistAttr[i * 3] = 6.8;
	}
	mistSystem.geometry.attributes.position.needsUpdate = true;

	// Steam cloud animation: gentle drift and rotation
	const steamAttr = steamParticles.geometry.attributes.position.array;
	for (let i = 0; i < steamCount; i++) {
		steamAttr[i * 3] += Math.sin(timeAcc + i) * 0.002;
		steamAttr[i * 3 + 1] += 0.001;
		steamAttr[i * 3 + 2] += Math.cos(timeAcc * 0.7 + i) * 0.0015;
		if (steamAttr[i * 3 + 1] > 1.4) steamAttr[i * 3 + 1] = 0.1;
		if (Math.abs(steamAttr[i * 3]) > 6)
			steamAttr[i * 3] = (Math.random() - 0.5) * 7;
		if (Math.abs(steamAttr[i * 3 + 2]) > 5.5)
			steamAttr[i * 3 + 2] = (Math.random() - 0.5) * 5;
	}
	steamParticles.geometry.attributes.position.needsUpdate = true;

	// animate orbs along stream directions
	orbGroup.forEach((orb) => {
		if (orb.userData.type === "fire") {
			orb.userData.progress += orb.userData.speed;
			let t = orb.userData.progress;
			let x = -5 + (t % 1.2) * 10;
			if (x > 6.5) orb.userData.progress = 0;
			let z = 3.5 + Math.sin(x * 1.5) * 0.3;
			let y = -0.2 + (x + 3) * -0.06;
			orb.position.set(x, y + 0.15, z);
			orb.material.emissiveIntensity = 0.5 + Math.sin(timeAcc * 8) * 0.3;
		} else {
			orb.userData.progress += orb.userData.speed;
			let t = orb.userData.progress;
			let x = 6 - (t % 1.2) * 12;
			if (x < -6.2) orb.userData.progress = 0;
			let z = -3.2 + Math.cos(x * 1.2) * 0.25;
			let y = -0.15 + x * 0.045;
			orb.position.set(x, y + 0.12, z);
			orb.material.emissiveIntensity = 0.5 + Math.sin(timeAcc * 7 + 2) * 0.3;
		}
	});

	// dynamic lights pulsation
	warmFill.intensity = 0.85 + Math.sin(timeAcc * 2.2) * 0.2;
	coolFill.intensity = 0.8 + Math.cos(timeAcc * 1.9) * 0.18;
	clashGlow.intensity = 0.55 + Math.sin(timeAcc * 2.5) * 0.25;

	timeAcc += 0.018;
}

// subtle rotation for rune field
function ambianceAnim() {
	runeField.rotation.y += 0.001;
	crackPoints.rotation.y = Math.sin(timeAcc * 0.3) * 0.02;
}

// animation loop
function animate() {
	updateParticles();
	ambianceAnim();
	controls.update(); // update orbit
	renderer.render(scene, camera);
	labelRenderer.render(scene, camera);
	requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

console.log(
	"🔥💧 Dual elemental streams: opposite flows - immersive landscape active"
);