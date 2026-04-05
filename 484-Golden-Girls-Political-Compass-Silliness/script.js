var container = document.getElementById("container");
var roseQuoteHolder = document.getElementById("roseQuotes");

roseQuoteHolder.style.opacity = 0;
function rose(index) {
	// random rose quote
	roseQuoteHolder.style.opacity = 1;
	var mouseX = event.clientX;
	var mouseY = event.clientY;

	var random = Math.floor(Math.random() * 10);
	console.log("clicked", mouseX, mouseY);

	roseQuoteHolder.innerHTML = roseQuotes[random] + "<br/>-Rose Nylund";
	roseQuoteHolder.style.top = mouseY + "px";
	roseQuoteHolder.style.left = mouseX + "px";
}

var roseQuotes = [
	"You know what they say: You can lead a herring to water, but you have to walk really fast or else he'll die!",
	"Oh, blow it out your tubenburbles!",
	"I thought you wore too much makeup and were a slut. I was wrong. You don’t wear too much makeup.",
	"Like we say in St. Olaf, Christmas without fruitcake is like St. Sigmund's Day without the headless boy.",
	"Sometimes life just isn’t fair, kiddo.",
	"Norwegians are notoriously bad at Spanish.",
	"Boy, if I wasn't going, I'd really be jealous of me.",
	"I don't understand how a thermos keeps things both hot and cold.",
	"If you hold a bird gently, the bird will stay. But if you squeeze the bird, his eyes will bug out.",
	"The older you get the better you get. Unless you’re a banana."
];