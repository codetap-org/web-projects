import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const FIXED_DT_MS = 8;
const MAX_FRAME_DT_MS = 100;
const MAX_CATCHUP_STEPS = 6;
const INITIAL_CENTER_DISTANCE = 2.2;
const INITIAL_DEPTH_OFFSET = 0.15;

const app = document.getElementById("app");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0x000000, 0);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0.4, 8.5);

const hemi = new THREE.HemisphereLight(0xfff1e5, 0xffd8bf, 40.95);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 10);
key.position.set(0, 10.4, 0);
scene.add(key);

const rim = new THREE.DirectionalLight(0xffb994, 0.85);
rim.position.set(-3.6, 2.2, -2.1);
scene.add(rim);

const fill = new THREE.PointLight(0xff8f63, 1.3, 20, 2);
fill.position.set(0.4, -0.6, 1.8);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(7, 64),
  new THREE.MeshStandardMaterial({
    color: 0xffe2cc,
    transparent: true,
    opacity: 0.16,
    roughness: 1,
    metalness: 0,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3.2;
//scene.add(floor);

const sharedGeometry = new THREE.IcosahedronGeometry(1, 7);

function createNoiseTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const n = (Math.random() * 255) | 0;
    data[i * 4 + 0] = n;
    data[i * 4 + 1] = n;
    data[i * 4 + 2] = n;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

const noiseTexture = createNoiseTexture(128);

function createBall(color, x, z) {
  const root = new THREE.Group();
  const deform = new THREE.Group();
  root.add(deform);

  const material = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.2,
    transmission: 1,
    thickness: 1.5,
    ior: 1.18,
    transparent: true,
    opacity: 1,
    sheen: 1,
    sheenRoughness: 1,
    emissive: new THREE.Color("#ffbb87"),
    attenuationColor: new THREE.Color("#ff6f00"),
    attenuationDistance: 1.8,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNoiseTexture = { value: noiseTexture };
    shader.uniforms.uNoiseScale = { value: 3.2 };
    shader.uniforms.uNoiseOpacity = { value: 0.0 };
    shader.uniforms.uRimColor = { value: new THREE.Color("#fff6ec") };
    shader.uniforms.uRimPower = { value: 2.7 };
    shader.uniforms.uRimStrength = { value: 0.45 };

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `
        #include <common>
        varying vec3 vLocalPosition;
        varying vec3 vLocalNormal;
        varying vec3 vCustomWorldPosition;
        varying vec3 vCustomWorldNormal;
      `,
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `
        #include <worldpos_vertex>
        vLocalPosition = position;
        vLocalNormal = normal;
        vCustomWorldPosition = worldPosition.xyz;
        vCustomWorldNormal = normalize(mat3(modelMatrix) * normal);
      `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `
        #include <common>
        uniform sampler2D uNoiseTexture;
        uniform float uNoiseScale;
        uniform float uNoiseOpacity;
        uniform vec3 uRimColor;
        uniform float uRimPower;
        uniform float uRimStrength;
        varying vec3 vLocalPosition;
        varying vec3 vLocalNormal;
        varying vec3 vCustomWorldPosition;
        varying vec3 vCustomWorldNormal;
      `,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `
        vec3 absNormal = abs(normalize(vLocalNormal));
        vec2 noiseUV;
        if (absNormal.z >= absNormal.x && absNormal.z >= absNormal.y) {
          noiseUV = vLocalPosition.xy * uNoiseScale;
        } else if (absNormal.y >= absNormal.x) {
          noiseUV = vLocalPosition.xz * uNoiseScale;
        } else {
          noiseUV = vLocalPosition.yz * uNoiseScale;
        }

        float noise = texture2D(uNoiseTexture, noiseUV).r;
        gl_FragColor.rgb *= (1.0 - uNoiseOpacity + noise * uNoiseOpacity);

        vec3 viewDir = normalize(cameraPosition - vCustomWorldPosition);
        float rim = pow(1.0 - max(dot(normalize(vCustomWorldNormal), viewDir), 0.0), uRimPower);
        gl_FragColor.rgb += uRimColor * (rim * uRimStrength);

        #include <dithering_fragment>
      `,
    );
  };

  const mesh = new THREE.Mesh(sharedGeometry, material);
  deform.add(mesh);
  root.position.set(x, 0, z);
  scene.add(root);

  return {
    mesh: root,
    deform,
    visual: mesh,
    radius: 1,
    invMass: 1,
    position: new THREE.Vector3(x, 0, z),
    prevPosition: new THREE.Vector3(x, 0, z),
    target: new THREE.Vector3(x, 0, z),
    velocity: new THREE.Vector3(),
    softPrevPosition: new THREE.Vector3(x, 0, z),
    softOffset: new THREE.Vector3(),
    softVelocity: new THREE.Vector3(),
    stretchBlend: 0,
    breathingBlend: 0,
    breathingPhase: Math.random() * Math.PI * 2,
  };
}

const xHalfSpan =
  Math.sqrt(
    INITIAL_CENTER_DISTANCE * INITIAL_CENTER_DISTANCE -
      INITIAL_DEPTH_OFFSET * 2 * (INITIAL_DEPTH_OFFSET * 2),
  ) * 0.1;

const balls = [
  createBall("#ffc9a0", -xHalfSpan, -INITIAL_DEPTH_OFFSET),
  createBall("#ffc9a0", xHalfSpan, INITIAL_DEPTH_OFFSET),
];

const physicsParams = {
  springK: 0.015,
  damping: 0.94,
  restitution: 0.32,
  maxSpeed: 0.13,
  separationStrength: 0.85,
  minSeparation: 0,
  iterations: 8,
  mouseRadius: 2.0,
  mouseStrength: 0.085,
};

const softBodyParams = {
  stretchAmount: 0.22,
  springStiffness: 0.24,
  springDamping: 0.62,
  breathingAmplitude: 0.018,
  breathingSpeed: 1.35,
};

const mouseNdc = new THREE.Vector2(0, 0);
const mouseWorld = new THREE.Vector3(999, 999, 0);
const raycaster = new THREE.Raycaster();
const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

let effectiveMouseStrength = 0;
const mouseStrengthRise = 0.16;
const mouseStrengthDecay = 0.92;
let hasMouseMoved = false;

window.addEventListener("pointermove", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouseNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  hasMouseMoved = true;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
});

function updateMouseWorld() {
  if (!hasMouseMoved) return;
  raycaster.setFromCamera(mouseNdc, camera);
  raycaster.ray.intersectPlane(interactionPlane, mouseWorld);
}

function updateEffectiveMouseStrength() {
  if (hasMouseMoved) {
    effectiveMouseStrength +=
      (physicsParams.mouseStrength - effectiveMouseStrength) *
      mouseStrengthRise;
  } else {
    effectiveMouseStrength *= mouseStrengthDecay;
  }
  hasMouseMoved = false;
}

function smoothstep01(v) {
  return v * v * (3 - 2 * v);
}

function applyLayoutForces() {
  for (const ball of balls) {
    const toTarget = tmpVecA.copy(ball.target).sub(ball.position);
    ball.velocity.addScaledVector(toTarget, physicsParams.springK);
  }
}

const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();

function applyMouseForce() {
  if (effectiveMouseStrength < 0.0005) return;

  for (const ball of balls) {
    const dx = ball.position.x - mouseWorld.x;
    const dy = ball.position.y - mouseWorld.y;
    const distSq = dx * dx + dy * dy;
    const radius = physicsParams.mouseRadius + ball.radius;

    if (distSq >= radius * radius || distSq <= 1e-4) continue;

    const dist = Math.sqrt(distSq);
    const s = 1 - dist / radius;
    const a = smoothstep01(s);

    const impulse = a * effectiveMouseStrength * ball.invMass;
    ball.velocity.x += (dx / dist) * impulse;
    ball.velocity.y += (dy / dist) * impulse;

    const localDamping = 1 - a * 0.15;
    ball.velocity.multiplyScalar(localDamping);
  }
}

function integrate() {
  const maxSpeedSq = physicsParams.maxSpeed * physicsParams.maxSpeed;

  for (const ball of balls) {
    ball.prevPosition.copy(ball.position);

    const speedSq = ball.velocity.lengthSq();
    if (speedSq > maxSpeedSq) {
      ball.velocity.multiplyScalar(physicsParams.maxSpeed / Math.sqrt(speedSq));
    }

    ball.position.add(ball.velocity);
    ball.velocity.multiplyScalar(physicsParams.damping);

    if (Math.abs(ball.velocity.x) < 1e-4) ball.velocity.x = 0;
    if (Math.abs(ball.velocity.y) < 1e-4) ball.velocity.y = 0;
    if (Math.abs(ball.velocity.z) < 1e-4) ball.velocity.z = 0;
  }
}

function solveCollisionsOnce() {
  const a = balls[0];
  const b = balls[1];

  const nx = b.position.x - a.position.x;
  const ny = b.position.y - a.position.y;
  const nz = b.position.z - a.position.z;
  const distSq = nx * nx + ny * ny + nz * nz;

  const minDist = a.radius + b.radius + physicsParams.minSeparation;
  if (distSq >= minDist * minDist) return 0;

  const dist = Math.sqrt(distSq) || 0.001;
  const penetration = minDist - dist;
  const invDist = 1 / dist;

  const ux = nx * invDist;
  const uy = ny * invDist;
  const uz = nz * invDist;

  const invMassSum = a.invMass + b.invMass;
  const wa = a.invMass / invMassSum;
  const wb = b.invMass / invMassSum;
  const correction = penetration * physicsParams.separationStrength;

  a.position.x -= ux * correction * wa;
  a.position.y -= uy * correction * wa;
  a.position.z -= uz * correction * wa;
  b.position.x += ux * correction * wb;
  b.position.y += uy * correction * wb;
  b.position.z += uz * correction * wb;

  const relVx = (a.velocity.x - b.velocity.x) * ux;
  const relVy = (a.velocity.y - b.velocity.y) * uy;
  const relVz = (a.velocity.z - b.velocity.z) * uz;
  const relDot = relVx + relVy + relVz;

  if (relDot > 0) {
    const impulse = relDot * physicsParams.restitution;
    a.velocity.x -= ux * impulse * wa;
    a.velocity.y -= uy * impulse * wa;
    a.velocity.z -= uz * impulse * wa;
    b.velocity.x += ux * impulse * wb;
    b.velocity.y += uy * impulse * wb;
    b.velocity.z += uz * impulse * wb;
  }

  return penetration;
}

function solveCollisions() {
  let maxPenetration = 0;
  for (let i = 0; i < physicsParams.iterations; i++) {
    const p = solveCollisionsOnce();
    if (p > maxPenetration) maxPenetration = p;
    if (p < 1e-4) break;
  }
  return maxPenetration;
}

function fixedUpdate() {
  updateMouseWorld();
  updateEffectiveMouseStrength();
  applyLayoutForces();
  applyMouseForce();
  integrate();
  solveCollisions();
  updateSoftBodies();
}

function updateSoftBodies() {
  for (const ball of balls) {
    const dispX = ball.position.x - ball.softPrevPosition.x;
    const dispY = ball.position.y - ball.softPrevPosition.y;
    const dispZ = ball.position.z - ball.softPrevPosition.z;

    ball.softVelocity.x +=
      (dispX - ball.softOffset.x) * softBodyParams.springStiffness;
    ball.softVelocity.y +=
      (dispY - ball.softOffset.y) * softBodyParams.springStiffness;
    ball.softVelocity.z +=
      (dispZ - ball.softOffset.z) * softBodyParams.springStiffness;

    ball.softVelocity.multiplyScalar(softBodyParams.springDamping);
    ball.softOffset.add(ball.softVelocity);
    ball.softPrevPosition.copy(ball.position);
  }
}

const zAxis = new THREE.Vector3(0, 0, 1);
const stretchAxis = new THREE.Vector3();
const targetQuat = new THREE.Quaternion();
const identityQuat = new THREE.Quaternion();

function render(alpha) {
  const time = performance.now() * 0.001;

  for (const ball of balls) {
    tmpVecB.copy(ball.prevPosition).lerp(ball.position, alpha);
    ball.mesh.position.copy(tmpVecB);

    const dx = ball.softOffset.x;
    const dy = ball.softOffset.y;
    const dz = ball.softOffset.z;
    const stretchLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const moving = stretchLen > 0.001 ? 1 : 0;
    ball.stretchBlend += (moving - ball.stretchBlend) * 0.1;

    if (stretchLen < 8e-4) {
      ball.breathingBlend += (1 - ball.breathingBlend) * 0.05;
    } else if (stretchLen > 0.002) {
      ball.breathingBlend *= 0.9;
    }

    const breath =
      ball.breathingBlend > 0.01
        ? 1 +
          Math.sin(time * softBodyParams.breathingSpeed + ball.breathingPhase) *
            softBodyParams.breathingAmplitude *
            ball.breathingBlend
        : 1;

    if (ball.stretchBlend > 0.01 && stretchLen > 1e-4) {
      const stretchFactor =
        1 +
        Math.min(stretchLen / 0.15, 1) *
          softBodyParams.stretchAmount *
          ball.stretchBlend;
      const perp = 1 / Math.sqrt(stretchFactor);

      stretchAxis.set(dx / stretchLen, dy / stretchLen, dz / stretchLen);
      targetQuat.setFromUnitVectors(zAxis, stretchAxis);
      ball.deform.quaternion.slerp(targetQuat, 0.25);
      ball.deform.scale.set(
        breath * perp,
        breath * perp,
        breath * stretchFactor,
      );
    } else {
      ball.deform.quaternion.slerp(identityQuat, 0.12);
      ball.deform.scale.setScalar(breath);
    }
  }

  renderer.render(scene, camera);
}

let paused = false;
let lastTime = performance.now();
let dtOffset = 0;

document.addEventListener("visibilitychange", () => {
  paused = document.hidden;
  if (!paused) lastTime = performance.now();
});

function loop() {
  if (paused) {
    requestAnimationFrame(loop);
    return;
  }

  const now = performance.now();
  const dt = Math.min(now - lastTime, MAX_FRAME_DT_MS);
  lastTime = now;
  dtOffset += dt;

  let guard = 0;
  while (dtOffset >= FIXED_DT_MS && guard < MAX_CATCHUP_STEPS) {
    fixedUpdate();
    dtOffset -= FIXED_DT_MS;
    guard++;
  }

  if (guard >= MAX_CATCHUP_STEPS) {
    dtOffset = 0;
  }

  render(dtOffset / FIXED_DT_MS);
  requestAnimationFrame(loop);
}

loop();