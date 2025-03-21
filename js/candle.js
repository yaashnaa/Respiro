// Candle Breathing Exercise - Main Function

// Audio Variables
let audioContext;
let microphone, meter;
let lowpass = 0; // I changed this to store the low-pass filtered volume level for better detection
const ALPHA = 0.5;
const CANDLETHRESHOLD = 0.05;
let remainingCycles = 0;
let breathingCompleted = false;

// Breathing Variables
let phase = "inhale";
let phaseTime = 0;
const inhaleDuration = 4000;
const exhaleDuration = 6000;
let flameStartY; // I renamed this to clarify it stores the initial Y position of the flame

// Candle Particles
let particles = [];
let exerciseStarted = false;
const MAX_PART_COUNT = 100;
let particleCount = MAX_PART_COUNT; // I changed this to track the number of active particles

// Button and Instruction Elements
const startButton1 = document.getElementById("start-button");
const instructionsElement = document.getElementById("instructions");
const cycleInput = document.getElementById("cycles");
const breathRemaining = document.getElementById("breath-remaining");
const breathCount = document.getElementById("breath-count");
const cycles = document.getElementById("cycles");
const cycleValue= document.getElementById('cycle-input')
// I added these elements to provide user feedback during the exercise
breathRemaining.style.display = "none"; // Hide this initially
let candleImg;
let isPlaying = false;
let sound;

function preload() {
  // I added error handling for asset loading to ensure sounds and images load correctly
  candleImg = loadImage("../images/candle.png");
  sound = loadSound(
    "../sounds/track4.wav",
    () => console.log("Sound loaded successfully."),
    (err) => console.error("Failed to load sound:", err)
  );
}

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("container");

  setupCandlePosition(); // I moved candle positioning logic into a separate function
  setupParticles(); // I created a function to initialize particles
  setupMicrophone(); // I encapsulated microphone setup for better organization
  setupButton(); // I extracted button setup to simplify setup()
}

function setupCandlePosition() {
  // I moved this logic from setup() to better separate concerns
  let candleCenterY = height / 2 + 650;
  let candleHeight = 800;
  let candleTopY = candleCenterY - candleHeight / 2;
  flameStartY = candleTopY - 100; // This sets the starting point of the flame
}

function setupParticles() {
  // I created a separate function for particle initialization to declutter setup()
  for (let i = 0; i < MAX_PART_COUNT; i++) {
    particles.push(new FlameParticle(width / 2, flameStartY));
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

function setupMicrophone() {
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function setupButton() {
  startButton1.addEventListener("click", () => {
    remainingCycles = parseInt(cycleInput.value) || 0;
    breathingCompleted = false;
    startButton1.style.display = "none";
    cycleInput.style.display = "none";
    exerciseStarted = true;
    cycleValue.style.display = "none"; // Hide the cycle input after starting
    breathRemaining.style.display = "block"; // Hide this initially
    breathCount.innerText = remainingCycles; // Update the breath count display
    instructionsElement.textContent =
      "Inhale deeply through your nose, filling your lungs.";
    requestAudioAccess();
  });
}

function draw() {
  background(11, 5, 8);
  drawCandle(); // I moved candle drawing to its own function
  updateBreathingCycle(); // I created a function to manage the breathing phase transitions
  updateParticles(); // I added this function to fix the missing reference error
}

function drawCandle() {
  imageMode(CENTER);
  image(candleImg, width / 2, height / 2 + 100, 500, 800);
}

function updateBreathingCycle() {
  if (exerciseStarted && !breathingCompleted) {
    phaseTime += deltaTime;

    if (phase === "inhale" && phaseTime >= inhaleDuration) {
      phase = "exhale";
      phaseTime = 0;
      instructionsElement.textContent = "Exhale slowly through your mouth to blow out the candle.";
    } else if (phase === "exhale" && phaseTime >= exhaleDuration) {
      phase = "inhale";
      phaseTime = 0;
      instructionsElement.textContent = "Inhale deeply through your nose, filling your lungs.";

      remainingCycles--;

      if (remainingCycles <= 0) {
        breathingCompleted = true;
        instructionsElement.textContent = "Breathing exercise complete.";
        startButton1.style.display = "block";
        cycleInput.style.display = "block";
        breathRemaining.style.display = "none"; // Hide breath counter when done
      } else {
        breathCount.innerText = remainingCycles; // Show correct remaining cycles
      }
    }
  }
}


function updateParticles() {
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
  }
}

function isBlowing() {
  if (!meter) return false;
  lowpass = ALPHA * meter.volume + (1.0 - ALPHA) * lowpass;
  return lowpass > CANDLETHRESHOLD;
}

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
