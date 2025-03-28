// debug-ui.js - A simple debug interface for game stats
import * as THREE from 'three';

export class DebugUI {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.speedDisplay = null;
        this.distanceDisplay = null;
        this.fpsDisplay = null;
        this.inputDisplay = null;
        
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
    }
    
    init() {
        // Create container for debug info
        this.container = document.createElement('div');
        this.container.id = 'debug-ui';
        this.container.style.position = 'absolute';
        this.container.style.bottom = '10px';
        this.container.style.left = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.color = 'white';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '14px';
        this.container.style.zIndex = '1000';
        
        // Speed display
        this.speedDisplay = document.createElement('div');
        this.speedDisplay.innerHTML = 'Speed: 0';
        this.container.appendChild(this.speedDisplay);
        
        // Distance display
        this.distanceDisplay = document.createElement('div');
        this.distanceDisplay.innerHTML = 'Distance: 0';
        this.container.appendChild(this.distanceDisplay);
        
        // FPS display
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.innerHTML = 'FPS: 0';
        this.container.appendChild(this.fpsDisplay);
        
        // Input display
        this.inputDisplay = document.createElement('div');
        this.inputDisplay.innerHTML = 'Inputs: None';
        this.container.appendChild(this.inputDisplay);
        
        // Add to document
        document.body.appendChild(this.container);
        
        console.log('Debug UI initialized');
    }
    
    update(deltaTime, inputs) {
        // Update speed display
        if (this.game.player) {
            this.speedDisplay.innerHTML = `Speed: ${this.game.player.speed.toFixed(2)}`;
        }
        
        // Update distance display
        this.distanceDisplay.innerHTML = `Distance: ${this.game.distanceTraveled.toFixed(2)}`;
        
        // Update FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate > 1000) { // Update every second
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
        this.fpsDisplay.innerHTML = `FPS: ${this.fps}`;
        
        // Update input display
        const activeInputs = [];
        if (inputs.keyW || inputs.arrowUp) activeInputs.push('W/Up');
        if (inputs.keyS || inputs.arrowDown) activeInputs.push('S/Down');
        if (inputs.keyA || inputs.arrowLeft) activeInputs.push('A/Left');
        if (inputs.keyD || inputs.arrowRight) activeInputs.push('D/Right');
        
        this.inputDisplay.innerHTML = `Inputs: ${activeInputs.length > 0 ? activeInputs.join(', ') : 'None'}`;
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}