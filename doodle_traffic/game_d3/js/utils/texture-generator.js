// Custom texture creation
import * as THREE from 'three';

// Create a vintage notebook paper texture with a blue-ish grid
export function createNotebookTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resolution for the texture - 512x512 is a good balance
    canvas.width = 512; 
    canvas.height = 512;
    
    console.log("[texture-generator] createNotebookTexture: Canvas created for vintage (off-white bg, navy grid) notebook texture.");
    
    // 1. Fill background with an off-white vintage paper color
    ctx.fillStyle = '#fdfdf6'; // "Old Lace" - a yellowish off-white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log("[texture-generator] createNotebookTexture: Canvas filled with off-white vintage paper color.");

    // 2. Add subtle noise/texture for an aged look
    const numSpecks = 2000; // Number of specks for texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'; // Subtle dark specks for light background
    for (let i = 0; i < numSpecks; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 1.5; // Small specks
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    console.log("[texture-generator] createNotebookTexture: Added subtle dark noise specks.");

    // 3. Draw a grid of navy blue squares
    ctx.strokeStyle = '#000080'; // Navy Blue for the grid
    ctx.lineWidth = 0.75;        // Keep lines relatively thin for a classic look
    const gridSpacing = canvas.width / 20; // Approx 25-26px for a 512px canvas, creating 20 squares across

    // Draw vertical grid lines
    for (let x = gridSpacing; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    console.log("[texture-generator] createNotebookTexture: Drew vertical navy grid lines.");

    // Draw horizontal grid lines
    for (let y = gridSpacing; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    console.log("[texture-generator] createNotebookTexture: Drew horizontal navy grid lines.");
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(1, 5); // This is overridden in environment.js
    texture.needsUpdate = true; 
    
    console.log("[texture-generator] createNotebookTexture: Returning vintage (off-white bg, navy grid) texture object:", texture);
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
    texture.needsUpdate = true;
    return texture;
}


export function createHandDrawnPaperTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 512;
    canvas.height = 512; // A square texture is often easiest to work with for repeating patterns

    const paperColor = '#F5ECCD'    // Base paper color - should match scene background
    const speckleColor = 'rgba(101, 67, 33, 0.04)'; // For paper grain

    console.log("[texture-generator] createHandDrawnPaperTexture: Canvas created.");

    // 1. Fill background with paper color
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log("[texture-generator] createHandDrawnPaperTexture: Filled with paper color.");

    // 2. Add subtle noise/texture for an aged/paper look
    const numSpecks = 2500;
    ctx.fillStyle = speckleColor;
    for (let i = 0; i < numSpecks; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 1.8; // Slightly larger specks might look more like paper fibers
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    console.log("[texture-generator] createHandDrawnPaperTexture: Added paper grain specks.");


    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // The actual repeat scaling will be handled in environment.js based on segment size
    texture.needsUpdate = true;

    console.log("[texture-generator] createHandDrawnPaperTexture: Returning texture object:", texture);
    return texture;
}