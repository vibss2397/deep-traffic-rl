/**
 * Player car logic for Doodle Dash
 */

// Player car with enhanced physics
let playerCar = {
    x: 300,
    y: 700,
    width: 40,
    height: 70,
    speedX: 0,
    speedY: 0,
    maxSpeed: 5,
    acceleration: 0.2,
    friction: 0.9,
    tilt: 0,
    maxTilt: 0.15,
    collided: false
  };
  
  // Update car physics based on input
  function updateCarPhysics() {
    // Apply input as acceleration
    if (keyIsDown(65)) { // A key - left
      playerCar.speedX -= playerCar.acceleration;
      // Tilt car left
      playerCar.tilt = lerp(playerCar.tilt, playerCar.maxTilt, 0.1);
    } else if (keyIsDown(68)) { // D key - right
      playerCar.speedX += playerCar.acceleration;
      // Tilt car right
      playerCar.tilt = lerp(playerCar.tilt, -playerCar.maxTilt, 0.1);
    } else {
      // Return tilt to neutral
      playerCar.tilt = lerp(playerCar.tilt, 0, 0.2);
    }
    
    if (keyIsDown(87)) { // W key - up
      playerCar.speedY -= playerCar.acceleration;
    } else if (keyIsDown(83)) { // S key - down
      playerCar.speedY += playerCar.acceleration;
    }
    
    // Apply friction
    playerCar.speedX *= playerCar.friction;
    playerCar.speedY *= playerCar.friction;
    
    // Limit max speed
    playerCar.speedX = constrain(playerCar.speedX, -playerCar.maxSpeed, playerCar.maxSpeed);
    playerCar.speedY = constrain(playerCar.speedY, -playerCar.maxSpeed, playerCar.maxSpeed);
    
    // Update position
    playerCar.x += playerCar.speedX;
    playerCar.y += playerCar.speedY;
    
    // Keep the car within the road boundaries
    let minX = roadPos - roadWidth/2 + playerCar.width/2;
    let maxX = roadPos + roadWidth/2 - playerCar.width/2;
    
    // Bounce off boundaries
    if (playerCar.x < minX) {
      playerCar.x = minX;
      playerCar.speedX *= -0.5; // Bounce back with reduced speed
    } else if (playerCar.x > maxX) {
      playerCar.x = maxX;
      playerCar.speedX *= -0.5; // Bounce back with reduced speed
    }
    
    // Constrain vertical movement
    playerCar.y = constrain(playerCar.y, height/2, height - 100);
    
    // Stop car if speed is very low
    if (abs(playerCar.speedX) < 0.01) playerCar.speedX = 0;
    if (abs(playerCar.speedY) < 0.01) playerCar.speedY = 0;
  }
  
  // Draw motion lines behind the car
  function drawMotionLines() {
    stroke(0, 100);
    strokeWeight(1);
    
    let speed = max(abs(playerCar.speedX), abs(playerCar.speedY));
    let lineLength = map(speed, 0, playerCar.maxSpeed, 5, 20);
    
    // Draw several motion lines behind the car
    for (let i = -15; i <= 15; i += 10) {
      let lineX = playerCar.x + i;
      let lineStartY = playerCar.y + playerCar.height/2;
      
      // Draw wavy motion line
      beginShape();
      for (let j = 0; j < lineLength; j += 5) {
        let xOffset = random(-2, 2);
        vertex(lineX + xOffset, lineStartY + j + random(-1, 1));
      }
      endShape();
    }
  }
  
  // Draw enhanced doodle car
  function drawDoodleCar(x, y, tilt, isCollided) {
    push();
    translate(x, y);
    
    // Add collision effect or tilt effect
    if (isCollided) {
      rotate(random(-0.1, 0.1)); // Wobble when collided
    } else {
      rotate(tilt); // Tilt when turning
    }
    
    rectMode(CENTER);
    
    // Car shadow (offset slightly)
    noStroke();
    fill(0, 20);
    ellipse(2, 5, playerCar.width + 5, playerCar.height/2);
    
    // Car body with sketchy line quality
    stroke(0);
    strokeWeight(2);
    fill(255);
    
    // Draw car body with slight irregularities for hand-drawn effect
    beginShape();
    // Top-left corner with rounded edge
    vertex(-playerCar.width/2 + 5, -playerCar.height/2);
    // Top edge
    vertex(playerCar.width/2 - 5, -playerCar.height/2);
    // Top-right corner with rounded edge
    vertex(playerCar.width/2, -playerCar.height/2 + 5);
    // Right edge with slight irregularity
    vertex(playerCar.width/2 + random(-1, 1), playerCar.height/2 - 5);
    // Bottom-right corner with rounded edge
    vertex(playerCar.width/2 - 5, playerCar.height/2);
    // Bottom edge with slight irregularity
    vertex(-playerCar.width/2 + 5 + random(-1, 1), playerCar.height/2);
    // Bottom-left corner with rounded edge
    vertex(-playerCar.width/2, playerCar.height/2 - 5);
    // Left edge with slight irregularity
    vertex(-playerCar.width/2 + random(-1, 1), -playerCar.height/2 + 5);
    endShape(CLOSE);
    
    // Windows with hand-drawn effect
    fill(240);
    beginShape();
    vertex(-15, -25);
    vertex(15, -25);
    vertex(15, -5);
    vertex(-15, -5);
    endShape(CLOSE);
    
    // Add window details
    line(-5, -25, -5, -5); // Window divider
    
    // Wheels with sketchy circles
    fill(0);
    drawSketchyCircle(-15, -25, 12);
    drawSketchyCircle(15, -25, 12);
    drawSketchyCircle(-15, 25, 12);
    drawSketchyCircle(15, 25, 12);
    
    // Headlights
    fill(255, 255, 200);
    drawSketchyCircle(-10, -32, 5);
    drawSketchyCircle(10, -32, 5);
    
    // Taillights
    fill(255, 100, 100);
    drawSketchyCircle(-10, 32, 5);
    drawSketchyCircle(10, 32, 5);
    
    // Additional car details
    stroke(0);
    strokeWeight(1);
    line(0, -5, 0, 20); // Center detail line
    
    // Door handle
    line(-18, 0, -10, 0);
    
    pop();
  }