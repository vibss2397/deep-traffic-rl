// Main application entry point
import { Game } from './game.js';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    game.start();
});