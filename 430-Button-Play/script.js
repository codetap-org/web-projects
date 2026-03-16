const buttons = document.querySelectorAll(".btn");

buttons.forEach(button => {
  const type = button.dataset.type;

  button.addEventListener("mousemove", e => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = x / rect.width * 100;
    const yPercent = y / rect.height * 100;

    if (type === "magnetic") {
      // Use pixel values for magnetic effects
      button.style.setProperty("--x", `${x}px`);
      button.style.setProperty("--y", `${y}px`);
    } else if (type === "gradient") {
      // Calculate angle based on position
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      button.style.setProperty("--angle", `${angle}deg`);
      button.style.setProperty("--x", `${xPercent}%`);
      button.style.setProperty("--y", `${yPercent}%`);
    } else if (type === "tilt") {
      // 3D tilt effect
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -10;
      const rotateY = (x - centerX) / centerX * 10;
      button.style.setProperty("--rx", rotateY);
      button.style.setProperty("--ry", rotateX);
      button.style.setProperty("--x", `${xPercent}%`);
      button.style.setProperty("--y", `${yPercent}%`);
    } else {
      // Default percentage-based positioning
      button.style.setProperty("--x", `${xPercent}%`);
      button.style.setProperty("--y", `${yPercent}%`);
    }
  });

  button.addEventListener("mouseleave", () => {
    if (type === "tilt") {
      button.style.setProperty("--rx", "0");
      button.style.setProperty("--ry", "0");
    }
  });
});