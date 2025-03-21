// Traffic Navigation Game - 3D Behind View Implementation

// Game constants
let GAME_WIDTH;
let GAME_HEIGHT;
const LANE_COUNT = 6;
let LANE_WIDTH;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 100;
const ENEMY_WIDTH = 60;
const ENEMY_HEIGHT = 100;
const PLAYER_SPEED = 20;
const ROAD_SPEED = 5;
const ENEMY_MIN_SPEED = 2;
const ENEMY_MAX_SPEED = 4;
const ENEMY_SPAWN_RATE = 0.02; // Probability of spawning per frame

// Perspective constants
const HORIZON_Y = 0.4; // Position of horizon line (0-1)
const VANISHING_SCALE = 0.2; // Scale at vanishing point
const ROAD_WIDTH_TOP = 0.5; // Road width at horizon (proportion of screen)
const ROAD_WIDTH_BOTTOM = 0.95; // Road width at bottom (proportion of screen)

// Game variables
let player;
let enemies = [];
let roadMarkers = [];
let gameOver = false;
let score = 0;

function setup() {
  // Create a full screen canvas
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  
  createCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Calculate lane width at bottom of screen
  LANE_WIDTH = (ROAD_WIDTH_BOTTOM * GAME_WIDTH) / LANE_COUNT;
  
  // Create player car
  player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    lane: Math.floor(LANE_COUNT / 2), // Middle lane
    targetLane: Math.floor(LANE_COUNT / 2) // For smooth movement
  };
  
  // Initialize road markers
  createRoadMarkers();
}

function createRoadMarkers() {
  roadMarkers = [];
  // Create lane dividers
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    for (let y = 0; y < 20; y++) {
      let yPos = y * 100 - 40 * (y % 2); // Staggered markers
      roadMarkers.push({
        lane: lane,
        y: yPos,
        // We'll calculate x during drawing for perspective
      });
    }
  }
}

function draw() {
  if (gameOver) {
    displayGameOver();
    return;
  }
  
  // Game logic
  handleInput();
  updateRoad();
  updateEnemies();
  spawnEnemies();
  checkCollisions();
  updateScore();
  
  // Draw game
  background(50); // Dark background
  drawSky();
  drawRoad();
  drawEnemies();
  drawPlayer();
  drawScore();
}

function drawSky() {
  // Draw sky gradient
  const horizonY = GAME_HEIGHT * HORIZON_Y;
  fill(135, 206, 235); // Sky blue
  rect(0, 0, GAME_WIDTH, horizonY);
  
  // Simple horizon elements
  fill(100, 200, 100); // Green
  rect(0, horizonY - 5, GAME_WIDTH, 20); // Grass at horizon
}

function handleInput() {
  // Move towards target lane smoothly
  const targetX = getLaneX(player.targetLane, 1.0); // At bottom of screen
  
  if (Math.abs(player.x - targetX) < PLAYER_SPEED) {
    player.x = targetX;
    player.lane = player.targetLane;
  } else if (player.x < targetX) {
    player.x += PLAYER_SPEED;
  } else {
    player.x -= PLAYER_SPEED;
  }
}

function updateRoad() {
  // Move road markers
  for (let marker of roadMarkers) {
    marker.y += ROAD_SPEED;
    if (marker.y > GAME_HEIGHT) {
      marker.y = -20;
    }
  }
}

// Get lane x-coordinate with perspective
function getLaneX(lane, yPercent) {
  // yPercent 0 = horizon, 1 = bottom of screen
  const horizonX = GAME_WIDTH / 2;
  const roadWidthAtY = lerp(ROAD_WIDTH_TOP * GAME_WIDTH, ROAD_WIDTH_BOTTOM * GAME_WIDTH, yPercent);
  const laneWidthAtY = roadWidthAtY / LANE_COUNT;
  
  // Calculate normalized lane position (-0.5 to 0.5 for center of each lane)
  const normalizedLane = (lane / LANE_COUNT) - (0.5 - 1/(LANE_COUNT*2));
  
  return horizonX + normalizedLane * roadWidthAtY;
}

// Get perspective scale based on y position
function getPerspectiveScale(yPercent) {
  // yPercent 0 = horizon, 1 = bottom of screen
  return lerp(VANISHING_SCALE, 1.0, yPercent);
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.yPercent += (enemy.speed / GAME_HEIGHT);
    
    // Calculate real Y position based on perspective
    enemy.y = lerp(GAME_HEIGHT * HORIZON_Y, GAME_HEIGHT, enemy.yPercent);
    
    // Calculate x position based on perspective
    enemy.x = getLaneX(enemy.lane, enemy.yPercent);
    
    // Calculate scale based on perspective
    enemy.scale = getPerspectiveScale(enemy.yPercent);
    
    // Remove enemies that are past the player
    if (enemy.y > GAME_HEIGHT + ENEMY_HEIGHT) {
      enemies.splice(i, 1);
    }
  }
}

function spawnEnemies() {
  // Random chance to spawn an enemy
  if (random() < ENEMY_SPAWN_RATE) {
    // Determine which lane to spawn in
    let lane = floor(random(LANE_COUNT));
    
    // Check if lane is free (no enemies close to spawn point)
    let laneFree = true;
    for (let enemy of enemies) {
      if (enemy.lane === lane && enemy.yPercent < 0.2) {
        laneFree = false;
        break;
      }
    }
    
    if (laneFree) {
      let enemy = {
        lane: lane,
        yPercent: 0, // Start at horizon
        y: GAME_HEIGHT * HORIZON_Y,
        x: getLaneX(lane, 0),
        scale: VANISHING_SCALE,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        speed: random(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED)
      };
      enemies.push(enemy);
    }
  }
}

function checkCollisions() {
  // Check for collision with enemies
  for (let enemy of enemies) {
    // Only check enemies that are near the player's y position
    if (enemy.yPercent > 0.9) {
      // Simplified collision detection based on lane
      if (enemy.lane === player.lane && enemy.y + (enemy.height * enemy.scale / 2) > player.y - PLAYER_HEIGHT/2) {
        gameOver = true;
        break;
      }
    }
  }
}

function drawRoad() {
  // Draw road
  const horizonY = GAME_HEIGHT * HORIZON_Y;
  
  // Road surface
  fill(80);
  beginShape();
  vertex(GAME_WIDTH / 2 - (ROAD_WIDTH_TOP * GAME_WIDTH) / 2, horizonY);
  vertex(GAME_WIDTH / 2 + (ROAD_WIDTH_TOP * GAME_WIDTH) / 2, horizonY);
  vertex(GAME_WIDTH / 2 + (ROAD_WIDTH_BOTTOM * GAME_WIDTH) / 2, GAME_HEIGHT);
  vertex(GAME_WIDTH / 2 - (ROAD_WIDTH_BOTTOM * GAME_WIDTH) / 2, GAME_HEIGHT);
  endShape(CLOSE);
  
  // Road edge lines
  stroke(255, 255, 0); // Yellow edge lines
  strokeWeight(3);
  line(
    GAME_WIDTH / 2 - (ROAD_WIDTH_TOP * GAME_WIDTH) / 2, 
    horizonY,
    GAME_WIDTH / 2 - (ROAD_WIDTH_BOTTOM * GAME_WIDTH) / 2, 
    GAME_HEIGHT
  );
  line(
    GAME_WIDTH / 2 + (ROAD_WIDTH_TOP * GAME_WIDTH) / 2, 
    horizonY,
    GAME_WIDTH / 2 + (ROAD_WIDTH_BOTTOM * GAME_WIDTH) / 2, 
    GAME_HEIGHT
  );
  
  // Lane markers
  stroke(255); // White lines
  strokeWeight(2);
  
  for (let marker of roadMarkers) {
    const yPercent = marker.y / GAME_HEIGHT;
    if (yPercent >= HORIZON_Y && yPercent <= 1) {
      const adjustedYPercent = (yPercent - HORIZON_Y) / (1 - HORIZON_Y);
      const x = getLaneX(marker.lane, adjustedYPercent);
      
      // Calculate marker height with perspective
      const markerScale = getPerspectiveScale(adjustedYPercent);
      const markerHeight = 30 * markerScale;
      
      line(x, marker.y, x, marker.y + markerHeight);
    }
  }
}

function drawPlayer() {
  // Draw player car
  push();
  translate(player.x, player.y);
  
  // Car body
  fill(0, 150, 255); // Blue car
  noStroke();
  
  // Draw car shape (more complex than a rectangle for 3D effect)
  beginShape();
  vertex(-PLAYER_WIDTH/2, -PLAYER_HEIGHT/2); // Top left
  vertex(PLAYER_WIDTH/2, -PLAYER_HEIGHT/2);  // Top right
  vertex(PLAYER_WIDTH/2, PLAYER_HEIGHT/2);   // Bottom right
  vertex(-PLAYER_WIDTH/2, PLAYER_HEIGHT/2);  // Bottom left
  endShape(CLOSE);
  
  // Car details
  fill(30, 100, 200); // Darker blue for details
  rect(-PLAYER_WIDTH/2 + 5, -PLAYER_HEIGHT/2 + 10, PLAYER_WIDTH - 10, 15); // Top detail
  
  // Windshield
  fill(200, 220, 255); // Light blue windshield
  beginShape();
  vertex(-PLAYER_WIDTH/3, -PLAYER_HEIGHT/2 + 30);
  vertex(PLAYER_WIDTH/3, -PLAYER_HEIGHT/2 + 30);
  vertex(PLAYER_WIDTH/4, -PLAYER_HEIGHT/2 + 10);
  vertex(-PLAYER_WIDTH/4, -PLAYER_HEIGHT/2 + 10);
  endShape(CLOSE);
  
  // Wheels
  fill(40);
  rect(-PLAYER_WIDTH/2 - 5, -PLAYER_HEIGHT/4, 8, PLAYER_HEIGHT/2); // Left wheels
  rect(PLAYER_WIDTH/2 - 3, -PLAYER_HEIGHT/4, 8, PLAYER_HEIGHT/2);  // Right wheels
  
  pop();
}

function drawEnemies() {
  for (let enemy of enemies) {
    push();
    translate(enemy.x, enemy.y);
    scale(enemy.scale);
    
    // Car body
    fill(255, 0, 0); // Red car
    noStroke();
    
    // Draw car shape
    rect(-ENEMY_WIDTH/2, -ENEMY_HEIGHT/2, ENEMY_WIDTH, ENEMY_HEIGHT, 5);
    
    // Car details
    fill(180, 0, 0); // Darker red for details
    rect(-ENEMY_WIDTH/2 + 5, -ENEMY_HEIGHT/2 + 15, ENEMY_WIDTH - 10, 20); // Rear window
    
    // Taillights
    fill(255, 50, 50);
    rect(-ENEMY_WIDTH/2 + 10, ENEMY_HEIGHT/2 - 10, 10, 5);
    rect(ENEMY_WIDTH/2 - 20, ENEMY_HEIGHT/2 - 10, 10, 5);
    
    // Wheels
    fill(40);
    rect(-ENEMY_WIDTH/2 - 5, -ENEMY_HEIGHT/4, 8, ENEMY_HEIGHT/2); // Left wheels
    rect(ENEMY_WIDTH/2 - 3, -ENEMY_HEIGHT/4, 8, ENEMY_HEIGHT/2);  // Right wheels
    
    pop();
  }
}

function drawScore() {
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT);
  text(`Score: ${score}`, 20, 40);
}

function displayGameOver() {
  background(0, 0, 0, 150);
  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
  textSize(30);
  text(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  textSize(20);
  text("Press SPACE to restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
}

function resetGame() {
  player.x = GAME_WIDTH / 2;
  player.lane = Math.floor(LANE_COUNT / 2);
  player.targetLane = Math.floor(LANE_COUNT / 2);
  enemies = [];
  score = 0;
  gameOver = false;
}

function updateScore() {
  if (!gameOver) {
    score++;
  }
}

function keyPressed() {
  // Only process key if not already moving and game is active
  if (!gameOver && Math.abs(player.x - getLaneX(player.targetLane, 1.0)) < 1) {
    // Move left
    if ((keyCode === LEFT_ARROW || keyCode === 65) && player.targetLane > 0) { // Left arrow or A
      player.targetLane--;
    }
    
    // Move right
    if ((keyCode === RIGHT_ARROW || keyCode === 68) && player.targetLane < LANE_COUNT - 1) { // Right arrow or D
      player.targetLane++;
    }
  }
  
  // Restart game with space
  if (gameOver && keyCode === 32) {
    resetGame();
  }
  
  // Prevent default behavior for arrow keys
  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 32].includes(keyCode)) {
    return false;
  }
}

// Adjust for window resizing
function windowResized() {
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  resizeCanvas(GAME_WIDTH, GAME_HEIGHT);
  createRoadMarkers();
}