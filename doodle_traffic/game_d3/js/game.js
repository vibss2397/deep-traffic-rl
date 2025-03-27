// Game class - Main game loop and state management
import { InputHandler } from './input.js';
import { SceneManager } from './scene-manager.js';
import { createPlayer } from './objects/player.js';

export class Game {
    constructor() {
        this.isRunning = false;
        this.inputHandler = null;
        this.sceneManager = null;
        this.player = null;
        this.lastTime = 0;
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

        // Bind this to animation loop
        this.animate = this.animate.bind(this);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.sceneManager.onWindowResize();
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
        
        // Update camera to follow player
        this.sceneManager.updateCameraFollow(this.player.position, this.player.speed, cappedDeltaTime);

        // Update scene
        this.sceneManager.update(cappedDeltaTime);

        // Continue animation loop
        requestAnimationFrame(this.animate);
    }
}