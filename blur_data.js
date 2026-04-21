const people = window.people || people; // uses your existing data.js

let flatPeople = [];
let target = null;

async function init() {
  for (const category of Object.keys(people)) {
    for (const p of people[category]) {
      flatPeople.push(p);
    }
  }

  pickRandom();
  loadImage();
}

function pickRandom() {
  target = flatPeople[Math.floor(Math.random() * flatPeople.length)];
  console.log("TARGET:", target.name);
}

function loadImage() {
  document.getElementById("mainImage").src =
    `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(target.name)}.jpg`;
}

init();