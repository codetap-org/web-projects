let scrollY = 0;
let targetScrollY = 0;
let scrollVelocity = 0;
let materials = [];
let totalImagesToLoad = 0;
let loadedImagesCount = 0;
let meshes = [];
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const renderer = new THREE.WebGLRenderer({
	antialias: !0,
	alpha: !0
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.setAttribute("tabindex", "0");
renderer.domElement.style.outline = "none";
document.body.appendChild(renderer.domElement);
camera.position.z = 1;
console.log("&Toc on codepen - https://codepen.io/ol-ivier");
const BAND_WIDTH = 120;
const IMAGE_WIDTH = 100;
const IMAGE_GAP = 20;
const CLONE_COUNT = 3;
const IMAGES_PER_BAND = [7, 12, 8, 13, 20];
const ImageBand1 = [
	"https://images.unsplash.com/photo-1774233493345-b1fc1bd622c4?w=120",
	"https://images.unsplash.com/photo-1774233493051-1f8a0c5fb592?w=120",
	"https://images.unsplash.com/photo-1774233492948-9c8a06aaf5dd?w=120",
	"https://images.unsplash.com/photo-1774233492904-d625de4ec71e?w=120",
	"https://images.unsplash.com/photo-1774233493272-e5678bfc2ee0?w=120",
	"https://images.unsplash.com/photo-1774233493137-216a8d4d5bd7?w=120",
	"https://images.unsplash.com/photo-1774233493009-8bca87fc2b14?w=120"
];
const ImageBand2 = [
	"https://images.unsplash.com/photo-1774233492925-aa4e97961359?w=120",
	"https://images.unsplash.com/photo-1774233431480-e43825736881?w=120",
	"https://images.unsplash.com/photo-1774233431616-e59e58369c02?w=120",
	"https://images.unsplash.com/photo-1774233431060-6c2828ba85c5?w=120",
	"https://images.unsplash.com/photo-1774233432014-6ec71910803a?w=120",
	"https://images.unsplash.com/photo-1774233431274-121ea4564fe7?w=120",
	"https://images.unsplash.com/photo-1774233431668-ebd1f7af1268?w=120",
	"https://images.unsplash.com/photo-1774233431554-44bcef445a37?w=120",
	"https://images.unsplash.com/photo-1774233431378-f55488218151?w=120",
	"https://images.unsplash.com/photo-1774233433322-69710219587c?w=120",
	"https://images.unsplash.com/photo-1774233432590-f0c012df5a02?w=120",
	"https://images.unsplash.com/photo-1774233430361-10a383549755?w=120"
];
const ImageBand3 = [
	"https://images.unsplash.com/photo-1774233431581-43d0578df803?w=120",
	"https://images.unsplash.com/photo-1774233430757-625254888907?w=120",
	"https://images.unsplash.com/photo-1774233431675-aa15281034a0?w=120",
	"https://images.unsplash.com/photo-1774233431102-ebc245dd7b1e?w=120",
	"https://images.unsplash.com/photo-1774233431250-88ce3e58d120?w=120",
	"https://images.unsplash.com/photo-1774233431550-9aee9d8a1c5a?w=120",
	"https://images.unsplash.com/photo-1774233431053-8f3717a54bac?w=120",
	"https://images.unsplash.com/photo-1774233432391-f399bfb2dc5d?w=120"
];
const ImageBand4 = [
	"https://images.unsplash.com/photo-1774233431600-77cf32012fd1?w=120",
	"https://images.unsplash.com/photo-1774233430729-f7f999000368?w=120",
	"https://images.unsplash.com/photo-1774233430646-822676e661a7?w=120",
	"https://images.unsplash.com/photo-1774233430518-47496ab82a6e?w=120",
	"https://images.unsplash.com/photo-1774233430775-fadd5f1f7e4c?w=120",
	"https://images.unsplash.com/photo-1774233431161-3b040219abf2?w=120",
	"https://images.unsplash.com/photo-1774233431228-637e1b2708fd?w=120",
	"https://images.unsplash.com/photo-1774233430388-df6a30b6f377?w=120",
	"https://images.unsplash.com/photo-1774233431232-129eae91d381?w=120",
	"https://images.unsplash.com/photo-1774233430907-3af8c8668ac3?w=120",
	"https://images.unsplash.com/photo-1774233430498-c3ecf3e9ee50?w=120",
	"https://images.unsplash.com/photo-1774233430374-52349a251e37?w=120",
	"https://images.unsplash.com/photo-1773845595778-53238c8807ed?w=120"
];
const ImageBand5 = [
	"https://images.unsplash.com/photo-1773845597215-a917f5d980e4?w=120",
	"https://images.unsplash.com/photo-1773845597348-d934c86d738a?w=120",
	"https://images.unsplash.com/photo-1773845597024-1b85ae7d6419?w=120",
	"https://images.unsplash.com/photo-1773845597312-a4834dd5ff1c?w=120",
	"https://images.unsplash.com/photo-1773845597388-f89489cb82f2?w=120",
	"https://images.unsplash.com/photo-1773845596232-47e253999574?w=120",
	"https://images.unsplash.com/photo-1773845597231-3d458e23ba7e?w=120",
	"https://images.unsplash.com/photo-1773845596218-14fdcdcc5a40?w=120",
	"https://images.unsplash.com/photo-1773845597312-2efd01ec4436?w=120",
	"https://images.unsplash.com/photo-1773845597150-c7902317bf25?w=120",
	"https://images.unsplash.com/photo-1773845595554-6379e102e352?w=120",
	"https://images.unsplash.com/photo-1773845597299-932379b612a3?w=120",
	"https://images.unsplash.com/photo-1773845596865-eebb018c7c9c?w=120",
	"https://images.unsplash.com/photo-1773845596952-fbe69acf1db2?w=120",
	"https://images.unsplash.com/photo-1773845597131-2e9b2f1bf11f?w=120",
	"https://images.unsplash.com/photo-1773845595119-e1c3570c129a?w=120",
	"https://images.unsplash.com/photo-1773845596855-ede4d0499206?w=120",
	"https://images.unsplash.com/photo-1773845503410-4b89370a6f2e?w=120",
	"https://images.unsplash.com/photo-1773845501575-220faf8b021c?w=120",
	"https://images.unsplash.com/photo-1773845503666-eb568152fe5c?w=120"
];
const bandConfigs = [
	{
		offsetX: 0,
		speed: 1.0,
		rotation: (-7 * Math.PI) / 180,
		rotationType: "fromTop",
		name: "Centrale",
		curveAmount: 40.0,
		curveDirection: 1,
		scrollDirection: 1
	},
	{
		offsetX: 200,
		speed: 1.3,
		rotation: (-26 * Math.PI) / 180,
		rotationType: "fromCenter",
		name: "Droite 1",
		curveAmount: 30.0,
		curveDirection: -1,
		scrollDirection: -1
	},
	{
		offsetX: 400,
		speed: 1.6,
		rotation: (18 * Math.PI) / 180,
		rotationType: "fromTop",
		name: "Droite 2",
		curveAmount: 20.0,
		curveDirection: 1,
		scrollDirection: 1
	},
	{
		offsetX: -100,
		speed: 0.7,
		rotation: (47 * Math.PI) / 180,
		name: "Gauche 1",
		curveAmount: 55.0,
		curveDirection: 1,
		scrollDirection: -1
	},
	{
		offsetX: -200,
		speed: 0.4,
		rotation: (24 * Math.PI) / 180,
		name: "Gauche 2",
		curveAmount: 45.0,
		curveDirection: 1,
		scrollDirection: 1
	}
];

function getImageUrlsForBand(bandIndex) {
	switch (bandIndex) {
		case 0:
			return ImageBand1;
		case 1:
			return ImageBand2;
		case 2:
			return ImageBand3;
		case 3:
			return ImageBand4;
		case 4:
			return ImageBand5;
		default:
			return [];
	}
}

function generateImageRatiosForBand(bandIndex, count) {
	const baseRatios = [
		{
			ratio: 0.67,
			type: "portrait"
		},
		{
			ratio: 0.75,
			type: "portrait"
		},
		{
			ratio: 1.0,
			type: "carre"
		},
		{
			ratio: 1.33,
			type: "paysage"
		},
		{
			ratio: 1.5,
			type: "paysage"
		},
		{
			ratio: 1.77,
			type: "vidéo"
		},
		{
			ratio: 0.56,
			type: "portrait"
		},
		{
			ratio: 1.85,
			type: "cinéma"
		}
	];
	const imageRatios = [];
	let ratioDistribution;
	switch (bandIndex % 5) {
		case 0:
			ratioDistribution = [0, 0, 1, 2, 3, 0, 0, 4];
			break;
		case 1:
			ratioDistribution = [1, 2, 2, 2, 1, 3, 4, 2];
			break;
		case 2:
			ratioDistribution = [3, 4, 3, 4, 3, 4, 1, 0];
			break;
		case 3:
			ratioDistribution = [0, 1, 2, 3, 4, 0, 1, 2];
			break;
		case 4:
			ratioDistribution = [5, 6, 7, 3, 4, 5, 6, 7];
			break;
	}
	for (let i = 0; i < count; i++) {
		const baseIndex = ratioDistribution[i % ratioDistribution.length];
		const baseRatio = baseRatios[baseIndex];
		const variation = (Math.random() - 0.5) * 0.1;
		const variedRatio = baseRatio.ratio * (1 + variation);
		imageRatios.push({
			ratio: variedRatio,
			type: baseRatio.type,
			originalRatio: baseRatio.ratio
		});
	}
	return imageRatios;
}

function calculateImageDimensions(width, ratio) {
	return {
		width: width,
		height: Math.round(width / ratio),
		ratio: ratio
	};
}

function createTransparentTextureForBand(images, bandName) {
	let sequenceHeight = 0;
	const imagesPerBand = images.length;
	for (let i = 0; i < imagesPerBand; i++) {
		const imageInfo = images[i];
		if (imageInfo && imageInfo.loaded) {
			sequenceHeight += imageInfo.height + IMAGE_GAP;
		}
	}
	sequenceHeight -= IMAGE_GAP;
	const totalHeight = sequenceHeight * CLONE_COUNT;
	const canvas = document.createElement("canvas");
	canvas.width = BAND_WIDTH;
	canvas.height = totalHeight;
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, BAND_WIDTH, totalHeight);
	let currentY = 0;
	for (let clone = 0; clone < CLONE_COUNT; clone++) {
		for (let i = 0; i < imagesPerBand; i++) {
			const imageInfo = images[i];
			if (imageInfo && imageInfo.loaded && imageInfo.img) {
				const targetWidth = IMAGE_WIDTH;
				const targetHeight = imageInfo.height;
				const targetRatio = targetWidth / targetHeight;
				const img = imageInfo.img;
				const sourceRatio = img.width / img.height;
				let sourceX = 0;
				let sourceY = 0;
				let sourceWidth = img.width;
				let sourceHeight = img.height;
				if (sourceRatio > targetRatio) {
					const scaledHeight = img.height;
					const scaledWidth = scaledHeight * targetRatio;
					sourceX = (img.width - scaledWidth) / 2;
					sourceWidth = scaledWidth;
				} else if (sourceRatio < targetRatio) {
					const scaledWidth = img.width;
					const scaledHeight = scaledWidth / targetRatio;
					sourceY = (img.height - scaledHeight) / 2;
					sourceHeight = scaledHeight;
				}
				const x = (BAND_WIDTH - targetWidth) / 2;
				ctx.save();
				ctx.globalAlpha = 0.9;
				ctx.drawImage(
					img,
					sourceX,
					sourceY,
					sourceWidth,
					sourceHeight,
					x,
					currentY,
					targetWidth,
					targetHeight
				);
				ctx.restore();
				currentY += targetHeight + IMAGE_GAP;
			}
		}
	}
	return {
		canvas: canvas,
		totalHeight: totalHeight,
		sequenceHeight: sequenceHeight,
		imagesCount: imagesPerBand
	};
}

function loadImagesForBand(bandIndex, imagesCount, callback) {
	const ratios = generateImageRatiosForBand(bandIndex, imagesCount);
	const images = [];
	let loaded = 0;
	const imageUrls = getImageUrlsForBand(bandIndex);
	for (let i = 0; i < imagesCount; i++) {
		const ratioInfo = ratios[i];
		const dim = calculateImageDimensions(IMAGE_WIDTH, ratioInfo.ratio);
		const img = new Image();
		img.crossOrigin = "anonymous";
		const imageObj = {
			loaded: !1,
			img: null,
			width: dim.width,
			height: dim.height,
			ratio: ratioInfo.ratio,
			type: ratioInfo.type,
			originalRatio: ratioInfo.originalRatio
		};
		images.push(imageObj);
		img.onload = function () {
			imageObj.loaded = !0;
			imageObj.img = img;
			loaded++;
			loadedImagesCount++;
			updateLoading();
			if (loaded === imagesCount) {
				callback(images);
			}
		};
		img.onerror = function () {
			createFallbackImageForBand(imageObj, i, bandIndex, dim);
			imageObj.loaded = !0;
			loaded++;
			loadedImagesCount++;
			updateLoading();
			if (loaded === imagesCount) {
				callback(images);
			}
		};
		if (imageUrls && imageUrls[i]) {
			img.src = imageUrls[i];
		} else {
			const loadWidth = 400;
			const loadHeight = Math.round(
				loadWidth / ratioInfo.originalRatio || ratioInfo.ratio
			);
			const randomId = Math.floor(Math.random() * 1000);
			img.src = `https://picsum.photos/id/${randomId}/${loadWidth}/${loadHeight}`;
		}
	}
	return images;
}

function createFallbackImageForBand(imageObj, imgIndex, bandIndex, dimensions) {
	const canvas = document.createElement("canvas");
	canvas.width = dimensions.width;
	canvas.height = dimensions.height;
	const ctx = canvas.getContext("2d");
	const bandColors = [
		"hsl(0, 70%, 60%)",
		"hsl(120, 70%, 60%)",
		"hsl(240, 70%, 60%)",
		"hsl(60, 70%, 60%)",
		"hsl(300, 70%, 60%)"
	];
	const color = bandColors[bandIndex] || "hsl(0, 0%, 70%)";
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, dimensions.width, dimensions.height);
	ctx.fillStyle = "white";
	ctx.font = "bold 10px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	let ratioText;
	if (dimensions.ratio >= 0.65 && dimensions.ratio <= 0.68) ratioText = "2:3";
	else if (dimensions.ratio >= 0.74 && dimensions.ratio <= 0.76)
		ratioText = "3:4";
	else if (dimensions.ratio >= 0.99 && dimensions.ratio <= 1.01)
		ratioText = "1:1";
	else if (dimensions.ratio >= 1.32 && dimensions.ratio <= 1.34)
		ratioText = "4:3";
	else if (dimensions.ratio >= 1.49 && dimensions.ratio <= 1.51)
		ratioText = "3:2";
	else ratioText = dimensions.ratio.toFixed(2);
	ctx.fillText(
		`Bande ${bandIndex + 1}`,
		dimensions.width / 2,
		dimensions.height / 2 - 10
	);
	ctx.fillText(ratioText, dimensions.width / 2, dimensions.height / 2);
	ctx.fillText(
		`Image ${imgIndex + 1}`,
		dimensions.width / 2,
		dimensions.height / 2 + 10
	);
	imageObj.img = canvas;
}

function updateLoading() {
	const progress = (loadedImagesCount / totalImagesToLoad) * 100;
	const progressFill = document.getElementById("progressFill");
	const loadingText = document.getElementById("loadingText");
	if (progressFill && loadingText) {
		progressFill.style.width = `${progress}%`;
		loadingText.innerHTML = `Chargement des images... ${loadedImagesCount}/${totalImagesToLoad}`;
	}
}

function cleanupOldMeshes() {
	meshes.forEach((mesh) => {
		scene.remove(mesh);
		if (mesh.geometry) mesh.geometry.dispose();
		if (mesh.material) {
			if (mesh.material.uniforms && mesh.material.uniforms.uTexture) {
				mesh.material.uniforms.uTexture.value.dispose();
			}
			mesh.material.dispose();
		}
	});
	meshes = [];
	materials = [];
	loadedImagesCount = 0;
}
async function createAllBands() {
	cleanupOldMeshes();
	const bandPromises = [];
	for (let bandIndex = 0; bandIndex < 5; bandIndex++) {
		const config = bandConfigs[bandIndex];
		const imagesCount = IMAGES_PER_BAND[bandIndex];
		const promise = new Promise((resolve) => {
			loadImagesForBand(bandIndex, imagesCount, (images) => {
				const textureData = createTransparentTextureForBand(images, config.name);
				const texture = new THREE.Texture(textureData.canvas);
				texture.needsUpdate = !0;
				resolve({
					bandIndex: bandIndex,
					config: config,
					texture: texture,
					textureData: textureData
				});
			});
		});
		bandPromises.push(promise);
	}
	const bandResults = await Promise.all(bandPromises);
	bandResults.forEach((result) => {
		const { bandIndex, config, texture, textureData } = result;
		const material = new THREE.ShaderMaterial({
			uniforms: {
				uResolution: {
					value: new THREE.Vector2()
				},
				uTexture: {
					value: texture
				},
				uTextureHeight: {
					value: textureData.totalHeight
				},
				uSequenceHeight: {
					value: textureData.sequenceHeight
				},
				uBandWidth: {
					value: BAND_WIDTH
				},
				uScroll: {
					value: 0
				},
				uSpeed: {
					value: config.speed
				},
				uScrollDirection: {
					value: config.scrollDirection
				},
				uOffsetX: {
					value: config.offsetX
				},
				uRotation: {
					value: config.rotation
				},
				uRotationType: {
					value: config.rotationType === "fromTop" ? 1.0 : 0.0
				},
				uHasRotation: {
					value: config.rotation !== 0 ? 1.0 : 0.0
				},
				uBandIndex: {
					value: bandIndex
				},
				uCurveAmount: {
					value: config.curveAmount
				},
				uCurveDirection: {
					value: config.curveDirection
				},
				uTime: {
					value: 0
				}
			},
			vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
			fragmentShader: `
                        precision highp float;
                        
                        uniform vec2 uResolution;
                        uniform sampler2D uTexture;
                        uniform float uTextureHeight;
                        uniform float uSequenceHeight;
                        uniform float uBandWidth;
                        uniform float uScroll;
                        uniform float uSpeed;
                        uniform float uScrollDirection;
                        uniform float uOffsetX;
                        uniform float uRotation;
                        uniform float uRotationType;
                        uniform float uHasRotation;
                        uniform float uBandIndex;
                        uniform float uCurveAmount;
                        uniform float uCurveDirection;
                        uniform float uTime;
                        
                        varying vec2 vUv;
                        
                        mat2 rotate2d(float angle) {
                            return mat2(cos(angle), -sin(angle),
                                      sin(angle), cos(angle));
                        }
                        
                        void main() {
                            vec2 pixelCoord = vUv * uResolution;
                            vec2 originalPixelCoord = pixelCoord;
                            
                            float normalizedY = pixelCoord.y / uResolution.y;
                            float curveFactor = 4.0 * (normalizedY - 0.5) * (normalizedY - 0.5);
                            float curveOffset = (0.5 - curveFactor) * uCurveAmount * uCurveDirection;
                            
                            float bandLeftBase = (uResolution.x - uBandWidth) * 0.5 + uOffsetX;
                            float bandLeft = bandLeftBase + curveOffset;
                            float bandRight = bandLeft + uBandWidth;
                            
                            float bandCenterX = bandLeftBase + (uBandWidth * 0.5);
                            
                            if (uHasRotation > 0.5) {
                                vec2 rotationCenter;
                                
                                if (uRotationType > 0.5) {
                                    rotationCenter = vec2(bandCenterX, 0.0);
                                } else {
                                    rotationCenter = vec2(bandCenterX, uResolution.y * 0.5);
                                }
                                
                                pixelCoord -= rotationCenter;
                                pixelCoord = rotate2d(uRotation) * pixelCoord;
                                pixelCoord += rotationCenter;
                                
                                originalPixelCoord -= rotationCenter;
                                originalPixelCoord = rotate2d(uRotation) * originalPixelCoord;
                                originalPixelCoord += rotationCenter;
                                
                                vec2 rotatedBandLeft = vec2(bandLeft, 0.0);
                                vec2 rotatedBandRight = vec2(bandRight, 0.0);
                                
                                rotatedBandLeft -= rotationCenter;
                                rotatedBandLeft = rotate2d(uRotation) * rotatedBandLeft;
                                rotatedBandLeft += rotationCenter;
                                
                                rotatedBandRight -= rotationCenter;
                                rotatedBandRight = rotate2d(uRotation) * rotatedBandRight;
                                rotatedBandRight += rotationCenter;
                                
                                bandLeft = min(rotatedBandLeft.x, rotatedBandRight.x);
                                bandRight = max(rotatedBandLeft.x, rotatedBandRight.x);
                            }
                            
                            float margin = 3.0;
                            if (pixelCoord.x < bandLeft - margin || pixelCoord.x > bandRight + margin) {
                                discard;
                                return;
                            }
                            
                            float scrollPos = uScroll * uSpeed * uScrollDirection;
                            
                            float wrappedY = mod(originalPixelCoord.y + scrollPos, uSequenceHeight);
                            
                            float cloneIndex = 1.0;
                            float textureY = (wrappedY + (cloneIndex * uSequenceHeight)) / uTextureHeight;
                            
                            float texX = (pixelCoord.x - bandLeft) / (bandRight - bandLeft);
                            
                            if (texX < 0.0 || texX > 1.0 || textureY < 0.0 || textureY > 1.0) {
                                discard;
                                return;
                            }
                            
                            vec4 color = texture2D(uTexture, vec2(texX, textureY));
                            
                            if (color.a < 0.5) {
                                discard;
                                return;
                            }
                            
                            float edge = min(pixelCoord.x - bandLeft, bandRight - pixelCoord.x);
                            if (edge < margin) {
                                color.a *= smoothstep(0.0, margin, edge);
                            }
                            
                            if (color.a < 0.01) {
                                discard;
                                return;
                            }
                            
                            float hueShift = uBandIndex * 0.1;
                            color.r *= (1.0 + sin(hueShift) * 0.02);
                            color.g *= (1.0 + sin(hueShift + 2.094) * 0.02);
                            color.b *= (1.0 + sin(hueShift + 4.188) * 0.02);
                            
                            gl_FragColor = color;
                        }
                    `,
			transparent: !0,
			depthTest: !1,
			depthWrite: !1,
			alphaTest: 0.5
		});
		materials.push(material);
		const geometry = new THREE.PlaneGeometry(2, 2);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = bandIndex * -0.1;
		scene.add(mesh);
		meshes.push(mesh);
	});
	document.getElementById("loading").style.display = "none";
}

function init() {
	totalImagesToLoad = IMAGES_PER_BAND.reduce((sum, count) => sum + count, 0);
	createAllBands();
}
let isDragging = !1;
let lastMouseY = 0;
const inertia = 0.92;
renderer.domElement.addEventListener("click", function (e) {
	e.stopPropagation();
	renderer.domElement.focus();
});
renderer.domElement.addEventListener("keydown", function (e) {
	e.preventDefault();
	e.stopPropagation();
	switch (e.key) {
		case "ArrowUp":
			targetScrollY -= 50;
			scrollVelocity = -8;
			break;
		case "ArrowDown":
			targetScrollY += 50;
			scrollVelocity = 8;
			break;
		case "ArrowLeft":
			targetScrollY -= 30;
			scrollVelocity = -5;
			break;
		case "ArrowRight":
			targetScrollY += 30;
			scrollVelocity = 5;
			break;
		case " ":
		case "Space":
			e.preventDefault();
			scrollVelocity = -scrollVelocity * 1.5;
			break;
		case "r":
		case "R":
			e.preventDefault();
			targetScrollY = 0;
			scrollVelocity = 0;
			break;
		case "Home":
			e.preventDefault();
			targetScrollY = 0;
			scrollVelocity = 0;
			break;
		case "End":
			e.preventDefault();
			targetScrollY = 5000;
			scrollVelocity = 0;
			break;
	}
});
document.addEventListener("dblclick", function (e) {
	targetScrollY = 0;
	scrollVelocity = 0;
});
document.addEventListener(
	"wheel",
	function (e) {
		e.preventDefault();
		const delta = e.deltaY;
		targetScrollY += delta;
		scrollVelocity = delta * 0.15;
		if (document.activeElement !== renderer.domElement) {
			renderer.domElement.focus();
		}
	},
	{
		passive: !1
	}
);
document.addEventListener("mousedown", function (e) {
	if (
		e.target === renderer.domElement ||
		renderer.domElement.contains(e.target)
	) {
		isDragging = !0;
		lastMouseY = e.clientY;
		scrollVelocity = 0;
		document.body.style.cursor = "grabbing";
		renderer.domElement.focus();
	}
});
document.addEventListener("mousemove", function (e) {
	if (!isDragging) return;
	const deltaY = e.clientY - lastMouseY;
	targetScrollY += deltaY * 2.0;
	lastMouseY = e.clientY;
	scrollVelocity = deltaY * 0.25;
});
document.addEventListener("mouseup", function () {
	isDragging = !1;
	document.body.style.cursor = "default";
});
let lastTouchY = 0;
renderer.domElement.addEventListener(
	"touchstart",
	function (e) {
		e.preventDefault();
		lastTouchY = e.touches[0].clientY;
		renderer.domElement.focus();
	},
	{
		passive: !1
	}
);
renderer.domElement.addEventListener(
	"touchmove",
	function (e) {
		e.preventDefault();
		const touchY = e.touches[0].clientY;
		const deltaY = touchY - lastTouchY;
		targetScrollY += deltaY * 2.5;
		lastTouchY = touchY;
		scrollVelocity = deltaY * 0.3;
	},
	{
		passive: !1
	}
);

function applyInertia() {
	if (!isDragging) {
		targetScrollY += scrollVelocity;
		scrollVelocity *= inertia;
		if (Math.abs(scrollVelocity) < 0.5) {
			scrollVelocity = 0;
		}
	}
}

function animate() {
	requestAnimationFrame(animate);
	applyInertia();
	const smoothing = isDragging ? 0.3 : 0.1;
	scrollY += (targetScrollY - scrollY) * smoothing;
	materials.forEach((material, index) => {
		material.uniforms.uScroll.value = scrollY;
		material.uniforms.uTime.value += 0.016;
		material.uniforms.uResolution.value.set(
			window.innerWidth,
			window.innerHeight
		);
	});
	renderer.render(scene, camera);
}
window.addEventListener("resize", function () {
	renderer.setSize(window.innerWidth, window.innerHeight);
	materials.forEach((material) => {
		material.uniforms.uResolution.value.set(
			window.innerWidth,
			window.innerHeight
		);
	});
});
window.addEventListener("keydown", function (e) {
	if (
		e.key === "ArrowUp" ||
		e.key === "ArrowDown" ||
		e.key === " " ||
		e.key === "Space"
	) {
		if (document.activeElement !== renderer.domElement) {
			e.preventDefault();
		}
	}
});

function startAnimation() {
	animate();
}
init();
startAnimation();