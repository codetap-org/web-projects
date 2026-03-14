// Fallback for FireFox lack of sibling-index() & sibling-count() support. One day, maybe.

const waves = document.querySelectorAll(".wave");

waves.forEach((wave) => {
    const dots = wave.querySelectorAll("i");
    dots.forEach((el, i) => {
        el.style.setProperty("--sibling-index", i);
        el.style.setProperty("--sibling-count", dots.length);
    });
});