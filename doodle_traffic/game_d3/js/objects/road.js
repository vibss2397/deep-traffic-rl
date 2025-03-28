// Road creation and management
import * as THREE from 'three';
import { createNotebookTexture, createSketchyTexture } from '../utils/texture-generator.js';
import { RoadSegmentManager, SegmentType } from '../road-segment-system.js';

let roadSegmentManager = null;

export function createRoad(scene) {
    // Create a group to hold all road components
    const roadGroup = new THREE.Group();
    
    // Initialize the road segment manager
    roadSegmentManager = new RoadSegmentManager(scene);
    roadSegmentManager.init();
    
    // Get the road segments and add them to the road group
    const segments = roadSegmentManager.activeSegments;
    segments.forEach(segment => {
        roadGroup.add(segment);
    });
    
    // Store a reference to the segment manager in the road group
    roadGroup.userData.roadSegmentManager = roadSegmentManager;
    
    return roadGroup;
}

// Update the road based on player position
export function updateRoad(playerZ) {
    if (roadSegmentManager) {
        roadSegmentManager.update(playerZ);
    }
}

// Get scrollable textures for the road
export function getRoadScrollableTextures() {
    if (roadSegmentManager) {
        return roadSegmentManager.getScrollableTextures();
    }
    return [];
}

// Legacy function for the original road implementation - kept for reference
function createStaticRoad() {
    // Create a group to hold all road components
    const roadGroup = new THREE.Group();
    
    // Get notebook paper texture
    const notebookTexture = createNotebookTexture();
    
    // Make texture repeat more for smoother scrolling
    notebookTexture.repeat.set(1, 10);
    
    // Create the main road surface - make it longer to see further ahead
    const roadGeometry = new THREE.PlaneGeometry(5, 200, 10, 20);
    const roadMaterial = new THREE.MeshStandardMaterial({
        map: notebookTexture,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const roadSurface = new THREE.Mesh(roadGeometry, roadMaterial);
    roadSurface.rotation.x = -Math.PI / 2; // Lay flat on the xz plane
    roadSurface.position.y = 0;
    roadSurface.receiveShadow = true;
    
    roadGroup.add(roadSurface);
    
    // Add road markings (lane dividers)
    addRoadMarkings(roadGroup);
    
    // Add visual movement cues (more frequent markers)
    addMovementCues(roadGroup);
    
    return roadGroup;
}

function addRoadMarkings(roadGroup) {
    // Lane divider parameters
    const width = 0.1;
    const length = 100;
    
    // Material for the lane dividers
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Create left edge
    const leftEdgeGeometry = new THREE.PlaneGeometry(width, length);
    const leftEdge = new THREE.Mesh(leftEdgeGeometry, lineMaterial);
    leftEdge.position.set(-2.5, 0.01, 0);
    leftEdge.rotation.x = -Math.PI / 2;
    // Mark this as a road marking for scrolling
    leftEdge.userData.isRoadMarking = true;
    roadGroup.add(leftEdge);
    
    // Create right edge
    const rightEdgeGeometry = new THREE.PlaneGeometry(width, length);
    const rightEdge = new THREE.Mesh(rightEdgeGeometry, lineMaterial);
    rightEdge.position.set(2.5, 0.01, 0);
    rightEdge.rotation.x = -Math.PI / 2;
    // Mark this as a road marking for scrolling
    rightEdge.userData.isRoadMarking = true;
    roadGroup.add(rightEdge);
    
    // Create center lines (dashed) with more even spacing for scrolling
    // INCREASE FREQUENCY - more dashes = more perception of movement
    const centerLineSpacing = 2; // Reduced from 3 for more frequent markers
    const centerLineDash = 1;    // Length of each dash
    const totalLines = Math.floor(length / (centerLineSpacing + centerLineDash));
    
    for (let i = 0; i < totalLines; i++) {
        const z = -length/2 + i * (centerLineSpacing + centerLineDash);
        const centerLineGeometry = new THREE.PlaneGeometry(width, centerLineDash);
        const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
        centerLine.position.set(0, 0.01, z);
        centerLine.rotation.x = -Math.PI / 2;
        // Mark this as a road marking for scrolling
        centerLine.userData.isRoadMarking = true;
        roadGroup.add(centerLine);
    }
    
    // Create lane markers (smaller dashes)
    const laneWidth = 5;
    const numLanes = 2;
    const laneSpacing = laneWidth / numLanes;
    
    for (let lane = 1; lane < numLanes; lane++) {
        const laneX = -laneWidth / 2 + lane * laneSpacing;
        
        // Create evenly spaced markers - INCREASED FREQUENCY
        const markerSpacing = 3;  // Reduced from 5 for more frequent markers
        const markerLength = 0.5; // Length of each marker
        const totalMarkers = Math.floor(length / (markerSpacing + markerLength));
        
        for (let i = 0; i < totalMarkers; i++) {
            const z = -length/2 + i * (markerSpacing + markerLength);
            
            const laneMarkerGeometry = new THREE.PlaneGeometry(width * 0.5, markerLength);
            const laneMarker = new THREE.Mesh(laneMarkerGeometry, lineMaterial);
            laneMarker.position.set(laneX, 0.01, z);
            laneMarker.rotation.x = -Math.PI / 2;
            // Mark this as a road marking for scrolling
            laneMarker.userData.isRoadMarking = true;
            roadGroup.add(laneMarker);
        }
    }
}

// Add additional visual cues to enhance the perception of movement
function addMovementCues(roadGroup) {
    // Create transverse markers across the road at regular intervals
    const markerMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.7,
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Add cross-road markers (perpendicular to direction of travel)
    // These will create a strong visual cue for movement
    const markerWidth = 4.8;  // Just inside the road edges
    const markerDepth = 0.3;
    const markerSpacing = 10; // Regular intervals
    
    // Create more markers for a stronger visual effect
    const roadLength = 200;
    const totalMarkers = Math.floor(roadLength / markerSpacing);
    
    for (let i = 0; i < totalMarkers; i++) {
        const z = -roadLength/2 + i * markerSpacing;
        
        const markerGeometry = new THREE.PlaneGeometry(markerWidth, markerDepth);
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(0, 0.005, z); // Slightly above road to prevent z-fighting
        marker.rotation.x = -Math.PI / 2;
        marker.userData.isRoadMarking = true; // Make it scroll with the road
        roadGroup.add(marker);
    }
    
    // Add spot markers scattered along the road edges
    const spotMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Add spots along the left side
    for (let i = 0; i < 40; i++) {
        const z = -roadLength/2 + i * 5 + Math.random() * 2; // Slight randomization
        const x = -2.3 + Math.random() * 0.4; // Near the left edge
        
        const spotGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.1, 8);
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.position.set(x, 0.006, z);
        spot.rotation.x = -Math.PI / 2;
        spot.userData.isRoadMarking = true;
        roadGroup.add(spot);
    }
    
    // Add spots along the right side
    for (let i = 0; i < 40; i++) {
        const z = -roadLength/2 + i * 5 + Math.random() * 2; // Slight randomization
        const x = 2.3 - Math.random() * 0.4; // Near the right edge
        
        const spotGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.1, 8);
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.position.set(x, 0.006, z);
        spot.rotation.x = -Math.PI / 2;
        spot.userData.isRoadMarking = true;
        roadGroup.add(spot);
    }
}