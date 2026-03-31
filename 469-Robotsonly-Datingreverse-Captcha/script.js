const captchaRow = document.getElementById("captchaRow");
const registerBtn = document.getElementById("registerBtn");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");
const clearBtn = document.getElementById("clearBtn");
const confirmBtn = document.getElementById("confirmBtn");
const pageMessage = document.getElementById("pageMessage");
const checkMark = document.getElementById("checkMark");
const tiles = Array.from(document.querySelectorAll(".tile"));

let blockedAsHuman = false;

function openCaptcha() {
	if (blockedAsHuman) return;
	overlay.classList.add("open");
}

function closeCaptcha() {
	overlay.classList.remove("open");
}

captchaRow.addEventListener("click", openCaptcha);
registerBtn.addEventListener("click", openCaptcha);
closeBtn.addEventListener("click", closeCaptcha);

overlay.addEventListener("click", (e) => {
	if (e.target === overlay) closeCaptcha();
});

tiles.forEach((tile) => {
	tile.addEventListener("click", () => {
		tile.classList.toggle("selected");
	});
});

clearBtn.addEventListener("click", () => {
	tiles.forEach((tile) => tile.classList.remove("selected"));
});

confirmBtn.addEventListener("click", () => {
	const selectedCount = tiles.filter((tile) =>
		tile.classList.contains("selected")
	).length;

	if (selectedCount === 0) {
		pageMessage.textContent =
			"That felt suspiciously robotic. Try clicking some squares.";
		pageMessage.className = "message bad";
		closeCaptcha();
		return;
	}

	blockedAsHuman = true;
	captchaRow.classList.remove("checked");
	checkMark.textContent = "";
	registerBtn.disabled = true;
	registerBtn.textContent = "Registration denied";
	pageMessage.textContent = "You appear to be human, you may not register.";
	pageMessage.className = "message bad";
	closeCaptcha();
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") closeCaptcha();
});