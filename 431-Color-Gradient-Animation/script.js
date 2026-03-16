const container = document.querySelector(".bgColor");
const listItems = document.querySelectorAll("li");
gsap.registerPlugin(SplitText);
const container2 = document.querySelector(".bgColor2");
const container4 = document.querySelector(".bgColor6");
const container5 = document.querySelector(".bgColor5");
listItems.forEach((item, index) => {
	// previous li (or itself if first)
	const prev = index - 1;
	const next = index + 1;
	const prevItem = index > 0 ? listItems[prev] : listItems[index];
	const nextItem =
		index < listItems.length - 1 ? listItems[next] : listItems[index];

	// read computed background color of the previous item
	const bgPrevColor = prevItem.textContent;
	const colorValue = item.textContent;
	const bgNextColor = nextItem.textContent;
	const bgActualColor = colorValue;
	//console.log("prev bg:", bgActualColor, "item color:", colorValue);
	let split;
	const tl = gsap.timeline({
		defaults: {
			ease: "power1.inOut"
		},
		scrollTrigger: {
			trigger: item,
			start: "top center",
			end: "bottom center+=205",
			onEnter: () => {
				split = SplitText.create(item, { type: "words, chars,lines" });
				gsap.to(split.chars, {
					color: colorValue,
					stagger: {
						amount: 0.5, // Total stagger time = 1 second across all chars
						from: "random" // Start from first char
					} // 0.05 seconds between each
				});
			},
			onUpdate: (self) => {
				// logs continuously while scrolling this item
			},
			onLeaveBack: () => {
				// optional cleanup
				if (split) {
					split.revert();
					split = null;
				}
			}
		}
	});

	console.log(split);
	tl.to([container2, container, container5, container4], {
		// use template literal so JS inserts variables
		backgroundImage: `linear-gradient(180deg,${bgPrevColor} 0%, ${colorValue} 50%,${bgNextColor} 90%)`,
		duration: 0.5
		// or if you only want a flat color:
		// backgroundColor: colorValue
	});
});