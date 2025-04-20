// Environment elements
import * as THREE from 'three';
import { createNotebookTexture, createDottedGridTexture } from '../utils/texture-generator.js';

export function createEnvironment() {
    // Create a group to hold all environment elements
    const envGroup = new THREE.Group();
    
    // Add ground plane segments
    addGroundSegments(envGroup);
    
    // Add decorative elements along the sides
    addDecorativeElements(envGroup);
    
    // Add paper elements (tears, binding holes, etc.)
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
    const recycleDistance = 300; // Distance behind player to recycle elements
    const spawnDistance = 200; // Distance ahead to spawn new elements
    
    envGroup.traverse((child) => {
        if (child.userData.isEnvironmentElement) {
            // Calculate position relative to player
            const zPos = child.userData.initialZ - playerZ;
            
            // Recycle elements that are too far behind
            if (zPos > recycleDistance) {
                // Move to new position ahead
                child.position.z = playerZ - spawnDistance + Math.random() * 100;
                child.userData.initialZ = child.position.z;
                
                // Randomize position for organic look
                child.position.x = 40 + (Math.random() - 0.5) * 10;
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

function addDecorativeElements(envGroup) {
    // Create "pencil" markers along the sides
    const pencilGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const pencilMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00,  // Pencil yellow
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Add "pencil lead" to one end
    const pencilLeadGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
    const pencilLeadMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,  // Dark gray for pencil lead
        roughness: 0.7,
        metalness: 0.3
    });
    
    // Create more pencils on both sides of the road
    for (let z = -500; z <= 500; z += 20) {
        // Left side pencil
        const pencilLeft = new THREE.Group();
        
        const pencilBodyL = new THREE.Mesh(pencilGeometry, pencilMaterial);
        const pencilLeadL = new THREE.Mesh(pencilLeadGeometry, pencilLeadMaterial);
        pencilLeadL.position.y = -0.9;  // Position at the bottom of the pencil
        pencilLeadL.rotation.x = Math.PI;  // Point downward
        
        pencilLeft.add(pencilBodyL);
        pencilLeft.add(pencilLeadL);
        
        // Randomize position and rotation for hand-drawn effect
        const offsetX = -10 - Math.random() * 5;
        const offsetZ = z + (Math.random() * 6 - 3);
        pencilLeft.position.set(offsetX, 0.75, offsetZ);
        pencilLeft.rotation.z = Math.PI / 6 + (Math.random() * 0.2 - 0.1);  // Slight random tilt
        pencilLeft.rotation.x = Math.random() * 0.2 - 0.1;  // Slight random tilt
        pencilLeft.rotation.y = Math.random() * 0.4 - 0.2;  // Slight random rotation
        
        pencilLeft.userData.isEnvironmentElement = true;
        pencilLeft.userData.initialZ = offsetZ;

        pencilLeft.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.userData.isRoadMarking = true;  // Make it move with road
            }
        });
        
        envGroup.add(pencilLeft);
        
        // Right side pencil (only add some, not symmetric)
        if (Math.random() > 0.3) {  // 70% chance of placing a pencil
            const pencilRight = new THREE.Group();
            
            const pencilBodyR = new THREE.Mesh(pencilGeometry, pencilMaterial);
            const pencilLeadR = new THREE.Mesh(pencilLeadGeometry, pencilLeadMaterial);
            pencilLeadR.position.y = -0.9;  // Position at the bottom of the pencil
            pencilLeadR.rotation.x = Math.PI;  // Point downward
            
            pencilRight.add(pencilBodyR);
            pencilRight.add(pencilLeadR);
            
            // Randomize position and rotation for hand-drawn effect
            const offsetX = 10 + Math.random() * 5;
            const offsetZ = z - 7 + (Math.random() * 6 - 3);  // Offset from left side for variety
            pencilRight.position.set(offsetX, 0.75, offsetZ);
            pencilRight.rotation.z = -Math.PI / 6 + (Math.random() * 0.2 - 0.1);  // Mirror the tilt
            pencilRight.rotation.x = Math.random() * 0.2 - 0.1;  // Slight random tilt
            pencilRight.rotation.y = Math.random() * 0.4 - 0.2;  // Slight random rotation
            
            pencilRight.userData.isEnvironmentElement = true;
            pencilRight.userData.initialZ = offsetZ;

            pencilRight.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.userData.isRoadMarking = true;  // Make it move with road
                }
            });
            
            envGroup.add(pencilRight);
        }
    }
    
    // Add eraser chunks along the sides
    const eraserGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
    const eraserMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6666,  // Pink eraser
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Place erasers at more random intervals
    for (let z = -80; z <= 80; z += 12) {
        if (Math.random() > 0.3) {  // 70% chance of placing an eraser
            const offsetX = -8 - Math.random() * 3;  // Random position along left side
            const offsetZ = z + (Math.random() * 8 - 4);  // Randomize the z position
            
            const eraser = new THREE.Mesh(eraserGeometry, eraserMaterial);
            eraser.position.set(offsetX, 0.2, offsetZ);
            eraser.rotation.y = Math.random() * Math.PI;  // Random rotation
            eraser.rotation.x = Math.random() * 0.1;  // Slight tilt
            eraser.rotation.z = Math.random() * 0.1;  // Slight tilt
            eraser.castShadow = true;
            eraser.userData.isRoadMarking = true;  // Make it move with road
            eraser.userData.isEnvironmentElement = true;
            eraser.userData.initialZ = offsetZ;
            envGroup.add(eraser);
        }
        
        if (Math.random() > 0.4) {  // 60% chance of placing an eraser on right side
            const offsetX = 8 + Math.random() * 3;  // Random position along right side
            const offsetZ = z + (Math.random() * 8 - 4);  // Different z than left side
            
            const eraser = new THREE.Mesh(eraserGeometry, eraserMaterial);
            eraser.position.set(offsetX, 0.2, offsetZ);
            eraser.rotation.y = Math.random() * Math.PI;  // Random rotation
            eraser.rotation.x = Math.random() * 0.1;  // Slight tilt
            eraser.rotation.z = Math.random() * 0.1;  // Slight tilt
            eraser.castShadow = true;
            eraser.userData.isRoadMarking = true;  // Make it move with road
            eraser.userData.isEnvironmentElement = true;
            eraser.userData.initialZ = offsetZ;
            envGroup.add(eraser);
        }
    }
    
    // Add some paper clips
    const paperClipCurve = new THREE.CurvePath();
    
    // Create a simple paper clip shape
    const curve1 = new THREE.EllipseCurve(0, 0, 0.5, 1, 0, Math.PI, false);
    const curve2 = new THREE.LineCurve3(
        new THREE.Vector3(0.5, 0, 0),
        new THREE.Vector3(0.5, -2, 0)
    );
    const curve3 = new THREE.EllipseCurve(0, -2, 0.5, 1, 0, Math.PI, true);
    const curve4 = new THREE.LineCurve3(
        new THREE.Vector3(-0.5, -2, 0),
        new THREE.Vector3(-0.5, 0, 0)
    );
    
    paperClipCurve.add(curve1);
    
    const paperClipGeometry = new THREE.TubeGeometry(curve1, 20, 0.08, 8, false);
    const paperClipMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,  // Silver color
        roughness: 0.3,
        metalness: 0.8
    });
    
    // Place a few paper clips near the road
    for (let i = 0; i < 5; i++) {
        const paperClip = new THREE.Mesh(paperClipGeometry, paperClipMaterial);
        const side = Math.random() > 0.5 ? 1 : -1;  // Randomly choose left or right side
        const offsetX = side * (6 + Math.random() * 4);  // Position along the side
        const offsetZ = -70 + i * 30 + Math.random() * 10;  // Space them out along the road
        
        paperClip.position.set(offsetX, 0.05, offsetZ);
        paperClip.rotation.x = -Math.PI / 2;  // Lay flat
        paperClip.rotation.z = Math.random() * Math.PI;  // Random rotation
        paperClip.castShadow = true;
        paperClip.userData.isRoadMarking = true;  // Make it move with road
        paperClip.userData.isEnvironmentElement = true;
        paperClip.userData.initialZ = offsetZ;
        envGroup.add(paperClip);
    }
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