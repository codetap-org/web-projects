const slideImages = [
  "https://cdn.pixabay.com/photo/2016/07/01/23/16/carnival-1492099_1280.jpg",
  "https://cdn.pixabay.com/photo/2024/06/04/01/36/urban-8807675_1280.png",
  "https://cdn.pixabay.com/photo/2019/04/04/17/58/road-4103334_1280.jpg",
  "https://images.unsplash.com/photo-1749072734372-d91c35c82af2?q=80&w=870&auto=format&fit=crop",
  "https://cdn.pixabay.com/photo/2022/12/28/00/46/ai-generated-7681983_640.jpg",
  "https://cdn.pixabay.com/photo/2023/09/28/13/19/sci-fi-8281520_1280.jpg",
  "https://cdn.pixabay.com/photo/2016/10/20/18/35/earth-1756274_1280.jpg"
];

const slideInfo = [
  { title: "Carnaval", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." },
  { title: "Ciudad mágica", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." },
  { title: "Ciudad neón", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." },
  { title: "Bosque", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." },
  { title: "Nave", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." },
  { title: "Ciudad futurista", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." },
  { title: "Espacio", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla non sagittis convallis, erat odio dapibus nisl, a faucibus mauris risus eu metus. Vivamus et metus vel diam luctus sodales. Donec non dui nec lorem tincidunt tempor. Suspendisse potenti. Curabitur ac nibh quis erat fermentum laoreet. Nulla facilisi. Aenean et nisi sit amet nibh laoreet feugiat. Aliquam erat volutpat. Morbi tristique, sapien nec hendrerit luctus, elit turpis dapibus ligula, id iaculis tortor nunc non neque." }
];

const slideshow = document.getElementById("slideshow");
const carousel = document.getElementById("carousel");
const infoTitle = document.getElementById("info-title");
const infoText = document.getElementById("info-text");
const size = 70;

let currentSlide = 0;
let isAnimating = false;

const slides = slideImages.map(img => {
  const div = document.createElement("div");
  div.className = "slide";
  div.style.backgroundImage = `url(${img})`;
  carousel.appendChild(div);
  return div;
});

function getSlideTransform(position) {
  const radius = size/2;
  const angle = position*47 + 141;
  const scale = position === 0 ? 5 : (position === -1 || position === 1 ? 3 : 1);
  return `rotate(${angle}deg) translateY(${radius}rem) rotate(${-angle}deg) scale(${scale})`;
}

function updateSlides() {
  const positions = [-2, -1, 0, 1, 2];
  slides.forEach((slide,i)=>{
    let offset = (i - currentSlide + slides.length) % slides.length;
    if(offset > slides.length / 2) offset -= slides.length;
    if(positions.includes(offset)) {
      slide.style.display = "block";
      slide.style.transform = getSlideTransform(offset);
      slide.style.opacity = "1";
    } else {
      slide.style.display = "none";
      slide.style.opacity = "0";
    }
  });
  slideshow.style.backgroundImage = `url(${slideImages[currentSlide]})`;
  infoTitle.textContent = slideInfo[currentSlide].title;
  infoText.textContent = slideInfo[currentSlide].text;
}

function moveToSlide(target){
  if(isAnimating) return;
  isAnimating = true;
  let diff = (target - currentSlide + slides.length) % slides.length;
  if(diff===0){ isAnimating=false; return; }
  const step = diff > slides.length/2 ? -1 : 1;
  let current = currentSlide;
  function animate(){
    current = (current + step + slides.length) % slides.length;
    currentSlide = current;
    updateSlides();
    if(current !== target){
      setTimeout(animate,300);
    } else {
      isAnimating=false;
    }
  }
  animate();
}

const leftArrow = document.querySelector(".arrow.left");
const rightArrow = document.querySelector(".arrow.right");

leftArrow.addEventListener("click", () => moveToSlide((currentSlide - 1 + slides.length) % slides.length));
rightArrow.addEventListener("click", () => moveToSlide((currentSlide + 1) % slides.length));

updateSlides();
