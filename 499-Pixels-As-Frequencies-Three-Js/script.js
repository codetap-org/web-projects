import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import GUI from 'lil-gui';

        // --- SETTINGS ---
        const CONFIG = {
            // Added a sample video URL for auto-start. Leave empty string '' to disable.
            videoURL: 'https://ik.imagekit.io/sqiqig7tz/e4d8fe34-ac0f-4485-9c56-716f218acdc1_hd.mp4', 
            layers: 8,
            strength: 0.225,
            softness: 1,
            autoRotate: false,
            rotateSpeed: 1.0,
            bitrate: 25000000 // 25 Mbps
        };

        // --- VARIABLES ---
        let scene, camera, renderer, material, mesh, controls;
        let texture, sourceElement, isVideo = false;
        
        // Recording variables
        let mediaRecorder;
        let recordedChunks = [];
        let isRecording = false;
        let recordBtnCtrl;

        // --- SHADERS ---
        const vertexShader = `
            uniform sampler2D uTexture;
            uniform float uDisplacementStrength;
            uniform float uLayers;
            uniform float uSoftness;
            varying vec2 vUv;

            float getLuminance(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }

            void main() {
                vUv = uv;
                vec4 color = texture2D(uTexture, uv);
                float brightness = getLuminance(color.rgb);
                
                float stepped = floor(brightness * uLayers) / uLayers;
                float smoothVal = brightness;
                float elevation = mix(stepped, smoothVal, uSoftness);

                vec3 newPos = position + normal * (elevation * uDisplacementStrength);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `;

        const fragmentShader = `
            uniform sampler2D uTexture;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(uTexture, vUv);
            }
        `;

        // --- INIT ---
        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x050505);

            const aspect = window.innerWidth / window.innerHeight;
            camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
            camera.position.z = 2;

            renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                preserveDrawingBuffer: true 
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;

            const geometry = new THREE.PlaneGeometry(1, 1, 400, 400);

            // Placeholder texture
            const cvs = document.createElement('canvas'); cvs.width=2; cvs.height=2;
            const ctx = cvs.getContext('2d'); ctx.fillStyle='#222'; ctx.fillRect(0,0,2,2);
            texture = new THREE.CanvasTexture(cvs);

            material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uTexture: { value: texture },
                    uDisplacementStrength: { value: CONFIG.strength },
                    uLayers: { value: CONFIG.layers },
                    uSoftness: { value: CONFIG.softness }
                },
                side: THREE.DoubleSide
            });

            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            setupGUI();
            setupDragDrop();
            
            window.addEventListener('resize', onResize);
            document.getElementById('file-input').addEventListener('change', e => loadFile(e.target.files[0]));

            // --- AUTO START LOGIC ---
            // If videoURL contains text, load it immediately
            if (CONFIG.videoURL && CONFIG.videoURL.trim() !== "") {
                loadVideoFromURL(CONFIG.videoURL);
            }

            animate();
        }

        // --- LOADING LOGIC ---
        
        function loadFile(file) {
            if (!file) return;
            const url = URL.createObjectURL(file);
            applyMedia(url, file.type.startsWith('video'));
        }

        function loadVideoFromURL(url) {
            if (!url) return;
            // Assume it is video if loaded via URL field
            applyMedia(url, true); 
        }

        // Common Apply Function
        function applyMedia(url, isVideoSource) {
            document.getElementById('ui-layer').style.display = 'none';

            // Cleanup previous
            if (sourceElement && isVideo) {
                sourceElement.pause();
                sourceElement.src = '';
                sourceElement.load();
            }
            if (texture) texture.dispose();

            isVideo = isVideoSource;

            if (isVideo) {
                sourceElement = document.createElement('video');
                sourceElement.crossOrigin = 'anonymous'; // Important for external URLs
                sourceElement.loop = true;
                sourceElement.muted = true; // Required for autoplay
                sourceElement.playsInline = true;
                sourceElement.src = url;
                
                sourceElement.onloadedmetadata = () => {
                    sourceElement.play().catch(e => console.warn("Autoplay blocked:", e));
                    texture = new THREE.VideoTexture(sourceElement);
                    texture.minFilter = THREE.LinearFilter;
                    fitScreen(sourceElement.videoWidth, sourceElement.videoHeight);
                };


            } else {
                sourceElement = new Image();
                sourceElement.crossOrigin = 'anonymous';
                sourceElement.src = url;
                sourceElement.onload = () => {
                    texture = new THREE.TextureLoader().load(url);
                    texture.minFilter = THREE.LinearFilter;
                    fitScreen(sourceElement.width, sourceElement.height);
                };
                sourceElement.onerror = () => {
                    alert("Error loading image. Check URL.");
                };
            }
        }

        function fitScreen(w, h) {
            material.uniforms.uTexture.value = texture;
            const aspect = w / h;
            mesh.scale.set(aspect, 1, 1);
            
            const vFov = camera.fov * Math.PI / 180;
            const dist = 0.6 / Math.tan(vFov / 2);
            camera.position.set(0, 0, dist);
            controls.target.set(0,0,0);
        }

        // =========================================================
        // ===            ROBUST RECORDING LOGIC               ===
        // =========================================================

        function toggleRecord() {
            if (isRecording) stopRecording();
            else startRecording();
        }

        function getSupportedMimeType() {
            const candidates = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
                'video/mp4;codecs="avc1.42E01E"',
                'video/mp4'
            ];

            if (!window.MediaRecorder) return null;
            if (typeof MediaRecorder.isTypeSupported !== 'function') return null;

            for (const mime of candidates) {
                try {
                    if (MediaRecorder.isTypeSupported(mime)) return mime;
                } catch (e) { }
            }
            return null;
        }

        function createRecorder(stream, mimeType) {
            const optionSets = [];
            if (mimeType) optionSets.push({ mimeType, videoBitsPerSecond: CONFIG.bitrate });
            if (mimeType) optionSets.push({ mimeType });
            optionSets.push({ videoBitsPerSecond: CONFIG.bitrate });
            optionSets.push({});

            let lastErr = null;
            for (const opts of optionSets) {
                try {
                    return new MediaRecorder(stream, opts);
                } catch (e) { lastErr = e; }
            }
            throw lastErr || new Error("MediaRecorder init failed");
        }

        function startRecording() {
            const canvas = renderer?.domElement;
            if (!canvas) return;

            renderer.render(scene, camera);

            const stream = canvas.captureStream(30);

            let selectedMime = getSupportedMimeType();
            if (selectedMime) console.log("Recorder preferred mime:", selectedMime);

            try {
                mediaRecorder = createRecorder(stream, selectedMime);
            } catch (e) {
                console.error("Recorder creation error:", e);
                alert("Failed to initialize recorder.");
                return;
            }

            recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) recordedChunks.push(e.data);
            };

            mediaRecorder.onstop = saveVideo;

            try {
                mediaRecorder.start(1000);
                isRecording = true;
                if (recordBtnCtrl) recordBtnCtrl.name("⬛ Stop Recording");
                document.getElementById('rec-badge').style.display = 'block';
            } catch (e) {
                console.error("Start error:", e);
                alert("Could not start recording.");
                resetUI();
            }
        }

        function stopRecording() {
            if (!mediaRecorder || mediaRecorder.state === "inactive") return;
            try { mediaRecorder.stop(); } catch (e) { console.error(e); }
            isRecording = false;
            if (recordBtnCtrl) recordBtnCtrl.name("⏳ Saving...");
        }

        function saveVideo() {
            if (!recordedChunks || recordedChunks.length === 0) {
                console.warn("Recording is empty.");
                resetUI();
                return;
            }

            const type = (recordedChunks[0] && recordedChunks[0].type) ? recordedChunks[0].type : (mediaRecorder?.mimeType || "");
            const blob = new Blob(recordedChunks, { type: type || 'video/webm' });
            const url = URL.createObjectURL(blob);

            const t = (blob.type || '').toLowerCase();
            let ext = 'webm';
            if (t.includes('mp4')) ext = 'mp4';

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `video_record.${ext}`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                resetUI();
            }, 600);
        }

        function resetUI() {
            if (recordBtnCtrl) recordBtnCtrl.name("🔴 Start Recording");
            document.getElementById('rec-badge').style.display = 'none';
        }

        // =========================================================

        function takeScreenshot() {
            renderer.render(scene, camera);
            const a = document.createElement('a');
            a.href = renderer.domElement.toDataURL('image/png');
            a.download = 'screenshot.png';
            a.click();
        }

        // --- GUI ---
        function setupGUI() {
            const gui = new GUI({ title: 'Controls' });
            
            const ef = gui.addFolder('Effect');
            ef.add(CONFIG, 'layers', 2, 50, 1).onChange(v => material.uniforms.uLayers.value = v);
            ef.add(CONFIG, 'strength', -2, 0.3).onChange(v => material.uniforms.uDisplacementStrength.value = v);
            ef.add(CONFIG, 'softness', 0, 1).onChange(v => material.uniforms.uSoftness.value = v);
            
            const an = gui.addFolder('Animation');
            an.add(CONFIG, 'autoRotate').name('Auto Sway').onChange(v => {
                 if(!v) mesh.rotation.y = 0;
            });
            an.add(CONFIG, 'rotateSpeed', 0.1, 3);

            const io = gui.addFolder('Export');
            
            // URL Input Section
            io.add(CONFIG, 'videoURL').name('Video URL');
            io.add({ load: () => loadVideoFromURL(CONFIG.videoURL) }, 'load').name('▶ Load URL');
            
            io.add({ load: () => document.getElementById('file-input').click() }, 'load').name('📂 Local File');
            io.add({ shot: takeScreenshot }, 'shot').name('📷 Screenshot');
            recordBtnCtrl = io.add({ rec: toggleRecord }, 'rec').name('🔴 Start Recording');
            io.add(CONFIG, 'bitrate', 1000000, 50000000, 1000000).name('Bitrate (bps)');
            
            ef.open();
            io.open();
        }

        // --- UTILS ---
        function setupDragDrop() {
            window.addEventListener('dragover', e => e.preventDefault());
            window.addEventListener('drop', e => {
                e.preventDefault();
                if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
            });
        }

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            
            if (CONFIG.autoRotate && mesh) {
                const t = Date.now() * 0.001;
                mesh.rotation.y = Math.sin(t * CONFIG.rotateSpeed) * THREE.MathUtils.degToRad(6);
            }
            renderer.render(scene, camera);
        }

        init();