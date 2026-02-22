import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import * as TWEEN from "three/addons/libs/tween.module.js";

console.clear();

const simplex = new SimplexNoise();

// load fonts
await (async function () {
  async function loadFont(fontface) {
    await fontface.load();
    document.fonts.add(fontface);
  }
  let fonts = [
    new FontFace(
      "HomemadeApple",
      "url(https://fonts.gstatic.com/s/homemadeapple/v24/Qw3EZQFXECDrI2q789EKQZJob0x6XHg.woff2) format('woff2')"
    )
  ];
  for (let font in fonts) {
    await loadFont(fonts[font]);
  }
})();

const gu = {
  time: {value: 0},
  timeDelta: {value: 0}
}

class Wiese extends THREE.InstancedMesh{
  constructor(){
    const g = new THREE.PlaneGeometry().rotateX(-Math.PI * 0.5);
    const m = new THREE.MeshBasicMaterial({
      //alphaTest: 0.5,
      transparent: true,
      onBeforeCompile: shader => {
        shader.uniforms.fadeColor = {value: new THREE.Color("#ccc")};
        shader.vertexShader = `
          attribute float petals;
          varying float vPetals;
          varying float vDistance;
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
            vPetals = petals;
            vDistance = length(instanceMatrix[3].xz);
          `
        );
        shader.fragmentShader = `
          uniform vec3 fadeColor;
          varying float vPetals;
          varying float vDistance;
          ${shader.fragmentShader}
        `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
          vec2 uv = vUv - 0.5;
          float r = length(uv) * 2.;
          float a = atan(uv.y, uv.x);
          float pF = abs(sin(a * vPetals * 0.5)) * 0.5 + 0.5;
          float aPetals = 1. - smoothstep(pF, pF + 0.02, r);
          float aDist = 1. - smoothstep(10., 15., vDistance);
          
          float aTotal = aDist * aPetals;
          
          vec4 diffuseColor = vec4( diffuse, opacity * aTotal );
          `
        );
      }
    });
    m.defines = {"USE_UV": ""};
    const amount = 200;
    super(g, m, amount);
    this.position.y = -3;
    
    const petals = new Float32Array(amount);
    
    this.proxies = Array.from({length: amount}, (_, idx) => {
      const o = new THREE.Object3D();
      o.position.random().subScalar(0.5).multiplyScalar(30);
      this.setRandom(o);
      this.setColorAt(idx, new THREE.Color().setHSL(0, 0, Math.random() * 0.25));
      petals[idx] =  5 + Math.floor(Math.random() * 4);
      return o;
    });
    g.setAttribute("petals", new THREE.InstancedBufferAttribute(petals, 1));
  }
  
  setRandom(o){
    o.scale.setScalar(Math.random() * 0.75 + 0.25).multiplyScalar(0.5);
    o.position.x = (Math.random() - 0.5) * 30;
    o.position.y = (Math.random() - 0.5) * 2;
    o.rotation.x = Math.PI * 0.2 * Math.random();
    o.rotation.y = Math.PI * 2 * Math.random();
  }
  
  update(){
    this.proxies.forEach((proxy, pIdx) => {
      proxy.position.z += gu.timeDelta.value * 5;
      if (proxy.position.z > 15){
        proxy.position.z = (proxy.position.z + 15) % 30 - 15;
        this.setRandom(proxy);
      };
      proxy.updateMatrix();
      this.setMatrixAt(pIdx, proxy.matrix);
    })
    this.instanceMatrix.needsUpdate = true;
  }
}

class Schmetterling extends THREE.Scene{
  constructor(){
    super();
    this.background = new THREE.Color("#aaa");
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.setScalar(1);
    this.add(
      light,
      new THREE.AmbientLight(0xffffff, 0.5)
    );
    
    // body
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(
        new THREE.Path()
          .moveTo(0, 1)
          .splineThru([
            [0.1, 1],
            [0.25, 0.75],
            [0.2, 0.5],
            [0.4, 0.25],
            [0.4, 0],
            [0.25, -0.5],
            [0.1, -2],
            [0, -2.25]
        ].map(p => {return new THREE.Vector2(...p)}))
        .getPoints(50).reverse(),
        36
      ).scale(0.75, 1, 0.75),
      new THREE.MeshLambertMaterial({color: "#666"})
    );
    body.rotation.x = -Math.PI * 0.5;
    this.add(body);
    this.body = body;
    
    // wings
    const wingPoints = new THREE.CatmullRomCurve3(
      [
        [0, 0],
        [0.5, 1],
        [4, 2],
        [5.5, 0.5],
        [4.5, 0.5],
        [4, 0],
        [3, -1],
        [2.75, -1],
        [2.75, -1.75],
        [1, -3.5],
        [0.5, -3],
        [0, -2]
      ].map(p => {return new THREE.Vector3(...p, 0)}), 
      false, 
      "catmullrom", 
      0.75
    ).getPoints(100);
    const halfWingG = new THREE.ShapeGeometry(new THREE.Shape(wingPoints)).translate(0.2, 0, 0);
    
    // set UVs
    const hwPos = halfWingG.attributes.position;
    const hwUV = halfWingG.attributes.uv;
    const bb = new THREE.Box3().setFromPoints(wingPoints);
    const bbSize = new THREE.Vector3();
    bb.getSize(bbSize);
    for(let i = 0; i < hwPos.count; i++){
      const u = (hwPos.getX(i) - bb.min.x) / bbSize.x;
      const v = (hwPos.getY(i) - bb.min.y) / bbSize.y;
      hwUV.setXY(i, u, v);
    }
    
    const wingM = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      map: (() => {
        const c = document.createElement("canvas");
        c.width = c.height = 1024;
        const ctx = c.getContext("2d");
        const u = val => val * 0.01 * c.height;
        
        for(let i = 0; i < 100; i ++){
          ctx.fillStyle = `hsl(0, 0%, ${Math.random() * 100}%)`;
          ctx.strokeStyle = `hsl(0, 0%, ${Math.random() * 100}%)`;
          ctx.lineWidth = u(Math.random() * 5 + 1);
          ctx.beginPath();
          ctx.ellipse(
            u(Math.floor(Math.random() * 100)),
            u(Math.floor(Math.random() * 100)),
            u(Math.floor(Math.random() * 25 + 5)),
            u(Math.floor(Math.random() * 20 + 10)),
            0, 
            0,
            Math.PI * 2
          )
          ctx.stroke();
          ctx.fill();
        }
        
        const grd = ctx.createRadialGradient(u(10), u(25), u(20), u(20), u(35), u(50));
        grd.addColorStop(0, "transparent");
        grd.addColorStop(1, "rgba(32, 32, 32, 0.25)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, c.width, c.height);
        
        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 16;
        tex.colorSpace = "srgb";
        return tex;
      })()
    });
    const wingRight = new THREE.Mesh(halfWingG, wingM);
    const wingLeft = new THREE.Mesh(halfWingG.clone().rotateY(Math.PI), wingM);
    body.add(wingRight, wingLeft);
    this.wings = [wingRight, wingLeft];
    
    // ground
    const erde = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI * 0.5).translate(0, -5, 0),
      new THREE.MeshBasicMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 1024;
          const ctx = c.getContext("2d");
          const u = val => val * 0.01 * c.height;
          
          const grd = ctx.createRadialGradient(u(50), u(50), u(0), u(50), u(50), u(50));
          grd.addColorStop(0.3, "#ccc");
          grd.addColorStop(0.9, "#aaa");
          ctx.fillStyle = grd;
          
          ctx.fillRect(0, 0, c.width, c.height);
          
          const tex = new THREE.CanvasTexture(c);
          tex.anisotropy = 16;
          tex.colorSpace = "srgb";
          return tex;
        })()        
      })
    );
    this.add(erde);
    
    // forest
    const wald = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 4, 200, 1, true, 0, Math.PI * 0.5).rotateY(Math.PI * 0.75),
      new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 256;
          const ctx = c.getContext("2d");
          const u = val => val * 0.01 * c.height;
          
          const grd = ctx.createLinearGradient(0, 0, 0, c.height);
          grd.addColorStop(0, "#666");
          grd.addColorStop(1, "#aaa");
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, c.width, c.height);
          
          const tex = new THREE.CanvasTexture(c);
          tex.anisotropy = 16;
          tex.colorSpace = "srgb";
          return tex;
        })() 
      })
    );
    const waldPos = wald.geometry.attributes.position;
    for(let i = 0; i < waldPos.count; i++){
      const y = waldPos.getY(i);
      if(y < 0) continue;
      const v = wald.geometry.attributes.uv.getX(i);
      const hVal = simplex.noise(v * 20, Math.PI);
      waldPos.setY(i, y + hVal * 0.5 - 0.5);
    }
    wald.position.y = -2;
    this.add(wald);
    
    // meadow
    const wiese = new Wiese();
    this.add(wiese);
    this.wiese = wiese;
    
    // animation
    this.flapping(1000);
  }
  
  flapping(delay){
    new TWEEN.Tween({val: 0}).to({val: 1}, 500)
      .delay(delay)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(val => {
        const sinVal = Math.sin(val.val * Math.PI);
        const aVal = -sinVal * Math.PI * 0.5;
        this.wings.forEach((wing, wIdx) => {
          const rotDir = wIdx == 0 ? 1 : -1;
          wing.rotation.y = aVal * rotDir;
        });
        this.body.position.y = -0.5 * sinVal;
      })
      .onComplete(() => {
        const dly = Math.floor(Math.random() * 15) * 100
        this.flapping(dly);
      })
      .start();
  }
}

class SchmetterlingSzene extends THREE.WebGLRenderTarget{
  constructor(renderer){
    const width = 1024;
    const height = width * 1.5;
    super(width, height);
    this.width = width;
    this.height = height;
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
    this.camera.position.set(0.125, 1, 1).setLength(21);
    this.camera.lookAt(0.1, 0, 0);
    this.scene = new Schmetterling();
    this.renderer = renderer;
    
  }
  
  render(){
    this.scene.wiese.update();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setRenderTarget(this);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setRenderTarget(null);
  }
}

class Postcard extends THREE.Mesh{
  constructor(renderer){
    super();
    
    const g = new THREE.BoxGeometry(10, 15, 0.03);
    this.schmetterlingSzene = new SchmetterlingSzene(renderer);
    this.lu = {
      schmetterlingSzeneTex: {value: this.schmetterlingSzene.texture}
    }
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#face8d").lerp(new THREE.Color("white"), 0.9),
      onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;
        shader.uniforms.inkColor = {value: new THREE.Color("maroon").multiplyScalar(0.5)};
        shader.uniforms.frontSide = this.lu.schmetterlingSzeneTex;
        shader.uniforms.backSide = {value: (() => {
          const c = document.createElement("canvas");
          c.width = 1024;
          c.height = 1024 * 1.5;
          const ctx = c.getContext("2d");
          const u = val => val * 0.01 * c.height;
          
          ctx.translate(c.width * 0.0625, c.height * 0.25);
          const rotVal = -THREE.MathUtils.degToRad(15);
          ctx.rotate(rotVal);
          
          ctx.lineCap = ctx.lineJoin = "round";
          
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#888";
          
          // debug
          ctx.lineWidth = u(0.25);
          //ctx.strokeRect(0, 0, u(5), u(5));
          
          const fontSize = u(3.75);
          const lineSpace = fontSize * 1.5;
          const shearVal = lineSpace * Math.tan(rotVal);
          ctx.font = `${fontSize}px HomemadeApple`;
          
          [
            "Mit  einem  Schmetterling",
            "Ich  gehe  zu  dem  Wald.",
            "Es  werde  nackt  und  bloß,",
            "Mein  kleiner  Leser,  bald...",
            "",
            "2014"
          ].forEach((line, lIdx, lArr) => {
            const laLen = lArr.length;
            const lx = shearVal * lIdx;
            const ly = lineSpace * lIdx;
            //ctx.strokeText(line, lx, ly);
            ctx.fillText(line, lx, ly);
          });
          
          const tex = new THREE.CanvasTexture(c);
          tex.anisotropy = 16;
          tex.colorSpace = "srgb";
          return tex;
        })()}
        
        shader.vertexShader = `
          varying float vIsBack;
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
            vIsBack = normal.z;
          `
        );
        shader.fragmentShader = `
          uniform vec3 inkColor;
          uniform sampler2D frontSide;
          uniform sampler2D backSide;
          varying float vIsBack;
          ${shader.fragmentShader}
        `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
          vec3 col = diffuse;
          vec4 sideData = vIsBack < 0. ? texture(backSide, vUv) : 
                          vIsBack > 0. ? 1. - texture(frontSide, vUv) :
                          vec4(0);
          col = mix(col, inkColor, sideData.g);
          vec4 diffuseColor = vec4( col, opacity );`
        );
      }
    });
    m.defines = {"USE_UV": ""};
    
    this.geometry = g;
    this.material = m;
  }
  
  render(){
    this.schmetterlingSzene.render();
  }
}


const scene = new THREE.Scene();
scene.background = new THREE.Color("#ccc");//new THREE.Color("#face8d").lerp(new THREE.Color("white"), 0.75);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
camera.position.set(-0.25, 0.25, 1).setLength(20);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const pmremGenerator = new THREE.PMREMGenerator( renderer );
const backTex = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
scene.environment = backTex;
scene.background = backTex;

const postcard = new Postcard(renderer);
scene.add(postcard);

const clock = new THREE.Clock();
let t = 0;

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  t += dt;
  gu.time.value = t;
  gu.timeDelta.value = dt;
  
  controls.update();
  TWEEN.update();
  
  postcard.render();
  
  renderer.render(scene, camera);
})