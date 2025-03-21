# Doodle Dash: Three.js Implementation Specification

## Project Overview
Doodle Dash is a black and white endless runner game with a unique "drawing-in-progress" mechanic. The game world appears to be actively drawn by an invisible artist as the player progresses, with pencil sketches forming into solid objects just before the player reaches them.

## Core Visual Style
- Black and white hand-drawn/doodle aesthetic
- Notebook paper background with visible grid lines
- Pencil sketches that transition to solid lines
- Visible drawing process (pencil lines forming, occasional erasing)
- Casual, sketchy, imperfect lines that feel hand-drawn

## Core Mechanics
1. **Drawing-in-Progress**: The road and obstacles are visibly drawn ahead of the player
   - Sketchy, light pencil lines appear first in the distance
   - Lines gradually darken and solidify as player approaches them
   - Artist's pencil is occasionally visible at the leading edge

2. **Artist Behaviors**:
   - Sometimes makes mistakes (starts drawing an obstacle then erases it)
   - Sometimes hastily redraws/changes obstacles at the last second
   - Drawing speed varies (sometimes frantic, sometimes hesitant)

3. **Player Movement**:
   - Left/right lane changes (A/D keys)
   - Speed control (W/S keys - speed up/slow down)
   - Collision detection with obstacles

4. **Game Progression**:
   - Speed gradually increases over time
   - Obstacle density increases
   - Drawing patterns become more complex and erratic
   - Score based on distance traveled and near-misses

## Technical Requirements

### Three.js Setup
- Create a basic HTML/JS structure with Three.js imported
- Canvas should fill the browser window with responsive sizing
- Implement standard Three.js scene, camera, and renderer

### Road System
- Implement a perspective view of a two-lane road
- Road segments are generated ahead of the player
- Each segment can be:
  - Straight section
  - Gradual left turn
  - Gradual right turn
- Segments should appear to be drawn by an invisible hand:
  - Start as light, sketchy lines (low opacity)
  - Gradually solidify (higher opacity, less random variation)
  - Fully solid by the time player reaches them

### Player Car
- Simple doodle car with black outline
- Car should tilt slightly when turning
- Car stays in fixed position on screen (camera follows car)
- Car casts a small shadow beneath it
- Car has satisfying physics:
  - Slight momentum when changing lanes
  - Smooth acceleration/deceleration
  - Subtle bouncing on rough road sections

### Obstacles
1. **Other vehicles**: Simple doodle cars/trucks that block lanes
2. **Road hazards**: Pencils, erasers, coffee stains on the road
3. **Visual obstacles**: Ink blots that temporarily obscure view
4. **Special elements**: Coffee stains create slippery areas

### Drawing-in-Progress Visual Effects
- **Pencil cursor**: Visible pencil tip showing where artist is drawing
- **Sketch lines**: Light gray, slightly jittery lines for initial drawings
- **Solidification**: Lines becoming darker and more stable as they approach
- **Erasing effect**: White, blurry eraser motion when artist "changes mind"
- **Redrawing**: Rapid sketching when artist corrects a mistake

### Game States
1. **Start Screen**: Simple title with "Press Space to Start"
2. **Playing**: Main gameplay with score display
3. **Game Over**: Show final score, "Press R to Restart"
4. **Pause**: Pause menu when ESC is pressed

### Audio Concept
- Pencil scratching sounds as objects are drawn
- Eraser sound effects for corrections
- Paper crumpling for collisions
- Simple background music

### Lives System
- Player starts with 3 lives
- Visual erasing animation on collision
- Respawn animation (car being redrawn)
- Game over when all lives are depleted

## Current Development Status
- Basic p5.js implementation has been started
- Player car with WASD controls is implemented
- Simple road rendering is in place
- Beginning of a scrolling system has been implemented
- Starting to implement the "drawing-in-progress" effect

## Implementation Priorities
1. Basic Three.js setup with road and car
2. Core scrolling/movement mechanics
3. Drawing-in-progress visual effect for road
4. Obstacle generation with drawing effect
5. Collision detection and lives system
6. Game states and UI
7. Audio implementation
8. Visual polish and performance optimization

## Technical Challenges to Address
1. **Line Rendering**: Creating convincing hand-drawn lines in Three.js
2. **Drawing Animation**: Smoothly transitioning from sketch to solid
3. **Erasing Effects**: Realistic eraser marks and redrawing
4. **Performance**: Maintaining 60fps with many animated elements
5. **Physics**: Natural-feeling car movement and collisions

## Design References
- The road should feature notebook paper grid lines in the background
- The overall aesthetic should feel like doodles in a school notebook
- Car and obstacles should have a simple, cartoon-like appearance
- Animation should have a stop-motion, hand-drawn quality

This specification provides a comprehensive roadmap for implementing Doodle Dash in Three.js. The unique drawing-in-progress mechanic and hand-drawn aesthetic are the key distinguishing features of the game, and should be prioritized in the implementation.