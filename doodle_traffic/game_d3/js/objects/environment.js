import * as THREE from 'three';
import { createNotebookTexture, createDottedGridTexture } from '../utils/texture-generator.js';

// Debug flags
const DEBUG = {
    logGridCreation: true,
    logRecycling: true,
    showGridBoundaries: false  // Set to true to visualize grid sections
};

// Store references to all elements for proper management
const environmentElements = [];

// Element types and their properties
const ELEMENT_TYPES = {
    pencil: { 
        probability: 0.33,
        heightRange: [0.2, 1.0],
        sideDistanceRange: [12, 45]  // Distance from center of road
    },
    eraser: { 
        probability: 0.33,
        heightRange: [0.2, 0.5],
        sideDistanceRange: [10, 40]
    },
    spot: { 
        probability: 0.34,
        heightRange: [0.01, 0.03],
        sideDistanceRange: [8, 35]
    }
};

// Define the region parameters
const REGION_CONFIG = {
    left: {
        xMin: -50,
        xMax: -8
    },
    right: {
        xMin: 8,
        xMax: 50
    },
    // How far ahead/behind to generate elements
    zRange: {
        start: -1000,  // How far ahead (negative values are ahead)
        end: 200       // How far behind
    },
    // How many elements to generate in each region
    density: {
        pencil: 40,    // Number of pencils per region
        eraser: 40,    // Number of erasers per region
        spot: 60       // Number of spots per region
    }
};

// Reusable geometries and materials (defined once for performance)
let pencilGeometry, pencilLeadGeometry, eraserGeometry;
let pencilMaterial, pencilLeadMaterial, eraserMaterial, spotMaterial;

export function createEnvironment() {
    console.log("Creating environment");
    const envGroup = new THREE.Group();
    
    // Create ground segments
    addGroundSegments(envGroup);
    
    // Initialize geometries and materials
    initGeometriesAndMaterials();
    
    // Add elements using a simpler, more direct approach
    populateEnvironment(envGroup);
    
    // Add notebook paper elements
    addPaperElements(envGroup);
    
    // Add debug visuals if enabled
    if (DEBUG.showGridBoundaries) {
        addDebugVisuals(envGroup);
    }
    
    return envGroup;
}

function addGroundSegments(envGroup) {
    // Create multiple ground segments that can be reused
    const segmentLength = 250;
    const segmentWidth = 200;  
    const segmentsCount = 12;  
    
    // Get notebook paper texture for the ground
    const groundTexture = createDottedGridTexture();
    groundTexture.repeat.set(10, 25);
    
    // Create segments with individual materials
    for (let i = 0; i < segmentsCount; i++) {
        const groundGeometry = new THREE.PlaneGeometry(segmentWidth, segmentLength);
        
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf5f5f5,
            roughness: 1.0,
            metalness: 0.0,
            map: groundTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Position segments in a chain with slight overlap
        ground.rotation.x = -Math.PI / 2;  // Rotate to lay flat
        ground.position.y = -0.1 - (i * 0.001);  // Slight y-offset to prevent z-fighting
        
        // Positioning with overlap
        const overlap = 5;
        ground.position.z = -(i * (segmentLength - overlap)) + (segmentLength/2);
        
        // Mark for recycling and scrolling
        ground.userData.isGroundSegment = true;
        ground.userData.isEnvironmentElement = true; 
        ground.userData.segmentIndex = i;
        ground.userData.initialZ = ground.position.z;
        
        ground.receiveShadow = true;
        envGroup.add(ground);
    }
}

// Initialize shared geometries and materials
function initGeometriesAndMaterials() {
    // Geometries
    pencilGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    pencilLeadGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
    eraserGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
    
    // Materials
    pencilMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00,  // Pencil yellow
        roughness: 0.8,
        metalness: 0.2
    });
    
    pencilLeadMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,  // Dark gray for pencil lead
        roughness: 0.7,
        metalness: 0.3
    });
    
    eraserMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6666,  // Pink eraser
        roughness: 0.9,
        metalness: 0.1
    });
    
    spotMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,  // Dark spot
        roughness: 0.9,
        metalness: 0.1
    });
}

// SIMPLIFIED APPROACH: Directly populate environment with elements
function populateEnvironment(envGroup) {
    console.log("Populating environment with elements");
    
    // Clear any existing tracked elements
    environmentElements.length = 0;
    
    // Create elements for both left and right sides
    ['left', 'right'].forEach(side => {
        // Create each type of element
        Object.keys(REGION_CONFIG.density).forEach(elementType => {
            const count = REGION_CONFIG.density[elementType];
            console.log(`Creating ${count} ${elementType}s on ${side} side`);
            
            for (let i = 0; i < count; i++) {
                // Create element with random position within the region
                const element = createElementWithRandomPosition(elementType, side);
                
                if (element) {
                    envGroup.add(element);
                    environmentElements.push({
                        element: element,
                        type: elementType,
                        side: side
                    });
                }
            }
        });
    });
    
    console.log(`Created ${environmentElements.length} total environment elements`);
}

// Create an element with random position within its region
function createElementWithRandomPosition(type, side) {
    const region = REGION_CONFIG[side];
    const typeConfig = ELEMENT_TYPES[type];
    
    // Random X position within the side's range
    const xPos = getRandomInRange(region.xMin, region.xMax);
    
    // Random Z position within the region's range
    const zPos = getRandomInRange(REGION_CONFIG.zRange.start, REGION_CONFIG.zRange.end);
    
    // Random Y position (height) based on element type
    const yPos = getRandomInRange(typeConfig.heightRange[0], typeConfig.heightRange[1]);
    
    // Create the element and set its position
    const element = createElementMesh(type, xPos, yPos, zPos, side);
    
    return element;
}

// Utility function for random number in range
function getRandomInRange(min, max) {
    return min + Math.random() * (max - min);
}

// Create an element mesh based on type
function createElementMesh(type, x, y, z, side) {
    let element;
    
    switch (type) {
        case 'pencil':
            element = new THREE.Group();
            const pencilBody = new THREE.Mesh(pencilGeometry, pencilMaterial);
            const pencilLead = new THREE.Mesh(pencilLeadGeometry, pencilLeadMaterial);
            
            pencilLead.position.y = -0.9;  // Position at the bottom of the pencil
            pencilLead.rotation.x = Math.PI;  // Point downward
            
            element.add(pencilBody);
            element.add(pencilLead);
            
            // Position and rotate
            element.position.set(x, y, z);
            
            // Random rotation with side-appropriate tilt
            const sideMultiplier = side === 'left' ? -1 : 1;
            element.rotation.z = sideMultiplier * (Math.PI / 6 + Math.random() * 0.5 - 0.25);
            element.rotation.x = Math.random() * 0.8 - 0.4;
            element.rotation.y = Math.random() * Math.PI * 2; // Full rotation range
            
            // Add shadow casting
            element.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                }
            });
            break;
            
        case 'eraser':
            element = new THREE.Mesh(eraserGeometry, eraserMaterial);
            
            element.position.set(x, y, z);
            element.rotation.y = Math.random() * Math.PI * 2; // Full rotation range
            element.rotation.x = Math.random() * 0.6 - 0.3;
            element.rotation.z = Math.random() * 0.6 - 0.3;
            element.castShadow = true;
            break;
            
        case 'spot':
            // Varied spot sizes
            const size = 0.1 + Math.random() * 0.25;
            const spotGeometry = new THREE.CircleGeometry(size, 8);
            element = new THREE.Mesh(spotGeometry, spotMaterial);
            
            element.position.set(x, y, z);
            element.rotation.x = -Math.PI / 2; // Flat on the ground
            break;
            
        default:
            console.warn(`Unknown element type: ${type}`);
            return null;
    }
    
    // Common userData properties - CRITICAL FOR SCROLLING AND RECYCLING
    element.userData = {
        isEnvironmentElement: true,
        elementType: type,
        elementSide: side,
        initialZ: z,  // This is key for scrolling system
        initialPosition: { x, y, z }  // Store for recycling reference
    };
    
    return element;
}

// Visualize grid boundaries for debugging
function addDebugVisuals(envGroup) {
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    
    // Create grid boundary markers for both sides
    ['left', 'right'].forEach(side => {
        const region = REGION_CONFIG[side];
        
        // Create bounding box
        const points = [
            new THREE.Vector3(region.xMin, 0, REGION_CONFIG.zRange.start),
            new THREE.Vector3(region.xMin, 0, REGION_CONFIG.zRange.end),
            new THREE.Vector3(region.xMax, 0, REGION_CONFIG.zRange.end),
            new THREE.Vector3(region.xMax, 0, REGION_CONFIG.zRange.start),
            new THREE.Vector3(region.xMin, 0, REGION_CONFIG.zRange.start)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        envGroup.add(line);
    });
}

export function updateGroundSegments(envGroup, playerZ) {
    if (!envGroup) return;
    
    const segmentLength = 250;
    const visibleRangeBehind = 750; // How far behind player to keep segments
    const visibleRangeAhead = 1500; // How far ahead of player to generate segments
    const lookAheadThreshold = 1000; // Start recycling when within this distance of the farthest segment
    
    // Gather information about all ground segments
    const segments = [];
    envGroup.traverse((child) => {
        if (child.userData?.isGroundSegment) {
            segments.push(child);
        }
    });
    
    if (segments.length === 0) return;
    
    // Sort segments by Z position
    segments.sort((a, b) => a.position.z - b.position.z);
    
    // Find farthest segment ahead and behind
    let furthestAheadZ = Infinity;
    let furthestBehindZ = -Infinity;
    
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
    
    // FIRST PASS: Recycle segments that are too far behind
    let recycledSegments = [];
    
    segments.forEach(segment => {
        const segmentStartZ = segment.position.z + (segmentLength/2); // Back edge
        
        // If this segment is entirely behind our desired range
        if (segmentStartZ > desiredBehindZ) {
            recycledSegments.push(segment);
        }
    });
    
    // SECOND PASS: Check if we need more segments ahead
    const lookAheadZ = desiredAheadZ - lookAheadThreshold;
    
    // If farthest segment is not far enough ahead
    if (furthestAheadZ > lookAheadZ) {
        // Calculate how many segments we need to add
        const distanceNeeded = Math.abs(furthestAheadZ - desiredAheadZ);
        const segmentsNeeded = Math.ceil(distanceNeeded / segmentLength);
        
        // Use recycled segments if available
        if (recycledSegments.length > 0) {
            for (let i = 0; i < Math.min(segmentsNeeded, recycledSegments.length); i++) {
                const segment = recycledSegments[i];
                
                // Position at the front, continuing from furthest segment
                const newZ = furthestAheadZ - (i * segmentLength);
                
                // Update position
                segment.position.z = newZ;
                segment.userData.initialZ = newZ;
                
                // Optional fade-in effect for recycled segments
                segment.material.opacity = 0.1;
                segment.userData.fadeStartTime = Date.now();
                segment.userData.isFading = true;
            }
        } else {
            console.warn(`No segments available to recycle! Need ${segmentsNeeded} more segments ahead.`);
        }
    }
    
    // Handle fading in of recycled segments
    segments.forEach(segment => {
        if (segment.userData.isFading) {
            const fadeTime = 300; // 300ms fade-in
            const elapsed = Date.now() - segment.userData.fadeStartTime;
            const opacity = Math.min(1.0, elapsed / fadeTime);
            
            segment.material.opacity = opacity;
            
            if (opacity >= 1.0) {
                segment.userData.isFading = false;
                segment.material.opacity = 1.0;
            }
        }
    });
}

export function updateEnvironmentElements(envGroup, playerZ) {
    if (!envGroup || environmentElements.length === 0) return;
    
    // Define recycling parameters
    const recycleDistanceBehind = 300;  // Recycle when this far behind the player
    const spawnDistanceAhead = -1000;   // Place recycled elements this far ahead
    
    // Loop through all tracked elements
    environmentElements.forEach(item => {
        const element = item.element;
        
        // Skip if element doesn't exist anymore
        if (!element) return;
        
        // Calculate position relative to player
        const relativeZ = element.position.z - playerZ;
        
        // If element is too far behind player, recycle it
        if (relativeZ > recycleDistanceBehind) {
            // Calculate new position
            const newZ = playerZ + spawnDistanceAhead - Math.random() * 300; // Add randomness to z
            
            // Get original region constraints for this element's side
            const side = item.side;
            const region = REGION_CONFIG[side];
            
            // New random X position within appropriate side range
            const newX = getRandomInRange(region.xMin, region.xMax);
            
            // Get appropriate Y position based on element type
            const typeConfig = ELEMENT_TYPES[item.type];
            const newY = getRandomInRange(typeConfig.heightRange[0], typeConfig.heightRange[1]);
            
            // Update position
            element.position.set(newX, newY, newZ);
            
            // Update initialZ for scrolling system
            element.userData.initialZ = newZ;
            element.userData.initialPosition = { x: newX, y: newY, z: newZ };
            
            // Randomize rotation for more variety
            if (item.type === 'pencil') {
                const sideMultiplier = side === 'left' ? -1 : 1;
                element.rotation.z = sideMultiplier * (Math.PI / 6 + Math.random() * 0.5 - 0.25);
                element.rotation.x = Math.random() * 0.8 - 0.4;
                element.rotation.y = Math.random() * Math.PI * 2;
            } else if (item.type === 'eraser') {
                element.rotation.y = Math.random() * Math.PI * 2;
                element.rotation.x = Math.random() * 0.6 - 0.3;
                element.rotation.z = Math.random() * 0.6 - 0.3;
            }
            
            if (DEBUG.logRecycling && Math.random() < 0.01) {
                console.log(`Recycled ${item.type} on ${side} side to Z:${newZ.toFixed(2)}`);
            }
        }
    });
}

function addPaperElements(envGroup) {
    // Add binding holes along the left edge of the "paper"
    const holeGeometry = new THREE.CircleGeometry(0.8, 16);
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }); // Same as background
    
    // Position holes along the left margin with extended range
    for (let z = -800; z <= 400; z += 20) { // Extended z-range
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.set(-40, 0.01, z); // Place along the left edge
        hole.rotation.x = -Math.PI / 2; // Lay flat
        
        // Tag for scrolling
        hole.userData.isEnvironmentElement = true;
        hole.userData.initialZ = z;
        hole.userData.elementType = 'hole';
        
        envGroup.add(hole);
    }
    
    // Add "coffee stains" to the paper
    const stainMaterial = new THREE.MeshStandardMaterial({
        color: 0xaa7744, // Coffee color
        transparent: true,
        opacity: 0.3,
        roughness: 1.0,
        metalness: 0.0
    });
    
    // Add coffee stains with good distribution
    for (let i = 0; i < 15; i++) {
        const stainSize = 2 + Math.random() * 3;
        const stainGeometry = new THREE.CircleGeometry(stainSize, 24);
        const stain = new THREE.Mesh(stainGeometry, stainMaterial);
        
        // Alternate between left and right sides for balanced distribution
        const side = i % 2 === 0 ? -1 : 1;
        const offsetX = side * (15 + Math.random() * 30); // Wider range
        const offsetZ = -800 + Math.random() * 1200; // Full z-range
        
        stain.position.set(offsetX, 0.02, offsetZ);
        stain.rotation.x = -Math.PI / 2; // Lay flat
        
        // Tag for scrolling
        stain.userData.isEnvironmentElement = true;
        stain.userData.initialZ = offsetZ;
        stain.userData.elementType = 'stain';
        
        envGroup.add(stain);
    }
    
    // Add "paper tears" along the edges for a more organic look
    const tearMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8f8f8, // Slightly whiter than the ground
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Create tears along both edges with good distribution
    for (let i = 0; i < 40; i++) {
        // Only add tears sometimes for a natural look
        if (Math.random() > 0.5) {
            // Create a random shape for the tear
            const tearShape = new THREE.Shape();
            const width = 2 + Math.random() * 3;
            const height = 5 + Math.random() * 10;
            
            tearShape.moveTo(0, 0);
            
            // Create jagged edge with random points
            const segments = 5 + Math.floor(Math.random() * 4);
            for (let j = 1; j <= segments; j++) {
                const x = (j / segments) * width;
                const y = (Math.random() * 0.5 + 0.5) * height;
                tearShape.lineTo(x, y);
            }
            
            tearShape.lineTo(width, 0);
            tearShape.lineTo(0, 0);
            
            const tearGeometry = new THREE.ShapeGeometry(tearShape);
            const tear = new THREE.Mesh(tearGeometry, tearMaterial);
            
            // Alternate between left and right edges
            const side = i % 2 === 0 ? -1 : 1;
            const edgePos = side * 45; // Edge of paper
            const z = -800 + Math.random() * 1200; // Full z-range
            
            tear.position.set(edgePos, 0.03, z);
            tear.rotation.x = -Math.PI / 2; // Lay flat
            if (side > 0) {
                tear.rotation.z = Math.PI; // Flip for right side
            }
            
            // Tag for scrolling
            tear.userData.isEnvironmentElement = true;
            tear.userData.initialZ = z;
            tear.userData.elementType = 'tear';
            
            envGroup.add(tear);
        }
    }
}