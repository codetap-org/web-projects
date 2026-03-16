(function () {
	const container = document.getElementById("svgContainer");
	const svg = document.getElementById("interactiveSvg");
	const image = document.getElementById("mainImage");
	const circleImage = document.getElementById("interactiveImage");

	const paths = [
		document.getElementById("path0"),
		document.getElementById("path1")
	];

	const cursors = [
		document.getElementById("cursor0"),
		document.getElementById("cursor1")
	];

	let selectedCursor = null;
	let isDragging = false;
	let dragStartX = 0;
	let initialRatio = 0;

	const pathLengths = paths.map((p) => p.getTotalLength());
	console.log("&Toc on codepen - https://codepen.io/ol-ivier");

	function getBaseSize() {
		const width = window.innerWidth;
		if (width < 768) return { cursor: 24, image: 120 };
		if (width < 1024) return { cursor: 32, image: 180 };
		return { cursor: 48, image: 440 };
	}

	function getCursorSizes() {
		const base = getBaseSize().cursor;
		return {
			MIN_SIZE: base,
			MAX_SIZE: base * 2,
			MIN_FONT: Math.max(12, Math.round(base * 0.4)),
			MAX_FONT: Math.max(18, Math.round(base * 0.6))
		};
	}

	function updateImageSize() {
		const sizes = getBaseSize();
		circleImage.style.width = sizes.image + "px";
		circleImage.style.height = sizes.image + "px";
	}

	updateImageSize();

	const INITIAL_HUE_PERCENT = 90;
	const INITIAL_ROTATE_PERCENT = 50;

	function setCursorByRatio(index, ratio) {
		ratio = Math.min(0.5, Math.max(0, ratio));

		try {
			const pathLength = pathLengths[index];

			let pathRatio;
			if (index === 0) {
				pathRatio = ratio;
			} else {
				pathRatio = 0.5 - ratio;
			}

			const point = paths[index].getPointAtLength(pathRatio * pathLength);

			const svgPoint = svg.createSVGPoint();
			svgPoint.x = point.x;
			svgPoint.y = point.y;
			const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM());

			const containerRect = container.getBoundingClientRect();
			const cursorX = screenPoint.x - containerRect.left;
			const cursorY = screenPoint.y - containerRect.top;

			cursors[index].style.left = cursorX + "px";
			cursors[index].style.top = cursorY + "px";

			const displayPercent = Math.round((ratio / 0.5) * 100);
			cursors[index].innerText = displayPercent;

			const cursorSizes = getCursorSizes();
			const progress = ratio / 0.5;
			const size =
				cursorSizes.MIN_SIZE +
				(cursorSizes.MAX_SIZE - cursorSizes.MIN_SIZE) * progress;
			const fontSize =
				cursorSizes.MIN_FONT +
				(cursorSizes.MAX_FONT - cursorSizes.MIN_FONT) * progress;

			cursors[index].style.width = size + "px";
			cursors[index].style.height = size + "px";
			cursors[index].style.fontSize = fontSize + "px";

			updateImageEffects();
		} catch (e) {}
	}

	function updateImageEffects() {
		try {
			const value0 = parseInt(cursors[0].innerText);
			const value1 = parseInt(cursors[1].innerText);

			const hueRotate = Math.round((value0 / 100) * 360);
			const rotate = Math.round((value1 / 100) * 180 - 90);

			image.style.filter = `hue-rotate(${hueRotate}deg)`;
			image.style.transform = `rotate(${rotate}deg)`;
		} catch (e) {}
	}

	function getCurrentCursorScreenX(index) {
		const left = parseFloat(cursors[index].style.left);
		if (isNaN(left)) return null;
		const containerRect = container.getBoundingClientRect();
		return left + containerRect.left + parseFloat(cursors[index].style.width) / 2;
	}

	function findClosestCursor(clientX, clientY) {
		let minDist = Infinity;
		let closestIndex = null;

		for (let i = 0; i < cursors.length; i++) {
			const left = parseFloat(cursors[i].style.left);
			const top = parseFloat(cursors[i].style.top);

			if (isNaN(left) || isNaN(top)) continue;

			const containerRect = container.getBoundingClientRect();
			const cursorScreenX =
				left + containerRect.left + parseFloat(cursors[i].style.width) / 2;
			const cursorScreenY =
				top + containerRect.top + parseFloat(cursors[i].style.height) / 2;

			const dx = clientX - cursorScreenX;
			const dy = clientY - cursorScreenY;
			const dist = Math.sqrt(dx * dx + dy * dy);

			const currentSize =
				parseFloat(cursors[i].style.width) || getCursorSizes().MAX_SIZE;
			const threshold = Math.max(40, currentSize * 1.5);

			if (dist < threshold && dist < minDist) {
				minDist = dist;
				closestIndex = i;
			}
		}
		return closestIndex;
	}

	function onDragStart(e) {
		e.preventDefault();
		let clientX = e.touches ? e.touches[0].clientX : e.clientX;
		let clientY = e.touches ? e.touches[0].clientY : e.clientY;

		const svgRect = svg.getBoundingClientRect();
		if (clientX < svgRect.left - 20 || clientX > svgRect.right + 20) return;

		const closestIndex = findClosestCursor(clientX, clientY);

		if (closestIndex !== null) {
			selectedCursor = closestIndex;
			isDragging = true;

			dragStartX = clientX;

			const currentValue = parseInt(cursors[selectedCursor].innerText) / 100;
			initialRatio = currentValue * 0.5;

			container.classList.add("dragging");

			cursors.forEach((c, i) => {
				if (i === selectedCursor) {
					c.classList.add("selected");
				} else {
					c.classList.remove("selected");
				}
			});

			window.addEventListener("mousemove", onDragMove);
			window.addEventListener("touchmove", onDragMove, { passive: false });
			window.addEventListener("mouseup", onDragEnd);
			window.addEventListener("touchend", onDragEnd);
		}
	}

	function onDragMove(e) {
		if (!isDragging || selectedCursor === null) return;
		e.preventDefault();
		let clientX = e.touches ? e.touches[0].clientX : e.clientX;

		const deltaX = clientX - dragStartX;
		const svgRect = svg.getBoundingClientRect();
		const deltaRatio = (deltaX / svgRect.width) * 0.5;

		let newRatio = initialRatio + deltaRatio;
		newRatio = Math.min(0.5, Math.max(0, newRatio));

		setCursorByRatio(selectedCursor, newRatio);
	}

	function onDragEnd() {
		if (isDragging) {
			isDragging = false;
			selectedCursor = null;
			container.classList.remove("dragging");

			cursors.forEach((c) => c.classList.remove("selected"));

			window.removeEventListener("mousemove", onDragMove);
			window.removeEventListener("touchmove", onDragMove);
			window.removeEventListener("mouseup", onDragEnd);
			window.removeEventListener("touchend", onDragEnd);
		}
	}

	container.addEventListener("mousedown", onDragStart);
	container.addEventListener("touchstart", onDragStart, { passive: false });
	svg.addEventListener("dragstart", (e) => e.preventDefault());

	window.addEventListener("resize", () => {
		updateImageSize();

		for (let i = 0; i < 2; i++) {
			const currentValue = parseInt(cursors[i].innerText) / 100;
			if (!isNaN(currentValue)) {
				setCursorByRatio(i, currentValue * 0.5);
			} else {
				setCursorByRatio(i, 0.25);
			}
		}
	});

	setTimeout(() => {
		const hueRatio = (INITIAL_HUE_PERCENT / 100) * 0.5;
		setCursorByRatio(0, hueRatio);

		const rotateRatio = (INITIAL_ROTATE_PERCENT / 100) * 0.5;
		setCursorByRatio(1, rotateRatio);
	}, 30);
})();