// Scene setup and management
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
        
        // Camera movement speed
        this.cameraSpeed = 5;
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0); // Light gray background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

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
        this.controls.target.x = this.camera.position.x;
        this.controls.target.z = this.camera.position.z - 5; // Look ahead
    }
}