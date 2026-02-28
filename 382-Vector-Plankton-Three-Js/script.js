import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
        import GUI from 'three/addons/libs/lil-gui.module.min.js';

        // --- CONFIGURATION ---
        const CONFIG = {
            backgroundColor: '#121212', 

            sampleResolution: 1500, 
            blendSteps: 110,         
            
            // Start State
            pos1: { x: -24, y: 20, z: -150 },
            rot1: { x: 0, y: -0.25, z: -0.408 },
            scale1: 2,
            opacity1: 0.1, 

            // End State
            pos2: { x: -24, y: 20, z: 50.0 }, 
            rot2: { x: -0.1822, y: -0.6408, z: 500 },
            scale2: 0.0, 
            opacity2: 0.9, 
            
            // Colors
            color1: '#002aff', 
            color2: '#67e9e1', 
            
            // Animation
            animSpeed: 1.435,      
            waveStrength: 22.3, 
            
            // Advanced Animation
            waveFreqShape: 0.0,  
            waveFreqTrail: 1.8,  
            twist: -0.212,          
            noiseStrength: 0.0,

            // INDEPENDENT FLOATING MOTION
            randomMotion: 1.0,
            
            loadSVG: () => document.getElementById('input-svg').click(),
        };

        let scene, camera, renderer, controls;
        
        let baseShapeData = { points: [], cuts: new Set() };
        
        let blendMeshGroup = new THREE.Group();
        let clock = new THREE.Clock();

        const tempV1 = new THREE.Vector3();
        const tempV2 = new THREE.Vector3();
        const euler1 = new THREE.Euler();
        const euler2 = new THREE.Euler();

        const loader = new SVGLoader();

        function init() {
            const container = document.getElementById('canvas-container');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(CONFIG.backgroundColor); 

            camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
            camera.position.set(150, -50, 300);


            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;

            scene.add(blendMeshGroup);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            initGUI();
            loadDefaultShape();

            window.addEventListener('resize', onWindowResize);
            document.getElementById('input-svg').addEventListener('change', handleFileSelect);

            animate();
        }

        // --- SVG PARSING ---
        function parseSVGToPoints(svgText) {
            const data = loader.parse(svgText);
            
            let allPoints = [];
            let cuts = new Set(); 

            data.paths.forEach((path) => {
                path.subPaths.forEach(subPath => {
                    if (subPath.getLength() > 0.1) {
                        const points = subPath.getPoints(Math.floor(subPath.getLength() * 2)); 
                        
                        points.forEach(p => {
                            allPoints.push(new THREE.Vector3(p.x, -p.y, 0));
                        });

                        cuts.add(allPoints.length - 1);
                    }
                });
            });

            if (allPoints.length === 0) return null;

            const box = new THREE.Box3().setFromPoints(allPoints);
            const center = new THREE.Vector3();
            box.getCenter(center);
            allPoints.forEach(p => p.sub(center));
            
            if (allPoints.length > CONFIG.sampleResolution) {
                const step = Math.ceil(allPoints.length / CONFIG.sampleResolution);
                const optimizedPoints = [];
                const optimizedCuts = new Set();
                
                for(let i=0; i<allPoints.length; i+=step) {
                    optimizedPoints.push(allPoints[i]);
                    for(let k=0; k<step; k++) {
                        if (cuts.has(i+k)) optimizedCuts.add(optimizedPoints.length - 1);
                    }
                }
                return { points: optimizedPoints, cuts: optimizedCuts };
            }

            return { points: allPoints, cuts: cuts };
        }

        function rebuildBlend() {
            while(blendMeshGroup.children.length > 0){ 
                const obj = blendMeshGroup.children[0];
                obj.geometry.dispose();
                obj.material.dispose();
                blendMeshGroup.remove(obj); 
            }

            if (baseShapeData.points.length === 0) return;

            const totalPoints = baseShapeData.points.length;

            const indices = [];
            for (let i = 0; i < totalPoints - 1; i++) {
                if (!baseShapeData.cuts.has(i)) {
                    indices.push(i, i + 1);
                }
            }

            for (let i = 0; i < CONFIG.blendSteps; i++) {
                const t = i / (CONFIG.blendSteps - 1); 
                
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array(totalPoints * 3);
                
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(indices); 

                const color = new THREE.Color().lerpColors(
                    new THREE.Color(CONFIG.color1), 
                    new THREE.Color(CONFIG.color2), 
                    t
                );

                const opacity = THREE.MathUtils.lerp(CONFIG.opacity1, CONFIG.opacity2, t);

                const material = new THREE.LineBasicMaterial({ 
                    color: color,
                    transparent: true,
                    opacity: opacity,
                    linewidth: 1,
                    depthWrite: false
                });

                const segments = new THREE.LineSegments(geometry, material);
                
                segments.userData = { stepIndex: i, t: t };
                blendMeshGroup.add(segments);
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            
            const time = clock.getElapsedTime();
            controls.update();

            if (blendMeshGroup.children.length > 0 && baseShapeData.points.length > 0) {
                
                euler1.set(CONFIG.rot1.x, CONFIG.rot1.y, CONFIG.rot1.z);
                euler2.set(CONFIG.rot2.x, CONFIG.rot2.y, CONFIG.rot2.z);

                blendMeshGroup.children.forEach((segments) => {
                    const t = segments.userData.t; 
                    const positions = segments.geometry.attributes.position.array;

                    // --- NEW: INDEPENDENT RANDOM MOTION CALCULATION ---
                    let rX1 = 0, rY1 = 0;
                    let rX2 = 0, rY2 = 0;

                    if (CONFIG.randomMotion > 0) {
                        // Use different time multipliers and phases for State 1 vs State 2
                        // This ensures they move chaotically and independently
                        
                        // Motion for Start State
                        rX1 = (Math.sin(time * 0.7) + Math.cos(time * 1.9)) * CONFIG.randomMotion;
                        rY1 = (Math.cos(time * 0.8) + Math.sin(time * 2.1)) * CONFIG.randomMotion;

                        // Motion for End State (Different speeds)
                        rX2 = (Math.sin(time * 0.9 + 42) + Math.cos(time * 2.3)) * CONFIG.randomMotion;
                        rY2 = (Math.cos(time * 1.1 + 13) + Math.sin(time * 2.5)) * CONFIG.randomMotion;
                    }

                    // Apply offsets to calculation vectors
                    const startPos = new THREE.Vector3(
                        CONFIG.pos1.x + rX1, 
                        CONFIG.pos1.y + rY1, 
                        CONFIG.pos1.z
                    );

                    const endPos = new THREE.Vector3(
                        CONFIG.pos2.x + rX2, 
                        CONFIG.pos2.y + rY2, 
                        CONFIG.pos2.z
                    );

                    // Interpolate Group Position based on independent moving points
                    const currentGroupPos = new THREE.Vector3().lerpVectors(startPos, endPos, t);
                    
                    segments.position.copy(currentGroupPos);

                    // Vertices Calculation
                    for (let j = 0; j < baseShapeData.points.length; j++) {
                        const rawP = baseShapeData.points[j];

                        // State 1
                        tempV1.copy(rawP).multiplyScalar(CONFIG.scale1).applyEuler(euler1);
                        
                        // State 2
                        tempV2.copy(rawP).multiplyScalar(CONFIG.scale2).applyEuler(euler2);

                        // Lerp Position
                        let x = THREE.MathUtils.lerp(tempV1.x, tempV2.x, t);
                        let y = THREE.MathUtils.lerp(tempV1.y, tempV2.y, t);
                        let z = THREE.MathUtils.lerp(tempV1.z, tempV2.z, t);

                        // --- ADVANCED ANIMATION ---

                        // 1. Twist (Spiral)
                        if (CONFIG.twist !== 0) {
                            const angle = t * CONFIG.twist * Math.PI * 2;
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const tx = x * cosA - y * sinA;
                            const ty = x * sinA + y * cosA;
                            x = tx;
                            y = ty;
                        }

                        // 2. Wave Effect
                        if (CONFIG.waveStrength > 0) {
                            const phase = time * CONFIG.animSpeed + 
                                          j * 0.01 * CONFIG.waveFreqShape + 
                                          t * Math.PI * CONFIG.waveFreqTrail;
                                          
                            const wave = Math.sin(phase) * CONFIG.waveStrength;
                            z += wave; 
                        }

                        // 3. Noise
                        if (CONFIG.noiseStrength > 0) {
                            x += (Math.random() - 0.5) * CONFIG.noiseStrength;
                            y += (Math.random() - 0.5) * CONFIG.noiseStrength;
                            z += (Math.random() - 0.5) * CONFIG.noiseStrength;
                        }

                        positions[j*3] = x;
                        positions[j*3+1] = y;
                        positions[j*3+2] = z;
                    }
                    
                    segments.geometry.attributes.position.needsUpdate = true;
                });
            }

            renderer.render(scene, camera);
        }

        // --- UI ---
        function handleFileSelect(evt) {
            const file = evt.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const data = parseSVGToPoints(content);
                
                if (data) {
                    baseShapeData = data;
                    rebuildBlend();
                } else {
                    alert("Unable to parse SVG.");
                }
            };
            reader.readAsText(file);
        }

        function initGUI() {
            const gui = new GUI({ title: 'Trail Settings' });

            gui.addColor(CONFIG, 'backgroundColor').name('Background').onChange((value) => {
                scene.background.set(value);
            });

            const folderLoad = gui.addFolder('File');
            folderLoad.add(CONFIG, 'loadSVG').name('Load SVG');
            
            const folderBlend = gui.addFolder('Blend Loop');
            folderBlend.add(CONFIG, 'blendSteps', 2, 200, 1).name('Count').onChange(rebuildBlend);
            folderBlend.addColor(CONFIG, 'color1').name('Start Color').onChange(rebuildBlend);
            folderBlend.addColor(CONFIG, 'color2').name('End Color').onChange(rebuildBlend);

            const f1 = gui.addFolder('Start State');
            f1.add(CONFIG.pos1, 'x', -300, 300).name('Pos X');
            f1.add(CONFIG.pos1, 'y', -300, 300).name('Pos Y');
            f1.add(CONFIG.pos1, 'z', -300, 300).name('Pos Z');
            f1.add(CONFIG, 'scale1', 0, 5.0).name('Scale');
            f1.add(CONFIG.rot1, 'x', -Math.PI, Math.PI).name('Rot X');
            f1.add(CONFIG.rot1, 'y', -Math.PI, Math.PI).name('Rot Y');
            f1.add(CONFIG.rot1, 'z', -Math.PI, Math.PI).name('Rot Z');
            f1.add(CONFIG, 'opacity1', 0, 1).name('Opacity').onChange(rebuildBlend);

            const f2 = gui.addFolder('End State');
            f2.add(CONFIG.pos2, 'x', -300, 300).name('Pos X');
            f2.add(CONFIG.pos2, 'y', -300, 300).name('Pos Y');
            f2.add(CONFIG.pos2, 'z', -300, 300).name('Pos Z');
            f2.add(CONFIG, 'scale2', 0, 5.0).name('Scale');
            f2.add(CONFIG.rot2, 'x', -Math.PI, Math.PI).name('Rot X');
            f2.add(CONFIG.rot2, 'y', -Math.PI, Math.PI).name('Rot Y');
            f2.add(CONFIG.rot2, 'z', -Math.PI, Math.PI).name('Rot Z');
            f2.add(CONFIG, 'opacity2', 0, 1).name('Opacity').onChange(rebuildBlend);

            const folderAnim = gui.addFolder('Animation');
            folderAnim.add(CONFIG, 'animSpeed', 0, 5).name('Time Speed');
            folderAnim.add(CONFIG, 'waveStrength', 0, 100).name('Wave Amplitude');
            
            // Advanced Controls
            folderAnim.add(CONFIG, 'waveFreqShape', 0, 50).name('Wave Freq (Shape)');
            folderAnim.add(CONFIG, 'waveFreqTrail', 0, 20).name('Wave Freq (Trail)');
            folderAnim.add(CONFIG, 'twist', -2, 2).name('Spiral Twist');
            folderAnim.add(CONFIG, 'randomMotion', 0, 50).name('Random Motion (Indep.)'); 
            folderAnim.add(CONFIG, 'noiseStrength', 0, 10).name('Jitter / Noise');

            folderBlend.open();
            folderAnim.open();
            f1.open();
            f2.open();
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

function loadDefaultShape() {
            // Rounded 8-Point Star (Organic Shape)
            const demoSVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 
                         C 55 10 62 28 72 30 
                         C 82 32 95 25 95 35 
                         C 95 45 78 52 78 62 
                         C 78 72 92 82 85 89 
                         C 78 96 65 82 50 85 
                         C 35 82 22 96 15 89 
                         C 8 82 22 72 22 62 
                         C 22 52 5 45 5 35 
                         C 5 25 18 32 28 30 
                         C 38 28 45 10 50 10 Z" 
                         stroke="white" fill="none"/>
            </svg>`;
            
            const data = parseSVGToPoints(demoSVG);
            if(data) {
                baseShapeData = data;
                rebuildBlend();
            }
        }

        init();