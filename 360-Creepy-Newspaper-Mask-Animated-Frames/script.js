window.addEventListener("mousemove", (e) => {
  document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
  document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
});

document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_FRAMES = 16;
  const MIDDLE_FRAME_INDEX = 7;
  const imgEl = document.querySelector(".news__image__img");
  const body = document.body;
  let currentFrameIndex = MIDDLE_FRAME_INDEX;

  const framePaths = [
    "https://domare.hernandack.com/uploads/e6c52ba2a920c7077f86a29968ea6048.jpg",
    "https://domare.hernandack.com/uploads/cdae3e551068e691d1611cafacafe82f.jpg",
    "https://domare.hernandack.com/uploads/0612106a96575d57696cbe1001f1f927.jpg",
    "https://domare.hernandack.com/uploads/1fd3050061ea42a3cb00383f9b495181.jpg",
    "https://domare.hernandack.com/uploads/f6d5bb30374f8e98fd069ed4d42aab8c.jpg",
    "https://domare.hernandack.com/uploads/b77107104899b4ad77b25b860f103ffe.jpg",
    "https://domare.hernandack.com/uploads/c486df566d47f5ccdf583d445d379723.jpg",
    "https://domare.hernandack.com/uploads/3d6f365831959b3a16c8df2fe9fb3a02.jpg",
    "https://domare.hernandack.com/uploads/4e3619f87a486b9545e5c1bbea474632.jpg",
    "https://domare.hernandack.com/uploads/ecd82200b3d85c415fb5b262526ace1f.jpg",
    "https://domare.hernandack.com/uploads/b09bd9f4b075251be22cc18d4b962b9b.jpg",
    "https://domare.hernandack.com/uploads/2b5e0fac4e4b05d7d4c5dfebed77d3bb.jpg",
    "https://domare.hernandack.com/uploads/82766f39a3f49e343ba4a25d809d570d.jpg",
    "https://domare.hernandack.com/uploads/f8afe7c59e7da4723700a20695de5c11.jpg",
    "https://domare.hernandack.com/uploads/4283373cb20ca0f85fde8a1c00f57427.jpg",
    "https://domare.hernandack.com/uploads/f62dffd1ff65d092ad19ecf01c4d8afc.jpg",
  ];

  function preloadImages() {
    console.log("Preloading frames...");
    const promises = framePaths.map((path) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.onload = resolve;
        img.onerror = reject;
      });
    });
    return Promise.all(promises);
  }

  function updateFrame(newIndex) {
    if (newIndex === currentFrameIndex) {
      return;
    }
    imgEl.src = framePaths[newIndex];
    currentFrameIndex = newIndex;
  }

  function handleMouseMove(e) {
    const percentX = e.clientX / window.innerWidth;

    let targetIndex;

    if (percentX >= 0.5) {
      const percentRight = (percentX - 0.5) * 2;
      const framesInRightHalf = TOTAL_FRAMES - 1 - MIDDLE_FRAME_INDEX;
      const offset = Math.round(percentRight * framesInRightHalf);
      targetIndex = MIDDLE_FRAME_INDEX + offset;
    } else {
      const percentLeft = percentX * 2;
      targetIndex = Math.round(percentLeft * MIDDLE_FRAME_INDEX);
    }

    updateFrame(targetIndex);
  }

  // --- Initialization ---

  async function main() {
    if (framePaths.length !== TOTAL_FRAMES) {
      console.error(
        `Error: TOTAL_FRAMES is ${TOTAL_FRAMES} but framePaths array only has ${framePaths.length} items.`
      );
      return;
    }

    imgEl.src = framePaths[MIDDLE_FRAME_INDEX];

    try {
      await preloadImages();
      body.addEventListener("mousemove", handleMouseMove);
    } catch (err) {
      console.error("Failed to preload images:", err);
    }
  }

  main();
});