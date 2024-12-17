// Audio Variables
let audioContext;
let microphone, meter;
let lowpass = 0;
const ALPHA = 0.5;
const CANDLETHRESHOLD = 0.05;
let remainingCycles = 0;
let breathingCompleted = false;
// Breathing Variables
let phase = "inhale";
let phaseTime = 0;
const inhaleDuration = 4000;
const exhaleDuration = 6000;
let flameStartY;
// Candle Particles
let particles = [];
let exerciseStarted = false;
const MAX_PART_COUNT = 100;
let particleCount = MAX_PART_COUNT;
// Button and Instruction Elements
const startButton1 = document.getElementById("start-button");
const instructionsElement = document.getElementById("instructions");
const cycleInput = document.getElementById("cycles");

let candleImg;
let isPlaying = false;
let sound
function preload() {
  candleImg = loadImage("../images/candle.png");
  sound = loadSound("../sounds/track4.wav");
}

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("container");
  let candleCenterY = height / 2 + 650;
  let candleHeight = 800;
  let candleTopY = candleCenterY - candleHeight / 2;
  flameStartY = candleTopY - 100;

  // Generate Particles
  for (let i = 0; i < MAX_PART_COUNT; i++) {
    particles.push(new FlameParticle(width / 2, flameStartY));
  }
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  startButton1.addEventListener("click", () => {
    const cycleInput = document.getElementById("cycles");
    remainingCycles = parseInt(cycleInput.value) || 0;
    breathingCompleted = false;
    startButton1.style.display = "none";
    cycleInput.style.display = "none";
    exerciseStarted = true;
    instructionsElement.textContent =
      "Inhale deeply through your nose, filling your lungs.";
    requestAudioAccess();
  });
}

function draw() {
  background(11, 5, 8);

  if (exerciseStarted) {
    if (!breathingCompleted) {
      phaseTime += deltaTime;

      if (phase === "inhale" && phaseTime >= inhaleDuration) {
        phase = "exhale";
        phaseTime = 0;
        instructionsElement.textContent =
          "Exhale slowly through your mouth to blow out the candle.";
      } else if (phase === "exhale" && phaseTime >= exhaleDuration) {
        phase = "inhale";
        phaseTime = 0;
        instructionsElement.textContent =
          "Inhale deeply through your nose, filling your lungs.";
        remainingCycles--;
        if (remainingCycles <= 0) {
          breathingCompleted = true;
          instructionsElement.textContent = "Breathing exercise complete.";
          startButton1.style.display = "block";
          cycleInput.style.display = "block";
          // particles = []; // Clear all particles
        }
      }
    }
  }
  imageMode(CENTER);
  image(candleImg, width / 2, height / 2 + 100, 500, 800);

  if (
    !breathingCompleted &&
    phase === "exhale" &&
    microphone &&
    meter &&
    isBlowing()
  ) {
    if (particleCount > 0) particleCount -= 1;
  }

  if (
    !breathingCompleted &&
    particleCount < MAX_PART_COUNT &&
    phase !== "exhale"
  ) {
    particleCount += 1;
  }

  if (!breathingCompleted) {
    for (let i = 0; i < particleCount; i++) {
      particles[i].update();
      particles[i].draw();
    }
  }
}

// Particle Class
class FlameParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = random(10, 15);
    this.life = random(50, 100);
    this.curLife = this.life;
    this.alpha = 0.5;
  }

  update() {
    if (this.curLife <= 90) {
      this.radius -= 0.25;
      this.alpha -= 0.005;
    }

    if (phase === "exhale" && microphone && meter && isBlowing()) {
      this.x += random(-meter.volume, meter.volume) * 100;
    }

    this.curLife -= 2;
    this.y -= 2;

    if (this.curLife <= 0) {
      this.respawn();
    }
  }

  draw() {
    fill(254, 252, 207, this.alpha * 255);
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
  }

  respawn() {
    this.x = width / 2;
    this.y = flameStartY;
    this.radius = random(10, 15);
    this.life = random(50, 100);
    this.curLife = this.life;
    this.alpha = 0.5;
  }
}

// Audio Access and Processing
function requestAudioAccess() {
  if (navigator.mediaDevices) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        microphone = audioContext.createMediaStreamSource(stream);
        meter = createAudioMeter(audioContext);

        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;

        microphone.connect(filter);
        filter.connect(meter);
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
        alert(
          "This exercise requires microphone access to detect your breath."
        );
      });
  } else {
    alert("Your browser does not support required microphone access.");
  }
}

// written by AI because of the complexity of the code
function createAudioMeter(audioContext) {
  const processor = audioContext.createScriptProcessor(512);
  processor.onaudioprocess = function (event) {
    const buf = event.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      sum += buf[i] * buf[i];
    }
    processor.volume = Math.sqrt(sum / buf.length);
  };
  processor.volume = 0;
  processor.connect(audioContext.destination);
  return processor;
}

function isBlowing() {
  if (!meter) return false;
  lowpass = ALPHA * meter.volume + (1.0 - ALPHA) * lowpass;
  return lowpass > CANDLETHRESHOLD;
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
    isPlaying = !isPlaying; // Toggle the play state
  });
};