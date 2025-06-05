import * as THREE from 'three';
// createNotebookTexture is already imported, which is great!
import { createHandDrawnPaperTexture } from '../utils/texture-generator.js';

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
        sideDistanceRange: [0, 15]  // Distance from center of road
    },
    eraser: { 
        probability: 0.33,
        heightRange: [0.2, 0.5],
        sideDistanceRange: [0, 15]
    },
    spot: { 
        probability: 0.34,
        heightRange: [0.1, 0.5],
        sideDistanceRange: [0, 15]
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
        pencil: 80,    // Number of pencils per region
        eraser: 80,    // Number of erasers per region
        spot: 100       // Number of spots per region
    }
};

// NEW: Define segmentWidth at module level
const SEGMENT_WIDTH = 200; // Width of each ground segment

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
    
    // Add notebook paper elements (like holes, stains - these will be on top of the new notebook ground)
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
    const segmentsCount = 12;  
    
    console.log("[environment] addGroundSegments: Calling createNotebookTexture().");
    const groundTexture = createHandDrawnPaperTexture(); 
    console.log("[environment] addGroundSegments: Received from createNotebookTexture():", groundTexture);

    let groundMaterial;

    if (!groundTexture || !groundTexture.isTexture) {
        console.error("[environment] addGroundSegments: Failed to create or receive a valid texture! Using fallback material.");
        // Fallback to a simple color if texture creation failed, to make the plane visible
        groundMaterial = new THREE.MeshStandardMaterial({ 
            color: '#ffffff', // Bright Magenta as a fallback indicator
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
    } else {
        console.log("[environment] addGroundSegments: Texture seems valid. Setting up material with this texture.");
        // Adjust texture repeat for notebook lines
        // This will make the texture repeat based on its size and the segment dimensions.
        // If the debug texture is 256x256, and we want it to cover 50x50 world units:
        groundTexture.repeat.set(SEGMENT_WIDTH / 50, segmentLength / 50); 
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.needsUpdate = true; // Ensure the texture updates if changed after creation

        groundMaterial = new THREE.MeshStandardMaterial({ 
            color: '#ffffff', 
            roughness: 1,
            metalness: 0,
            map: groundTexture,
            transparent: false, // Set to false as the texture (even debug one) is opaque
            side: THREE.DoubleSide
        });
        console.log("[environment] addGroundSegments: Ground material created with texture:", groundMaterial);
    }
    
    // Create segments with the determined material
    for (let i = 0; i < segmentsCount; i++) {
        const groundGeometry = new THREE.PlaneGeometry(SEGMENT_WIDTH, segmentLength);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial); // Use the common material
        
        // Position segments in a chain with slight overlap
        ground.rotation.x = -Math.PI / 2;  // Rotate to lay flat
        ground.position.y = -0.1 - (i * 0.001);  // Slight y-offset to prevent z-fighting
        
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
    console.log(`[environment] addGroundSegments: Added ${segmentsCount} ground segments.`);
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
    // console.log("Populating environment with elements"); // Reduced verbosity
    
    environmentElements.length = 0;
    
    ['left', 'right'].forEach(side => {
        Object.keys(REGION_CONFIG.density).forEach(elementType => {
            const count = REGION_CONFIG.density[elementType];
            for (let i = 0; i < count; i++) {
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
    // console.log(`Created ${environmentElements.length} total environment elements`); // Reduced verbosity
}

function createElementWithRandomPosition(type, side) {
    const region = REGION_CONFIG[side];
    const typeConfig = ELEMENT_TYPES[type];
    const xPos = getRandomInRange(region.xMin, region.xMax);
    const zPos = getRandomInRange(REGION_CONFIG.zRange.start, REGION_CONFIG.zRange.end);
    const yPos = getRandomInRange(typeConfig.heightRange[0], typeConfig.heightRange[1]);
    return createElementMesh(type, xPos, yPos, zPos, side);
}

function getRandomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function createElementMesh(type, x, y, z, side) {
    let element;
    
    switch (type) {
        case 'pencil':
            element = new THREE.Group();
            const pencilBody = new THREE.Mesh(pencilGeometry, pencilMaterial);
            const pencilLead = new THREE.Mesh(pencilLeadGeometry, pencilLeadMaterial);
            pencilLead.position.y = -0.9;
            pencilLead.rotation.x = Math.PI;
            element.add(pencilBody);
            element.add(pencilLead);
            element.position.set(x, y, z);
            const sideMultiplier = side === 'left' ? -1 : 1;
            element.rotation.z = sideMultiplier * (Math.PI / 6 + Math.random() * 0.5 - 0.25);
            element.rotation.x = Math.random() * 0.8 - 0.4;
            element.rotation.y = Math.random() * Math.PI * 2;
            element.traverse(child => { if (child.isMesh) child.castShadow = true; });
            break;
        case 'eraser':
            element = new THREE.Mesh(eraserGeometry, eraserMaterial);
            element.position.set(x, y, z);
            element.rotation.y = Math.random() * Math.PI * 2;
            element.rotation.x = Math.random() * 0.6 - 0.3;
            element.rotation.z = Math.random() * 0.6 - 0.3;
            element.castShadow = true;
            break;
        case 'spot':
            const spotSize = 0.1 + Math.random() * 0.25;
            const spotGeometry = new THREE.CircleGeometry(spotSize, 8);
            element = new THREE.Mesh(spotGeometry, spotMaterial);
            element.position.set(x, y, z);
            element.rotation.x = -Math.PI / 2;
            break;
        default:
            console.warn(`Unknown element type: ${type}`);
            return null;
    }
    
    element.userData = {
        isEnvironmentElement: true,
        elementType: type,
        elementSide: side,
        initialZ: z,
        initialPosition: { x, y, z }
    };
    return element;
}

function addDebugVisuals(envGroup) {
    const material = new THREE.LineBasicMaterial({ color: '#000000' });
    ['left', 'right'].forEach(side => {
        const region = REGION_CONFIG[side];
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
    const visibleRangeBehind = segmentLength * 3;
    const visibleRangeAhead = segmentLength * 6;
    const lookAheadThreshold = segmentLength * 4;
    const segments = [];
    envGroup.traverse((child) => { if (child.userData?.isGroundSegment) segments.push(child); });
    if (segments.length === 0) return;
    segments.sort((a, b) => a.position.z - b.position.z);
    let furthestAheadZ = Infinity;
    let furthestBehindZ = -Infinity;
    segments.forEach(segment => {
        const segmentEndZ = segment.position.z - (segmentLength/2);
        const segmentStartZ = segment.position.z + (segmentLength/2);
        if (segmentEndZ < furthestAheadZ) furthestAheadZ = segmentEndZ;
        if (segmentStartZ > furthestBehindZ) furthestBehindZ = segmentStartZ;
    });
    const desiredAheadZ = playerZ - visibleRangeAhead;
    const desiredBehindZ = playerZ + visibleRangeBehind;
    let recycledSegments = [];
    segments.forEach(segment => {
        const segmentStartZ = segment.position.z + (segmentLength/2);
        if (segmentStartZ > desiredBehindZ) recycledSegments.push(segment);
    });
    const lookAheadZ = desiredAheadZ - lookAheadThreshold;
    if (furthestAheadZ > lookAheadZ) {
        const distanceNeeded = Math.abs(furthestAheadZ - desiredAheadZ);
        const segmentsNeeded = Math.ceil(distanceNeeded / segmentLength);
        if (recycledSegments.length > 0) {
            for (let i = 0; i < Math.min(segmentsNeeded, recycledSegments.length); i++) {
                const segment = recycledSegments[i];
                // Position at the front, ensuring segments are contiguous
                furthestAheadZ -= segmentLength; // Decrement first to place next segment correctly
                const newZ = furthestAheadZ + (segmentLength / 2); // Center of the new segment

                segment.position.z = newZ;
                segment.userData.initialZ = newZ;
                if (segment.material) { // Check if material exists
                    segment.material.opacity = 0.1; // Ensure material is transparent for fade
                    segment.material.transparent = true;
                }
                segment.userData.fadeStartTime = Date.now();
                segment.userData.isFading = true;
            }
        } else {
            // console.warn(`No segments available to recycle! Need ${segmentsNeeded} more segments ahead.`); // Reduced verbosity
        }
    }
    segments.forEach(segment => {
        if (segment.userData.isFading && segment.material) { // Check if material exists
            const fadeTime = 300;
            const elapsed = Date.now() - segment.userData.fadeStartTime;
            const opacity = Math.min(1.0, elapsed / fadeTime);
            segment.material.opacity = opacity;
            if (opacity >= 1.0) {
                segment.userData.isFading = false;
                segment.material.opacity = 1.0;
                // segment.material.transparent = false; // Can set back to false if fully opaque
            }
        }
    });
}

export function updateEnvironmentElements(envGroup, playerZ) {
    if (!envGroup || environmentElements.length === 0) return;
    const recycleDistanceBehind = 300;
    const spawnDistanceAhead = -1000;
    environmentElements.forEach(item => {
        const element = item.element;
        if (!element) return;
        const relativeZ = element.position.z - playerZ;
        if (relativeZ > recycleDistanceBehind) {
            const newZ = playerZ + spawnDistanceAhead - Math.random() * 300;
            const side = item.side;
            const region = REGION_CONFIG[side];
            const newX = getRandomInRange(region.xMin, region.xMax);
            const typeConfig = ELEMENT_TYPES[item.type];
            const newY = getRandomInRange(typeConfig.heightRange[0], typeConfig.heightRange[1]);
            element.position.set(newX, newY, newZ);
            element.userData.initialZ = newZ;
            element.userData.initialPosition = { x: newX, y: newY, z: newZ };
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
            // if (DEBUG.logRecycling && Math.random() < 0.01) { // Reduced verbosity
            //     console.log(`Recycled ${item.type} on ${side} side to Z:${newZ.toFixed(2)}`);
            // }
        }
    });
}

function addPaperElements(envGroup) {
    const holeMinXOffset = 8;   // Holes will be at least this far from the center (e.g., just off the edge of the road)
    const holeXSpread = 25;     // Holes can spread out this much *further*
    const holeMinZ = -800;
    const holeZRange = 1200;    // This means Z will be from -800 to ( -800 + 1200 ) = 400
    const yPos = 0.01;
    const rotationX = -Math.PI / 2;


    const holeGeometry = new THREE.CircleGeometry(3, 16); // Or your debug size e.g., 5
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // black
    for (let i = 0; i < 75; i++) {
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        const side = Math.random() < 0.5 ? -1 : 1;
        const xPos = side * (holeMinXOffset + Math.random() * holeXSpread);
        const zPos = holeMinZ + Math.random() * holeZRange;

        hole.position.set(xPos, yPos, zPos); // y = 0.01 to be just above ground
        hole.rotation.x = rotationX;    // Lay flat
        hole.userData = { isEnvironmentElement: true, initialZ: zPos, elementType: 'hole' };
        envGroup.add(hole);
    }
        
    const stainMaterial = new THREE.MeshStandardMaterial({
        color: 0x000080, transparent: true, opacity: 1,  // blue
        roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide
    });
    for (let i = 0; i < 15; i++) {
        const stainSize = 2 + Math.random() * 3;
        const stainGeometry = new THREE.CircleGeometry(stainSize, 24);
        const stain = new THREE.Mesh(stainGeometry, stainMaterial);
        const side = Math.random() < 0.5 ? -1 : 1;
        const offsetX = side * (holeMinXOffset + Math.random() * holeXSpread);
        const offsetZ = holeMinZ + Math.random() * holeZRange;
        stain.position.set(offsetX, yPos, offsetZ);
        stain.rotation.x = rotationX;
        stain.userData = { isEnvironmentElement: true, initialZ: offsetZ, elementType: 'stain' };
        envGroup.add(stain);
    }
    
    const tearMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF69B4, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide  // pink
    });
    for (let i = 0; i < 40; i++) {
        if (Math.random() > 0.8) {
            const tearShape = new THREE.Shape();
            const width = 2 + Math.random() * 3;
            const height = 5 + Math.random() * 10;
            tearShape.moveTo(0, 0);
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
            const side = i % 2 === 0 ? -1 : 1;
            const edgePos = side * (SEGMENT_WIDTH/2 - 2);
            const zPos = -800 + Math.random() * 1200; // Renamed z to zPos to avoid conflict
            tear.position.set(edgePos, 0.03, zPos);
            tear.rotation.x = -Math.PI / 2;
            if (side > 0) tear.rotation.z = Math.PI;
            tear.userData = { isEnvironmentElement: true, initialZ: zPos, elementType: 'tear' };
            envGroup.add(tear);
        }
    }
}

