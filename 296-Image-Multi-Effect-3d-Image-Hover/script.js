const debounce = (fn, d) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, a), d);
  };
};

function initImageHover() {
  const container = document.querySelector("[data-image-hover]");
  const rawLayers = Array.from(container.querySelectorAll(".image-layer"));
  let stackEl = document.createElement("div");
  stackEl.className = "image-stack";
  container.appendChild(stackEl);
  rawLayers.forEach((l) => stackEl.appendChild(l));
  const layers = Array.from(stackEl.querySelectorAll(".image-layer"));

  const duration = 0.8,
    ease = "power2.inOut",
    scaleInterval = 0.06,
    opacityInterval = 0.05,
    rotationInterval = 15;
  const blurSeq = [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 1.0, 1.3, 1.6];
  const stagger = 0.1,
    followStrength = 0.15;

  let cssVarCache = {
    depthStep: 36,
    scale3D: 0.07,
    tiltMax: 45,
    panMax: 88,
    opacityFalloff: 0.1,
    moveAmplify: 0.54,
    tiltBoost: 1.25,
    panBoost: 1.25
  };

  const updateCSSCache = () => {
    const css = getComputedStyle(document.documentElement);
    cssVarCache.depthStep =
      parseFloat(css.getPropertyValue("--depth-step")) || 36;
    cssVarCache.scale3D =
      parseFloat(css.getPropertyValue("--scale-3d")) || 0.07;
    cssVarCache.tiltMax = parseFloat(css.getPropertyValue("--tilt-max")) || 45;
    cssVarCache.panMax = parseFloat(css.getPropertyValue("--pan-max")) || 88;
    cssVarCache.opacityFalloff =
      parseFloat(css.getPropertyValue("--opacity-falloff")) || 0.1;
    cssVarCache.moveAmplify =
      parseFloat(css.getPropertyValue("--move-amplify")) || 0.54;
    cssVarCache.tiltBoost =
      parseFloat(css.getPropertyValue("--tilt-boost")) || 1.25;
    cssVarCache.panBoost =
      parseFloat(css.getPropertyValue("--pan-boost")) || 1.25;
  };
  updateCSSCache();

  let timeline = null,
    isTransitioning = false,
    isParallax = false,
    isOpacity = false,
    isRotation = false,
    isBlur = false,
    isColor = false,
    is3D = false,
    isHovered = false;
  let rect = container.getBoundingClientRect();

  let rafId = null;
  let pendingMouseEvent = null;

  window.addEventListener(
    "resize",
    debounce(() => {
      rect = container.getBoundingClientRect();
    }, 50)
  );

  const quickTos = layers
    .map((layer, i) => {
      if (i === 0) return null;
      const sv = 1 - scaleInterval * i;
      const mult = sv > 0 ? (1 - sv) * 3 + 0.2 : 1;
      return {
        layer,
        mult,
        xTo: gsap.quickTo(layer, "x", {
          duration: 0.6,
          ease: "power3"
        }),
        yTo: gsap.quickTo(layer, "y", {
          duration: 0.6,
          ease: "power3"
        })
      };
    })
    .filter(Boolean);

  const getScale = (i) => Math.max(1 - scaleInterval * i, 0);
  const getOpacity = (i) =>
    !isOpacity ? 1 : Math.max(1 - opacityInterval * i, 0.1);
  const getRotVal = (i) => rotationInterval * i * (i % 2 === 0 ? 1 : -1);
  const getBlur = (i) =>
    !isBlur || i === 0 ? 0 : blurSeq[Math.min(i, blurSeq.length - 1)];
  const getColor = (i) => {
    if (!isColor) return "none";
    if (i === 0) return "grayscale(1)";
    const ci = Math.min(i * 0.15, 1),
      sat = 1 + ci * 0.5;
    return `grayscale(${1 - ci}) saturate(${sat})`;
  };

  function applyFilters() {
    layers.forEach((l, i) => {
      const b = getBlur(i),
        c = getColor(i);
      let f = "";
      if (b > 0) f += `blur(${b}px) `;
      if (c !== "none") f += c;
      l.style.filter = f.trim() || "none";
    });
  }

  function reset2D() {
    gsap.killTweensOf(stackEl);
    gsap.set(layers, {
      scale: (i, t) => (t === layers[0] ? 1 : 0.95),
      opacity: (i, t) => (t === layers[0] ? 1 : 0),
      rotation: 0,
      rotationZ: 0,
      x: 0,
      y: 0,
      z: 0
    });
    layers.forEach((l) => (l.style.filter = "none"));
    gsap.set(stackEl, {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      x: 0,
      y: 0,
      z: 0,
      scale: 1
    });
  }

  function createTimeline() {
    if (timeline) timeline.kill();
    const rev = [...layers].reverse();
    timeline = gsap
      .timeline({
        paused: true
      })
      .to(rev, {
        scale: (i, t) => {
          const idx = layers.indexOf(t);
          return getScale(idx);
        },
        opacity: (i, t) => {
          const idx = layers.indexOf(t);
          return idx === 0 ? 1 : getOpacity(idx);
        },
        rotation: (i, t) => {
          if (!isRotation) return 0;
          const idx = layers.indexOf(t);
          return getRotVal(idx);
        },
        duration,
        ease,
        stagger
      });
    applyFilters();
  }

  function applyShape(shape) {
    layers.forEach((l, i) => {
      if (i === 0) return;
      l.classList.remove("rectangle", "circle", "diamond", "hexagon");
      l.classList.add(shape);
    });
  }

  function center2D() {
    quickTos.forEach(({ layer }) =>
      gsap.to(layer, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      })
    );
  }

  function compute3DOpacity(i) {
    const base = Math.max(1 - cssVarCache.opacityFalloff * i, 0.25);
    return isOpacity ? Math.max(base - opacityInterval * i, 0.1) : base;
  }

  function layout3D(depthFactor = 1) {
    const depth = cssVarCache.depthStep * depthFactor;
    layers.forEach((l, i) => {
      const z = Math.round(i * depth) + i * 0.1;
      const s = Math.max(1 - i * cssVarCache.scale3D, 0.35);
      const o = compute3DOpacity(i);
      const rotZ = isRotation ? getRotVal(i) : 0;
      l.style.transform = `translateZ(${z}px) scale(${s}) rotateZ(${rotZ}deg)`;
      l.style.opacity = o;
    });
    applyFilters();
  }

  function pose3DFlat() {
    gsap.to(stackEl, {
      rotationX: 0,
      rotationY: 0,
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  }

  function center3D() {
    gsap.to(stackEl, {
      rotationX: 0,
      rotationY: 0,
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    });
  }

  function enable3D() {
    is3D = true;
    if (timeline) timeline.pause(0);
    const rev = [...layers].reverse();
    gsap.to(rev, {
      scale: (i, t) => {
        const idx = layers.indexOf(t);
        if (idx === 0) return 1;
        return Math.max(1 - idx * cssVarCache.scale3D, 0.35);
      },
      opacity: (i, t) => {
        const idx = layers.indexOf(t);
        return idx === 0 ? 1 : compute3DOpacity(idx);
      },
      duration: duration,
      ease: ease,
      stagger: stagger,
      onComplete: () => {
        layout3D();
        if (isHovered) {
          container.classList.add("is-3d");
          pose3DFlat();
        }
      }
    });
  }

  function disable3D() {
    is3D = false;
    container.classList.remove("is-3d");
    gsap.killTweensOf(stackEl);
    gsap.to(stackEl, {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      duration: 0.28,
      ease: "power2.out"
    });
    const rev = [...layers].reverse();
    gsap.to(rev, {
      scale: (i, t) => {
        const idx = layers.indexOf(t);
        return idx === 0 ? 1 : 0.95;
      },
      opacity: (i, t) => {
        const idx = layers.indexOf(t);
        return idx === 0 ? 1 : 0;
      },
      rotation: 0,
      duration: duration,
      ease: ease,
      stagger: -stagger,
      onComplete: () => {
        layers.forEach((l) => (l.style.transform = ""));
        reset2D();
        createTimeline();
      }
    });
  }

  function tiltPan(e) {
    if (!is3D || !isHovered) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    const d = Math.min(1, Math.hypot(nx, ny));
    const depthFactor = 0.9 + d * 0.2;
    layout3D(depthFactor);

    const tilt =
      cssVarCache.tiltMax * cssVarCache.tiltBoost * cssVarCache.moveAmplify;
    const pan =
      cssVarCache.panMax * cssVarCache.panBoost * cssVarCache.moveAmplify;

    gsap.to(stackEl, {
      rotationY: nx * tilt,
      rotationX: -ny * tilt,
      x: nx * pan,
      y: ny * pan,
      scale: 1,
      duration: 0.18,
      ease: "power2.out"
    });
  }

  function onEnter() {
    isHovered = true;
    if (is3D) {
      container.classList.add("is-3d");
      layout3D();
      pose3DFlat();
    } else if (timeline) {
      timeline.play();
    }
  }

  function onLeave() {
    isHovered = false;
    if (is3D) {
      center3D();
      container.classList.remove("is-3d");
    } else if (timeline && !isParallax) {
      timeline.reverse();
    }
    if (isParallax) {
      center2D();
    }
    setTimeout(() => {
      if (!isHovered && !is3D && !isParallax) {
        center2D();
      }
    }, duration * 1000);
  }

  function onMove(e) {
    pendingMouseEvent = e;
    if (!rafId) {
      rafId = requestAnimationFrame(processMouseMove);
    }
  }

  function processMouseMove() {
    if (!pendingMouseEvent) {
      rafId = null;
      return;
    }

    const e = pendingMouseEvent;
    pendingMouseEvent = null;
    rafId = null;

    if (is3D) {
      const isInsideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.left + rect.width &&
        e.clientY >= rect.top &&
        e.clientY <= rect.top + rect.height;
      if (isInsideCanvas) {
        tiltPan(e);
      } else {
        center3D();
      }
      return;
    }
    if (!isParallax || !isHovered) return;
    const rx = (e.clientX - rect.left) / rect.width - 0.5,
      ry = (e.clientY - rect.top) / rect.height - 0.5;
    quickTos.forEach(({ xTo, yTo, mult }) => {
      xTo(rx * 2 * rect.width * followStrength * mult);
      yTo(ry * 2 * rect.height * followStrength * mult);
    });
  }

  document.addEventListener("mousemove", onMove);
  container.addEventListener("mouseenter", onEnter);
  container.addEventListener("mouseleave", onLeave);

  container._changeShape = (shape) => {
    if (isTransitioning) return;
    isTransitioning = true;
    if (timeline) timeline.pause();
    reset2D();
    applyShape(shape);
    createTimeline();
    isTransitioning = false;
    if (is3D) layout3D();
  };

  container._toggleRotation = (v) => {
    isRotation = v;
    if (is3D) {
      layout3D();
    } else {
      // If turning rotation OFF, immediately clear all rotations
      if (!isRotation) {
        layers.forEach((l) => {
          gsap.set(l, { rotation: 0 });
        });
      }
      // Recreate timeline with new rotation setting
      if (timeline) timeline.kill();
      createTimeline();
      // Match current hover state
      if (isHovered) {
        timeline.progress(1); // Jump to hovered state
      } else {
        timeline.progress(0); // Jump to rest state
      }
    }
  };

  container._toggleBlur = (v) => {
    isBlur = v;
    applyFilters();
    if (is3D) {
      layout3D();
    }
  };

  container._toggleColor = (v) => {
    isColor = v;
    applyFilters();
    if (is3D) {
      layout3D();
    }
  };

  container._toggleOpacity = (v) => {
    isOpacity = v;
    if (is3D) {
      layout3D();
    } else {
      // Recreate timeline with new opacity setting
      if (timeline) timeline.kill();
      createTimeline();
      // Match current hover state
      if (isHovered) {
        timeline.progress(1); // Jump to hovered state
      } else {
        timeline.progress(0); // Jump to rest state
      }
    }
  };

  container._toggleParallax = (v) => {
    isParallax = v;
    if (!isParallax) {
      // Reset parallax positions
      center2D();
      // Restore timeline state based on hover
      if (timeline) {
        if (isHovered) {
          timeline.play();
        } else {
          timeline.reverse();
        }
      }
    }
  };

  container._toggle3D = (v) => {
    v ? enable3D() : disable3D();
  };

  container._updateCSSCache = updateCSSCache;

  reset2D();
  createTimeline();
}

function initShapeControls() {
  const cc = document.querySelector("[data-shape-controls]");
  if (!cc) return;
  const buttons = cc.querySelectorAll("[data-shape]");
  const img = document.querySelector("[data-image-hover]");
  if (!img || !img._changeShape || cc._shapeControlsInit) return;
  cc._shapeControlsInit = true;
  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      buttons.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      img._changeShape(b.dataset.shape);
    });
  });
}

function initToggleControls() {
  const img = document.querySelector("[data-image-hover]");
  if (!img) return;
  const parallaxBtn = document.querySelector("[data-parallax-toggle]");
  const btn3d = document.querySelector("[data-3d-toggle]");
  const settings3d = document.getElementById("settings3d");

  const toggles = [
    {
      selector: "[data-rotation-toggle]",
      method: "_toggleRotation",
      name: "rotation"
    },
    {
      selector: "[data-blur-toggle]",
      method: "_toggleBlur",
      name: "blur"
    },
    {
      selector: "[data-color-toggle]",
      method: "_toggleColor",
      name: "color"
    },
    {
      selector: "[data-opacity-toggle]",
      method: "_toggleOpacity",
      name: "opacity"
    },
    {
      selector: "[data-parallax-toggle]",
      method: "_toggleParallax",
      name: "parallax"
    },
    {
      selector: "[data-3d-toggle]",
      method: "_toggle3D",
      name: "3d"
    }
  ];

  toggles.forEach(({ selector, method, name }) => {
    const t = document.querySelector(selector);
    if (t && !t._init && img[method]) {
      t._init = true;
      t.addEventListener("click", () => {
        // Check current state from DOM, not local variable
        const isCurrentlyOn = t.classList.contains("active");
        const willBeOn = !isCurrentlyOn;

        // Handle mutual exclusivity ONLY when turning ON
        if (willBeOn) {
          if (name === "parallax" && btn3d.classList.contains("active")) {
            // Turning parallax ON - turn 3D OFF first
            btn3d.classList.remove("active");
            btn3d.textContent = "3d";
            img._toggle3D(false);
            settings3d.classList.remove("active");
          } else if (
            name === "3d" &&
            parallaxBtn.classList.contains("active")
          ) {
            // Turning 3D ON - turn parallax OFF first
            parallaxBtn.classList.remove("active");
            parallaxBtn.textContent = "parallax";
            img._toggleParallax(false);
          }
        }

        // Toggle the button state
        t.classList.toggle("active");
        const nowOn = t.classList.contains("active");
        t.textContent = nowOn ? `${name} on` : name.toLowerCase();
        img[method](nowOn);

        // Handle 3D settings panel
        if (name === "3d") {
          settings3d.classList.toggle("active", nowOn);
        }
      });
    }
  });
}

function initLiveTuner() {
  const img = document.querySelector("[data-image-hover]");
  const tiltR = document.getElementById("tiltRange");
  const panR = document.getElementById("panRange");
  const depthR = document.getElementById("depthRange");
  const ampR = document.getElementById("ampRange");
  const tiltV = document.getElementById("tiltVal");
  const panV = document.getElementById("panVal");
  const depthV = document.getElementById("depthVal");
  const ampV = document.getElementById("ampVal");

  const formatValue = (val, type) => {
    if (type === "amp") {
      return (val / 100).toFixed(2);
    }
    return String(val).padStart(3, " ");
  };

  const css = getComputedStyle(document.documentElement);
  const setFromVar = (el, varName, fallback) => {
    const v = parseFloat(css.getPropertyValue(varName)) || fallback;
    if (varName === "--move-amplify") {
      el.value = Math.round(v * 100);
      return Math.round(v * 100);
    }
    el.value = v;
    return v;
  };

  let tilt = setFromVar(tiltR, "--tilt-max", 45);
  tiltV.textContent = formatValue(tilt, "tilt");
  let pan = setFromVar(panR, "--pan-max", 88);
  panV.textContent = formatValue(pan, "pan");
  let depth = setFromVar(depthR, "--depth-step", 36);
  depthV.textContent = formatValue(depth, "depth");
  let amp = setFromVar(ampR, "--move-amplify", 54);
  ampV.textContent = formatValue(amp, "amp");

  const applyVar = (name, val) => {
    const unit =
      name.includes("pan-max") || name.includes("depth-step") ? "px" : "";
    document.documentElement.style.setProperty(name, String(val) + unit);
    if (img && img._updateCSSCache) {
      img._updateCSSCache();
    }
  };

  tiltR.addEventListener("input", (e) => {
    tilt = +e.target.value;
    tiltV.textContent = formatValue(tilt, "tilt");
    applyVar("--tilt-max", tilt);
  });
  panR.addEventListener("input", (e) => {
    pan = +e.target.value;
    panV.textContent = formatValue(pan, "pan");
    applyVar("--pan-max", pan);
  });
  depthR.addEventListener("input", (e) => {
    depth = +e.target.value;
    depthV.textContent = formatValue(depth, "depth");
    applyVar("--depth-step", depth);
  });
  ampR.addEventListener("input", (e) => {
    amp = +e.target.value;
    ampV.textContent = formatValue(amp, "amp");
    applyVar("--move-amplify", amp / 100);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initImageHover();
  initShapeControls();
  initToggleControls();
  initLiveTuner();
});