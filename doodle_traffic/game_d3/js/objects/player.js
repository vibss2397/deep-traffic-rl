// Player car creation and management
import * as THREE from 'three';

export class Player {
    constructor() {
        // Car properties
        this.width = 1.0;
        this.height = 0.5;
        this.length = 2.0;
        
        // Movement properties
        this.currentLane = 0; // 0 = left lane, 1 = right lane
        this.targetLane = 0;
        this.laneWidth = 2.5; // Half the road width
        this.laneChangeSpeed = 2.5; // Units per second
        this.isChangingLane = false;
        
        // Speed properties
        this.speed = 5;               // Initial speed is non-zero to get things moving
        this.maxSpeed = 20;           // Maximum speed limit
        this.minSpeed = 0;            // Minimum speed (no reverse)
        this.acceleration = 15;       // Increased acceleration for responsiveness
        this.deceleration = 20;       // Increased deceleration for responsiveness
        
        // Create the mesh
        this.mesh = this.createCarMesh();
        
        // Position the car
        this.position = new THREE.Vector3(
            this.getLanePosition(this.currentLane),
            this.height / 2,
            0
        );
        this.mesh.position.copy(this.position);
        
        // Collision properties
        this.collider = new THREE.Box3();
        this.updateCollider();
        
        // Debug visualization for collision box - create separately
        this.debugCollider = this.createColliderMesh();
        
        // Debug text for displaying speed
        this.debugSpeed = 0;
        
        console.log("Player car created at position:", this.position);
    }
    
    createCarMesh() {
        // Create a group to hold all car parts
        const carGroup = new THREE.Group();
        
        // Create the main car body (simple box for now)
        const bodyGeometry = new THREE.BoxGeometry(this.width, this.height, this.length);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.2,
        });
        
        // Add wireframe to make it look hand-drawn
        const wireframeGeometry = new THREE.WireframeGeometry(bodyGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 2
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        // Create the car body as a mesh
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.castShadow = true;
        
        // Add wireframe to the car body
        carBody.add(wireframe);
        carGroup.add(carBody);
        
        // Add wheels
        this.addWheels(carGroup);
        
        // Add details
        this.addCarDetails(carGroup);
        
        return carGroup;
    }
    
    addWheels(carGroup) {
        // Wheel properties
        const wheelRadius = 0.25;
        const wheelThickness = 0.1;
        
        // Create wheel geometry and material
        const wheelGeometry = new THREE.CylinderGeometry(
            wheelRadius, wheelRadius, wheelThickness, 8
        );
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Create wireframe for wheels
        const wheelWireframe = new THREE.WireframeGeometry(wheelGeometry);
        const wheelWireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        
        // Position wheels
        const wheelPositions = [
            // Front left
            new THREE.Vector3(-this.width/2 - 0.05, -this.height/2, this.length/4),
            // Front right
            new THREE.Vector3(this.width/2 + 0.05, -this.height/2, this.length/4),
            // Back left
            new THREE.Vector3(-this.width/2 - 0.05, -this.height/2, -this.length/4),
            // Back right
            new THREE.Vector3(this.width/2 + 0.05, -this.height/2, -this.length/4)
        ];
        
        // Add wheels to the car
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.copy(position);
            wheel.rotation.z = Math.PI / 2; // Rotate to correct orientation
            wheel.castShadow = true;
            
            // Add wireframe
            const wireframe = new THREE.LineSegments(wheelWireframe, wheelWireframeMaterial);
            wheel.add(wireframe);
            
            carGroup.add(wheel);
        });
    }
    
    addCarDetails(carGroup) {
        // Add windshield
        const windshieldGeometry = new THREE.PlaneGeometry(this.width * 0.7, this.height * 0.6);
        const windshieldMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.2,
            metalness: 0.8,
            side: THREE.DoubleSide
        });
        
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(0, this.height * 0.2, this.length * 0.15);
        windshield.rotation.x = Math.PI / 4; // Angle the windshield
        carGroup.add(windshield);
        
        // Add windshield outline
        const windshieldOutline = new THREE.LineSegments(
            new THREE.EdgesGeometry(windshieldGeometry),
            new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        windshieldOutline.position.copy(windshield.position);
        windshieldOutline.rotation.copy(windshield.rotation);
        carGroup.add(windshieldOutline);
        
        // Add headlights
        const headlightGeometry = new THREE.CircleGeometry(0.15, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0.8
        });
        
        // Left headlight
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-this.width/4, 0, this.length/2 + 0.01);
        leftHeadlight.rotation.y = Math.PI;
        carGroup.add(leftHeadlight);
        
        // Right headlight
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(this.width/4, 0, this.length/2 + 0.01);
        rightHeadlight.rotation.y = Math.PI;
        carGroup.add(rightHeadlight);
        
        // Add headlight outlines
        const headlightOutline = new THREE.LineLoop(
            new THREE.EdgesGeometry(headlightGeometry),
            new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        
        const leftHeadlightOutline = headlightOutline.clone();
        leftHeadlightOutline.position.copy(leftHeadlight.position);
        leftHeadlightOutline.rotation.copy(leftHeadlight.rotation);
        carGroup.add(leftHeadlightOutline);
        
        const rightHeadlightOutline = headlightOutline.clone();
        rightHeadlightOutline.position.copy(rightHeadlight.position);
        rightHeadlightOutline.rotation.copy(rightHeadlight.rotation);
        carGroup.add(rightHeadlightOutline);
    }
    
    getLanePosition(lane) {
        // Convert lane index to x position
        // For a 2-lane road: 
        // lane 0 = left lane (x = -1.25)
        // lane 1 = right lane (x = 1.25)
        return (lane === 0) ? -1.25 : 1.25;
    }
    
    update(deltaTime, inputs) {
        // Log inputs for debugging
        if (inputs.keyW || inputs.arrowUp) {
            console.log("Accelerating - W/Up pressed");
        }
        if (inputs.keyS || inputs.arrowDown) {
            console.log("Braking - S/Down pressed");
        }
        
        // Handle lane changes
        this.handleLaneChange(deltaTime, inputs);
        
        // Store previous speed for debugging
        this.debugSpeed = this.speed;
        
        // Handle speed changes
        this.handleSpeedChange(deltaTime, inputs);
        
        // Log if speed changed
        if (this.speed !== this.debugSpeed) {
            console.log("Speed changed from", this.debugSpeed, "to", this.speed);
        }
        
        // Apply car tilt based on movement
        this.applyCarTilt();
        
        // Update car position
        this.mesh.position.copy(this.position);
        
        // Update debug collider visualization position
        if (this.debugCollider) {
            // Match position of the car
            this.debugCollider.position.copy(this.position);
            // Match rotation of the car
            this.debugCollider.rotation.copy(this.mesh.rotation);
        }
        
        // Update collider
        this.updateCollider();
    }
    
    handleLaneChange(deltaTime, inputs) {
        // Check for lane change input
        if (!this.isChangingLane) {
            if (inputs.keyA || inputs.arrowLeft) {
                if (this.currentLane > 0) {
                    this.targetLane = this.currentLane - 1;
                    this.isChangingLane = true;
                }
            } else if (inputs.keyD || inputs.arrowRight) {
                if (this.currentLane < 1) { // Assuming 2 lanes (0 and 1)
                    this.targetLane = this.currentLane + 1;
                    this.isChangingLane = true;
                }
            }
        }
        
        // Handle lane change movement
        if (this.isChangingLane) {
            const targetX = this.getLanePosition(this.targetLane);
            const currentX = this.position.x;
            const direction = targetX > currentX ? 1 : -1;
            const distance = Math.abs(targetX - currentX);
            
            // Apply easing for smoother movement (ease-out effect)
            const moveAmount = Math.min(
                this.laneChangeSpeed * deltaTime,
                distance * 0.2  // Makes movement faster when far, slower when close
            );
            
            if (distance > 0.05) {
                // Move toward target lane
                this.position.x += direction * moveAmount;
            } else {
                // Reached target lane
                this.position.x = targetX;
                this.currentLane = this.targetLane;
                this.isChangingLane = false;
            }
        }
    }
    
    handleSpeedChange(deltaTime, inputs) {
        // Keep track of previous speed for momentum
        const previousSpeed = this.speed;
        
        // Accelerate with W/Up
        if (inputs.keyW || inputs.arrowUp) {
            this.speed += this.acceleration * deltaTime;
            if (this.speed > this.maxSpeed) {
                this.speed = this.maxSpeed;
            }
        } 
        // Brake with S/Down
        else if (inputs.keyS || inputs.arrowDown) {
            this.speed -= this.deceleration * deltaTime;
            if (this.speed < this.minSpeed) {
                this.speed = this.minSpeed;
            }
        }
        // Natural deceleration when no input (more gradual)
        else {
            this.speed -= this.deceleration * 0.1 * deltaTime;
            if (this.speed < this.minSpeed) {
                this.speed = this.minSpeed;
            }
        }
        
        // Reduced momentum effect for more responsive controls
        this.speed = previousSpeed * 0.7 + this.speed * 0.3;
        
        // Visual effect: car tilts forward slightly when accelerating
        if (this.speed > previousSpeed && !this.isChangingLane) {
            this.mesh.rotation.x = Math.min(this.mesh.rotation.x + 0.01, 0.08);
        } 
        // Visual effect: car tilts backward slightly when braking
        else if (this.speed < previousSpeed && !this.isChangingLane) {
            this.mesh.rotation.x = Math.max(this.mesh.rotation.x - 0.01, -0.05);
        }
        // Return to neutral tilt
        else if (!this.isChangingLane) {
            this.mesh.rotation.x *= 0.9;
        }
    }
    
    applyCarTilt() {
        // Tilt car when changing lanes
        if (this.isChangingLane) {
            const targetX = this.getLanePosition(this.targetLane);
            const currentX = this.position.x;
            
            // Calculate tilt based on distance and direction
            const tiltDirection = targetX > currentX ? -1 : 1; // Tilt into the turn
            const distanceFactor = Math.min(Math.abs(targetX - currentX), 1.0);
            const tiltAmount = tiltDirection * distanceFactor * 0.3; // Max tilt of about 17 degrees
            
            // Apply tilt
            this.mesh.rotation.z = tiltAmount;
            
            // Add subtle forward tilt when changing lanes
            this.mesh.rotation.x = 0.05;
        } else {
            // Gradually return to upright position with some smoothing
            this.mesh.rotation.z *= 0.8;
            this.mesh.rotation.x *= 0.8;
        }
        
        // Add bounce effect based on speed
        if (this.speed > 0) {
            // Simple bounce based on speed and time
            const bounceHeight = Math.sin(performance.now() * 0.01) * 0.03 * (this.speed / this.maxSpeed);
            this.mesh.position.y = this.position.y + bounceHeight;
        }
    }
    
    // Create debug visualization for collision box
    createColliderMesh() {
        // Create a wireframe box to visualize the collision box
        const geometry = new THREE.BoxGeometry(
            this.width * 0.9,
            this.height * 0.9, 
            this.length * 0.9
        );
        
        // Use a bright red wireframe material to make it clearly visible
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: false,
            opacity: 1.0
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        // Don't make it a child of the car, add it to scene separately
        mesh.position.set(0, 0, 0); // Will be positioned in update method
        return mesh;
    }
    
    // Update the collision box to match the car's position
    updateCollider() {
        // Create a slightly smaller collision box than the visual car
        // This gives a bit of forgiveness in collisions
        const collisionSize = {
            width: this.width * 0.8,
            height: this.height * 0.8,
            length: this.length * 0.8
        };
        
        // Create a temporary bounding box centered on the car's position
        const min = new THREE.Vector3(
            this.position.x - collisionSize.width / 2,
            this.position.y - collisionSize.height / 2,
            this.position.z - collisionSize.length / 2
        );
        
        const max = new THREE.Vector3(
            this.position.x + collisionSize.width / 2,
            this.position.y + collisionSize.height / 2,
            this.position.z + collisionSize.length / 2
        );
        
        // Update the collider with these bounds
        this.collider.set(min, max);
    }
    
    // Check if this car collides with another object's collider
    checkCollision(otherCollider) {
        return this.collider.intersectsBox(otherCollider);
    }
    
    // Handle collision response
    handleCollision() {
        // Flash the car red to indicate collision
        const materials = this.mesh.children[0].material;
        
        // Store original color
        const originalColor = materials.color.clone();
        
        // Change to red
        materials.color.set(0xff0000);
        
        // Reset after 200ms
        setTimeout(() => {
            materials.color.copy(originalColor);
        }, 200);
        
        // Reduce speed
        this.speed *= 0.5;
    }
}

// Function to create and return a new player instance
export function createPlayer() {
    return new Player();
}