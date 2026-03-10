import {Pane} from "https://esm.sh/tweakpane";

const config = {
  dispersion: 30,
  refraction: -125,
  smoothness: 3.3,
  frost: 7.5,
  fresnel: .3,
  scale: 5,
  rotation: 0,
}


// - - -

const ctrl = new Pane({
  title: 'config',
  expanded: false,
})

const roundTo = (num, precision = 2) => {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
}

const ptrUpdate = (e)  => {
  const pointer = e.touches ? e.touches[0] : e;
  const bb = card.getBoundingClientRect();

  const offsetX = (pointer.clientX - (bb.x + bb.width / 2)) / bb.width;
  const offsetY = (pointer.clientY - (bb.y + bb.height / 2)) / bb.height;

  card.style.setProperty("--x", roundTo(offsetX));
  card.style.setProperty("--y", roundTo(offsetY));
}

window.addEventListener("mousemove", ptrUpdate);
window.addEventListener("touchmove", ptrUpdate);

// - - -

const ctrlUpdate = () => {
  [xR,xG,xB].map((t,i) => {
    t.scale.baseVal = config.refraction + ((i - 1) * config.dispersion)
  })
  xFrost.setAttribute("stdDeviation", config.frost)
  xSm.setAttribute("stdDeviation", config.smoothness)
  xFresnel.setAttribute("slope", config.fresnel)
  const encoded = `
    <svg 
        xmlns='http://www.w3.org/2000/svg'
        color-interpolation-filters='sRGB' 
        viewBox='0 0 500 500' width='500' height='500' 
      ><defs>
        <linearGradient id='rg' >
          <stop offset='0' stop-color='#ff8000'/>
          <stop offset='1' stop-color='#008000'/>
        </linearGradient>
        <pattern 
          id='flutes' 
          patternTransform='scale(${1 / config.scale}) rotate(${config.rotation})' 
          preserveAspectRatio='xMidYMid slice' 
          width='100' height='100' viewBox='0 0 100 100' 
          patternUnits='userSpaceOnUse'>
          <rect width='100' height='100' style='fill: url(#rg);'/>
        </pattern>
      </defs>
      <rect id='pattern' fill='url(#flutes)' width='100%' height='100%'/>
    </svg>
    `
  xPatt.href.baseVal = `data:image/svg+xml,${encodeURIComponent(encoded)}`
}

// - - -

ctrl
  .addBinding(config, 'dispersion', {
    min: 0,
    max: 50,
    step: 0.5,
  })

ctrl
  .addBinding(config, 'refraction', {
    min: -200,
    max: 200,
    step: 1,
  })

ctrl
  .addBinding(config, 'smoothness', {
    min: 0,
    max: 10,
    step: 0.1,
  })

ctrl
  .addBinding(config, 'frost', {
    min: 0,
    max: 20,
    step: 0.1,
  })

ctrl
  .addBinding(config, 'scale', {
    min: 0.01,
    max: 8,
    step: 0.05,
  })

ctrl
  .addBinding(config, 'rotation', {
    min: 0,
    max: 360,
    step: 1,
  })

ctrl
  .addBinding(config, 'fresnel', {
    min: 0,
    max: 1,
    step: 0.01,
  })

ctrl.on('change', ctrlUpdate)
ctrlUpdate()