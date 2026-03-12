import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
   60,
   window.innerWidth / window.innerHeight,
   0.1,
   1000
);

camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({
   canvas: document.getElementById("c"),
   antialias: false
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);

// MONOLITH

const geo = new THREE.CylinderGeometry(1.2, 0.9, 4, 6, 12);

const mat = new THREE.MeshBasicMaterial({
   color: 0xffd000,
   wireframe: true
});

const monolith = new THREE.Mesh(geo, mat);

scene.add(monolith);

// ORIGINAL POSITIONS

const base = geo.attributes.position.array.slice();

// RANDOM EXPLOSION DIRECTIONS

const dirs = [];

for (let i = 0; i < geo.attributes.position.count; i++) {
   dirs.push(
      new THREE.Vector3(
         Math.random() - 0.5,
         Math.random() - 0.5,
         Math.random() - 0.5
      ).normalize()
   );
}

// VERTEX SNAP

function snap(v, g) {
   return Math.round(v / g) * g;
}

const snapSize = 0.08;

// EXPLOSION LOOP

function updateGeometry(time) {
   const pos = geo.attributes.position;

   const phase = (Math.sin(time) + 1) / 2; // 0 → 1 → 0

   for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      let x = base[ix];
      let y = base[iy];
      let z = base[iz];

      const d = dirs[i];

      const explode = phase * 1.8;

      x += d.x * explode;
      y += d.y * explode;
      z += d.z * explode;

      // vertex snapping

      x = snap(x, snapSize);
      y = snap(y, snapSize);
      z = snap(z, snapSize);

      pos.array[ix] = x;
      pos.array[iy] = y;
      pos.array[iz] = z;
   }

   pos.needsUpdate = true;
}

// CAMERA RESIZE

window.addEventListener("resize", () => {
   renderer.setSize(window.innerWidth, window.innerHeight);

   camera.aspect = window.innerWidth / window.innerHeight;

   camera.updateProjectionMatrix();
});

// ANIMATION

function animate(t) {
   requestAnimationFrame(animate);

   const time = t * 0.001;

   updateGeometry(time);

   monolith.rotation.y += 0.003;

   camera.position.x = Math.sin(time * 0.4) * 0.8;

   camera.lookAt(0, 0, 0);

   renderer.render(scene, camera);
}

animate();