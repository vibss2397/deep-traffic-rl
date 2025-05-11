// Environment elements
import * as THREE from 'three';
import { createNotebookTexture, createDottedGridTexture } from '../utils/texture-generator.js';

export function createEnvironment() {
    const envGroup = new THREE.Group();
    
    // Creating ground segments
    addGroundSegments(envGroup);
    
    // Create and add decorative elements more efficiently
    addDecorativeElementsOptimized(envGroup);
    
    // Add notebook paper elements
    addPaperElements(envGroup);
    
    return envGroup;
}

function addGroundSegments(envGroup) {
    // Create multiple ground segments that can be reused
    const segmentLength = 250;
    const segmentWidth = 200;  // INCREASED from 100 to 200 for better coverage
    const segmentsCount = 12;  // INCREASED from 8 to 10 for better coverage
    
    // Get notebook paper texture for the ground
    const groundTexture = createDottedGridTexture();
    groundTexture.repeat.set(10, 25);
    
    // Create segments with individual materials to prevent shared opacity issues
    for (let i = 0; i < segmentsCount; i++) {
        const groundGeometry = new THREE.PlaneGeometry(segmentWidth, segmentLength);
        
        // Create separate material for each segment
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf5f5f5,
            roughness: 1.0,
            metalness: 0.0,
            map: groundTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Position segments in a chain with slight overlap (5 units)
        ground.rotation.x = -Math.PI / 2;  // Rotate to lay flat
        ground.position.y = -0.1 - (i * 0.001);  // IMPORTANT: Slight y-offset to prevent z-fighting
        
        // Positioning with overlap
        const overlap = 5;
        ground.position.z = -(i * (segmentLength - overlap)) + (segmentLength/2);
        
        // Mark for recycling AND scrolling
        ground.userData.isGroundSegment = true;
        ground.userData.isEnvironmentElement = true; // For scrolling
        ground.userData.segmentIndex = i;
        ground.userData.initialZ = ground.position.z;
        
        ground.receiveShadow = true;
        envGroup.add(ground);
    }
}

// Function to update and recycle ground segments
export function updateGroundSegments(envGroup, playerZ) {
    if (!envGroup) return;
    
    const segmentLength = 250;
    const visibleRangeBehind = 750; // How far behind player to keep segments
    const visibleRangeAhead = 1500; // How far ahead of player to generate segments
    const lookAheadThreshold = 1000; // Start recycling when within this distance of the farthest segment
    
    // First, gather information about all ground segments
    const segments = [];
    envGroup.traverse((child) => {
        if (child.userData?.isGroundSegment) {
            segments.push(child);
        }
    });
    
    if (segments.length === 0) return;
    
    // Sort segments by Z position for consistent processing
    segments.sort((a, b) => a.position.z - b.position.z);
    
    // Find farthest segment ahead and behind
    let furthestAheadZ = -Infinity;
    let furthestBehindZ = Infinity;
    
    segments.forEach(segment => {
        // Calculate segment end positions
        const segmentEndZ = segment.position.z - (segmentLength/2); // Front edge (most negative Z)
        const segmentStartZ = segment.position.z + (segmentLength/2); // Back edge (most positive Z)
        
        if (segmentEndZ < furthestAheadZ) furthestAheadZ = segmentEndZ;
        if (segmentStartZ > furthestBehindZ) furthestBehindZ = segmentStartZ;
    });
    
    // Calculate desired coverage range
    const desiredAheadZ = playerZ - visibleRangeAhead;
    const desiredBehindZ = playerZ + visibleRangeBehind;
    
    // DEBUG OUTPUT
    console.debug(`Player Z: ${playerZ.toFixed(2)}, Furthest ahead Z: ${furthestAheadZ.toFixed(2)}, ` +
                 `Furthest behind Z: ${furthestBehindZ.toFixed(2)}`);
    console.debug(`Desired ahead Z: ${desiredAheadZ.toFixed(2)}, Desired behind Z: ${desiredBehindZ.toFixed(2)}`);
    
    // FIRST PASS: Recycle segments that are too far behind
    let recycledSegments = [];
    
    segments.forEach(segment => {
        const segmentStartZ = segment.position.z + (segmentLength/2); // Back edge
        
        // If this segment is entirely behind our desired range
        if (segmentStartZ > desiredBehindZ) {
            // Remove from current position to reuse later
            recycledSegments.push(segment);
            console.debug(`Marked segment at ${segment.position.z.toFixed(2)} for recycling`);
        }
    });
    
    // SECOND PASS: Check if we need more segments ahead
    // Calculate how far ahead we should check for segments
    const lookAheadZ = desiredAheadZ - lookAheadThreshold;
    
    // If farthest segment is not far enough ahead
    if (furthestAheadZ > lookAheadZ) {
        console.debug(`Need more segments ahead! furthestAheadZ=${furthestAheadZ.toFixed(2)}, lookAheadZ=${lookAheadZ.toFixed(2)}`);
        
        // Calculate how many segments we need to add
        const distanceNeeded = Math.abs(furthestAheadZ - desiredAheadZ);
        const segmentsNeeded = Math.ceil(distanceNeeded / segmentLength);
        
        console.debug(`Need to add ${segmentsNeeded} segments covering ${distanceNeeded.toFixed(2)} units`);
        
        // If we have recycled segments, use them; otherwise, warning
        if (recycledSegments.length > 0) {
            // Use recycled segments first
            for (let i = 0; i < Math.min(segmentsNeeded, recycledSegments.length); i++) {
                const segment = recycledSegments[i];
                
                // Position at the front, continuing from furthest segment
                const newZ = furthestAheadZ - (i * segmentLength);
                
                // Update position
                segment.position.z = newZ;
                segment.userData.initialZ = newZ;
                
                console.debug(`Recycled segment to new position: ${newZ.toFixed(2)}`);
            }
        } else {
            console.warn(`No segments available to recycle! Need ${segmentsNeeded} more segments ahead.`);
        }
    }
    
    // Verify that segments are correctly positioned
    verifySegmentPositioning(segments);
}

// Helper function to find gaps or overlaps in segments
function verifySegmentPositioning(segments) {
    // Sort segments by Z position
    segments.sort((a, b) => a.position.z - b.position.z);
    
    // Check for gaps or overlaps
    for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i];
        const nextSegment = segments[i + 1];
        
        const segmentLength = 250;
        const currentEndZ = currentSegment.position.z - (segmentLength/2);
        const nextStartZ = nextSegment.position.z + (segmentLength/2);
        
        // Calculate gap (negative means overlap)
        const gap = nextStartZ - currentEndZ;
        
        // Log significant gaps or overlaps
        if (Math.abs(gap) > 10) {
            console.warn(`Segment positioning issue: ${gap > 0 ? 'Gap' : 'Overlap'} of ${Math.abs(gap).toFixed(2)} units between segments at ${currentSegment.position.z.toFixed(2)} and ${nextSegment.position.z.toFixed(2)}`);
        }
    }
}

// Find the farthest forward segment
function findFarthestSegmentZ(envGroup) {
    let farthestZ = -Infinity;
    
    envGroup.traverse((child) => {
        if (child.userData?.isGroundSegment) {
            // Get the END position of the segment (center Z + half length)
            const endZ = child.position.z + (250/2);
            if (endZ > farthestZ) {
                farthestZ = endZ;
            }
        }
    });
    
    return farthestZ;
}

// Function to update environment decorations
export function updateEnvironmentElements(envGroup, playerZ) {
    if (!envGroup) return;
    
    const recycleDistance = 300; // Distance behind player to recycle elements
    const spawnDistance = 400; // Increased distance ahead to spawn new elements (from 200 to 400)
    
    // Maintain count of recycled elements by type for balanced distribution
    let pencilsCount = { left: 0, right: 0 };
    let erasersCount = { left: 0, right: 0 };
    let spotsCount = { left: 0, right: 0 };
    
    // First, collect information about the environment elements
    const elements = [];
    envGroup.traverse((child) => {
        if (child.userData.isEnvironmentElement && !child.userData.isGroundSegment) {
            elements.push(child);
        }
    });
    
    // Process elements in a deterministic order to prevent clustering
    elements.forEach((element) => {
        // Calculate position relative to player
        const zPos = element.userData.initialZ - playerZ;
        
        // Recycle elements that are too far behind
        if (zPos > recycleDistance) {
            // Get the element type for balanced distribution
            let elementType = 'other';
            if (element.type === 'Group' && element.children[0]?.geometry?.type === 'CylinderGeometry') {
                elementType = 'pencil';
            } else if (element.geometry?.type === 'BoxGeometry') {
                elementType = 'eraser';
            } else if (element.geometry?.type === 'CircleGeometry') {
                elementType = 'spot';
            }
            
            // Determine which side has fewer elements of this type
            let side;
            if (elementType === 'pencil') {
                side = pencilsCount.left <= pencilsCount.right ? 'left' : 'right';
                pencilsCount[side]++;
            } else if (elementType === 'eraser') {
                side = erasersCount.left <= erasersCount.right ? 'left' : 'right';
                erasersCount[side]++;
            } else if (elementType === 'spot') {
                side = spotsCount.left <= spotsCount.right ? 'left' : 'right';
                spotsCount[side]++;
            } else {
                side = Math.random() > 0.5 ? 'left' : 'right';
            }
            
            // Store the side for future reference
            element.userData.originalSide = side;
            
            // Create more variability in the new position
            const newZ = playerZ - spawnDistance - Math.random() * 100;
            element.userData.initialZ = newZ;
            element.position.z = newZ;
            
            // Position based on the chosen side with more randomization
            const sideMultiplier = side === 'left' ? -1 : 1;
            
            if (elementType === 'pencil') {
                // Wider range for pencils
                element.position.x = sideMultiplier * (8 + Math.random() * 15);
                element.position.y = 0.2 + Math.random() * 0.8;
                
                // More varied rotation
                element.rotation.z = sideMultiplier * (Math.PI / 6) + (Math.random() * 0.6 - 0.3);
                element.rotation.x = Math.random() * 0.4 - 0.2;
                element.rotation.y = Math.random() * Math.PI;
            } else if (elementType === 'eraser') {
                // Medium range for erasers
                element.position.x = sideMultiplier * (7 + Math.random() * 12);
                element.position.y = 0.2 + Math.random() * 0.3;
                
                // Random rotation
                element.rotation.y = Math.random() * Math.PI;
                element.rotation.x = Math.random() * 0.4 - 0.2;
                element.rotation.z = Math.random() * 0.4 - 0.2;
            } else if (elementType === 'spot') {
                // Smaller range for spots
                element.position.x = sideMultiplier * (5 + Math.random() * 12);
                element.position.y = 0.01 + Math.random() * 0.02;
                
                // Spots stay flat
                element.rotation.x = -Math.PI / 2;
            } else {
                // Default positioning for other elements
                element.position.x = sideMultiplier * (5 + Math.random() * 15);
                element.position.y = 0.1 + Math.random() * 0.9;
                
                // Random rotation
                element.rotation.x = Math.random() * 0.2 - 0.1;
                element.rotation.y = Math.random() * Math.PI;
                element.rotation.z = Math.random() * 0.2 - 0.1;
            }
        }
    });
}

function createGround() {
    // Create a large ground plane beyond the road - make it longer to match the road
    const groundGeometry = new THREE.PlaneGeometry(100, 250);
    
    // Get notebook paper texture for the ground
    const groundTexture = createDottedGridTexture();
    groundTexture.repeat.set(10, 25);  // Repeat the texture for the larger ground
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf5f5f5,  // Slightly off-white to match notebook paper
        roughness: 1.0,
        metalness: 0.0,
        map: groundTexture
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate to lay flat
    ground.position.y = -0.1;          // Slightly below the road
    ground.receiveShadow = true;
    
    return ground;
}

// More optimized way to add decorative elements with better distribution
function addDecorativeElementsOptimized(envGroup) {
    // Create a single reusable geometry for each type (better performance)
    const pencilGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const pencilLeadGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
    const eraserGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
    const pencilMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00,  // Pencil yellow
        roughness: 0.8,
        metalness: 0.2
    });
    const pencilLeadMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,  // Dark gray for pencil lead
        roughness: 0.7,
        metalness: 0.3
    });
    const eraserMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6666,  // Pink eraser
        roughness: 0.9,
        metalness: 0.1
    });
    const spotMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Define broader spawn zone for better distribution
    const zRange = [-800, 200]; // Expanded range (more elements ahead of player)
    
    // Create placeholder arrays to batch add elements later
    const leftElements = [];
    const rightElements = [];
    
    // Precompute random positions for balanced element placement
    const positionsLeft = [];
    const positionsRight = [];
    
    // Generate positions for left side
    for (let z = zRange[0]; z <= zRange[1]; z += 10) {
        const random = Math.random();
        if (random < 0.5) { // 50% chance to place something at this z-level
            positionsLeft.push({
                z: z + (Math.random() * 15 - 7.5), // Add some randomness to z
                x: -(8 + Math.random() * 12), // Random distance from road
                type: random < 0.15 ? 'pencil' : 
                      random < 0.35 ? 'eraser' : 'spot'
            });
        }
    }
    
    // Generate positions for right side (similar number as left)
    for (let z = zRange[0]; z <= zRange[1]; z += 10) {
        const random = Math.random();
        if (random < 0.5) { // 50% chance to place something at this z-level
            positionsRight.push({
                z: z + (Math.random() * 15 - 7.5), // Add some randomness to z
                x: 8 + Math.random() * 12, // Random distance from road
                type: random < 0.15 ? 'pencil' : 
                      random < 0.35 ? 'eraser' : 'spot'
            });
        }
    }
    
    // Create pencils function to avoid code duplication
    const createPencil = (x, z, side) => {
        const pencil = new THREE.Group();
        const pencilBody = new THREE.Mesh(pencilGeometry, pencilMaterial);
        const pencilLead = new THREE.Mesh(pencilLeadGeometry, pencilLeadMaterial);
        
        pencilLead.position.y = -0.9;  // Position at the bottom of the pencil
        pencilLead.rotation.x = Math.PI;  // Point downward
        
        pencil.add(pencilBody);
        pencil.add(pencilLead);
        
        // Set position and rotation
        pencil.position.set(x, 0.2 + Math.random() * 0.8, z);
        pencil.rotation.z = (side === 'left' ? -1 : 1) * (Math.PI / 6 + Math.random() * 0.3);
        pencil.rotation.x = Math.random() * 0.4 - 0.2;
        pencil.rotation.y = Math.random() * Math.PI;
        
        // Tag for recycling
        pencil.userData.isEnvironmentElement = true;
        pencil.userData.initialZ = z;
        pencil.userData.originalSide = side;
        
        // Add shadow casting
        pencil.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.userData.isRoadMarking = true;
            }
        });
        
        return pencil;
    };
    
    // Process all the precomputed positions
    positionsLeft.forEach(pos => {
        if (pos.type === 'pencil') {
            leftElements.push(createPencil(pos.x, pos.z, 'left'));
        } else if (pos.type === 'eraser') {
            const eraser = new THREE.Mesh(eraserGeometry, eraserMaterial);
            eraser.position.set(pos.x, 0.2 + Math.random() * 0.3, pos.z);
            eraser.rotation.y = Math.random() * Math.PI;
            eraser.rotation.x = Math.random() * 0.4 - 0.2;
            eraser.rotation.z = Math.random() * 0.4 - 0.2;
            eraser.castShadow = true;
            eraser.userData.isRoadMarking = true;
            eraser.userData.isEnvironmentElement = true;
            eraser.userData.initialZ = pos.z;
            eraser.userData.originalSide = 'left';
            leftElements.push(eraser);
        } else if (pos.type === 'spot') {
            const spotGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.25, 8);
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            spot.position.set(pos.x, 0.01 + Math.random() * 0.02, pos.z);
            spot.rotation.x = -Math.PI / 2;
            spot.userData.isRoadMarking = true;
            spot.userData.isEnvironmentElement = true;
            spot.userData.initialZ = pos.z;
            spot.userData.originalSide = 'left';
            leftElements.push(spot);
        }
    });
    
    positionsRight.forEach(pos => {
        if (pos.type === 'pencil') {
            rightElements.push(createPencil(pos.x, pos.z, 'right'));
        } else if (pos.type === 'eraser') {
            const eraser = new THREE.Mesh(eraserGeometry, eraserMaterial);
            eraser.position.set(pos.x, 0.2 + Math.random() * 0.3, pos.z);
            eraser.rotation.y = Math.random() * Math.PI;
            eraser.rotation.x = Math.random() * 0.4 - 0.2;
            eraser.rotation.z = Math.random() * 0.4 - 0.2;
            eraser.castShadow = true;
            eraser.userData.isRoadMarking = true;
            eraser.userData.isEnvironmentElement = true;
            eraser.userData.initialZ = pos.z;
            eraser.userData.originalSide = 'right';
            rightElements.push(eraser);
        } else if (pos.type === 'spot') {
            const spotGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.25, 8);
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            spot.position.set(pos.x, 0.01 + Math.random() * 0.02, pos.z);
            spot.rotation.x = -Math.PI / 2;
            spot.userData.isRoadMarking = true;
            spot.userData.isEnvironmentElement = true;
            spot.userData.initialZ = pos.z;
            spot.userData.originalSide = 'right';
            rightElements.push(spot);
        }
    });
    
    // Batch add all elements at once (better performance)
    leftElements.forEach(element => envGroup.add(element));
    rightElements.forEach(element => envGroup.add(element));
}

function addPaperElements(envGroup) {
    // Add binding holes along the left edge of the "paper"
    const holeGeometry = new THREE.CircleGeometry(0.8, 16);
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }); // Same as background
    
    // Position holes along the left margin with extended range
    for (let z = -250; z <= 250; z += 20) { // Extended z-range
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.set(-20, 0.01, z); // Place along the left edge
        hole.rotation.x = -Math.PI / 2; // Lay flat
        
        // Tag for recycling
        hole.userData.isEnvironmentElement = true; // Changed from isRoadMarking
        hole.userData.initialZ = z;
        
        envGroup.add(hole);
    }
    
    // Add a few "coffee stains" to the paper
    const stainGeometry = new THREE.CircleGeometry(2 + Math.random() * 2, 32);
    const stainMaterial = new THREE.MeshStandardMaterial({
        color: 0xaa7744, // Coffee color
        transparent: true,
        opacity: 0.3,
        roughness: 1.0,
        metalness: 0.0
    });
    
    // Add more coffee stains with extended range
    for (let i = 0; i < 10; i++) { // More stains
        const stain = new THREE.Mesh(stainGeometry, stainMaterial);
        const side = Math.random() > 0.5 ? 1 : -1; // Randomly choose side
        const offsetX = side * (12 + Math.random() * 8); // Position away from the road
        const offsetZ = -300 + i * 60 + Math.random() * 40; // Extended range
        
        stain.position.set(offsetX, 0.02, offsetZ); // Just above the ground
        stain.rotation.x = -Math.PI / 2; // Lay flat
        
        // Tag for recycling
        stain.userData.isEnvironmentElement = true; // Changed from isRoadMarking
        stain.userData.initialZ = offsetZ;
        
        envGroup.add(stain);
    }
    
    // Add "paper tears" along the edges for a more organic look
    const tearMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8f8f8, // Slightly whiter than the ground
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Create tears along the right edge with extended range
    for (let z = -500; z <= 500; z += 20) { // Double the initial range
        // Only add tears sometimes for a natural look
        if (Math.random() > 0.6) {
            // Create a random shape for the tear
            const tearShape = new THREE.Shape();
            const width = 2 + Math.random() * 3;
            const height = 5 + Math.random() * 10;
            
            tearShape.moveTo(0, 0);
            
            // Create jagged edge with random points
            const segments = 5 + Math.floor(Math.random() * 4);
            for (let i = 1; i <= segments; i++) {
                const x = (i / segments) * width;
                const y = (Math.random() * 0.5 + 0.5) * height;
                tearShape.lineTo(x, y);
            }
            
            tearShape.lineTo(width, 0);
            tearShape.lineTo(0, 0);
            
            const tearGeometry = new THREE.ShapeGeometry(tearShape);
            const tear = new THREE.Mesh(tearGeometry, tearMaterial);
            
            tear.position.set(40, 0.03, z); // Right edge of "paper"
            tear.rotation.x = -Math.PI / 2; // Lay flat
            
            // Tag for recycling
            tear.userData.isEnvironmentElement = true; // Changed from isRoadMarking
            tear.userData.initialZ = z;
            
            envGroup.add(tear);
        }
    }
}