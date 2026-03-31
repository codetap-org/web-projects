import { slideVars } from "https://esm.sh/@codepen/slidevars";

let select = e => document.querySelector(e);
let selectAll = e => document.querySelectorAll(e);

const

mCArray = [ select("#mC0"), select("#mC1"), select("#mC2") ],
mLArray = [ 
[ select("#mL1"), select("#mL2") ],
[ select("#mL3") ,select("#mL4") ],
[ select("#mL5") ,select("#mL6") ],
[ select("#mL7") ,select("#mL8") ],
[ select("#mL9") ,select("#mL10") ] ],

midpoint = ([x1, y1],[x2, y2]) => [ Math.round((x1 + x2) / 2),  Math.round((y1 + y2) / 2) ],

mPoles = selectAll(".mPole"),

startBox = select("#startBox").getBoundingClientRect();

var mPoleData = [[0,0],[0,0]];
mPoleData[0].x = mPoles[0].offsetLeft + gsap.getProperty( mPoles[0], "x");
mPoleData[0].y = mPoles[0].offsetTop + gsap.getProperty( mPoles[0], "y");
mPoleData[1].x = mPoles[1].offsetLeft + gsap.getProperty( mPoles[1], "x");
mPoleData[1].y = mPoles[1].offsetTop + gsap.getProperty( mPoles[1], "y");

gsap.timeline({ repeat: 0, defaults: { duration: 1, ease: "sine.inOut" } })
.to( "#mP1", { left: startBox.left-35, top:startBox.top-35 } )
.to( "#mP2", { left: startBox.right-35, top:startBox.bottom-35 }, "<" )
.to( "#container", {
    opacity: 1,
    onUpdate: () => {
        getMPoleData( mPoles[0], 0 );
        getMPoleData( mPoles[1], 1 );
    }
}, "<" );

var arch = 10;

/* setup GSAP draggable on both poles */
mPoles.forEach( ( mPole, index ) => {

    Draggable.create(mPole, {
        type: 'xy',
        bounds: select('#container'),
        inertia: true,
        onDrag: function () {
            getMPoleData(mPole, index);
        }
    });

 } );

/* Update magnetic lines for initialising, pole changes and resizing */
function getMPoleData( e, i ) {
	
    let scaleArray = [0.5,0.75,1.05,1.43,1.9];

    mPoleData[i].x = e.offsetLeft + gsap.getProperty( e, "x") + 38;
    mPoleData[i].y = e.offsetTop + gsap.getProperty( e, "y") + 38;
    
    let midPoint = midpoint([mPoleData[0].x, mPoleData[0].y], [mPoleData[1].x, mPoleData[1].y]);
    for( var j=0; j < scaleArray.length; j++ )
    {

        /* setup line between the two poles and scale up/down */
        /* position center/end points */
        /* rotate 90deg to position tangentially */
        var new0X = ( midPoint[0] + Math.sqrt(scaleArray[j]*arch/5) * ( mPoleData[0].x - midPoint[0] ) ).toFixed(2);
        var new0Y = ( midPoint[1] + Math.sqrt(scaleArray[j]*arch/5) * ( mPoleData[0].y - midPoint[1] ) ).toFixed(2);
        var new1X = ( midPoint[0] + Math.sqrt(scaleArray[j]*arch/5) * ( mPoleData[1].x - midPoint[0] ) ).toFixed(2);
        var new1Y = ( midPoint[1] + Math.sqrt(scaleArray[j]*arch/5) * ( mPoleData[1].y - midPoint[1] ) ).toFixed(2);
        let draw0 = "M " + new0X + ", " + new0Y + " L " + new1X + ", " + new1Y;

        gsap.set( "#tanLine", { rotation: 0, transformOrigin: "50% 50%" });
        gsap.set( mL0, { attr:{ d: draw0 } });
        gsap.set( mCArray[0], { cx: midPoint[0], cy: midPoint[1] } );
        gsap.set( mCArray[1], { cx: new0X, cy: new0Y } ); 
        gsap.set( mCArray[2], { cx: new1X, cy: new1Y } );
        gsap.set( "#tanLine", { rotation: 90, transformOrigin:"50% 50%" });

        /* get end positions after transforms using getBoundingClientRect() */
        /* setup curved SVG paths using end points */
        const rectLeft = mCArray[1].getBoundingClientRect();
        const rectRight = mCArray[2].getBoundingClientRect();

        var draw1 = "M " + mPoleData[1].x + ", " + mPoleData[1].y + " C " + mPoleData[1].x + ", " + mPoleData[1].y + " " + rectLeft.left + ", " + rectLeft.top + " " + mPoleData[0].x + ", " + mPoleData[0].y;
        var draw2 = "M " + mPoleData[0].x + ", " + mPoleData[0].y + " C " + mPoleData[0].x + ", " + mPoleData[0].y + " " + rectRight.right + ", " + rectRight.bottom + " " + mPoleData[1].x + ", " + mPoleData[1].y;
        gsap.set(mLArray[j][0], { attr:{ d: draw1 } });
        gsap.set(mLArray[j][1], { attr:{ d: draw2 } });
  
    }

 }

addEventListener("resize", (event) => {
    getMPoleData( mPoles[0], 0 );
    getMPoleData( mPoles[1], 1 );
})

var slideVarsArray = {
    "--duration": { type: "slider", min: 500, max: 3000, default: 2000,  unit: "ms" },
    "--strokeWidth": { type: "slider", min: 10, max: 80, default: 30,  unit: "" },
    "--arch": { type: "slider", min: 1, max: 20, default: 10,  unit: "" },
}
slideVars.init(slideVarsArray);

let timer, archVal = 1;
const styleObserver = new MutationObserver((mutations) => {

	if (timer)
        clearTimeout(timer);
	
    timer = setTimeout(() => { /* 0.5s Throttling */
			
        const archVal = mutations[0].target.style.getPropertyValue('--arch');
        
        if( archVal != arch )
        {
            arch = archVal;
            getMPoleData( mPoles[0], 0 );
            getMPoleData( mPoles[1], 1 );
        }

    }, 500);

});
styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'], });