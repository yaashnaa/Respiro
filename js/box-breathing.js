let squareSize = 300; 
let circleX, circleY; 
let timer = 0; 
let duration = 60;
let holdDuration = 60; 
let phases = ['INHALE', 'HOLD', 'EXHALE', 'HOLD'];
let breathText, holdText
let phaseIndex = 0; 
let sliderBreath, sliderHold; // Sliders for breath and hold duration
let isPlaying = false;
let sound

function preload(){
  sound = loadSound('/sounds/track3.wav');
}
function setup() {
  let canvas=createCanvas(600, 500);
  canvas.parent('container');
  circleX = width / 2 - squareSize / 2; 
  circleY = height / 2 - squareSize / 2;
  textAlign(CENTER, CENTER);
  textSize(24);
  const sliders= selectAll('.slider');
  const durationLabels = selectAll('.duration-label');
  // sliders
  sliderBreath = createSlider(1, 10, duration / 60);
  // sliderBreath.position(200, height + 60);
  sliderBreath.style('width', '200px');
  sliderBreath.parent(sliders[0]);

  sliderHold = createSlider(1, 10, holdDuration / 60);
  // sliderHold.position(200, height + 100);
  sliderHold.style('width', '200px');
  sliderHold.parent(sliders[1]);

  breathText = createDiv('Breath Duration: ' + sliderBreath.value() + 's');
  breathText.class('duration-label')
  holdText = createDiv('Hold Duration: ' + sliderHold.value() + 's');
  holdText.class('duration-label')
  breathText.parent(durationLabels[0]);
  holdText.parent(durationLabels[1]);
  
}

function draw() {
  background(11, 5, 8); 

  // Update duration values from sliders
  duration = sliderBreath.value() *60;
  holdDuration = sliderHold.value() * 60;
  breathText.html('Breath Duration: ' + sliderBreath.value() + 's');
  holdText.html('Hold Duration: ' + sliderHold.value() + 's');
  // Draw the square
  noFill();
  stroke(101, 165, 176);
  strokeWeight(8);
  rectMode(CENTER);
  textFont('Gowun Dodum')
  for (let i = 0; i < 3; i++) {
    rect(width / 2, height / 2, squareSize + i * 25, squareSize + i * 25);
  }


  fill(255);
  noStroke();
  ellipse(circleX, circleY, 30, 30);
let currentPhase = phases[phaseIndex];

  fill(255);
  noStroke();
  text(currentPhase, width / 2, 50);

  timer++;
  let progress;

  if (currentPhase === "INHALE" || currentPhase === "EXHALE") {
    progress = timer / duration;
  } else if (currentPhase === "HOLD") {
    progress = timer / holdDuration;
  }

  if (currentPhase === "INHALE") {

    // lerp logic explained by AI
    circleX = lerp(width / 2 - squareSize / 2, width / 2 + squareSize / 2, progress);
    circleY = height / 2 - squareSize / 2;
    if (timer >= duration) {
      timer = 0;
      phaseIndex = (phaseIndex + 1) % phases.length;
    }
  } else if (currentPhase === "HOLD" && phaseIndex === 1) {

    circleX = width / 2 + squareSize / 2;
    circleY = lerp(height / 2 - squareSize / 2, height / 2 + squareSize / 2, progress);
    if (timer >= holdDuration) {
      timer = 0;
      phaseIndex = (phaseIndex + 1) % phases.length;
    }
  } else if (currentPhase === "EXHALE") {

    circleX = lerp(width / 2 + squareSize / 2, width / 2 - squareSize / 2, progress);
    circleY = height / 2 + squareSize / 2;
    if (timer >= duration) {
      timer = 0;
      phaseIndex = (phaseIndex + 1) % phases.length;
    }
  } else if (currentPhase === "HOLD" && phaseIndex === 3) {

    circleX = width / 2 - squareSize / 2;
    circleY = lerp(height / 2 + squareSize / 2, height / 2 - squareSize / 2, progress);
    if (timer >= holdDuration) {
      timer = 0;
      phaseIndex = 0; 
    }
  
  }
}
window.onload = function () {
  const musicButton = document.getElementById("music-toggle");
  const musicIcon = document.getElementById("music-icon");

  musicButton.addEventListener("click", () => {
    if (!isPlaying) {
      sound.loop(); 
      musicIcon.classList.remove("fa-play");
      musicIcon.classList.add("fa-pause");
    } else {
      sound.pause(); // Pause the music
      musicIcon.classList.remove("fa-pause");
      musicIcon.classList.add("fa-play");
    }
    isPlaying = !isPlaying;
  });
};