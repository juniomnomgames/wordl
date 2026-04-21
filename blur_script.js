let step = 0;

const input = document.getElementById("guessInput");
const btn = document.getElementById("guessBtn");
const feedback = document.getElementById("feedback");
const blank = document.getElementById("blankName");

function nextStep() {
  step = Math.min(step + 1, 5);
  document.body.className = `step-${step}`;
}

btn.addEventListener("click", () => {
  const guess = input.value.trim().toLowerCase();
  if (!guess) return;

  if (guess === target.name.toLowerCase()) {
    winGame();
    return;
  }

  feedback.textContent = "❌ Wrong!";
  nextStep();
  input.value = "";

  if (step >= 5) {
    revealBlank();
  }
});

function revealBlank() {
  const name = target.name;
  blank.textContent = name
    .split("")
    .map(c => (c === " " ? " " : "_"))
    .join("");
}

function winGame() {
  feedback.textContent = "🎉 Correct!";
  document.body.className = "step-5";

  blank.textContent = target.name;

  document.getElementById("winScreen").classList.remove("hidden");

  document.getElementById("winScreen").innerHTML = `
    <div>
      <h2 style="color:white">🎉 Correct!</h2>
      <h3 style="color:white">${target.name}</h3>
      <img src="${document.getElementById("mainImage").src}" 
           style="width:200px;border-radius:12px;">
    </div>
  `;
}