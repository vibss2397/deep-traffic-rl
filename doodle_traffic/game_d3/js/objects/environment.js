// Environment elements
import * as THREE from 'three';

export function createEnvironment() {
    // Create a group to hold all environment elements
    const envGroup = new THREE.Group();
    
    // Add ground plane
    const ground = createGround();
    envGroup.add(ground);
    
    // Add grid helper for visual reference during development
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
    envGroup.add(gridHelper);
    
    // Add some simple decorative elements along the sides
    addDecorativeElements(envGroup);
    
    return envGroup;
}

function createGround() {
    // Create a large ground plane beyond the road - make it longer to match the road
    const groundGeometry = new THREE.PlaneGeometry(50, 250);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf0f0f0,  // Lighter color to better match the notebook paper
        roughness: 1.0,
        metalness: 0.0
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate to lay flat
    ground.position.y = -0.1;          // Slightly below the road
    ground.receiveShadow = true;
    
    return ground;
}

function addDecorativeElements(envGroup) {
    // This function is now empty - decorative elements will be added in later phases
    // You can uncomment the code below when you're ready to add decorations
    
    /*
    // Create some "pencil" markers along the sides (just cylinders for now)
    const pencilGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const pencilMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    
    // Add a few pencils on the left side
    for (let z = -40; z <= 40; z += 20) {
        const pencil = new THREE.Mesh(pencilGeometry, pencilMaterial);
        pencil.position.set(-5, 0.75, z);
        pencil.castShadow = true;
        envGroup.add(pencil);
    }
    
    // Add a few pencils on the right side
    for (let z = -30; z <= 30; z += 20) {
        const pencil = new THREE.Mesh(pencilGeometry, pencilMaterial);
        pencil.position.set(5, 0.75, z);
        pencil.castShadow = true;
        envGroup.add(pencil);
    }
    
    // Add a few "erasers" (boxes) scattered around
    const eraserGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
    const eraserMaterial = new THREE.MeshStandardMaterial({ color: 0xff6666 });
    
    for (let i = 0; i < 5; i++) {
        const eraser = new THREE.Mesh(eraserGeometry, eraserMaterial);
        eraser.position.set(
            -10 + Math.random() * 20, 
            0.2, 
            -40 + Math.random() * 80
        );
        eraser.rotation.y = Math.random() * Math.PI;
        eraser.castShadow = true;
        envGroup.add(eraser);
    }
    */
}