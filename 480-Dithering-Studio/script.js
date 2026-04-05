import GUI from "https://esm.sh/lil-gui";
const IMAGE_SOURCE = 'https://images.unsplash.com/photo-1700583173020-624f5f11188c?w=1200';
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let originalImageBitmap = null;
let originalImageData = null;
let currentImageWidth = 0;
let currentImageHeight = 0;
const settings = {
    thresholdMap: 'art_deco_8x8',
    patternScale: 1.0,
    brightness: 128,
    contrast: 1.0,
    invert: !1,
    thresholdOffset: 0.0,
};
const bayer4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16.0);

function generateBayer8() {
    let m2 = [
        [0, 2],
        [3, 1]
    ];

    function expand(mat) {
        const n = mat.length;
        const newSize = n * 2;
        const res = Array(newSize).fill().map(() => Array(newSize).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = mat[i][j];
                res[i * 2][j * 2] = 4 * val;
                res[i * 2][j * 2 + 1] = 4 * val + 2;
                res[i * 2 + 1][j * 2] = 4 * val + 3;
                res[i * 2 + 1][j * 2 + 1] = 4 * val + 1
            }
        }
        return res
    }
    let m4 = expand(m2);
    let m8 = expand(m4);
    let flat = [];
    for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
            flat.push(m8[i][j] / 64.0);
    return flat
}
const bayer8Map = generateBayer8();

function generateOrganicMap(size = 8) {
    const total = size * size;
    let raw = new Array(total);
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = (i - center) / (size / 2);
            let dy = (j - center) / (size / 2);
            let radius = Math.sqrt(dx * dx + dy * dy);
            let angleNoise = (Math.sin(i * 2.3) * Math.cos(j * 1.9) + 1) / 2;
            let radial = Math.max(0, 1 - radius);
            let mix = (radial * 0.55 + angleNoise * 0.45);
            raw[i * size + j] = mix
        }
    }
    let indexed = raw.map((v, idx) => ({
        v,
        idx
    }));
    indexed.sort((a, b) => a.v - b.v);
    let result = new Array(total);
    for (let rank = 0; rank < total; rank++) result[indexed[rank].idx] = rank / (total - 1);
    return result
}
const organic8 = generateOrganicMap(8);

function generateClusteredDot(size = 6) {
    const total = size * size;
    let vals = new Array(total);
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let maxDist = Math.sqrt(center * center + center * center);
            vals[i * size + j] = dist / maxDist
        }
    }
    let min = Math.min(...vals),
        max = Math.max(...vals);
    for (let i = 0; i < total; i++) vals[i] = (vals[i] - min) / (max - min);
    return vals
}
const clustered6 = generateClusteredDot(6);

function generateVoidAndCluster() {
    const vcPattern = [48, 12, 40, 20, 56, 28, 36, 8, 16, 52, 24, 44, 4, 60, 32, 24, 40, 20, 56, 12, 48, 8, 36, 28, 60, 4, 44, 32, 16, 52, 24, 48, 28, 36, 8, 56, 20, 40, 12, 52, 24, 44, 16, 4, 60, 32, 48, 20, 56, 12, 48, 28, 36, 8, 40, 16, 32, 60, 24, 44, 12, 52, 28, 36];
    return vcPattern.map(v => v / 64.0)
}
const voidClusterMap = generateVoidAndCluster();

function generateArtDecoMap(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let diag = (i + j) % (size * 2);
            let curve = Math.sin(i * 0.8) * Math.cos(j * 0.8);
            let val = (diag / (size * 2) + curve * 0.2) % 1.0;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const artDecoMap = generateArtDecoMap(8);

function generateDiagonalWave(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let d = (i + j) / (size * 2);
            let wave = (Math.sin(i * 1.2) + Math.cos(j * 1.2)) * 0.25;
            let val = d + wave;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const diagonalWaveMap = generateDiagonalWave(8);

function generateSpiralMap(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let angle = Math.atan2(dy, dx);
            let radius = Math.sqrt(dx * dx + dy * dy) / (center + 0.5);
            let spiral = (angle / (Math.PI * 2) + radius * 1.5) % 1.0;
            map.push(spiral)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const spiralMap = generateSpiralMap(8);

function generateHalftoneCircles(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let maxDist = Math.sqrt(center * center + center * center);
            let normDist = dist / maxDist;
            let val = Math.sin(normDist * Math.PI * 1.2) * 0.7 + 0.3;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const halftoneCircles = generateHalftoneCircles(8);

function generateHalftoneLines(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let lineVal = (Math.sin(i * 1.8) + 1) / 2;
            let cross = (Math.cos(j * 1.5) + 1) / 2;
            let val = (lineVal * 0.6 + cross * 0.4);
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const halftoneLines = generateHalftoneLines(8);

function generateMoirePattern(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let chess = ((i % 2 === 0) === (j % 2 === 0)) ? 0.2 : 0.8;
            let waveX = Math.sin(i * 1.2) * 0.2;
            let waveY = Math.cos(j * 1.2) * 0.2;
            let val = chess + waveX + waveY;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const moirePattern = generateMoirePattern(8);

function generateHexagonalGrid(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let hexX = (i + (j % 2) * 0.5) / size;
            let hexY = j / size;
            let distToCenter = Math.hypot(hexX - 0.5, hexY - 0.5);
            let val = Math.sin(distToCenter * Math.PI * 3) * 0.5 + 0.5;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const hexagonalGrid = generateHexagonalGrid(8);

function generateZebraStripes(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let angle = (i * 0.9 + j * 1.2);
            let stripe = (Math.sin(angle) + 1) / 2;
            let val = stripe;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const zebraStripes = generateZebraStripes(8);

function generateStochasticDots(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let seed = (Math.sin(i * 12.9898) * Math.cos(j * 78.233 + 43758.5453)) % 1;
            let val = Math.abs(seed);
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const stochasticDots = generateStochasticDots(8);

function generateConcentricWaves(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let dist = Math.hypot(dx, dy);
            let wave = (Math.sin(dist * 1.8) + 1) / 2;
            map.push(wave)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const concentricWaves = generateConcentricWaves(8);

function generateWebPattern(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let angle = Math.atan2(dy, dx);
            let radius = Math.hypot(dx, dy) / (center + 0.5);
            let webRadial = Math.sin(radius * Math.PI * 4) * 0.4;
            let webAngular = Math.sin(angle * 6) * 0.3;
            let val = (radius + webRadial + webAngular) % 1.0;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const webPattern = generateWebPattern(8);

function generateRadialBurst(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let angle = Math.atan2(dy, dx);
            let radius = Math.hypot(dx, dy) / (center + 0.5);
            let burst = Math.pow(radius, 0.5) * (Math.sin(angle * 8) * 0.3 + 0.7);
            let val = burst % 1.0;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const radialBurst = generateRadialBurst(8);

function generateCheckerFractal(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let level1 = ((Math.floor(i / 2) + Math.floor(j / 2)) % 2) * 0.5;
            let level2 = ((i + j) % 2) * 0.3;
            let noise = Math.sin(i * 1.7) * Math.cos(j * 1.7) * 0.2;
            let val = level1 + level2 + noise;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const checkerFractal = generateCheckerFractal(8);

function generateSwirlPattern(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let angle = Math.atan2(dy, dx);
            let radius = Math.hypot(dx, dy) / (center + 0.5);
            let swirl = (angle / (Math.PI * 2) + radius * 2.5) % 1.0;
            let twist = Math.sin(radius * Math.PI * 3) * 0.15;
            let val = (swirl + twist) % 1.0;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const swirlPattern = generateSwirlPattern(8);

function generateStarburst(size = 8) {
    let map = [];
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let dx = i - center;
            let dy = j - center;
            let angle = Math.atan2(dy, dx);
            let radius = Math.hypot(dx, dy) / (center + 0.5);
            let spikes = Math.abs(Math.cos(angle * 5)) * 0.6;
            let val = (radius * 0.5 + spikes) % 1.0;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const starburst = generateStarburst(8);

function generateMazePattern(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let hWall = (Math.floor(i / 1.5) % 3 === 0) ? 0.7 : 0.2;
            let vWall = (Math.floor(j / 1.5) % 3 === 1) ? 0.7 : 0.2;
            let corner = (Math.sin(i * 1.2) * Math.cos(j * 1.2) + 1) / 2 * 0.3;
            let val = (hWall * vWall) * 0.8 + corner;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const mazePattern = generateMazePattern(8);

function generatePureHoneycomb(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let hexX = i * 0.866;
            let hexY = j + (Math.floor(i / 1.5) % 2) * 0.5;
            let cellX = Math.floor(hexX / 1.2);
            let cellY = Math.floor(hexY / 1.2);
            let cx = cellX * 1.2;
            let cy = cellY * 1.2;
            let dx = hexX - cx;
            let dy = hexY - cy;
            let distToCenter = Math.hypot(dx - 0.6, dy - 0.6);
            let val = Math.sin(distToCenter * Math.PI * 2.5) * 0.5 + 0.5;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const pureHoneycomb = generatePureHoneycomb(8);

function generateCombPattern(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let tooth = Math.abs(Math.sin(i * 3.0)) * 0.8;
            let spine = Math.sin(j * 2.5) * 0.3;
            let val = (tooth + spine) % 1.0;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const combPattern = generateCombPattern(8);

function generatePhaseWaves(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let wave1 = Math.sin(i * 1.2 + j * 0.8) * 0.4;
            let wave2 = Math.cos(i * 0.7 + j * 1.3 + 1.2) * 0.3;
            let wave3 = Math.sin(i * 2.5) * Math.cos(j * 2.5) * 0.3;
            let val = (wave1 + wave2 + wave3 + 1) / 2;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const phaseWaves = generatePhaseWaves(8);

function generatePlasmaFractal(size = 8) {
    let map = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let val = 0;
            let amplitude = 0.5;
            let frequency = 1.0;
            for (let octave = 0; octave < 4; octave++) {
                val += amplitude * Math.sin(i * frequency * 0.8) * Math.cos(j * frequency * 0.7);
                val += amplitude * Math.sin((i + j) * frequency * 0.6) * 0.5;
                amplitude *= 0.5;
                frequency *= 2.0
            }
            val = (val + 1) / 2;
            map.push(val)
        }
    }
    let min = Math.min(...map),
        max = Math.max(...map);
    return map.map(v => (v - min) / (max - min))
}
const plasmaFractal = generatePlasmaFractal(8);
const thresholdMapsLib = {
    bayer_4x4: {
        data: bayer4,
        size: 4
    },
    bayer_8x8: {
        data: bayer8Map,
        size: 8
    },
    organic_8x8: {
        data: organic8,
        size: 8
    },
    clustered_6x6: {
        data: clustered6,
        size: 6
    },
    void_cluster_8x8: {
        data: voidClusterMap,
        size: 8
    },
    art_deco_8x8: {
        data: artDecoMap,
        size: 8
    },
    diagonal_wave: {
        data: diagonalWaveMap,
        size: 8
    },
    spiral_map: {
        data: spiralMap,
        size: 8
    },
    halftone_circles: {
        data: halftoneCircles,
        size: 8
    },
    halftone_lines: {
        data: halftoneLines,
        size: 8
    },
    moire_pattern: {
        data: moirePattern,
        size: 8
    },
    hexagonal_grid: {
        data: hexagonalGrid,
        size: 8
    },
    zebra_stripes: {
        data: zebraStripes,
        size: 8
    },
    stochastic_dots: {
        data: stochasticDots,
        size: 8
    },
    concentric_waves: {
        data: concentricWaves,
        size: 8
    },
    web_pattern: {
        data: webPattern,
        size: 8
    },
    radial_burst: {
        data: radialBurst,
        size: 8
    },
    checker_fractal: {
        data: checkerFractal,
        size: 8
    },
    swirl_pattern: {
        data: swirlPattern,
        size: 8
    },
    starburst: {
        data: starburst,
        size: 8
    },
    maze_pattern: {
        data: mazePattern,
        size: 8
    },
    pure_honeycomb: {
        data: pureHoneycomb,
        size: 8
    },
    comb_pattern: {
        data: combPattern,
        size: 8
    },
    phase_waves: {
        data: phaseWaves,
        size: 8
    },
    plasma_fractal: {
        data: plasmaFractal,
        size: 8
    }
};

function applyDitheringToImageData(imageData, mapKey, patternScale, brightnessVal, contrastVal, invertFlag, thresholdOffset) {
    const mapEntry = thresholdMapsLib[mapKey];
    if (!mapEntry) {
        console.error(`Map not found: ${mapKey}, fallback to bayer_8x8`);
        return applyDitheringToImageData(imageData, 'bayer_8x8', patternScale, brightnessVal, contrastVal, invertFlag, thresholdOffset)
    }
    const {
        data,
        size: matrixSize
    } = mapEntry;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);
    const srcPixels = imageData.data;
    const dstPixels = output.data;
    const scaleFactor = Math.max(0.25, patternScale);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = srcPixels[idx];
            const g = srcPixels[idx + 1];
            const b = srcPixels[idx + 2];
            let lum = 0.299 * r + 0.587 * g + 0.114 * b;
            let adjusted = (lum - 128) * contrastVal + brightnessVal;
            adjusted = Math.min(255, Math.max(0, adjusted));
            let normalizedLum = adjusted / 255.0;
            if (invertFlag) normalizedLum = 1.0 - normalizedLum;
            let finalLum = normalizedLum + thresholdOffset;
            finalLum = Math.min(0.99, Math.max(0.01, finalLum));
            let mx = Math.floor(x / scaleFactor) % matrixSize;
            let my = Math.floor(y / scaleFactor) % matrixSize;
            if (mx < 0) mx = 0;
            if (my < 0) my = 0;
            const threshold = data[my * matrixSize + mx];
            const outputValue = (finalLum > threshold) ? 255 : 0;
            dstPixels[idx] = outputValue;
            dstPixels[idx + 1] = outputValue;
            dstPixels[idx + 2] = outputValue;
            dstPixels[idx + 3] = 255
        }
    }
    return output
}

function resizeCanvasToDisplaySize() {
    if (!originalImageBitmap) return;
    const imgWidth = originalImageBitmap.width;
    const imgHeight = originalImageBitmap.height;
    currentImageWidth = imgWidth;
    currentImageHeight = imgHeight;
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    let displayWidth = maxWidth;
    let displayHeight = (imgHeight / imgWidth) * displayWidth;
    if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = (imgWidth / imgHeight) * displayHeight
    }
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(originalImageBitmap, 0, 0, canvas.width, canvas.height);
    originalImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    refreshFilter()
}

function refreshFilter() {
    if (!originalImageData) return;
    const filtered = applyDitheringToImageData(originalImageData, settings.thresholdMap, settings.patternScale, settings.brightness, settings.contrast, settings.invert, settings.thresholdOffset);
    ctx.putImageData(filtered, 0, 0)
}
async function exportImage() {
    const overlay = document.createElement('div');
    overlay.className = 'export-loading-overlay';
    overlay.innerHTML = `
            <div class="export-spinner"></div>
            <div class="export-message">Exporting...</div>
            <div class="export-submessage">Generating dithered image</div>
        `;
    document.body.appendChild(overlay);
    try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        link.download = `dithering-${Date.now()}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
        console.error("Export error:", err);
        const msgEl = overlay.querySelector('.export-message');
        if (msgEl) msgEl.textContent = "Export error!";
        await new Promise(resolve => setTimeout(resolve, 1500))
    } finally {
        overlay.style.opacity = "0";
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        }, 300)
    }
}
console.log("&Toc on codepen - https://codepen.io/ol-ivier");

function uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const overlay = document.createElement('div');
            overlay.className = 'export-loading-overlay';
            overlay.innerHTML = `
                    <div class="export-spinner"></div>
                    <div class="export-message">Loading...</div>
                    <div class="export-submessage">Processing image</div>
                `;
            document.body.appendChild(overlay);
            try {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = async () => {
                        originalImageBitmap = await createImageBitmap(img);
                        resizeCanvasToDisplaySize();
                        overlay.style.opacity = "0";
                        setTimeout(() => {
                            if (overlay.parentNode) document.body.removeChild(overlay);
                        }, 300)
                    };
                    img.src = event.target.result;
                    document.querySelector("#ui").style.display = "none";
                };
                reader.onerror = () => {
                    throw new Error("File read error")
                };
                reader.readAsDataURL(file)
            } catch (err) {
                console.error("Upload error:", err);
                overlay.style.opacity = "0";
                setTimeout(() => {
                    if (overlay.parentNode) document.body.removeChild(overlay);
                }, 300)
            }
        }
    };
    input.click()
}

function setupGUI() {
    const gui = new GUI({
        title: 'Controls',
        width: 280,
        container: document.getElementById('gui-container')
    });
    const mapOptions = {
        'Bayer 4': 'bayer_4x4',
        'Bayer 8': 'bayer_8x8',
        'Organic': 'organic_8x8',
        'Clustered': 'clustered_6x6',
        'Blue noise': 'void_cluster_8x8',
        'Art Deco': 'art_deco_8x8',
        'Diagonal': 'diagonal_wave',
        'Spiral': 'spiral_map',
        'Circles': 'halftone_circles',
        'Lines': 'halftone_lines',
        'Moiré': 'moire_pattern',
        'Hexagon': 'hexagonal_grid',
        'Zebra': 'zebra_stripes',
        'Stochastic': 'stochastic_dots',
        'Waves': 'concentric_waves',
        'Web': 'web_pattern',
        'Radial': 'radial_burst',
        'Checker': 'checker_fractal',
        'Swirl': 'swirl_pattern',
        'Starburst': 'starburst',
        'Maze': 'maze_pattern',
        'Honeycomb': 'pure_honeycomb',
        'Comb': 'comb_pattern',
        'Phase': 'phase_waves',
        'Plasma': 'plasma_fractal'
    };
    gui.add(settings, 'thresholdMap', mapOptions).name('Threshold map').onChange(() => refreshFilter());
    gui.add(settings, 'patternScale', 0.3, 3.5, 0.01).name('Pattern scale').onChange(() => refreshFilter());
    gui.add(settings, 'brightness', 0, 255, 1).name('Brightness').onChange(() => refreshFilter());
    gui.add(settings, 'contrast', 0.3, 3.0, 0.01).name('Contrast').onChange(() => refreshFilter());
    gui.add(settings, 'thresholdOffset', -0.4, 0.4, 0.005).name('Threshold offset').onChange(() => refreshFilter());
    gui.add(settings, 'invert').name('Invert').onChange(() => refreshFilter());
    const fileFolder = gui.addFolder('File');
    fileFolder.add({
        upload: () => uploadImage()
    }, 'upload').name('Upload image');
    fileFolder.add({
        export: () => exportImage()
    }, 'export').name('Export image');
    fileFolder.open();
    gui.add({
        resetFilters: () => {
            settings.thresholdMap = 'halftone_circles';
            settings.patternScale = 1.0;
            settings.brightness = 128;
            settings.contrast = 1.0;
            settings.thresholdOffset = 0.0;
            settings.invert = !1;
            gui.controllers.forEach(c => {
                if (c.updateDisplay) c.updateDisplay();
            });
            refreshFilter()
        }
    }, 'resetFilters').name('⟳ Reset')
}
async function loadImageAndDisplay() {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = async () => {
            originalImageBitmap = await createImageBitmap(img);
            resizeCanvasToDisplaySize();
            resolve()
        };
        img.onerror = () => {
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = 1200;
            fallbackCanvas.height = 800;
            const fCtx = fallbackCanvas.getContext('2d');
            const grad = fCtx.createLinearGradient(0, 0, 1200, 800);
            grad.addColorStop(0, '#5a3e2b');
            grad.addColorStop(0.5, '#b87c4f');
            grad.addColorStop(1, '#2c5e3a');
            fCtx.fillStyle = grad;
            fCtx.fillRect(0, 0, 1200, 800);
            fCtx.fillStyle = '#f5e2b0';
            for (let i = 0; i < 200; i++) {
                fCtx.beginPath();
                fCtx.arc(Math.random() * 1200, Math.random() * 800, Math.random() * 8 + 2, 0, Math.PI * 2);
                fCtx.fill()
            }
            fallbackCanvas.toBlob(async (blob) => {
                const fallbackImg = await createImageBitmap(blob);
                originalImageBitmap = fallbackImg;
                resizeCanvasToDisplaySize();
                resolve()
            })
        };
        img.src = IMAGE_SOURCE
    })
}
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (originalImageBitmap) resizeCanvasToDisplaySize();
    }, 150)
});
async function init() {
    setupGUI();
    await loadImageAndDisplay()
}
init()