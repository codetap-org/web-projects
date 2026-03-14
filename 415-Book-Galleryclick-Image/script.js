const items = document.querySelectorAll(".galeria-book-3d__item");
const container = document.querySelector(".galeria-book-3d");

function updateContainerState() {
	const anyOpen = Array.from(items).some((item) =>
																				 item.classList.contains("is-open")
																				);
	if (anyOpen) {
		container.classList.add("book-open");
	} else {
		container.classList.remove("book-open");
	}
}

items.forEach((item) => {
	item.addEventListener("click", (e) => {
		e.stopPropagation();
		item.classList.toggle("is-open");
		updateContainerState();
	});
});

document.addEventListener("click", () => {
	items.forEach((item) => {
		item.classList.remove("is-open");
	});
	updateContainerState();
});