import * as THREE from 'three';
    import { GUI } from 'lil-gui';

    // 2. Configuration Object (Defined first to apply to scene init)
    const params = {
        // Layout
        gap: 1.11, // From screenshot

        // Animation
        speed: 0.0033, // From screenshot
        
        // Wave Physics
        waveHeight: 0.60,  // From screenshot
        frequencyX: 0.27,  // From screenshot
        frequencyZ: 0.52,  // From screenshot
        chaosScale: 2.30,  // From screenshot
        
        // Appearance
        dotSize: 0.20,     // From screenshot
        dotOpacity: 0.99,  // From screenshot
        lineLength: 6.24,  // From screenshot
        lineOpacity: 0.22, // From screenshot
        lineGrowth: true,  // From screenshot (Checked)
        
        // Colors
        colorStart: '#5ff785', // Greenish
        colorEnd: '#004cff',   // Blueish
        
        // Camera
        camX: 14.4,
        camY: 1.0,
        camZ: 37.9,

        // Fog
        fogColor: '#000000',
        fogDensity: 0.01
    };

    // 1. Scene Initialization
    const scene = new THREE.Scene();
    
    // Set initial fog and background
    scene.fog = new THREE.FogExp2(params.fogColor, params.fogDensity);
    scene.background = new THREE.Color(params.fogColor);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // 3. Geometry Generation
    const ROWS = 50;
    const COLS = 100;
    
    function createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    const particleCount = ROWS * COLS;
    
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    
    const linesGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * 2 * 3);
    const lineColors = new Float32Array(particleCount * 2 * 3);

    // Attach attributes
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    // Function to update grid layout
    function updateLayout() {
        const offsetX = (COLS * params.gap) / 2;
        const offsetZ = (ROWS * params.gap) / 2;
        
        let i = 0;
        let lineIndex = 0;

        for (let x = 0; x < COLS; x++) {
            for (let z = 0; z < ROWS; z++) {
                const px = x * params.gap - offsetX;
                const pz = z * params.gap - offsetZ;
                
                // Dots X/Z
                particlePositions[i * 3] = px;
                particlePositions[i * 3 + 2] = pz;

                // Lines X/Z
                linePositions[lineIndex * 3] = px;
                linePositions[lineIndex * 3 + 2] = pz;
                
                linePositions[(lineIndex + 1) * 3] = px;
                linePositions[(lineIndex + 1) * 3 + 2] = pz;

                i++;
                lineIndex += 2;
            }
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
        linesGeometry.attributes.position.needsUpdate = true;
    }

    // Function to update gradient colors
    function updateColors() {
        const c1 = new THREE.Color(params.colorStart);
        const c2 = new THREE.Color(params.colorEnd);
        
        const pColors = particlesGeometry.attributes.color.array;
        const lColors = linesGeometry.attributes.color.array;
        
        let j = 0;
        let l = 0;
        
        for (let x = 0; x < COLS; x++) {
            const mixRatio = x / COLS;
            const mixedColor = c1.clone().lerp(c2, mixRatio);
            
            for (let z = 0; z < ROWS; z++) {
                // Dot Color
                pColors[j * 3] = mixedColor.r;
                pColors[j * 3 + 1] = mixedColor.g;
                pColors[j * 3 + 2] = mixedColor.b;

                // Line Color (Top)
                lColors[l * 3] = mixedColor.r;
                lColors[l * 3 + 1] = mixedColor.g;
                lColors[l * 3 + 2] = mixedColor.b;

                // Line Color (Bottom) - dimmer
                lColors[(l + 1) * 3] = mixedColor.r * 0.3;
                lColors[(l + 1) * 3 + 1] = mixedColor.g * 0.3;
                lColors[(l + 1) * 3 + 2] = mixedColor.b * 0.3;

                j++;
                l += 2;
            }
        }
        particlesGeometry.attributes.color.needsUpdate = true;
        linesGeometry.attributes.color.needsUpdate = true;
    }

    // Initialize logic
    updateLayout();
    updateColors();

    // Materials
    const particlesMaterial = new THREE.PointsMaterial({
        size: params.dotSize,
        map: createCircleTexture(),
        vertexColors: true,
        transparent: true,
        opacity: params.dotOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const linesMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: params.lineOpacity,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);

    scene.add(particlesMesh);
    scene.add(linesMesh);

    // 4. GUI Setup
    const gui = new GUI({ title: 'Scene Settings' });
    
    const folderWave = gui.addFolder('Wave Physics');
    folderWave.add(params, 'waveHeight', 0.1, 5.0).name('Amplitude');
    folderWave.add(params, 'frequencyX', 0.01, 1.0).name('Frequency X');
    folderWave.add(params, 'frequencyZ', 0.01, 1.0).name('Frequency Z');
    folderWave.add(params, 'chaosScale', 0.0, 5.0).name('Chaos Level');
    
    const folderAnim = gui.addFolder('Animation');
    folderAnim.add(params, 'speed', 0, 0.05).name('Speed');

    const folderLook = gui.addFolder('Appearance');
    folderLook.add(params, 'gap', 0.1, 3.0).name('Gap (Spacing)').onChange(updateLayout);
    folderLook.add(params, 'dotSize', 0.01, 1.0).name('Dot Size').onChange(v => particlesMaterial.size = v);
    folderLook.add(params, 'dotOpacity', 0.0, 1.0).name('Dot Opacity').onChange(v => particlesMaterial.opacity = v);
    folderLook.add(params, 'lineLength', 1.0, 20.0).name('Line Height/Len');
    folderLook.add(params, 'lineOpacity', 0.0, 1.0).name('Line Opacity').onChange(v => linesMaterial.opacity = v);
    folderLook.add(params, 'lineGrowth').name('Line Growth (Floor)');

    const folderColors = gui.addFolder('Gradient');
    folderColors.addColor(params, 'colorStart').name('Color Left').onChange(updateColors);
    folderColors.addColor(params, 'colorEnd').name('Color Right').onChange(updateColors);

    // --- FOG FOLDER ---
    const folderFog = gui.addFolder('Fog (Atmosphere)');
    folderFog.addColor(params, 'fogColor').name('Fog Color').onChange(function(value) {
        scene.fog.color.set(value);
        scene.background.set(value);
    });
    folderFog.add(params, 'fogDensity', 0.0, 0.1).name('Fog Density').onChange(function(value) {
        scene.fog.density = value;
    });

    const folderCam = gui.addFolder('Camera');
    function updateCamera() {
        camera.position.set(params.camX, params.camY, params.camZ);
        camera.lookAt(0, 0, 0);
    }
    folderCam.add(params, 'camX', -50, 50).name('Position X (Side)').onChange(updateCamera);
    folderCam.add(params, 'camY', -20, 50).name('Position Y (Up)').onChange(updateCamera);
    folderCam.add(params, 'camZ', 1, 100).name('Position Z (Zoom)').onChange(updateCamera);
    
    updateCamera();

    // 5. Animation Loop
    let time = 0;

    function animate() {
        requestAnimationFrame(animate);
        
        time += params.speed;

        const pPos = particlesGeometry.attributes.position.array;
        const lPos = linesGeometry.attributes.position.array;

        let i = 0;
        let lineIdx = 0;

        // "Floor" level
        const floorLevel = -5.0; 

        for (let x = 0; x < COLS; x++) {
            for (let z = 0; z < ROWS; z++) {
                
                const px = pPos[i * 3];
                const pz = pPos[i * 3 + 2];

                // Wave Formula
                let py = Math.sin(px * params.frequencyX + time) * params.waveHeight + 
                         Math.cos(pz * params.frequencyZ + time * 0.5) * params.waveHeight + 
                         Math.sin((px + pz) * 0.1 + time) * params.chaosScale;

                // Update Dot Y
                pPos[i * 3 + 1] = py;

                // Update Line Y
                if (params.lineGrowth) {
                    // MODE: GROWTH (From floor up to dot)
                    // The line length parameter here acts as a "max influence" or just allows the line to exist
                    lPos[lineIdx * 3 + 1] = py; // Top matches dot
                    lPos[(lineIdx + 1) * 3 + 1] = floorLevel; // Bottom is fixed
                } else {
                    // MODE: HANGING
                    lPos[lineIdx * 3 + 1] = py;
                    lPos[(lineIdx + 1) * 3 + 1] = py - params.lineLength;
                }

                i++;
                lineIdx += 2;
            }
        }

        particlesGeometry.attributes.position.needsUpdate = true;
        linesGeometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();