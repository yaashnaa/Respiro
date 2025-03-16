//  Face Mesh Visualization with Interactive Breathing Feedback
// This program detects face movements using ml5.js FaceMesh and reacts visually.

//  Face Mesh Detection Variables
let faceMesh, video, faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: true };

//  Visualizer State & Configuration
let visualiser, visualiserContainer;
let visualiserVisible = false;

//  Breathing State Variables
let breathingState = "Breathe in";
let expanding = true;
let countdown = 5; // Countdown timer before breathing starts
let timer = 0;
let opacity = 255;

//  Thresholds & State Management
let blinkThreshold = 3;
let stateCounter = 0;
const STABLE_FRAMES = 10; // Minimum frames required for a state change
let currentState = "neutral"; // Default state

//  Face Feature Baselines
let baselineSet = false;
let baselineMouthOpenDist = null;
let baselineEyeToEyebrowDist = null;

//  UI Elements
let slider, speedSlider;
let speedMultiplier = 1;

//  Sound & Music Variables
let sound, isPlaying = false;

//  Face Mesh Preload (Loads the FaceMesh Model and Sound)
function preload() {
  faceMesh = ml5.faceMesh(options); // Load FaceMesh model

  // Load sound (Ensure p5.sound.js is included in your HTML)
  sound = loadSound("/sounds/track6.wav",
    () => console.log("Sound loaded successfully."),
    (err) => console.error("Error loading sound:", err)
  );
}

//  Setup Function (Initializes Video, Canvas, Sliders, and Face Detection)
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Satisfy");

  // Get the visualizer container from HTML
  visualiserContainer = document.getElementById("visualiser");
  slider = document.getElementById("slider");

  // Debugging check
  if (!visualiserContainer) console.error("Visualizer element not found");

  // Speed slider setup
  speedSlider = createSlider(0.5, 5, 1, 0.1);
  speedSlider.style("width", "200px");
  speedSlider.parent(slider);
  
  // Set color mode for visualization
  colorMode(RGB);

  // Setup video capture
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Start FaceMesh detection
  faceMesh.detectStart(video, gotFaces);

  // Setup canvas inside the visualizer container
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(visualiserContainer);

  // Initialize visualizer with a starting color
  visualiser = new Visualiser(114, 166, 144);
  visualiserContainer.style.display = "block";
  visualiserContainer.style.opacity = 1;
}

//  Main Draw Loop (Handles Visualization & Breathing Detection)
function draw() {
  background(11, 5, 8);
  clear(); // Clear previous frame

  // Adjust speed multiplier based on slider
  speedMultiplier = speedSlider.value();

  // If visualizer is visible, render it
  if (visualiserContainer.style.display === "block") {
    visualiser.display();
  }

  // Timer for state transitions
  timer += deltaTime;

  // Set baseline when face is detected
  if (!baselineSet && faces.length > 0) {
    setBaseline();
  }

  // Check facial expressions only if baseline is set
  if (baselineSet) {
    checkFacialPoints();
  }
}

//  Function to Set Baseline Face Measurements
function setBaseline() {
  if (!baselineSet && faces.length > 0) {
    let face = faces[0];

    // Get keypoints for baseline measurement
    let upperLip = face.keypoints[13];
    let lowerLip = face.keypoints[14];
    let leftEyebrow = face.keypoints[105];
    let leftEye = face.keypoints[159];

    if (upperLip && lowerLip && leftEyebrow && leftEye) {
      // Calculate initial distances
      baselineMouthOpenDist = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);
      baselineEyeToEyebrowDist = dist(leftEyebrow.x, leftEyebrow.y, leftEye.x, leftEye.y);

      baselineSet = true;
      console.log("Baseline set successfully!");
    } else {
      console.error("Keypoints not available yet");
    }
  }
}

//  Function to Analyze Facial Expressions & Change Visualization
function checkFacialPoints() {
  if (!visualiser) return;
  if (faces.length > 0 && baselineMouthOpenDist && baselineEyeToEyebrowDist) {
    let face = faces[0];

    // Get keypoints for analysis
    let leftEyebrow = face.keypoints[105];
    let leftEye = face.keypoints[159];
    let upperLip = face.keypoints[13];
    let lowerLip = face.keypoints[14];

    // Calculate distances
    let eyeToEyebrowDist = dist(leftEyebrow.x, leftEyebrow.y, leftEye.x, leftEye.y);
    let mouthOpenDist = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);

    // Compute ratios
    let mouthOpenRatio = mouthOpenDist / baselineMouthOpenDist;
    let eyebrowRatio = eyeToEyebrowDist / baselineEyeToEyebrowDist;

    // Determine new state
    let newState = "neutral";
    if (mouthOpenRatio > 1.5) newState = "mouth open";
    else if (eyebrowRatio > 1.3) newState = "eyebrows raised";
    else if (eyebrowRatio < 0.85) newState = "eyebrows lowered";

    // Smooth state transitions
    if (newState !== currentState) {
      stateCounter++;
      if (stateCounter >= STABLE_FRAMES) {
        currentState = newState;
        stateCounter = 0;
        updateVisualizerColor();
      }
    } else {
      stateCounter = 0;
    }
  }
}

//  Function to Update Visualizer Color Based on State
function updateVisualizerColor() {
  switch (currentState) {
    case "mouth open":
    case "eyebrows raised":
    case "eyebrows lowered":
      visualiser.setColor(204, 102, 102); // Red for activation
      break;
    default:
      visualiser.setColor(114, 166, 144); // Green for neutral
  }
}

//  Visualizer Class for Animation
class Visualiser {
  constructor(r, g, b) {
    this.gen = 80;
    this.r = r;
    this.g = g;
    this.b = b;
    this.x = width / 2;
    this.y = height / 2;
  }

  setColor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  display() {
    this.applyGlowEffect();
    stroke(this.r, this.g, this.b);
    strokeWeight(1);
    fill(this.r, this.g, this.b, 50);

    push();
    translate(this.x, this.y);
    for (let i = 0; i < 144; i++) {
      rotate((6 / this.gen) * 54);
      curve(i, i, 0, sin(this.gen * 44) * 44 + i, 133, sin(this.gen * 44) * 44 - i, i + 133, i);
    }
    pop();

    this.gen += 0.0003 * speedMultiplier;
  }

  applyGlowEffect() {
    push();
    translate(this.x, this.y);
    for (let glow = 0; glow < 10; glow++) {
      stroke(this.r, this.g, this.b, 255 - glow * 25);
      strokeWeight(2);
      noFill();
      ellipse(0, 0, glow * this.gen * 0.5);
    }
    pop();
  }
}

//  Detect Faces
function gotFaces(results) {
  faces = results;
}

//  Window Resize Handler
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//  Music Toggle
window.onload = function () {
  document.getElementById("music-toggle").addEventListener("click", () => {
    isPlaying ? sound.pause() : sound.loop();
    isPlaying = !isPlaying;
  });
};
