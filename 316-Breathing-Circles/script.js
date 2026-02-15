import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.3/dist/tweakpane.min.js";

const PI_BY_180 = Math.PI / 180;
const PI2 = 2 * Math.PI;

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let items = [];
let lastTime = Date.now();
let timer = 0;

const params = {
  baseSpeed: 30,
  variableSpeed: 60,
  interval: 0.25,
  baseLineWidth: 1,
  maxLineWidth: 10,
  startRadiusScale: 0.2,
  endRadiusScale: 0.6,
  colorMode: "white",
  lightness: 0.8,
  chroma: 0.15,
  hue: 250 };


let cx, cy;
let startRadiusOuter, endRadiusOuter, outerRadiusDiff;
let startRadiusInner, endRadiusInner, innerRadiusDiff;

class Circle {
  constructor() {
    this.enabled = false;
    this.lineWidth = params.baseLineWidth;
    this.radius = 0;
    this.dir = 1;
    this.color = "white";
  }

  draw() {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, PI2, false);
    ctx.stroke();
    return this;
  }

  update(dt) {
    const distance = Math.abs(startRadiusInner - this.radius);
    let angle, sin;

    if (this.dir === 1) {
      angle = distance / outerRadiusDiff * 180 * PI_BY_180;
      sin = Math.sin(angle);
      this.radius += (params.variableSpeed * sin + params.baseSpeed) * dt;
      this.lineWidth = clamp(
      params.baseLineWidth + sin * 9,
      params.baseLineWidth,
      params.maxLineWidth);

      if (this.radius > endRadiusOuter) {
        this.enabled = false;
        return false;
      }
    } else {
      angle = distance / innerRadiusDiff * 90 * PI_BY_180;
      sin = Math.sin(angle);
      this.radius -= (params.variableSpeed * sin + params.baseSpeed) * dt;
      this.lineWidth = clamp(
      params.baseLineWidth + sin * 9,
      params.baseLineWidth,
      params.maxLineWidth);

      if (this.radius < endRadiusInner) {
        this.enabled = false;
        return false;
      }
    }
    return true;
  }}


function clamp(val, lower, upper) {
  return Math.max(lower, Math.min(val, upper));
}

function updateDimensions() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  cx = window.innerWidth / 2;
  cy = window.innerHeight / 2;

  const minDimension = Math.min(window.innerWidth, window.innerHeight);
  startRadiusOuter = minDimension * params.startRadiusScale;
  endRadiusOuter = minDimension * params.endRadiusScale;
  outerRadiusDiff = endRadiusOuter - startRadiusOuter;

  startRadiusInner = startRadiusOuter;
  endRadiusInner = 0;
  innerRadiusDiff = startRadiusInner - endRadiusInner;

  const circleCount = Math.floor((window.innerWidth + window.innerHeight) / 20);
  const currentCount = items.length;

  if (circleCount > currentCount) {
    for (let i = 0; i < circleCount - currentCount; i++) {
      items.push(new Circle());
    }
  } else if (circleCount < currentCount) {
    items.length = circleCount;
  }
}

function getColor() {
  if (params.colorMode === "white") {
    return "white";
  } else if (params.colorMode === "random") {
    return `oklch(${params.lightness} ${params.chroma} ${Math.random() * 360})`;
  } else {
    return `oklch(${params.lightness} ${params.chroma} ${params.hue})`;
  }
}

function animate() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;
  timer += dt;
  lastTime = now;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (timer > params.interval && items.length > 0) {
    timer = 0;

    let index = items.findIndex(item => !item.enabled);
    if (index === -1) index = 0;

    if (items[index]) {
      items[index].radius = startRadiusOuter;
      items[index].dir = 1;
      items[index].enabled = true;
      items[index].color = getColor();
    }

    let nextIndex = items.findIndex((item, i) => i !== index && !item.enabled);
    if (nextIndex === -1) nextIndex = (index + 1) % items.length;

    if (items[nextIndex]) {
      items[nextIndex].radius = startRadiusInner;
      items[nextIndex].dir = -1;
      items[nextIndex].enabled = true;
      items[nextIndex].color = getColor();
    }
  }

  items.forEach(circle => {
    if (circle.enabled && circle.update(dt)) {
      circle.draw();
    }
  });

  requestAnimationFrame(animate);
}

function init() {
  updateDimensions();
  animate();
}

const pane = new Pane({ title: "Breathing Circles" });

const speedFolder = pane.addFolder({ title: "Speed" });
speedFolder.addBinding(params, "baseSpeed", {
  min: 1,
  max: 100,
  step: 1,
  label: "Base Speed" });

speedFolder.addBinding(params, "variableSpeed", {
  min: 1,
  max: 200,
  step: 1,
  label: "Variable Speed" });

speedFolder.addBinding(params, "interval", {
  min: 0.05,
  max: 2,
  step: 0.05,
  label: "Spawn Interval" });


const sizeFolder = pane.addFolder({ title: "Size" });
sizeFolder.
addBinding(params, "startRadiusScale", {
  min: 0.05,
  max: 0.5,
  step: 0.01,
  label: "Start Radius" }).

on("change", updateDimensions);
sizeFolder.
addBinding(params, "endRadiusScale", {
  min: 0.3,
  max: 1.0,
  step: 0.01,
  label: "End Radius" }).

on("change", updateDimensions);

const styleFolder = pane.addFolder({ title: "Style" });
styleFolder.addBinding(params, "baseLineWidth", {
  min: 0.5,
  max: 5,
  step: 0.5,
  label: "Min Stroke" });

styleFolder.addBinding(params, "maxLineWidth", {
  min: 5,
  max: 20,
  step: 1,
  label: "Max Stroke" });


const colorFolder = pane.addFolder({ title: "Color" });
colorFolder.addBinding(params, "colorMode", {
  label: "Mode",
  options: {
    White: "white",
    Random: "random",
    Fixed: "fixed" } });


colorFolder.addBinding(params, "lightness", {
  min: 0,
  max: 1,
  step: 0.01,
  label: "Lightness" });

colorFolder.addBinding(params, "chroma", {
  min: 0,
  max: 0.4,
  step: 0.01,
  label: "Chroma" });

colorFolder.addBinding(params, "hue", {
  min: 0,
  max: 360,
  step: 1,
  label: "Hue" });


let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateDimensions, 50);
});

init();