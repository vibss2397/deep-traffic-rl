// Custom texture creation
import * as THREE from 'three';

// Create a notebook paper texture
export function createNotebookTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 512;
    canvas.height = 512;
    
    // Fill background with off-white color
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw horizontal lines
    ctx.strokeStyle = '#d0d0ff';
    ctx.lineWidth = 1;
    
    for (let y = 32; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw vertical line (margin)
    ctx.strokeStyle = '#ffb0b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, canvas.height);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 5);
    
    return texture;
}

// Create a simple line texture
export function createLineTexture(color = '#000000', width = 2) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 64;
    canvas.height = 64;
    
    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a single line in the center
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(32, 64);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}

// Function to create a texture with sketchy lines
export function createSketchyTexture(color = '#333333', lineCount = 5, jitter = 3) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 128;
    canvas.height = 128;
    
    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw multiple sketchy lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        let x = 64; // Center
        
        // Start at the top
        ctx.moveTo(x + (Math.random() * jitter * 2 - jitter), 0);
        
        // Create a sketchy path down
        for (let y = 10; y < canvas.height; y += 10) {
            x = 64 + (Math.random() * jitter * 2 - jitter);
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}