/* ============================================================
   THE TRUTH MACHINE — JavaScript
   Demonstrates JavaScript boolean, truthy, and falsy behavior
   ============================================================ */

"use strict";

// ============================================================
// STATE — single source of truth (pun intended)
// ============================================================
const state = {
	answers: {
		q1: null, // radio: true/false
		q2: null, // text input: truthy/falsy via !!value
		q3: null, // checkbox quiz: score-based
		q4: null, // slider: 0 = falsy
		q5: null // trick question: "false" string
	},
	score: 0,
	totalAnswered: 0
};

// ============================================================
// PURE BOOLEAN UTILITIES
// ============================================================

/**
 * toBoolean — maps a user input value to a JavaScript boolean
 * using actual JS truthy/falsy rules. This IS the challenge theme.
 * @param {*} value - any JS value
 * @returns {boolean}
 */
function toBoolean(value) {
	return !!value;
}

/**
 * parseEdgeCase — converts our edge-case button data-val strings
 * to the actual JS values they represent
 * @param {string} key
 * @returns {*} the actual JS value
 */
function parseEdgeCase(key) {
	const map = {
		0: 0, // falsy: number zero
		"": "", // falsy: empty string
		"0str": "0", // TRUTHY: non-empty string
		false_str: "false", // TRUTHY: non-empty string
		space: " ", // TRUTHY: whitespace string
		null: null, // falsy: null
		NaN: NaN, // falsy: NaN
		1: 1 // TRUTHY: number 1
	};
	return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : key;
}

/**
 * getEdgeCaseMicrocopy — returns educational microcopy for edge cases
 * @param {string} key
 * @returns {string}
 */
function getEdgeCaseMicrocopy(key) {
	const copy = {
		0: "0 is falsy — the only falsy number (besides -0 and 0n)",
		"": 'Empty string "" is falsy. No characters = no truth.',
		"0str": "\"0\" is truthy — it's a non-empty string! Looks zero, isn't falsy.",
		false_str: '"false" is truthy — it\'s a string, not the boolean false.',
		space: '" " is truthy — whitespace counts as content.',
		null: "null is falsy — intentional absence of value.",
		NaN: "NaN is falsy — Not a Number means not truthy either.",
		1: "1 is truthy. Any non-zero number is truthy."
	};
	return copy[key] || "";
}

/**
 * getDisplayString — renders an actual JS value as a display string
 * @param {*} value
 * @returns {string}
 */
function getDisplayString(value) {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (typeof value === "string") return `"${value}"`;
	if (typeof value === "number" && isNaN(value)) return "NaN";
	return String(value);
}

/**
 * calculateTruthScore — normalized 0–1 based on answered questions
 * @param {object} answers
 * @returns {number} 0–1
 */
function calculateTruthScore(answers) {
	const values = Object.values(answers).filter((v) => v !== null);
	if (values.length === 0) return 0;
	const trueCount = values.filter(Boolean).length;
	return trueCount / values.length;
}

/**
 * getVerdict — returns a theme string based on score
 * @param {number} score - 0 to 1
 * @param {number} answered - how many questions answered
 * @returns {string} 'neutral' | 'truthy' | 'falsy' | 'schrodinger'
 */
function getVerdict(score, answered) {
	if (answered === 0) return "neutral";
	if (score === 0.5) return "schrodinger";
	if (score > 0.5) return "truthy";
	return "falsy";
}

// ============================================================
// DOM HELPERS
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function setBadge(id, value) {
	const el = $(`#badge-${id}`);
	if (!el) return;
	// null = unanswered
	if (value === null) {
		el.textContent = "—";
		el.className = "tm-verdict-badge";
		return;
	}
	// Boolean: true renders as TRUTHY, false as FALSY
	const isTruthy = toBoolean(value);
	el.textContent = isTruthy ? "✓ TRUTHY" : "✗ FALSY";
	el.className = `tm-verdict-badge tm-verdict-badge--${
		isTruthy ? "true" : "false"
	}`;
}

function setCardState(id, value) {
	const card = $(`#card-${id}`);
	if (!card) return;
	card.classList.remove("tm-card--truthy", "tm-card--falsy");
	if (value === null) return;
	card.classList.add(toBoolean(value) ? "tm-card--truthy" : "tm-card--falsy");
}

// ============================================================
// UI UPDATE — called whenever state changes
// ============================================================

function updateUI() {
	const score = calculateTruthScore(state.answers);
	state.score = score;
	const answered = Object.values(state.answers).filter((v) => v !== null).length;
	const verdict = getVerdict(score, answered);
	const percent = Math.round(score * 100);

	// --- Meter ---
	const meterFill = $("#meterFill");
	const meterScore = $("#meterScore");
	const meterTrack = $(".tm-meter__track");
	const meterVerdict = $("#meterVerdict");

	meterFill.style.height = `${percent}%`;
	meterScore.textContent = answered > 0 ? `${percent}%` : "";
	meterTrack.setAttribute("aria-valuenow", percent);

	// --- Theme class on root ---
	const machine = $("#truthMachine");
	machine.classList.remove(
		"truth-machine--truthy",
		"truth-machine--falsy",
		"truth-machine--schrodinger"
	);
	if (verdict !== "neutral") {
		machine.classList.add(`truth-machine--${verdict}`);
	}

	// --- Verdict text in meter ---
	let verdictText = "AWAITING\nINPUT";
	if (answered > 0) {
		if (score === 1) verdictText = "ABSOLUTE\nTRUTH";
		else if (score === 0) verdictText = "PURE\nFALSEHOOD";
		else if (verdict === "schrodinger") verdictText = "SCHRÖ\nDINGER";
		else if (verdict === "truthy") verdictText = "MOSTLY\nTRUE";
		else verdictText = "MOSTLY\nFALSE";
	}
	$("#meterVerdict .tm-meter__verdict-text").innerHTML = verdictText.replace(
		"\n",
		"<br>"
	);

	// --- Announce to screen reader ---
	if (answered > 0) {
		$(
			"#liveAnnounce"
		).textContent = `Truth score: ${percent}%. ${verdictText.replace(
			"<br>",
			" "
		)}.`;
	}

	// --- Easter egg messages ---
	if (score === 1 && answered >= 3) {
		showEasterEgg(
			"⊛ ABSOLUTE TRUTH — All inputs resolve to truthy. Pure signal."
		);
	} else if (score === 0 && answered >= 3) {
		showEasterEgg(
			"⊘ PURE FALSEHOOD — Everything is falsy. The void stares back."
		);
	} else if (verdict === "schrodinger" && answered >= 2) {
		showEasterEgg(
			"◈ SCHRÖDINGER'S BOOLEAN — Equally true and false. The cat is alive and dead."
		);
	} else {
		clearEasterEgg();
	}
}

// ============================================================
// EASTER EGG BANNER
// ============================================================
let eggEl = null;

function showEasterEgg(msg) {
	if (!eggEl) {
		eggEl = document.createElement("div");
		eggEl.className = "tm-egg";
		eggEl.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.15em;
      color: var(--accent); background: var(--surface); border: 1px solid var(--border);
      padding: 10px 20px; border-radius: 4px; z-index: 200;
      box-shadow: 0 0 20px var(--glow); max-width: 90vw; text-align: center;
      transition: opacity 0.4s ease;
    `;
		document.body.appendChild(eggEl);
	}
	eggEl.textContent = msg;
	eggEl.style.opacity = "1";
}

function clearEasterEgg() {
	if (eggEl) eggEl.style.opacity = "0";
}

// ============================================================
// Q1 — Classic radio boolean
// ============================================================
$$('input[name="q1"]').forEach((input) => {
	input.addEventListener("change", () => {
		// Store actual boolean — the answer is literally "is this true or false?"
		const isTrue = input.value === "true";
		state.answers.q1 = isTrue;
		setBadge("q1", isTrue);
		setCardState("q1", isTrue);
		updateUI();
	});
});

// ============================================================
// Q2 — Truthy/Falsy text input lab
// ============================================================

function processQ2Input(rawValue, label) {
	const raw = $("#q2raw");
	const result = $("#q2result");
	const analysis = $("#q2analysis");

	// The boolean magic — !!value is the core demo
	const isTruthy = toBoolean(rawValue);
	state.answers.q2 = isTruthy;

	raw.textContent = label || getDisplayString(rawValue);
	result.textContent = isTruthy ? "!! → true (TRUTHY)" : "!! → false (FALSY)";
	result.className = `tm-analysis__result tm-analysis__result--${
		isTruthy ? "truthy" : "falsy"
	}`;
	analysis.style.display = "flex";

	setBadge("q2", isTruthy);
	setCardState("q2", isTruthy);
	updateUI();
}

$("#q2input").addEventListener("input", (e) => {
	const raw = e.target.value;
	// Use the actual string value — non-empty strings are truthy
	processQ2Input(raw, `"${raw}"`);
});

// Edge case buttons — load actual JS values
$$(".tm-edge").forEach((btn) => {
	btn.addEventListener("click", () => {
		const key = btn.dataset.val;
		const actualValue = parseEdgeCase(key);
		const displayStr = getDisplayString(actualValue);

		// Update the input field visually
		const input = $("#q2input");
		input.value = displayStr;

		// Show microcopy hint below
		const existingHint = btn.closest(".tm-card").querySelector(".tm-edge-hint");
		if (existingHint) existingHint.remove();

		const hint = document.createElement("p");
		hint.className = "tm-card__hint tm-edge-hint";
		hint.style.color = toBoolean(actualValue)
			? "var(--c-true-accent)"
			: "var(--c-false-accent)";
		hint.textContent = getEdgeCaseMicrocopy(key);
		btn.closest(".tm-card__edgecases").after(hint);

		processQ2Input(actualValue, displayStr);
	});
});

// ============================================================
// Q3 — Checkbox quiz: score based on correct answers
// ============================================================
$$("#card-q3 .tm-check__input").forEach((checkbox) => {
	checkbox.addEventListener("change", evaluateQ3);
});

function evaluateQ3() {
	const checkboxes = $$("#card-q3 .tm-check__input");
	const checked = $$("#card-q3 .tm-check__input:checked");

	if (checked.length === 0) {
		state.answers.q3 = null;
		setBadge("q3", null);
		setCardState("q3", null);
		$("#q3hint").textContent = "";
		updateUI();
		return;
	}

	// Score: how many selections match the actual truthy property
	let correct = 0;
	let total = 0;

	checkboxes.forEach((cb) => {
		const isActuallyTruthy = cb.dataset.truthy === "true";
		const isChecked = cb.checked;
		total++;
		// Correct if: checked+truthy OR unchecked+falsy
		if (isChecked === isActuallyTruthy) correct++;
	});

	const accuracy = correct / total;
	// q3 answer is truthy if user gets > 50% correct
	const q3value = accuracy > 0.5;

	state.answers.q3 = q3value;
	setBadge("q3", q3value);
	setCardState("q3", q3value);

	const pct = Math.round(accuracy * 100);
	const hint = $("#q3hint");
	if (accuracy === 1) {
		hint.textContent = `Perfect — ${pct}% correct! You know your truthy from falsy.`;
		hint.style.color = "var(--c-true-accent)";
	} else if (accuracy >= 0.5) {
		hint.textContent = `${pct}% correct. Close — remember: "0" and [] are truthy!`;
		hint.style.color = "var(--accent)";
	} else {
		hint.textContent = `${pct}% correct. Falsy values in JS are rarer than you think!`;
		hint.style.color = "var(--c-false-accent)";
	}

	updateUI();
}

// ============================================================
// Q4 — Slider: 0 is the only falsy number
// ============================================================
const slider = $("#q4slider");
const sliderOutput = $("#q4output");

slider.addEventListener("input", () => {
	const val = Number(slider.value);
	sliderOutput.textContent = val;

	// JavaScript coerces 0 to false — key demo point
	const isTruthy = toBoolean(val);
	state.answers.q4 = isTruthy;
	setBadge("q4", isTruthy);
	setCardState("q4", isTruthy);

	// Visual feedback on output
	sliderOutput.style.color = isTruthy
		? "var(--c-true-accent)"
		: "var(--c-false-accent)";
	sliderOutput.style.textShadow = isTruthy
		? "0 0 20px rgba(0,255,136,0.5)"
		: "0 0 20px rgba(255,0,64,0.5)";

	updateUI();
});

// ============================================================
// Q5 — Trick question: "false" (string) is truthy
// ============================================================
$$('input[name="q5"]').forEach((input) => {
	input.addEventListener("change", () => {
		// The CORRECT answer: "false" string is TRUTHY (not falsy)
		// User selects "Yes, it's falsy" = value "true" = WRONG
		// User selects "No, it's truthy" = value "false" = CORRECT
		const userSaysItsFalsy = input.value === "true";
		const isCorrect = !userSaysItsFalsy; // correct = it IS truthy, not falsy

		state.answers.q5 = isCorrect;
		setBadge("q5", isCorrect);
		setCardState("q5", isCorrect);

		const reveal = $("#q5reveal");
		if (userSaysItsFalsy) {
			reveal.textContent =
				'✗ Trick! "false" is a non-empty string — JavaScript sees it as truthy.';
			reveal.style.color = "var(--c-false-accent)";
		} else {
			reveal.textContent =
				"✓ Correct! Only the boolean false (not the string) is falsy.";
			reveal.style.color = "var(--c-true-accent)";
		}

		updateUI();
	});
});

// ============================================================
// RANDOMIZE — dramatic jump between states
// ============================================================
$("#btnRandomize").addEventListener("click", () => {
	// Randomize all radio questions
	const q1 = Math.random() > 0.5;
	$$('input[name="q1"]').forEach((r) => {
		r.checked = (r.value === "true") === q1;
	});
	state.answers.q1 = q1;
	setBadge("q1", q1);
	setCardState("q1", q1);

	// Randomize text input — pick a random edge case
	const edgeKeys = ["0", "", "0str", "false_str", "space", "null", "NaN", "1"];
	const randomKey = edgeKeys[Math.floor(Math.random() * edgeKeys.length)];
	const randomVal = parseEdgeCase(randomKey);
	$("#q2input").value = getDisplayString(randomVal);
	processQ2Input(randomVal, getDisplayString(randomVal));

	// Randomize checkboxes
	$$("#card-q3 .tm-check__input").forEach((cb) => {
		cb.checked = Math.random() > 0.5;
	});
	evaluateQ3();

	// Randomize slider
	const sliderVal = Math.floor(Math.random() * 11) - 5;
	slider.value = sliderVal;
	slider.dispatchEvent(new Event("input"));

	// Randomize Q5
	const q5 = Math.random() > 0.5;
	$$('input[name="q5"]').forEach((r) => {
		r.checked = (r.value === "true") === q5;
	});
	$$('input[name="q5"]')[0].dispatchEvent(new Event("change"));

	updateUI();
});

// ============================================================
// RESET — clear everything
// ============================================================
$("#btnReset").addEventListener("click", () => {
	// Clear all radio/checkbox inputs
	$$('input[type="radio"], input[type="checkbox"]').forEach((i) => {
		i.checked = false;
	});

	// Clear text input
	$("#q2input").value = "";
	const raw = $("#q2raw");
	const result = $("#q2result");
	raw.textContent = "";
	result.textContent = "";
	result.className = "tm-analysis__result";

	// Reset slider
	slider.value = 0;
	sliderOutput.textContent = "0";
	sliderOutput.style.color = "";
	sliderOutput.style.textShadow = "";

	// Clear reveal text
	$("#q5reveal").textContent = "";
	$("#q3hint").textContent = "";

	// Remove edge case hints
	$$(".tm-edge-hint").forEach((h) => h.remove());

	// Reset state
	Object.keys(state.answers).forEach((k) => {
		state.answers[k] = null;
	});
	state.score = 0;

	// Reset badges and card states
	Object.keys(state.answers).forEach((k) => {
		setBadge(k, null);
		setCardState(k, null);
	});

	updateUI();
});

// ============================================================
// INIT — set initial state
// ============================================================
(function init() {
	// Initialize slider to show boolean value of 0
	sliderOutput.textContent = "0";
	sliderOutput.style.color = "var(--c-false-accent)";

	// Call updateUI to set initial neutral state
	updateUI();
})();