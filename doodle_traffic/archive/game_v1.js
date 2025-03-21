// Traffic Navigation Game - Basic Implementation

// Game constants
let GAME_WIDTH;
let GAME_HEIGHT;
const LANE_COUNT = 6;
let LANE_WIDTH;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 80;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 80;
const PLAYER_SPEED = 5;
const ROAD_SPEED = 5;
const ENEMY_MIN_SPEED = 2;
const ENEMY_MAX_SPEED = 4;
const ENEMY_SPAWN_RATE = 0.02; // Probability of spawning per frame

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
  LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
  
  createCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Create player car
  player = {
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    lane: Math.floor(LANE_COUNT / 2), // Middle lane
    targetLane: Math.floor(LANE_COUNT / 2) // For smooth movement
  };
  
  // Initialize road markers for all lanes
  for (let i = 1; i < LANE_COUNT; i++) {
    for (let j = 0; j < 20; j++) {
      roadMarkers.push({
        x: i * LANE_WIDTH,
        y: j * 80 - 40 * (j % 2) // Stagger the markers
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
  background(100); // Gray road
  drawRoad();
  drawPlayer();
  drawEnemies();
  drawScore();
}

function handleInput() {
  // Use a key pressed/released approach instead of continuous pressing
  // This is handled in the keyPressed() function below
  
  // Move towards target lane smoothly
  const targetX = (player.targetLane * LANE_WIDTH) + (LANE_WIDTH / 2) - (PLAYER_WIDTH / 2);
  if (player.x !== targetX) {
    if (Math.abs(player.x - targetX) < PLAYER_SPEED) {
      player.x = targetX;
    } else if (player.x < targetX) {
      player.x += PLAYER_SPEED;
    } else {
      player.x -= PLAYER_SPEED;
    }
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

// Adjust for window resizing
function windowResized() {
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
  resizeCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Regenerate road markers for new width
  roadMarkers = [];
  for (let i = 1; i < LANE_COUNT; i++) {
    for (let j = 0; j < 20; j++) {
      roadMarkers.push({
        x: i * LANE_WIDTH,
        y: j * 80 - 40 * (j % 2) // Stagger the markers
      });
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.y += enemy.speed;
    
    // Remove enemies that are off-screen
    if (enemy.y > GAME_HEIGHT) {
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
      if (enemy.lane === lane && enemy.y < ENEMY_HEIGHT * 2) {
        laneFree = false;
        break;
      }
    }
    
    if (laneFree) {
      let enemy = {
        x: (lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (ENEMY_WIDTH / 2),
        y: -ENEMY_HEIGHT,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        speed: random(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED),
        lane: lane
      };
      enemies.push(enemy);
    }
  }
}

function checkCollisions() {
  // Check for collision with enemies
  for (let enemy of enemies) {
    if (rectsIntersect(player, enemy)) {
      gameOver = true;
      break;
    }
  }
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function updateScore() {
  if (!gameOver) {
    score++;
  }
}

function drawRoad() {
  // Draw road boundaries
  stroke(255); // White lines
  strokeWeight(2);
  
  // Draw road markers
  for (let marker of roadMarkers) {
    line(marker.x, marker.y, marker.x, marker.y + 40);
  }
}

function drawPlayer() {
  fill(0, 150, 255); // Blue car
  noStroke();
  rect(player.x, player.y, player.width, player.height, 5);
  
  // Car details
  fill(200);
  rect(player.x + 5, player.y + 10, player.width - 10, 15);
  rect(player.x + 5, player.y + player.height - 25, player.width - 10, 15);
}

function drawEnemies() {
  for (let enemy of enemies) {
    fill(255, 0, 0); // Red cars
    noStroke();
    rect(enemy.x, enemy.y, enemy.width, enemy.height, 5);
    
    // Car details
    fill(200);
    rect(enemy.x + 5, enemy.y + 10, enemy.width - 10, 15);
    rect(enemy.x + 5, enemy.y + enemy.height - 25, enemy.width - 10, 15);
  }
}

function drawScore() {
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 30);
}

function displayGameOver() {
  background(0, 0, 0, 200);
  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
  textSize(30);
  text(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  textSize(20);
  text("Press SPACE to restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
  
  // Check for restart
  if (keyIsDown(32)) { // Space key
    resetGame();
  }
}

function resetGame() {
  player.x = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
  player.lane = 1;
  enemies = [];
  score = 0;
  gameOver = false;
}

function keyPressed() {
  // Only process key if not already moving and game is active
  if (!gameOver && Math.abs(player.x - ((player.targetLane * LANE_WIDTH) + (LANE_WIDTH / 2) - (PLAYER_WIDTH / 2))) < 1) {
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