// Update camera position to follow the target
updateCameraFollow(targetPosition, speed, deltaTime) {
    if (!this.cameraTarget) return;
    
    // Position camera behind and above player
    const idealCameraPos = {
        x: targetPosition.x,
        y: targetPosition.y + this.cameraHeight,
        z: targetPosition.z + this.cameraDistance
    };
    
    // Smoothly move camera toward ideal position
    this.camera.position.x = this.camera.position.x * 0.9 + idealCameraPos.x * 0.1;
    this.camera.position.y = this.camera.position.y * 0.9 + idealCameraPos.y * 0.1;
    this.camera.position.z = this.camera.position.z * 0.9 + idealCameraPos.z * 0.1;
    
    // Make camera look ahead of the player
    const lookAtPos = {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z - this.lookAheadDistance
    };
    
    // Create a temporary vector for lookAt
    const lookAtVector = new THREE.Vector3(lookAtPos.x, lookAtPos.y, lookAtPos.z);
    this.camera.lookAt(lookAtVector);
}    // Set the target for the camera to follow
setCameraTarget(target) {
    this.cameraTarget = target;
    console.log("Camera target set to:", target);
    
    // Set initial camera position relative to target
    if(this.camera && this.cameraTarget) {
        this.camera.position.set(
            this.cameraTarget.position.x,
            this.cameraHeight,
            this.cameraTarget.position.z + this.cameraDistance
        );
        
        // Configure camera to look slightly ahead of target
        this.camera.lookAt(
            this.cameraTarget.position.x,
            0,  // Look at ground level
            this.cameraTarget.position.z - this.lookAheadDistance
        );
        
        // Disable orbit controls when following a target
        if (this.controls) {
            this.controls.enabled = false;
        }
        
        console.log("Initial camera position set:", this.camera.position);
    }
}    // Add an object to the scene
addToScene(object) {
    if (this.scene) {
        this.scene.add(object);
        console.log('Added object to scene');
    } else {
        console.error('Cannot add object to scene: scene is not initialized');
    }
}// Scene setup and management
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRoad } from './objects/road.js';
import { createEnvironment } from './objects/environment.js';

export class SceneManager {
constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.road = null;
    this.environment = null;
    this.cameraTarget = null;
    
    // Camera settings
    this.cameraHeight = 5;       // Height above player
    this.cameraDistance = 7;     // Distance behind player
    this.lookAheadDistance = 10; // Distance to look ahead of player
    
    // Camera movement speed
    this.cameraSpeed = 5;
}

init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0); // Light gray background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
        60, // FOV - Slightly wider for better visibility
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near plane
        1000 // Far plane
    );
    
    // Position camera for a 35° angle view (between 30-45°)
    // Position it higher and further back for better road visibility
    this.camera.position.set(0, 8, 12);
    
    // Have the camera look slightly downward to focus on the road ahead
    this.camera.lookAt(0, 0, -5);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    // Create orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Setup lighting
    this.setupLighting();

    // Create road
    this.road = createRoad();
    this.scene.add(this.road);

    // Create environment
    this.environment = createEnvironment();
    this.scene.add(this.environment);

    console.log('Scene manager initialized');
}

setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Configure shadow properties (optional for better quality)
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
}

update(deltaTime) {
    // Update controls
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);
}

onWindowResize() {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
}

moveCamera(direction, deltaTime) {
    const speed = this.cameraSpeed * deltaTime;

    switch(direction) {
        case 'forward':
            this.camera.position.z -= speed;
            break;
        case 'backward':
            this.camera.position.z += speed;
            break;
        case 'left':
            this.camera.position.x -= speed;
            break;
        case 'right':
            this.camera.position.x += speed;
            break;
    }

    // Update the controls target to match the new camera position in the xz plane
    // but keep looking at a point in front of and below the camera
    this.controls.target.x = this.camera.position.x;
    this.controls.target.y = 0; // Keep focus on the ground level
    this.controls.target.z = this.camera.position.z - 10; // Look further ahead for better visibility
}
}