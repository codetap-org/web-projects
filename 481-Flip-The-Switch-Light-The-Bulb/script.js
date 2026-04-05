class LightBulb extends HTMLElement {
  static observedAttributes = ["status"];

  constructor() {
    super();
  }
  
  connectedCallback() {
    this.glass = this.querySelector('#glass');
    this.filament = this.querySelector('#filament');
    this.base1 = this.querySelector('#base1');
    this.base2 = this.querySelector('#base2');
    this.base3 = this.querySelector('#base3');
    this.g0 = this.querySelector('#g0');
    this.g1 = this.querySelector('#g1');
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'status') {
      if (newValue == 'on') {
        this.glass.setAttribute('fill', 'url(#bulbGrad)');
        this.glass.setAttribute('stroke', '#e8b820');
        this.filament.setAttribute('stroke', '#fff8dc');
        this.base1.setAttribute('fill', '#c8960a');
        this.base2.setAttribute('fill', '#b07800');
        this.base3.setAttribute('fill', '#906000');
        this.g0.setAttribute('stop-color', '#fff9c4');
        this.g1.setAttribute('stop-color', '#f0c030');
      } else {
        this.glass.setAttribute('fill', '#2a2a3a');
        this.glass.setAttribute('stroke', '#444');
        this.filament.setAttribute('stroke', '#555');
        this.base1.setAttribute('fill', '#444');
        this.base2.setAttribute('fill', '#3a3a3a');
        this.base3.setAttribute('fill', '#333');
      }
    }
  }
}

class ToggleSwitch extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    this.toggler = this.querySelector('input[type="checkbox"]')
    
    this.toggler?.addEventListener('change', this.toggle.bind(this));
  }
  
  toggle(evt) {
    this.dispatchEvent(new CustomEvent('toggle', { detail: { status: evt.target.checked } }));
  }
}

customElements.define('light-bulb', LightBulb);
customElements.define('toggle-switch', ToggleSwitch);

const bulb = document.querySelector('light-bulb');
const bulbSwitch = document.querySelector('toggle-switch');
bulbSwitch?.addEventListener('toggle', (evt) => {
  bulb.setAttribute('status', evt.detail.status ? 'on' : 'off');
});