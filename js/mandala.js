let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: true };
let angle;
let gen = 80;
let visualiser;
let visualiserContainer;
let visualiserVisible = false;
let expanding = true;
let countdown = 5;
let timer = 0;
let breathingState = "Breathe in";
let opacity = 255;
let blinkThreshold = 3;
let speedSlider;
let speedMultiplier = 1;
let sound;
let isPlaying = false;
let slider;
let baselineSet = false;
let loading = true;
let baselineMouthOpenDist = null;
let baselineEyeToEyebrowDist = null;
let stateCounter = 0;
const STABLE_FRAMES = 10;
let currentState = "neutral";
function preload() {
  faceMesh = ml5.faceMesh(options);
  sound = loadSound("/sounds/track6.wav");
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Satisfy");

  visualiserContainer = document.getElementById("visualiser");
  slider = document.getElementById("slider");
  if (visualiserContainer) {
    console.log("Visualizer element found");
  } else {
    console.error("Visualizer element not found");
  }
  speedSlider = createSlider(0.5, 5, 1, 0.1);
  speedSlider.style("width", "200px");
  
  colorMode(RGB);
  speedSlider.parent(slider);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);

  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(visualiserContainer);
  // Set the initial visualizer
  visualiser = new Visualiser(114, 166, 144);
  visualiserContainer.style.display = "block";
  visualiserContainer.style.opacity = 1;
}

function draw() {
  background(11, 5, 8);
  clear();

  speedMultiplier = speedSlider.value();
  if (visualiserContainer.style.display === "block") {
    visualiser.display();
  }
  timer += deltaTime;

  if (!baselineSet && faces.length > 0) {
    setBaseline();
    baselineSet = true;
    console.log("Baseline set successfully!");
  }
  if (baselineSet) {
    checkFacialPoints();
  }
}
function setBaseline() {
  if (!baselineSet && faces.length > 0) {
    let face = faces[0];
    let upperLip = face.keypoints[13];
    let lowerLip = face.keypoints[14];
    let leftEyebrow = face.keypoints[105];
    let leftEye = face.keypoints[159];

    if (upperLip && lowerLip && leftEyebrow && leftEye) {
      baselineMouthOpenDist = dist(
        upperLip.x,
        upperLip.y,
        lowerLip.x,
        lowerLip.y
      );

      baselineEyeToEyebrowDist = dist(
        leftEyebrow.x,
        leftEyebrow.y,
        leftEye.x,
        leftEye.y
      );

      // console.log("Baseline mouth open dist:", baselineMouthOpenDist);
      // console.log("Baseline eye to eyebrow dist:", baselineEyeToEyebrowDist);
    } else {
      console.error("Keypoints not available yet");
    }
  } else {
    console.error("No face detected");
  }
}

function checkFacialPoints() {
  if (!visualiser) return;
  if (faces.length > 0 && baselineMouthOpenDist && baselineEyeToEyebrowDist) {
    // console.log('checking facial points');
    let face = faces[0];
    let leftEyebrow = face.keypoints[105];
    let leftEye = face.keypoints[159];
    let lowerLeftEyelid = face.keypoints[145];
    let upperLip = face.keypoints[13];
    let lowerLip = face.keypoints[14];

    let eyeToEyebrowDist = dist(
      leftEyebrow.x,
      leftEyebrow.y,
      leftEye.x,
      leftEye.y
    );
    let mouthOpenDist = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);

    let mouthOpenRatio = mouthOpenDist / baselineMouthOpenDist;
    let eyebrowRatio = eyeToEyebrowDist / baselineEyeToEyebrowDist;

    let newState = "neutral";
    if (mouthOpenRatio > 1.5) {
      newState = "mouth open";
    } else if (eyebrowRatio > 1.3) {
      newState = "eyebrows raised";
    } else if (eyebrowRatio < 0.85) {
      newState = "eyebrows lowered";
    }
    if (newState === currentState) {
      stateCounter = 0;
    } else {
      stateCounter++;
      if (stateCounter >= STABLE_FRAMES) {
        currentState = newState;
        stateCounter = 0;
        // console.log("State changed to:", currentState);
        switch (currentState) {
          case "mouth open":
            visualiser.setColor(204, 102, 102); // red for mouth open
            break;
          case "eyebrows raised":
            visualiser.setColor(204, 102, 102); // red for raised eyebrows
            break;
          case "eyebrows lowered":
            visualiser.setColor(204, 102, 102); //  red for lowered eyebrows
            break;
          default:
            visualiser.setColor(114, 166, 144); // Green for neutral
        }
      }
    }
  }
}

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
    // let scaleFactor = map(mouseX, 0, width, 0.5, 1.5);
    this.applyGlowEffect();

    stroke(this.r, this.g, this.b);
    strokeWeight(1);
    fill(this.r, this.g, this.b, 50);

    angle = sin(this.gen * 44) * 44;

    push();
    translate(this.x, this.y);
    rotate(this.gen * 4);
    // scale(scaleFactor);
    for (var i = 0; i < 144; i++) {
      rotate((6 / this.gen) * 54);
      curve(i, i, 0, angle + i, 133, angle - i, i + 133, i);
    }
    pop();

    this.gen += 0.0003 * speedMultiplier;
  }

  applyGlowEffect() {
    push();
    translate(this.x, this.y);
    rotate(this.gen * 2);

    for (let glow = 0; glow < 10; glow++) {
      stroke(this.r, this.g, this.b, 255 - glow * 25);
      strokeWeight(2);
      noFill();
      ellipse(0, 0, glow * this.gen * 0.5);
    }

    pop();
  }
}
function gotFaces(results) {
  faces = results;
  // console.log(faces);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  visualiser.x = width / 2;
  visualiser.y = height / 2;
}

window.onload = function () {
  const musicButton = document.getElementById("music-toggle");
  const musicIcon = document.getElementById("music-icon");

  musicButton.addEventListener("click", () => {
    if (!isPlaying) {
      sound.loop(); // Loop the music
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
