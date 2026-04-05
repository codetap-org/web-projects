console.clear();

const el = document.querySelector('[data-digit]');
let current = 9;

setInterval(() => {
  if (current < 0) { current = 9; }
  el.dataset.digit = current--;
}, 1000);