const holder = document.querySelector('holder');
const slider = document.querySelector('holder input[type="range"]');
const volumeLevel = document.querySelector('.volume-level');
const tutorial = document.querySelector('.tutorial');

const min = Number(slider.min || 0);
const max = Number(slider.max || 100);

let interval = null;
let direction = 0;
let tutorialTimeout = null;
let tutorialDismissed = false;

const fillMin = 24;
const fillMax = 200;

const updateVolumeLevel = () => {
  const value = Number(slider.value);
  const ratio = (value - min) / (max - min || 1);
  const width = fillMin + ratio * (fillMax - fillMin);

  volumeLevel.textContent = value;
  slider.style.setProperty('--fill-width', `${width}px`);
};

const dismissTutorial = () => {
  if (tutorialDismissed) return;
  tutorialDismissed = true;
  tutorial.classList.add('is-hidden');
};

const scheduleTutorialFade = () => {
  clearTimeout(tutorialTimeout);
  tutorialTimeout = setTimeout(dismissTutorial, 3200);
};

const startChanging = () => {
  if (interval) return;

  interval = setInterval(() => {
    const current = Number(slider.value);
    const next = current + direction;

    slider.value = Math.max(min, Math.min(max, next));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, 240);
};

const stopChanging = () => {
  clearInterval(interval);
  interval = null;
  direction = 0;
  holder.style.transform = 'rotate(0deg)';
};

holder.addEventListener('mousemove', (e) => {
  const rect = holder.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const midpoint = rect.width / 2;

  if (x < midpoint) {
    direction = -1;
    holder.style.transform = 'rotate(-30deg)';
  } else {
    direction = 1;
    holder.style.transform = 'rotate(30deg)';
  }

  dismissTutorial();
  startChanging();
});

holder.addEventListener('mouseenter', dismissTutorial);
holder.addEventListener('mouseleave', stopChanging);
slider.addEventListener('input', updateVolumeLevel);

updateVolumeLevel();
scheduleTutorialFade();