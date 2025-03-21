// Street Runner - Improved Version
// A top-down driving game with turns and police pursuit

// Game constants
let GAME_WIDTH, GAME_HEIGHT;
const ROAD_WIDTH = 300; // Width of the road
const LANE_COUNT = 3; // Number of lanes
const CAR_WIDTH = 30;
const CAR_HEIGHT = 50;
const PLAYER_TURN_SPEED = 0.05; // How fast the player turns
const PLAYER_SPEED = 3; // Forward movement speed
const TRAFFIC_SPAWN_RATE = 0.01;
const POLICE_SPAWN_RATE = 0.005;

// Track definition - a series of points defining the center of the road
let trackPoints = [];
let trackSegments = [];
let exitPoints = []; // New: Track exit points

// Game objects
let player;
let trafficCars = [];
let policeCars = [];
let score = 0;
let heatLevel = 0;
let maxHeatLevel = 3;
let gameOver = false;

function setup() {
  // Create a full-screen canvas
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  createCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Create track
  createTrack();
  
  // Initialize player car
  player = {
    // Position on track (0-1 is position through current segment)
    trackPos: 0,
    segmentIndex: 0,
    // Offset from track center (-1 to 1, where 0 is center, -1 is left edge, 1 is right edge)
    offset: 0,
    // Visual properties
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    x: 0, // Will be calculated
    y: 0, // Will be calculated
    angle: 0, // Will be calculated
    // Game properties
    speed: PLAYER_SPEED,
    crashed: false,
    color: color(0, 150, 255) // Blue car
  };
  
  // Set initial player position
  updatePlayerPosition();
}

function createTrack() {
  // Create a more complex closed track with points
  // We'll define control points, then create a smooth path between them
  const controlPoints = [
    { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.8 },
    { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.7 },
    { x: GAME_WIDTH * 0.1, y: GAME_HEIGHT * 0.5 },
    { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.3 },
    { x: GAME_WIDTH * 0.4, y: GAME_HEIGHT * 0.2 },
    { x: GAME_WIDTH * 0.6, y: GAME_HEIGHT * 0.1 },
    { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.2 },
    { x: GAME_WIDTH * 0.9, y: GAME_HEIGHT * 0.4 },
    { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT * 0.6 },
    { x: GAME_WIDTH * 0.7, y: GAME_HEIGHT * 0.7 }
  ];
  
  // Create a smooth track through these points
  trackPoints = [];
  const segments = 180; // More segments for smoother curves
  
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const point = getPointOnTrack(t, controlPoints);
    trackPoints.push(point);
  }
  
  // Create track segments (lines between points)
  trackSegments = [];
  for (let i = 0; i < trackPoints.length; i++) {
    const p1 = trackPoints[i];
    const p2 = trackPoints[(i + 1) % trackPoints.length];
    
    // Calculate segment length (for tracking car movement)
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate angle of this segment
    const angle = Math.atan2(dy, dx);
    
    trackSegments.push({
      p1: p1,
      p2: p2,
      length: length,
      angle: angle
    });
  }
  
  // Create exit points at certain segments
  createExitPoints();
}

function createExitPoints() {
  // Define exit points at various positions around the track
  // Each exit point has a segment index, direction (-1 for left, 1 for right), and path
  
  // Place exits at reasonable intervals
  const exitPositions = [15, 45, 90, 135];
  
  exitPositions.forEach((segIndex, i) => {
    const segment = trackSegments[segIndex];
    const direction = i % 2 === 0 ? -1 : 1; // Alternate left/right exits
    
    // Create a path for the exit (5 points going outward)
    const exitPath = [];
    const startPoint = {
      x: (segment.p1.x + segment.p2.x) / 2,
      y: (segment.p1.y + segment.p2.y) / 2
    };
    
    // Calculate the normal (perpendicular) to the track
    const normalAngle = segment.angle + HALF_PI;
    
    // Starting point on the edge of the road
    const edgeX = startPoint.x + cos(normalAngle) * direction * (ROAD_WIDTH / 2);
    const edgeY = startPoint.y + sin(normalAngle) * direction * (ROAD_WIDTH / 2);
    
    // Add 5 points going outward to form the exit path
    for (let j = 0; j < 5; j++) {
      exitPath.push({
        x: edgeX + cos(normalAngle) * direction * j * 50,
        y: edgeY + sin(normalAngle) * direction * j * 50
      });
    }
    
    exitPoints.push({
      segmentIndex: segIndex,
      direction: direction,
      path: exitPath
    });
  });
}

// Get point on track using simple spline interpolation
function getPointOnTrack(t, points) {
  const totalPoints = points.length;
  const scaledT = t * totalPoints;
  const i = Math.floor(scaledT);
  const frac = scaledT - i;
  
  // Get 4 control points for the spline (with wrapping)
  const p0 = points[(i - 1 + totalPoints) % totalPoints];
  const p1 = points[i % totalPoints];
  const p2 = points[(i + 1) % totalPoints];
  const p3 = points[(i + 2) % totalPoints];
  
  // Catmull-Rom spline interpolation
  const t2 = frac * frac;
  const t3 = t2 * frac;
  
  // X coordinate
  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * frac +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
  );
  
  // Y coordinate
  const y = 0.5 * (
    (2 * p1.y) +
    (-p0.y + p2.y) * frac +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  );
  
  return { x, y };
}

function draw() {
  if (gameOver) {
    displayGameOver();
    return;
  }
  
  // Game logic
  handleInput();
  updatePlayerPosition();
  updateTraffic();
  updatePolice();
  spawnTraffic();
  spawnPolice();
  checkCollisions();
  updateHeatLevel();
  updateScore();
  
  // Draw game
  background(50); // Dark gray
  drawTrack();
  drawExits(); // New: Draw exit paths
  drawTraffic();
  drawPolice();
  drawPlayer();
  drawHUD();
}

function handleInput() {
  // Lane changes / steering
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left arrow or A
    player.offset = max(player.offset - 0.05, -1);
  } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right arrow or D
    player.offset = min(player.offset + 0.05, 1);
  }
  // Removed the automatic centering! This fixes the lane drift issue
  
  // Speed control
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up arrow or W
    player.speed = min(player.speed + 0.05, 5);
  } else if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down arrow or S
    player.speed = max(player.speed - 0.05, 1);
  }
}

function updatePlayerPosition() {
  // Move player along track
  player.trackPos += player.speed / trackSegments[player.segmentIndex].length;
  
  // Check if we've moved to the next segment
  if (player.trackPos >= 1) {
    player.trackPos -= 1;
    player.segmentIndex = (player.segmentIndex + 1) % trackSegments.length;
  }
  
  // Get current segment
  const segment = trackSegments[player.segmentIndex];
  
  // Calculate position along segment
  const p1 = segment.p1;
  const p2 = segment.p2;
  const t = player.trackPos;
  
  // Position on the center line
  const centerX = lerp(p1.x, p2.x, t);
  const centerY = lerp(p1.y, p2.y, t);
  
  // Calculate the normal (perpendicular) to the track
  const angle = segment.angle;
  const normalAngle = angle + HALF_PI;
  
  // Calculate offset position based on lane
  const offsetDistance = player.offset * (ROAD_WIDTH / 2);
  player.x = centerX + cos(normalAngle) * offsetDistance;
  player.y = centerY + sin(normalAngle) * offsetDistance;
  
  // Set player angle to face along track
  player.angle = angle;
}

function spawnTraffic() {
  // Random chance to spawn traffic
  if (random() < TRAFFIC_SPAWN_RATE && trafficCars.length < 10) {
    // Choose a segment ahead of the player
    const spawnDist = floor(random(10, 30));
    const spawnSegIndex = (player.segmentIndex + spawnDist) % trackSegments.length;
    
    // Choose a random lane
    const lane = random(-0.8, 0.8);
    
    // Check if spawn position is clear
    let canSpawn = true;
    for (let car of trafficCars) {
      if (abs(car.segmentIndex - spawnSegIndex) < 5 && abs(car.offset - lane) < 0.5) {
        canSpawn = false;
        break;
      }
    }
    
    if (canSpawn) {
      // Random color for traffic
      const carColors = [
        color(255, 0, 0),    // Red
        color(0, 255, 0),    // Green
        color(255, 165, 0),  // Orange
        color(128, 0, 128),  // Purple
        color(255, 255, 0)   // Yellow
      ];
      
      trafficCars.push({
        segmentIndex: spawnSegIndex,
        trackPos: random(0, 1),
        offset: lane,
        width: CAR_WIDTH,
        height: CAR_HEIGHT,
        speed: random(1, 2),
        x: 0, // Will be calculated
        y: 0, // Will be calculated
        angle: 0, // Will be calculated
        color: random(carColors),
        takingExit: false,
        exitPoint: null,
        exitProgress: 0
      });
    }
  }
}

function spawnPolice() {
  // Spawn police based on heat level
  if (random() < POLICE_SPAWN_RATE * (heatLevel + 1) && policeCars.length < heatLevel * 2) {
    // Choose a segment behind the player
    const spawnDist = floor(random(5, 15));
    const spawnSegIndex = (player.segmentIndex - spawnDist + trackSegments.length) % trackSegments.length;
    
    // Choose a random lane
    const lane = random(-0.8, 0.8);
    
    // Check if spawn position is clear
    let canSpawn = true;
    for (let car of [...trafficCars, ...policeCars]) {
      if (abs(car.segmentIndex - spawnSegIndex) < 5 && abs(car.offset - lane) < 0.5) {
        canSpawn = false;
        break;
      }
    }
    
    if (canSpawn) {
      policeCars.push({
        segmentIndex: spawnSegIndex,
        trackPos: random(0, 1),
        offset: lane,
        targetOffset: player.offset, // Initially target player's lane
        width: CAR_WIDTH,
        height: CAR_HEIGHT * 1.1, // Slightly larger
        speed: player.speed * 0.9, // Slightly slower than player
        x: 0, // Will be calculated
        y: 0, // Will be calculated
        angle: 0, // Will be calculated
        color: color(255), // White
        isPolice: true
      });
    }
  }
}

function updateTraffic() {
  for (let i = trafficCars.length - 1; i >= 0; i--) {
    const car = trafficCars[i];
    
    // Check if car should take an exit
    if (!car.takingExit) {
      // Random chance to take exit if near one
      for (let exit of exitPoints) {
        const distToExit = (exit.segmentIndex - car.segmentIndex + trackSegments.length) % trackSegments.length;
        
        // If car is approaching an exit (within 5 segments) and on the correct side
        if (distToExit < 5 && distToExit > 0 && 
            (exit.direction < 0 && car.offset < -0.5) || 
            (exit.direction > 0 && car.offset > 0.5)) {
          
          // 30% chance to take the exit
          if (random() < 0.3) {
            car.takingExit = true;
            car.exitPoint = exit;
            car.exitProgress = 0;
            break;
          }
        }
      }
      
      // Regular movement on track
      if (!car.takingExit) {
        // Move car along track
        car.trackPos += car.speed / trackSegments[car.segmentIndex].length;
        
        // Check if moved to next segment
        if (car.trackPos >= 1) {
          car.trackPos -= 1;
          car.segmentIndex = (car.segmentIndex + 1) % trackSegments.length;
        }
        
        // Calculate position
        updateCarPosition(car);
        
        // Remove cars that are too far behind the player
        const distBehind = (player.segmentIndex - car.segmentIndex + trackSegments.length) % trackSegments.length;
        if (distBehind > 5 && distBehind < trackSegments.length - 30) {
          trafficCars.splice(i, 1);
        }
      }
    } else {
      // Car is taking an exit
      car.exitProgress += 0.05;
      
      if (car.exitProgress >= 1) {
        // Car has completed exit, remove it
        trafficCars.splice(i, 1);
      } else {
        // Move car along exit path
        const exitPath = car.exitPoint.path;
        const pathIndex = floor(car.exitProgress * (exitPath.length - 1));
        const t = (car.exitProgress * (exitPath.length - 1)) - pathIndex;
        
        if (pathIndex < exitPath.length - 1) {
          // Interpolate between points on exit path
          car.x = lerp(exitPath[pathIndex].x, exitPath[pathIndex + 1].x, t);
          car.y = lerp(exitPath[pathIndex].y, exitPath[pathIndex + 1].y, t);
          
          // Calculate angle based on exit path
          const dx = exitPath[pathIndex + 1].x - exitPath[pathIndex].x;
          const dy = exitPath[pathIndex + 1].y - exitPath[pathIndex].y;
          car.angle = atan2(dy, dx);
        }
      }
    }
  }
}

function updatePolice() {
  for (let i = policeCars.length - 1; i >= 0; i--) {
    const car = policeCars[i];
    
    // Update target to follow player
    const distToPlayer = (car.segmentIndex - player.segmentIndex + trackSegments.length) % trackSegments.length;
    
    // Only update target if police is close to player
    if (distToPlayer < 30 || distToPlayer > trackSegments.length - 30) {
      car.targetOffset = player.offset;
      
      // Adjust speed based on distance to player
      if (distToPlayer > 15 || distToPlayer > trackSegments.length - 15) {
        car.speed = min(player.speed * 1.05, 5.5); // Catch up if far behind
      } else if (distToPlayer < 5) {
        car.speed = max(player.speed * 0.95, 2); // Slow down if close
      } else {
        car.speed = player.speed; // Match speed
      }
    }
    
    // Move towards target offset
    if (car.offset < car.targetOffset) {
      car.offset = min(car.offset + 0.02, car.targetOffset);
    } else if (car.offset > car.targetOffset) {
      car.offset = max(car.offset - 0.02, car.targetOffset);
    }
    
    // Move car along track
    car.trackPos += car.speed / trackSegments[car.segmentIndex].length;
    
    // Check if moved to next segment
    if (car.trackPos >= 1) {
      car.trackPos -= 1;
      car.segmentIndex = (car.segmentIndex + 1) % trackSegments.length;
    }
    
    // Calculate position
    updateCarPosition(car);
    
    // Remove police that are too far behind or haven't seen player for a while
    const distBehind = (player.segmentIndex - car.segmentIndex + trackSegments.length) % trackSegments.length;
    if (distBehind > 50 && distBehind < trackSegments.length - 50) {
      policeCars.splice(i, 1);
      // Decrease heat when police lose sight
      heatLevel = max(heatLevel - 0.2, 0);
    }
  }
}

function updateCarPosition(car) {
  // Get current segment
  const segment = trackSegments[car.segmentIndex];
  
  // Calculate position along segment
  const p1 = segment.p1;
  const p2 = segment.p2;
  const t = car.trackPos;
  
  // Position on the center line
  const centerX = lerp(p1.x, p2.x, t);
  const centerY = lerp(p1.y, p2.y, t);
  
  // Calculate the normal (perpendicular) to the track
  const angle = segment.angle;
  const normalAngle = angle + HALF_PI;
  
  // Calculate offset position based on lane
  const offsetDistance = car.offset * (ROAD_WIDTH / 2);
  car.x = centerX + cos(normalAngle) * offsetDistance;
  car.y = centerY + sin(normalAngle) * offsetDistance;
  
  // Set car angle to face along track
  car.angle = angle;
}

function checkCollisions() {
  // Check collision with traffic
  for (let car of trafficCars) {
    if (carsColliding(player, car)) {
      gameOver = true;
      player.crashed = true;
      return;
    }
  }
  
  // Check collision with police
  for (let car of policeCars) {
    if (carsColliding(player, car)) {
      gameOver = true;
      player.crashed = true;
      return;
    }
  }
}

function carsColliding(car1, car2) {
  // Simple distance-based collision
  const dx = car1.x - car2.x;
  const dy = car1.y - car2.y;
  const distance = sqrt(dx * dx + dy * dy);
  
  // Check if cars are close enough to collide
  return distance < (car1.width + car2.width) * 0.4;
}

function updateHeatLevel() {
  // Increase heat based on proximity to police
  let nearPolice = false;
  
  for (let car of policeCars) {
    // Check distance in segments
    let segmentDist = abs(car.segmentIndex - player.segmentIndex);
    segmentDist = min(segmentDist, trackSegments.length - segmentDist);
    
    // If close, increase heat
    if (segmentDist < 10) {
      nearPolice = true;
      heatLevel = min(heatLevel + 0.001, maxHeatLevel);
      break;
    }
  }
  
  // Gradually decrease heat if not near police
  if (!nearPolice) {
    heatLevel = max(heatLevel - 0.0005, 0);
  }
}

function updateScore() {
  // Increase score based on distance traveled
  score += player.speed * 0.1;
}

function drawTrack() {
  // Draw track surface
  stroke(100);
  strokeWeight(ROAD_WIDTH);
  noFill();
  
  beginShape();
  for (let point of trackPoints) {
    vertex(point.x, point.y);
  }
  endShape(CLOSE);
  
  // Draw road edges
  stroke(255, 255, 0);
  strokeWeight(2);
  
  beginShape();
  for (let point of trackPoints) {
    const i = trackPoints.indexOf(point);
    const nextPoint = trackPoints[(i + 1) % trackPoints.length];
    const angle = atan2(nextPoint.y - point.y, nextPoint.x - point.x);
    const normalAngle = angle + HALF_PI;
    const edgeX = point.x + cos(normalAngle) * (ROAD_WIDTH / 2);
    const edgeY = point.y + sin(normalAngle) * (ROAD_WIDTH / 2);
    vertex(edgeX, edgeY);
  }
  endShape(CLOSE);
  
  beginShape();
  for (let point of trackPoints) {
    const i = trackPoints.indexOf(point);
    const nextPoint = trackPoints[(i + 1) % trackPoints.length];
    const angle = atan2(nextPoint.y - point.y, nextPoint.x - point.x);
    const normalAngle = angle + HALF_PI;
    const edgeX = point.x - cos(normalAngle) * (ROAD_WIDTH / 2);
    const edgeY = point.y - sin(normalAngle) * (ROAD_WIDTH / 2);
    vertex(edgeX, edgeY);
  }
  endShape(CLOSE);
  
  // Draw lane markers
  stroke(255);
  strokeWeight(2);
  
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    const laneOffset = map(lane, 0, LANE_COUNT, -1, 1);
    
    for (let i = 0; i < trackPoints.length; i += 4) {
      const point = trackPoints[i];
      const nextPoint = trackPoints[(i + 2) % trackPoints.length];
      const angle = atan2(nextPoint.y - point.y, nextPoint.x - point.x);
      const normalAngle = angle + HALF_PI;
      
      // Calculate lane position
      const offsetDistance = laneOffset * (ROAD_WIDTH / 2);
      const x1 = point.x + cos(normalAngle) * offsetDistance;
      const y1 = point.y + sin(normalAngle) * offsetDistance;
      const x2 = nextPoint.x + cos(normalAngle) * offsetDistance;
      const y2 = nextPoint.y + sin(normalAngle) * offsetDistance;
      
      // Draw dashed line
      line(x1, y1, x2, y2);
    }
  }
}

function drawExits() {
  // Draw exit paths
  for (let exit of exitPoints) {
    // Get the segment where the exit starts
    const segment = trackSegments[exit.segmentIndex];
    const centerPoint = {
      x: (segment.p1.x + segment.p2.x) / 2,
      y: (segment.p1.y + segment.p2.y) / 2
    };
    
    // Draw exit road
    stroke(100);
    strokeWeight(ROAD_WIDTH * 0.7); // Slightly narrower than main road
    noFill();
    
    beginShape();
    for (let i = 0; i < exit.path.length; i++) {
      vertex(exit.path[i].x, exit.path[i].y);
    }
    endShape();
    
    // Draw exit edges
    stroke(255, 255, 0);
    strokeWeight(2);
    
    // Create parallel lines for the exit edges
    const exitWidth = ROAD_WIDTH * 0.7 / 2;
    const pathPoints = exit.path;
    
    // Draw first edge
    beginShape();
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const angle = atan2(p2.y - p1.y, p2.x - p1.x);
      const normalAngle = angle + HALF_PI;
      
      const edgeX = p1.x + cos(normalAngle) * exitWidth;
      const edgeY = p1.y + sin(normalAngle) * exitWidth;
      vertex(edgeX, edgeY);
    }
    endShape();
    
    // Draw second edge
    beginShape();
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const angle = atan2(p2.y - p1.y, p2.x - p1.x);
      const normalAngle = angle + HALF_PI;
      
      const edgeX = p1.x - cos(normalAngle) * exitWidth;
      const edgeY = p1.y - sin(normalAngle) * exitWidth;
      vertex(edgeX, edgeY);
    }
    endShape();
  }
}

function drawPlayer() {
  push();
  translate(player.x, player.y);
  rotate(player.angle);
  
  // Car body
  fill(player.color);
  noStroke();
  rectMode(CENTER);
  rect(0, 0, player.width, player.height, 5);
  
  // Car details
  fill(200, 230, 255);
  rect(0, -player.height * 0.1, player.width * 0.7, player.height * 0.6, 3);
  
  pop();
}

function drawTraffic() {
  for (let car of trafficCars) {
    push();
    translate(car.x, car.y);
    rotate(car.angle);
    
    // Car body
    fill(car.color);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, car.width, car.height, 5);
    
    // Car details
    fill(255, 255, 255, 200);
    rect(0, -car.height * 0.1, car.width * 0.7, car.height * 0.5, 3);
    
    pop();
  }
}

function drawPolice() {
  for (let car of policeCars) {
    push();
    translate(car.x, car.y);
    rotate(car.angle);
    
    // Car body
    fill(car.color);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, car.width, car.height, 5);
    
    // Police car details
    fill(0, 0, 255);
    rect(0, -car.height * 0.3, car.width * 0.8, car.height * 0.15, 2);
    
    fill(255, 0, 0);
    rect(0, car.height * 0.3, car.width * 0.8, car.height * 0.15, 2);
    
    // Blink lights based on time
    const blinkRate = floor(frameCount / 10) % 2;
    if (blinkRate === 0) {
      fill(255, 0, 0);
      rect(-car.width * 0.25, -car.height * 0.3, car.width * 0.15, car.height * 0.1);
    } else {
      fill(0, 0, 255);
      rect(car.width * 0.25, -car.height * 0.3, car.width * 0.15, car.height * 0.1);
    }
    
    pop();
  }
}

function drawHUD() {
  // Score
  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT);
  text(`SCORE: ${floor(score)}`, 20, 30);
  
  // Heat level
  fill(150);
  rect(20, 50, 150, 15);
  fill(map(heatLevel, 0, maxHeatLevel, 0, 255), 0, 0);
  rect(20, 50, map(heatLevel, 0, maxHeatLevel, 0, 150), 15);
  fill(255);
  text("HEAT", 180, 65);
  
  // Speed
  text(`SPEED: ${player.speed.toFixed(1)}`, 20, 90);
  
  // Instructions
  fill(200);
  textAlign(RIGHT);
  text("ARROWS / WASD: Control car", width - 20, 30);
}

function displayGameOver() {
  background(0, 0, 0, 200);
  
  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("GAME OVER", width/2, height/2 - 50);
  
  textSize(30);
  text(`SCORE: ${floor(score)}`, width/2, height/2 + 20);
  
  textSize(20);
  text("Press SPACE to restart", width/2, height/2 + 80);
}

function keyPressed() {
  // Restart game
  if (gameOver && keyCode === 32) {
    resetGame();
  }
  
  return false; // Prevent default
}

function resetGame() {
  // Reset player
  player.trackPos = 0;
  player.segmentIndex = 0;
  player.offset = 0;
  player.speed = PLAYER_SPEED;
  player.crashed = false;
  
  // Reset other elements
  trafficCars = [];
  policeCars = [];
  score = 0;
  heatLevel = 0;
  gameOver = false;
  
  // Update player position
  updatePlayerPosition();
}

function windowResized() {
  GAME_WIDTH = windowWidth;
  GAME_HEIGHT = windowHeight;
  resizeCanvas(GAME_WIDTH, GAME_HEIGHT);
  
  // Regenerate track
  createTrack();
  
  // Reset player position
  resetGame();
}