import * as THREE from 'three';
        import GUI from 'lil-gui';

        // --- GLOBAL VARIABLES ---
        let scene, camera, renderer, planeMesh, shaderMaterial;
        let currentTexture = null;
        let imageAspect = 1.0;
        let imageWidth = 1024;
        let imageHeight = 1024;

        // --- SHADER DEFINITIONS ---
        // Vertex Shader
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        // Fragment Shader
        const fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform float uImageAspect;
            uniform float uPixelsPerUV; // Used for perfect dynamic anti-aliasing
            
            // Pattern Settings
            uniform float uScale;
            uniform float uLineWidth;
            
            // Brightness Thresholds
            uniform float uThreshold1;
            uniform float uThreshold2;
            uniform float uThreshold3;
            uniform float uThreshold4;
            uniform float uThreshold5;
            
            // Pattern Selection
            uniform int uPatternType;
            
            // Colors & Opacity
            uniform vec3 uLineColor;
            uniform float uLineOpacity;

            varying vec2 vUv;

            void main() {
                vec2 pos = vUv;
                pos.x *= uImageAspect;
                
                // Frequency of the grid
                float freq = uScale * 80.0;
                
                vec2 cellUv = pos * freq;
                vec2 id = floor(cellUv);
                vec2 gv = fract(cellUv) - 0.5;
                
                // 1. Pixelate the background
                vec2 sampleUv = (id + 0.5) / freq;
                sampleUv.x /= uImageAspect;
                sampleUv = clamp(sampleUv, 0.0, 1.0);
                vec4 texColor = texture2D(tDiffuse, sampleUv);
                
                float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

                // 2. Dynamic Anti-Aliasing & Line Width
                // Calculates exact pixel size in the cell's local space to avoid blur on low scales
                float pixelSize = freq / uPixelsPerUV;
                float aa = pixelSize * 1.5; 
                float w = uLineWidth * 0.5;
                
                float d1 = 1.0, d2 = 1.0, d3 = 1.0, d4 = 1.0, d5 = 1.0;
                
                // Random noise and flip for Truchet patterns
                float n = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
                vec2 gvFlip = gv;
                if (n > 0.5) gvFlip.x = -gvFlip.x;

                // --- 15 SDF PATTERNS ---
                if (uPatternType == 0) {
                    // 1. Angular Truchet
                    d1 = abs(abs(gv.x) + abs(gv.y) - 0.2);
                    d2 = abs(gvFlip.x - gvFlip.y);
                    d3 = min(abs(gvFlip.x - gvFlip.y - 0.35), abs(gvFlip.x - gvFlip.y + 0.35));
                    d4 = min(d2, d3);
                    d5 = min(abs(gv.x - gv.y), abs(gv.x + gv.y));
                } else if (uPatternType == 1) {
                    // 2. Arc Truchet
                    float arc1 = abs(length(gvFlip - vec2(0.5, 0.5)) - 0.5);
                    float arc2 = abs(length(gvFlip - vec2(-0.5, -0.5)) - 0.5);
                    float arc3 = abs(length(gvFlip - vec2(0.5, -0.5)) - 0.5);
                    float arc4 = abs(length(gvFlip - vec2(-0.5, 0.5)) - 0.5);
                    d1 = abs(length(gv) - 0.1);
                    d2 = arc1;
                    d3 = min(arc1, arc2);
                    d4 = min(min(arc1, arc2), min(arc3, arc4));
                    d5 = min(d4, abs(length(gv) - 0.15));
                } else if (uPatternType == 2) {
                    // 3. Concentric Circles
                    float l = length(gv);
                    d1 = abs(l - 0.1);
                    d2 = abs(l - 0.25);
                    d3 = min(abs(l - 0.15), abs(l - 0.35));
                    d4 = min(d3, abs(l - 0.05));
                    d5 = min(min(abs(l - 0.1), abs(l - 0.25)), abs(l - 0.4));
                } else if (uPatternType == 3) {
                    // 4. Tech Squares
                    float bx = max(abs(gv.x), abs(gv.y));
                    d1 = abs(bx - 0.1);
                    d2 = abs(bx - 0.3);
                    d3 = min(abs(bx - 0.2), abs(bx - 0.4));
                    d4 = min(d3, abs(bx - 0.1));
                    d5 = min(min(abs(bx - 0.1), abs(bx - 0.25)), abs(bx - 0.4));
                } else if (uPatternType == 4) {
                    // 5. Plaid Grid
                    d1 = abs(gv.x); 
                    d2 = min(abs(gv.x), abs(gv.y)); 
                    float hash = min(abs(abs(gv.x) - 0.25), abs(abs(gv.y) - 0.25));
                    d3 = hash;
                    d4 = min(d2, hash);
                    float outer = min(abs(abs(gv.x) - 0.45), abs(abs(gv.y) - 0.45));
                    d5 = min(d4, outer);
                } else if (uPatternType == 5) {
                    // 6. Hexagon Rings (Vertical / Pointy Top)
                    vec2 hq = abs(gv);
                    float hex = max(hq.x * 0.5 + hq.y * 0.866025, hq.x);
                    d1 = abs(hex - 0.1);
                    d2 = abs(hex - 0.25);
                    d3 = min(abs(hex - 0.15), abs(hex - 0.35));
                    d4 = min(d3, abs(hex - 0.05));
                    d5 = min(min(abs(hex - 0.1), abs(hex - 0.25)), abs(hex - 0.4));
                } else if (uPatternType == 6) {
                    // 7. Rhombus Diamonds
                    float rh = abs(gv.x) + abs(gv.y);
                    d1 = abs(rh - 0.1);
                    d2 = abs(rh - 0.25);
                    d3 = min(abs(rh - 0.15), abs(rh - 0.35));
                    d4 = min(d3, abs(rh - 0.05));
                    d5 = min(min(abs(rh - 0.1), abs(rh - 0.25)), abs(rh - 0.4));
                } else if (uPatternType == 7) {
                    // 8. Diagonal Hatching
                    float diag1 = abs(gv.x - gv.y);
                    float diag2 = abs(gv.x + gv.y);
                    float off1 = abs(gv.x - gv.y - 0.5);
                    float off2 = abs(gv.x + gv.y - 0.5);
                    d1 = diag1;
                    d2 = min(diag1, diag2);
                    d3 = min(d2, off1);
                    d4 = min(d3, off2);
                    d5 = min(d4, min(abs(gv.x), abs(gv.y)));
                } else if (uPatternType == 8) {
                    // 9. Sparkle Stars
                    float sp = max(abs(gv.x) + abs(gv.y)*0.25, abs(gv.y) + abs(gv.x)*0.25);
                    d1 = abs(sp - 0.1);
                    d2 = abs(sp - 0.2);
                    d3 = min(abs(sp - 0.15), abs(sp - 0.3));
                    d4 = min(d3, abs(sp - 0.05));
                    d5 = min(min(abs(sp - 0.1), abs(sp - 0.2)), abs(sp - 0.4));
                } else if (uPatternType == 9) {
                    // 10. Continuous Waves
                    float wave1 = fract(cellUv.y + sin(cellUv.x * 1.5) * 0.3) - 0.5;
                    float wave2 = fract(cellUv.y + sin(cellUv.x * 1.5 + 3.1415) * 0.3) - 0.5;
                    float wave3 = fract(cellUv.y + sin(cellUv.x * 1.5) * 0.3 + 0.25) - 0.5;
                    float wave4 = fract(cellUv.y + sin(cellUv.x * 1.5 + 3.1415) * 0.3 + 0.25) - 0.5;
                    d1 = abs(wave1);
                    d2 = min(abs(wave1), abs(wave2));
                    d3 = min(d2, abs(wave3));
                    d4 = min(d3, abs(wave4));
                    d5 = min(d4, abs(fract(cellUv.x * 2.0) - 0.5));
                } else if (uPatternType == 10) {
                    // 11. 10 PRINT Maze
                    float mazeLine = abs(gvFlip.x - gvFlip.y);
                    d1 = mazeLine;
                    d2 = min(mazeLine, abs(gvFlip.x - gvFlip.y - 0.5));
                    d3 = min(d2, abs(gvFlip.x - gvFlip.y + 0.5));
                    d4 = min(d3, abs(gvFlip.x + gvFlip.y));
                    d5 = min(d4, min(abs(gv.x), abs(gv.y)));
                } else if (uPatternType == 11) {
                    // 12. Plus Grid
                    float px = abs(gv.x); float py = abs(gv.y);
                    d1 = min(px, py);
                    d2 = min(d1, min(abs(px - 0.25), abs(py - 0.25)));
                    d3 = min(d2, min(abs(px - 0.5), abs(py - 0.5)));
                    d4 = min(d3, abs(px - py));
                    d5 = min(d4, abs(px + py));
                } else if (uPatternType == 12) {
                    // 13. Octagons
                    float oct = max(max(abs(gv.x), abs(gv.y)), (abs(gv.x) + abs(gv.y)) * 0.7071);
                    d1 = abs(oct - 0.1);
                    d2 = abs(oct - 0.25);
                    d3 = min(abs(oct - 0.15), abs(oct - 0.35));
                    d4 = min(d3, abs(oct - 0.05));
                    d5 = min(min(abs(oct - 0.1), abs(oct - 0.25)), abs(oct - 0.4));
                } else if (uPatternType == 13) {
                    // 14. Fish Scales (Seigaiha)
                    vec2 fv = gv;
                    if (mod(id.x, 2.0) > 0.5) fv.y += 0.5;
                    fv = fract(fv + 0.5) - 0.5;
                    float scale = length(fv + vec2(0.0, 0.25));
                    d1 = abs(scale - 0.35);
                    d2 = min(d1, abs(scale - 0.15));
                    d3 = min(d2, abs(scale - 0.55));
                    d4 = min(d3, abs(scale - 0.05));
                    d5 = min(d4, min(abs(fv.x), abs(fv.y)));
                } else if (uPatternType == 14) {
                    // 15. Concentric Stars
                    float star = abs(gv.x) + abs(gv.y) + min(abs(gv.x), abs(gv.y));
                    d1 = abs(star - 0.1);
                    d2 = abs(star - 0.25);
                    d3 = min(abs(star - 0.15), abs(star - 0.35));
                    d4 = min(d3, abs(star - 0.05));
                    d5 = min(min(abs(star - 0.1), abs(star - 0.25)), abs(star - 0.4));
                } else if (uPatternType == 15) {
                    // 16. Triangles
                    float tri = max(abs(gv.x) * 0.866025 + gv.y * 0.5, -gv.y);
                    d1 = abs(tri - 0.1);
                    d2 = abs(tri - 0.25);
                    d3 = min(abs(tri - 0.15), abs(tri - 0.35));
                    d4 = min(d3, min(abs(gv.x), abs(gv.y)));
                    d5 = min(d4, abs(tri - 0.05));
                } else if (uPatternType == 16) {
                    // 17. Faceted Gems
                    vec2 hq = abs(gv);
                    float hex = max(hq.x * 0.5 + hq.y * 0.866025, hq.x);
                    float l1 = abs(gv.x);
                    float l2 = abs(gv.x * 0.5 + gv.y * 0.866025);
                    float l3 = abs(gv.x * 0.5 - gv.y * 0.866025);
                    float iso = min(min(l1, l2), l3);
                    d1 = abs(hex - 0.45);
                    d2 = min(d1, iso);
                    d3 = min(d2, abs(hex - 0.25));
                    d4 = min(d3, abs(hex - 0.1));
                    d5 = min(d4, length(gv) - 0.05);
                } else if (uPatternType == 17) {
                    // 18. Target Crosshairs
                    float circ = length(gv);
                    float cross = min(abs(gv.x), abs(gv.y));
                    d1 = abs(circ - 0.2);
                    d2 = min(abs(circ - 0.35), abs(circ - 0.1));
                    d3 = min(d2, cross);
                    d4 = min(d3, abs(abs(gv.x) - abs(gv.y)));
                    d5 = min(d4, abs(circ - 0.45));
                } else if (uPatternType == 18) {
                    // 19. ZigZag Waves
                    float zig = abs(gv.y - abs(gv.x) + 0.25);
                    float zig2 = abs(gv.y + abs(gv.x) - 0.25);
                    d1 = zig;
                    d2 = min(zig, zig2);
                    d3 = min(d2, abs(gv.y));
                    d4 = min(d3, abs(gv.x));
                    d5 = min(d4, min(abs(gv.x - 0.25), abs(gv.y - 0.25)));
                } else if (uPatternType == 19) {
                    // 20. Woven Petals (Quatrefoil)
                    float petal1 = length(gv - vec2(0.25, 0.25));
                    float petal2 = length(gv - vec2(-0.25, -0.25));
                    float petal3 = length(gv - vec2(0.25, -0.25));
                    float petal4 = length(gv - vec2(-0.25, 0.25));
                    d1 = min(abs(petal1 - 0.25), abs(petal2 - 0.25));
                    d2 = min(d1, min(abs(petal3 - 0.25), abs(petal4 - 0.25)));
                    d3 = min(d2, abs(length(gv) - 0.15));
                    d4 = min(d3, min(abs(gv.x), abs(gv.y)));
                    d5 = min(d4, abs(length(gv) - 0.35));
                }

                // 3. Select pattern density based on brightness
                float currentSDF = 1.0; 
                
                if (luminance < uThreshold5) {
                    currentSDF = d5;
                } else if (luminance < uThreshold4) {
                    currentSDF = d4;
                } else if (luminance < uThreshold3) {
                    currentSDF = d3;
                } else if (luminance < uThreshold2) {
                    currentSDF = d2;
                } else if (luminance < uThreshold1) {
                    currentSDF = d1;
                }

                // 4. Draw the lines with dynamic anti-aliasing
                float lineMask = 1.0 - smoothstep(w - aa, w + aa, currentSDF);

                // Mix background color with line color, affected by opacity
                vec3 finalColor = mix(texColor.rgb, uLineColor, lineMask * uLineOpacity);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // --- INITIALIZATION ---
        function init() {
            scene = new THREE.Scene();

            const aspect = window.innerWidth / window.innerHeight;
            camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 100);
            camera.position.z = 1;

            renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.body.appendChild(renderer.domElement);

            shaderMaterial = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    tDiffuse: { value: null },
                    uImageAspect: { value: 1.0 },
                    uPixelsPerUV: { value: 1000.0 }, // Dynamic resolution metric
                    uScale: { value: 1.5 },
                    uLineWidth: { value: 0.08 },
                    uPatternType: { value: 0 },
                    uThreshold1: { value: 0.8 },
                    uThreshold2: { value: 0.65 },
                    uThreshold3: { value: 0.5 },
                    uThreshold4: { value: 0.35 },
                    uThreshold5: { value: 0.2 },
                    uLineColor: { value: new THREE.Color('#1c1c1c') },
                    uLineOpacity: { value: 1.0 }
                }
            });

            const geometry = new THREE.PlaneGeometry(1, 1);
            planeMesh = new THREE.Mesh(geometry, shaderMaterial);
            scene.add(planeMesh);

            createDefaultTexture();
            setupGUI();

            window.addEventListener('resize', onWindowResize);
            setupFileInput();

            animate();
        }

        function createDefaultTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1024, 1024);

            const gradient = ctx.createRadialGradient(400, 400, 50, 512, 512, 450);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#888888');
            gradient.addColorStop(1, '#000000');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(512, 512, 400, 0, Math.PI * 2);
            ctx.fill();

            const texture = new THREE.CanvasTexture(canvas);
            updateTexture(texture, 1024, 1024);
        }

        function updateTexture(texture, imgWidth, imgHeight) {
            if (currentTexture) currentTexture.dispose();
            currentTexture = texture;
            
            imageWidth = imgWidth;
            imageHeight = imgHeight;
            imageAspect = imgWidth / imgHeight;
            
            shaderMaterial.uniforms.tDiffuse.value = currentTexture;
            shaderMaterial.uniforms.uImageAspect.value = imageAspect;

            planeMesh.scale.set(imageAspect, 1, 1);
            fitCameraToPlane();
        }

        function fitCameraToPlane() {
            const screenAspect = window.innerWidth / window.innerHeight;
            let cameraWidth, cameraHeight;

            if (screenAspect > imageAspect) {
                cameraHeight = 1; 
                cameraWidth = cameraHeight * screenAspect;
            } else {
                cameraWidth = imageAspect;
                cameraHeight = cameraWidth / screenAspect;
            }

            const padding = 1.1; 
            camera.left = -cameraWidth / 2 * padding;
            camera.right = cameraWidth / 2 * padding;
            camera.top = cameraHeight / 2 * padding;
            camera.bottom = -cameraHeight / 2 * padding;
            camera.updateProjectionMatrix();
            
            // Calculate actual pixels per UV unit for perfect Anti-Aliasing
            const pr = window.devicePixelRatio || 1;
            const worldHeight = camera.top - camera.bottom;
            const screenHeight = window.innerHeight * pr;
            shaderMaterial.uniforms.uPixelsPerUV.value = screenHeight / worldHeight;
        }

        function setupGUI() {
            const gui = new GUI({ title: 'Shader Controls' });

            const actionsFolder = gui.addFolder('File Actions');
            const actions = {
                uploadImage: () => {
                    document.getElementById('file-input').click();
                },
                saveImage: () => {
                    saveActualImage();
                }
            };
            actionsFolder.add(actions, 'uploadImage').name('Upload Local Image');
            actionsFolder.add(actions, 'saveImage').name('Save High-Res PNG');

            const patternFolder = gui.addFolder('Pattern Settings');
            patternFolder.add(shaderMaterial.uniforms.uPatternType, 'value', {
                '1. Angular Truchet': 0,
                '2. Arc Truchet': 1,
                '3. Concentric Circles': 2,
                '4. Tech Squares': 3,
                '5. Plaid Grid': 4,
                '6. Hexagon Rings': 5,
                '7. Rhombus Diamonds': 6,
                '8. Diagonal Hatch': 7,
                '9. Sparkle Stars': 8,
                '10. Continuous Waves': 9,
                '11. 10 PRINT Maze': 10,
                '12. Plus Grid': 11,
                '13. Octagons': 12,
                '14. Fish Scales': 13,
                '15. Concentric Stars': 14,
                '16. Triangles': 15,
                '17. Faceted Gems': 16,
                '18. Target Crosshairs': 17,
                '19. ZigZag Waves': 18,
                '20. Woven Petals': 19
            }).name('Pattern Style');
            patternFolder.add(shaderMaterial.uniforms.uScale, 'value', 0.1, 3.0, 0.01).name('Grid Scale');
            patternFolder.add(shaderMaterial.uniforms.uLineWidth, 'value', 0.01, 0.15, 0.001).name('Line Thickness');

            const threshFolder = gui.addFolder('Brightness Thresholds');
            threshFolder.add(shaderMaterial.uniforms.uThreshold1, 'value', 0.0, 1.0, 0.01).name('Layer 1 (Lightest)');
            threshFolder.add(shaderMaterial.uniforms.uThreshold2, 'value', 0.0, 1.0, 0.01).name('Layer 2');
            threshFolder.add(shaderMaterial.uniforms.uThreshold3, 'value', 0.0, 1.0, 0.01).name('Layer 3');
            threshFolder.add(shaderMaterial.uniforms.uThreshold4, 'value', 0.0, 1.0, 0.01).name('Layer 4');
            threshFolder.add(shaderMaterial.uniforms.uThreshold5, 'value', 0.0, 1.0, 0.01).name('Layer 5 (Darkest)');

            const colorFolder = gui.addFolder('Color & Opacity');
            const colors = {
                line: shaderMaterial.uniforms.uLineColor.value.getHex()
            };
            colorFolder.addColor(colors, 'line').name('Line Color').onChange((v) => {
                shaderMaterial.uniforms.uLineColor.value.setHex(v);
            });
            colorFolder.add(shaderMaterial.uniforms.uLineOpacity, 'value', 0.0, 1.0, 0.01).name('Line Opacity');
        }

        function setupFileInput() {
            const fileInput = document.getElementById('file-input');
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const texture = new THREE.Texture(img);
                        texture.needsUpdate = true;
                        updateTexture(texture, img.width, img.height);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                fileInput.value = ''; 
            });
        }

        function saveActualImage() {
            // Export Scale Multiplier: Renders at 2x resolution for super high quality!
            const exportScale = 2; 
            const expW = imageWidth * exportScale;
            const expH = imageHeight * exportScale;
            
            const renderTarget = new THREE.WebGLRenderTarget(expW, expH, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            });

            const exportCamera = new THREE.OrthographicCamera(
                -imageAspect / 2, imageAspect / 2, 
                0.5, -0.5, 
                0.1, 10
            );
            exportCamera.position.z = 1;

            // Update shader to use the exact pixels of the high-res render target for crisp AA
            const prevPixelsPerUV = shaderMaterial.uniforms.uPixelsPerUV.value;
            shaderMaterial.uniforms.uPixelsPerUV.value = expH;

            renderer.setRenderTarget(renderTarget);
            renderer.render(scene, exportCamera);
            renderer.setRenderTarget(null); 

            // Restore screen AA metric
            shaderMaterial.uniforms.uPixelsPerUV.value = prevPixelsPerUV;

            // Read the 2x high-res pixels
            const buffer = new Uint8Array(expW * expH * 4);
            renderer.readRenderTargetPixels(renderTarget, 0, 0, expW, expH, buffer);

            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = expW;
            exportCanvas.height = expH;
            const ctx = exportCanvas.getContext('2d');
            const imgData = ctx.createImageData(expW, expH);
            
            // Flip Y-axis
            for (let y = 0; y < expH; y++) {
                for (let x = 0; x < expW; x++) {
                    const srcIdx = (y * expW + x) * 4;
                    const destIdx = ((expH - 1 - y) * expW + x) * 4;
                    imgData.data[destIdx] = buffer[srcIdx];
                    imgData.data[destIdx + 1] = buffer[srcIdx + 1];
                    imgData.data[destIdx + 2] = buffer[srcIdx + 2];
                    imgData.data[destIdx + 3] = buffer[srcIdx + 3];
                }
            }
            
            ctx.putImageData(imgData, 0, 0);

            const dataURL = exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'high_res_pattern_art.png';
            link.href = dataURL;
            link.click();
            
            renderTarget.dispose();
        }

        function onWindowResize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            fitCameraToPlane();
        }

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        init();