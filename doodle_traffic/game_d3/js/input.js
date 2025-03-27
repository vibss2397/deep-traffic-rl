// Input handling
export class InputHandler {
    constructor() {
        this.keys = {
            arrowUp: false,
            arrowDown: false,
            arrowLeft: false,
            arrowRight: false,
            keyW: false,
            keyS: false,
            keyA: false,
            keyD: false,
            space: false,
            escape: false
        };

        // Bind methods to this
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    init() {
        // Add event listeners
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        console.log('Input handler initialized - press WASD or arrow keys to move the car');
    }

    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }

    onKeyDown(event) {
        switch(event.key) {
            case 'ArrowUp':
                this.keys.arrowUp = true;
                break;
            case 'ArrowDown':
                this.keys.arrowDown = true;
                break;
            case 'ArrowLeft':
                this.keys.arrowLeft = true;
                break;
            case 'ArrowRight':
                this.keys.arrowRight = true;
                break;
            case 'w':
            case 'W':
                this.keys.keyW = true;
                break;
            case 's':
            case 'S':
                this.keys.keyS = true;
                break;
            case 'a':
            case 'A':
                this.keys.keyA = true;
                break;
            case 'd':
            case 'D':
                this.keys.keyD = true;
                break;
            case ' ':
                this.keys.space = true;
                break;
            case 'Escape':
                this.keys.escape = true;
                break;
        }
    }

    onKeyUp(event) {
        switch(event.key) {
            case 'ArrowUp':
                this.keys.arrowUp = false;
                break;
            case 'ArrowDown':
                this.keys.arrowDown = false;
                break;
            case 'ArrowLeft':
                this.keys.arrowLeft = false;
                break;
            case 'ArrowRight':
                this.keys.arrowRight = false;
                break;
            case 'w':
            case 'W':
                this.keys.keyW = false;
                break;
            case 's':
            case 'S':
                this.keys.keyS = false;
                break;
            case 'a':
            case 'A':
                this.keys.keyA = false;
                break;
            case 'd':
            case 'D':
                this.keys.keyD = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
            case 'Escape':
                this.keys.escape = false;
                break;
        }
    }

    getInputs() {
        // Return a copy of the keys object
        return { ...this.keys };
    }
}