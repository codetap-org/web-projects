document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('toggle').addEventListener('change', function() {
    const stop1 = document.getElementById('stop1');
    const stop2 = document.getElementById('stop2');
    const stop1Circle = document.getElementById('stop1-circle');
    const stop2Circle = document.getElementById('stop2-circle');
    const stop1Mountain1 = document.getElementById('mountain1-stop1');
    const stop2Mountain1 = document.getElementById('mountain1-stop2');
    const stop1Mountain2 = document.getElementById('mountain2-stop1');
    const stop2Mountain2 = document.getElementById('mountain2-stop2');
    const stop1Mountain3 = document.getElementById('mountain3-stop1');
    const stop2Mountain3 = document.getElementById('mountain3-stop2');
    const stop1Mountain4 = document.getElementById('mountain4-stop1');
    const stop2Mountain4 = document.getElementById('mountain4-stop2');
    
    const body = document.body;

    if (this.checked) {
      body.style.backgroundColor = '#E3FFE1';
      stop1.setAttribute('stop-color', '#9FDEF2');
      stop2.setAttribute('stop-color', '#A8FFAC');
      stop1Circle.setAttribute('stop-color', '#F6F061');
      stop2Circle.setAttribute('stop-color', '#61EDF6');
      stop1Mountain1.setAttribute('stop-color', '#86D2A0');
      stop2Mountain1.setAttribute('stop-color', '#517D91');
      stop1Mountain2.setAttribute('stop-color', '#86D2A0');
      stop2Mountain2.setAttribute('stop-color', '#517D91');
      stop1Mountain3.setAttribute('stop-color', '#86D2A0');
      stop2Mountain3.setAttribute('stop-color', '#517D91');
      stop1Mountain4.setAttribute('stop-color', '#86D2A0');
      stop2Mountain4.setAttribute('stop-color', '#517D91');
    } else {
      body.style.backgroundColor = '#9AB5EC';
      stop1.setAttribute('stop-color', '#6A86EB');
      stop2.setAttribute('stop-color', '#010203');
      stop1Circle.setAttribute('stop-color', '#A5C5EB'); 
      stop2Circle.setAttribute('stop-color', '#51EAFF');
      stop1Mountain1.setAttribute('stop-color', '#6783CA');
      stop2Mountain1.setAttribute('stop-color', '#271B59');
      stop1Mountain2.setAttribute('stop-color', '#6783CA');
      stop2Mountain2.setAttribute('stop-color', '#271B59');
      stop1Mountain3.setAttribute('stop-color', '#6783CA');
      stop2Mountain3.setAttribute('stop-color', '#271B59');
      stop1Mountain4.setAttribute('stop-color', '#6783CA');
      stop2Mountain4.setAttribute('stop-color', '#271B59');
    }
  });
});