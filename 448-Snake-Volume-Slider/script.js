const selectElement = document.querySelector("input");
const newRangeSVG = document.querySelector("#newRange path");
const svg = document.getElementById("newRange");
const smiley = document.getElementById("smiley");

const pathLength = newRangeSVG.getTotalLength();

// initialize dasharray
newRangeSVG.style.strokeDasharray = pathLength;
newRangeSVG.style.strokeDashoffset = pathLength;

selectElement.addEventListener("input", (event) => {
	const value = event.target.value;
	const percent = value / 100;
	const drawLength = pathLength * percent;

	const point1 = newRangeSVG.getPointAtLength(drawLength);
	const point2 = newRangeSVG.getPointAtLength(drawLength + 1);

	// tangent angle
	const angle =
		Math.atan2(point2.y - point1.y, point2.x - point1.x) * (180 / Math.PI);

	const svgRect = svg.getBoundingClientRect();
	const containerRect = document
		.querySelector(".volume-container")
		.getBoundingClientRect();
	const viewBox = svg.viewBox.baseVal;

	// ratio
	const scale = Math.min(
		svgRect.width / viewBox.width,
		svgRect.height / viewBox.height
	);

	// map SVG coordinates to container coordinates
	let x = point1.x * scale + (svgRect.left - containerRect.left);
	let y = point1.y * scale + (svgRect.top - containerRect.top);

	// adjust Y for stroke thickness
	const strokeWidth = parseFloat(getComputedStyle(newRangeSVG).strokeWidth) || 0;
	y -= (strokeWidth / 2) * scale; // centers on the visible stroke

	smiley.style.transform = `
    translate(${x}px, ${y}px)
    translate(-50%, -50%)
    rotate(${angle}deg)
  `;

	newRangeSVG.style.strokeDashoffset = pathLength - drawLength;
});