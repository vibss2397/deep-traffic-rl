// Scene setup and management
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRoad, updateRoad } from './objects/road.js';
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
        this.playerPosition = { x: 0, y: 0, z: 0 };
        
        // Add flags to track when road updates are needed
        this.lastPlayerPosition = { x: 0, y: 0, z: 0 };
        this.roadUpdateThreshold = 1; // Update road when player moves this far
        this.lastPlayerZ = 0;
        
        // Camera settings - adjusted for better view
        this.cameraHeight = 3.0;           // Slightly higher position
        this.cameraDistance = 7;           // Increased distance behind player
        this.lookAheadDistance = 12;       // Reduced look-ahead distance
        this.cameraAngle = 30 * (Math.PI / 180); // 30 degrees in radians - slightly flatter angle
        
        // Camera movement speed
        this.cameraSpeed = 5;
        
        // Scrolling parameters
        this.scrollPosition = 0;     // Current position in the world
        this.roadLength = 200;       // Length of road before repeating
        this.scrollObjects = [];     // Objects that need to be scrolled
        
        // Track textures for reliable scrolling
        this.scrollableTextures = [];
        
        // Visual effect parameters
        this.bobAmount = 0.1;        // Amount of camera bob
        this.bobFrequency = 1.5;     // Frequency of camera bob
        this.lastBobTime = 0;        // For timing the bobbing effect
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0); // Light gray background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            70, // Wider FOV for better peripheral vision and sense of speed
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        // Position camera for initial view (will be updated when target is set)
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, -5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        
        // Enable shadows for better visual depth
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup lighting
        this.setupLighting();

        // Create road - pass scene for segment management
        this.road = createRoad(this.scene);
        this.scene.add(this.road);
        
        //--- Commenting this out as google thinnks this is problematic ---
        //  Register road for scrolling
        //this.registerScrollObject(this.road);
        
        // Find and register all scrollable textures
        this.collectScrollableTextures();

        // Create environment
        this.environment = createEnvironment();
        this.scene.add(this.environment);
        
        // Register environment elements for scrolling
        this.registerScrollObject(this.environment);
        
        // Add fog for depth perception and sense of distance
        this.scene.fog = new THREE.Fog(0xf0f0f0, 100, 400);

        console.log('Scene manager initialized');
    }
    
    // Collect all textures that need to be scrolled
    collectScrollableTextures() {
        // Clear the array first
        this.scrollableTextures = [];
        
        // Search the entire scene for textures
        this.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                // Handle materials that might be an array
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.map) {
                            this.registerScrollableTexture(child, mat.map);
                        }
                    });
                } 
                // Handle single materials
                else if (child.material.map) {
                    this.registerScrollableTexture(child, child.material.map);
                }
            }
        });
        
        console.log(`Collected ${this.scrollableTextures.length} scrollable textures`);
    }
    
    // Helper method to register a texture
    registerScrollableTexture(object, texture) {
        // Store a reference to each texture
        this.scrollableTextures.push({
            texture: texture,
            object: object
        });
        
        // Make sure wrapping is set correctly
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        // Force update
        texture.needsUpdate = true;
    }

    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Add directional light (sunlight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Configure shadow properties for better quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        
        // Add a secondary light to fill in shadows
        const fillLight = new THREE.DirectionalLight(0xffffcc, 0.3);
        fillLight.position.set(-5, 10, -5);
        this.scene.add(fillLight);
    }

    update(playerSpeed, deltaTime) {
        // Update the road segments based on player position
        if (this.playerPosition) {
            this.updateRoad(this.playerPosition.z, playerSpeed, deltaTime);
        }
        
        // Update controls
        if (this.controls && this.controls.enabled) {
            this.controls.update();
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    // Updated road method to ensure segments are updated
    updateRoad(playerZ, playerSpeed, deltaTime) {

        if (this.road && this.road.userData && this.road.userData.roadDrawingSystem) {
            this.road.userData.roadDrawingSystem.update(playerZ, playerSpeed, deltaTime);
            // this.road.userData.roadDrawingSystem.updateAnimations(deltaTime);
        } 
        // else {
        //     // Fall back to the global function
        //     updateRoad(playerZ, deltaTime);
        // }
    }
    
    
    // Register an object to be affected by scrolling
    registerScrollObject(object) {
        if (object) {
            this.scrollObjects.push(object);
            console.log('Registered object for scrolling');
        }
    }
    
    // Update scrolling based on speed
    updateScroll(speed, deltaTime) {
        if (speed <= 0) return;
        
        // Calculate scroll amount for this frame
        const scrollAmount = speed * deltaTime;
        
        // Update scroll position
        this.scrollPosition += scrollAmount;
        
        // Check if we need to reset the scroll position (after reaching road length)
        if (this.scrollPosition >= this.roadLength) {
            this.scrollPosition -= this.roadLength;
        }
        
        // Apply texture offset to create scrolling illusion
        this.updateTextureScrolling(scrollAmount);
        
        // Move objects for additional scrolling effect
        this.moveScrollObjects(scrollAmount);
        
        // Refresh scrollable textures occasionally to catch new road segments
        if (Math.random() < 0.05) { // 5% chance each frame
            this.collectScrollableTextures();
        }
    }
    
    // Update texture offsets to create a scrolling effect with improved robustness
    updateTextureScrolling(scrollAmount) {
        // Only update if there's significant movement
        if (scrollAmount < 0.0001) return;
        
        // Use the stored texture references
        for (const item of this.scrollableTextures) {
            const texture = item.texture;
            
            if (texture) {
                // Use a consistent speed factor
                const speedFactor = 100;
                
                // Calculate new offset with proper wrapping
                let newOffset = texture.offset.y - (scrollAmount / speedFactor);
                
                // Apply new offset, ensuring we properly wrap
                texture.offset.y = newOffset % 1;
                
                // Force texture update
                texture.needsUpdate = true;
            }
        }
    }
    
    // Move objects to create a scrolling effect
    moveScrollObjects(scrollAmount) {
        // Only process if there's significant movement
        if (scrollAmount < 0.0001) return;
        
        // Loop through all registered scroll objects
        this.scrollObjects.forEach(object => {
            // For objects that need to be physically moved (road markings, obstacles, etc.)
            object.traverse((child) => {
                if (child.isMesh && child.userData.isRoadMarking) {
                    // Move the object forward (increasing Z)
                    child.position.z += scrollAmount;
                    
                    // If the object has moved past a certain point, loop it back
                    if (child.position.z > 100) {  // Assuming player is at z=0
                        child.position.z -= 200;   // Move it back to the start
                    }
                }
            });
        });
    }

    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Add an object to the scene
    addToScene(object) {
        if (this.scene) {
            this.scene.add(object);
            console.log('Added object to scene');
            
            // If this is a new object, collect its textures
            this.collectScrollableTextures();
        } else {
            console.error('Cannot add object to scene: scene is not initialized');
        }
    }

    // Set the target for the camera to follow with new POV angle
    setCameraTarget(target) {
        this.cameraTarget = target;
        console.log("Camera target set to:", target);
        
        if(this.camera && this.cameraTarget) {
            // Calculate the position directly behind and above the car
            const heightOffset = Math.sin(this.cameraAngle) * this.cameraDistance;
            const backOffset = Math.cos(this.cameraAngle) * this.cameraDistance;
            
            // Set initial camera position
            this.camera.position.set(
                this.cameraTarget.position.x,           // Directly behind (X-axis)
                this.cameraTarget.position.y + heightOffset,  // Height based on angle
                this.cameraTarget.position.z + backOffset     // Distance behind based on angle
            );
            
            // Configure camera to look ahead of the target
            this.camera.lookAt(
                this.cameraTarget.position.x,
                this.cameraTarget.position.y,
                this.cameraTarget.position.z - this.lookAheadDistance
            );
            
            // Disable orbit controls when following a target
            if (this.controls) {
                this.controls.enabled = false;
            }
            
            console.log("Initial camera position set:", this.camera.position);
        }
    }

    // Update camera position to follow the target with new POV angle
    updateCameraFollow(targetPosition, speed, deltaTime) {
        if (!this.cameraTarget) return;

        // Store the player position for road segment updates
        this.playerPosition.x = targetPosition.x;
        this.playerPosition.y = targetPosition.y;
        this.playerPosition.z = targetPosition.z;
        
        // Commenting this out as google thinnks this is problematic ----
        // // Only update road when player has moved a significant amount
        // const distanceMoved = Math.abs(this.playerPosition.z - this.lastPlayerPosition.z);
        // if (distanceMoved > this.roadUpdateThreshold) {
        //     this.updateRoad(this.playerPosition.z, deltaTime);
        //     this.lastPlayerPosition = {...this.playerPosition};
        // }
        
        // Use the VISUAL position of the car (this.cameraTarget.position) for camera placement
        // This ensures the camera follows what the player sees, not the absolute position
        
        // Calculate position directly behind and above the car's VISUAL position
        const heightOffset = Math.sin(this.cameraAngle) * this.cameraDistance;
        const backOffset = Math.cos(this.cameraAngle) * this.cameraDistance;

        // Position camera behind and above player's visual position
        const idealCameraPos = {
            x: this.cameraTarget.position.x,
            y: this.cameraTarget.position.y + heightOffset,
            z: this.cameraTarget.position.z + backOffset
        };
        
        // Add subtle camera bobbing based on speed
        this.lastBobTime += deltaTime * this.bobFrequency * (speed / 10);
        const bobOffset = Math.sin(this.lastBobTime) * this.bobAmount * (Math.min(speed, 10) / 10);
        idealCameraPos.y += bobOffset;
        
        // Add subtle side-to-side motion for more dynamic feel
        const lateralOffset = Math.cos(this.lastBobTime * 0.7) * this.bobAmount * 0.3 * (Math.min(speed, 10) / 10);
        idealCameraPos.x += lateralOffset;
        
        // Smoothly move camera toward ideal position
        // this.camera.position.x = this.camera.position.x * 0.92 + idealCameraPos.x * 0.08;
        // this.camera.position.y = this.camera.position.y * 0.92 + idealCameraPos.y * 0.08;
        // this.camera.position.z = this.camera.position.z * 0.92 + idealCameraPos.z * 0.08;
        this.camera.position.set(idealCameraPos.x, idealCameraPos.y, idealCameraPos.z);
        
        // Make camera look ahead of the player's VISUAL position
        const lookAtPos = {
            x: this.cameraTarget.position.x,
            y: this.cameraTarget.position.y,
            z: this.cameraTarget.position.z - this.lookAheadDistance
        };
        
        // Create a temporary vector for lookAt
        const lookAtVector = new THREE.Vector3(lookAtPos.x, lookAtPos.y, lookAtPos.z);
        this.camera.lookAt(lookAtVector);
    }
}