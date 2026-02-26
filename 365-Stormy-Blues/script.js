// ── Setup ──────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const flash  = document.getElementById('lightning-flash');
const tooltip = document.getElementById('color-tooltip');
const river  = document.getElementById('palette-river');

let W, H;
const mouse = { x: -999, y: -999, down: false };
let drops = [], puddles = [], splashes = [], streaks = [], halos = [];
let fallen = 0, frame = 0;
let lightningTimer = 0, lightningNext = 220;
let riverColors = Array(32).fill('#0a1628');

// ── Blues-forward palette ──────────────────────────────
const PALETTE = [
  '#0a2fff','#1565ff','#1e90ff','#00b4ff','#00d4ff',
  '#00eaff','#4dd9ff','#0099cc','#006994','#003f6b',
  '#1a3a5c','#00509e','#4facde','#72d4f5','#a8e6f7',
  '#b8d9f0','#c9eeff','#dff5ff','#0047ab','#002366',
  '#4169e1','#5b8cff','#7fc8ff','#9edaff','#2255bb',
  '#0d3b7a','#1b6ca8','#30a0d8','#5ec5ea','#88d8f5',
  '#aeeeff','#e0f7ff',
];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildBgRain();
  buildRiver();
}

// ── Background rain streaks (CSS) ─────────────────────
function buildBgRain() {
  const container = document.getElementById('bg-rain');
  container.innerHTML = '';
  const count = Math.floor(W / 8);
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'bg-streak';
    const h = 40 + Math.random() * 120;
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      height: ${h}px;
      opacity: ${0.08 + Math.random() * 0.18};
      animation-duration: ${0.4 + Math.random() * 0.8}s;
      animation-delay: ${-Math.random() * 2}s;
    `;
    container.appendChild(el);
  }
}

// ── Palette river ──────────────────────────────────────
function buildRiver() {
  river.innerHTML = '';
  for (let i = 0; i < 32; i++) {
    const s = document.createElement('div');
    s.className = 'p-swatch';
    s.style.background = riverColors[i];
    river.appendChild(s);
  }
}
function pushToRiver(color) {
  riverColors.push(color);
  if (riverColors.length > 32) riverColors.shift();
  const swatches = river.querySelectorAll('.p-swatch');
  swatches.forEach((s, i) => { s.style.background = riverColors[i]; });
}

// ── Raindrop class ─────────────────────────────────────
class Raindrop {
  constructor(fromClick) {
    this.fromClick = fromClick || false;
    this.reset();
  }
  reset() {
    this.color  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    this.x      = 30 + Math.random() * (W - 60);
    this.y      = -20 - Math.random() * 300;
    // Teardrop proportions
    this.r      = 5 + Math.random() * 9;
    this.tail   = this.r * (2.5 + Math.random() * 2);
    // Slight diagonal like real rain
    this.vx     = -0.8 + Math.random() * 0.4;
    this.vy     = 6 + Math.random() * 8;
    this.alive  = true;
    this.alpha  = 0;
    this.burst  = false;
    this.wobble = Math.random() * Math.PI * 2;
    this.glow   = Math.random() < 0.3;
    this.hex    = this.color.toUpperCase();
    // streak trail
    this.trail  = [];
    this.hovered = false;
  }

  update() {
    this.wobble += 0.06;

    // Mouse repulsion
    const dx   = this.x - mouse.x;
    const dy   = this.y - mouse.y;
    const dist = Math.hypot(dx, dy);
    const rep  = mouse.down ? 130 : 75;
    if (dist < rep && dist > 1) {
      const f  = (rep - dist) / rep;
      this.vx += (dx / dist) * f * 2.2;
      this.vy -= (dy / dist) * f * 0.5;
    }

    this.vx *= 0.98;
    this.vy  = Math.min(this.vy + 0.12, 18);
    this.x  += this.vx + Math.sin(this.wobble) * 0.25;
    this.y  += this.vy;
    this.alpha = Math.min(1, this.alpha + 0.06);

    // Trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();

    // Bounds
    if (this.x < 0) { this.x = 0; this.vx *= -0.4; }
    if (this.x > W) { this.x = W; this.vx *= -0.4; }

    // Land
    if (this.y > H - 14) {
      this.alive = false;
      fallen++;
      this.land();
    }
  }

  land() {
    puddles.push(new Puddle(this.x, H - 10, this.color, this.r));
    for (let i = 0; i < 6; i++) splashes.push(new Splash(this.x, H - 10, this.color));
    pushToRiver(this.color);
    document.getElementById('ct-fallen').textContent  = fallen;
    document.getElementById('ct-puddles').textContent = puddles.length;
  }

  burstDrop() {
    if (this.burst) return;
    this.burst = true;
    this.alive = false;
    for (let i = 0; i < 18; i++) splashes.push(new Splash(this.x, this.y, this.color, true));
    halos.push(new Halo(this.x, this.y, this.color));
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Streak trail
    if (this.trail.length > 2) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y - this.tail);
      this.trail.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.r * 0.35;
      ctx.globalAlpha = this.alpha * 0.2;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.globalAlpha = this.alpha;
    }

    ctx.translate(this.x, this.y);

    // Glow halo
    if (this.glow) {
      const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r * 2.8);
      gl.addColorStop(0, this.color + '55');
      gl.addColorStop(1, 'transparent');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(0, 0, this.r * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Teardrop shape
    ctx.beginPath();
    ctx.moveTo(0, -this.tail);
    ctx.bezierCurveTo(this.r * 0.6, -this.r, this.r, 0, 0, this.r * 1.1);
    ctx.bezierCurveTo(-this.r, 0, -this.r * 0.6, -this.r, 0, -this.tail);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Inner shine
    ctx.beginPath();
    ctx.ellipse(-this.r * 0.2, -this.r * 0.1, this.r * 0.28, this.r * 0.55, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();

    // Outline
    ctx.beginPath();
    ctx.moveTo(0, -this.tail);
    ctx.bezierCurveTo(this.r * 0.6, -this.r, this.r, 0, 0, this.r * 1.1);
    ctx.bezierCurveTo(-this.r, 0, -this.r * 0.6, -this.r, 0, -this.tail);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();

    // Hex label
    const fs = Math.max(6, this.r * 0.72);
    ctx.font         = `700 ${fs}px 'Courier Prime', monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = lum(this.color) > 0.38
      ? 'rgba(0,0,0,0.75)'
      : 'rgba(255,255,255,0.9)';
    ctx.fillText(this.hex, 0, this.r * 0.05);

    ctx.restore();
  }
}

// ── Puddle class ───────────────────────────────────────
class Puddle {
  constructor(x, y, color, r) {
    this.x     = x; this.y = y;
    this.color = color;
    this.maxRx = (r * 3 + Math.random() * r * 4);
    this.rx    = 1; this.ry = 1;
    this.alpha = 0;
    this.rings = [{ r: 1, life: 1 }];
    this.ringTimer = 0;
    this.alive = true;
  }
  update() {
    this.rx    = Math.min(this.maxRx, this.rx + 1.2);
    this.ry    = Math.min(this.maxRx * 0.22, this.ry + 0.25);
    this.alpha = Math.min(0.55, this.alpha + 0.04);

    this.ringTimer++;
    if (this.ringTimer % 28 === 0) this.rings.push({ r: 1, life: 1 });
    this.rings.forEach(rg => { rg.r += 0.7; rg.life -= 0.018; });
    this.rings = this.rings.filter(rg => rg.life > 0);
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.alpha;

    // Puddle body
    ctx.beginPath();
    ctx.ellipse(0, 0, this.rx, this.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Sheen
    ctx.beginPath();
    ctx.ellipse(-this.rx * 0.2, -this.ry * 0.2, this.rx * 0.5, this.ry * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();

    // Ripple rings
    this.rings.forEach(rg => {
      ctx.beginPath();
      ctx.ellipse(0, 0, rg.r * (this.rx / this.maxRx) * 2.2, rg.r * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = 1;
      ctx.globalAlpha = this.alpha * rg.life * 0.6;
      ctx.stroke();
    });

    ctx.restore();
  }
}

// ── Splash particle ────────────────────────────────────
class Splash {
  constructor(x, y, color, big) {
    this.x = x; this.y = y;
    this.color = color;
    const angle = -Math.PI - Math.random() * Math.PI;
    const spd   = big ? 3 + Math.random() * 9 : 1 + Math.random() * 4;
    this.vx     = Math.cos(angle) * spd;
    this.vy     = Math.sin(angle) * spd - (big ? 4 : 2);
    this.life   = 1;
    this.decay  = 0.025 + Math.random() * 0.04;
    this.r      = big ? 2 + Math.random() * 4 : 1 + Math.random() * 2.5;
    this.trail  = [];
  }
  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();
    this.vy   += 0.35;
    this.vx   *= 0.97;
    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= this.decay;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;

    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      this.trail.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.r * 0.5;
      ctx.globalAlpha = this.life * 0.35;
      ctx.stroke();
    }

    ctx.globalAlpha = this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle    = this.color;
    ctx.shadowColor  = this.color;
    ctx.shadowBlur   = 6;
    ctx.fill();
    ctx.restore();
  }
}

// ── Halo ring on burst ─────────────────────────────────
class Halo {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.color = color;
    this.r  = 4;
    this.life = 1;
  }
  update() { this.r += 4; this.life -= 0.045; }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha  = this.life * 0.7;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.strokeStyle  = this.color;
    ctx.lineWidth    = 2;
    ctx.shadowColor  = this.color;
    ctx.shadowBlur   = 12;
    ctx.stroke();
    ctx.restore();
  }
}

// ── Lightning ──────────────────────────────────────────
function triggerLightning() {
  // Flash the sky
  let t = 0;
  const seq = [0.6, 0, 0.9, 0, 0.4, 0];
  function step() {
    if (t >= seq.length) { flash.style.background = 'rgba(200,230,255,0)'; return; }
    flash.style.background = `rgba(200,230,255,${seq[t]})`;
    t++;
    setTimeout(step, 45);
  }
  step();

  // Draw lightning bolt on canvas (briefly)
  const lx   = W * 0.15 + Math.random() * W * 0.7;
  const bolt = [];
  let cx = lx, cy = 0;
  while (cy < H * 0.6) {
    bolt.push({ x: cx, y: cy });
    cx += (Math.random() - 0.5) * 60;
    cy += 20 + Math.random() * 30;
  }
  streaks.push({ bolt, life: 1 });
}

function drawStreaks() {
  streaks.forEach(s => {
    ctx.save();
    ctx.globalAlpha  = s.life * 0.9;
    ctx.strokeStyle  = '#c8f0ff';
    ctx.lineWidth    = 1.5;
    ctx.shadowColor  = '#a0d8ff';
    ctx.shadowBlur   = 14;
    ctx.beginPath();
    s.bolt.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    // Branch
    if (s.bolt.length > 3) {
      const mid = s.bolt[Math.floor(s.bolt.length / 2)];
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
      ctx.lineTo(mid.x + (Math.random() - 0.5) * 80, mid.y + 60 + Math.random() * 60);
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = s.life * 0.5;
      ctx.stroke();
    }
    ctx.restore();
    s.life -= 0.12;
  });
  streaks = streaks.filter(s => s.life > 0);
}

// ── Tooltip on hover ───────────────────────────────────
function checkHover(mx, my) {
  for (const d of drops) {
    const dist = Math.hypot(d.x - mx, d.y - my);
    if (dist < d.r + 8) {
      d.hovered = true;
      tooltip.style.opacity  = '1';
      tooltip.style.left     = (mx + 14) + 'px';
      tooltip.style.top      = (my - 24) + 'px';
      tooltip.textContent    = d.hex;
      tooltip.style.borderColor = d.color + '88';
      return;
    } else {
      d.hovered = false;
    }
  }
  tooltip.style.opacity = '0';
}

// ── Helper ─────────────────────────────────────────────
function lum(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return 0.299*r + 0.587*g + 0.114*b;
}

// ── Events ─────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  checkHover(mouse.x, mouse.y);
});
window.addEventListener('mousedown', () => { mouse.down = true; });
window.addEventListener('mouseup',   () => { mouse.down = false; });

canvas.addEventListener('click', e => {
  const mx = e.clientX, my = e.clientY;
  let hit = false;
  for (const d of drops) {
    if (Math.hypot(d.x - mx, d.y - my) < d.r + 12) {
      d.burstDrop(); hit = true; break;
    }
  }
  if (!hit) {
    // Summon a drop from click
    const d  = new Raindrop(true);
    d.x      = mx;
    d.y      = my - 40;
    d.vy     = 3;
    d.alpha  = 1;
    drops.push(d);
  }
});

// ── Spawn ──────────────────────────────────────────────
let spawnT = 0;
let rate   = 14; // frames between spawns

// ── Main loop ──────────────────────────────────────────
function loop() {
  frame++;

  // Spawn
  spawnT++;
  const maxDrops = Math.min(60, 20 + Math.floor(frame / 180));
  if (spawnT >= rate && drops.length < maxDrops) {
    spawnT = 0;
    drops.push(new Raindrop());
    // Occasional burst of 3
    if (Math.random() < 0.12) {
      drops.push(new Raindrop());
      drops.push(new Raindrop());
    }
    rate = Math.max(7, rate - 0.008);
  }

  // Lightning
  lightningTimer++;
  if (lightningTimer >= lightningNext) {
    lightningTimer = 0;
    lightningNext  = 180 + Math.floor(Math.random() * 340);
    triggerLightning();
  }

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Draw puddles first (bottom layer)
  puddles.forEach(p => { p.update(); p.draw(); });

  // Splashes
  splashes = splashes.filter(s => s.life > 0);
  splashes.forEach(s => { s.update(); s.draw(); });

  // Lightning streaks
  drawStreaks();

  // Halos
  halos = halos.filter(h => h.life > 0);
  halos.forEach(h => { h.update(); h.draw(); });

  // Drops
  drops = drops.filter(d => d.alive);
  drops.forEach(d => { d.update(); d.draw(); });

  document.getElementById('ct-active').textContent = drops.length;

  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();