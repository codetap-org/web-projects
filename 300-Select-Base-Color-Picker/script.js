import chroma from "https://cdn.jsdelivr.net/npm/chroma-js@3.1.2/+esm";

let select = (e) => document.querySelector(e);
let selectAll = (e) => document.querySelectorAll(e);


const customSelect = select("#customSelect");
const customSelecOptions = selectAll("#customSelect > option");
const options = selectAll("option");
const optionsToolTip = select("#optionsToolTip");

let appearanceBaseSelectEnabled = false;
if ( window.getComputedStyle(customSelect).getPropertyValue("appearance") == "base-select" )
    appearanceBaseSelectEnabled = true;

var bgId = 137;

/* select change eventListener */
customSelect.addEventListener("change", function() {
    gsap.set(customSelect, { "--rotation": gsap.utils.random( 2160, 2600, 10 )+"deg" } );
    gsap.set(customSelect, { "--width": gsap.utils.random( 18, 36, 1 )+"px" } );
    gsap.set(customSelect, { "--verticalMax": gsap.utils.random( 90, 110, 5 )+"px" } );
    randomImageChange();
 });

/* random image change */
function randomImageChange() {

    if( !appearanceBaseSelectEnabled )
    {
        let option = document.body.getAttribute("data-chosen");
        gsap.set("body", { "--selectColor": option });
        let chromaColor = chroma(option).hex();
        let textColor = getContrastYIQ(chromaColor);
        if( textColor == "white")
            customSelect.classList.add('whiteText');
        else
            customSelect.classList.remove('whiteText');

    }


    let targetId = bgId;
    while ( targetId == bgId ) { targetId = gsap.utils.random([524,679,137,893,924]); }
    const tl2 = gsap.timeline()
    .set( "#bg" + bgId, { className: "bgImg sub" } )
    .set( "#bg" + targetId, { className: "bgImg active" } )
    .to( "#bg" + targetId, { opacity: 0.5, duration: 1, } )
    .to( "#bg" + bgId, { opacity: 0, duration: 0.25, }, 0.75 )
    .set( "#bg" + bgId, { className: "bgImg" } );

    bgId = targetId;
    
}



document.body.onload = () => {

    /* if browser isn't supported ? */
    if( !appearanceBaseSelectEnabled )
    {

        gsap.set("body", { "--selectColor": "AliceBlue" });
        select("#close").addEventListener("click", function() {
				select("#browserSupport").remove();
					
		});

        /* setup initial color
        gsap.set("body", { "--selectColor": "AliceBlue" }); */

        /* propagate select options with value text and coloring */
        options.forEach((option) => {

            let optionValue = option.getAttribute("value");
            option.innerHTML = optionValue;
            let chromaColor = chroma(optionValue).hex();
            let textColor = getContrastYIQ(chromaColor);

            option.setAttribute("style", "color: "+textColor+"; background-color: "+optionValue);



        });

        /* setup browser icon GSAP interactive animations */  
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
	
    /* load all secondary background images  */
    gsap.set("#bg524", { css:{backgroundImage: "url(https://picsum.photos/id/524/1500?grayscale)" } } );
    gsap.set("#bg679", { css:{backgroundImage: "url(https://picsum.photos/id/679/1500?grayscale)" } } );
    gsap.set("#bg893", { css:{backgroundImage: "url(https://picsum.photos/id/893/1500?grayscale)" } } );
    gsap.set("#bg924", { css:{backgroundImage: "url(https://picsum.photos/id/924/1500?grayscale)" } } );

}


function getContrastYIQ(hexcolor){
    
    if (hexcolor.slice(0, 1) === '#')
	    hexcolor = hexcolor.slice(1);
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
	var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? 'black' : 'white';
}