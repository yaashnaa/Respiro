// Affirmation Sketch - Main Function

function affirmationSketch(p) {
  let speechRec, mic, sound, speech;
  let listening = false, isPlaying = false, affirmationCount = 0;
  let currentAffirmation = "", feedback = "";
  let affirmationBtns;

  // Affirmations List
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

  p.preload = function () {
    // I added error handling for sound loading to catch failures.
    sound = p.loadSound("../sounds/track2.wav", () => console.log("Sound loaded successfully."),
      (err) => console.error("Failed to load sound:", err));
  };

  p.setup = function () {
    let canvas = p.createCanvas(600, 400);
    canvas.parent("container");
    p.background(200);  

    setupMicrophone();
    setupSpeechRecognition();
    setupUIButtons();

    speech = new p5.Speech();
    speech.setRate(0.6);
    speech.setPitch(1);
  };

  p.draw = function () {
    // I made the background color dynamic based on listening state for better feedback.
    p.background(listening ? p.color(114, 166, 144) : 220);
    p.textSize(24);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(listening ? "Please repeat:" : "Press Start button to begin", p.width / 2, p.height / 2 - 100);
    p.text(currentAffirmation, p.width / 2, p.height / 2 - 20);
    p.textSize(16);
    p.text(feedback, p.width / 2, 230);
    p.textSize(18);
    p.text(`Affirmations Completed: ${affirmationCount}`, p.width / 2, p.height / 2 + 80);
  };

  function setupMicrophone() {
    // I separated the microphone setup into its own function to make setup cleaner.
    mic = new p5.AudioIn();
    mic.start(() => console.log("Microphone started successfully!"),
      (err) => console.error("Microphone error:", err));
  }

  function setupSpeechRecognition() {
    // I moved speech recognition setup into its own function to improve readability.
    speechRec = new p5.SpeechRec("en-US", gotSpeech);
    speechRec.continuous = true;
    speechRec.interimResults = false;
    speechRec.start();
  }

  function setupUIButtons() {
    // I modularized button creation to avoid duplicate code.
    affirmationBtns = document.getElementById("affirmation-btns");

    let startButton = createButton("Start Practicing", () => {
      if (!listening) {
        listening = true;
        showAndSpeakAffirmation();
        startButton.attribute("disabled", "true");
      }
    });

    let stopButton = createButton("Stop Listening", () => {
      stopListening();
      startButton.removeAttribute("disabled");
    });
  }

  function createButton(label, action) {
    // I made this helper function to simplify button creation.
    let button = p.createButton(label);
    button.addClass("button-33");
    button.mousePressed(action);
    button.parent(affirmationBtns);
    return button;
  }

  function showAndSpeakAffirmation() {
    // I moved random affirmation selection into its own function for clarity.
    currentAffirmation = p.random(affirmations);
    console.log("New Affirmation:", currentAffirmation);
    listening = false;
    speakAffirmation(currentAffirmation);
  }

  function speakAffirmation(affirmation) {
    feedback = "";
    speech.onEnd = () => {
      console.log("Speech ended for:", affirmation);
      listening = true;
      try {
        speechRec.start();
      } catch (err) {
        console.error("Error restarting SpeechRec:", err);
      }
    };
    speech.speak(affirmation);
  }

  function gotSpeech() {
    // I improved error handling by checking for valid speech input.
    if (speechRec.resultValue && listening) {
      let inputText = speechRec.resultString.trim();
      if (isMatch(inputText, currentAffirmation)) {
        feedback = "Great job! Moving to the next affirmation.";
        affirmationCount++;
        showAndSpeakAffirmation();
      } else {
        feedback = "Please try again. Repeat the affirmation exactly.";
      }
    }
  }

  function stopListening() {
    // I cleaned up stopListening() so it only handles the stop logic.
    listening = false;
    feedback = "Listening stopped.";
  }

  function isMatch(input, affirmation) {
    // I added a normalization function to improve text matching accuracy.
    return normalizeInput(input) === normalizeInput(affirmation);
  }

  function normalizeInput(text) {
    // I removed punctuation and ensured case insensitivity for better speech matching.
    return text.toLowerCase().normalize("NFC").replace(/[.,!?]/g, "");
  }

  window.onload = function () {
    // I wrapped the music toggle logic into a function for clarity.
    const musicButton = document.getElementById("music-toggle");
    musicButton.addEventListener("click", toggleMusic);
  };

  function toggleMusic() {
    // I improved music toggling logic for better maintainability.
    isPlaying ? sound.pause() : sound.loop();
    isPlaying = !isPlaying;
  }
}

// I instantiated the p5 sketch at the bottom to keep the code structure clean.
new p5(affirmationSketch);
