let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const progressBar = document.getElementById('bar');

function updateProgress() {
    // Slides ki total counting ke hisaab se bar ko update karein
    const percent = ((currentSlide + 1) / slides.length) * 100;
    progressBar.style.width = percent + "%";
}

function next() {
    if (currentSlide < slides.length - 1) {
        // Purani slide se 'active' class hatao
        slides[currentSlide].classList.remove('active');
        
        // Agli slide par jao
        currentSlide++;
        
        // Nayi slide ko 'active' karo
        slides[currentSlide].classList.add('active');
        
        // Progress bar ko update karo
        updateProgress();
    }
}

// Pehli baar load hone par bar set karein
updateProgress();
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

// Screen size ke mutabiq canvas set karna
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const hearts = [];

// Dil (Heart) banane ka function
function createHeart() {
    hearts.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 50,
        size: Math.random() * 15 + 10,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3
    });
}

// Dil ko screen par dikhane ka function
function drawHearts() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    hearts.forEach((heart, index) => {
        heart.y -= heart.speed;
        ctx.globalAlpha = heart.opacity;
        ctx.fillStyle = '#ff4d6d'; // Pyara sa Pinkish Red color
        
        // Heart Shape drawing
        ctx.beginPath();
        ctx.moveTo(heart.x, heart.y);
        ctx.bezierCurveTo(heart.x - heart.size/2, heart.y - heart.size/2, heart.x - heart.size, heart.y + heart.size/3, heart.x, heart.y + heart.size);
        ctx.bezierCurveTo(heart.x + heart.size, heart.y + heart.size/3, heart.x + heart.size/2, heart.y - heart.size/2, heart.x, heart.y);
        ctx.fill();

        // Agar dil screen se bahar nikal jaye toh delete kar do
        if (heart.y < -50) hearts.splice(index, 1);
    });
    
    requestAnimationFrame(drawHearts);
}

// Har 300ms baad ek naya dil banega
setInterval(createHeart, 300);
drawHearts();