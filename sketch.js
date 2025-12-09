/* =========================================================================
   CONFIGURATION SECTION
   (Change these numbers to alter the art's behavior)
=========================================================================
*/

// --- DENSITY ---
// How many "bees" are on screen?
// 1000 = Sparse, fast. 
// 3000 = Dense, detailed image, but might run slow on old laptops.
const PARTICLE_COUNT = 2500; 

// --- VISUALS ---
// The size range of the square pixels (in pixels)
const MIN_SIZE = 4;
const MAX_SIZE = 8;

// --- PHYSICS (THE SWARM FEEL) ---
// MAX_SPEED: How fast pixels fly across the screen.
// Higher = More energy. Lower = Lazier movement.
const MAX_SPEED = 12; 

// MAX_FORCE: How sharp are their turns?
// High (1.0) = Like a fly; snaps instantly to new directions.
// Low (0.1) = Like a drifting boat; takes a while to turn.
const MAX_FORCE = 0.6; 

// CHAOS_FORCE: The "Jitter".
// 0.0 = Perfectly smooth robotic movement.
// 2.0 = Extremely erratic, nervous energy.
const CHAOS_FORCE = 0.8; 

// EDGE_BUFFER: Wall Repulsion.
// How many pixels away from the wall do they start turning back?
const EDGE_BUFFER = 50; 

/* ========================================================================= */

let sourceImage; // Will hold the photo
let particles = []; // Will hold our array of "bees"
let timeOffset = 0; // Used to animate the chaos noise over time

function preload() {
  // --- IMAGE LOADER ---
  // To use your own image:
  // 1. Upload file to p5 editor.
  // 2. Change the name inside quotes below to match your file (e.g. 'me.jpg')
  sourceImage = loadImage('https://picsum.photos/800/800'); 
}

function setup() {
  // Create a canvas that fills the window
  createCanvas(windowWidth, windowHeight);
  
  // Resize the image so 1 pixel on image = 1 pixel on canvas
  sourceImage.resize(width, height);
  
  // Create the swarm
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Pass 'i' as the ID so every particle has a unique personality
    particles.push(new Particle(i));
  }
  
  // Turn off black outlines on the squares for a cleaner look
  noStroke(); 
}

function draw() {
  // --- DRAW LOOP (Runs 60 times per second) ---
  
  // Clear background to white every frame
  background(255); 
  
  // Identify where the mouse is
  let target = createVector(mouseX, mouseY);
  
  // Advance time slightly so the "chaos" wind shifts direction smoothly
  timeOffset += 0.01;

  // Update every single particle
  for (let p of particles) {
    p.applyBehaviors(target); // Calculate forces (Seek, Chaos, Avoid Walls)
    p.update();               // Move position
    p.show(sourceImage);      // Draw the colored square
  }
}

/* =========================================================================
   PARTICLE CLASS
   (The logic for each individual pixel)
=========================================================================
*/

class Particle {
  constructor(index) {
    // Spawn randomly, but within the inner 80% of screen to avoid starting on walls
    this.pos = createVector(random(width * 0.1, width * 0.9), random(height * 0.1, height * 0.9));
    
    // Initial random movement direction
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    
    this.id = index; // Unique ID used for noise calculation
    this.size = random(MIN_SIZE, MAX_SIZE);
  }

  applyBehaviors(target) {
    // 1. SEEK: Calculate force to fly towards mouse
    let seekForce = this.seek(target);
    
    // 2. CHAOS: Calculate random jitter force
    let chaosForce = this.chaos();
    
    // 3. WALLS: Calculate force to push away from edges
    let boundaryForce = this.avoidEdges();
    
    // --- FORCE WEIGHTING ---
    // Here we decide which force is most important.
    seekForce.mult(1.0);     // Normal priority
    chaosForce.mult(1.0);    // Normal priority
    boundaryForce.mult(1.5); // High priority (Don't get stuck!)

    // Add all forces to acceleration
    this.acc.add(seekForce);
    this.acc.add(chaosForce);
    this.acc.add(boundaryForce);
  }

  seek(target) {
    // "Reynolds Steering Formula": 
    // Steer = Desired Velocity - Current Velocity
    let desired = p5.Vector.sub(target, this.pos);
    
    // Unlike previous versions, we ALWAYS run at max speed (no slowing down)
    desired.setMag(MAX_SPEED);
    
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(MAX_FORCE); // Limit how sharp the turn is
    return steer;
  }
  
  chaos() {
    // Use Perlin noise to create smooth randomness
    // We use (this.id) so every particle gets a different noise value
    let nX = noise(this.id, timeOffset); 
    let nY = noise(this.id + 1000, timeOffset); 
    
    // Map noise (0 to 1) to a vector direction (-1 to 1)
    let c = createVector(map(nX, 0, 1, -1, 1), map(nY, 0, 1, -1, 1));
    
    // Scale it by the chaos setting
    c.mult(CHAOS_FORCE);
    return c;
  }

  avoidEdges() {
    let desired = null;
    
    // Check Left Edge
    if (this.pos.x < EDGE_BUFFER) {
      desired = createVector(MAX_SPEED, this.vel.y); // Go Right
    } 
    // Check Right Edge
    else if (this.pos.x > width - EDGE_BUFFER) {
      desired = createVector(-MAX_SPEED, this.vel.y); // Go Left
    } 
    // Check Top Edge
    else if (this.pos.y < EDGE_BUFFER) {
      desired = createVector(this.vel.x, MAX_SPEED); // Go Down
    } 
    // Check Bottom Edge
    else if (this.pos.y > height - EDGE_BUFFER) {
      desired = createVector(this.vel.x, -MAX_SPEED); // Go Up
    }
    
    // If we are near an edge, steer away
    if (desired != null) {
      desired.normalize();
      desired.mult(MAX_SPEED);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(MAX_FORCE);
      return steer;
    } else {
      return createVector(0, 0); // No force needed if not near wall
    }
  }

  update() {
    // Standard Physics Engine:
    // Velocity changes Position. Acceleration changes Velocity.
    this.vel.add(this.acc);
    this.vel.limit(MAX_SPEED);
    this.pos.add(this.vel);
    
    // Clear acceleration for the next frame
    this.acc.mult(0); 
  }

  show(img) {
    // Only draw if we are actually on screen (safety check)
    if (this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height) {
      
      // Round position to whole numbers to find pixel
      let x = floor(this.pos.x);
      let y = floor(this.pos.y);
      
      // Get the color from the loaded image at this location
      let c = img.get(x, y);
      
      // Set the fill color and draw the square
      fill(c);
      square(this.pos.x, this.pos.y, this.size);
    }
  }
}