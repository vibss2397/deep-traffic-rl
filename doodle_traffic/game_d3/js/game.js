// Game class - Main game loop and state management
import { InputHandler } from './input.js';
import { SceneManager } from './scene-manager.js';

export class Game {
    constructor() {
        this.isRunning = false;
        this.inputHandler = null;
        this.sceneManager = null;
        this.lastTime = 0;
    }

    init() {
        // Initialize scene manager
        this.sceneManager = new SceneManager();
        this.sceneManager.init();

        // Initialize input handler
        this.inputHandler = new InputHandler();
        this.inputHandler.init();

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

        // Process inputs
        const inputs = this.inputHandler.getInputs();

        // Update camera based on inputs
        if (inputs.arrowUp) this.sceneManager.moveCamera('forward', deltaTime);
        if (inputs.arrowDown) this.sceneManager.moveCamera('backward', deltaTime);
        if (inputs.arrowLeft) this.sceneManager.moveCamera('left', deltaTime);
        if (inputs.arrowRight) this.sceneManager.moveCamera('right', deltaTime);

        // Update scene
        this.sceneManager.update(deltaTime);

        // Continue animation loop
        requestAnimationFrame(this.animate);
    }
}