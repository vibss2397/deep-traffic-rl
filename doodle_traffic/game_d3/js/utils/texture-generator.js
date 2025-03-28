// Custom texture creation
import * as THREE from 'three';

// Create a notebook paper texture with enhanced visual features
export function createNotebookTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Higher resolution for better detail
    canvas.width = 1024;
    canvas.height = 1024;
    
    // Fill background with off-white color
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw horizontal lines - more prominent
    ctx.strokeStyle = '#c0c0ff';
    ctx.lineWidth = 2;
    
    for (let y = 32; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw vertical lines - more subtle grid for better movement cues
    ctx.strokeStyle = '#e8e8ff';
    ctx.lineWidth = 1;
    
    for (let x = 32; x < canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw vertical line (margin) - more prominent
    ctx.strokeStyle = '#ffb0b0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, canvas.height);
    ctx.stroke();
    
    // Add some subtle texture variations for visual interest
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 2 + Math.random() * 5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
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

// Create a dotted grid texture
export function createDottedGridTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 256;
    canvas.height = 256;
    
    // Fill with off-white background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid dots
    ctx.fillStyle = '#cccccc';
    
    for (let x = 16; x < canvas.width; x += 16) {
        for (let y = 16; y < canvas.height; y += 16) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 20); // More repetition for smoother scrolling
    
    return texture;
}