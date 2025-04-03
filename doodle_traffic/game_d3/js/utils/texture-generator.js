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

// Create a texture that appears to be actively drawn
export function createActiveDrawingTexture(drawingProgress = 0.5) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Higher resolution for better detail
    canvas.width = 1024;
    canvas.height = 1024;
    
    // Fill background with off-white color
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Function to draw a sketchy line
    const drawSketchyLine = (x1, y1, x2, y2, width, color, opacity, jitterAmount) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = width;
        
        // Draw main line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        // Create control points with jitter
        const numSegments = 5;
        for (let i = 1; i <= numSegments; i++) {
            const t = i / numSegments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // Add random jitter
            const jitter = jitterAmount * (1 - Math.abs(t - 0.5) * 2); // More jitter in middle
            const jitterX = x + (Math.random() - 0.5) * jitter;
            const jitterY = y + (Math.random() - 0.5) * jitter;
            
            ctx.lineTo(jitterX, jitterY);
        }
        
        ctx.stroke();
        
        // Draw additional lighter, more jittery lines for sketchy effect
        if (Math.random() < 0.7) {
            ctx.globalAlpha = opacity * 0.5;
            ctx.lineWidth = width * 0.7;
            
            ctx.beginPath();
            ctx.moveTo(x1 + (Math.random() - 0.5) * jitterAmount, 
                       y1 + (Math.random() - 0.5) * jitterAmount);
            
            for (let i = 1; i <= numSegments; i++) {
                const t = i / numSegments;
                const x = x1 + (x2 - x1) * t;
                const y = y1 + (y2 - y1) * t;
                
                const jitter = jitterAmount * 1.5; // More jitter for extra lines
                const jitterX = x + (Math.random() - 0.5) * jitter;
                const jitterY = y + (Math.random() - 0.5) * jitter;
                
                ctx.lineTo(jitterX, jitterY);
            }
            
            ctx.stroke();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    };
    
    // Draw horizontal lines with progress-based opacity
    const totalLines = 32; // Number of horizontal lines
    for (let i = 0; i < totalLines; i++) {
        const y = 32 + i * 32;
        
        // Calculate max drawing distance based on progress (0-1)
        const maxDist = canvas.width * drawingProgress;
        
        // Draw lines in segments to simulate drawing in progress
        const segments = 8;
        const segmentWidth = canvas.width / segments;
        
        for (let j = 0; j < segments; j++) {
            const startX = j * segmentWidth;
            const endX = startX + segmentWidth;
            
            // Skip segments beyond the drawing progress
            if (startX > maxDist) continue;
            
            // Calculate opacity based on how far along the line we are
            // Lines are drawn more opaque (darker) as they get "older"
            const distanceFactor = Math.max(0, 1 - (endX / maxDist));
            const opacity = 0.3 + distanceFactor * 0.7;
            
            // Add slight randomness to jitter based on position
            const jitterAmount = 2 + distanceFactor * 4;
            
            // Draw the line segment
            drawSketchyLine(
                startX, y, 
                endX, y, 
                2, 
                '#c0c0ff', 
                opacity,
                jitterAmount
            );
        }
    }
    
    // Draw vertical lines (more subtle)
    const totalVerticals = 32;
    for (let i = 0; i < totalVerticals; i++) {
        const x = 32 + i * 32;
        
        // Only draw vertical lines up to the drawing progress
        if (x > canvas.width * drawingProgress) continue;
        
        // Calculate opacity - fade in based on "age"
        const distanceFactor = Math.max(0, 1 - (x / (canvas.width * drawingProgress)));
        const opacity = 0.1 + distanceFactor * 0.3;
        
        drawSketchyLine(
            x, 0,
            x, canvas.height,
            1,
            '#e8e8ff',
            opacity,
            4
        );
    }
    
    // Draw red margin line (if within drawing progress)
    if (64 < canvas.width * drawingProgress) {
        drawSketchyLine(
            64, 0,
            64, canvas.height,
            3,
            '#ffb0b0',
            0.7,
            5
        );
    }
    
    // Add some pencil smudges
    const smudgeCount = Math.floor(20 * drawingProgress);
    for (let i = 0; i < smudgeCount; i++) {
        const x = Math.random() * canvas.width * drawingProgress;
        const y = Math.random() * canvas.height;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.beginPath();
        
        const size = 2 + Math.random() * 5;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Create and configure the texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 5);
    
    return texture;
}

// Generate a "sketch-in-progress" version of a texture
export function createSketchInProgressTexture(baseTexture, progress) {
    if (!baseTexture.image) return baseTexture;
    
    // Create a new canvas to modify the texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Match size of original texture
    canvas.width = baseTexture.image.width;
    canvas.height = baseTexture.image.height;
    
    // Draw the original texture
    ctx.drawImage(baseTexture.image, 0, 0);
    
    // Add a semi-transparent overlay to make it look sketchy/incomplete
    ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some random sketch lines that appear as it's being drawn
    if (progress > 0.1) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        
        const numLines = Math.floor(10 * progress);
        for (let i = 0; i < numLines; i++) {
            const startX = Math.random() * canvas.width;
            const startY = Math.random() * canvas.height;
            const length = 10 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(
                startX + Math.cos(angle) * length,
                startY + Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }
    
    // Create a new texture from the modified canvas
    const newTexture = new THREE.CanvasTexture(canvas);
    
    // Copy properties from original texture
    newTexture.wrapS = baseTexture.wrapS;
    newTexture.wrapT = baseTexture.wrapT;
    newTexture.repeat.copy(baseTexture.repeat);
    
    return newTexture;
}