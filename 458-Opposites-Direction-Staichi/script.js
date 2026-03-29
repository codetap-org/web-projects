import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ─── Renderer ──────────────────────────────────────────────────────────────
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000108, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
// Isometric-style angle: elevated and offset so we see the disc face + thickness
camera.position.set(2.0, 3.6, 2.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.5;
controls.maxDistance = 12;

// ─── Auto-orbit state ──────────────────────────────────────────────────────
// Track spherical angles so auto-orbit can resume from wherever the user left off
let orbitTheta = Math.atan2(camera.position.x, camera.position.z);
let orbitPhi = Math.acos(
	Math.max(-1, Math.min(1, camera.position.y / camera.position.length()))
);
const orbitR = camera.position.length(); // ~4.98, stays constant
let autoOrbit = true;
let pauseTimer = 0;

controls.addEventListener("start", () => {
	autoOrbit = false;
});
controls.addEventListener("end", () => {
	// Re-read camera angles so auto resumes seamlessly from user's position
	orbitTheta = Math.atan2(camera.position.x, camera.position.z);
	orbitPhi = Math.acos(
		Math.max(-1, Math.min(1, camera.position.y / camera.position.length()))
	);
	pauseTimer = 2.0; // 2 s pause before resuming
});

// ─── Background plane (rainbow gradient) ───────────────────────────────────
const bgGeo = new THREE.PlaneGeometry(2, 2);
const bgMat = new THREE.ShaderMaterial({
	uniforms: { iTime: { value: 0 } },
	vertexShader: `
        void main() {
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
	fragmentShader: `
        precision highp float;
        uniform float iTime;

        vec3 hsl2rgb(float h, float s, float l) {
          vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
        }

        void main() {
          vec2 uv = gl_FragCoord.xy;
          float hue = mod(iTime * 0.04 + uv.x * 0.0008 + uv.y * 0.0005, 1.0);
          vec3 col = hsl2rgb(hue, 0.7, 0.08);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
	depthTest: false,
	depthWrite: false
});
const bgMesh = new THREE.Mesh(bgGeo, bgMat);
bgMesh.renderOrder = -1;
scene.add(bgMesh);

// ─── Taichi shader ─────────────────────────────────────────────────────────
// Disc is a CylinderGeometry with Y-axis up (face in XZ plane).
// CylinderGeometry top cap UV: uv.x = x/R*0.5+0.5, uv.y = z/R*0.5+0.5
const taichiVert = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

const taichiFrag = /* glsl */ `
      precision highp float;
      uniform float iTime;
      varying vec2 vUv;

      const float PI = 3.1415926;

      float circle(vec2 st, float radius) {
        vec2 l = st - vec2(0.5);
        return 1.0 - smoothstep(0.99 * radius, 1.01 * radius, dot(l,l) * 4.0);
      }

      float semicircle(vec2 st, float radius) {
        float pct = 1.0 - smoothstep(0.95 * radius * radius, 1.05 * radius * radius, dot(st,st));
        return pct * step(0.0, st.y);
      }

      float rectangle(vec2 st, vec2 size) {
        size = 0.5 - 0.5 * size;
        vec2 uv = smoothstep(size, size + vec2(1e-4), st);
        uv *= smoothstep(size, size + vec2(1e-4), 1.0 - st);
        return uv.x * uv.y;
      }

      float bagua(vec2 uv, float n) {
        float pct = 0.0;
        pct  = rectangle(uv + vec2(0.0,  0.15), vec2(0.5, 0.08));
        pct += rectangle(uv,                     vec2(0.5, 0.08));
        pct += rectangle(uv + vec2(0.0, -0.15), vec2(0.5, 0.08));
        pct -= (step(0.1,n)*step(n,1.0) + step(3.1,n)*step(n,4.1) + step(4.1,n)*step(n,5.) + step(6.1,n)*step(n,7.))
               * rectangle(uv + vec2(0.0,  0.15), vec2(0.1, 0.08));
        pct -= (step(1.1,n)*step(n,2.1) + step(3.1,n)*step(n,4.1) + step(5.1,n)*step(n,6.) + step(6.1,n)*step(n,7.))
               * rectangle(uv,                    vec2(0.1, 0.08));
        pct -= (step(2.1,n)*step(n,3.1) + step(4.1,n)*step(n,5.1) + step(5.1,n)*step(n,6.) + step(6.1,n)*step(n,7.))
               * rectangle(uv + vec2(0.0, -0.15), vec2(0.1, 0.08));
        return pct;
      }

      mat2 rotate2d(float a) {
        return mat2(cos(a), -sin(a), sin(a), cos(a));
      }

      void main() {
        vec2 uv = vUv;
        float pct = 0.0;

        // ── Taichi body ──────────────────────────────────────
        vec2 st = 2.0 * uv - 1.0;
        st = rotate2d(-0.5 * iTime) * st;

        pct  = semicircle(st, 0.5);
        pct += semicircle(rotate2d(PI) * (st + vec2(-0.25, 0.0)), 0.25);
        pct -= semicircle(st + vec2(0.25, 0.0), 0.25);
        pct -= circle(st + vec2(0.25,  0.5), 0.02);
        pct += circle(st + vec2(0.75,  0.5), 0.02);

        // ── Bagua ring ───────────────────────────────────────
        st = 2.0 * uv - 1.0;
        st = 2.0 * st * rotate2d(-0.0 * iTime);
        vec2 off = vec2(0.5, 2.0);
        pct += bagua(st * rotate2d(PI*0.125) + off,     2.0);
        pct += bagua(st * rotate2d(PI*0.375) + off,     3.0);
        pct += bagua(st * rotate2d(PI*0.625) + off,     0.0);
        pct += bagua(st * rotate2d(PI*0.875) + off,     1.0);
        pct += bagua(st * rotate2d(PI*1.125) + off,     5.0);
        pct += bagua(st * rotate2d(PI*1.375) + off,     4.0);
        pct += bagua(st * rotate2d(PI*1.625) + off,     7.0);
        pct += bagua(st * rotate2d(PI*1.875) + off,     6.0);

        // ── Octagon edge fade (SDF) ───────────────────────────
        vec2 op = vUv - 0.5;
        const vec3 k = vec3(-0.92387953, 0.38268343, 0.41421356);
        vec2 ap = abs(op);
        ap -= 2.0 * min(dot(k.xy, ap), 0.0) * k.xy;
        ap -= 2.0 * min(dot(vec2(-k.x, k.y), ap), 0.0) * vec2(-k.x, k.y);
        ap -= vec2(clamp(ap.x, -k.z * 0.5, k.z * 0.5), 0.5);
        float octSdf = length(ap) * sign(ap.y);
        float rim = 1.0 - smoothstep(-0.012, 0.008, octSdf);

        pct = clamp(pct, 0.0, 1.0);
        vec3 bgCol = vec3(0.03, 0.04, 0.12);
        vec3 fgCol = vec3(0.93, 0.95, 1.00);
        vec3 col   = mix(bgCol, fgCol, pct);

        gl_FragColor = vec4(col, rim);
      }
    `;

// ─── Taichi disc — thick cylinder (Y-axis up, face in XZ plane) ────────────
const discMat = new THREE.ShaderMaterial({
	uniforms: { iTime: { value: 0 } },
	vertexShader: taichiVert,
	fragmentShader: taichiFrag,
	transparent: true,
	side: THREE.DoubleSide
});
// Dark edge for the cylindrical side band
const sideMat = new THREE.MeshBasicMaterial({ color: 0x090a18 });

const discGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.28, 8, 1, false);
// groups: 0=side, 1=top cap, 2=bottom cap
const disc = new THREE.Mesh(discGeo, [sideMat, discMat, discMat]);
scene.add(disc);

// ─── Inner grey glow (behind/below the disc) ───────────────────────────────
const innerGlowGeo = new THREE.CircleGeometry(1.85, 8);
const innerGlowMat = new THREE.ShaderMaterial({
	uniforms: {},
	vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
	fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5);
          float a = smoothstep(0.5, 0.05, d) * 0.45;
          gl_FragColor = vec4(0.62, 0.63, 0.70, a);
        }
      `,
	transparent: true,
	depthWrite: false,
	side: THREE.DoubleSide
});
const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
innerGlow.rotation.x = -Math.PI / 2;
innerGlow.position.y = -0.15; // just below bottom cap (y = -0.14)
scene.add(innerGlow);

// ─── Outer rainbow halo ────────────────────────────────────────────────────
const glowGeo = new THREE.CircleGeometry(2.1, 8);
const glowMat = new THREE.ShaderMaterial({
	uniforms: { iTime: { value: 0 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
	fragmentShader: `
        precision highp float;
        uniform float iTime;
        varying vec2 vUv;

        vec3 hsl2rgb(float h, float s, float l) {
          vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
        }

        void main() {
          float d = length(vUv - 0.5);
          float a = smoothstep(0.5, 0.15, d) * 0.22;
          float hue = mod(iTime * 0.08, 1.0);
          vec3 col = hsl2rgb(hue, 0.9, 0.6);
          gl_FragColor = vec4(col, a);
        }
      `,
	transparent: true,
	depthWrite: false,
	side: THREE.DoubleSide
});
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.rotation.x = -Math.PI / 2;
glow.position.y = -0.17; // furthest behind
scene.add(glow);

// ─── Starfield (sparkling) ─────────────────────────────────────────────────
const STARS = 2000;
const starPos = new Float32Array(STARS * 3);
const starPhase = new Float32Array(STARS); // sparkle phase per star
const starSpeed = new Float32Array(STARS); // sparkle rate per star
for (let i = 0; i < STARS; i++) {
	const θ = Math.random() * Math.PI * 2;
	const φ = Math.acos(2 * Math.random() - 1);
	const r = 50 + Math.random() * 150;
	starPos[i * 3] = r * Math.sin(φ) * Math.cos(θ);
	starPos[i * 3 + 1] = r * Math.sin(φ) * Math.sin(θ);
	starPos[i * 3 + 2] = r * Math.cos(φ);
	starPhase[i] = Math.random() * Math.PI * 2;
	starSpeed[i] = 0.6 + Math.random() * 1.6; // 0.6 – 2.2× rate
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute("aPhase", new THREE.BufferAttribute(starPhase, 1));
starGeo.setAttribute("aSpeed", new THREE.BufferAttribute(starSpeed, 1));

const starMat = new THREE.ShaderMaterial({
	uniforms: { iTime: { value: 0 } },
	vertexShader: `
        attribute float aPhase;
        attribute float aSpeed;
        uniform float iTime;
        varying float vBright;
        void main() {
          float t = iTime * aSpeed;
          // Two overlapping sine waves per star → organic flicker
          float s = 0.45 + 0.35 * sin(t * 2.8 + aPhase)
                         + 0.20 * sin(t * 1.1 + aPhase * 2.1);
          vBright = clamp(s, 0.05, 1.0);
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.2 + 2.8 * vBright) * (300.0 / max(-mvPos.z, 1.0));
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
	fragmentShader: `
        varying float vBright;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d) * vBright;
          // Blue-white to warm-white shift with brightness
          vec3 col = mix(vec3(0.65, 0.75, 1.0), vec3(1.0, 0.98, 0.95), vBright);
          gl_FragColor = vec4(col, a);
        }
      `,
	transparent: true,
	depthWrite: false
});
scene.add(new THREE.Points(starGeo, starMat));

// ─── Comet (at most 1 active at a time) ────────────────────────────────────
const TRAIL = 32;
const cometPos = new Float32Array(TRAIL * 3);
const cometProg = new Float32Array(TRAIL);
for (let i = 0; i < TRAIL; i++) cometProg[i] = i / (TRAIL - 1);

const cometGeo = new THREE.BufferGeometry();
const cometPosAttr = new THREE.BufferAttribute(cometPos, 3);
cometGeo.setAttribute("position", cometPosAttr);
cometGeo.setAttribute("aProgress", new THREE.BufferAttribute(cometProg, 1));

const cometMat = new THREE.ShaderMaterial({
	uniforms: { uAlpha: { value: 0 } },
	vertexShader: `
        attribute float aProgress;
        uniform float uAlpha;
        varying float vA;
        void main() {
          vA = aProgress * aProgress * uAlpha;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.0 + 6.0 * aProgress) * (300.0 / max(-mvPos.z, 1.0));
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
	fragmentShader: `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d) * vA;
          // Tail: blue-purple → head: white
          vec3 col = mix(vec3(0.35, 0.45, 1.0), vec3(1.0, 1.0, 1.0), pow(vA, 0.4));
          gl_FragColor = vec4(col, a);
        }
      `,
	transparent: true,
	depthWrite: false
});
const cometMesh = new THREE.Points(cometGeo, cometMat);
cometMesh.visible = false;
scene.add(cometMesh);

// Comet state
const cs = {
	active: false,
	head: new THREE.Vector3(),
	dir: new THREE.Vector3(),
	speed: 0,
	trail: 0,
	life: 0,
	duration: 0,
	timer: 3 + Math.random() * 5 // first comet in 3–8 s
};

function launchComet() {
	const θ = Math.random() * Math.PI * 2;
	const φ = Math.acos(2 * Math.random() - 1);
	const R = 45;
	cs.head.set(
		R * Math.sin(φ) * Math.cos(θ),
		R * Math.sin(φ) * Math.sin(θ),
		R * Math.cos(φ)
	);
	// Tangential direction: perpendicular to radial vector, then random roll
	const radial = cs.head.clone().normalize();
	const arbitrary =
		Math.abs(radial.y) < 0.9
			? new THREE.Vector3(0, 1, 0)
			: new THREE.Vector3(1, 0, 0);
	cs.dir.crossVectors(radial, arbitrary).normalize();
	cs.dir.applyAxisAngle(radial, Math.random() * Math.PI * 2);

	cs.speed = 25 + Math.random() * 30; // 25 – 55 units/s
	cs.trail = 6 + Math.random() * 8; // world-unit trail length
	cs.life = 0;
	cs.duration = 1.2 + Math.random() * 1.6; // 1.2 – 2.8 s
	cs.active = true;
	cometMesh.visible = true;
}

function updateComet(delta) {
	if (!cs.active) {
		cs.timer -= delta;
		if (cs.timer <= 0) {
			launchComet();
			cs.timer = 4 + Math.random() * 8;
		}
		return;
	}
	cs.life += delta;
	if (cs.life >= cs.duration) {
		cs.active = false;
		cometMesh.visible = false;
		return;
	}
	// Fade in first 15%, full brightness middle, fade out last 15%
	const t = cs.life / cs.duration;
	const fade = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
	cometMat.uniforms.uAlpha.value = fade;

	cs.head.addScaledVector(cs.dir, cs.speed * delta);

	const p = cometPosAttr.array;
	for (let i = 0; i < TRAIL; i++) {
		const f = i / (TRAIL - 1); // 0 = tail, 1 = head
		const dt = (1 - f) * cs.trail;
		p[i * 3] = cs.head.x - cs.dir.x * dt;
		p[i * 3 + 1] = cs.head.y - cs.dir.y * dt;
		p[i * 3 + 2] = cs.head.z - cs.dir.z * dt;
	}
	cometPosAttr.needsUpdate = true;
}

// ─── Resize ────────────────────────────────────────────────────────────────
function resize() {
	const w = window.innerWidth,
		h = window.innerHeight;
	renderer.setSize(w, h, false);
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ─── Render loop ───────────────────────────────────────────────────────────
let prevT = 0;
function animate(t) {
	requestAnimationFrame(animate);
	const sec = t * 0.001;
	const delta = Math.min(sec - prevT, 0.05); // cap to avoid jump on tab focus
	prevT = sec;

	disc.rotation.y = 0.25 * sec; // match bagua CCW rotation in shader
	discMat.uniforms.iTime.value = sec;
	glowMat.uniforms.iTime.value = sec;
	bgMat.uniforms.iTime.value = sec;
	starMat.uniforms.iTime.value = sec;
	updateComet(delta);

	// Auto-orbit: slowly drift around the taichi with organic speed variation
	if (!autoOrbit) {
		pauseTimer -= delta;
		if (pauseTimer <= 0) autoOrbit = true;
	}
	if (autoOrbit) {
		// Two overlapping sines vary the horizontal speed → feels natural, not robotic
		const omega =
			0.04 + 0.02 * Math.sin(sec * 0.13) + 0.015 * Math.sin(sec * 0.07);
		// Small vertical drift keeps the viewing angle alive
		const dPhi = 0.003 * Math.sin(sec * 0.11) + 0.002 * Math.sin(sec * 0.05);
		orbitTheta += omega * delta;
		orbitPhi = Math.max(0.28, Math.min(1.45, orbitPhi + dPhi));
		const sinP = Math.sin(orbitPhi);
		camera.position.set(
			orbitR * sinP * Math.sin(orbitTheta),
			orbitR * Math.cos(orbitPhi),
			orbitR * sinP * Math.cos(orbitTheta)
		);
		// OrbitControls re-reads camera.position each frame, so no conflict
	}
	controls.update();
	renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// ─── Fullscreen ────────────────────────────────────────────────────────────
document.getElementById("fullscreenBtn").addEventListener("click", () => {
	document.fullscreenElement
		? document.exitFullscreen()
		: document.documentElement.requestFullscreen();
});