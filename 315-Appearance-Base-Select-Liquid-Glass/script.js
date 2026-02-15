let select = (e) => document.querySelector(e);
let selectAll = (e) => document.querySelectorAll(e);

const select01 = select("#select01"),
options = select01.querySelectorAll("option"),
icons = select("#icons");

var bgId = 521;

/* does browser have CSS appearance: base-select support? */
let appearanceBaseSelectEnabled = false;
if ( window.getComputedStyle(select01).getPropertyValue("appearance") == "base-select" )
	appearanceBaseSelectEnabled = true;

/* update background image on select change */
select01.addEventListener("change", function() {

    const tl2 = gsap.timeline()
    .set( "#bg" + bgId, { className: "bgImg sub" } )
    .set( "#bg" + this.value, { className: "bgImg active" } )
    .to( "#bg" + this.value, { opacity: 0.9, duration: 1, } )
    .to( "#bg" + bgId, { opacity: 0, duration: 0.25, }, 0.75 )
    .set( "#bg" + bgId, { className: "bgImg" } );

    bgId = this.value;

});

$( document ).ready(function() {

 
    /* setup GSAP interactive animation if browser isn't supported */  
    if( !appearanceBaseSelectEnabled )
    {

        icons.addEventListener("mouseover", function() { tl1.play(); }, false);
        icons.addEventListener("mouseout", function() { tl1.reverse(); }, false);
        icons.addEventListener('touchstart', function(event) { tl1.play(); }, false);
        icons.addEventListener('touchend', function(event) { tl1.reverse(); }, false);

        const tl1 = gsap
        .timeline({ paused: true, defaults: { duration: 0.4, ease: "none" } })
        .fromTo( "#mouth", { morphSVG: "#mouth1b" }, { morphSVG: "#mouth2b", duration: 0.2 } )
        .fromTo( "#mouth", { morphSVG: "#mouth2b" }, { morphSVG: "#mouth3b", duration: 0.2 }, 0.2 )
        .fromTo( "#head", { morphSVG: "#head1b" }, { morphSVG: "#head2b" }, 0 )
        .fromTo( "#lEye", { morphSVG: "#lEye1b" }, { morphSVG: "#lEye2b" }, 0 )
        .fromTo( "#rEye", { morphSVG: "#rEye1b" }, { morphSVG: "#rEye2b" }, 0 );
        gsap.set( "#mouth", { morphSVG: "#mouth1b" });
        gsap.set( "#head", { morphSVG: "#head1b" });

    }

    /* load all secondary background images */
    gsap.set("#bg524", { css:{backgroundImage: "url(https://picsum.photos/id/524/1500)" } } );
    gsap.set("#bg444", { css:{backgroundImage: "url(https://picsum.photos/id/444/1500)" } } );
    gsap.set("#bg299", { css:{backgroundImage: "url(https://picsum.photos/id/299/1500)" } } );
    gsap.set("#bg1075", { css:{backgroundImage: "url(https://picsum.photos/id/1075/1500)" } } );
    gsap.set("#bg893", { css:{backgroundImage: "url(https://picsum.photos/id/893/1500)" } } );
    gsap.set("#bg549", { css:{backgroundImage: "url(https://picsum.photos/id/549/1500)" } } );

});