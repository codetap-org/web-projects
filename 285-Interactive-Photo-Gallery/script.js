import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // === 1. SCENE SETUP ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 100, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // For high DPI screens
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Inertia
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going under the grid

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(20, 80, 50);
    scene.add(dirLight);

    // === 2. CUBE GENERATION ===
    const cols = 12;
    const rows = 8;
    const cubeSize = 10;
    const gap = 0.5;
    const step = cubeSize + gap;

    // Calculate grid dimensions to center it
    const gridWidth = cols * step - gap;
    const gridDepth = rows * step - gap;
    const startX = -gridWidth / 2 + cubeSize / 2;
    const startZ = -gridDepth / 2 + cubeSize / 2;

    const cubes = []; 

    const textureLoader = new THREE.TextureLoader();
    const sideMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 }); // Dark grey sides
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            
            // Use 'seed' to get the same image for thumbnail and full size
            const seed = `img_${i}_${j}`; 
            const thumbUrl = `https://picsum.photos/seed/${seed}/200/200`; // Low res for texture
            const fullUrl = `https://picsum.photos/seed/${seed}/1200/800`; // High res for lightbox

            const texture = textureLoader.load(thumbUrl);
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            
            const topMaterial = new THREE.MeshLambertMaterial({ map: texture });
            
            // Material array: [Right, Left, Top, Bottom, Front, Back]
            const materials = [
                sideMaterial, sideMaterial, 
                topMaterial, // Top face has the image
                sideMaterial, sideMaterial, sideMaterial
            ];

            const cube = new THREE.Mesh(geometry, materials);

            // Positioning
            cube.position.x = startX + i * step;
            cube.position.z = startZ + j * step;
            cube.position.y = 0;

            // Store custom data for animation and lightbox
            cube.userData = { 
                targetY: 0, 
                fullUrl: fullUrl
            };

            scene.add(cube);
            cubes.push(cube);
        }
    }

    // === 3. RAYCASTING SETUP ===
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(9999, 9999); // Start off-screen
    let hoveredCube = null;

    function onMouseMove(event) {
        // Normalize mouse coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);

    // === 4. CLICK HANDLERS & LIGHTBOX ===
    const mouseDownPos = new THREE.Vector2();
    
    // Track mouse down position
    window.addEventListener('mousedown', (event) => {
        mouseDownPos.x = event.clientX;
        mouseDownPos.y = event.clientY;
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('close-btn');

    function openLightbox(url) {
        lightboxImg.src = url;
        lightbox.style.display = 'flex';
        requestAnimationFrame(() => lightbox.classList.add('active'));
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.style.display = 'none';
            lightboxImg.src = "";
        }, 300); // Wait for transition
    }

    window.addEventListener('click', (event) => {
        // Calculate distance between mousedown and mouseup
        const dx = event.clientX - mouseDownPos.x;
        const dy = event.clientY - mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved less than 5px, treat as a click. Otherwise, it's a drag (camera control).
        if (distance < 5 && hoveredCube) {
            openLightbox(hoveredCube.userData.fullUrl);
        }
    });

    // Close on background click or close button
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);


    // === 5. ANIMATION LOOP ===
    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // LOGIC: Check intersection with actual cubes
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cubes);

        if (intersects.length > 0) {
            // Get the first (closest) cube
            hoveredCube = intersects[0].object;
        } else {
            hoveredCube = null;
        }

        // Update cursor style
        if (hoveredCube) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }

        // Animate cubes
        cubes.forEach(cube => {
            if (cube === hoveredCube) {
                // Lift height set to 5
                cube.userData.targetY = 5;
            } else {
                cube.userData.targetY = 0;
            }

            // Smooth interpolation (Lerp)
            cube.position.y += (cube.userData.targetY - cube.position.y) * 0.15;
        });

        renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();