function applyDPRAwareMorphology() {
  const dpr = window.devicePixelRatio || 1;
  const baseErode = 2;
  const baseDilate = 2;

  document.getElementById("erode").setAttribute("radius", baseErode / dpr);
  document.getElementById("dilate").setAttribute("radius", baseDilate / dpr);
}

applyDPRAwareMorphology();

window
  .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
  .addEventListener("change", applyDPRAwareMorphology);