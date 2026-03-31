import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.mjs';


document.addEventListener("DOMContentLoaded", () => {
  const backgroundWrapper = document.querySelectorAll(".co-background");

  const swiper = new Swiper(".swiper", {
    loop: false,
    watchSlidesProgress: true, // allows to use each slide progress: this.slides[i].progress
    speed: 1000,
    grabCursor: true,
    //loopAdditionalSlides: 1, needed if loop is true

    navigation: {
      nextEl: ".co-carousel__nav-button.next",
      prevEl: ".co-carousel__nav-button.prev",
    },

    on: {
      progress: function (swiper) {
        swiper.slides.forEach((slide, index) => {
          const progress = slide.progress;

          //-1 = right, 1 = left, 0 = middle
          if (progress >= -1 && progress <= 1) {
            const rotateShoeMax = 15;
            const scaleMax = 1.3;
            const progressPositive = Math.abs(progress);

            const translateX = progress * -100;
            const rotateShoe = progressPositive * rotateShoeMax - rotateShoeMax;
            const rotateCard = progress * -15;
            const textMaskY = progressPositive * 50;
            const scale = 1 - progressPositive * 0.2;
            const opacity = 0.5 - progressPositive * 0.5; // opacity between 0.5 and 0

            //slide.querySelector('.co-card').style.transform = `perspective(800px) scale(${scale}) rotateY(${rotateCard}deg) `;
            slide.querySelector(".co-card").style.transform = `scale(${scale})`;
            slide.querySelector(".co-card__shoe-img").style.transform =
              `translate3d(${translateX}px, 0,0) rotate(${rotateShoe}deg)`;
            slide.querySelector(".co-card__shoe-shadow").style.transform =
              `translate3d(${translateX / 2}px, 0,0)`;
            backgroundWrapper[index].style.opacity = opacity.toFixed(2);

            const textsMask = slide.querySelectorAll(".text-mask span");
            textsMask.forEach((t, i) => {
              t.style.transform = `translate3d(0,${textMaskY * (i + 1)}px,0)`;
            });
          }
        });
      },
      setTransition: function (swiper, speed) {
        swiper.slides.forEach((slide, index) => {
          slide.querySelector(".co-card").style.transition = `${speed}ms`;
          slide.querySelector(".co-card__shoe-img").style.transition =
            `${speed}ms`;
          slide.querySelector(".co-card__shoe-shadow").style.transition =
            `${speed}ms`;
          backgroundWrapper[index].style.transition = `${speed}ms`;

          const textsMask = slide.querySelectorAll(".text-mask span");
          textsMask.forEach((t) => {
            t.style.transition = `${speed}ms`;
          });
        });
      },
    },
  });
});