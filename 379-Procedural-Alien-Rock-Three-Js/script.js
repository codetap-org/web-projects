import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
        import { createNoise3D } from 'simplex-noise';

        let scene, camera, renderer, controls;
        let rockMesh, shadowPlane;
        let noise3D;
        let defaultTexture, currentTexture;
        let clock = new THREE.Clock();

        const params = {
            // --- NEW: Scene Colors ---
            backgroundColor: 0xf5f5f5,
            shadowColor: 0x000000,

            // --- Dimensions ---
            scaleWidth: 2.2,
            scaleLength: 1.383,
            scaleHeight: 0.5,
            
            // --- Shadow & Light ---
            shadowOpacity: 0.103,

            // --- Deformation Settings ---
            baseSize: 2.0,
            
            layerFrequency: 3.5,
            distortion: 1.434,
            layerStrength: 1.159,
            
            detailStrength: 0.07,
            detailScale: 11.214,
            sharpness: 1.508,
            
            // --- Texture & Material ---
            rockColor: 0xa3a3a3,
            rockRoughness: 0.496,
            rockBumpScale: 0.0648,
            
            texRepeatX: 1.0,
            texRepeatY: 1.0,
            texRotation: 0,
            
            // --- Physics/Anim ---
            tiltZ: 15,
            floatSpeed: 0.8,
            floatHeight: 0.15,
            rotateSpeed: 0.1,

            // Actions
            loadTexture: () => document.getElementById('textureInput').click()
        };

        init();
        animate();

        function init() {
            // 1. Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(params.backgroundColor);
            // Fog matches background
            scene.fog = new THREE.Fog(params.backgroundColor, 12, 40);

            // 2. Camera
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 4, 14);

            // 3. Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;
            document.body.appendChild(renderer.domElement);

            // 4. Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            // Main Sun Light
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
            dirLight.position.set(5, 12, 5);
            dirLight.castShadow = true;
            
            dirLight.shadow.mapSize.set(2048, 2048);
            dirLight.shadow.bias = -0.0001;
            dirLight.shadow.radius = 4; 
            
            const d = 10;
            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;
            scene.add(dirLight);

            const fillLight = new THREE.DirectionalLight(0xddeeff, 0.4);
            fillLight.position.set(-5, 0, -5);
            scene.add(fillLight);

            // 5. Floor (Shadow Catcher)
            const planeGeo = new THREE.PlaneGeometry(100, 100);
            const planeMat = new THREE.ShadowMaterial({ 
                opacity: params.shadowOpacity, 
                color: params.shadowColor 
            });
            shadowPlane = new THREE.Mesh(planeGeo, planeMat);
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.position.y = -3.5;
            shadowPlane.receiveShadow = true;
            scene.add(shadowPlane);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;

            noise3D = createNoise3D();

            generateDefaultTexture(); 
            createRock();
            setupGUI();

            document.getElementById('textureInput').addEventListener('change', handleTextureUpload);
            window.addEventListener('resize', onWindowResize);
        }

        function generateDefaultTexture() {
            const size = 1024;
            const data = new Uint8Array(4 * size * size);
            for (let i = 0; i < size * size; i++) {
                const stride = i * 4;
                const v = 50 + Math.random() * 50; 
                data[stride] = v;
                data[stride+1] = v;
                data[stride+2] = v;
                data[stride+3] = 255;
            }
            const tex = new THREE.DataTexture(data, size, size);
            
            tex.wrapS = THREE.MirroredRepeatWrapping;
            tex.wrapT = THREE.MirroredRepeatWrapping;
            
            tex.needsUpdate = true;
            defaultTexture = tex;
            currentTexture = tex;
        }

        function createRock() {
            if (rockMesh) {
                scene.remove(rockMesh);
                rockMesh.geometry.dispose();
                rockMesh.material.dispose();
            }

            const geometry = new THREE.IcosahedronGeometry(params.baseSize, 200);
            const posAttribute = geometry.getAttribute('position');
            const vertex = new THREE.Vector3();

            const tiltRad = THREE.MathUtils.degToRad(params.tiltZ);
            const cosT = Math.cos(tiltRad);
            const sinT = Math.sin(tiltRad);

            // 1. Deformation Loop
            for (let i = 0; i < posAttribute.count; i++) {
                vertex.fromBufferAttribute(posAttribute, i);

                // Scale
                vertex.x *= params.scaleWidth;
                vertex.z *= params.scaleLength; 
                vertex.y *= params.scaleHeight;

                // Noise logic
                const rotX = vertex.x * cosT - vertex.y * sinT;
                const rotY = vertex.x * sinT + vertex.y * cosT;
                const rotZ = vertex.z;

                const warp = noise3D(rotX*0.5, rotY*0.5, rotZ*0.5) * params.distortion;
                const layerPos = (rotY * params.layerFrequency) + warp;
                let layerNoise = noise3D(rotX*0.2, layerPos, rotZ*0.2);
                
                const ds = params.detailScale;
                const rawDetail = noise3D(vertex.x * ds, vertex.y * ds, vertex.z * ds);
                let sharpDetail = 1.0 - Math.abs(rawDetail);
                sharpDetail = Math.pow(sharpDetail, params.sharpness); 
                
                let totalDisp = 1 + (layerNoise * params.layerStrength * 0.3);
                totalDisp += (sharpDetail * params.detailStrength);

                vertex.multiplyScalar(totalDisp);
                posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }

            // 2. Normals & UV Re-projection
            geometry.computeVertexNormals();

            // PLANAR PROJECTION
            const uvAttribute = geometry.attributes.uv;
            for (let i = 0; i < posAttribute.count; i++) {
                const x = posAttribute.getX(i);
                const z = posAttribute.getZ(i);
                
                uvAttribute.setXY(i, (x / params.scaleWidth) * 0.5 + 0.5, (z / params.scaleLength) * 0.5 + 0.5);
            }
            uvAttribute.needsUpdate = true;

            // 3. Material Setup
            currentTexture.wrapS = THREE.MirroredRepeatWrapping;
            currentTexture.wrapT = THREE.MirroredRepeatWrapping;
            currentTexture.repeat.set(params.texRepeatX, params.texRepeatY);
            currentTexture.rotation = params.texRotation;

            const material = new THREE.MeshStandardMaterial({
                color: params.rockColor,
                map: currentTexture,
                bumpMap: currentTexture, 
                bumpScale: params.rockBumpScale,
                roughness: params.rockRoughness,
                metalness: 0.1,
            });

            rockMesh = new THREE.Mesh(geometry, material);
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            
            rockMesh.rotation.z = tiltRad;

            scene.add(rockMesh);
        }

        function handleTextureUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const loader = new THREE.TextureLoader();
                loader.load(ev.target.result, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.wrapS = THREE.MirroredRepeatWrapping;
                    tex.wrapT = THREE.MirroredRepeatWrapping;
                    currentTexture = tex;
                    createRock();
                });
            };
            reader.readAsDataURL(file);
        }

        function setupGUI() {
            const gui = new GUI({ title: 'Settings' });

            // --- NEW FOLDER: Scene Background ---
            const fBg = gui.addFolder('Scene Background');
            fBg.addColor(params, 'backgroundColor').name('Bg Color').onChange(c => {
                scene.background.setHex(c);
                scene.fog.color.setHex(c);
            });
            fBg.open();

            const fDims = gui.addFolder('Dimensions & Shadow');
            fDims.add(params, 'scaleWidth', 1.0, 4.0).name('Width (X)').onChange(createRock);
            fDims.add(params, 'scaleLength', 1.0, 4.0).name('Length (Z)').onChange(createRock);
            fDims.add(params, 'shadowOpacity', 0.0, 1.0).name('Shadow Opacity').onChange(v => {
                if(shadowPlane) shadowPlane.material.opacity = v;
            });
            // --- ADDED Shadow Color ---
            fDims.addColor(params, 'shadowColor').name('Shadow Color').onChange(c => {
                if(shadowPlane) shadowPlane.material.color.setHex(c);
            });
            fDims.open();

            const fTex = gui.addFolder('Texture & Material');
            fTex.addColor(params, 'rockColor').name('Tint Color').onChange(c => rockMesh.material.color.setHex(c));
            fTex.add(params, 'rockRoughness', 0.0, 1.0).name('Roughness').onChange(v => rockMesh.material.roughness = v);
            fTex.add(params, 'rockBumpScale', -0.2, 0.2).name('Bump Scale').onChange(v => rockMesh.material.bumpScale = v);
            
            fTex.add(params, 'texRepeatX', 0.1, 5.0).name('Repeat X').onChange(createRock);
            fTex.add(params, 'texRepeatY', 0.1, 5.0).name('Repeat Y').onChange(createRock);
            fTex.add(params, 'texRotation', 0.0, 6.28).name('Rotation').onChange(createRock);
            fTex.add(params, 'loadTexture').name('📷 Upload Texture');
            fTex.open();

            const fDef = gui.addFolder('Deformation Settings');
            fDef.add(params, 'layerFrequency', 1.0, 6.0).onChange(createRock);
            fDef.add(params, 'distortion', 0.0, 2.0).onChange(createRock);
            fDef.add(params, 'layerStrength', 0.1, 2.0).onChange(createRock);
            fDef.add(params, 'detailStrength', 0.0, 0.5).onChange(createRock);
            fDef.add(params, 'detailScale', 1.0, 15.0).onChange(createRock);
            fDef.add(params, 'sharpness', 1.0, 5.0).onChange(createRock);
            fDef.open();
            
            const fAnim = gui.addFolder('Animation');
            fAnim.add(params, 'floatSpeed', 0.0, 2.0);
            fAnim.add(params, 'rotateSpeed', 0.0, 0.5);
            fAnim.open();
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            if (rockMesh) {
                rockMesh.position.y = Math.sin(time * params.floatSpeed) * params.floatHeight;
                rockMesh.rotation.y = time * params.rotateSpeed;
            }

            controls.update();
            renderer.render(scene, camera);
        }