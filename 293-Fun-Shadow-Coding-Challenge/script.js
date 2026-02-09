const box = document.querySelector(".shadow-pal");
box.style.setProperty("--start", box.offsetTop);
box.style.setProperty("--end", box.offsetTop + box.offsetHeight);

document.addEventListener("mousemove", (e) => {
  // Update the custom properties with the current cursor coordinates
  document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
  document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
});