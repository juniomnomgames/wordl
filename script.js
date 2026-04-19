
const searchInput = document.getElementById("search");
const results = document.getElementById("results");
const feedback = document.getElementById("feedback");
const hintBox = document.getElementById("hintBox");
const guessBtn = document.getElementById("guessBtn");

const traitBox = document.getElementById("traitBox");
const historyBox = document.getElementById("guessHistory");

let flatPeople = [];
let target = null;
let selected = null;

let guessHistory = [];
let guessedNames = new Set();

/* =========================
   STATE
========================= */

let currentResults = [];
let activeIndex = -1;

let guessCount = 0;
let hintIndex = 0;

/* =========================
   INIT
========================= */

function initData() {
  flatPeople = [];
  Object.keys(people).forEach(cat => {
    people[cat].forEach(p => {
      flatPeople.push({ ...p, category: cat });
    });
  });
}

function pickRandomPerson() {
  target = flatPeople[Math.floor(Math.random() * flatPeople.length)];
}

function resetGame() {
  selected = null;
  guessHistory = [];
  guessedNames = new Set();

  searchInput.value = "";
  results.innerHTML = "";
  feedback.innerHTML = "";
  hintBox.innerHTML = "";
  traitBox.innerHTML = "";
  historyBox.innerHTML = "";

if (target) target._usedHints = [];
  currentResults = [];
  activeIndex = -1;

  guessCount = 0;
  hintIndex = 0;

  pickRandomPerson();
}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  activeIndex = -1;

  if (!q) {
    results.innerHTML = "";
    currentResults = [];
    return;
  }

  currentResults = flatPeople.filter(p =>
    p.name.toLowerCase().includes(q)
  );

  renderDropdown();
});

/* =========================
   DROPDOWN
========================= */

function renderDropdown() {
  results.innerHTML = "";

  currentResults.forEach((person, index) => {
    const li = document.createElement("li");
    li.textContent = person.name;

    if (index === activeIndex) li.classList.add("active");

    li.onclick = () => selectPerson(person);

    results.appendChild(li);
  });
}

/* =========================
   SCROLL
========================= */

function scrollToActiveItem() {
  const items = results.querySelectorAll("li");
  const activeItem = items[activeIndex];
  if (!activeItem) return;

  activeItem.scrollIntoView({
    block: "nearest",
    behavior: "smooth"
  });
}

/* =========================
   SELECT
========================= */

function selectPerson(person) {
  selected = person;
  searchInput.value = person.name;
  results.innerHTML = "";
  currentResults = [];
  activeIndex = -1;
  guessBtn.click();
}

/* =========================
   KEYBOARD NAV
========================= */

searchInput.addEventListener("keydown", (e) => {
  if (!currentResults.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex++;
    if (activeIndex >= currentResults.length) activeIndex = 0;
    renderDropdown();
    scrollToActiveItem();
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex--;
    if (activeIndex < 0) activeIndex = currentResults.length - 1;
    renderDropdown();
    scrollToActiveItem();
  }

  if (e.key === "Enter") {
    e.preventDefault();

    if (activeIndex >= 0 && currentResults[activeIndex]) {
      selectPerson(currentResults[activeIndex]);
    } else if (currentResults.length > 0) {
      selectPerson(currentResults[0]);
    } else {
      guessBtn.click();
    }
  }
});

/* =========================
   TRAITS
========================= */

function updateTraitBox(g) {
  traitBox.innerHTML = "";

  const traits = [
    { label: "Category", guess: g.category.charAt(0).toUpperCase() + g.category.slice(1), target: target.category },
    { label: "Field", guess: g.field, target: target.field },
    { label: "Nationality", guess: g.nationality, target: target.nationality },
    { label: "Continent", guess: g.continent, target: target.continent },
    { label: "Alive", guess: g.alive ? "Alive" : "Dead", target: target.alive ? "Alive" : "Dead" },
    { label: "Age", guess: g.age, target: target.age, age: true }
  ];

  guessHistory.push(traits);
  renderHistory();

  traits.forEach(t => {
    const div = document.createElement("div");
    div.className = "trait-row";

    let display = t.guess;
    let correct = t.guess === t.target;

    if (t.age) {
      display =
        g.age > target.age ? `${g.age} ↓` :
        g.age < target.age ? `${g.age} ↑` :
        `${g.age}`;
    }

    div.innerHTML = `
      <span>${t.label}</span>
      <span style="color:${correct ? "#22c55e" : "#ef4444"}">
        ${display}
      </span>
    `;

    traitBox.appendChild(div);
  });
}

/* =========================
   HISTORY
========================= */

function renderHistory() {
  historyBox.innerHTML = "";

  const reversed = [...guessHistory].reverse();

  reversed.forEach(guess => {
    const row = document.createElement("div");
    row.className = "guess-row";

    guess.forEach(t => {
      const block = document.createElement("div");

      let display = t.guess;
      let correct = t.guess === t.target;

      if (t.age) {
        display =
          t.guess > t.target ? `${t.guess} ↓` :
          t.guess < t.target ? `${t.guess} ↑` :
          `${t.guess}`;
      }

      block.className = `guess-block ${correct ? "block-good" : "block-bad"}`;
      block.textContent = display;

      row.appendChild(block);
    });

    historyBox.appendChild(row);
  });
}

/* =========================
   🎉 CONFETTI
========================= */

function launchConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 6,
      spread: 70,
      startVelocity: 35,
      origin: { x: Math.random(), y: Math.random() - 0.2 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/* =========================
   💡 HINT SYSTEM
========================= */

function showHint() {
  if (!target) return;

  // Ensure used storage exists
  if (!target._usedHints) target._usedHints = [];

  const name = target.name;

  // =========================
  // GUESS 4–6 → NORMAL HINTS
  // =========================
  if (guessCount <= 6) {
    if (!target.hints || target.hints.length === 0) return;

    const available = target.hints.filter(
      h => !target._usedHints.includes(h)
    );

    if (available.length === 0) return;

    const hint =
      available[Math.floor(Math.random() * available.length)];

    target._usedHints.push(hint);

    const div = document.createElement("div");
    div.textContent = `💡 ${hint}`;
    hintBox.appendChild(div);

    return;
  }

  // =========================
  // GUESS 7+ → NAME FILL-IN BLANK
  // =========================

  const letters = target.name.split("");

// create persistent reveal state once
if (!target._revealMap) {
  target._revealMap = Array(letters.length).fill(false);
}

// get all hidden letter indexes (ignore spaces)
const hiddenIndexes = [];

letters.forEach((char, i) => {
  if (char !== " " && !target._revealMap[i]) {
    hiddenIndexes.push(i);
  }
});

// reveal ONLY ONE letter per guess
if (hiddenIndexes.length > 0) {
  const randIndex =
    hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];

  target._revealMap[randIndex] = true;
}

// build display (NO randomness)
const revealed = letters
  .map((char, i) => {
    if (char === " ") return " ";
    return target._revealMap[i] ? char : "_";
  })
  .join("");

// create ONE line only
let liveHint = document.getElementById("liveHintLine");

if (!liveHint) {
  liveHint = document.createElement("div");
  liveHint.id = "liveHintLine";
  liveHint.className = "hint-line hint-blank";
  hintBox.appendChild(liveHint);
}

// overwrite same line
liveHint.textContent = `🔤 ${revealed}`;
}

/* =========================
   GUESS
========================= */

guessBtn.addEventListener("click", () => {
  const guess = searchInput.value.trim().toLowerCase();
  if (!guess) return;

  guessCount++;

  const guessed =
    selected ||
    flatPeople.find(p => p.name.toLowerCase() === guess);

  selected = null;

  if (!guessed) return;

  if (guessedNames.has(guessed.name)) {
    feedback.innerHTML = "⚠️ Already guessed!";
    searchInput.value = "";
    return;
  }

  guessedNames.add(guessed.name);

  if (guessed.name === target.name) {
    feedback.innerHTML = "🎉 Correct!";
    updateTraitBox(guessed);

    launchConfetti();

    searchInput.value = "";
    return;
  }

  updateTraitBox(guessed);
  feedback.innerHTML = "❌ Try again...";

  // 🔥 HINT TRIGGER
  if (guessCount > 3) {
    showHint();
  }

  searchInput.value = "";
  selected = null;
});

/* =========================
   START
========================= */

initData();
pickRandomPerson();