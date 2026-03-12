const container = document.getElementById('container');
const dragger = document.getElementById('dragger');
let isDragging = false;

const updatePos = (e) => {
  if (!isDragging) return;
  const rect = container.getBoundingClientRect();
  const x = (e.pageX || (e.touches ? e.touches[0].pageX : 0)) - rect.left;
  let percent = (x / rect.width) * 100;
  percent = Math.max(0, Math.min(100, percent));
  container.style.setProperty('--pos', `${percent}%`);
};

dragger.addEventListener('mousedown', () => isDragging = true);
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', updatePos);

dragger.addEventListener('touchstart', () => isDragging = true);
window.addEventListener('touchend', () => isDragging = false);
window.addEventListener('touchmove', updatePos);