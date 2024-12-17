let handPose;
let video;
let hands = [];
let state = "Inhale";
let lastState = "";
let cycleCount = 0;
let color = [255, 100, 150];
let bodyPose;
let poses = [];
let rotationAngle = 0;
let posX = 0,
  posY = 0,
  size = 0,
  brightness = 255;
let symmetry;
let angle;
let connections;
var w = window.innerWidth;
var h = window.innerHeight;
let canvas, mapMouseX, mapMouseY;
let distanceHistory = []; // Array to store recent distances
const smoothingWindow = 15;
let inhaleThreshold = 100; // Starting thresholds
let exhaleThreshold = 150;
let inhaleConfidence = 0;
let exhaleConfidence = 0;
const confidenceThreshold = 8; // Number of frames required for state change
let sound;
let isPlaying = false;
function preload() {
  handPose = ml5.handPose();
  sound = loadSound("/sounds/track5.wav");
}

function setup() {
  canvas = createCanvas(w, h);
  // console.log('hello ');
  angleMode(DEGREES);
  canvas.parent("canvas-container");

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handPose.detectStart(video, gotHands);
  instructions(true);
}

function draw() {
  background(11, 5, 8);
  adjustThresholds();
  if (hands.length > 0) {
    instructions(false);
    let rightHand = hands[0];
    let leftHand = hands.length > 1 ? hands[1] : null;
    let fingerDistances = checkFingerDistances(rightHand);
    let averageDistance =
      fingerDistances.reduce((a, b) => a + b, 0) / fingerDistances.length;
    distanceHistory.push(averageDistance);
    if (distanceHistory.length > smoothingWindow) {
      distanceHistory.shift();
    }
    if (leftHand) {
      let leftIndexFinger = leftHand.keypoints[8];
      color = getColorFromPosition(leftIndexFinger);
    }
    let smoothedDistance =
      distanceHistory.reduce((a, b) => a + b, 0) / distanceHistory.length;

    if (smoothedDistance > exhaleThreshold) {
      exhaleConfidence++;
      inhaleConfidence = 0;

      if (exhaleConfidence >= confidenceThreshold && state !== "Exhale") {
        state = "Exhale";
        if (lastState === "Inhale") {
          cycleCount++;
        }
        lastState = "Exhale";
        exhaleConfidence = 0;
      }
    } else if (smoothedDistance <= inhaleThreshold) {
      inhaleConfidence++;
      exhaleConfidence = 0;

      if (inhaleConfidence >= confidenceThreshold && state !== "Inhale") {
        state = "Inhale";
        if (lastState === "Exhale") {
          cycleCount++;
        }
        lastState = "Inhale";
        inhaleConfidence = 0;
      }
    }
    fill(255);
    textSize(16);
    displayBreathingState(state, cycleCount);
    drawKaleidoscope(rightHand.keypoints[8], rightHand.keypoints[4]);
  } else {
    instructions(true);
  }
}
function checkFingerDistances(hand) {
  let distances = [];
  let fingerPairs = [
    [4, 8], // Thumb and index finger
    [4, 12], // Thumb and middle finger
    [4, 16], // Thumb and ring finger
    [4, 20], // Thumb and pinky finger
  ];

  fingerPairs.forEach((pair) => {
    let keypoint1 = hand.keypoints[pair[0]];
    let keypoint2 = hand.keypoints[pair[1]];
    let distance = dist(keypoint1.x, keypoint1.y, keypoint2.x, keypoint2.y);
    distances.push(distance);
  });

  return distances;
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function gotPoses(results) {
  poses = results;
}

function instructions(visible) {
  let heading = document.getElementById("heading");
  let instructionDiv = document.getElementById("instructions");

  if (visible) {
    heading.style.display = "block";
    instructionDiv.style.display = "block";
    instructionDiv.innerHTML = `
        <p>Place your hand in the frame</p>
    <p>Ensure the hand is well-lit</p>
    <p>Close your hand to 'Inhale'</p>
    <p>Open your hand to 'Exhale'</p>
    <p>Adjust the distance between fingers to change the pattern</p>
    <p>Move your left hand to change the color</p>`;
  } else {
    heading.style.display = "none";
    instructionDiv.style.display = "none";
  }
}

function displayBreathingState(state, cycleCount) {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  if (state === "Inhale") {
    text("Exhale", width / 2, 50);
  } else {
    text("Inhale", width / 2, 50);
  }
  textSize(20);
  text(`Breathing Cycles: ${cycleCount}`, width / 2, height - 20);
}

// Kaleidoscope function
function drawKaleidoscope(indexFinger, thumb) {
  let dynamicSymmetry = int(map(mouseX, 0, width, 3, 12));
  let angleStep = 360 / dynamicSymmetry;
  let dynamicBrightness = map(mouseY, 0, height, 50, 255);

  translate(width / 2, height / 2);
  rotationAngle += 0.6;
  rotate(rotationAngle);

  let distance = dist(indexFinger.x, indexFinger.y, thumb.x, thumb.y); // Distance between thumb and indexFinger
  let sizeFactor = map(distance, 30, 200, 0.5, 2);

  for (let i = 0; i < dynamicSymmetry; i++) {
    let angle = i * angleStep;
    push();
    rotate(angle);
    drawPattern(indexFinger, thumb, dynamicBrightness, sizeFactor);
    pop();
  }
}

// AI assistance for using the lerp() function and maintaining a history of distances to ensure stable transitions between states.

function drawPattern(indexFinger, thumb, brightness, sizeFactor) {
  let distance = dist(indexFinger.x, indexFinger.y, thumb.x, thumb.y);

  let scaleFactor = map(distance, 70, 200, 1, 0.5);
  let targetPosX = (indexFinger.x - width / 2) * scaleFactor;
  let targetPosY = (indexFinger.y - height / 2) * scaleFactor;

  if (typeof posX === "undefined") posX = targetPosX;
  if (typeof posY === "undefined") posY = targetPosY;

  // Smooth position using lerp
  posX = lerp(posX, targetPosX, 0.1);
  posY = lerp(posY, targetPosY, 0.1);

  posX = constrain(posX, -width / 4, width / 4);
  posY = constrain(posY, -height / 4, height / 4);
  let maxDistanceFromCenter = width / 2;
  let distFromCenter = dist(posX, posY, width / 2, height / 2);

  if (distFromCenter > maxDistanceFromCenter) {
    let angleFromCenter = atan2(posY - height / 2, posX - width / 2);
    posX = width / 2 + cos(angleFromCenter) * maxDistanceFromCenter;
    posY = height / 2 + sin(angleFromCenter) * maxDistanceFromCenter;
  }

  // Smooth size
  let targetSize = map(distance, 30, 200, 20, 100) * sizeFactor;
  size = lerp(size || targetSize, targetSize, 0.1);
  size = constrain(size, 20, 100);

  // Smooth brightness
  let targetBrightness = map(mouseY, 0, height, 50, 255);
  brightness = lerp(brightness || targetBrightness, targetBrightness, 0.1);
  fill(color[0], color[1], brightness, 150);
  noStroke();
  ellipse(posX, posY, size, size);
}

function gotHands(results) {
  hands = results;
}
function getColorFromPosition(finger) {
  let x = finger.x;
  let y = finger.y;

  let r = map(x, 0, width, 50, 255);
  let g = map(y, 0, height, 50, 255);
  let b = map(x + y, 0, width + height, 100, 255);

  return [r, g, b];
}
// The logic for dynamically calculating the inhaleThreshold and exhaleThreshold was suggested during an AI conversation. The AI recommended analyzing the minimum and maximum values of recent finger distances to adjust thresholds adaptively.
function adjustThresholds() {
  if (distanceHistory.length > 0) {
    let minDistance = Math.min(...distanceHistory);
    let maxDistance = Math.max(...distanceHistory);

    inhaleThreshold = minDistance + (maxDistance - minDistance) * 0.3;
    exhaleThreshold = minDistance + (maxDistance - minDistance) * 0.7;

    // Ensure thresholds are valid
    if (inhaleThreshold >= exhaleThreshold) {
      let midPoint = (inhaleThreshold + exhaleThreshold) / 2;
      inhaleThreshold = midPoint - 5;
      exhaleThreshold = midPoint + 5;
    }

    // Add a minimum gap between thresholds
    const minThresholdGap = 10;
    if (exhaleThreshold - inhaleThreshold < minThresholdGap) {
      exhaleThreshold = inhaleThreshold + minThresholdGap;
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
      sound.pause();
      musicIcon.classList.remove("fa-pause");
      musicIcon.classList.add("fa-play");
    }
    isPlaying = !isPlaying;
  });
};
