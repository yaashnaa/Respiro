let inc;
let scl;
let cols;
let rows;

let zoff;

let fr;

let particles = [];

let flowField = [];
let sound;
let isPlaying = false;
function preload() {
  sound = loadSound('./sounds/track1.wav'); 
}

function setup() {
  canvas= createCanvas(windowWidth, windowHeight);
  frameRate(30); 
  zoff = 0;
  scl = 40;
  inc = 0.1;
  cols = floor(width / scl);
  rows = floor(height / scl);
  fr = createP();

  for (let i = 0; i < 150; i++) {
    particles[i] = new Particle(random(width), random(height));
  }
  
  background(0); 
}
function mousePressed() {
    noiseSeed(millis())
  }
function draw() {
  console.log('started')
  background(0, 20); 
  
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;

      // Calculate angle using Perlin noise
      let angle = noise(xoff, yoff, zoff) * TWO_PI;
      let v = p5.Vector.fromAngle(angle);
      v.setMag(0.5);


      let mousePos = createVector(mouseX, mouseY);
      let gridPos = createVector(x * scl, y * scl);
      let distance = mousePos.dist(gridPos);
      if (distance < 100) { 
        let repelForce = p5.Vector.sub(gridPos, mousePos);
        repelForce.setMag(map(distance, 0, 500, 1, 0)); 
        v.add(repelForce);
      }
      
      flowField[index] = v;

      stroke(216, 158, 179, 150); 
      strokeWeight(0.05);
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
  for (let i = 0; i < particles.length; i++) {
    particles[i].follow(flowField);
    particles[i].update();
    particles[i].edges();
    particles[i].show();
  }
  
  fr.html(floor(frameRate()) + " fps");
}

class Particle {
  constructor(x,y) {
    this.pos = createVector(x,y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 4; 
    this.color = color(216, 158, 179); 
  }

  follow(vectors) {
    let x = floor(this.pos.x / scl);
    let y = floor(this.pos.y / scl);
    let index = x + y * cols;
    let force = vectors[index];
    this.applyForce(force);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  edges() {
    if (this.pos.x > width) this.pos.x = random(0, width);
    if (this.pos.x < 0) this.pos.x = random(0, width);
    if (this.pos.y > height) this.pos.y = random(0, height);
    if (this.pos.y < 0) this.pos.y = random(0, height);
  }

  show() {
    stroke(this.color);
    strokeWeight(2);
    point(this.pos.x, this.pos.y);
  }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight); 
    cols = floor(width / scl);
    rows = floor(height / scl);
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