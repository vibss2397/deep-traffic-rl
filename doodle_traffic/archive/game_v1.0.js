// F1 Racing Game - Top-Down Track - Simplified Version

// Game constants
let GAME_WIDTH, GAME_HEIGHT;
const LANE_COUNT = 4;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 50;
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 50;
const PLAYER_SPEED = 0.6; // Significantly reduced from 3
const ENEMY_MIN_SPEED = 0.3; // Significantly reduced from 1
const ENEMY_MAX_SPEED = 0.5; // Significantly reduced from 2.5
const ENEMY_SPAWN_RATE = 0.005; // Reduced from 0.02
const TOTAL_LAPS = 10;

// Track variables
let track = [];
let trackLength = 0;
let trackWidth = 150; // Width of the racetrack

// Game variables
let player;
let enemies = [];
let gameOver = false;
let currentLap = 0;

function setup() {
  // Full screen canvas
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  createCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Generate track
  createTrack();
  
  // Initialize player
  player = {
    pos: 0, // Position along track (0 to trackLength)
    lane: 1, // Lane (0 to LANE_COUNT-1)
    targetLane: 1,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    lap: 0,
    color: color(0, 150, 255), // Blue car
    crashed: false
  };
  
  // Start game loop
  loop();
}

function createTrack() {
  // Create a simple oval track defined by points
  const centerX = GAME_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;
  const radiusX = GAME_WIDTH * 0.4;
  const radiusY = GAME_HEIGHT * 0.35;
  
  // Define track points
  track = [];
  const segments = 60; // Number of segments in the track
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * TWO_PI;
    const x = centerX + radiusX * cos(angle);
    const y = centerY + radiusY * sin(angle);
    
    // Calculate direction tangent to the track
    const nextAngle = ((i + 1) / segments) * TWO_PI;
    const dx = cos(nextAngle) - cos(angle);
    const dy = sin(nextAngle) - sin(angle);
    const direction = atan2(dy, dx);
    
    track.push({
      x: x,
      y: y,
      angle: direction
    });
  }
  
  // Calculate total track length for position tracking
  trackLength = segments;
}

function draw() {
  if (gameOver) {
    displayGameOver();
    return;
  }
  
  // Game logic
  handleInput();
  updatePlayer();
  updateEnemies();
  spawnEnemies();
  checkCollisions();
  
  // Draw game
  background(50); // Dark gray
  drawTrack();
  drawPlayer();
  drawEnemies();
  drawHUD();
}

function handleInput() {
  // Add controls for adjusting speed
  if (keyIsDown(UP_ARROW)) {
    player.speed = min(player.speed + 0.01, 1.5); // Gradually increase speed, with a cap
  }
  if (keyIsDown(DOWN_ARROW)) {
    player.speed = max(player.speed - 0.01, 0.2); // Gradually decrease speed, with a minimum
  }
  
  // Move player lane toward target lane
  if (player.lane < player.targetLane) {
    player.lane += 0.1; // Gradual lane change
  } else if (player.lane > player.targetLane) {
    player.lane -= 0.1; // Gradual lane change
  }
}

function updatePlayer() {
  // Move player forward along track
  player.pos += player.speed;
  
  // Check for lap completion
  if (player.pos >= trackLength) {
    player.pos -= trackLength;
    player.lap++;
    console.log("Lap completed: " + player.lap);
    
    if (player.lap >= TOTAL_LAPS) {
      gameOver = true;
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    // Move forward
    enemy.pos += enemy.speed;
    
    // Loop around track
    if (enemy.pos >= trackLength) {
      enemy.pos -= trackLength;
    }
    
    // Randomly change lanes with a small probability
    if (random() < 0.005) {
      // Try to change lane if safe
      const targetLane = constrain(enemy.lane + (random() > 0.5 ? 0.5 : -0.5), 0, LANE_COUNT - 1);
      
      // Check if lane change is safe
      let canChangeLane = true;
      for (let otherEnemy of enemies) {
        if (otherEnemy !== enemy && abs(otherEnemy.lane - targetLane) < 1) {
          // Calculate distance on track
          let distance = abs(otherEnemy.pos - enemy.pos);
          distance = min(distance, trackLength - distance); // Consider both directions
          
          if (distance < 10) { // Safety distance
            canChangeLane = false;
            break;
          }
        }
      }
      
      if (canChangeLane) {
        enemy.targetLane = targetLane;
      }
    }
    
    // Move toward target lane
    if (enemy.lane < enemy.targetLane) {
      enemy.lane += 0.05;
    } else if (enemy.lane > enemy.targetLane) {
      enemy.lane -= 0.05;
    }
  }
}

function spawnEnemies() {
  // Random chance to spawn an enemy
  if (random() < ENEMY_SPAWN_RATE && enemies.length < 12) {
    // Find a good spawn location
    const lane = floor(random(LANE_COUNT));
    let spawnPos;
    
    if (random() < 0.5) {
      // Spawn ahead of player
      spawnPos = (player.pos + trackLength / 3) % trackLength;
    } else {
      // Spawn behind player
      spawnPos = (player.pos + trackLength * 2/3) % trackLength;
    }
    
    // Check if spawn location is safe (not too close to other enemies)
    let isSafe = true;
    for (let enemy of enemies) {
      let distance = abs(enemy.pos - spawnPos);
      distance = min(distance, trackLength - distance); // Consider both directions
      
      if (abs(enemy.lane - lane) < 1 && distance < 8) {
        isSafe = false;
        break;
      }
    }
    
    if (isSafe) {
      enemies.push({
        pos: spawnPos,
        lane: lane,
        targetLane: lane,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        speed: random(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED),
        color: color(255, 0, 0) // Red cars
      });
    }
  }
}

function checkCollisions() {
  // Check collisions between player and enemies
  for (let enemy of enemies) {
    // Calculate actual positions on track
    const playerIndex = floor(player.pos) % track.length;
    const enemyIndex = floor(enemy.pos) % track.length;
    
    // Calculate distance along track (in segments)
    let distance = abs(player.pos - enemy.pos);
    distance = min(distance, trackLength - distance); // Consider both directions
    
    // Only check collisions if cars are close
    if (distance < 1) {
      // Check lane proximity
      const laneDiff = abs(player.lane - enemy.lane);
      
      if (laneDiff < 0.8) { // Collision threshold
        gameOver = true;
        player.crashed = true;
        return;
      }
    }
  }
}

function getPositionOnTrack(pos, lane) {
  // Get the interpolated position on track
  const segment = pos % trackLength;
  const i = floor(segment);
  const t = segment - i;
  
  // Get points to interpolate between
  const p1 = track[i];
  const p2 = track[(i + 1) % track.length];
  
  // Interpolate position
  const x = lerp(p1.x, p2.x, t);
  const y = lerp(p1.y, p2.y, t);
  const angle = lerp(p1.angle, p2.angle, t);
  
  // Calculate normal direction (perpendicular to track)
  const normal = angle + HALF_PI;
  
  // Lane offset (from center of track)
  const laneOffset = map(lane, 0, LANE_COUNT - 1, trackWidth/2 - 20, -trackWidth/2 + 20);
  
  // Final position
  return {
    x: x + cos(normal) * laneOffset,
    y: y + sin(normal) * laneOffset,
    angle: angle
  };
}

function drawTrack() {
  // Draw outer track
  fill(80); // Dark gray for track
  noStroke();
  beginShape();
  for (let i = 0; i < track.length; i++) {
    const point = track[i];
    const normal = point.angle + HALF_PI;
    const outerX = point.x + cos(normal) * (trackWidth/2 + 10);
    const outerY = point.y + sin(normal) * (trackWidth/2 + 10);
    vertex(outerX, outerY);
  }
  endShape(CLOSE);
  
  // Draw inner track (create a hole)
  fill(50); // Same as background
  beginShape();
  for (let i = 0; i < track.length; i++) {
    const point = track[i];
    const normal = point.angle + HALF_PI;
    const innerX = point.x + cos(normal) * (-trackWidth/2 - 10);
    const innerY = point.y + sin(normal) * (-trackWidth/2 - 10);
    vertex(innerX, innerY);
  }
  endShape(CLOSE);
  
  // Draw lane markers
  stroke(255, 255, 255, 150); // Semi-transparent white
  strokeWeight(2);
  
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    for (let i = 0; i < track.length; i += 2) { // Draw dashed lines
      const lanePos = map(lane, 0, LANE_COUNT, trackWidth/2 - 20, -trackWidth/2 + 20);
      const p1 = track[i];
      const p2 = track[(i + 1) % track.length];
      const normal1 = p1.angle + HALF_PI;
      const normal2 = p2.angle + HALF_PI;
      
      const x1 = p1.x + cos(normal1) * lanePos;
      const y1 = p1.y + sin(normal1) * lanePos;
      const x2 = p2.x + cos(normal2) * lanePos;
      const y2 = p2.y + sin(normal2) * lanePos;
      
      line(x1, y1, x2, y2);
    }
  }
  
  // Draw start/finish line
  stroke(255);
  strokeWeight(4);
  const startPoint = track[0];
  const normal = startPoint.angle + HALF_PI;
  const startX1 = startPoint.x + cos(normal) * (trackWidth/2 + 5);
  const startY1 = startPoint.y + sin(normal) * (trackWidth/2 + 5);
  const startX2 = startPoint.x + cos(normal) * (-trackWidth/2 - 5);
  const startY2 = startPoint.y + sin(normal) * (-trackWidth/2 - 5);
  line(startX1, startY1, startX2, startY2);
}

function drawPlayer() {
  // Get position on track
  const position = getPositionOnTrack(player.pos, player.lane);
  
  // Draw player car
  push();
  translate(position.x, position.y);
  rotate(position.angle);
  
  // Car body
  fill(player.color);
  noStroke();
  rectMode(CENTER);
  rect(0, 0, player.width, player.height, 5);
  
  // Car details
  fill(200, 230, 255);
  rect(player.width * 0.1, 0, player.width * 0.5, player.height * 0.6, 3);
  
  pop();
}

function drawEnemies() {
  for (let enemy of enemies) {
    // Get position on track
    const position = getPositionOnTrack(enemy.pos, enemy.lane);
    
    // Draw enemy car
    push();
    translate(position.x, position.y);
    rotate(position.angle);
    
    // Car body
    fill(enemy.color);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, enemy.width, enemy.height, 5);
    
    // Car details
    fill(255, 200, 200);
    rect(enemy.width * 0.1, 0, enemy.width * 0.5, enemy.height * 0.6, 3);
    
    pop();
  }
}

function drawHUD() {
  // Display laps and other info
  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT);
  text(`Lap: ${player.lap + 1}/${TOTAL_LAPS}`, 20, 30);
  
  // Progress bar
  const progressWidth = 200;
  const progressHeight = 15;
  const progress = (player.lap + (player.pos / trackLength)) / TOTAL_LAPS;
  
  fill(100);
  rect(20, 50, progressWidth, progressHeight);
  fill(0, 255, 0);
  rect(20, 50, progressWidth * progress, progressHeight);
  
  // Show game information
  text(`Speed: ${player.speed.toFixed(1)}`, 20, 80);
  text(`Lap progress: ${(player.pos / trackLength * 100).toFixed(1)}%`, 20, 100);
  text(`Enemies: ${enemies.length}`, 20, 120);
  
  // Controls info
  fill(200, 200, 255);
  textAlign(RIGHT);
  text("A/D or Left/Right: Change lanes", GAME_WIDTH - 20, 30);
  text("Up/Down: Adjust speed", GAME_WIDTH - 20, 55);
}

function displayGameOver() {
  // Game over screen
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  
  if (player.lap >= TOTAL_LAPS) {
    text("RACE COMPLETE!", width/2, height/2 - 50);
    textSize(30);
    text(`You completed all ${TOTAL_LAPS} laps!`, width/2, height/2);
  } else {
    text("CRASH!", width/2, height/2 - 50);
    textSize(30);
    text(`Laps completed: ${player.lap}/${TOTAL_LAPS}`, width/2, height/2);
  }
  
  textSize(20);
  text("Press SPACE to restart", width/2, height/2 + 80);
}

function keyPressed() {
  // Change lanes with A/D or Left/Right arrow keys
  if ((keyCode === LEFT_ARROW || keyCode === 65) && !gameOver) { // Left arrow or A
    if (player.targetLane > 0) {
      player.targetLane--;
    }
  } else if ((keyCode === RIGHT_ARROW || keyCode === 68) && !gameOver) { // Right arrow or D
    if (player.targetLane < LANE_COUNT - 1) {
      player.targetLane++;
    }
  }
  
  // Restart game with space
  if (gameOver && keyCode === 32) {
    resetGame();
  }
  
  return false; // Prevent default behavior
}

function resetGame() {
  // Reset player
  player.pos = 0;
  player.lane = 1;
  player.targetLane = 1;
  player.lap = 0;
  player.crashed = false;
  
  // Reset enemies
  enemies = [];
  
  // Reset game state
  gameOver = false;
}

function windowResized() {
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  resizeCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Regenerate track for new dimensions
  createTrack();
  
  // Reset game
  resetGame();
}