import * as THREE from 'three';

// Segment animation states
const SegmentState = {
    FLYING_IN: 'flying_in',  // Segment is animating in from below
    COMPLETE: 'complete'     // Segment is fully visible
};

export class RoadDrawingSystem {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];      // All road segments
        this.segmentPool = [];   // For recycling segments
        
        // Configuration
        this.segmentLength = 40;     // Length of each segment
        this.roadWidth = 6.0; // ADJUSTED: Reduced road width slightly
        this.visibleSegments = 3;
        this.segmentsBehind = 4;

        
        // Animation parameters
        this.flyInDistance = 30;
        this.flyInDuration = 0.8;
        
        this.currentX = 0;
        this.currentZ = 0;
        this.currentAngle = 0;
        
        this.debug = true; 
        this.zAtLastGeneration = 0; 
        this.minSpeedForGeneration = 1.0; 

        this.generatedGreyEdgeTexture = this.createGreyEdgeTexture(); // Create the new texture

        this.greyEdgeMaterial = new THREE.MeshStandardMaterial({
            map: this.generatedGreyEdgeTexture, // Use the texture
            color: 0xffffff, // Set to white so texture color shows accurately
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        
        this.darkMarginMaterial = new THREE.MeshStandardMaterial({
            color: 0x202020, // Dark color for margins (almost black)
            roughness: 0.8,
            metalness: 0.0,
            flatShading: true
        });
    }
    
    init() {
        console.log("Initializing road drawing system (Aesthetic Update 2 - 3D Edges)");
        this.generateInitialSegments();
    }
    
    createSegment(type, startX = 0, startZ = 0, startAngle = 0) {
        let segment;
        
        if (this.segmentPool.length > 0) {
            segment = this.segmentPool.pop();
            segment.visible = true; // Make sure it's visible when reused
            segment.userData.type = type;
            segment.position.set(startX, 0, startZ); 
            segment.rotation.y = startAngle;
            while(segment.children.length > 0){ 
                const child = segment.children[0];
                segment.remove(child);
                if (child.geometry) child.geometry.dispose();
                // Materials are shared, so no need to dispose them here
            }
            this.buildSegmentContent(segment, type);
        } else {
            segment = new THREE.Group();
            segment.userData.type = type;
            segment.userData.isRoadSegment = true;
            segment.userData.length = this.segmentLength;
            segment.position.set(startX, 0, startZ); 
            segment.rotation.y = startAngle;
            this.buildSegmentContent(segment, type);
        }
        
        this.scene.add(segment);
        return segment;
    }
    
    buildSegmentContent(segment, type) {
        let roadGeometry;
        
        switch(type) {
            case 'straight':
            default:
                roadGeometry = new THREE.PlaneGeometry(
                    this.roadWidth, 
                    this.segmentLength,
                    1, 1 
                );
                break;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const textureSize = 256; 
        canvas.width = textureSize;
        canvas.height = textureSize;

        ctx.fillStyle = '#5fbde4'; // Road surface color from previous update, teal color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const numSpecks = 500;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; 
        for (let i = 0; i < numSpecks; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1.5;
            ctx.fillRect(x, y, size, size);
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'; 
        for (let i = 0; i < numSpecks / 2; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1;
            ctx.fillRect(x, y, size, size);
        }

        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = 1; 
        const lineSpacing = textureSize / (this.roadWidth > 0 ? Math.max(1, Math.floor(this.roadWidth)) : 10) ; // Dynamic grid based on roadwidth

        for (let i = 0; i <= Math.max(1, Math.floor(this.roadWidth)); i++) { // Dynamic grid
            const xPos = i * lineSpacing;
             // Vertical lines
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, canvas.height);
            ctx.stroke();
        }
        const numHorizontalLines = Math.floor(this.segmentLength / (textureSize / lineSpacing)); // Approx
         for (let i = 0; i <= numHorizontalLines; i++) {
            const yPos = i * lineSpacing;
             // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, this.segmentLength / (this.roadWidth / (textureSize/lineSpacing)) / (textureSize/lineSpacing) ); // Try to make grid squares somewhat square
        // A simpler approach for repeat if grid squares are meant to be ~1x1 world units:
        // texture.repeat.set(this.roadWidth / GRID_SQUARE_WORLD_SIZE, this.segmentLength / GRID_SQUARE_WORLD_SIZE);
        // For now, let's use a fixed number of repeats based on texture drawing
        const desiredGridSquaresAcrossRoad = this.roadWidth; // e.g. if roadWidth is 6, show 6 grid lines from texture
        const desiredGridSquaresAlongSegment = this.segmentLength / (this.roadWidth / desiredGridSquaresAcrossRoad) ; // Maintain aspect ratio
        texture.repeat.set(desiredGridSquaresAcrossRoad / (textureSize/lineSpacing) , desiredGridSquaresAlongSegment/ (textureSize/lineSpacing));


        const roadMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.9, 
            metalness: 0.1  
        });
        
        const roadSurface = new THREE.Mesh(roadGeometry, roadMaterial);
        roadSurface.rotation.x = -Math.PI / 2;
        roadSurface.receiveShadow = true; 
        roadSurface.position.y = 0; 
        roadSurface.position.z = this.segmentLength / 2; 
        
        segment.add(roadSurface);
        this.addRoadMarkings(segment, type);
        segment.userData.roadSurface = roadSurface;
    }
    
    addRoadMarkings(segment, type) {
        // Shared material for center lines (keeping dark)
        const centerLineMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark Charcoal
            roughness: 0.95,
            metalness: 0.05,
            // flatShading: true
        });

        // Call addStraightBoundaryLines to create the grey edges
        this.addStraightBoundaryLines(segment); // We are creating the material inside that function now
        this.addStraightCenterLines(segment, centerLineMaterial);
    }

    addStraightBoundaryLines(segment) { // Parameter 'material' is no longer passed/used here
        const length = this.segmentLength;
        const halfRoadWidth = this.roadWidth / 2;
    
        const greyEdgeStripWidth = 0.6;  // Width of the grey part of the edge (X-direction)
        const greyEdgeStripHeight = 0.05; // Height of the grey part (Y-direction)
    
        const darkMarginLineWidth = 0.08;  // Width of the dark margin line (X-direction on top of grey strip)
        const darkMarginLineHeight = 0.01; // Thickness/Height of the dark margin line itself (Y-direction)
    
        const greyEdgeGeometry = new THREE.BoxGeometry(greyEdgeStripWidth, greyEdgeStripHeight, length);
        const darkMarginGeometry = new THREE.BoxGeometry(darkMarginLineWidth, darkMarginLineHeight, length);

    
        // Center X offset for the grey strips from the road's centerline
        const greyStripCenterOffsetX = halfRoadWidth + greyEdgeStripWidth / 2;
    
        const sides = [-1, 1]; // -1 for left, 1 for right
    
        sides.forEach(sideSign => {
            const greyStripPosX = sideSign * greyStripCenterOffsetX;
            const greyRoadEdgeMesh = new THREE.Mesh(greyEdgeGeometry, this.greyEdgeMaterial);
            greyRoadEdgeMesh.position.set(greyStripPosX, greyEdgeStripHeight / 2, length / 2);
            // greyRoadEdgeMesh.castShadow = true; // Optional, uncomment if desired
            segment.add(greyRoadEdgeMesh);
    
            // Uses the pre-created this.darkMarginMaterial from the constructor
            // Y position for the center of the margin lines, placing them on top of the grey strip
            const marginCenterY = greyEdgeStripHeight + (darkMarginLineHeight / 2);
    
            // Inner margin (closer to the main road surface)
            // Its X center is at the inner edge of the grey strip.
            const innerMarginPosX = greyStripPosX - (sideSign * (greyEdgeStripWidth / 2)) + (sideSign * (darkMarginLineWidth / 2));
            const innerMarginMesh = new THREE.Mesh(darkMarginGeometry, this.darkMarginMaterial);
            innerMarginMesh.position.set(innerMarginPosX, marginCenterY, length / 2);
            segment.add(innerMarginMesh);
    
            // Outer margin (further from the main road surface)
            // Its X center is at the outer edge of the grey strip.
            const outerMarginPosX = greyStripPosX + (sideSign * (greyEdgeStripWidth / 2)) - (sideSign * (darkMarginLineWidth / 2));
            const outerMarginMesh = new THREE.Mesh(darkMarginGeometry, this.darkMarginMaterial);
            outerMarginMesh.position.set(outerMarginPosX, marginCenterY, length / 2);
            segment.add(outerMarginMesh);
        });
    }

    addStraightCenterLines(segment, material) {
        const dashWidth = 0.30; // Slightly adjusted
        const dashLength = 2.5; 
        const gapLength = 3.5;  
        const dashThickness = 0.05; // Give center dashes a slight thickness too
        const segmentLength = this.segmentLength;
        let currentZ = dashLength / 2; 

        const centerDashGeom = new THREE.BoxGeometry(dashWidth, dashThickness, dashLength);

        while (currentZ < segmentLength) {
            const centerLine = new THREE.Mesh(centerDashGeom, material);
            centerLine.position.set(0, dashThickness / 2, currentZ); 
            centerLine.castShadow = true; // Optional
            segment.add(centerLine);
            currentZ += dashLength + gapLength;
        }
    }
    
    // --- UNCHANGED METHODS BELOW (generateInitialSegments, generateNextSegment, update, createCurvedRoadGeometry, etc.) ---
    // Kept for potential future use, but not called if only straight segments are generated
    createCurvedRoadGeometry(isLeftTurn) {
        const radius = this.segmentLength / 2; 
        const curveAngle = Math.PI / 2; 

        const roadPlaneGeometry = new THREE.PlaneGeometry(
            this.roadWidth,
            this.segmentLength, 
            20, 
            20  
        );

        const positionAttribute = roadPlaneGeometry.getAttribute('position');
        const tempVec = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
            tempVec.fromBufferAttribute(positionAttribute, i);
            const t = (tempVec.y + this.segmentLength / 2) / this.segmentLength; 
            const actualAngle = t * curveAngle; 
            const curveCenterX = isLeftTurn ? radius : -radius;
            const xOffset = tempVec.x; 
            const centerlineX = curveCenterX - Math.cos(actualAngle) * radius * (isLeftTurn ? 1 : -1);
            const centerlineZ = Math.sin(actualAngle) * radius;
            positionAttribute.setX(i, centerlineX - xOffset * Math.sin(actualAngle) * (isLeftTurn ? 1 : -1) );
            positionAttribute.setZ(i, centerlineZ + xOffset * Math.cos(actualAngle) ); 
            positionAttribute.setY(i, 0); 
        }
        roadPlaneGeometry.attributes.position.needsUpdate = true;
        roadPlaneGeometry.computeVertexNormals(); 
        return roadPlaneGeometry;
    }
    
    addCurvedBoundaryLines(segment, isLeftTurn, material) {
        console.warn("addCurvedBoundaryLines with thick boxes is complex and not fully implemented for aesthetics.");
    }

    addCurvedCenterLines(segment, isLeftTurn, material) {
        console.warn("addCurvedCenterLines with thick boxes is complex and not fully implemented for aesthetics.");
    }
    
    generateInitialSegments() {
        const totalInitialSegments = this.visibleSegments + this.segmentsBehind;
        this.currentZ = (this.segmentsBehind) * this.segmentLength; 

        for (let i = 0; i < totalInitialSegments; i++) {
            const segmentType = 'straight'; 
            const zPos = this.currentZ - i * this.segmentLength;
            const segment = this.createSegment(segmentType, this.currentX, zPos, this.currentAngle);
            
            if (i < this.segmentsBehind + this.visibleSegments -1) { 
                 segment.userData.state = SegmentState.COMPLETE;
                 segment.position.y = 0;
            } else { 
                segment.userData.state = SegmentState.FLYING_IN;
                segment.userData.animationStart = performance.now() / 1000;
                segment.position.y = -this.flyInDistance;
            }
            this.segments.push(segment);
        }
        this.currentZ -= totalInitialSegments * this.segmentLength; 
        this.zAtLastGeneration = this.currentZ + this.segmentLength; 
        
        if (this.debug) {
            // console.log(`Generated ${this.segments.length} initial segments. Next segment will start at Z: ${this.currentZ.toFixed(2)}`);
        }
    }
    
    generateNextSegment() {
        if (this.segments.length === 0) {
            // console.error("generateNextSegment called with empty segments array! Re-initializing.");
            this.generateInitialSegments(); 
            if (this.segments.length === 0) return null; 
        }

        const lastSegment = this.segments[this.segments.length - 1];
        if (!lastSegment || typeof lastSegment.position === 'undefined') {
            // console.error("lastSegment is invalid in generateNextSegment!", lastSegment);
            return null;
        }

        const nextType = 'straight';
        const newSegment = this.createSegment(nextType, this.currentX, this.currentZ, this.currentAngle);
        newSegment.userData.state = SegmentState.FLYING_IN;
        newSegment.userData.animationStart = performance.now() / 1000;
        newSegment.position.y = -this.flyInDistance; 

        this.segments.push(newSegment);
        this.currentZ -= this.segmentLength; 

        if (this.debug && Math.random() < 0.1) { 
            // console.log(`Generated next segment. Total: ${this.segments.length}. New segment at Z: ${(this.currentZ + this.segmentLength).toFixed(2)}. Next will be at Z: ${this.currentZ.toFixed(2)}`);
        }
        return newSegment;
    }
        
    update(playerZ, playerSpeed, deltaTime) { 
        const currentTime = performance.now() / 1000;
        const removalThresholdZ = playerZ + (this.segmentsBehind + 0.5) * this.segmentLength; 
    
        while (this.segments.length > 0 && (this.segments[0].position.z + this.segmentLength / 2) > removalThresholdZ) {
            if (this.segments.length <= this.visibleSegments + this.segmentsBehind -1 && this.segments.length <=1 ) break; 
            
            const oldSegment = this.segments.shift();
            oldSegment.visible = false; 
            this.segmentPool.push(oldSegment);
            if (this.debug && Math.random() < 0.05) {
                // console.log(`Recycled segment. Pool size: ${this.segmentPool.length}. Active: ${this.segments.length}`);
            }
        }
    
        if (this.segments.length > 0) {
            const lastSegment = this.segments[this.segments.length - 1];
            const generationTriggerZ = playerZ - (this.visibleSegments - 1.5) * this.segmentLength;
            if (lastSegment.position.z > generationTriggerZ && playerSpeed > this.minSpeedForGeneration) {
                if (this.currentZ > generationTriggerZ - this.segmentLength) { 
                     this.generateNextSegment();
                     this.zAtLastGeneration = this.currentZ + this.segmentLength; 
                }
            }
        } else {
            if (this.debug) console.log("No segments exist, attempting to generate initial set.");
            this.generateInitialSegments(); 
        }
    
        this.segments.forEach((segment) => {
            if (!segment.visible && this.segmentPool.indexOf(segment) === -1) { 
                segment.visible = true;
            }
            if (segment.userData.state === SegmentState.FLYING_IN) {
                const elapsedTime = currentTime - segment.userData.animationStart;
                const progress = Math.min(elapsedTime / this.flyInDuration, 1.0);
                const easeOutProgress = 1 - Math.pow(1 - progress, 3); 
                
                segment.position.y = -this.flyInDistance * (1 - easeOutProgress);
    
                if (progress >= 1.0) {
                    segment.position.y = 0;
                    segment.userData.state = SegmentState.COMPLETE;
                    delete segment.userData.animationStart;
                }
            }
        });
    }

    createGreyEdgeTexture() {
        const canvas = document.createElement('canvas');
        // Dimensions for the texture canvas.
        // It will be stretched/repeated on the grey edge's top surface.
        const textureWidth = 164;  // Represents the width of the grey edge strip
        const textureHeight = 300; // Represents a portion of the length, will repeat
        canvas.width = textureWidth;
        canvas.height = textureHeight;
        const ctx = canvas.getContext('2d');
    
        // Base grey color for the edge strip
        ctx.fillStyle = '#aaaaaa'; // The desired grey color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Add small "doodle" lines
        const numLines = 20; // Adjust for density
        ctx.strokeStyle = '#000000'; // Black lines
        ctx.lineWidth = 5;   // Thin lines
    
        for (let i = 0; i < numLines; i++) {
            const x1 = Math.random() * canvas.width;
            const y1 = Math.random() * canvas.height;
            const lineLength = Math.random() * 8 + 8; // Line length: 4 to 12 pixels
            const angle = 0 * Math.PI * 0.5; // Mostly vertical/diagonal-ish lines
    
            const x2 = x1 + Math.cos(angle) * lineLength;
            const y2 = y1 + Math.sin(angle) * lineLength;
    
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    
        // How the texture repeats on the top face of the grey edge strip.
        // The top face is greyEdgeStripWidth wide and segmentLength long.
        // We want 1 repeat across the width (greyEdgeStripWidth).
        const repeatsAcross = 1;
        // We want the texture (textureHeight) to cover, say, 5 world units of length.
        const worldUnitsCoveredByTextureHeight = 5.0;
        const repeatsAlong = this.segmentLength / worldUnitsCoveredByTextureHeight;
    
        texture.repeat.set(repeatsAcross, repeatsAlong);
        texture.needsUpdate = true; // Important for canvas textures
    
        return texture;
    }
}
