/* =========================================================================
   IRELAND CONFLICT - SWARM + SOUND
   Features: Swarm, Scatter, Footstep/Shuffling Sound
=========================================================================
*/

const CFG = {
  TIME: 0.75,
  COUNT: 2500,
  SPEED: 12,
  FORCE: 0.6,
  CHAOS: 0.8,
  EDGE: 50,
  MIN: 4, MAX: 8,

  // --- ADJUST THESE TWO NUMBERS ---
  SCATTER_FORCE: 15,  // Lowered from 25 (So they fly slower)
  SCATTER_TIME: 200   // Lowered from 500 (So they stop flying away sooner)
};

let imgs = [], active, idx = 0, slideTimer = 0, tOff = 0, parts = [];
let isScattering = false;
let scatterTimer = 0;

// AUDIO VARIABLES
let noiseGen;
let audioStarted = false; // Tracks if user has clicked yet

function preload() {
  const files = [
    'derry.JPG', 'wall.jpg', 'wall2.jpg', 'wall3.jpg', 'flag.png',
    'mural.jpg', 'mural2.jpg', 'mural3.jpg', 'mc.jpg',
    'troubles.webp', 'commercial.webp'
  ];
  files.forEach(f => imgs.push(loadImage(f)));
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  noStroke();

  // --- AUDIO SETUP ---
  // We use Brown Noise because it sounds like a distant crowd or gravel
  noiseGen = new p5.Noise('brown');
  noiseGen.amp(0); // Start silent
  noiseGen.start();

  // Image Setup
  imgs.forEach(img => {
    if (img) {
      img.resize(width, height);
      img.loadPixels();
    }
  });

  active = imgs[0];
  parts = Array.from({ length: CFG.COUNT }, (_, i) => new Particle(i));
  slideTimer = millis();
}

function draw() {
  background(255);

  tOff += 0.01;
  const target = createVector(mouseX, mouseY);

  // Slideshow Logic
  if (millis() > slideTimer + (CFG.TIME * 1000)) {
    idx = (idx + 1) % imgs.length;
    active = imgs[idx];
    slideTimer = millis();
  }

  // Scatter Timer
  if (isScattering && millis() > scatterTimer + CFG.SCATTER_TIME) {
    isScattering = false;
  }

  // --- AUDIO DYNAMICS ---
  if (audioStarted) {
    // If scattering (exploding), volume is LOUD (0.8)
    // If normal swarming, volume is QUIET (0.1)
    let targetVol = isScattering ? 0.8 : 0.15;

    // "lerp" makes the volume change smooth instead of choppy
    let currentVol = noiseGen.getAmp();
    noiseGen.amp(lerp(currentVol, targetVol, 0.1));
  }

  // Update Particles
  for (let p of parts) {
    p.behaviors(target);
    p.update();
    p.show(active);
  }
}

function mousePressed() {
  // --- START AUDIO ON FIRST CLICK ---
  if (!audioStarted) {
    userStartAudio(); // Helper function to unlock browser audio
    audioStarted = true;
  }

  // Trigger Scatter
  isScattering = true;
  scatterTimer = millis();
}

class Particle {
  constructor(id) {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D();
    this.acc = createVector();
    this.id = id;
    this.sz = random(CFG.MIN, CFG.MAX);
  }

  behaviors(target) {
    let seek;
    if (isScattering) {
      let dir = p5.Vector.sub(this.pos, target);
      dir.setMag(CFG.SCATTER_FORCE);
      seek = dir;
    } else {
      let desired = p5.Vector.sub(target, this.pos);
      desired.setMag(CFG.SPEED);
      seek = p5.Vector.sub(desired, this.vel);
      seek.limit(CFG.FORCE);
    }

    let nX = noise(this.id, tOff), nY = noise(this.id + 1000, tOff);
    let chaos = createVector(map(nX, 0, 1, -1, 1), map(nY, 0, 1, -1, 1)).mult(CFG.CHAOS);

    let b = createVector();
    if (this.pos.x < CFG.EDGE) b.x = CFG.SPEED;
    else if (this.pos.x > width - CFG.EDGE) b.x = -CFG.SPEED;
    if (this.pos.y < CFG.EDGE) b.y = CFG.SPEED;
    else if (this.pos.y > height - CFG.EDGE) b.y = -CFG.SPEED;
    if (b.mag() > 0) b.setMag(CFG.SPEED).sub(this.vel).limit(CFG.FORCE).mult(1.5);

    this.acc.add(seek).add(chaos).add(b);
  }

  update() {
    let limit = isScattering ? CFG.SCATTER_FORCE : CFG.SPEED;
    this.vel.add(this.acc).limit(limit);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  show(img) {
    let x = (this.pos.x) | 0;
    let y = (this.pos.y) | 0;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    let index = (y * img.width + x) * 4;
    let r = img.pixels[index];
    let g = img.pixels[index + 1];
    let b = img.pixels[index + 2];

    fill(r, g, b);
    square(x, y, this.sz);
  }
}