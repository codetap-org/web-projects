import * as THREE from 'three';
    import GUI from 'lil-gui';

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // 2. TEXTURE LOADER
    const loader = new THREE.TextureLoader();
    // Default image
    const defaultImgUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop';

    // Global reference to update material later
    let glassMaterial; 

    loader.load(defaultImgUrl, (texture) => {
        setupTexture(texture);
        createScene(texture);
    });

    function setupTexture(texture) {
        // Prevent texture from repeating on edges
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
    }

    function createScene(initialTexture) {
        // --- SHADERS ---

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform vec2 uResolution;
            uniform vec2 uImageRes;
            
            // Stripe Settings
            uniform float uFrequency; 
            uniform float uRotation;
            
            // Distortion Settings
            uniform float uDistortion;
            uniform float uCurvePow; // Lens curvature inside the stripe
            
            // Edge/Highlight Settings
            uniform float uLineWidth;
            uniform float uLineIntensity;
            
            // Animation
            uniform float uTime;
            uniform float uSpeed;

            varying vec2 vUv;

            // 2D Rotation Matrix
            mat2 rotate2d(float _angle){
                return mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle));
            }

            // Function to simulate "object-fit: cover" in shader
            vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texResolution) {
                vec2 s = resolution;
                vec2 i = texResolution;
                float rs = s.x / s.y;
                float ri = i.x / i.y;
                vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
                vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
                return uv * s / new + offset;
            }

            void main() {
                // 1. Correct UVs for aspect ratio (Cover mode)
                vec2 uv = getCoverUv(vUv, uResolution, uImageRes);

                // 2. Prepare coordinates for stripes
                vec2 centered = uv - 0.5;
                vec2 rotated = rotate2d(uRotation) * centered;
                
                // 3. Generate stripes with animation
                // Add time to the X coordinate (direction of stripes)
                float patternPhase = rotated.x * uFrequency + (uTime * uSpeed);
                
                // fract() creates the sharp "sawtooth" or blind effect
                float p = fract(patternPhase);

                // 4. Lens Distortion Shape
                // pow() bends the linear 0-1 gradient to make it look like a curved glass surface
                float shapedP = pow(p, uCurvePow);

                // Map 0..1 to -0.5..0.5 to displace in both directions
                float displacement = (shapedP - 0.5) * uDistortion;

                // Rotate displacement vector back to match original space
                vec2 offsetVector = rotate2d(-uRotation) * vec2(displacement, 0.0);
                
                // 5. Chromatic Aberration (RGB Shift)
                // Sample channels at slightly different offsets
                float r = texture2D(tDiffuse, uv + offsetVector).r;
                float g = texture2D(tDiffuse, uv + offsetVector * 1.01 + vec2(0.002, 0.0)).g;
                float b = texture2D(tDiffuse, uv + offsetVector * 1.02 + vec2(0.004, 0.0)).b;
                vec3 color = vec3(r, g, b);

                // 6. Draw Edge Highlight
                // smoothstep near 1.0 creates a line at the edge of the slat
                float line = smoothstep(1.0 - uLineWidth, 1.0, p);
                
                // Add highlight to color
                color += vec3(line * uLineIntensity);

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // --- DEFAULTS FROM SCREENSHOT ---
        const initialParams = {
            frequency: 9.025,
            rotationDeg: 136.08,
            curvePow: 0.1,
            distortion: 0.05,
            lineWidth: 0.015,
            lineIntensity: 0.06,
            speed: 0.184
        };

        glassMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: initialTexture },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uImageRes: { value: new THREE.Vector2(initialTexture.image.width, initialTexture.image.height) },
                uTime: { value: 0 },
                
                uFrequency: { value: initialParams.frequency },
                uRotation: { value: initialParams.rotationDeg * (Math.PI / 180) },
                uDistortion: { value: initialParams.distortion },
                uCurvePow: { value: initialParams.curvePow },
                
                uLineWidth: { value: initialParams.lineWidth },
                uLineIntensity: { value: initialParams.lineIntensity },
                uSpeed: { value: initialParams.speed }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, glassMaterial);
        scene.add(mesh);

        // --- GUI SETUP ---
        const gui = new GUI({ title: 'Glass Settings' });
        
        // 1. File Upload Logic
        const fileInput = document.getElementById('fileInput');
        const uploadObj = {
            upload: function() {
                fileInput.click();
            }
        };

        gui.add(uploadObj, 'upload').name('📷 Upload Image');

        // Handle file selection
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newTexture = loader.load(e.target.result, (tex) => {
                        setupTexture(tex);
                        // Update shader uniforms
                        glassMaterial.uniforms.tDiffuse.value = tex;
                        glassMaterial.uniforms.uImageRes.value.set(tex.image.width, tex.image.height);
                    });
                };
                reader.readAsDataURL(file);
            }
        });

        // 2. Parameters
        const folderGeo = gui.addFolder('Stripe Geometry');
        folderGeo.add(initialParams, 'frequency', 1, 50).name('Frequency').onChange(v => glassMaterial.uniforms.uFrequency.value = v);
        folderGeo.add(initialParams, 'rotationDeg', -180, 180).name('Angle (deg)').onChange(v => glassMaterial.uniforms.uRotation.value = v * (Math.PI / 180));
        folderGeo.add(initialParams, 'curvePow', 0.01, 3.0).name('Lens Curvature').onChange(v => glassMaterial.uniforms.uCurvePow.value = v);

        const folderDist = gui.addFolder('Refraction');
        folderDist.add(initialParams, 'distortion', 0.0, 0.3).name('Displacement').onChange(v => glassMaterial.uniforms.uDistortion.value = v);

        const folderLine = gui.addFolder('Edge Highlight');
        folderLine.add(initialParams, 'lineWidth', 0.0, 0.1).name('Line Width').onChange(v => glassMaterial.uniforms.uLineWidth.value = v);
        folderLine.add(initialParams, 'lineIntensity', 0.0, 1.0).name('Brightness').onChange(v => glassMaterial.uniforms.uLineIntensity.value = v);

        const folderAnim = gui.addFolder('Animation');
        folderAnim.add(initialParams, 'speed', -1.0, 1.0).name('Speed').onChange(v => glassMaterial.uniforms.uSpeed.value = v);

        // --- RESIZE & RENDER LOOP ---
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            glassMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        });

        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            glassMaterial.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        }
        animate();
    }