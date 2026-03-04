import {Vector2 as vec2, Timer} from "three";
import {SimplexNoise} from "three/addons/math/SimplexNoise.js";

console.clear();

// load fonts
await (async function () {
  async function loadFont(fontface) {
    await fontface.load();
    document.fonts.add(fontface);
  }
  let fonts = [
    new FontFace(
      "KodeMono",
      "url(https://fonts.gstatic.com/s/kodemono/v4/A2BYn5pb0QgtVEPFnlYOnYLw.woff2) format('woff2')"
    )
  ];
  for (let font in fonts) {
    await loadFont(fonts[font]);
  }
})();

class HUD {
  constructor() {
    this.color = "#000";
    this.outline = "#fff";
    this.lineWidth = 0.4;
    const baseShape = [
      [-15, -15],
      [5, -15],
      [15, -5],
      [15, 15]
    ].map(p => {return new vec2(...p)});
    
    const center = new vec2();
    const cShift = 33;
    this.baseElements = [
      Array.from({length: baseShape.length}, (p, pIdx) => {return baseShape[pIdx].clone().rotateAround(center, -Math.PI * 0.5 * 0).add(new vec2( cShift, -cShift))}),
      Array.from({length: baseShape.length}, (p, pIdx) => {return baseShape[pIdx].clone().rotateAround(center, -Math.PI * 0.5 * 1).add(new vec2(-cShift, -cShift))}),
      Array.from({length: baseShape.length}, (p, pIdx) => {return baseShape[pIdx].clone().rotateAround(center, -Math.PI * 0.5 * 2).add(new vec2(-cShift,  cShift))}),
      Array.from({length: baseShape.length}, (p, pIdx) => {return baseShape[pIdx].clone().rotateAround(center, -Math.PI * 0.5 * 3).add(new vec2( cShift,  cShift))}),
    ];
    
    const infoShift = 30;
    this.infoElement = [
      Array.from({length: baseShape.length}, (p, pIdx) => {return baseShape[pIdx].clone().rotateAround(center, -Math.PI * 0.5 * 1).add(new vec2( infoShift,  infoShift))}),
      Array.from({length: baseShape.length}, (p, pIdx) => {return baseShape[pIdx].clone().rotateAround(center, -Math.PI * 0.5 * 3).add(new vec2( infoShift,  infoShift))})
    ].flat();
    this.infoBackground = 'rgba(255, 0, 0, 0.25)';
  }
  
  update(t){
    ctx.save();
    
      ctx.translate(u(50), u(50));
      
      ctx.lineJoin = ctx.lineCap = "round";
    
      ctx.beginPath();
      this.baseElements.forEach(be => {
        be.forEach((p, pIdx) => {
          ctx[pIdx == 0 ? "moveTo" : "lineTo"](u(p.x), u(p.y));
        });
      });
    
      ctx.lineWidth = u(this.lineWidth + 1);
      ctx.strokeStyle = this.outline;
      ctx.stroke();
    
      ctx.lineWidth = u(this.lineWidth);
      ctx.strokeStyle = this.color;
      ctx.stroke();
    
      // info;
    
      ctx.fillStyle = this.infoBackground;
      ctx.beginPath();
      this.infoElement.forEach((p, pIdx) => {ctx[pIdx == 0 ? "moveTo" : "lineTo"](u(p.x), u(p.y))});
      ctx.fill();
      ctx.lineWidth = u(0.2);
      ctx.stroke();
    
      ctx.fillStyle = "#400";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = u(0.75);
      let text = "Fluid Plague"
      ctx.font = `${u(3.25)}px KodeMono`;
      ctx.strokeText(text, u(21), u(22));
      ctx.fillText(text, u(21), u(22));
    
      text = "Strain    : HELLBOUND";
      ctx.font = `${u(2)}px KodeMono`;
      ctx.strokeText(text, u(16), u(30));
      ctx.fillText(text, u(16), u(30));
    
      text = "Version   : 8.4.9";
      ctx.strokeText(text, u(16), u(34));
      ctx.fillText(text, u(16), u(34));
    
      text = "Mortality : ABSOLUTE";
      ctx.strokeText(text, u(16), u(38));
      ctx.fillText(text, u(16), u(38));
      
    
    ctx.restore();
  }
}

class Cell extends vec2 {
  constructor(x = 0, y = 0, r = 10, color = "#888"){
    super(x, y);
    this.radius = r;
    this.color = color;
  }
  
  draw(){
    const grd = ctx.createRadialGradient(u(this.x), u(this.y), u(1), u(this.x), u(this.y), u(this.radius));
    grd.addColorStop(0, this.color);
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(u(this.x - this.radius), u(this.y - this.radius), u(this.radius * 2), u(this.radius * 2));
  }
}

class Cells {
  constructor(amount = 100){
    this.items = Array.from({length: amount}, () => {
      return {
        simplexX: new SimplexNoise(),
        simplexY: new SimplexNoise(),
        shadow: new Cell(),
        seed: Math.random() * 100
      }
    });
  }
  
  update(t){
    const time = t * 0.05;
    ctx.save();
      ctx.globalCompositeOperation = "difference";
      ctx.translate(u(50), u(50));
      this.items.forEach(shadow => {
        const x = shadow.simplexX.noise(shadow.seed, time);
        const y = shadow.simplexY.noise(shadow.seed, time);
        shadow.shadow.set(x, y).multiplyScalar(40);
        shadow.shadow.draw();
      });
    ctx.restore();
  }
}

const c = cnv;
const ctx = c.getContext("2d");
let unit = 0;
const u = val => unit * val;

const resize = () => {
  const minVal = Math.min(innerWidth, innerHeight) * 0.95;
  c.width = c.height = minVal;
  unit = c.height * 0.01;
  
  c.style.border = `${u(1)}px solid #444`;
  c.style.borderRadius = `${u(10)}px`;
}
addEventListener("resize", resize);
resize();

const cells = new Cells();
const hud = new HUD();

let reqID = 0;
let t = 0;
const clock = new Timer();

function animate(){
  clock.update();
  try{
    reqID = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    t += dt;
    ctx.fillStyle = "#ddd";
    ctx.fillRect(0, 0, c.width, c.height);
    
    ctx.save();
      cells.update(t);
      hud.update(t);
    ctx.restore();
    
  } catch (e) {
    cancelAnimationFrame(reqID);
    console.log(e);
  }
}

animate();