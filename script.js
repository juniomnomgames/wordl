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

let currentResults = [];
let activeIndex = -1;

let guessCount = 0;

/* =========================
   WIKIPEDIA IMAGE FETCH
========================= */

async function fetchWikiImage(name) {
  try {
    const url =
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;

    const res = await fetch(url);
    const data = await res.json();

    return data.thumbnail?.source || null;
  } catch (e) {
    return null;
  }
}

/* =========================
   INIT DATA
========================= */

async function initData() {
  flatPeople = [];

  for (const cat of Object.keys(people)) {
    for (const p of people[cat]) {

      const image = await fetchWikiImage(p.name);

      flatPeople.push({
        ...p,
        category: cat,
        image
      });
    }
  }
}

function pickRandomPerson() {
  target = flatPeople[Math.floor(Math.random() * flatPeople.length)];
}

/* =========================
   RESET GAME
========================= */

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

  if (target) {
    target._revealMap = null;
    target._usedHints = null;
  }

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
  if (!currentResults) return;

  results.innerHTML = "";

  currentResults.forEach((person, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${
        person.image
          ? `<img src="${person.image}" class="avatar"
              onerror="this.style.display='none'"/>`
          : `<div class="avatar placeholder"></div>`
      }
      <span>${person.name}</span>
    `;

    if (index === activeIndex) {
      li.classList.add("active");
    }

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
   SELECT PERSON
========================= */

function selectPerson(person) {
  selected = person;

  searchInput.value = person.name;

  results.innerHTML = "";
  currentResults = [];
  activeIndex = -1;

  setTimeout(() => {
    guessBtn.click();
  }, 0);
}

/* =========================
   KEYBOARD CONTROLS (FIXED)
========================= */

searchInput.addEventListener("keydown", (e) => {
  if (!currentResults.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();

    activeIndex = (activeIndex + 1) % currentResults.length;

    renderDropdown();
    scrollToActiveItem();
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();

    activeIndex =
      (activeIndex - 1 + currentResults.length) %
      currentResults.length;

    renderDropdown();
    scrollToActiveItem();
  }

  if (e.key === "Enter") {
    e.preventDefault();

    if (activeIndex >= 0 && currentResults[activeIndex]) {
      selectPerson(currentResults[activeIndex]);
      return;
    }

    if (currentResults.length > 0) {
      selectPerson(currentResults[0]);
      return;
    }

    guessBtn.click();
  }
});

/* =========================
   TRAITS (UNCHANGED)
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
   HISTORY (UNCHANGED)
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
   HINT SYSTEM (UNCHANGED)
========================= */

function showHint() {
  if (!target) return;

  if (!target._usedHints) target._usedHints = [];

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

  const letters = target.name.split("");

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
   GUESS LOGIC
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
    searchInput.value = "";
    return;
  }

  updateTraitBox(guessed);
  feedback.innerHTML = "❌ Try again...";

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