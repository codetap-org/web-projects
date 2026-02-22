const CARDS_PER_PLAYER = 9;
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
];
const SUITS = [
  { symbol: "♥", code: "H", color: "red" },
  { symbol: "♦", code: "D", color: "red" },
  { symbol: "♠", code: "S", color: "black" },
  { symbol: "♣", code: "C", color: "black" }
];

const select = document.querySelector("select");

// Build the entire deck.
const deck = [];
for (const rank of RANKS) {
  for (const suit of SUITS) {
    deck.push({ rank, suit });
  }
}

// Function to shuffle an array.
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to populate the select with card elements.
function populatePlayerDeck(select, cards) {
  cards.forEach((card) => {
    const option = document.createElement("option");
    option.classList.add(card.suit.color);
    option.value = card.rank + card.suit.code;
    option.innerHTML = `
          <span class="rank">${card.rank}</span>
          <span class="suit">${card.suit.symbol}</span>
        `;
    select.appendChild(option);
  });
}

// Shuffle the deck
const shuffledDeck = shuffle([...deck]);

// Take the top N cards for the player.
const playerCards = shuffledDeck.slice(0, CARDS_PER_PLAYER);

// Populate the select element with the player's cards.
populatePlayerDeck(select, playerCards);