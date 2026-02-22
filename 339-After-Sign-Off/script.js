// ── PALETTE / CHANNELS ───────────────────────────────────────────
const CHANNELS = [
  { ch:  1, name: 'Ink',   hex: '#1a1814', r:26,  g:24,  b:20,  desc:'the sky at midnight'          },
  { ch:  2, name: 'Storm', hex: '#2e3d4f', r:46,  g:61,  b:79,  desc:'cumulonimbus at dusk'         },
  { ch:  3, name: 'Slate', hex: '#6b7f8e', r:107, g:127, b:142, desc:'wet flagstone'                },
  { ch:  4, name: 'Rain',  hex: '#8fafc2', r:143, g:175, b:194, desc:'first drops on glass'         },
  { ch:  5, name: 'Moss',  hex: '#4a5e45', r:74,  g:94,  b:69,  desc:'lichen on old walls'          },
  { ch:  6, name: 'Clay',  hex: '#9c7c5e', r:156, g:124, b:94,  desc:'exposed earth'                },
  { ch:  7, name: 'Ochre', hex: '#c4893a', r:196, g:137, b:58,  desc:'amber before the storm'       },
  { ch:  8, name: 'Petal', hex: '#d4a5a0', r:212, g:165, b:160, desc:'wild rose, last bloom'        },
  { ch:  9, name: 'Dust',  hex: '#c8bfad', r:200, g:191, b:173, desc:'dry road before rain'         },
  { ch: 10, name: 'Stone', hex: '#e8e2d9', r:232, g:226, b:217, desc:'limestone in afternoon light' },
];

// ── CANVAS SETUP ─────────────────────────────────────────────────
const tvScreen = document.getElementById('tvScreen');
const canvas   = document.getElementById('screen');
const ctx      = canvas.getContext('2d');
const glow     = document.getElementById('glow');

let CW, CH;
function resizeCanvas() {
  const rect = tvScreen.getBoundingClientRect();
  CW = canvas.width  = rect.width;
  CH = canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── STATE ─────────────────────────────────────────────────────────
let currentCh   = 0;
let staticNoise  = null;
let noiseAge     = 0;
let staticBurst  = 0;
let switching    = false;
let scanOffset   = 0;
let glitchTimer  = 0;
let ticker       = 0;

// ── BUILD CHANNEL BUTTONS ─────────────────────────────────────────
const strip = document.getElementById('channelStrip');
CHANNELS.forEach((ch, i) => {
  const btn = document.createElement('button');
  btn.className = 'ch-btn' + (i === 0 ? ' active' : '');
  btn.textContent = String(ch.ch).padStart(2, '0');
  btn.style.setProperty('--ch-color', ch.hex);
  btn.addEventListener('click', () => switchTo(i));
  strip.appendChild(btn);
});

function updateButtons(idx) {
  document.querySelectorAll('.ch-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
}

// ── PHOSPHOR GLOW ─────────────────────────────────────────────────
function setGlow(ch) {
  const { r, g, b } = ch;
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  const a = 0.25 + brightness * 0.3;
  glow.style.boxShadow = `
    0 0 18px rgba(${r},${g},${b},${a}),
    0 0 45px rgba(${r},${g},${b},${a * 0.6}),
    0 0 90px rgba(${r},${g},${b},${a * 0.3})
  `;
}

// ── NOISE BUFFER ──────────────────────────────────────────────────
function makeNoiseBuffer() {
  const off = document.createElement('canvas');
  off.width = CW; off.height = CH;
  const oc = off.getContext('2d');
  const id = oc.createImageData(CW, CH);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255 | 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 255;
  }
  oc.putImageData(id, 0, 0);
  return off;
}

// ── DRAW SCREEN ───────────────────────────────────────────────────
function drawScreen(ch, staticAlpha) {
  const { r, g, b, hex, name, desc, ch: chNum } = ch;
  ticker++;

  // Base color fill
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, CW, CH);

  // CRT vignette darkening
  const vg = ctx.createRadialGradient(CW/2, CH/2, CH*0.1, CW/2, CH/2, CH*0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CW, CH);

  // Phosphor warmth glow from center
  const luma = (r*0.299 + g*0.587 + b*0.114) / 255;
  const pgA  = 0.12 + luma * 0.15;
  const pg   = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CH*0.55);
  pg.addColorStop(0, `rgba(255,255,255,${pgA})`);
  pg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, CW, CH);

  // Moving scanline band
  scanOffset = (scanOffset + 0.4) % CH;
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = scanOffset % 80; y < CH; y += 80) {
    ctx.fillRect(0, y, CW, 2);
  }

  // Occasional glitch line
  glitchTimer++;
  if (glitchTimer > 180 && Math.random() < 0.03) {
    glitchTimer = 0;
    const gy = Math.random() * CH | 0;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`;
    ctx.fillRect(0, gy, CW, (Math.random() * 3 + 1) | 0);
  }

  // Text color based on background luminance
  const textLight = `rgba(232,226,217,0.92)`;
  const textDark  = `rgba(26,24,20,0.80)`;
  const subLight  = `rgba(200,191,173,0.65)`;
  const subDark   = `rgba(46,24,20,0.55)`;
  const dimLight  = `rgba(200,191,173,0.40)`;
  const dimDark   = `rgba(46,24,20,0.38)`;
  const mainColor = luma < 0.45 ? textLight : textDark;
  const subColor  = luma < 0.45 ? subLight  : subDark;
  const dimColor  = luma < 0.45 ? dimLight  : dimDark;

  // Channel number — top left
  ctx.font = `bold ${CW * 0.075}px 'VT323', monospace`;
  ctx.textAlign = 'left';
  ctx.fillStyle = `rgba(0,0,0,0.2)`;
  ctx.fillText(`CH ${String(chNum).padStart(2, '0')}`, CW*0.05 + 1, CW*0.1 + 1);
  ctx.fillStyle = mainColor.replace('0.92','0.15').replace('0.80','0.12');
  ctx.fillText(`CH ${String(chNum).padStart(2, '0')}`, CW*0.05, CW*0.1);

  // Color name — large centered
  const nameSize = CW * 0.155;
  ctx.font = `${nameSize}px 'VT323', monospace`;
  ctx.textAlign = 'center';
  // drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillText(name.toUpperCase(), CW/2 + 2, CH/2 + nameSize*0.34 + 2);
  ctx.fillStyle = mainColor;
  ctx.fillText(name.toUpperCase(), CW/2, CH/2 + nameSize*0.34);

  // Hex code
  ctx.font = `${CW * 0.055}px 'Share Tech Mono', monospace`;
  ctx.fillStyle = subColor;
  ctx.fillText(hex.toUpperCase(), CW/2, CH/2 + nameSize*0.34 + CW*0.075);

  // Description
  ctx.font = `${CW * 0.038}px 'Share Tech Mono', monospace`;
  ctx.fillStyle = dimColor;
  ctx.fillText(desc, CW/2, CH/2 + nameSize*0.34 + CW*0.13);

  // RGB bars at bottom
  const barY = CH - CW*0.085;
  const barH = CW*0.025;
  const barW = CW*0.65;
  const barX = (CW - barW) / 2;
  const segments = [
    { label:'R', val:r, color:'rgba(212,100,100,0.7)' },
    { label:'G', val:g, color:'rgba(100,180,120,0.7)' },
    { label:'B', val:b, color:'rgba(100,150,220,0.7)' },
  ];
  ctx.font = `${CW * 0.032}px 'Share Tech Mono', monospace`;
  segments.forEach((seg, i) => {
    const by = barY + i * (barH + CW*0.018);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.roundRect(barX, by, barW, barH, barH/2);
    ctx.fill();
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.roundRect(barX, by, barW * (seg.val/255), barH, barH/2);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.fillStyle = dimColor;
    ctx.fillText(`${seg.label} ${seg.val}`, barX - CW*0.016, by + barH*0.82);
  });
  ctx.textAlign = 'left';

  // Static overlay
  if (staticAlpha > 0.01) {
    if (!staticNoise || noiseAge++ > 3) {
      staticNoise = makeNoiseBuffer();
      noiseAge = 0;
    }
    ctx.globalAlpha = staticAlpha;
    ctx.drawImage(staticNoise, 0, 0);
    ctx.globalAlpha = 1;
  }
}

// ── SWITCH CHANNEL ────────────────────────────────────────────────
function switchTo(idx) {
  if (switching) return;
  switching    = true;
  currentCh    = ((idx % CHANNELS.length) + CHANNELS.length) % CHANNELS.length;
  staticBurst  = 1.0;

  updateButtons(currentCh);
  setGlow(CHANNELS[currentCh]);

  tvScreen.classList.add('switching');
  setTimeout(() => {
    tvScreen.classList.remove('switching');
    switching = false;
  }, 500);
}

function next() { switchTo(currentCh + 1); }
function prev() { switchTo(currentCh - 1); }

// ── INPUT ─────────────────────────────────────────────────────────
document.getElementById('nextKnob').addEventListener('click', next);
document.getElementById('prevKnob').addEventListener('click', prev);
tvScreen.addEventListener('click', next);

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown')                { e.preventDefault(); prev(); }
  const n = parseInt(e.key);
  if (!isNaN(n) && n >= 1 && n <= 9) switchTo(n - 1);
  if (e.key === '0') switchTo(9);
});

// Auto-advance
let autoTimer = setInterval(next, 6000);
tvScreen.addEventListener('click', () => {
  clearInterval(autoTimer);
  autoTimer = setInterval(next, 8000);
});

// ── RENDER LOOP ───────────────────────────────────────────────────
setGlow(CHANNELS[currentCh]);

function loop() {
  staticBurst = staticBurst > 0.01 ? staticBurst * 0.82 : 0;
  drawScreen(CHANNELS[currentCh], staticBurst);
  requestAnimationFrame(loop);
}

loop();
