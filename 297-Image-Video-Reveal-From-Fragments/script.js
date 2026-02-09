import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GUI } from 'lil-gui';
    import gsap from 'gsap';
    import { Delaunay } from 'd3-delaunay';

    let scene, camera, renderer, controls;
    let mesh, material;
    
    const textureLoader = new THREE.TextureLoader();
    const fileInput = document.getElementById('fileInput');
    const sourceVideo = document.getElementById('sourceVideo');

    // Recording Variables
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;

    const params = {
        progress: 1.0,
        explosionStrength: 5.0,
        rotationStrength: 20.0,
        baseSplinters: 37, 
        tinySplinters: 1500,
        splinterGrouping: 0.55,
        animationDuration: 5.0,
        reverse: false,
        backgroundColor: '#636363', // Background Color Parameter
        
        loadFile: function() { fileInput.click(); },
        
        animateAssembly: function() {
            gsap.killTweensOf(params);
            
            const startValue = params.reverse ? 1.0 : 0.0;
            const endValue = params.reverse ? 0.0 : 1.0;

            params.progress = startValue;
            if (material) material.uniforms.uProgress.value = startValue;
            
            gsap.to(params, {
                progress: endValue,
                duration: params.animationDuration,
                ease: "power1.out", 
                onUpdate: () => {
                    if (material) material.uniforms.uProgress.value = params.progress;
                }
            });
        },

        toggleRecording: function() {
            if (!isRecording) {
                tryStartRecording();
            } else {
                stopAndSave();
            }
        },
        recBtnLabel: "🔴 Rec Video"
    };

    // --- Vertex Shader ---
    const vertexShader = `
        uniform float uProgress;
        uniform float uExplosionStrength;
        uniform float uRotationStrength;
        
        attribute vec3 aCentroid; 
        attribute vec3 aRandomness;
        varying vec2 vUv;

        mat4 rotationMatrix(vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0);
        }

        void main() {
            vUv = uv;
            float rawExplosion = 1.0 - uProgress;
            float threshold = 0.001;
            float explosionFactor = max(0.0, rawExplosion - threshold) * (1.0 / (1.0 - threshold));
            float easeFactor = pow(explosionFactor, 3.0);
            float rotationAngle = easeFactor * uRotationStrength * aRandomness.x * (aRandomness.y > 0.5 ? 1.0 : -1.0);
            mat4 rotMat = rotationMatrix(normalize(aRandomness + vec3(0.1)), rotationAngle);
            vec3 localPosition = position - aCentroid;
            vec3 rotatedLocalPosition = (rotMat * vec4(localPosition, 1.0)).xyz;
            vec3 explosionDirection = normalize(aCentroid);
            if(length(aCentroid.xy) < 0.01) explosionDirection = vec3(0.0, 0.0, 1.0); 
            explosionDirection.z += (aRandomness.z - 0.5) * 3.0;
            explosionDirection = normalize(explosionDirection);
            float distanceMetric = length(aCentroid.xy); 
            vec3 explosionOffset = explosionDirection * uExplosionStrength * easeFactor * (0.2 + distanceMetric + aRandomness.x);
            vec3 targetCentroid = aCentroid + explosionOffset;
            vec3 finalPosition = targetCentroid + rotatedLocalPosition;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D uTexture;
        varying vec2 vUv;
        void main() {
            vec4 texColor = texture2D(uTexture, vUv);
            gl_FragColor = texColor;
        }
    `;

    function init() {
        const container = document.getElementById('container');
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 7);

        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true 
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        updateBackground();
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;

        container.appendChild(renderer.domElement);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        loadDefaultImage();
        setupGUI();
        
        window.addEventListener('resize', onWindowResize);
        fileInput.addEventListener('change', handleFileSelect);
        animate();
    }

    function updateBackground() {
        if(renderer) renderer.setClearColor(params.backgroundColor);
        document.body.style.backgroundColor = params.backgroundColor;
    }

    function loadDefaultImage() {
        // Use a CORS-friendly placeholder
        const placeholderUrl = 'https://images.unsplash.com/photo-1610642433569-fb4f62b3795f'; 
        // We set crossorigin anonymous BEFORE loading
        textureLoader.crossOrigin = 'anonymous';
        textureLoader.load(placeholderUrl, (texture) => {
            setupTexture(texture);
            createProcessedMesh(texture);
            params.animateAssembly();
        }, undefined, (err) => console.error("Could not load default image", err));
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileType = file.type;
        const objectURL = URL.createObjectURL(file);

        if (fileType.startsWith('video/')) {
            sourceVideo.src = objectURL;
            sourceVideo.onloadedmetadata = () => {
                sourceVideo.play();
                const videoTexture = new THREE.VideoTexture(sourceVideo);
                setupTexture(videoTexture);
                createProcessedMesh(videoTexture);
                params.animateAssembly();
            };
        } else {
            sourceVideo.pause();
            sourceVideo.src = "";
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const texture = new THREE.Texture(img);
                    texture.needsUpdate = true;
                    setupTexture(texture);
                    createProcessedMesh(texture);
                    params.animateAssembly();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function setupTexture(texture) {
        texture.colorSpace = THREE.LinearSRGBColorSpace; 
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
    }

    // --- Fixed Recording Logic ---
    function tryStartRecording() {
        recordedChunks = [];
        const canvas = renderer.domElement;
        
        // Check if canvas is tainted (security block)
        try {
            canvas.getContext("webgl2"); 
        } catch(e) {
            alert("Cannot record: Canvas is tainted due to security policy (CORS).");
            return;
        }

        // Try getting stream
        let stream;
        try {
            stream = canvas.captureStream(60); 
        } catch (e) {
            alert("Capture Stream failed: " + e.message);
            return;
        }

        // Broad list of mimeTypes to attempt
        const mimeTypes = [
            'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', 
            'video/mp4',
            'video/webm; codecs=h264',
            'video/webm; codecs=vp9',
            'video/webm'
        ];

        let selectedMimeType = "";
        for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                selectedMimeType = type;
                break;
            }
        }

        if (selectedMimeType === "") {
            alert("Video recording not supported by this browser.");
            return;
        }

        const options = {
            mimeType: selectedMimeType,
            videoBitsPerSecond: 25000000 
        };

        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            alert("MediaRecorder Init failed: " + e.message);
            return;
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = saveVideo;
        mediaRecorder.onerror = (e) => {
             console.error("Recorder Error", e);
             alert("Recording crashed. See console.");
             stopAndSave();
        };

        try {
            mediaRecorder.start(); // Start recording
            isRecording = true;
            updateRecButtonUI();
            console.log("Started recording with:", selectedMimeType);
        } catch (e) {
            alert("Could not start MediaRecorder: " + e.message);
        }
    }

    function stopAndSave() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        updateRecButtonUI();
    }

    function saveVideo() {
        if (recordedChunks.length === 0) {
            // Only alert if we expected data but got none
            if(isRecording) alert("No data recorded. Canvas might be empty or tainted.");
            return;
        }

        const blob = new Blob(recordedChunks, {
            type: mediaRecorder.mimeType
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Decide extension
        const ext = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `shatter_effect_${Date.now()}.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    // --- Geometry ---
    function createProcessedMesh(texture) {
        if (mesh) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            material.dispose();
        }

        let width = 800;
        let height = 600;

        if (texture.image) {
            width = texture.image.videoWidth || texture.image.width || 800;
            height = texture.image.videoHeight || texture.image.height || 600;
        }
        
        const imgAspect = width / height;
        const halfH = 1.0;
        const halfW = halfH * imgAspect;
        const points = [];

        for (let i = 0; i < params.baseSplinters; i++) {
            points.push([
                THREE.MathUtils.randFloat(-halfW, halfW),
                THREE.MathUtils.randFloat(-halfH, halfH)
            ]);
        }

        const impactPoints = [];
        const numImpacts = Math.max(3, Math.floor(params.baseSplinters / 10));
        for(let k=0; k<numImpacts; k++) {
             impactPoints.push([
                THREE.MathUtils.randFloat(-halfW*0.8, halfW*0.8),
                THREE.MathUtils.randFloat(-halfH*0.8, halfH*0.8)
            ]);
        }

        for (let i = 0; i < params.tinySplinters; i++) {
            const impact = impactPoints[Math.floor(Math.random() * impactPoints.length)];
            const spread = (1.0 - params.splinterGrouping) * 0.8 + 0.05;
            let offsetX = Math.pow(Math.random(), 3) * spread * (Math.random() > 0.5 ? 1 : -1);
            let offsetY = Math.pow(Math.random(), 3) * spread * (Math.random() > 0.5 ? 1 : -1);

            points.push([
                THREE.MathUtils.clamp(impact[0] + offsetX, -halfW, halfW),
                THREE.MathUtils.clamp(impact[1] + offsetY, -halfH, halfH)
            ]);
        }

        const bounds = [-halfW*1.01, -halfH*1.01, halfW*1.01, halfH*1.01];
        const delaunay = Delaunay.from(points);
        const voronoi = delaunay.voronoi(bounds);

        const vertices = [];
        const uvs = [];
        const centroids = [];
        const randomness = [];

        let totalCells = params.baseSplinters + params.tinySplinters;
        for (let i = 0; i < totalCells; i++) {
            const polygon = voronoi.cellPolygon(i);
            if (!polygon) continue;

            let cx = 0, cy = 0;
            const polyPoints = polygon.length - 1; 
            for (let j = 0; j < polyPoints; j++) { cx += polygon[j][0]; cy += polygon[j][1]; }
            cx /= polyPoints; cy /= polyPoints;
            const cz = 0.0; 

            const randX = Math.random(); const randY = Math.random(); const randZ = Math.random();

            for (let j = 1; j < polyPoints - 1; j++) {
                vertices.push(polygon[0][0], polygon[0][1], cz);
                vertices.push(polygon[j][0], polygon[j][1], cz);
                vertices.push(polygon[j+1][0], polygon[j+1][1], cz);

                uvs.push((polygon[0][0]+halfW)/(2*halfW), (polygon[0][1]+halfH)/(2*halfH));
                uvs.push((polygon[j][0]+halfW)/(2*halfW), (polygon[j][1]+halfH)/(2*halfH));
                uvs.push((polygon[j+1][0]+halfW)/(2*halfW), (polygon[j+1][1]+halfH)/(2*halfH));

                for(let k=0; k<3; k++) {
                    centroids.push(cx, cy, cz);
                    randomness.push(randX, randY, randZ);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('aCentroid', new THREE.Float32BufferAttribute(centroids, 3));
        geometry.setAttribute('aRandomness', new THREE.Float32BufferAttribute(randomness, 3));
        geometry.computeVertexNormals();

        material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTexture: { value: texture },
                uProgress: { value: params.progress },
                uExplosionStrength: { value: params.explosionStrength },
                uRotationStrength: { value: params.rotationStrength }
            },
            side: THREE.DoubleSide,
            transparent: true
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }

    // --- GUI ---
    let recCtrl; 

    function setupGUI() {
        const gui = new GUI({ width: 340, autoPlace: false });
        document.body.appendChild(gui.domElement);

        const settingsFolder = gui.addFolder('Settings');
        settingsFolder.add(params, 'loadFile').name('📂 Load Media (Img/Vid)');
        settingsFolder.addColor(params, 'backgroundColor').name('Background Color').onChange(updateBackground);

        const sizeFolder = settingsFolder.addFolder('Shard Generation (Reloads)');
        sizeFolder.add(params, 'baseSplinters', 10, 200, 1).name('Large Shards').onChange(rebuild);
        sizeFolder.add(params, 'tinySplinters', 0, 2000, 50).name('Tiny Splinters').onChange(rebuild);
        sizeFolder.add(params, 'splinterGrouping', 0.5, 0.99, 0.01).name('Cluster Focus').onChange(rebuild);

        settingsFolder.add(params, 'explosionStrength', 1, 15).name('Explosion Dist').onChange(updateUniforms);
        settingsFolder.add(params, 'rotationStrength', 1, 25).name('Rotation Speed').onChange(updateUniforms);

        const animFolder = gui.addFolder('Animation');
        animFolder.add(params, 'animationDuration', 0.5, 10).name('Duration (s)');
        animFolder.add(params, 'reverse').name('Reverse Effect'); 
        animFolder.add(params, 'animateAssembly').name('▶ PLAY Animation');
        animFolder.add(params, 'progress', 0, 1).name('Manual Progress').onChange(updateUniforms).listen();

        const recFolder = gui.addFolder('Video Recording');
        recCtrl = recFolder.add(params, 'toggleRecording').name(params.recBtnLabel);

        settingsFolder.open();
        animFolder.open();
        recFolder.open();
    }

    function updateRecButtonUI() {
        if (isRecording) {
            params.recBtnLabel = "⏹ Stop and Save Video";
            recCtrl.name(params.recBtnLabel);
        } else {
            params.recBtnLabel = "🔴 Rec Video";
            recCtrl.name(params.recBtnLabel);
        }
    }

    function rebuild() {
        if(material && material.uniforms.uTexture.value) createProcessedMesh(material.uniforms.uTexture.value);
    }
    function updateUniforms() {
        if(material) {
            material.uniforms.uExplosionStrength.value = params.explosionStrength;
            material.uniforms.uRotationStrength.value = params.rotationStrength;
            material.uniforms.uProgress.value = params.progress;
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    init();