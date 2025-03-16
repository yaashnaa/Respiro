// Breathing Visualizer - Main Function

// I removed redundant code and improved error handling.

let squareSize = 300;
let circleX, circleY;
let timer = 0;
let duration = 60;
let holdDuration = 60;
let phases = ["INHALE", "HOLD", "EXHALE", "HOLD"];
let breathText, holdText;
let phaseIndex = 0;
let sliderBreath, sliderHold; // Sliders for breath and hold duration
let isPlaying = false;
let sound;

function preload() {
  // I added error handling for sound loading.
  sound = loadSound(
    "/sounds/track3.wav",
    () => console.log("Sound loaded successfully."),
    (err) => console.error("Failed to load sound:", err)
  );
}

function setup() {
  let canvas = createCanvas(600, 500);
  canvas.parent("container");

  // Initialize circle position
  circleX = width / 2 - squareSize / 2;
  circleY = height / 2 - squareSize / 2;

  textAlign(CENTER, CENTER);
  textSize(24);
  textFont("Gowun Dodum");

  setupSliders();
}

function setupSliders() {
  // I modularized slider setup to keep setup() cleaner.
  const sliders = selectAll(".slider");
  const durationLabels = selectAll(".duration-label");

  sliderBreath = createSlider(1, 10, duration / 60);
  sliderBreath.style("width", "200px");
  sliderBreath.parent(sliders[0]);

  sliderHold = createSlider(1, 10, holdDuration / 60);
  sliderHold.style("width", "200px");
  sliderHold.parent(sliders[1]);

  breathText = createDiv(`Breath Duration: ${sliderBreath.value()}s`).class(
    "duration-label"
  );
  holdText = createDiv(`Hold Duration: ${sliderHold.value()}s`).class(
    "duration-label"
  );
  breathText.parent(durationLabels[0]);
  holdText.parent(durationLabels[1]);
}

function draw() {
  background(11, 5, 8);
  updateSliders();
  drawVisualization();
  updateBreathingPhase();
}

function updateSliders() {
  // I made sure to update the duration based on slider values.
  duration = sliderBreath.value() * 60;
  holdDuration = sliderHold.value() * 60;
  breathText.html(`Breath Duration: ${sliderBreath.value()}s`);
  holdText.html(`Hold Duration: ${sliderHold.value()}s`);
}

function drawVisualization() {
  // I encapsulated drawing logic into its own function for clarity.
  noFill();
  stroke(101, 165, 176);
  strokeWeight(8);
  rectMode(CENTER);

  for (let i = 0; i < 3; i++) {
    rect(width / 2, height / 2, squareSize + i * 25, squareSize + i * 25);
  }

  fill(255);
  noStroke();
  ellipse(circleX, circleY, 30, 30);

  fill(255);
  noStroke();
  text(phases[phaseIndex], width / 2, 50);
}

function updateBreathingPhase() {
  timer++;
  let progress =
    phases[phaseIndex] === "INHALE" || phases[phaseIndex] === "EXHALE"
      ? timer / duration
      : timer / holdDuration;

  if (phases[phaseIndex] === "INHALE") {
    circleX = lerp(width / 2 - squareSize / 2, width / 2 + squareSize / 2, progress);
    circleY = height / 2 - squareSize / 2;
  } else if (phases[phaseIndex] === "HOLD" && phaseIndex === 1) {
    circleX = width / 2 + squareSize / 2;
    circleY = lerp(height / 2 - squareSize / 2, height / 2 + squareSize / 2, progress);
  } else if (phases[phaseIndex] === "EXHALE") {
    circleX = lerp(width / 2 + squareSize / 2, width / 2 - squareSize / 2, progress);
    circleY = height / 2 + squareSize / 2;
  } else if (phases[phaseIndex] === "HOLD" && phaseIndex === 3) {
    circleX = width / 2 - squareSize / 2;
    circleY = lerp(height / 2 + squareSize / 2, height / 2 - squareSize / 2, progress);
  }

  if (timer >= (phases[phaseIndex] === "HOLD" ? holdDuration : duration)) {
    timer = 0;
    phaseIndex = (phaseIndex + 1) % phases.length;
  }
}

window.onload = function () {
  // I wrapped the music toggle logic in its own function for better clarity.
  const musicButton = document.getElementById("music-toggle");
  musicButton.addEventListener("click", toggleMusic);
};

function toggleMusic() {
  isPlaying ? sound.pause() : sound.loop();
  isPlaying = !isPlaying;
}