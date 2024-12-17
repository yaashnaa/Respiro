// Function for first canvas
function affirmationSketch(p) {
  let speechRec;
  let listening = false; // To track if we're listening
  const affirmations = [
    "I am worthy of love and respect.",
    "I am strong and capable.",
    "I trust in my ability to overcome challenges.",
    "I choose to focus on what I can control.",
    "I am calm, centered, and in control.",
    "My mind is clear, and my heart is at peace.",
    "I am free from worry and embrace serenity.",
    "I deserve to be kind to myself.",
    "I am proud of my progress, no matter how small.",
    "I am open to growth and change.",
    "I release fear and welcome courage.",
    "I am grateful for the present moment.",
    "I attract positivity and good energy.",
    "I am confident in my decisions.",
    "I forgive myself for past mistakes.",
    "I trust the process of life.",
    "I am surrounded by love and support.",
    "I am resilient and will rise again.",
    "I am patient with myself.",
    "I am at peace with who I am.",
    "I choose hope over fear.",
    "I am enough.",
    "I prioritize my mental well-being.",
    "I can handle whatever comes my way.",
    "I am deserving of rest and relaxation.",
    "I let go of negativity and embrace joy.",
    "I believe in myself.",
    "I focus on solutions, not problems.",
    "I am safe, secure, and grounded.",
    "I trust myself to make the right choices.",
    "I am grateful for my strength.",
    "I welcome happiness into my life.",
    "I am capable of handling change.",
    "I am a work in progress, and that’s okay.",
    "I love myself unconditionally.",
    "I prioritize my peace.",
    "I am brave, bold, and beautiful.",
    "I accept myself completely.",
    "I find joy in the little things.",
    "I breathe in calmness and exhale stress.",
    "I am proud of who I am becoming.",
    "I am enough, just as I am.",
    "I let go of self-judgment.",
    "I choose to move forward with courage.",
    "I find strength in my challenges.",
    "I am a source of light and love.",
    "I am capable of healing and growth.",
    "I am kind to myself and others.",
    "I deserve to feel good about myself.",
    "I am grateful for today’s opportunities.",
    "I embrace my uniqueness.",
    "I am at peace with my journey.",
    "I am strong, even in my struggles.",
    "I celebrate my achievements.",
    "I trust in my ability to persevere.",
  ];
  let mic;
  let affirmationBtns;
  let affirmationCount = 0;
  let currentAffirmation = "";
  let inputText = "";
  let feedback = "";
  let width = 600,
    height = 400;
  let sound;
  let isPlaying = false;
  p.preload = function () {
    sound = p.loadSound(
      "/2.wav",
      () => {
        console.log("Sound loaded successfully.");
      },
      (err) => {
        console.error("Failed to load sound:", err);
      }
    );
  };

  p.setup = function () {
    let canvas = p.createCanvas(600, 400);
    mic = new p5.AudioIn();
    mic.start(
      () => {
        console.log("Microphone started successfully!");
      },
      (err) => {
        console.error("Microphone error:", err);
      }
    );
    let n = 0.5;
    if (sound && sound.isLoaded()) {
      sound.setVolume(n);
    }
    p.background(200);
    canvas.parent("container");
    speech = new p5.Speech();
    speech.started();
    speech.ended();
    affirmationBtns = document.getElementById("affirmation-btns");
    // Initialize SpeechRec
    speechRec = new p5.SpeechRec("en-US", gotSpeech);
    speechRec.continuous = true;
    speechRec.interimResults = false;
    speechRec.start();
    let startButton = p.createButton("Start Practicing");
    startButton.addClass("button-33");
    let hasStarted = false;
    startButton.mousePressed(() => {
      if (!hasStarted) {
        listening = true;
        showAndSpeakAffirmation();
        hasStarted = true;
        startButton.attribute("disabled", "true");
      }
    });

    startButton.parent(affirmationBtns);

    let stopButton = p.createButton("Stop Listening");
    //   stopButton.position(width/2, 350);
    stopButton.mousePressed(() => {
      stopListening();
      hasStarted = false;
      startButton.removeAttribute("disabled");
    });
    stopButton.parent(affirmationBtns);
    stopButton.addClass("button-33");
  };
  p.draw = function () {
    p.background(listening ? p.color(114, 166, 144) : 220);
    p.textSize(24);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);

    if (listening) {
      p.text("Please repeat:", width / 2, height / 2 - 100);
    } else {
      p.text("Press Start button to begin", width / 2, height / 2 - 100);
    }
    p.text(currentAffirmation, width / 2, height / 2 - 20);
    p.textFont("Gowun Dodum");
    p.textSize(16);
    p.fill(0);
    p.text(feedback, width / 2, 230);
    p.textSize(18);
    p.fill(0);
    p.text(
      `Affirmations Completed: ${affirmationCount}`,
      width / 2,
      height / 2 + 80
    );
  };

  function showAndSpeakAffirmation() {
    currentAffirmation = p.random(affirmations);
    console.log("New Affirmation:", currentAffirmation);
    if (listening) {
      listening = false;
    }

    speakAffirmation(currentAffirmation);
  }

  function speakAffirmation(affirmation) {
    feedback = "";

    speech.onEnd = () => {
      console.log("Speech ended for:", affirmation);

      listening = true;
      try {
        speechRec.start();
        console.log("Speech recognition restarted.");
      } catch (err) {
        console.error("Error restarting SpeechRec:", err);
      }
    };

    speech.setRate(0.6);
    speech.setPitch(1);
    speech.speak(affirmation);
    console.log("Speaking:", affirmation);
  }

  function gotSpeech() {
    console.log("GotSpeech triggered.");
    console.log("Result Value:", speechRec.resultValue);
    console.log("Result String:", speechRec.resultString);

    if (speechRec.resultValue && listening) {
      inputText = speechRec.resultString.trim();
      console.log("Recognized Text:", inputText);

      if (inputText.length === 0) {
        console.log("Empty input recognized. Not proceeding.");
        return;
      }

      if (isMatch(inputText, currentAffirmation)) {
        feedback = "Great job! Moving to the next affirmation.";
        console.log("Affirmation matched!");
        affirmationCount++;
        showAndSpeakAffirmation();
      } else {
        feedback = "Please try again. Repeat the affirmation exactly.";
        console.log(
          `Mismatch: Input="${inputText}" vs Affirmation="${currentAffirmation}"`
        );
      }
    } else {
      console.log("No valid speech recognized or listening disabled.");
    }
  }

  function stopListening() {
    listening = false;
    feedback = "Listening stopped.";
    console.log("Listening stopped.");
  }

  function isMatch(input, affirmation) {
    const normalizedInput = normalizeInput(input);
    const normalizedAffirmation = normalizeInput(affirmation);
    return normalizedInput === normalizedAffirmation;
  }
  function stopListening() {
    listening = false;
  }

  function normalizeInput(text) {
    return text
      .toLowerCase()
      .normalize("NFC")
      .replace(/[.,!?]/g, "");
  }
  function showRandomAffirmation() {
    currentAffirmation = p.random(affirmations);
    console.log("Next Affirmation: " + currentAffirmation);
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
}

new p5(affirmationSketch);
function affirmationParticles(p) {
  let inc = 0.01;
  let scl = 20;
  let rows;
  let cols;
  let field;
  let zoff = 0;
  let particleNum = 50;
  let particles = [];
  let mic;
  let sensitivity;
  let sens;
  let width = window.innerWidth;
  let height = window.innerHeight;
  p.setup = function () {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.style("z-index", "-1"); 
    canvas.style("top", "0");
    canvas.style("left", "0");
    rows = p.floor(p.width / scl); 
    cols = p.floor(p.height / scl);
    field = new Array(rows * cols);

    for (let i = 0; i < particleNum; i++) {
      particles[i] = new Particle();
    }
  };
  p.draw = function () {
    p.background(11, 5, 8, 10);
    let xoff;
    let yoff = 0;

    for (let y = 0; y < rows; y++) {
      xoff = 0;
      for (let x = 0; x < cols; x++) {
        let index = x + y * cols;
        let angle = p.noise(xoff, yoff, zoff) * p.TWO_PI;
        field[index] = p5.Vector.fromAngle(angle);
        field[index].setMag(2);
        xoff += inc;
      }
      yoff += inc;
      zoff += 0.0001;
    }

    for (let i = 0; i < particleNum; i++) {
      let dx = p.mouseX - particles[i].pos.x;
      let dy = p.mouseY - particles[i].pos.y;
      let distance = p.sqrt(dx * dx + dy * dy);
      if (distance < 100) {
        particles[i].vel.add(p.createVector(dx, dy).mult(0.01));
      }

      particles[i].update();
      particles[i].show();
    }
  };
  class Particle {
    constructor() {
      this.pos = p.createVector(
        p.random(p.windowWidth),
        p.random(p.windowHeight)
      );
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      this.prev = this.pos.copy();
    }

    show() {
      p.strokeWeight(1);
      p.stroke(140, 210, 250, 255);
      p.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
    }

    update() {
      if (this.pos.x > width) {
        this.pos.x = 0;
      }
      if (this.pos.x < 0) {
        this.pos.x = width;
      }
      if (this.pos.y > height) {
        this.pos.y = 0;
      }
      if (this.pos.y < 0) {
        this.pos.y = height;
      }
      this.prev = this.pos.copy();
      this.vel.add(this.acc);
      this.vel.limit(2);
      this.pos.add(this.vel);
      this.acc.set(0, 0);
    }

    follow(flowfield, scl, cols) {
      let x = p.floor(this.pos.x / scl);
      let y = p.floor(this.pos.y / scl);
      let index = x + y * cols;
      let force = flowfield[index];
      this.applyForce(force);
    }

    applyForce(force) {
      this.acc.add(force);
    }
  }
}
new p5(affirmationParticles);
