/**
 * Decorations for the Doodle Dash game
 */

// Decorative elements
let paperSmudges = [];
let coffeeStains = [];

// Create paper decorations (smudges, stains)
function createPaperDecorations() {
  // Create random pencil smudges
  for (let i = 0; i < 5; i++) {
    paperSmudges.push({
      x: random(width),
      y: random(height),
      width: random(30, 80),
      height: random(10, 30),
      rotation: random(-PI/4, PI/4),
      opacity: random(10, 30)
    });
  }
  
  // Create coffee stains
  for (let i = 0; i < 2; i++) {
    coffeeStains.push({
      x: random(width),
      y: random(height),
      size: random(50, 120),
      opacity: random(5, 15)
    });
  }
}

// Draw notebook paper effect with enhanced details
function drawNotebookPaper() {
  // Draw coffee stains (under the grid)
  drawCoffeeStains();
  
  // Draw grid lines
  stroke(200);
  strokeWeight(1);
  
  // Horizontal lines
  for (let y = 0; y < height; y += 20) {
    // Add slight variance to lines for hand-drawn feel
    beginShape();
    for (let x = 0; x < width; x += 50) {
      vertex(x, y + random(-0.5, 0.5));
    }
    endShape();
  }
  
  // Vertical margin line (slightly wavy for hand-drawn effect)
  stroke(255, 0, 0, 30);
  strokeWeight(1.5);
  beginShape();
  for (let y = 0; y < height; y += 20) {
    vertex(width * 0.1 + random(-1, 1), y);
  }
  endShape();
  
  // Draw pencil smudges (over the grid)
  drawPencilSmudges();
}

// Draw coffee stains
function drawCoffeeStains() {
  for (let stain of coffeeStains) {
    noStroke();
    fill(139, 69, 19, stain.opacity); // Brown with low opacity
    
    // Draw irregular coffee stain shape
    beginShape();
    for (let i = 0; i < 360; i += 30) {
      let radius = stain.size * (0.5 + 0.5 * noise(i * 0.1, frameCount * 0.01));
      let x = stain.x + radius * cos(radians(i));
      let y = stain.y + radius * sin(radians(i));
      curveVertex(x, y);
    }
    endShape(CLOSE);
  }
}

// Draw pencil smudges
function drawPencilSmudges() {
  for (let smudge of paperSmudges) {
    noStroke();
    fill(40, smudge.opacity);
    
    push();
    translate(smudge.x, smudge.y);
    rotate(smudge.rotation);
    
    // Draw smudge with noise
    beginShape();
    for (let i = 0; i < 10; i++) {
      let xPos = map(i, 0, 9, -smudge.width/2, smudge.width/2);
      let yVar = random(-smudge.height/2, smudge.height/2);
      curveVertex(xPos, yVar);
    }
    endShape();
    pop();
  }
}