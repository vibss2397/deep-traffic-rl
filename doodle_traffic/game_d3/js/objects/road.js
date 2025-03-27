// Road creation and management
import * as THREE from 'three';
import { createNotebookTexture, createSketchyTexture } from '../utils/texture-generator.js';

export function createRoad() {
    // Create a group to hold all road components
    const roadGroup = new THREE.Group();
    
    // Get notebook paper texture
    const notebookTexture = createNotebookTexture();
    
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
    roadGroup.add(leftEdge);
    
    // Create right edge
    const rightEdgeGeometry = new THREE.PlaneGeometry(width, length);
    const rightEdge = new THREE.Mesh(rightEdgeGeometry, lineMaterial);
    rightEdge.position.set(2.5, 0.01, 0);
    rightEdge.rotation.x = -Math.PI / 2;
    roadGroup.add(rightEdge);
    
    // Create center line (dashed)
    for (let z = -length/2; z < length/2; z += 3) {
        const centerLineGeometry = new THREE.PlaneGeometry(width, 1);
        const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
        centerLine.position.set(0, 0.01, z);
        centerLine.rotation.x = -Math.PI / 2;
        roadGroup.add(centerLine);
    }
    
    // Create lane markers (smaller dashes)
    const laneWidth = 5;
    const numLanes = 2;
    const laneSpacing = laneWidth / numLanes;
    
    for (let lane = 1; lane < numLanes; lane++) {
        const laneX = -laneWidth / 2 + lane * laneSpacing;
        
        for (let z = -length/2; z < length/2; z += 5) {
            // Skip some positions to create spacing
            if (z % 10 === 0) continue;
            
            const laneMarkerGeometry = new THREE.PlaneGeometry(width * 0.5, 0.5);
            const laneMarker = new THREE.Mesh(laneMarkerGeometry, lineMaterial);
            laneMarker.position.set(laneX, 0.01, z);
            laneMarker.rotation.x = -Math.PI / 2;
            roadGroup.add(laneMarker);
        }
    }
}