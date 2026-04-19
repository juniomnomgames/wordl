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


/* =========================
   INIT
========================= */

async function initData() {
  flatPeople = [];

  for (const cat of Object.keys(people)) {
    for (const p of people[cat]) {

      // ✅ get real thumbnail from Wikipedia
      const img = await fetchWikiImage(p.name);

      flatPeople.push({
        ...p,
        category: cat,
        image: img
      });
    }
  }
}

let imageCache = {};

async function fetchWikiImage(name) {
  if (imageCache[name]) return imageCache[name];

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    const data = await res.json();

    const img = data.originalimage?.source || data.thumbnail?.source || null;
    imageCache[name] = img;
    return img;

  } catch {
    return null;
  }
}
function pickRandomPerson() {
  target = flatPeople[Math.floor(Math.random() * flatPeople.length)];
  console.log("TARGET:", target?.name);
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

  if (target) target._revealMap = null;
  if (target) target._usedHints = [];

  currentResults = [];
  activeIndex = -1;

  guessCount = 0;

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

    li.innerHTML = `
      <img src="${person.image}" class="avatar"
           onerror="this.style.display='none'"/>
      <span>${person.name}</span>
    `;

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

  // 👉 directly trigger guess logic (no fake button click)
  handleGuess();
}

function handleGuess() {
  if (!target) {
  console.warn("Target not ready yet");
  return;
}
  const guess = searchInput.value.trim().toLowerCase();
  if (!guess) return;

  const guessed =
    selected ||
    flatPeople.find(p => p.name.toLowerCase() === guess);

  selected = null;

  // ❌ invalid guess → don't count it
  if (!guessed) return;

  // ❌ duplicate → don't count it
  if (guessedNames.has(guessed.name)) {
    feedback.innerHTML = "⚠️ Already guessed!";
    searchInput.value = "";
    return;
  }

  // ✅ NOW it's a real guess → increment
  guessCount++;

  guessedNames.add(guessed.name);

  if (guessed.name === target.name) {
  feedback.innerHTML = "🎉 Correct!";
  updateTraitBox(guessed);

  // 🎉 CONFETTI BURST
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 }
  });

  // 🎉 EXTRA BURSTS (feels way better)
  setTimeout(() => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  }, 200);

  searchInput.value = "";
  return;
}

  updateTraitBox(guessed);
  feedback.innerHTML = "❌ Try again...";

  // ✅ hints now trigger properly
  if (guessCount > 3) showHint();

  searchInput.value = "";
}
/* =========================
   TRAITS
========================= */

function updateTraitBox(g) {
  traitBox.innerHTML = "";

  const traits = [
    { label: "Category", guess: g.category, target: target.category },
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
   HINT SYSTEM (UNCHANGED LOGIC)
========================= */

function showHint() {
  if (!target) return;

  if (!target._usedHints) target._usedHints = [];

  const name = target.name;

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

  // 🔤 ONE LINE REVEAL
  const letters = name.split("");

  if (!target._revealMap) {
    target._revealMap = Array(letters.length).fill(false);
  }

  const hidden = [];

  letters.forEach((c, i) => {
    if (c !== " " && !target._revealMap[i]) hidden.push(i);
  });

  if (hidden.length > 0) {
    const pick = hidden[Math.floor(Math.random() * hidden.length)];
    target._revealMap[pick] = true;
  }

  const revealed = letters.map((c, i) => {
    if (c === " ") return " ";
    return target._revealMap[i] ? c : "_";
  }).join("");

  let live = document.getElementById("liveHintLine");

  if (!live) {
    live = document.createElement("div");
    live.id = "liveHintLine";
    live.className = "hint-line hint-blank";
    hintBox.appendChild(live);
  }

  live.textContent = `🔤 ${revealed}`;
}
/* =========================
   KEYBOARD NAVIGATION
========================= */

searchInput.addEventListener("keydown", (e) => {
  if (!currentResults.length) return;

  // ⬇️ DOWN ARROW
  if (e.key === "ArrowDown") {
    e.preventDefault();

    activeIndex = (activeIndex + 1) % currentResults.length;
    renderDropdown();
    scrollToActiveItem();
  }

  // ⬆️ UP ARROW
  if (e.key === "ArrowUp") {
    e.preventDefault();

    activeIndex =
      (activeIndex - 1 + currentResults.length) % currentResults.length;

    renderDropdown();
    scrollToActiveItem();
  }

  // ⏎ ENTER
  if (e.key === "Enter") {
    e.preventDefault();

    if (activeIndex >= 0) {
      selectPerson(currentResults[activeIndex]);
    }
  }

  // ❌ ESC (optional but nice)
  if (e.key === "Escape") {
    results.innerHTML = "";
    currentResults = [];
    activeIndex = -1;
  }
});

/* =========================
   GUESS
========================= */

guessBtn.addEventListener("click", handleGuess);

/* =========================
   START
========================= */

async function startGame() {
  await initData();   // wait for data to load
  pickRandomPerson(); // now target is valid
}

startGame();