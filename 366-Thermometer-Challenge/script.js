const slider = document.getElementById('thermometer-slider');

const updateLabel = () => {
  const label = document.querySelector(`[for="${slider.id}"]`);
  label.textContent = `${slider.value}°C`;
  label.dataset.bg = (2 * parseInt(slider.value)) + 95;
}

slider.addEventListener('input', updateLabel);

document.addEventListener('wheel', (e) => {
  if(e.deltaY < 0) slider.value = parseInt(slider.value) + 1;
  else if (e.deltaY > 0) slider.value = parseInt(slider.value) - 1;
  updateLabel();
})