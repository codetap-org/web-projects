const degInput = document.getElementById("deg");
const cssImg = document.querySelector(".css");
const degValue = document.getElementById("deg-value");
const shadowXValue = document.getElementById("shadow-x-value");
const shadowYValue = document.getElementById("shadow-y-value");

const formatPixels = (value) => {
  const rounded = Math.abs(value) < 0.00005 ? 0 : value;
  return `${Number(rounded.toFixed(4))}px`;
};

const readShadowOffsetsFromFilter = () => {
  const filterValue = getComputedStyle(cssImg).filter;

  const start = filterValue.toLowerCase().indexOf("drop-shadow(");
  if (start === -1) {
    return { x: 0, y: 0 };
  }

  const contentStart = start + "drop-shadow(".length;
  let depth = 1;
  let end = contentStart;

  while (end < filterValue.length && depth > 0) {
    const char = filterValue[end];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    end += 1;
  }

  const dropShadowContent = filterValue.slice(contentStart, end - 1);
  const pxValues = Array.from(dropShadowContent.matchAll(/-?\d*\.?\d+px/g)).map(
    (match) => Number.parseFloat(match[0]),
  );

  return {
    x: pxValues[0] ?? 0,
    y: pxValues[1] ?? 0,
  };
};

const updateAngle = (angle) => {
  const percentage =
    ((angle - degInput.min) / (degInput.max - degInput.min)) * 100;

  cssImg.style.setProperty("--angle", `${angle}deg`);

  const { x, y } = readShadowOffsetsFromFilter();

  degInput.style.setProperty("--range-progress", `${percentage}%`);
  degValue.value = `${angle}deg`;
  degValue.textContent = `${angle}deg`;
  shadowXValue.textContent = formatPixels(x);
  shadowYValue.textContent = formatPixels(y);
};

degInput.addEventListener("input", (e) => {
  updateAngle(Number(e.target.value));
});

updateAngle(Number(degInput.value));