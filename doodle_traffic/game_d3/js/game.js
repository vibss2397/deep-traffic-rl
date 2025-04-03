// Game class - Main game loop and state management
import { InputHandler } from './input.js';
import { SceneManager } from './scene-manager.js';
import { createPlayer } from './objects/player.js';
import { DebugUI } from './debug-ui.js';

export class Game {
    constructor() {
        this.isRunning = false;
        this.inputHandler = null;
        this.sceneManager = null;
        this.player = null;
        this.debugUI = null; // Add debug UI
        this.lastTime = 0;
        
        // Game state variables
        this.distanceTraveled = 0;
        this.scrollSpeed = 0;
        
        // Flag to toggle between scrolling world and moving player
        this.useScrollingWorld = true; // Start with scrolling world
        this.absolutePlayerZ = 0;
    }

    init() {
        // Initialize scene manager
        this.sceneManager = new SceneManager();
        this.sceneManager.init();

        // Initialize input handler
        this.inputHandler = new InputHandler();
        this.inputHandler.init();
        
        // Create player
        this.player = createPlayer();
        this.sceneManager.addToScene(this.player.mesh);
        
        // Add collision debug box to scene
        this.sceneManager.addToScene(this.player.debugCollider);
        
        // Position camera to follow player
        this.sceneManager.setCameraTarget(this.player.mesh);
        
        // Initialize debug UI
        this.debugUI = new DebugUI(this);
        this.debugUI.init();

        // Bind this to animation loop
        this.animate = this.animate.bind(this);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.sceneManager.onWindowResize();
        });
        
        // Handle toggle between scrolling world and moving player modes
        window.addEventListener('keydown', (event) => {
            if (event.key === 't' || event.key === 'T') {
                this.toggleMovementMode();
            }
        });

        console.log('Game initialized');
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.animate);
            console.log('Game started');
        }
    }

    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }
    
    // Toggle between scrolling world and moving player modes
    toggleMovementMode() {
        this.useScrollingWorld = !this.useScrollingWorld;
        console.log(`Movement mode set to: ${this.useScrollingWorld ? 'Scrolling World' : 'Moving Player'}`);
    }

    animate(currentTime) {
        if (!this.isRunning) return;
    
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
        this.lastTime = currentTime;
        
        // Limit delta time to avoid large jumps
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
        // Process inputs
        const inputs = this.inputHandler.getInputs();
    
        // Update player
        this.player.update(cappedDeltaTime, inputs);
        
        // Update scroll speed based on player speed
        this.scrollSpeed = this.player.speed;
        
        // Calculate distance moved this frame
        const distanceMoved = this.scrollSpeed * cappedDeltaTime;
        
        // Update distance traveled (for UI/score)
        if (this.scrollSpeed > 0) {
            this.distanceTraveled += distanceMoved;
        }
        
        // Track absolute position for road generation, regardless of mode
        if (this.scrollSpeed > 0) {
            this.absolutePlayerZ -= distanceMoved; // Moving forward is negative Z
        }
        
        if (this.useScrollingWorld) {
            // Scrolling world mode - player stays in place, world moves past
            this.sceneManager.updateScroll(this.scrollSpeed, cappedDeltaTime);
            
            // Create a virtual player position using the absolute Z position
            const virtualPlayerPos = {
                x: this.player.position.x,
                y: this.player.position.y,
                z: this.absolutePlayerZ
            };
            
            // Update road and camera using absolute position
            this.sceneManager.updateCameraFollow(virtualPlayerPos, this.player.speed, cappedDeltaTime);
        } else {
            // Moving player mode - player moves through the world
            if (this.scrollSpeed > 0) {
                const moveAmount = distanceMoved;
                this.player.position.z -= moveAmount;
                this.player.mesh.position.z = this.player.position.z;
                this.player.updateCollider();
                
                // Ensure absolutePlayerZ matches actual position
                this.absolutePlayerZ = this.player.position.z;
            }
            
            // Update camera to follow player's actual position
            this.sceneManager.updateCameraFollow(this.player.position, this.player.speed, cappedDeltaTime);
        }
    
        // Update scene
        this.sceneManager.update(this.player.speed, cappedDeltaTime);
        
        // Update debug UI
        this.debugUI.update(cappedDeltaTime, inputs);
    
        // Continue animation loop
        requestAnimationFrame(this.animate);
    }
}