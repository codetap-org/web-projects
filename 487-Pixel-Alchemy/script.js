import * as THREE from "https://esm.sh/three";
        import GUI from "https://esm.sh/lil-gui";
        
        const DEFAULT_CELL_SIZE = 50.0;
        
        const params = {
            cellSize: DEFAULT_CELL_SIZE,
            blendStrength: 0.68,
            blendMode: 0,
            grainIntensity: 0.12,
            colorSaturation: 0.7,
            brightness: 1.0,
            contrast: 1.05,
            grainSpeed: 0,
            vignette: true,
            vignetteIntensity: 0.25,
            invertEffect: false,
            invertStrength: 1.0,
            hueShift: 0.0,
            horizontalAngle: 0.0,
            verticalAngle: 90.0
        };
        
        const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1536888999803-d3501b466a6b?w=1920&h=1080&fit=crop';
        const FALLBACK_URL = 'https://images.unsplash.com/photo-1536888999803-d3501b466a6b?w=1920&h=1080&fit=crop';
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a2a);
        
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);
        
        let shaderMaterial = null;
        let mainTexture = null;
        let time = 0.0;
        
        let imageDisplayRect = { x: 0, y: 0, w: 0, h: 0 };
        let currentImageWidth = 0;
        let currentImageHeight = 0;
        let textureReady = false;
        
        function updateDisplayRect(imageWidth, imageHeight, canvasWidth, canvasHeight) {
            if (!imageWidth || !imageHeight) return;
            currentImageWidth = imageWidth;
            currentImageHeight = imageHeight;
            const canvasRatio = canvasWidth / canvasHeight;
            const imageRatio = imageWidth / imageHeight;
            
            if (canvasRatio > imageRatio) {
                imageDisplayRect.h = canvasHeight;
                imageDisplayRect.w = canvasHeight * imageRatio;
                imageDisplayRect.x = (canvasWidth - imageDisplayRect.w) / 2;
                imageDisplayRect.y = 0;
            } else {
                imageDisplayRect.w = canvasWidth;
                imageDisplayRect.h = canvasWidth / imageRatio;
                imageDisplayRect.x = 0;
                imageDisplayRect.y = (canvasHeight - imageDisplayRect.h) / 2;
            }
        }
        
        function updateDisplayRectOnResize() {
            if (currentImageWidth && currentImageHeight) {
                updateDisplayRect(currentImageWidth, currentImageHeight, window.innerWidth, window.innerHeight);
                if (shaderMaterial) {
                    shaderMaterial.uniforms.uDisplayRect.value.set(imageDisplayRect.x, imageDisplayRect.y, imageDisplayRect.w, imageDisplayRect.h);
                }
            }
        }
        
        function loadTextureAsync(url) {
            return new Promise((resolve, reject) => {
                const loader = new THREE.TextureLoader();
                loader.load(url, 
                    (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.needsUpdate = true;
                        
                        const img = texture.image;
                        if (img) {
                            updateDisplayRect(img.width, img.height, window.innerWidth, window.innerHeight);
                        }
                        textureReady = true;
                        resolve(texture);
                    },
                    undefined,
                    (err) => reject(err)
                );
            });
        }
        
        function loadTextureFromFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const texture = new THREE.Texture(img);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.needsUpdate = true;
                        
                        updateDisplayRect(img.width, img.height, window.innerWidth, window.innerHeight);
                        textureReady = true;
                        resolve(texture);
                    };
                    img.onerror = (err) => reject(err);
                    img.src = event.target.result;
                };
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
            });
        }
        
        function createProceduralTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const ctx = canvas.getContext('2d');
            
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#1a2a3a');
            grad.addColorStop(0.5, '#2c3e66');
            grad.addColorStop(1, '#4a6a8a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < 1200; i++) {
                ctx.fillStyle = `rgba(255,255,200,${Math.random() * 0.4})`;
                ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
            }
            
            ctx.font = 'Bold 70px "Segoe UI"';
            ctx.fillStyle = '#ffdd99';
            ctx.shadowBlur = 12;
            ctx.fillText("UNSPLASH", canvas.width/2 - 170, canvas.height/2);
            ctx.font = '32px monospace';
            ctx.fillStyle = '#aaffdd';
            ctx.fillText("controllable grid", canvas.width/2 - 140, canvas.height/2 + 90);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            updateDisplayRect(canvas.width, canvas.height, window.innerWidth, window.innerHeight);
            textureReady = true;
            
            return texture;
        }
        
        function createShaderMaterial(texture, width, height) {
            return new THREE.ShaderMaterial({
                uniforms: {
                    uTexture: { value: texture },
                    uResolution: { value: new THREE.Vector2(width, height) },
                    uDisplayRect: { value: new THREE.Vector4(imageDisplayRect.x, imageDisplayRect.y, imageDisplayRect.w, imageDisplayRect.h) },
                    uCellSize: { value: params.cellSize },
                    uTime: { value: 0.0 },
                    uTextureReady: { value: 1.0 },
                    uBlendStrength: { value: params.blendStrength },
                    uBlendMode: { value: params.blendMode },
                    uGrainIntensity: { value: params.grainIntensity },
                    uColorSaturation: { value: params.colorSaturation },
                    uBrightness: { value: params.brightness },
                    uContrast: { value: params.contrast },
                    uGrainSpeed: { value: params.grainSpeed },
                    uVignette: { value: params.vignette ? 1.0 : 0.0 },
                    uVignetteIntensity: { value: params.vignetteIntensity },
                    uInvertEffect: { value: params.invertEffect ? 1.0 : 0.0 },
                    uInvertStrength: { value: params.invertStrength },
                    uHueShift: { value: params.hueShift },
                    uHorizontalAngle: { value: params.horizontalAngle * Math.PI / 180.0 },
                    uVerticalAngle: { value: params.verticalAngle * Math.PI / 180.0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_PointSize = 1.0;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D uTexture;
                    uniform vec2 uResolution;
                    uniform vec4 uDisplayRect;
                    uniform float uCellSize;
                    uniform float uTime;
                    uniform float uTextureReady;
                    uniform float uBlendStrength;
                    uniform float uBlendMode;
                    uniform float uGrainIntensity;
                    uniform float uColorSaturation;
                    uniform float uBrightness;
                    uniform float uContrast;
                    uniform float uGrainSpeed;
                    uniform float uVignette;
                    uniform float uVignetteIntensity;
                    uniform float uInvertEffect;
                    uniform float uInvertStrength;
                    uniform float uHueShift;
                    uniform float uHorizontalAngle;
                    uniform float uVerticalAngle;
                    varying vec2 vUv;
                    
                    vec2 getRotatedCoord(vec2 coord, float angle) {
                        float cosA = cos(angle);
                        float sinA = sin(angle);
                        return vec2(
                            coord.x * cosA - coord.y * sinA,
                            coord.x * sinA + coord.y * cosA
                        );
                    }
                    
                    vec3 hashColor(int col, int row, float hueShift) {
                        float r = fract(sin(float(col * 1271) + float(row * 311) + hueShift * 10.0) * 43758.5453);
                        float g = fract(sin(float(col * 3571) + float(row * 1471) + hueShift * 12.0) * 43758.5453);
                        float b = fract(sin(float(col * 1999) + float(row * 2713) + hueShift * 14.0) * 43758.5453);
                        vec3 color = vec3(r, g, b);
                        color = 0.3 + 0.7 * color;
                        vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
                        color = mix(gray, color, uColorSaturation);
                        return clamp(color, 0.1, 1.0);
                    }
                    
                    vec3 getCellTexturedColor(int col, int row, vec2 fragCoord, float xInCell, float yInCell, float cellW, float cellH, float hueShift) {
                        vec3 baseColor = hashColor(col, row, hueShift);
                        float grain = fract(sin(fragCoord.x * 27.1 + fragCoord.y * 53.7 + uTime * uGrainSpeed) * 43758.5453);
                        grain = (grain - 0.5) * uGrainIntensity;
                        float yNorm = yInCell / cellH;
                        float verticalPattern = sin(yNorm * 3.14159) * 0.18;
                        float xNorm = xInCell / cellW;
                        float horizontalPattern = sin(xNorm * 3.14159 * 1.8) * 0.15;
                        float diagPattern = sin((xInCell + yInCell) * 0.12) * 0.1;
                        vec3 finalColor = baseColor;
                        finalColor += vec3(grain);
                        finalColor = finalColor * (1.0 + verticalPattern + horizontalPattern + diagPattern);
                        return clamp(finalColor, 0.05, 1.0);
                    }
                    
                    vec3 blendSoftLight(vec3 base, vec3 blend) {
                        vec3 result;
                        for (int i = 0; i < 3; i++) {
                            if (blend[i] < 0.5)
                                result[i] = base[i] - (1.0 - 2.0 * blend[i]) * base[i] * (1.0 - base[i]);
                            else
                                result[i] = base[i] + (2.0 * blend[i] - 1.0) * (sqrt(base[i]) - base[i]);
                        }
                        return result;
                    }
                    
                    vec3 blendOverlay(vec3 base, vec3 blend) {
                        vec3 result;
                        for (int i = 0; i < 3; i++) {
                            if (base[i] < 0.5)
                                result[i] = 2.0 * base[i] * blend[i];
                            else
                                result[i] = 1.0 - 2.0 * (1.0 - base[i]) * (1.0 - blend[i]);
                        }
                        return result;
                    }
                    
                    vec3 blendVividLight(vec3 base, vec3 blend) {
                        vec3 result;
                        for (int i = 0; i < 3; i++) {
                            if (blend[i] <= 0.5)
                                result[i] = base[i] / (1.0 - 2.0 * blend[i]);
                            else
                                result[i] = base[i] / (2.0 * (blend[i] - 0.5));
                            result[i] = clamp(result[i], 0.0, 1.0);
                        }
                        return result;
                    }
                    
                    vec3 blendHardMix(vec3 base, vec3 blend) {
                        vec3 result = blendOverlay(base, blend);
                        result = floor(result + 0.5);
                        return result;
                    }
                    
                    vec3 applyBlendMode(vec3 base, vec3 blend, float mode) {
                        if (mode < 0.5) return blendSoftLight(base, blend);
                        else if (mode < 1.5) return blendOverlay(base, blend);
                        else if (mode < 2.5) return blendVividLight(base, blend);
                        else return blendHardMix(base, blend);
                    }
                    
                    void main() {
                        if (uTextureReady < 0.5) {
                            gl_FragColor = vec4(0.08, 0.08, 0.15, 1.0);
                            return;
                        }
                        
                        vec2 pixelCoord = gl_FragCoord.xy;
                        
                        if (pixelCoord.x >= uDisplayRect.x && pixelCoord.x <= uDisplayRect.x + uDisplayRect.z &&
                            pixelCoord.y >= uDisplayRect.y && pixelCoord.y <= uDisplayRect.y + uDisplayRect.w) {
                            
                            vec2 imageUV;
                            imageUV.x = (pixelCoord.x - uDisplayRect.x) / uDisplayRect.z;
                            imageUV.y = (pixelCoord.y - uDisplayRect.y) / uDisplayRect.w;
                            
                            vec4 imageColor = texture2D(uTexture, imageUV);
                            vec3 originalColor = imageColor.rgb;
                            
                            vec2 fragCoord = gl_FragCoord.xy;
                            vec2 rotatedHorizontal = getRotatedCoord(fragCoord, uHorizontalAngle);
                            vec2 rotatedVertical = getRotatedCoord(fragCoord, uVerticalAngle);
                            
                            float cellSize = uCellSize;
                            
                            int colH = int(floor(rotatedHorizontal.x / cellSize));
                            int rowH = int(floor(rotatedHorizontal.y / cellSize));
                            float xInCellH = rotatedHorizontal.x - float(colH) * cellSize;
                            float yInCellH = rotatedHorizontal.y - float(rowH) * cellSize;
                            
                            int colV = int(floor(rotatedVertical.x / cellSize));
                            int rowV = int(floor(rotatedVertical.y / cellSize));
                            float xInCellV = rotatedVertical.x - float(colV) * cellSize;
                            float yInCellV = rotatedVertical.y - float(rowV) * cellSize;
                            
                            vec3 colorHorizontal = getCellTexturedColor(colH, rowH, fragCoord, xInCellH, yInCellH, cellSize, cellSize, uHueShift);
                            vec3 colorVertical = getCellTexturedColor(colV, rowV, fragCoord, xInCellV, yInCellV, cellSize, cellSize, uHueShift + 3.14159);
                            
                            vec3 cellTextureColor = colorHorizontal * colorVertical;
                            cellTextureColor = clamp(cellTextureColor, 0.0, 1.0);
                            
                            vec3 blended = applyBlendMode(originalColor, cellTextureColor, uBlendMode);
                            vec3 finalColor = mix(originalColor, blended, uBlendStrength);
                            
                            float grainNoise = fract(sin(gl_FragCoord.x * 97.1 + gl_FragCoord.y * 251.3 + uTime * uGrainSpeed * 2.0) * 43758.5453);
                            grainNoise = (grainNoise - 0.5) * uGrainIntensity * 0.8;
                            finalColor += vec3(grainNoise);
                            
                            if (uVignette > 0.5) {
                                vec2 uvCentered = imageUV * 2.0 - 1.0;
                                float vignette = 1.0 - length(uvCentered) * uVignetteIntensity;
                                finalColor = finalColor * vignette;
                            }
                            
                            if (uInvertEffect > 0.5) {
                                vec3 invertedColor = vec3(1.0) - finalColor;
                                finalColor = mix(finalColor, invertedColor, uInvertStrength);
                            }
                            
                            finalColor = finalColor * uBrightness;
                            finalColor = (finalColor - 0.5) * uContrast + 0.5;
                            finalColor = clamp(finalColor, 0.0, 1.0);
                            
                            gl_FragColor = vec4(finalColor, 1.0);
                        } else {
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        }
                    }
                `,
                transparent: false
            });
        }
        
        function updateUniforms() {
            if (!shaderMaterial) return;
            shaderMaterial.uniforms.uCellSize.value = params.cellSize;
            shaderMaterial.uniforms.uBlendStrength.value = params.blendStrength;
            shaderMaterial.uniforms.uBlendMode.value = params.blendMode;
            shaderMaterial.uniforms.uGrainIntensity.value = params.grainIntensity;
            shaderMaterial.uniforms.uColorSaturation.value = params.colorSaturation;
            shaderMaterial.uniforms.uBrightness.value = params.brightness;
            shaderMaterial.uniforms.uContrast.value = params.contrast;
            shaderMaterial.uniforms.uGrainSpeed.value = params.grainSpeed;
            shaderMaterial.uniforms.uVignette.value = params.vignette ? 1.0 : 0.0;
            shaderMaterial.uniforms.uVignetteIntensity.value = params.vignetteIntensity;
            shaderMaterial.uniforms.uInvertEffect.value = params.invertEffect ? 1.0 : 0.0;
            shaderMaterial.uniforms.uInvertStrength.value = params.invertStrength;
            shaderMaterial.uniforms.uHueShift.value = params.hueShift;
            shaderMaterial.uniforms.uHorizontalAngle.value = params.horizontalAngle * Math.PI / 180.0;
            shaderMaterial.uniforms.uVerticalAngle.value = params.verticalAngle * Math.PI / 180.0;
        }
        
        async function exportImage() {
            const overlay = document.createElement('div');
            overlay.className = 'export-loading-overlay';
            overlay.innerHTML = `
                <div class="export-spinner"></div>
                <div class="export-message">Exporting...</div>
                <div class="export-submessage">Please wait</div>
            `;
            document.body.appendChild(overlay);
            
            try {
                const imgWidth = currentImageWidth;
                const imgHeight = currentImageHeight;
                
                if (!imgWidth || !imgHeight) {
                    throw new Error("Image not loaded");
                }
                
                const canvasWidth = renderer.domElement.width;
                const canvasHeight = renderer.domElement.height;
                const canvasRatio = canvasWidth / canvasHeight;
                const imageRatio = imgWidth / imgHeight;
                
                let sourceX, sourceY, sourceWidth, sourceHeight;
                
                if (canvasRatio > imageRatio) {
                    sourceHeight = canvasHeight;
                    sourceWidth = canvasHeight * imageRatio;
                    sourceX = (canvasWidth - sourceWidth) / 2;
                    sourceY = 0;
                } else {
                    sourceWidth = canvasWidth;
                    sourceHeight = canvasWidth / imageRatio;
                    sourceX = 0;
                    sourceY = (canvasHeight - sourceHeight) / 2;
                }
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = imgHeight;
                const tempCtx = tempCanvas.getContext('2d');
                
                renderer.render(scene, camera);
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const mainCanvas = renderer.domElement;
                
                tempCtx.drawImage(
                    mainCanvas,
                    sourceX, sourceY, sourceWidth, sourceHeight,  
                    0, 0, imgWidth, imgHeight                    
                );
                
                const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);
                
                const link = document.createElement("a");
                link.download = `shader-effect-${Date.now()}.jpg`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error("Export error:", err);
                const msgEl = overlay.querySelector('.export-message');
                if (msgEl) {
                    msgEl.textContent = "Export error!";
                }
                const subEl = overlay.querySelector('.export-submessage');
                if (subEl) {
                    subEl.textContent = err.message || "Please try again";
                    subEl.style.color = "#ff4444";
                }
                await new Promise(resolve => setTimeout(resolve, 1500));
            } finally {
                overlay.style.opacity = "0";
                setTimeout(() => {
                    if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                    }
                }, 300);
            }
        }
        
        function uploadImage() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
            input.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                                      
                    try {
                        const newTexture = await loadTextureFromFile(file);
                        if (mainTexture) {
                            mainTexture.dispose();
                        }
                        mainTexture = newTexture;
                        shaderMaterial.uniforms.uTexture.value = mainTexture;
                        shaderMaterial.uniforms.uDisplayRect.value.set(imageDisplayRect.x, imageDisplayRect.y, imageDisplayRect.w, imageDisplayRect.h);
                        setTimeout(() => {
                        }, 2000);
                        setTimeout(() => {
                        }, 100);
                    } catch (err) {
                        console.error("Error loading image:", err);
                    }
                }
            };
            input.click();
        }
        
        async function loadDefaultImage() {
            try {
                const newTexture = await loadTextureAsync(DEFAULT_IMAGE_URL);
                if (mainTexture) {
                    mainTexture.dispose();
                }
                mainTexture = newTexture;
                shaderMaterial.uniforms.uTexture.value = mainTexture;
                shaderMaterial.uniforms.uDisplayRect.value.set(imageDisplayRect.x, imageDisplayRect.y, imageDisplayRect.w, imageDisplayRect.h);
                setTimeout(() => {
                }, 2000);
                setTimeout(() => {
                }, 100);
            } catch (err) {
                console.error("Error loading default image:", err);
            }
        }
        
        let isGuiVisible = true;
        
        function toggleGuiVisibility() {
            const guiElement = document.querySelector('.lil-gui');
            if (guiElement) {
                if (isGuiVisible) {
                    guiElement.classList.add('hidden');
                    isGuiVisible = false;
                } else {
                    guiElement.classList.remove('hidden');
                    isGuiVisible = true;
                }
            } else {
                console.log('GUI element not found');
            }
        }
        
        function setupGUI() {
            const gui = new GUI({ title: 'Shader Controls', width: 280 });
            
            const fileFolder = gui.addFolder('File');
            
            fileFolder.add({
                upload: () => uploadImage()
            }, 'upload').name('Upload image');
            
            fileFolder.add({
                export: () => exportImage()
            }, 'export').name('Export image');
                        
            fileFolder.open();
            
            gui.add(params, 'cellSize', 1, 1200, 1).name('Strip size (px)').onChange(() => {
                updateUniforms();
            });
            
            const orientationFolder = gui.addFolder('Strip orientation');
            orientationFolder.add(params, 'horizontalAngle', 0, 90, 1).name('Horizontal strips (0-90°)').onChange(updateUniforms);
            orientationFolder.add(params, 'verticalAngle', 0, 90, 1).name('Vertical strips (0-90°)').onChange(updateUniforms);
            orientationFolder.open();
            
            const effectsFolder = gui.addFolder('Main effects');
            effectsFolder.add(params, 'blendStrength', 0.0, 2.0, 0.01).name('Color intensity').onChange(updateUniforms);
            effectsFolder.add(params, 'blendMode', { 'Soft Light': 0, 'Overlay': 1, 'Vivid Light': 2, 'Hard Mix': 3 }).name('Blend mode').onChange(updateUniforms);
            effectsFolder.add(params, 'colorSaturation', 0.0, 1.5, 0.01).name('Cell saturation').onChange(updateUniforms);
            effectsFolder.add(params, 'hueShift', 0.0, 6.28318, 0.05).name('Hue shift').onChange(updateUniforms);
            effectsFolder.open();
            
            const textureFolder = gui.addFolder('Texture / Grain');
            textureFolder.add(params, 'grainIntensity', 0.0, 1.0, 0.005).name('Grain intensity').onChange(updateUniforms);
            textureFolder.add(params, 'grainSpeed', 0.0, 2.5, 0.05).name('Grain animation speed').onChange(updateUniforms);
            textureFolder.open();
            
            const colorFolder = gui.addFolder('Brightness / Contrast');
            colorFolder.add(params, 'brightness', 0.5, 1.8, 0.01).name('Brightness').onChange(updateUniforms);
            colorFolder.add(params, 'contrast', 0.7, 1.8, 0.01).name('Contrast').onChange(updateUniforms);
            colorFolder.open();
            
            const vignetteFolder = gui.addFolder('Vignette');
            vignetteFolder.add(params, 'vignette').name('Enable vignette').onChange(updateUniforms);
            vignetteFolder.add(params, 'vignetteIntensity', 0.0, 0.8, 0.01).name('Vignette intensity').onChange(updateUniforms);
            vignetteFolder.open();
            
            const invertFolder = gui.addFolder('Invert effect');
            invertFolder.add(params, 'invertEffect').name('Enable inversion').onChange(updateUniforms);
            invertFolder.add(params, 'invertStrength', 0.0, 1.0, 0.01).name('Inversion strength').onChange(updateUniforms);
            invertFolder.open();
            
            gui.add({
                reset: () => {
                    params.cellSize = DEFAULT_CELL_SIZE;
                    params.blendStrength = 0.68;
                    params.blendMode = 0;
                    params.grainIntensity = 0.12;
                    params.colorSaturation = 0.7;
                    params.brightness = 1.0;
                    params.contrast = 1.05;
                    params.grainSpeed = 1.0;
                    params.vignette = true;
                    params.vignetteIntensity = 0.25;
                    params.invertEffect = false;
                    params.invertStrength = 0.5;
                    params.hueShift = 0.0;
                    params.horizontalAngle = 0.0;
                    params.verticalAngle = 90.0;
                    updateUniforms();
                    gui.controllers.forEach(c => c.updateDisplay());
                }
            }, 'reset').name('⟳ Reset all');
            
            return gui;
        }
        
        async function setup() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            let loadedTexture = null;
            try {
                loadedTexture = await loadTextureAsync(DEFAULT_IMAGE_URL);
            } catch (err) {
                console.warn("Fallback...");
                try {
                    loadedTexture = await loadTextureAsync(FALLBACK_URL);
                } catch {
                    loadedTexture = createProceduralTexture();
                }
            }
            
            mainTexture = loadedTexture;
            shaderMaterial = createShaderMaterial(mainTexture, width, height);
            
            const geometry = new THREE.PlaneGeometry(2, 2);
            const mesh = new THREE.Mesh(geometry, shaderMaterial);
            scene.add(mesh);
            
            setupGUI();
            
            const canvas = renderer.domElement;
            canvas.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                toggleGuiVisibility();
            });
            
            canvas.style.cursor = 'pointer';
            
            window.addEventListener('resize', () => {
                const newWidth = window.innerWidth;
                const newHeight = window.innerHeight;
                renderer.setSize(newWidth, newHeight);
                if (shaderMaterial) {
                    shaderMaterial.uniforms.uResolution.value.set(newWidth, newHeight);
                    updateDisplayRectOnResize();
                }
            });
            
            
            animate();
            console.log("&Toc on codepen - https://codepen.io/ol-ivier");

        }
        
        function animate() {
            requestAnimationFrame(animate);
            if (shaderMaterial) {
                time += 0.008;
                shaderMaterial.uniforms.uTime.value = time;
            }
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
        
        setup().catch(err => {
            console.error(err);
            const fallbackMat = new THREE.MeshBasicMaterial({ color: 0x2c3e66 });
            const geometry = new THREE.PlaneGeometry(2, 2);
            scene.add(new THREE.Mesh(geometry, fallbackMat));
            animate();
        });