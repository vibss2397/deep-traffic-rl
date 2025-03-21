/**
 * Road generation for Doodle Dash
 */

// Road variables
let roadWidth = 300;
let roadPos = 300; // center of the road

// Draw road that looks like it's drawn on the notebook
function drawNotebookRoad() {
  // Define road edges with sketchy lines
  stroke(0);
  strokeWeight(2);
  
  // Left edge with sketch-like quality
  beginShape();
  for (let y = 0; y < height; y += 10) {
    // Add noise to x-position for sketchy effect
    let xPos = roadPos - roadWidth/2 + random(-2, 2);
    vertex(xPos, y);
  }
  endShape();
  
  // Right edge with sketch-like quality
  beginShape();
  for (let y = 0; y < height; y += 10) {
    // Add noise to x-position for sketchy effect
    let xPos = roadPos + roadWidth/2 + random(-2, 2);
    vertex(xPos, y);
  }
  endShape();
  
  // Draw center lane line (dashed)
  stroke(0);
  strokeWeight(1.5);
  
  for (let y = 0; y < height; y += 80) {
    // Dashed center line with hand-drawn quality
    if (y % 160 < 80) { // Create dashed effect
      push();
      translate(roadPos, y + 20);
      
      // Draw a slightly wavy line
      beginShape();
      for (let i = 0; i < 40; i += 5) {
        vertex(random(-1, 1), i);
      }
      endShape();
      pop();
    }
  }
  
  // Add some road texture details (like small stones/marks on the road)
  for (let i = 0; i < 30; i++) {
    // Only draw details within road boundaries
    let x = random(roadPos - roadWidth/2 + 20, roadPos + roadWidth/2 - 20);
    let y = random(height);
    
    stroke(0, 80);
    strokeWeight(1);
    point(x, y);
    
    // Occasionally draw small scratches
    if (random() > 0.7) {
      let scratchLen = random(5, 15);
      let angle = random(TWO_PI);
      line(x, y, x + cos(angle) * scratchLen, y + sin(angle) * scratchLen);
    }
  }
  
  // Add arrow markings on the road
  drawRoadArrows();
}

// Draw directional arrows on the road
function drawRoadArrows() {
  stroke(0);
  strokeWeight(1.5);
  
  for (let y = 100; y < height; y += 250) {
    push();
    translate(roadPos, y);
    
    // Draw arrow body
    line(0, -20, 0, 20);
    
    // Draw arrow head with hand-drawn imperfections
    line(0, 20, -5 + random(-1, 1), 15 + random(-1, 1));
    line(0, 20, 5 + random(-1, 1), 15 + random(-1, 1));
    
    pop();
  }
}