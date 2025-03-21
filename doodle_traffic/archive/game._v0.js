// Traffic Navigation Game - Basic Implementation

// Game constants
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const LANE_COUNT = 3;
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
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
  createCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Create player car
  player = {
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    lane: 1 // Middle lane
  };
  
  // Initialize road markers
  for (let i = 0; i < 10; i++) {
    roadMarkers.push({
      x: GAME_WIDTH / 3,
      y: i * 80
    });
    roadMarkers.push({
      x: (GAME_WIDTH / 3) * 2,
      y: i * 80
    });
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
  // Move left
  if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && player.lane > 0) { // Left arrow or A
    player.lane--;
    player.x = (player.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (PLAYER_WIDTH / 2);
  }
  
  // Move right
  if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && player.lane < LANE_COUNT - 1) { // Right arrow or D
    player.lane++;
    player.x = (player.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (PLAYER_WIDTH / 2);
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
  // Prevent default behavior for arrow keys
  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode)) {
    return false;
  }
}