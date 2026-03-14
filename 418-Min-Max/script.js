import { slideVars } from "https://esm.sh/@codepen/slidevars";

const boxWrapperBox = document.querySelectorAll("#boxWrapper box");
let cornerShapeSquircleEnabled = false;
if ( window.getComputedStyle(boxWrapperBox[0]).getPropertyValue("corner-shape") == "squircle" )
    cornerShapeSquircleEnabled = true;

if( cornerShapeSquircleEnabled )
{
    var slideVarsArray = {
        "--minWidth": { label: 'Min', type: "slider", min: 100, max: 576, default: 576,  unit: "px" },  
        "--maxWidth": { type: "slider", min: 768, max: 1200, default: 1200,  unit: "px" },  
        "--rotation": { type: "slider", min: -17, max: 17, default: 17, unit: "deg" }, 
        "--squircle": { type: "slider", min: 0, max: 100, default: 100, unit: "%" },
        "--baseFrequency": { type: "slider", min: 0, max: 50, default: 2, unit: "/100" },
        "--displacementMapScale": { type: "slider", min: 0, max: 15, default: 15, unit: "" }
    };
}
else
{
    var slideVarsArray = {
        "--minWidth": { label: 'Min', type: "slider", min: 100, max: 576, default: 576,  unit: "px" },  
        "--maxWidth": { type: "slider", min: 768, max: 1200, default: 1200,  unit: "px" },  
        "--rotation": { type: "slider", min: -17, max: 17, default: 17,  unit: "deg" },
        "--borderRadius": { type: "slider", min: 0, max: 50, default: 5,  unit: "%" },
        "--baseFrequency": { type: "slider", min: 0, max: 50, default: 2, unit: "/100" },
        "--displacementMapScale": { type: "slider", min: 0, max: 15, default: 15, unit: "" }
    };
}

slideVars.init( slideVarsArray, { defaultOpen: true });





let timer, baseFrequency, displacementMapScale;
const styleObserver = new MutationObserver((mutations) => {
	
    if (timer)
        clearTimeout(timer);
    timer = setTimeout(() => {
		
        const currentBaseFrequency = mutations[0].target.style.getPropertyValue('--baseFrequency').split("/");
        const currentDisplacementMapScale = mutations[0].target.style.getPropertyValue('--displacementMapScale');

        if( ( currentBaseFrequency[0] != baseFrequency ) || ( currentDisplacementMapScale != displacementMapScale ) )
        {
            baseFrequency = currentBaseFrequency[0];
            displacementMapScale = currentDisplacementMapScale;
            console.log(baseFrequency);
            document.querySelector("#noiseTurb").setAttribute("baseFrequency",baseFrequency/100);
            document.querySelector("#scaleMap").setAttribute("scale",displacementMapScale);
        }

    }, 500);

});

styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'], });