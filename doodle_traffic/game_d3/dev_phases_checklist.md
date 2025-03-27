# Doodle Dash: Development Checklist

## Phase 1: Three.js Foundation & Basic Road
- [x] Set up Three.js environment with responsive canvas
- [x] Implement basic camera and scene setup
- [x] Create a simple two-lane road with notebook paper texture
- [x] Add basic lighting
- [x] Implement a simple keyboard input system
- [ ] Refine camera angle to 30-45° perspective for optimal view
- [x] Set up modular file structure for the project

## Phase 2: Player Car & Movement
- [x] Create a simple doodle car model
- [x] Implement lane-changing mechanics (A/D keys)
- [x] Add speed control (W/S keys)
- [ ] Implement car physics (momentum, tilting on turns)
- [x] Add camera follow behavior
- [ ] Create basic collision boundary for the car

## Phase 3: Scrolling World & Road Generation
- [ ] Implement road segment generation system
- [ ] Create scrolling mechanism to move the world past the player
- [ ] Develop segment types (straight, left turn, right turn)
- [ ] Implement basic road segment recycling for performance
- [ ] Add distance tracking for scoring
- [ ] Extend notebook paper background beyond the road
- [ ] Add subtle paper elements (edge tears, binding holes)
- [ ] Ensure background scrolls properly with the road

## Phase 4: Drawing-in-Progress Core Effect
- [ ] Implement "sketch to solid" line rendering system
- [ ] Create shader for pencil line effect
- [ ] Add pencil cursor at the leading edge of drawing
- [ ] Implement opacity/solidity gradient based on distance
- [ ] Add subtle sketch jitter to distant elements

## Phase 5: Basic Obstacles & Health System
- [ ] Create simple doodle obstacle models (other cars, pencils, erasers)
- [ ] Implement obstacle placement system
- [ ] Add basic collision detection
- [ ] Implement health bar system:
  - [ ] Add a notebook paper-style health bar
  - [ ] Health decreases on collisions (different amounts based on obstacle type)
  - [ ] Visual feedback when health changes (paper crumple effect, pencil marks)
- [ ] Add simple collision response (car slows or swerves slightly)

## Phase 6: Drawing Effects & Health Interactions
- [ ] Extend drawing-in-progress effect to obstacles
- [ ] Implement erasing/redrawing mechanics
- [ ] Add "artist mistakes" with partial draws and corrections
- [ ] Implement speed variations in the drawing effect
- [ ] Create visual feedback for near-misses
- [ ] Add health interactions:
  - [ ] Health bar being "erased" when taking damage
  - [ ] Potential for health recovery items
  - [ ] Visual cues when health is critically low

## Phase 7: Game States & UI
- [ ] Create start screen with instructions
- [ ] Implement game over condition and screen
- [ ] Add pause functionality
- [ ] Create score display and health indicator
- [ ] Implement restart mechanism

## Phase 8: Audio Integration
- [ ] Add pencil scratching sounds for drawing
- [ ] Implement eraser sound effects
- [ ] Add paper crumpling for collisions
- [ ] Create or integrate background music
- [ ] Add audio controls (volume, mute)

## Phase 9: Advanced Drawing Effects
- [ ] Implement coffee stain obstacles with slippery physics
- [ ] Add ink blots that temporarily obscure view
- [ ] Create more complex erasing/redrawing animations
- [ ] Implement varying artist behavior (hesitant, frantic, confident)
- [ ] Add subtle paper texture interactions (crumpling, folding)
- [ ] Create power-ups that can repair health (correction tape, fresh pencil marks)
- [ ] Add temporary shield effects (protective circles around the car)
- [ ] Implement varying damage types (heavy smudges for major, light marks for minor)
- [ ] Add health regeneration over time (slow redrawing of the health bar)
- [ ] Create visual effects that tie health to the game world

## Phase 10: Polish & Optimization
- [ ] Performance optimization for 60fps
- [ ] Add particle effects (pencil dust, eraser bits)
- [ ] Implement difficulty progression
- [ ] Add visual polish (shadows, subtle animations)
- [ ] Create advanced scoring with combos for near-misses

This checklist gives us a clear roadmap of what's been completed and what's still to come. We've made good progress on Phase 1, with just the camera angle refinement remaining before we move to Phase 2.