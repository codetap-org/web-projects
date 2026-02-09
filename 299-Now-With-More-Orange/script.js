const listItems = document.querySelectorAll("li");
listItems.forEach((item) => {
	const colorValue = item.textContent;
	// item.style.color = colorValue;
	item.style.backgroundColor = colorValue;
	item.innerHTML = "";
	item.title = colorValue;

	// item.addEventListener("click", function () {
	// 	alert("You clicked on: " + colorValue);
	// });
	// const tooltipDiv = document.createElement("div");
	// tooltipDiv.className = "tooltip";
	// tooltipDiv.textContent = colorValue;
	// document.body.appendChild(tooltipDiv);
});

function itsorange() {
	console.log("its orange!");
	listItems.forEach((item) => {
		item.classList.toggle("orange");
		// item.style.backgroundColor = "orange";
	});
}