const colors = [
    "#ff0a54", "#ff477e", "#ff85a1",
    "#00f5d4", "#9b5de5",
    "#fee440", "#00bbf9"
  ];

  function createConfetti() {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");

    const piece = document.createElement("div");
    piece.classList.add("piece");

    const front = document.createElement("div");
    const back = document.createElement("div");

    front.classList.add("side");
    back.classList.add("side", "back");

    const color = colors[Math.floor(Math.random() * colors.length)];
    front.style.background = color;
    back.style.background = color;

    piece.appendChild(front);
    piece.appendChild(back);
    confetti.appendChild(piece);

    confetti.style.left = Math.random() * window.innerWidth + "px";

    const fallDuration = Math.random() * 4 + 4;
    const spinDuration = Math.random() * 3 + 2;

    confetti.style.animationDuration = fallDuration + "s";
    piece.style.animationDuration = spinDuration + "s";

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, fallDuration * 1000);
  }

  setInterval(createConfetti, 90);