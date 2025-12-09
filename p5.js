/* =========================================================================
   IRELAND CONFLICT - SWARM (CLICK TO SCATTER)
========================================================================= */

const CFG = {
  TIME: 0.75,
  COUNT: 2500,
  SPEED: 12,
  FORCE: 0.6,
  CHAOS: 0.8,
  EDGE: 50,
  MIN: 4, MAX: 8,
  SCATTER_FORCE: 20, // How hard they explode away
  SCATTER_TIME: 500  // How long the explosion lasts (ms)
};

let imgs = [], active, idx = 0, slideTimer = 0, tOff = 0, parts = [];
let isScattering = false;
let scatterTimer = 0;

function preload() {
  const files = [
    'derry.JPG', 'wall.jpg', 'wall2.jpg', 'wall3.jpg', 'flag.png',
    'mural.jpg', 'mural2.jpg', 'mural3.jpg', 'mc.jpg',
    'troubles.webp', 'commercial.webp'
  ];
  files.forEach(f => imgs.push(loadImage(f)));
}

function setup() {
  // Optimization settings
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  noSmooth();

  imgs.forEach(img => {
    if (img) {
      img.resize(width, height);
      img.loadPixels();
    }
  });

  active = imgs[0];
  parts = Array.from({ length: CFG.COUNT }, (_, i) => new Particle(i));
  noStroke();
  slideTimer = millis();
}

function draw() {
  background(255);

  tOff += 0.01;
  const target = createVector(mouseX, mouseY);

  // --- 1. SLIDESHOW LOGIC ---
  if (millis() > slideTimer + (CFG.TIME * 1000)) {
    idx = (idx + 1) % imgs.length;
    active = imgs[idx];
    slideTimer = millis();
  }

  // --- 2. SCATTER LOGIC ---
  // If we clicked recently, check if time is up
  if (isScattering && millis() > scatterTimer + CFG.SCATTER_TIME) {
    isScattering = false; // Stop scattering, return to normal
  }

  // --- 3. UPDATE PARTICLES ---
  for (let p of parts) {
    p.behaviors(target);
    p.update();
    p.show(active);
  }
}

// --- MOUSE CLICK TRIGGER ---
function mousePressed() {
  isScattering = true;
  scatterTimer = millis(); // Start the countdown
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

    // --- DECIDE: SEEK OR SCATTER? ---
    if (isScattering) {
      // SCATTER: Calculate vector pointing AWAY from mouse
      let dir = p5.Vector.sub(this.pos, target); // Direction = Me minus Mouse
      dir.setMag(CFG.SCATTER_FORCE); // Set to explosion speed

      // Override steering logic: apply massive force immediately
      seek = dir;
    } else {
      // NORMAL: Seek the mouse
      let desired = p5.Vector.sub(target, this.pos);
      desired.setMag(CFG.SPEED);
      seek = p5.Vector.sub(desired, this.vel);
      seek.limit(CFG.FORCE);
    }

    // Chaos Force (Noise)
    let nX = noise(this.id, tOff), nY = noise(this.id + 1000, tOff);
    let chaos = createVector(map(nX, 0, 1, -1, 1), map(nY, 0, 1, -1, 1)).mult(CFG.CHAOS);

    // Wall Repulsion
    let b = createVector();
    if (this.pos.x < CFG.EDGE) b.x = CFG.SPEED;
    else if (this.pos.x > width - CFG.EDGE) b.x = -CFG.SPEED;
    if (this.pos.y < CFG.EDGE) b.y = CFG.SPEED;
    else if (this.pos.y > height - CFG.EDGE) b.y = -CFG.SPEED;
    if (b.mag() > 0) b.setMag(CFG.SPEED).sub(this.vel).limit(CFG.FORCE).mult(1.5);

    this.acc.add(seek).add(chaos).add(b);
  }

  update() {
    // If scattering, we allow them to move faster than normal limit
    let limit = isScattering ? CFG.SCATTER_FORCE : CFG.SPEED;

    this.vel.add(this.acc).limit(limit);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  show(img) {
    let x = Math.floor(this.pos.x);
    let y = Math.floor(this.pos.y);

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    // Fast pixel lookup
    let index = (y * img.width + x) * 4;
    let r = img.pixels[index];
    let g = img.pixels[index + 1];
    let b = img.pixels[index + 2];

    fill(r, g, b);
    square(this.pos.x, this.pos.y, this.sz);
  }
}