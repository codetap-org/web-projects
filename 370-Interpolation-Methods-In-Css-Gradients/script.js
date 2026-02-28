const root = document.querySelector(":root");
function changeVar(variable, value, postfix) {
	root.style.setProperty(variable, "" + value + postfix);
}