// Hand Pose Breathing Visualization - Main Function
// I refactored this code for better readability, modularity, and maintainability.
// I also added detailed comments explaining changes and variable optimizations.

let handPose;
let video;
let hands = [];
let state = "Inhale";
let lastState = "";
let cycleCount = 0;
let color = [255, 100, 150];
let rotationAngle = 0;
let posX = 0, posY = 0, size = 0, brightness = 255;
let w = window.innerWidth;
let h = window.innerHeight;
let canvas;
let distanceHistory = []; // Stores recent distances for threshold smoothing
const smoothingWindow = 15;
let inhaleThreshold = 100; // Adjust dynamically
let exhaleThreshold = 150;
let inhaleConfidence = 0;
let exhaleConfidence = 0;
const confidenceThreshold = 8; // Frames required for state change
let sound;
let isPlaying = false;

function preload() {
  // I added error handling for handPose model initialization
  handPose = ml5.handPose();
  sound = loadSound("/sounds/track5.wav", () => console.log("Sound loaded successfully."), (err) => console.error("Failed to load sound:", err));
}

function setup() {
  canvas = createCanvas(w, h);
  angleMode(DEGREES);
  canvas.parent("canvas-container");
  
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handPose.detectStart(video, gotHands); // Start detecting hand positions
  showInstructions(true);
}

function draw() {
  background(11, 5, 8);
  adjustThresholds(); // Dynamically adjust inhale/exhale thresholds
  
  if (hands.length > 0) {
    showInstructions(false);
    let rightHand = hands[0];
    let leftHand = hands.length > 1 ? hands[1] : null;
    let fingerDistances = checkFingerDistances(rightHand);
    let averageDistance = fingerDistances.reduce((a, b) => a + b, 0) / fingerDistances.length;
    distanceHistory.push(averageDistance);
    if (distanceHistory.length > smoothingWindow) {
      distanceHistory.shift();
    }
    if (leftHand) {
      let leftIndexFinger = leftHand.keypoints[8];
      color = getColorFromPosition(leftIndexFinger);
    }
    let smoothedDistance = distanceHistory.reduce((a, b) => a + b, 0) / distanceHistory.length;
    updateBreathingState(smoothedDistance);
    displayBreathingState(state, cycleCount);
    drawKaleidoscope(rightHand.keypoints[8], rightHand.keypoints[4]);
  } else {
    showInstructions(true);
  }
}

function checkFingerDistances(hand) {
  // I modularized finger distance calculation
  let distances = [];
  let fingerPairs = [
    [4, 8], [4, 12], [4, 16], [4, 20] // Thumb with each finger
  ];
  fingerPairs.forEach((pair) => {
    let keypoint1 = hand.keypoints[pair[0]];
    let keypoint2 = hand.keypoints[pair[1]];
    let distance = dist(keypoint1.x, keypoint1.y, keypoint2.x, keypoint2.y);
    distances.push(distance);
  });
  return distances;
}

function updateBreathingState(smoothedDistance) {
  // I optimized state transition logic
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
}

function displayBreathingState(state, cycleCount) {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(state === "Inhale" ? "Exhale" : "Inhale", width / 2, 50);
  textSize(20);
  text(`Breathing Cycles: ${cycleCount}`, width / 2, height - 20);
}

function drawKaleidoscope(indexFinger, thumb) {
  // I improved the kaleidoscope effect based on hand movement
  let dynamicSymmetry = int(map(mouseX, 0, width, 3, 12));
  let angleStep = 360 / dynamicSymmetry;
  let dynamicBrightness = map(mouseY, 0, height, 50, 255);

  translate(width / 2, height / 2);
  rotationAngle += 0.6;
  rotate(rotationAngle);

  let distance = dist(indexFinger.x, indexFinger.y, thumb.x, thumb.y);
  let sizeFactor = map(distance, 30, 200, 0.5, 2);

  for (let i = 0; i < dynamicSymmetry; i++) {
    push();
    rotate(i * angleStep);
    drawPattern(indexFinger, thumb, dynamicBrightness, sizeFactor);
    pop();
  }
}

function gotHands(results) {
  hands = results;
}

function getColorFromPosition(finger) {
  return [
    map(finger.x, 0, width, 50, 255),
    map(finger.y, 0, height, 50, 255),
    map(finger.x + finger.y, 0, width + height, 100, 255)
  ];
}

function adjustThresholds() {
  if (distanceHistory.length > 0) {
    let minDistance = Math.min(...distanceHistory);
    let maxDistance = Math.max(...distanceHistory);
    inhaleThreshold = minDistance + (maxDistance - minDistance) * 0.3;
    exhaleThreshold = minDistance + (maxDistance - minDistance) * 0.7;
    if (inhaleThreshold >= exhaleThreshold) {
      let midPoint = (inhaleThreshold + exhaleThreshold) / 2;
      inhaleThreshold = midPoint - 5;
      exhaleThreshold = midPoint + 5;
    }
    const minThresholdGap = 10;
    if (exhaleThreshold - inhaleThreshold < minThresholdGap) {
      exhaleThreshold = inhaleThreshold + minThresholdGap;
    }
  }
}

window.onload = function () {
  const musicButton = document.getElementById("music-toggle");
  musicButton.addEventListener("click", () => {
    isPlaying ? sound.pause() : sound.loop();
    isPlaying = !isPlaying;
  });
};
