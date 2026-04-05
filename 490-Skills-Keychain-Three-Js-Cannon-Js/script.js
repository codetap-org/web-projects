import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
        import * as CANNON from 'cannon-es';
        import GUI from 'lil-gui';

        // --- GLOBAL VARIABLES ---
        let scene, camera, renderer, controls, pmremGenerator;
        let physicsWorld;
        let gui;
        const clock = new THREE.Clock();
        
        const physicsObjects = []; 
        const interactableMeshes = []; 
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const lastMousePos = new THREE.Vector2();
        
        // --- KEYCHAIN CONFIGURATION ---
        // You can easily change texts, colors, shapes and text colors here
        const keychainConfig = [
            { text: 'DEV', color: '#3b82f6', shape: 'box', textColor: '#ffffff', spawnAngle: 200 },
            { text: 'DESIGN', color: '#FF2C79', shape: 'cylinder', textColor: '#ffffff', spawnAngle: 235 },
            { text: 'CSS', color: '#10b981', shape: 'capsule', textColor: '#ffffff', spawnAngle: 270 }, 
            { text: 'JS', color: '#EDFF2C', shape: 'hexagon', textColor: '#ffffff', spawnAngle: 305 }, 
            { text: 'NEXT.JS', color: '#ffffff', shape: 'octahedron', textColor: '#ffffff', spawnAngle: 340 } 
        ];

        // Settings
        const params = {
            forceMultiplier: 3.0,
            glassTransmission: 1.0,
            glassRoughness: 0.15,
            glassThickness: 0.8,
            glassIor: 1.5,
            ringColor: '#d4d4d8',
            ambientLight: 0.5
        };

        const sharedGlassMaterial = new THREE.MeshPhysicalMaterial({
            metalness: 0.1,
            roughness: params.glassRoughness,
            transmission: params.glassTransmission,
            thickness: params.glassThickness,
            ior: params.glassIor,
            transparent: true,
            side: THREE.DoubleSide
        });

        // Collision Groups
        const GROUP_RING = 1;
        const GROUP_KEYCHAIN = 2;
        const GROUP_SMALL_RING = 4;
        const GROUP_DUMMY = 8;

        init();
        animate();

        function init() {
            const container = document.getElementById('canvas-container');
            
            scene = new THREE.Scene();
            scene.background = new THREE.Color('#171717');

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, -1.0, 11); // Moved closer and lowered to focus on keychains

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            container.appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.target.set(0, -1.0, 0); // Target the lower half of the ring

            pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

            const ambientLight = new THREE.AmbientLight(0xffffff, params.ambientLight);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 2);
            dirLight.position.set(5, 5, 5);
            scene.add(dirLight);

            // PHYSICS SETUP
            physicsWorld = new CANNON.World({
                gravity: new CANNON.Vec3(0, -9.81, 0),
            });
            physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
            
            // High iterations count for extreme chain stability
            physicsWorld.solver.iterations = 50; 

            // Stable material without extreme stiffness
            const keychainMaterial = new CANNON.Material('keychain');
            const keychainContactMaterial = new CANNON.ContactMaterial(
                keychainMaterial, keychainMaterial,
                // CRITICAL FIX: Increased contact stiffness so keychains don't compress each other on impact
                { friction: 0.1, restitution: 0.4, contactEquationStiffness: 1e9, contactEquationRelaxation: 3 } 
            );
            physicsWorld.addContactMaterial(keychainContactMaterial);
            scene.userData.keychainMaterial = keychainMaterial;

            buildMainRing();
            buildKeychains();
            setupGUI();
            
            window.addEventListener('resize', onWindowResize);
            window.addEventListener('mousemove', onMouseMove);
            
            document.getElementById('loading').style.opacity = '0';
        }

        function buildMainRing() {
            const ringRadius = 3.0; 
            const tubeRadius = 0.08; 
            const ringPosY = 4.0; 
            
            // Visual Main Ring
            const ringGeo = new THREE.TorusGeometry(ringRadius, tubeRadius, 32, 100);
            const ringMat = new THREE.MeshStandardMaterial({ color: params.ringColor, metalness: 1.0, roughness: 0.2 });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            scene.add(ringMesh);

            // Physics Main Ring
            const ringBody = new CANNON.Body({ 
                mass: 40.0, 
                type: CANNON.Body.DYNAMIC,
                position: new CANNON.Vec3(0, ringPosY, 0),
                linearDamping: 0.1,
                angularDamping: 0.3 
            });
            
            // Generate invisible blocks to give the main ring a true "Torus" physical shape
            for (let i = 0; i < 36; i++) {
                const angle = (i * 10 * Math.PI) / 180;
                const x = ringRadius * Math.cos(angle);
                const y = ringRadius * Math.sin(angle);
                
                const arcLen = (2 * Math.PI * ringRadius) / 36; 
                const boxShape = new CANNON.Box(new CANNON.Vec3(arcLen * 0.55, tubeRadius * 1.5, tubeRadius * 1.5));
                
                const q = new CANNON.Quaternion();
                q.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), angle + Math.PI / 2);
                
                ringBody.addShape(boxShape, new CANNON.Vec3(x, y, 0), q);
            }

            ringBody.collisionFilterGroup = GROUP_RING;
            ringBody.collisionFilterMask = GROUP_KEYCHAIN; // Collides only with glass keychains
            physicsWorld.addBody(ringBody);

            const topPivot = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
            topPivot.position.set(0, ringPosY + ringRadius, 0); 
            physicsWorld.addBody(topPivot);

            const p2p = new CANNON.PointToPointConstraint(
                ringBody, new CANNON.Vec3(0, ringRadius, 0),
                topPivot, new CANNON.Vec3(0, 0, 0)
            );
            physicsWorld.addConstraint(p2p);

            interactableMeshes.push(ringMesh);
            ringMesh.userData.physicsBody = ringBody;
            physicsObjects.push({ mesh: ringMesh, body: ringBody });
            
            scene.userData.ringBody = ringBody;
            scene.userData.ringRadius = ringRadius;
            scene.userData.tubeRadius = tubeRadius;
            scene.userData.ringPosY = ringPosY;
        }

        function createTextTexture(text, colorHex, textColor = '#ffffff') {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 90px "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillStyle = textColor;
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            return texture;
        }

        function buildKeychains() {
            const ringRadius = scene.userData.ringRadius;
            const tubeRadius = scene.userData.tubeRadius;
            const ringBody = scene.userData.ringBody;
            const ringPosY = scene.userData.ringPosY;

            const smallRingRadius = 0.8;
            const trackRadius = ringRadius + smallRingRadius - tubeRadius;

            keychainConfig.forEach((skill) => {
                const angleRad = skill.spawnAngle * (Math.PI / 180);
                
                const attachX = trackRadius * Math.cos(angleRad);
                const attachY = trackRadius * Math.sin(angleRad);
                
                // ========================================================
                // 1. INVISIBLE DUMMY ARM (Handles sliding on the track)
                // ========================================================
                const dummyArm = new CANNON.Body({
                    mass: 3.0, 
                    position: new CANNON.Vec3(0, ringPosY, 0),
                    linearDamping: 0.01,
                    angularDamping: 0.01
                });
                
                // CRITICAL FIX: Add a massive invisible sphere. 
                // This gives the arm HUGE rotational inertia, preventing the mathematical 
                // NaN explosions when the heavy keychains pull on it!
                dummyArm.addShape(new CANNON.Sphere(trackRadius));
                
                dummyArm.collisionFilterGroup = GROUP_DUMMY;
                dummyArm.collisionFilterMask = 0; // Collides with nothing
                dummyArm.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), angleRad);
                physicsWorld.addBody(dummyArm);

                const hingeTrack = new CANNON.HingeConstraint(ringBody, dummyArm, {
                    pivotA: new CANNON.Vec3(0, 0, 0),
                    axisA: new CANNON.Vec3(0, 0, 1),
                    pivotB: new CANNON.Vec3(0, 0, 0),
                    axisB: new CANNON.Vec3(0, 0, 1)
                });
                physicsWorld.addConstraint(hingeTrack);

                // ========================================================
                // 2. SMALL RING
                // ========================================================
                const holeGeo = new THREE.TorusGeometry(smallRingRadius, 0.03, 16, 64);
                // Natural Torus faces Z.
                const holeMat = new THREE.MeshStandardMaterial({ color: '#d4d4d8', metalness: 1, roughness: 0.2 });
                const holeMesh = new THREE.Mesh(holeGeo, holeMat);
                scene.add(holeMesh);

                const smallRingPos = new CANNON.Vec3(attachX, attachY + ringPosY, 0);

                // Mathematical matrix to point the hole along the track
                const tangent = new THREE.Vector3(-Math.sin(angleRad), Math.cos(angleRad), 0).normalize();
                const radial = new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
                
                const localY = radial.clone().negate(); // Points towards the main ring center
                const localZ = tangent; // Hole points along the track
                const localX = new THREE.Vector3().crossVectors(localY, localZ).normalize(); // Orthogonal

                const mMatrix = new THREE.Matrix4().makeBasis(localX, localY, localZ);
                const smallRingQuat = new THREE.Quaternion().setFromRotationMatrix(mMatrix);

                const smallRingBody = new CANNON.Body({
                    mass: 1.0, 
                    position: smallRingPos,
                    // Real size for realistic inertia calculation
                    shape: new CANNON.Sphere(smallRingRadius), 
                    linearDamping: 0.01, 
                    angularDamping: 0.2
                });
                smallRingBody.collisionFilterGroup = GROUP_SMALL_RING;
                smallRingBody.collisionFilterMask = 0; // Small rings pass through each other to prevent tension
                smallRingBody.quaternion.set(smallRingQuat.x, smallRingQuat.y, smallRingQuat.z, smallRingQuat.w);
                physicsWorld.addBody(smallRingBody);

                const p2pArm = new CANNON.PointToPointConstraint(
                    dummyArm, new CANNON.Vec3(trackRadius, 0, 0), 
                    smallRingBody, new CANNON.Vec3(0, 0, 0)
                );
                physicsWorld.addConstraint(p2pArm);

                physicsObjects.push({ mesh: holeMesh, body: smallRingBody, isSmallRing: true });
                interactableMeshes.push(holeMesh);
                holeMesh.userData.physicsBody = smallRingBody;

                // ========================================================
                // 3. GLASS KEYCHAIN
                // ========================================================
                const keychainGroup = new THREE.Group();
                scene.add(keychainGroup);

                let geometry;
                const width = 2.4; 
                const height = 2.4; 
                const depth = 0.15; 
                
                // CRITICAL FIX: Physical box made wider (covers edges) and thicker (prevents tunneling through objects)
                const shapePhysics = new CANNON.Box(new CANNON.Vec3((width/2) * 0.9, (height/2) * 0.9, (depth/2) * 1.5));

                switch(skill.shape) {
                    case 'box': geometry = new THREE.BoxGeometry(width, height, depth, 4, 4, 4); break;
                    case 'cylinder': geometry = new THREE.CylinderGeometry(width/2, width/2, depth, 32); geometry.rotateX(Math.PI / 2); break;
                    case 'capsule': geometry = new THREE.CapsuleGeometry(width/2.5, height/2, 16, 32); geometry.scale(1, 1, depth / (2 * (width/2.5))); break;
                    case 'hexagon': geometry = new THREE.CylinderGeometry(width/2.2, width/2.2, depth, 6); geometry.rotateX(Math.PI / 2); geometry.rotateZ(Math.PI / 6); break;
                    case 'octahedron': geometry = new THREE.OctahedronGeometry(width/1.8, 1); geometry.scale(1, 1, depth / (2 * (width/1.8))); break;
                }

                geometry.computeBoundingBox();
                const visualTopY = geometry.boundingBox.max.y;

                const mat = sharedGlassMaterial.clone();
                mat.color.set(skill.color);
                const glassMesh = new THREE.Mesh(geometry, mat);
                keychainGroup.add(glassMesh);
                interactableMeshes.push(glassMesh); 

                const textTexture = createTextTexture(skill.text, skill.color, skill.textColor);
                const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, depthWrite: false });
                
                const textFront = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.2, width * 0.6), textMat);
                textFront.position.z = depth/2 + 0.01;
                keychainGroup.add(textFront);

                const textBack = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.2, width * 0.6), textMat);
                textBack.position.z = -depth/2 - 0.01;
                textBack.rotation.y = Math.PI; 
                keychainGroup.add(textBack);

                // --- PERFECT ZERO-TENSION SPAWN CALCULATION ---
                // We want to attach to the "bottom" of the small ring (-localY axis)
                const pivotA_local = new CANNON.Vec3(0, -smallRingRadius, 0);
                
                // Convert to World space perfectly using its starting quaternion
                const pivotA_world = new THREE.Vector3(pivotA_local.x, pivotA_local.y, pivotA_local.z);
                pivotA_world.applyQuaternion(smallRingQuat);
                pivotA_world.add(new THREE.Vector3(smallRingPos.x, smallRingPos.y, smallRingPos.z));

                // The keychain's local pivot
                const pivotB_local = new CANNON.Vec3(0, visualTopY - 0.1, 0);

                // Spawn the keychain EXACTLY where the constraint expects it to be
                const spawnPos = new CANNON.Vec3(
                    pivotA_world.x - pivotB_local.x,
                    pivotA_world.y - pivotB_local.y,
                    pivotA_world.z - pivotB_local.z
                );

                const keychainBody = new CANNON.Body({
                    mass: 1.5, 
                    material: scene.userData.keychainMaterial,
                    shape: shapePhysics,
                    position: spawnPos,
                    // CRITICAL FIX: Slightly increased linear damping to absorb extreme mouse velocities
                    linearDamping: 0.3, 
                    angularDamping: 0.5 
                });
                
                keychainBody.collisionFilterGroup = GROUP_KEYCHAIN;
                // Glass heavily collides with other Glass and the Main Ring
                keychainBody.collisionFilterMask = GROUP_KEYCHAIN | GROUP_RING; 
                physicsWorld.addBody(keychainBody);

                const p2pKey = new CANNON.PointToPointConstraint(
                    smallRingBody, pivotA_local, 
                    keychainBody, pivotB_local 
                );
                physicsWorld.addConstraint(p2pKey);

                glassMesh.userData.physicsBody = keychainBody;
                physicsObjects.push({ mesh: keychainGroup, body: keychainBody });
            });
        }

        function setupGUI() {
            gui = new GUI({ title: 'Scene Settings' });
            
            const physFolder = gui.addFolder('Interaction');
            physFolder.add(params, 'forceMultiplier', 0.5, 10).name('Hover Force');
            
            const matFolder = gui.addFolder('Glass Material');
            matFolder.add(params, 'glassTransmission', 0, 1).name('Transmission').onChange(updateMaterials);
            matFolder.add(params, 'glassRoughness', 0, 1).name('Roughness').onChange(updateMaterials);
            matFolder.add(params, 'glassThickness', 0.1, 3).name('Thickness').onChange(updateMaterials);
            
            gui.close(); // Hide panel by default
        }

        function updateMaterials() {
            physicsObjects.forEach(obj => {
                if(obj.mesh.type === 'Group') { 
                    const glassMesh = obj.mesh.children[0];
                    if(glassMesh && glassMesh.material) {
                        glassMesh.material.transmission = params.glassTransmission;
                        glassMesh.material.roughness = params.glassRoughness;
                        glassMesh.material.thickness = params.glassThickness;
                    }
                }
            });
        }

        function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const velocityX = mouse.x - lastMousePos.x;
            const velocityY = mouse.y - lastMousePos.y;
            lastMousePos.copy(mouse);

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactableMeshes, false);

            if (intersects.length > 0) {
                const hit = intersects[0];
                const object = hit.object;
                
                if (object.userData.physicsBody) {
                    const body = object.userData.physicsBody;
                    const massFactor = body.mass;
                    const forceMag = params.forceMultiplier * 4 * massFactor; 
                    
                    // CRITICAL FIX: Clamp extreme cursor velocity values so keychains don't accelerate to bullet speeds
                    const clamp = (val, max) => Math.max(Math.min(val, max), -max);
                    const cVelX = clamp(velocityX, 0.15);
                    const cVelY = clamp(velocityY, 0.15);

                    const impulse = new CANNON.Vec3(
                        cVelX * forceMag,
                        cVelY * forceMag,
                        -Math.abs(cVelX + cVelY) * forceMag * 0.8 
                    );

                    if(Math.abs(cVelX) < 0.001 && Math.abs(cVelY) < 0.001) {
                        impulse.set(
                            (Math.random() - 0.5) * massFactor * 0.2,
                            (Math.random() - 0.5) * massFactor * 0.2,
                            -0.2 * massFactor
                        );
                    }

                    const worldPoint = new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z);
                    body.applyImpulse(impulse, worldPoint);
                }
            }
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);

            const delta = Math.min(clock.getDelta(), 0.1); 
            physicsWorld.step(1 / 60, delta, 3);

            const ringBody = scene.userData.ringBody;

            for (let i = 0; i < physicsObjects.length; i++) {
                const obj = physicsObjects[i];
                
                // STABLE ALIGNMENT (PD CONTROLLER)
                if (obj.isSmallRing && ringBody) {
                    const localPos = ringBody.pointToLocalFrame(obj.body.position);
                    const localTangent = new CANNON.Vec3(-localPos.y, localPos.x, 0);
                    localTangent.normalize();
                    const worldTangent = ringBody.vectorToWorldFrame(localTangent);

                    const currentZ = obj.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1));
                    const torque = currentZ.cross(worldTangent);
                    
                    const k_align = 20; // Soft spring
                    const d_align = 2;  // Soft damper
                    const angVel = obj.body.angularVelocity;
                    
                    obj.body.applyTorque(new CANNON.Vec3(
                        torque.x * k_align - angVel.x * d_align, 
                        torque.y * k_align - angVel.y * d_align, 
                        torque.z * k_align - angVel.z * d_align
                    ));
                }

                obj.mesh.position.copy(obj.body.position);
                obj.mesh.quaternion.copy(obj.body.quaternion);
            }

            controls.update();
            renderer.render(scene, camera);
        }