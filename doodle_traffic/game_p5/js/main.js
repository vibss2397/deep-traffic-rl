/**
 * Main game file for Doodle Dash
 */

// Canvas setup
function setup() {
  createCanvas(600, 800);
  console.log("Canvas created with size 600x800");
  
  // Create random smudges and stains
  createPaperDecorations();
}

// Main draw loop
function draw() {
  background(245); // Off-white like notebook paper
  
  // Draw notebook paper grid lines and decorations
  drawNotebookPaper();
  
  // Draw notebook road
  drawNotebookRoad();
  
  // Handle player input and update car physics
  updateCarPhysics();
  
  // Draw player car
  drawDoodleCar(playerCar.x, playerCar.y, playerCar.tilt, playerCar.collided);
  
  // Draw motion lines if moving
  if (abs(playerCar.speedX) > 0.5 || abs(playerCar.speedY) > 0.5) {
    drawMotionLines();
  }
  
  // Draw debug info
  fill(0);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Car position: x=${Math.round(playerCar.x)}, y=${Math.round(playerCar.y)}`, 20, 20);
  text(`Speed: x=${playerCar.speedX.toFixed(2)}, y=${playerCar.speedY.toFixed(2)}`, 20, 40);
  text(`Controls: W, A, S, D keys to move`, 20, 60);
  text(`Press C to toggle collision effect`, 20, 80);
}

// Toggle collision for testing (press C)
function keyPressed() {
  if (key === 'c' || key === 'C') {
    playerCar.collided = !playerCar.collided;
    console.log("Collision state:", playerCar.collided);
  }
}