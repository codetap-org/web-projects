class ImageMosaic {
	constructor() {
		this.image = null;
		this.imageUrl =
			"https://images.unsplash.com/photo-1681759744587-7b62d82f8d70?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0";
		this.tileCount = 25;
		this.defaultImageLoaded = !1;
		this.controlsVisible = !1;
		this.currentAction = "pop";
		this.initElements();
		this.initEventListeners();
		this.loadDefaultImage();
		console.log("&Toc on codepen - https://codepen.io/ol-ivier");
	}
	initElements() {
		this.imageInput = document.getElementById("imageInput");
		this.tileSlider = document.getElementById("tileSlider");
		this.mosaic = document.getElementById("mosaic");
		this.errorMessage = document.getElementById("errorMessage");
		this.resetBtn = document.getElementById("resetBtn");
		this.toggleBtn = document.getElementById("toggleControls");
		this.floatingControls = document.getElementById("floatingControls");
		this.container = document.getElementById("container");
		this.resetInteractionsBtn = document.getElementById("resetInteractionsBtn");
	}
	initEventListeners() {
		this.imageInput.addEventListener("change", (e) => this.handleImageUpload(e));
		this.tileSlider.addEventListener("input", (e) => this.handleTileChange(e));
		this.resetBtn.addEventListener("click", () => this.resetToDefault());
		this.toggleBtn.addEventListener("click", () => this.toggleControls());
		this.resetInteractionsBtn.addEventListener("click", () =>
			this.resetAllTiles()
		);
		document.querySelectorAll(".interaction-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				document
					.querySelectorAll(".interaction-btn")
					.forEach((b) => b.classList.remove("active"));
				e.target.classList.add("active");
				this.currentAction = e.target.dataset.action;
			});
		});
		window.addEventListener("resize", () => {
			if (this.defaultImageLoaded) this.createMosaic();
		});
	}
	toggleControls() {
		this.controlsVisible = !this.controlsVisible;
		this.floatingControls.classList.toggle("hidden", !this.controlsVisible);
		this.toggleBtn.classList.toggle("hidden", !this.controlsVisible);
	}
	loadDefaultImage() {
		this.image = new Image();
		this.image.crossOrigin = "anonymous";
		this.image.onload = () => {
			this.defaultImageLoaded = !0;
			this.createMosaic();
		};
		this.image.onerror = () => {
			this.useFallbackImage();
		};
		this.image.src = this.imageUrl;
	}
	useFallbackImage() {
		this.imageUrl =
			"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzJjM2U1MCIvPjxjaXJjbGUgY3g9IjI1MCIgY3k9IjI1MCIgcj0iMTUwIiBmaWxsPSIjMzQ5OGRiIi8+PHRleHQgeD0iMjUwIiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNsYXF1ZXMhPC90ZXh0Pjwvc3ZnPg==";
		this.image = new Image();
		this.image.onload = () => {
			this.defaultImageLoaded = !0;
			this.createMosaic();
		};
		this.image.src = this.imageUrl;
	}
	resetToDefault() {
		this.imageUrl =
			"https://images.unsplash.com/photo-1681759744587-7b62d82f8d70?w=500&auto=format&w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0";
		this.tileSlider.value = 25;
		this.tileCount = 25;
		this.loadDefaultImage();
		document.querySelector("#infos").style.display = "";
	}
	handleImageUpload(event) {
		const file = event.target.files[0];
		document.querySelector("#infos").style.display = "none";
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			this.showError("Le fichier doit être une image");
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			this.imageUrl = e.target.result;
			this.image = new Image();
			this.image.onload = () => {
				this.defaultImageLoaded = !0;
				this.createMosaic();
				this.hideError();
			};
			this.image.onerror = () => {
				this.showError("Erreur lors du chargement de l'image");
			};
			this.image.src = this.imageUrl;
		};
		reader.onerror = () => {
			this.showError("Erreur lors de la lecture du fichier");
		};
		reader.readAsDataURL(file);
	}
	handleTileChange(event) {
		const rawValue = parseInt(event.target.value);
		const safeValue = Math.max(4, Math.min(100, rawValue));
		const tilesPerSide = Math.round(Math.sqrt(safeValue));
		this.tileCount = tilesPerSide * tilesPerSide;
		this.tileSlider.value = this.tileCount;
		if (this.defaultImageLoaded) {
			this.createMosaic();
		}
	}
	handleTileClick(tile, row, col) {
		switch (this.currentAction) {
			case "pop":
				this.actionPop(tile);
				break;
			case "zoom":
				this.actionZoom(tile);
				break;
			case "rotate":
				this.actionRotate(tile);
				break;
			case "swap":
				this.actionSwap(tile, row, col);
				break;
			case "color":
				this.actionColor(tile);
				break;
		}
	}
	actionPop(tile) {
		tile.classList.add("pop");
		setTimeout(() => tile.classList.remove("pop"), 300);
	}
	actionZoom(tile) {
		tile.style.zIndex = "1000";
		tile.style.transform = "scale(2)";
		tile.style.transition = "all 0.3s ease";
		setTimeout(() => {
			tile.style.zIndex = "1";
			tile.style.transform = "scale(1)";
		}, 1000);
	}
	actionRotate(tile) {
		tile.classList.add("rotate");
		setTimeout(() => tile.classList.remove("rotate"), 500);
	}
	actionSwap(tile, row, col) {
		const tiles = Array.from(this.mosaic.children);
		const randomIndex = Math.floor(Math.random() * tiles.length);
		const randomTile = tiles[randomIndex];
		if (randomTile && randomTile !== tile) {
			const tempBg = tile.style.backgroundImage;
			const tempPos = tile.style.backgroundPosition;
			const tempSize = tile.style.backgroundSize;
			tile.style.backgroundImage = randomTile.style.backgroundImage;
			tile.style.backgroundPosition = randomTile.style.backgroundPosition;
			tile.style.backgroundSize = randomTile.style.backgroundSize;
			randomTile.style.backgroundImage = tempBg;
			randomTile.style.backgroundPosition = tempPos;
			randomTile.style.backgroundSize = tempSize;
			tile.classList.add("pop");
			randomTile.classList.add("pop");
			setTimeout(() => {
				tile.classList.remove("pop");
				randomTile.classList.remove("pop");
			}, 300);
		}
	}
	actionColor(tile) {
		const hue = Math.random() * 360;
		tile.style.filter = `hue-rotate(${hue}deg)`;
		tile.classList.add("pop");
		setTimeout(() => tile.classList.remove("pop"), 300);
	}
	resetAllTiles() {
		const tiles = Array.from(this.mosaic.children);
		tiles.forEach((tile) => {
			tile.style.transform = "";
			tile.style.zIndex = "";
			tile.style.opacity = "";
			tile.style.filter = "";
			tile.classList.remove("pop", "rotate");
			if (this.originalBackgrounds && this.originalBackgrounds.get(tile)) {
				const orig = this.originalBackgrounds.get(tile);
				tile.style.backgroundImage = orig.image;
				tile.style.backgroundPosition = orig.position;
				tile.style.backgroundSize = orig.size;
			}
		});
	}
	createMosaic() {
		if (!this.defaultImageLoaded || !this.image) return;
		const tilesPerSide = Math.max(
			2,
			Math.min(10, Math.round(Math.sqrt(this.tileCount)))
		);
		this.mosaic.style.gridTemplateColumns = `repeat(${tilesPerSide}, 1fr)`;
		this.mosaic.style.gridTemplateRows = `repeat(${tilesPerSide}, 1fr)`;
		this.mosaic.innerHTML = "";
		this.originalBackgrounds = new Map();
		const imgWidth = this.image.width;
		const imgHeight = this.image.height;
		const size = Math.min(imgWidth, imgHeight);
		const offsetX = (imgWidth - size) / 2;
		const offsetY = (imgHeight - size) / 2;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = size;
		canvas.height = size;
		ctx.drawImage(this.image, offsetX, offsetY, size, size, 0, 0, size, size);
		const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);
		for (let row = 0; row < tilesPerSide; row++) {
			for (let col = 0; col < tilesPerSide; col++) {
				const tile = document.createElement("div");
				tile.className = "tile";
				const tileSize = size / tilesPerSide;
				const tileX = col * tileSize;
				const tileY = row * tileSize;
				const bgPosX = (tileX / (size - tileSize)) * 100;
				const bgPosY = (tileY / (size - tileSize)) * 100;
				const bgSize = (size / tileSize) * 100;
				tile.style.backgroundImage = `url('${croppedImageUrl}')`;
				tile.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
				tile.style.backgroundSize = `${bgSize}% ${bgSize}%`;
				tile.style.backgroundRepeat = "no-repeat";
				this.originalBackgrounds.set(tile, {
					image: `url('${croppedImageUrl}')`,
					position: `${bgPosX}% ${bgPosY}%`,
					size: `${bgSize}% ${bgSize}%`
				});
				tile.addEventListener("click", (e) => {
					e.stopPropagation();
					this.handleTileClick(tile, row, col);
				});
				this.mosaic.appendChild(tile);
			}
		}
	}
	showError(message) {
		this.errorMessage.textContent = message;
		this.errorMessage.style.display = "block";
		setTimeout(() => this.hideError(), 3000);
	}
	hideError() {
		this.errorMessage.style.display = "none";
	}
}
document.addEventListener("DOMContentLoaded", () => {
	new ImageMosaic();
});