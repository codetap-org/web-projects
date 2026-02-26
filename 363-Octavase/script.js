// https://discourse.threejs.org/t/i-need-a-light-source-to-understand-my-geometries-better-that-are-growing-in-complexity/89764/8
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

console.clear();

const gu = {
  time: { value: 0 },
  timeDelta: { value: 0 }
};

class Background extends THREE.PMREMGenerator {
  constructor(renderer, scene) {
    super(renderer);

    const roomEnv = new RoomEnvironment();
    //roomEnv.children[0].color.set("lightgreen");
    console.log(roomEnv);

    const pmremGen = this.fromScene(roomEnv, 0.04);
    const backTex = pmremGen.texture;
    scene.environment = backTex;
    scene.environmentIntensity = 0.25;
    scene.background = backTex;
  }
}

class OctaVase extends THREE.Mesh {
  constructor(params = {
    radii: [7,10.5,12,11,8,6,5,6,8],
    columns: 12,
    tileH: 5,
    tileT: 1.5
  }) {
    
    super();
    
    this.radii = params.radii;
    this.columns = params.columns;
    this.tileH = params.tileH;
    this.tileT = params.tileT;
    
    const tileAngle = Math.PI * 2 / this.columns;
    const to1 = 1 / Math.cos(Math.PI / 8);
    console.log(to1)
    const gBase = new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1)
      .rotateX(Math.PI * 0.5)
      .rotateZ(Math.PI / 8)
      .scale(to1, to1, 1)
      .translate(0, 0.5, 0.5);
      //.toNonIndexed();
    //gBase.computeVertexNormals();

    // column
    const gColumn = mergeGeometries(
      Array.from({ length: this.radii.length - 1 }, (_, idx) => {
        const g = gBase.clone();
        const cShift = idx / (this.radii.length - 2);
        g.setAttribute(
          "color",
          new THREE.Float32BufferAttribute(
            Array.from({ length: g.attributes.position.count }, () => {
              return [
                0,
                0.5,
                (idx % 2 == 0) ? (1 - cShift * 0.6) : (0.4 + cShift * 0.6)
              ];
            }).flat(),
            3
          )
        );
        const rBottom = this.radii[idx];
        const rTop = this.radii[idx + 1];
        const pos = g.attributes.position;
        for(let i = 0; i < pos.count; i++){
          const a = tileAngle * pos.getX(i);
          const h = pos.getY(i);
          const d = THREE.MathUtils.lerp(rBottom, rTop, h);
          const r = this.tileT * pos.getZ(i) + d;
          
          const x = r * Math.tan(a);
          const y = h * this.tileH;
          const z = r;
          
          pos.setXYZ(i, x, y, z);
        }
        
        g.translate(0, idx * this.tileH, 0);
        
        return g;
      })
    );
    
    const gFull = mergeGeometries(
      Array.from({length: this.columns}, (_, idx) => {
        return gColumn.clone().rotateY(idx * tileAngle);
      })
    );
    gFull.computeVertexNormals();

    const m = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.9,
      roughness: 0.4
    });

    this.geometry = gFull;
    this.material = m;
    this.receiveShadow = true;
    this.castShadow = true;
    
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0.5, 1, 0.75);
const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.01,
  1000
);
camera.position.set(-0.25, 1, 1).setLength(75);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const camShift = new THREE.Vector3(0, 20, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.object.position.add(camShift);
controls.target.add(camShift);

const background = new Background(renderer, scene);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.setScalar(100);
light.castShadow = true;
light.shadow.bias = -0.01;
light.shadow.intensity = 0.5;
light.shadow.camera.near = 1;
light.shadow.camera.far = 300;
const camSize = 100;
light.shadow.camera.right = camSize;
light.shadow.camera.left = -camSize;
light.shadow.camera.top = camSize;
light.shadow.camera.bottom = -camSize;
light.shadow.mapSize.setScalar(1024);
//scene.add( new THREE.CameraHelper( light.shadow.camera ) );
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

const octaVase = new OctaVase();
scene.add(octaVase);
// grid helper
const grid = new THREE.GridHelper(100, 50);
grid.position.y = -0.1;
scene.add(grid);

// shadow plane
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100).rotateX(-Math.PI * 0.5),
  new THREE.ShadowMaterial()
);
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const timer = new THREE.Timer();
timer.connect(document);
let t = 0;

renderer.setAnimationLoop(() => {
  timer.update();
  const dt = timer.getDelta();
  t += dt;
  gu.time.value = t;
  gu.timeDelta.value = dt;

  controls.update();
  
  octaVase.rotation.y = t * 0.25;

  renderer.render(scene, camera);
});