// CONFIG
        const Z_GAP = 600;      // Distance between items
        const ITEM_COUNT = 15;  // How many recyclable items
        const LOOP_SIZE = ITEM_COUNT * Z_GAP;
        const STAR_COUNT = 100;

        const TEXTS = ["SYSTEM", "DESIGN", "FUTURE", "BRUTAL", "MOTION", "IMPACT", "CODE", "CRAFT", "VISION"];

        const world = document.getElementById('world');
        const viewport = document.getElementById('viewport');
        const items = [];

        // 1. GENERATE SCENE
        function init() {
            // Main Objects
            for (let i = 0; i < ITEM_COUNT; i++) {
                const isText = i % 3 === 0; // Every 3rd item is text
                const el = document.createElement('div');
                el.className = 'item';

                // Content
                if (isText) {
                    const txt = document.createElement('div');
                    txt.className = 'big-text';
                    txt.innerText = TEXTS[i % TEXTS.length];
                    el.appendChild(txt);
                } else {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <div class="index">0${i} // ${Math.random().toFixed(4)}</div>
                        <h2>${TEXTS[i % TEXTS.length]}</h2>
                        <p style="color:#666; font-size:0.8rem; margin-top: auto;">COORD: [${Math.random().toFixed(0)}, ${Math.random().toFixed(0)}]</p>
                    `;
                    el.appendChild(card);
                }

                // Initial Random Position
                // We use a spiral or random tunnel layout
                const angle = (i / ITEM_COUNT) * Math.PI * 4; // Spiral
                const radius = 300 + Math.random() * 200;

                // Randomize X/Y but keep it somewhat centered
                const x = (Math.random() - 0.5) * window.innerWidth * 0.8;
                const y = (Math.random() - 0.5) * window.innerHeight * 0.8;
                const rotZ = (Math.random() - 0.5) * 20;

                world.appendChild(el);

                items.push({
                    el,
                    x, y, rotZ,
                    baseZ: -i * Z_GAP, // Staggered backwards
                    type: isText ? 'text' : 'card'
                });
            }

            // Stars
            for (let i = 0; i < STAR_COUNT; i++) {
                const el = document.createElement('div');
                el.className = 'particle';
                world.appendChild(el);

                items.push({
                    el,
                    x: (Math.random() - 0.5) * 2000,
                    y: (Math.random() - 0.5) * 2000,
                    rotZ: 0,
                    baseZ: -(Math.random() * LOOP_SIZE),
                    type: 'star'
                });
            }
        }
        init();

        // 2. SCROLL SETUP
        const lenis = new Lenis({
            smooth: true,
            lerp: 0.1
        });

        // State
        let scrollPos = 0;
        let velocity = 0;
        let targetSpeed = 0;

        lenis.on('scroll', (e) => {
            scrollPos = e.scroll;
            targetSpeed = e.velocity;
        });

        function raf(time) {
            lenis.raf(time);

            // LERPed Velocity for smoother warp effect
            velocity += (targetSpeed - velocity) * 0.1;

            update(scrollPos, velocity);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);


        // 3. RENDER LOOP
        function update(scroll, vel) {

            // Dynamic FOV (Warp Effect)
            // Base 800px, decreases (widens) with speed
            // Limit clamping
            const warp = Math.min(Math.abs(vel) * 2, 400);
            viewport.style.perspective = `${800 - warp}px`;

            // World Global Rotation (Mouse or Velocity tilt)
            const tilt = vel * 0.05;
            world.style.transform = `rotateX(${-tilt}deg)`;

            // Loop items
            const totalDepth = LOOP_SIZE;

            // "Camera" Z position
            // We want to move forward, so we add separate "distance" variable?
            // Or just use scroll directly.
            // Let's effectively move items towards us.
            // visualZ = baseZ + scroll * speedFactor
            const speedFactor = 2.5;
            const currentDist = scroll * speedFactor;

            items.forEach(item => {

                // Infinite Math:
                // We want Z to wrap between -LOOP_SIZE and 0.
                // relativeZ should increase as we scroll.

                let z = item.baseZ + currentDist;

                // Wrap logic
                // If z > 500 (behind camera), subtract LOOP_SIZE
                // We utilize modulo to keep it in a specific range

                // A robust modulo for negative numbers:
                // ((z % n) + n) % n

                // However, we want the window to slide.
                // Let's try simple offset.

                const offset = z % totalDepth;
                // offset is between -totalDepth and +totalDepth

                // We force it to be between -totalDepth and 200
                let vizZ = offset;
                if (vizZ > 500) vizZ -= totalDepth;
                if (vizZ < -totalDepth + 500) vizZ += totalDepth;

                // If it's still weird, simple check:
                while (vizZ > 500) vizZ -= totalDepth;

                // Opacity Logic
                // 1. Fade in from distance (e.g. at -4000)
                // 2. Fade out near camera (e.g. at 200)
                let alpha = 1;

                // Distance Fade
                const maxDist = -3000;
                if (vizZ < maxDist) {
                    alpha = 0;
                } else if (vizZ < maxDist + 1000) {
                    alpha = (vizZ - maxDist) / 1000;
                }

                // Camera Fade
                if (vizZ > 0) {
                    alpha = 1 - (vizZ / 400);
                }

                if (alpha < 0) alpha = 0;
                item.el.style.opacity = alpha;

                if (alpha > 0) {
                    // Item specific motion
                    let scale = 1;
                    if (item.type === 'star') {
                        // Stretch stars
                        const stretch = Math.max(1, Math.min(1 + Math.abs(vel) * 0.05, 5));
                        scale = `1, ${stretch}, 1`; // Scale Y
                        item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px) scale3d(1, ${stretch}, 1)`;
                    } else {
                        // Cards/Text
                        // Add subtle floating rotation
                        const floatRot = Math.sin(Date.now() * 0.001 + item.baseZ) * 5;
                        item.el.style.transform = `
                            translate3d(${item.x}px, ${item.y}px, ${vizZ}px) 
                            rotateZ(${item.rotZ + floatRot}deg)
                        `;
                    }
                }
            });
        }