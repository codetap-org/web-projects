/*!



*/
"use strict";
console.clear();

//import * as THREE from "three";
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
//import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import { WaterMesh } from "three/addons/objects/Water2Mesh.js";
import { GroundedSkybox } from "three/addons/objects/GroundedSkybox.js";
//import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
//import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

(function () {
  let camera, scene, renderer, controls;
  let geometry, material, mesh, skybox, water;

  init().then(animate);
  obj();

  async function obj() {
    /*
    //
    geometry = new THREE.BoxGeometry(1, 1, 1);
    material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
*/
    // water /////////////////////////
    const params = {
      color: "azure",
      scale: 5,
      flowX: 0.1,
      flowY: 0.3
    };
    const textureLoader = new THREE.TextureLoader();

    const [normalMap0, normalMap1] = await Promise.all([
      textureLoader.loadAsync(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_1_M_Normal.jpg"
      ),
      textureLoader.loadAsync(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_2_M_Normal.jpg"
      )
    ]);

    normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
    normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;

    const waterGeometry = new THREE.CircleGeometry(camera.far / 2, 32);

    water = new WaterMesh(waterGeometry, {
      color: params.color,
      scale: params.scale,
      flowDirection: new THREE.Vector2(params.flowX, params.flowY),
      normalMap0: normalMap0,
      normalMap1: normalMap1
    });

    water.position.set(0, 0, 0);
    water.rotation.x = Math.PI * -0.5;
    water.renderOrder = Infinity;
    scene.add(water);
  }
  async function init() {
    //
    scene = new THREE.Scene();

    //
    //renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer = new THREE.WebGPURenderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);
    //
    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    camera.position.set(0, 1.5, 8);
    //
    controls = new OrbitControls(camera, renderer.domElement);
    //controls.autoRotate = true;
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxDistance = camera.far / 2;
    controls.minDistance = 10;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    controls.target.set(0, 1, 0);
    controls.update();
    //
    window.addEventListener("resize", onWindowResize);
    //
    const hdrLoader = new HDRLoader();
    const envMap = await hdrLoader.loadAsync(
      //"https://happy358.github.io/Images/HDR/kloofendal_48d_partly_cloudy_puresky_2k.hdr"
      //"https://happy358.github.io/Images/HDR/je_gray_02_2k.hdr"
      "https://happy358.github.io/Images/HDR/old_hall_2k.hdr"
      //"https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/blouberg_sunrise_2_1k.hdr"
    );
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    const params = {
      height: 15,
      radius: camera.far / 2,
      enabled: true
    };
    skybox = new GroundedSkybox(envMap, params.height, params.radius);
    skybox.position.y = params.height - 1; //params.height - 0.01;
    scene.add(skybox);
    /*
    geometry = new THREE.SphereGeometry(params.radius, 32, 16);
    skybox = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide,envMap:envMap })
    );
    scene.add(skybox);
    scene.environment = envMap;
    scene.background = envMap;
*/
  }
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function animate() {
    controls.update();
    // light.position.copy(camera.position);
    renderer.render(scene, camera);
  }
})();