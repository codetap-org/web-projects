import * as THREE from 'three';

        // --- SETTINGS ---
        const BIRD_COUNT = 200;          
        const VISUAL_RANGE = 250;        
        const SEPARATION_DIST = 180;     
        
        const SPEED_LIMIT = 6.5;         
        const MIN_SPEED = 3.5;

        // --- SCENE ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xE0F2FF);
        scene.fog = new THREE.Fog(0xE0F2FF, 600, 4000);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 6000);
        camera.position.set(0, 0, 1400); 
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // --- 3D AUDIO SETUP ---
        const listener = new THREE.AudioListener();
        camera.add(listener);

        // Create positional (3D) audio
        const birdSound = new THREE.PositionalAudio(listener);
        const audioLoader = new THREE.AudioLoader();

        // Load the audio file
        audioLoader.load('https://ik.imagekit.io/sqiqig7tz/birds-2.mp3', (buffer) => {
            birdSound.setBuffer(buffer);
            birdSound.setLoop(true);
            birdSound.setVolume(1.5); // Base volume
            birdSound.setRefDistance(400); // Distance at which volume starts to decrease
            birdSound.setMaxDistance(3000); // Maximum distance where sound can still be heard
        });

        // Create an invisible object to act as the sound emitter at the center of the flock
        const soundEmitter = new THREE.Object3D();
        soundEmitter.add(birdSound);
        scene.add(soundEmitter);

        let audioStarted = false;

        // Async function to handle browser's autoplay policy
        async function initAudio() {
            // Prevent multiple initialization attempts
            if (audioStarted || !birdSound.buffer) return;
            
            audioStarted = true; // Lock immediately
            
            // Resume the AudioContext if it's in a suspended state
            if (listener.context.state === 'suspended') {
                await listener.context.resume();
            }
            
            birdSound.play();
            const hint = document.getElementById('sound-hint');
            if (hint) {
                hint.style.opacity = '0'; 
                setTimeout(() => hint.remove(), 500); 
            }
        }

        // --- MOUSE & PLANE ---
        const hitGeometry = new THREE.PlaneGeometry(20000, 20000);
        const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const hitPlane = new THREE.Mesh(hitGeometry, hitMaterial);
        scene.add(hitPlane);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const targetPoint = new THREE.Vector3(); 
        
        let lastMouseMoveTime = 0;
        let isMouseActive = false;

        window.addEventListener('mousemove', (event) => {
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            lastMouseMoveTime = Date.now();
            isMouseActive = true;
        });

       
        window.addEventListener('pointerdown', initAudio);

        // --- BIRD GEOMETRY ---
        const baseGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0.0, 0.0, 5.0,     // Nose
            -12.5, 0.0, -2.5,  // Left wing
            0.0, 0.0, -2.5,    // Tail
            
            0.0, 0.0, 5.0,     // Nose
            0.0, 0.0, -2.5,    // Tail
            12.5, 0.0, -2.5    // Right wing
        ]);
        baseGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const instancedGeometry = new THREE.InstancedBufferGeometry();
        instancedGeometry.copy(baseGeometry);

        const randomAttribute = new Float32Array(BIRD_COUNT);
        for (let i = 0; i < BIRD_COUNT; i++) randomAttribute[i] = Math.random() * 5.0;
        instancedGeometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randomAttribute, 1));

        // --- MATERIAL ---
        const material = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
        const userData = { time: { value: 0 } };
        
        material.onBeforeCompile = (shader) => {
            shader.uniforms.time = userData.time;
            shader.vertexShader = `
                uniform float time;
                attribute float aRandom;
            ` + '\n' + shader.vertexShader;

            const token = '#include <begin_vertex>';
            const customTransform = `
                vec3 transformed = vec3( position );
                float flapSpeed = 8.0 + aRandom; 
                float angle = time * flapSpeed + aRandom;
                float yOffset = sin(angle) * abs(transformed.x) * 0.45; 
                transformed.y += yOffset;
            `;
            shader.vertexShader = shader.vertexShader.replace(token, customTransform);
        };

        const mesh = new THREE.InstancedMesh(instancedGeometry, material, BIRD_COUNT);
        scene.add(mesh);

        // --- PHYSICS DATA ---
        const position = [];
        const velocity = [];
        const dummy = new THREE.Object3D();

        for (let i = 0; i < BIRD_COUNT; i++) {
            let p = new THREE.Vector3(
                (Math.random() - 0.5) * 800,
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 200
            );
            position.push(p);
            let v = new THREE.Vector3(
                (Math.random() - 0.5) * SPEED_LIMIT,
                (Math.random() - 0.5) * SPEED_LIMIT,
                (Math.random() - 0.5) * SPEED_LIMIT
            );
            velocity.push(v);
            
            dummy.position.copy(p);
            dummy.lookAt(p.clone().add(v));
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }

        // --- LOGIC ---
        function updateTarget(time) {
            if (Date.now() - lastMouseMoveTime > 2000) {
                isMouseActive = false;
            }

            if (isMouseActive) {
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(hitPlane);
                if (intersects.length > 0) {
                    targetPoint.copy(intersects[0].point);
                }
            } else {
                // Autonomous flight (Idle wandering) - REDUCED RADIUS
                const wanderX = Math.sin(time * 0.4) * 100; // Was 800
                const wanderY = Math.cos(time * 0.6) * 100; // Was 350
                const wanderZ = Math.sin(time * 0.3) * 100; // Was 500
                const wanderTarget = new THREE.Vector3(wanderX, wanderY, wanderZ);
                targetPoint.lerp(wanderTarget, 0.05);
            }
        }

        function updatePhysics() {
            let centerOfMass = new THREE.Vector3(); // Used to calculate the flock's center

            for (let i = 0; i < BIRD_COUNT; i++) {
                let pos = position[i];
                let vel = velocity[i];

                centerOfMass.add(pos); // Accumulate positions of all birds

                let separation = new THREE.Vector3();
                let alignment = new THREE.Vector3();
                let cohesion = new THREE.Vector3();
                let count = 0;

                let checkStart = (i + Math.floor(Math.random()*10)) % BIRD_COUNT;
                for (let k = 0; k < 45; k++) {
                    let j = (checkStart + k) % BIRD_COUNT;
                    if (i === j) continue;

                    let dSq = pos.distanceToSquared(position[j]);

                    if (dSq < VISUAL_RANGE * VISUAL_RANGE) {
                        let dist = Math.sqrt(dSq);
                        
                        if (dist < SEPARATION_DIST) {
                            let push = new THREE.Vector3().subVectors(pos, position[j]);
                            push.normalize();
                            push.divideScalar(Math.max(dist * 0.4, 0.1)); 
                            separation.add(push);
                        }

                        alignment.add(velocity[j]);
                        cohesion.add(position[j]);
                        count++;
                    }
                }

                if (count > 0) {
                    separation.multiplyScalar(7.0); 
                    alignment.divideScalar(count).normalize().multiplyScalar(1.0);
                    cohesion.divideScalar(count).sub(pos).normalize().multiplyScalar(0.7);

                    vel.add(separation);
                    vel.add(alignment);
                    vel.add(cohesion);
                }

                // --- TARGET ---
                let targetForce = new THREE.Vector3().subVectors(targetPoint, pos);
                let distToTarget = targetForce.length();
                let pullStrength = isMouseActive ? 0.35 : 0.02;
                
                if (distToTarget < 200) {
                    pullStrength *= (distToTarget / 200);
                    vel.multiplyScalar(0.92);
                }

                targetForce.normalize().multiplyScalar(pullStrength);
                vel.add(targetForce);

                if (isMouseActive) {
                    vel.multiplyScalar(0.97); 
                }

                let speed = vel.length();
                if (speed > SPEED_LIMIT) vel.multiplyScalar(SPEED_LIMIT / speed);
                if (speed < MIN_SPEED) vel.normalize().multiplyScalar(MIN_SPEED);

                pos.add(vel);

                dummy.position.copy(pos);
                dummy.lookAt(pos.clone().add(vel));
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;

            // Move the sound emitter to the geometric center of the flock
            centerOfMass.divideScalar(BIRD_COUNT);
            soundEmitter.position.lerp(centerOfMass, 0.1); // Smooth interpolation
        }

        // --- LOOP ---
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = Date.now() * 0.001;
            
            userData.time.value += delta;

            updateTarget(time);
            updatePhysics();
            
            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        animate();