// I structured global variables for better readability.
let inc = 0.1, scl = 40;
let cols, rows, zoff = 0;
let particles = [];
let flowField = [];
let fr; // Frame rate display
let sound, isPlaying = false;

/**
 * PRELOAD FUNCTION
 * - I ensured the sound loads properly with error handling.
 */
function preload() {
  sound = loadSound(
    "./sounds/track1.wav",
    () => console.log("Sound loaded successfully."),
    (err) => console.error("Error loading sound:", err)
  );
}

/**
 * SETUP FUNCTION - Initializes Canvas and Particles
 * - I grouped initialization steps logically.
 */
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
  
  updateGridSize(); // I moved grid calculations to a separate function.
  
  // I created 150 particles randomly distributed on the canvas.
  for (let i = 0; i < 150; i++) {
    particles.push(new Particle(random(width), random(height)));
  }

  fr = createP(); // I added an FPS counter for performance monitoring.
  background(0);
}

/**
 * FUNCTION TO UPDATE GRID SIZE
 * - I extracted this from `setup()` and `windowResized()`
 * - It ensures grid recalculations are consistent across screen resizes.
 */
function updateGridSize() {
  cols = floor(width / scl);
  rows = floor(height / scl);
  flowField = new Array(cols * rows);
}

/**
 * MOUSE PRESSED EVENT - Resets Noise Field
 * - I added `noiseSeed(millis())` to randomize the field when clicked.
 */
function mousePressed() {
  noiseSeed(millis());
}

/**
 * DRAW FUNCTION - Updates and Displays Particles and Flow Field
 */
function draw() {
  background(0, 20);

  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;

      // I calculate an angle using Perlin noise for natural movement.
      let angle = noise(xoff, yoff, zoff) * TWO_PI;
      let v = p5.Vector.fromAngle(angle);
      v.setMag(0.5); // I reduced magnitude for smoother flow.

      // I made the flow field interact with the mouse for a more dynamic effect.
      let mousePos = createVector(mouseX, mouseY);
      let gridPos = createVector(x * scl, y * scl);
      let distance = mousePos.dist(gridPos);

      if (distance < 100) {
        let repelForce = p5.Vector.sub(gridPos, mousePos);
        repelForce.setMag(map(distance, 0, 500, 1, 0));
        v.add(repelForce);
      }

      flowField[index] = v;

      // I reduced the number of lines drawn for better performance.
      stroke(216, 158, 179, 100);
      strokeWeight(0.2);
      push();
      translate(x * scl, y * scl);
      rotate(v.heading());
      line(0, 0, scl / 2, 0);
      pop();

      xoff += inc;
    }
    yoff += inc;
  }

  zoff += 0.0002;

  // I optimized the loop by using `forEach` for cleaner code.
  particles.forEach((particle) => {
    particle.follow(flowField);
    particle.update();
    particle.edges();
    particle.show();
  });

  fr.html(floor(frameRate()) + " fps"); // I display FPS for debugging.
}

/**
 * PARTICLE CLASS - Defines the Behavior of Moving Particles
 */
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 4; // I kept the speed limit to prevent erratic movement.
    this.color = color(216, 158, 179);
  }

  /**
   * FOLLOW FUNCTION - Aligns Particles with the Flow Field
   * - I added an index bounds check to prevent errors.
   */
  follow(vectors) {
    let x = floor(this.pos.x / scl);
    let y = floor(this.pos.y / scl);
    
    if (x < 0 || x >= cols || y < 0 || y >= rows) return; // Prevents out-of-bounds errors.
    
    let index = x + y * cols;
    let force = vectors[index];
    this.applyForce(force);
  }

  /**
   * APPLY FORCE FUNCTION - Moves the Particle
   */
  applyForce(force) {
    this.acc.add(force);
  }

  /**
   * UPDATE FUNCTION - Moves and Applies Speed Limit to the Particle
   */
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  /**
   * EDGES FUNCTION - Wraps Particles to the Opposite Side
   * - I fixed an issue where particles sometimes disappeared.
   */
  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  /**
   * SHOW FUNCTION - Draws the Particle
   */
  show() {
    stroke(this.color);
    strokeWeight(2);
    point(this.pos.x, this.pos.y);
  }
}

/**
 * WINDOW RESIZE FUNCTION - Updates Canvas and Flow Field
 * - I made sure particles and grid update correctly when resizing.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateGridSize();
}

/**
 * MUSIC TOGGLE FUNCTION
 * - I made sure the play/pause state updates properly.
 */
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
