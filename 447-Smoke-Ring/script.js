var n = 4,
    dur = 3,
    props = {x:0, y:0, hue:185},
    mph = 0,
    mouseDown = false,
    c = document.getElementById('c'),
    ctx = c.getContext('2d'),
    size, cw, ch,
    img = new Image(),
    ring = new Image(),
    particles = [],
    Particle = function(index){
      this.index = index;
      this.x = this.y = this.progress = this.opacity = this.scale = 1;

      this.draw = function(){
        ctx.translate( cw/2, ch/2 );
        ctx.rotate(this.rot);
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = 'overlay'//(this.index%2==0)?'lighter':'overlay';
        ctx.drawImage(img, -size*this.scale/2, -size*this.scale/2, size*this.scale, size*this.scale);
        ctx.rotate(-this.rot);
        ctx.translate( -cw/2, -ch/2 );
      }

      this.tl = gsap.timeline({repeat:-1, repeatRefresh:true})
          .fromTo(this, {
            rot:()=>Math.random()*-0.8,
            scale:()=>3+Math.random(),
          },{
            duration:dur,
            scale:()=>0.5+Math.random(),
            rot:()=>(this.index%2==0)?1:-0.8,
            ease:'none'
          }, 0)
          .fromTo(this, {opacity:0}, {duration:dur/2, opacity:1, yoyo:true, repeat:1, ease:'power1.inOut'}, 0)
          .progress(this.index/n);
    }

ring.src = 'https://assets.codepen.io/721952/speedometerAlpha3.png';
img.src = 'https://assets.codepen.io/721952/grayscaleFlame.jpg';

img.onload = function(){
  updateSize();
  for (var i=0; i<n; i++) particles.push(new Particle(i));
  gsap.ticker.add(redraw);
  gsap.set('.app', {opacity:1});
}

window.onresize = updateSize;
window.onmousedown = window.ontouchstart = (e)=>{ mouseDown=true };
window.onmouseup = window.ontouchend = (e)=>{ mouseDown=false };

window.onmousemove = window.ontouchmove = (e)=>{
  if (e.touches) {
    e.clientX = e.touches[0].clientX;
    e.clientY = e.touches[0].clientY;
  }  
  gsap.to('#c, #s', {
    rotationY:-20+e.clientX/innerWidth*40,
    rotationX:10-e.clientY/innerHeight*20
  });
}

gsap.set('.needle',  { transformOrigin:'100px 100px', rotation:40 });
gsap.set('.ring1',   { transformOrigin:'50% 50%', rotation:130 });
gsap.set('.ring3',   { transformOrigin:'50% 50%', rotation:130, drawSVG:0 });
gsap.set('.redzone', { transformOrigin:'50% 50%', drawSVG:'2.8% 11.2%' });
gsap.set('.app', { perspective:400 });
gsap.set('#s', {overflow:'visible', width:'66.7%', height:'66.7%', left:'50%', top:'50%', xPercent:-50, yPercent:-50, z:20})


function updateSize(){
  cw = (c.width = window.innerWidth);
  ch = (c.height = window.innerHeight);
  size = Math.min(cw/1.5, ch/1.5);
}

function redraw(){ 
  ctx.clearRect(0,0,cw,ch);
  for (var i=0; i<n; i++) particles[i].draw();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = "hsl("+props.hue+", 100%, 50%)";
  ctx.fillRect(cw/2-size/2, ch/2-size/2, size, size); 
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(ring, cw/2-size/2, ch/2-size/2, size, size);
  
  if (mouseDown && mph<1) {
    mph+=0.0015;
    (mph>0.88 && Math.random()>0.5) ? mph -= 0.002 : mph += 0.0015; // make it quiver at the top end
  }
  else if (mph>0) {
    (mph<0.05) ? mph=0:mph-=0.005;
  }
  
  gsap.to('.txt',     { duration:()=>(mph<0.01)?0.001:0.5, innerHTML:mph*221, snap:{innerHTML:1} })
  gsap.to('.ring3',   { drawSVG:'0 '+mph*75+'%' })
  gsap.to('.ring1',   { drawSVG:mph*75+'% 100%' })  
  gsap.to('.needle',  { rotation:40+mph*270 })
  gsap.set(props,     { hue:()=>(mph<0.9)?185:10 })
}