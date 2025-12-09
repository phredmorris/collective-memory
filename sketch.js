/* =========================================================================
   IRELAND CONFLICT - SWARM SLIDESHOW
=========================================================================
*/

// SETTINGS
const SWITCH_TIME_SECONDS = 0.75; // Change slides every 5 seconds
const PARTICLE_COUNT = 2500;   // Number of "bees"
const MAX_SPEED = 12; 
const MAX_FORCE = 0.6; 
const CHAOS_FORCE = 0.8; 
const EDGE_BUFFER = 50; 
const MIN_SIZE = 4;
const MAX_SIZE = 8;

let sourceImages = []; 
let activeImage;       
let currentImageIndex = 0; 
let slideTimer = 0;    
let timeOffset = 0;    
let particles = [];

function preload() {
  // --- ADD YOUR IMAGES HERE ---
  // Make sure these match the names in your sidebar exactly (Case Sensitive!)
  sourceImages[0] = loadImage('derry.JPG');
  sourceImages[1] = loadImage('wall.jpg');
  sourceImages[2] = loadImage('wall2.jpg');
  sourceImages[2] = loadImage('wall3.jpg');
  sourceImages[2] = loadImage('flag.png');
  sourceImages[2] = loadImage('mural.jpg');
  sourceImages[2] = loadImage('mural2.jpg');
  sourceImages[2] = loadImage('mural3.jpg');
  sourceImages[2] = loadImage('mc.jpg');
  sourceImages[2] = loadImage('troubles.webp');
  sourceImages[2] = loadImage('commercial.webp');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Resize all images to fit the screen
  for(let img of sourceImages) {
    if (img) img.resize(width, height);
  }
  
  // Set the first image to start
  activeImage = sourceImages[0];
  
  // Create the swarm
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle(i));
  }
  
  noStroke(); 
  slideTimer = millis();
}

function draw() {
  background(255); 
  let target = createVector(mouseX, mouseY);
  timeOffset += 0.01;

  // --- SLIDESHOW TIMER LOGIC ---
  // Check if 5 seconds have passed
  if (millis() > slideTimer + (SWITCH_TIME_SECONDS * 1000)) {
    // Move to next image index (0 -> 1 -> 2 -> 0...)
    currentImageIndex = (currentImageIndex + 1) % sourceImages.length;
    activeImage = sourceImages[currentImageIndex];
    
    // Reset timer
    slideTimer = millis();
  }

  // --- UPDATE PARTICLES ---
  for (let p of particles) {
    p.applyBehaviors(target); 
    p.update();               
    p.show(activeImage);      
  }
}

// --- PARTICLE CLASS ---
class Particle {
  constructor(index) {
    this.pos = createVector(random(width * 0.1, width * 0.9), random(height * 0.1, height * 0.9));
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.id = index; 
    this.size = random(MIN_SIZE, MAX_SIZE);
  }

  applyBehaviors(target) {
    let seekForce = this.seek(target);
    let chaosForce = this.chaos();
    let boundaryForce = this.avoidEdges();
    
    seekForce.mult(1.0);    
    chaosForce.mult(1.0);    
    boundaryForce.mult(1.5); 

    this.acc.add(seekForce);
    this.acc.add(chaosForce);
    this.acc.add(boundaryForce);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(MAX_SPEED);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(MAX_FORCE); 
    return steer;
  }
  
  chaos() {
    let nX = noise(this.id, timeOffset); 
    let nY = noise(this.id + 1000, timeOffset); 
    let c = createVector(map(nX, 0, 1, -1, 1), map(nY, 0, 1, -1, 1));
    c.mult(CHAOS_FORCE);
    return c;
  }

  avoidEdges() {
    let desired = null;
    if (this.pos.x < EDGE_BUFFER) {
      desired = createVector(MAX_SPEED, this.vel.y); 
    } else if (this.pos.x > width - EDGE_BUFFER) {
      desired = createVector(-MAX_SPEED, this.vel.y); 
    } else if (this.pos.y < EDGE_BUFFER) {
      desired = createVector(this.vel.x, MAX_SPEED); 
    } else if (this.pos.y > height - EDGE_BUFFER) {
      desired = createVector(this.vel.x, -MAX_SPEED); 
    }
    
    if (desired != null) {
      desired.normalize();
      desired.mult(MAX_SPEED);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(MAX_FORCE);
      return steer;
    } else {
      return createVector(0, 0); 
    }
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(MAX_SPEED);
    this.pos.add(this.vel);
    this.acc.mult(0); 
  }

  show(img) {
    // Only draw if image is loaded properly
    if (img && img.width > 0 && this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height) {
      let x = floor(this.pos.x);
      let y = floor(this.pos.y);
      let c = img.get(x, y);
      fill(c);
      square(this.pos.x, this.pos.y, this.size);
    }
  }
}