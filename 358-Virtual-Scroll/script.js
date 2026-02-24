// Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 5, 35);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // Add canvas description for screen readers
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', 
      'Interactive 3D tunnel visualization. Use arrow keys to navigate through 12 sections.');

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00d4ff, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x7b2ff7, 1.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Create a tunnel of toruses to scroll through
    const objects = [];
    const totalSections = 12;
    const sectionHeight = 8;

    for (let section = 0; section < totalSections; section++) {
      const y = -section * sectionHeight;
      const ringRadius = 6;
      
      const torusGeo = new THREE.TorusGeometry(ringRadius, 0.3, 16, 32);
      const torusMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL((section / totalSections), 0.8, 0.5),
        metalness: 0.7,
        roughness: 0.2,
        emissive: new THREE.Color().setHSL((section / totalSections), 0.8, 0.3),
        emissiveIntensity: 0.3
      });
      
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.position.y = y;
      torus.rotation.x = Math.PI / 2;
      scene.add(torus);
      objects.push({ mesh: torus, baseY: y, section: section });
    }

    // Initial camera position
    camera.position.z = 10;
    camera.position.y = 0;

    // Virtual scroll state
    let scrollTarget = 0;
    let scrollCurrent = 0;
    const maxScroll = (totalSections - 1) * sectionHeight;
    const baseDamping = 0.08;

    // Wheel event handler
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      scrollTarget += e.deltaY * 0.01;
      scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget));
    }, { passive: false });

    // Touch support
    let lastTouchY = 0;

    window.addEventListener('touchstart', (e) => {
      lastTouchY = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      scrollTarget += deltaY * 0.05;
      scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget));
      lastTouchY = touchY;
    }, { passive: false });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const scrollSpeed = sectionHeight;
      const fastScrollSpeed = sectionHeight * 3;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          scrollTarget = Math.min(maxScroll, scrollTarget + scrollSpeed);
          break;
        case 'ArrowUp':
          e.preventDefault();
          scrollTarget = Math.max(0, scrollTarget - scrollSpeed);
          break;
        case 'PageDown':
          e.preventDefault();
          scrollTarget = Math.min(maxScroll, scrollTarget + fastScrollSpeed);
          break;
        case 'PageUp':
          e.preventDefault();
          scrollTarget = Math.max(0, scrollTarget - fastScrollSpeed);
          break;
        case 'Home':
          e.preventDefault();
          scrollTarget = 0;
          break;
        case 'End':
          e.preventDefault();
          scrollTarget = maxScroll;
          break;
      }
    });

    // Update screen reader status
    const statusElement = document.getElementById('scroll-status');
    let lastAnnouncedSection = 1;
    
    function updateScreenReaderStatus() {
      const currentSection = Math.round(scrollCurrent / sectionHeight) + 1;
      if (currentSection !== lastAnnouncedSection) {
        statusElement.textContent = `Viewing section ${currentSection} of ${totalSections}`;
        lastAnnouncedSection = currentSection;
      }
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Apply damping based on motion preference
      const damping = prefersReducedMotion ? 1 : baseDamping;
      scrollCurrent += (scrollTarget - scrollCurrent) * damping;
      
      // Update camera position
      camera.position.y = -scrollCurrent;
      
      // Update progress indicator
      const progress = (scrollCurrent / maxScroll) * 100;
      document.querySelector('.scroll-progress-fill').style.height = `${progress}%`;
      
      // Update objects
      objects.forEach((obj) => {
        const distanceFromCamera = Math.abs(obj.mesh.position.y - camera.position.y);
        const scale = Math.max(0.5, 1 - (distanceFromCamera / 15));
        obj.mesh.scale.setScalar(scale);
        
        if (!prefersReducedMotion) {
          obj.mesh.rotation.z += 0.001;
        }
      });
      
      // Update light positions
      pointLight.position.y = camera.position.y + 5;
      pointLight2.position.y = camera.position.y - 5;
      
      // Update screen reader status
      updateScreenReaderStatus();
      
      renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Start animation
    animate();