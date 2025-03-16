// Hand Pose Breathing Visualization

// Variables for hand tracking, video, and breathing logic
let handPose, video, canvas;
let hands = []; // Stores detected hands
let state = "Inhale"; // Current breathing state (Inhale/Exhale)
let lastState = ""; // Tracks previous state for cycle count
let cycleCount = 0; // Number of complete inhale/exhale cycles
let color = [255, 100, 150]; // Default visualization color

//  Kaleidoscope variables for visuals
let rotationAngle = 0;
let posX = 0, posY = 0, size = 0, brightness = 255;

// Distance history for smooth breathing detection
let distanceHistory = [];
const smoothingWindow = 15; // Frames stored for smoothing

// Thresholds for inhale/exhale detection
let inhaleThreshold = 100, exhaleThreshold = 150;
let inhaleConfidence = 0, exhaleConfidence = 0;
const confidenceThreshold = 8; // Number of frames required for state change

//  Sound variables
let sound, isPlaying = false;

function preload() {
  // Load the ML model for hand pose detection
  handPose = ml5.handPose();

  // Load background music (error handling added)
  sound = loadSound("/sounds/track5.wav",
    () => console.log("Sound loaded successfully."),
    (err) => console.error("Error loading sound:", err)
  );
}

function setup() {
  // Create a full-screen canvas for visualization
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  angleMode(DEGREES);
  canvas.parent("canvas-container");

  //  Initialize video capture for webcam input
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // Hide the video element, as we only use hand tracking data

  // Start hand detection and set callback function
  handPose.detectStart(video, gotHands);

  // Display initial instructions
  showInstructions(true);
}

function draw() {
  background(11, 5, 8); // Set a dark background for visibility

  updateThresholds(); // Dynamically adjust inhale/exhale thresholds

  if (hands.length > 0) {
    showInstructions(false); // Hide instructions when a hand is detected
    processHandPose(); // Analyze hand pose and update breathing state
  } else {
    showInstructions(true); // Show instructions if no hand is detected
  }
}

// Function to process detected hands and update breathing state
function processHandPose() {
  let rightHand = hands[0]; // Get the first detected hand
  let leftHand = hands.length > 1 ? hands[1] : null; // Check for second hand

  let avgDistance = calculateAverageDistance(rightHand); // Compute average finger distance
  updateDistanceHistory(avgDistance); // Store distance for smoothing

  if (leftHand) {
    let leftIndexFinger = leftHand.keypoints[8]; // Get index finger of left hand
    color = getColorFromPosition(leftIndexFinger); // Update visualization color
  }

  updateBreathingState(avgDistance); // Adjust inhale/exhale detection
  displayBreathingState(state, cycleCount); // Update UI text display
  drawKaleidoscope(rightHand.keypoints[8], rightHand.keypoints[4]); // Draw visuals
}

// Function to calculate average finger distances for state transitions
function calculateAverageDistance(hand) {
  // Pairs of keypoints to measure distances between (thumb to fingers)
  const fingerPairs = [
    [4, 8],  // Thumb to index finger
    [4, 12], // Thumb to middle finger
    [4, 16], // Thumb to ring finger
    [4, 20]  // Thumb to pinky finger
  ];

  // Compute Euclidean distances for each finger pair
  let distances = fingerPairs.map(pair => {
    let p1 = hand.keypoints[pair[0]];
    let p2 = hand.keypoints[pair[1]];
    return dist(p1.x, p1.y, p2.x, p2.y);
  });

  // Return the average of all calculated distances
  return distances.reduce((a, b) => a + b, 0) / distances.length;
}

//  Function to maintain a history of finger distances for smoother transitions
function updateDistanceHistory(newDistance) {
  distanceHistory.push(newDistance);
  if (distanceHistory.length > smoothingWindow) distanceHistory.shift();
}
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

// Function to update breathing state based on smoothed distances
function updateBreathingState(smoothedDistance) {
  let avgSmoothedDistance = distanceHistory.reduce((a, b) => a + b, 0) / distanceHistory.length;

  if (avgSmoothedDistance > exhaleThreshold) {
    exhaleConfidence++;
    inhaleConfidence = 0;

    if (exhaleConfidence >= confidenceThreshold && state !== "Exhale") {
      state = "Exhale";
      if (lastState === "Inhale") cycleCount++; // Only count complete cycles
      lastState = "Exhale";
      exhaleConfidence = 0;
    }
  } else if (avgSmoothedDistance <= inhaleThreshold) {
    inhaleConfidence++;
    exhaleConfidence = 0;

    if (inhaleConfidence >= confidenceThreshold && state !== "Inhale") {
      state = "Inhale";
      if (lastState === "Exhale") cycleCount++;
      lastState = "Inhale";
      inhaleConfidence = 0;
    }
  }
}

// Function to adjust breathing thresholds dynamically
function updateThresholds() {
  if (distanceHistory.length > 0) {
    let minDistance = Math.min(...distanceHistory);
    let maxDistance = Math.max(...distanceHistory);

    inhaleThreshold = minDistance + (maxDistance - minDistance) * 0.3;
    exhaleThreshold = minDistance + (maxDistance - minDistance) * 0.7;

    // Ensure valid threshold separation
    if (exhaleThreshold - inhaleThreshold < 10) {
      exhaleThreshold = inhaleThreshold + 10;
    }
  }
}

// Function to display breathing state on screen
function displayBreathingState(state, cycleCount) {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(state === "Inhale" ? "Exhale" : "Inhale", width / 2, 100);
  textSize(20);
  text(`Breathing Cycles: ${cycleCount}`, width / 2, height - 20);
}

// Function to show/hide instructions
function showInstructions(visible) {
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

// Function to retrieve hand pose detection results
function gotHands(results) {
  hands = results;
}

//  Function to dynamically get color based on hand position
function getColorFromPosition(finger) {
  return [
    map(finger.x, 0, width, 50, 255),
    map(finger.y, 0, height, 50, 255),
    map(finger.x + finger.y, 0, width + height, 100, 255)
  ];
}

// Function to control music playback
window.onload = function () {
  const musicButton = document.getElementById("music-toggle");
  const musicIcon = document.getElementById("music-icon");

  musicButton.addEventListener("click", () => {
    if (!isPlaying) {
      sound.loop(); // Start looping music
      musicIcon.classList.remove("fa-play");
      musicIcon.classList.add("fa-pause");
    } else {
      sound.pause(); // Pause the music
      musicIcon.classList.remove("fa-pause");
      musicIcon.classList.add("fa-play");
    }
    isPlaying = !isPlaying; // Toggle play state
  });
};
