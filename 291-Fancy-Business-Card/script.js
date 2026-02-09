/* ENTRY */
gsap.from(".card", { y: 60, opacity: 0, duration: 1.2, ease: "power4.out" });
gsap.from(".name span", {
  y: 40,
  opacity: 0,
  stagger: 0.12,
  delay: 0.3,
  duration: 1,
  ease: "power4.out"
});

/* ICON DRAW */
gsap.to(".icon", {
  strokeDashoffset: 0,
  duration: 1.2,
  stagger: 0.18,
  delay: 1,
  ease: "power2.out"
});

/* WATERMARK DRIFT */
gsap.to(".watermark", {
  y: -20,
  x: 10,
  duration: 10,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut"
});

/* COLOR SPLASH FLOAT */
gsap.to(".color-splash", {
  x: 20,
  y: 20,
  scale: 1.1,
  duration: 12,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut"
});

/* CARD MAGNETIC INTERACTION */
const card = document.querySelector(".card");
card.addEventListener("mousemove", (e) => {
  const r = card.getBoundingClientRect();
  const x = e.clientX - r.left - r.width / 2;
  const y = e.clientY - r.top - r.height / 2;
  gsap.to(card, {
    x: x * 0.08,
    y: y * 0.08,
    rotateX: -y * 0.03,
    rotateY: x * 0.03,
    duration: 0.6,
    ease: "power3.out"
  });
});
card.addEventListener("mouseleave", () => {
  gsap.to(card, {
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    duration: 0.8,
    ease: "power4.out"
  });
});