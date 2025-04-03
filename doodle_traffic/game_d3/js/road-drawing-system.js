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
        this.roadWidth = 5;          // Width of the road
        this.visibleSegments = 8;    // How many segments to show ahead (including flying-in)
        this.segmentsBehind = 4;     // How many segments to keep behind
        
        // Animation parameters
        this.flyInDistance = 30;     // How far below segments start
        this.flyInDuration = 0.8;    // How long it takes for segments to fly in (seconds)
        
        // Road position tracking
        this.currentX = 0;
        this.currentZ = 0;
        this.currentAngle = 0;       // Direction the road is facing (radians)
        
        // Segment generation controls
        this.turnCounter = 0;
        this.segmentCounter = 0;
        this.straightSegmentsBeforeTurn = 8;
        
        // Debug mode
        this.debug = true;
    }
    
    init() {
        console.log("Initializing simplified road system");
        
        // Generate initial segments
        this.generateInitialSegments();
    }
    
    // Create a new road segment
    createSegment(type, startX = 0, startZ = 0, startAngle = 0) {
        let segment;
        
        // Check if we can recycle a segment from the pool
        if (this.segmentPool.length > 0) {
            segment = this.segmentPool.pop();
            segment.userData.type = type;
            
            // Reset position
            segment.position.set(startX, 0, startZ);
            segment.rotation.y = startAngle;
            
            // Clear any children
            while (segment.children.length > 0) {
                segment.remove(segment.children[0]);
            }
            
            // Rebuild segment
            this.buildSegmentContent(segment, type);
        } else {
            // Create a new segment group
            segment = new THREE.Group();
            segment.userData.type = type;
            segment.userData.isRoadSegment = true;
            segment.userData.length = this.segmentLength;
            
            // Set initial position
            segment.position.set(startX, 0, startZ);
            segment.rotation.y = startAngle;
            
            // Build content
            this.buildSegmentContent(segment, type);
        }
        
        // Add to scene
        this.scene.add(segment);
        
        if (this.debug) {
            console.log(`Created segment of type ${type} at x:${startX.toFixed(2)}, z:${startZ.toFixed(2)}`);
        }
        
        return segment;
    }
    
    // Build the road segment visuals
    buildSegmentContent(segment, type) {
        // Create road geometry based on segment type
        let roadGeometry;
        
        switch(type) {
            case 'left_turn':
                roadGeometry = this.createCurvedRoadGeometry(true);  // Left turn
                break;
            case 'right_turn':
                roadGeometry = this.createCurvedRoadGeometry(false);  // Right turn
                break;
            case 'straight':
            default:
                roadGeometry = new THREE.PlaneGeometry(
                    this.roadWidth, 
                    this.segmentLength,
                    10, 10
                );
                break;
        }
        
        // Create notebook paper texture
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        
        // Fill with off-white color
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        
        // Horizontal lines
        const lineSpacing = 32;
        for (let y = 0; y < canvas.height; y += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let x = 0; x < canvas.width; x += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, this.segmentLength / 20);
        
        // Create material
        const roadMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create road surface
        const roadSurface = new THREE.Mesh(roadGeometry, roadMaterial);
        roadSurface.rotation.x = -Math.PI / 2;  // Lay flat
        roadSurface.position.y = 0;
        roadSurface.receiveShadow = true;
        
        // Position adjustment for curved segments
        if (type === 'left_turn' || type === 'right_turn') {
            roadSurface.position.z = 0;
            roadSurface.position.x = 0;
        } else {
            roadSurface.position.z = this.segmentLength / 2;
        }
        
        segment.add(roadSurface);
        
        // Add simple road markings
        this.addRoadMarkings(segment, type);
        
        // Store reference for animations
        segment.userData.roadSurface = roadSurface;
    }
    
    // Create curved road geometry for turns
    createCurvedRoadGeometry(isLeftTurn) {
        const radius = this.segmentLength / 2;
        const segments = 20;
        
        const roadGeometry = new THREE.PlaneGeometry(
            this.roadWidth,
            this.segmentLength,
            20,
            20
        );
        
        const position = roadGeometry.getAttribute('position');
        
        // Deform the plane into a curved road
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const z = position.getZ(i);
            
            const t = (z + this.segmentLength/2) / this.segmentLength;
            const angle = t * Math.PI/2;
            
            let newX, newZ;
            
            if (isLeftTurn) {
                newX = x + radius * (Math.cos(angle) - 1);
                newZ = radius * Math.sin(angle);
            } else {
                newX = x + radius * (1 - Math.cos(angle));
                newZ = radius * Math.sin(angle);
            }
            
            position.setX(i, newX);
            position.setZ(i, newZ);
        }
        
        position.needsUpdate = true;
        roadGeometry.computeVertexNormals();
        
        return roadGeometry;
    }
    
    // Add simple road markings to a segment
    addRoadMarkings(segment, type) {
        // Material for lane markings
        const lineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7, 
            metalness: 0.1
        });
        
        // Add markings based on segment type
        if (type === 'left_turn' || type === 'right_turn') {
            this.addCurvedMarkings(segment, type === 'left_turn', lineMaterial);
        } else {
            this.addStraightMarkings(segment, lineMaterial);
        }
    }
    
    // Add markings for straight road segments
    addStraightMarkings(segment, material) {
        const width = 0.1;
        const length = this.segmentLength;
        
        // Left edge
        const leftEdgeGeometry = new THREE.PlaneGeometry(width, length);
        const leftEdge = new THREE.Mesh(leftEdgeGeometry, material);
        leftEdge.position.set(-this.roadWidth/2, 0.01, length/2);
        leftEdge.rotation.x = -Math.PI / 2;
        segment.add(leftEdge);
        
        // Right edge
        const rightEdgeGeometry = new THREE.PlaneGeometry(width, length);
        const rightEdge = new THREE.Mesh(rightEdgeGeometry, material);
        rightEdge.position.set(this.roadWidth/2, 0.01, length/2);
        rightEdge.rotation.x = -Math.PI / 2;
        segment.add(rightEdge);
        
        // Center dashed lines
        const centerLineSpacing = 2;
        const centerLineDash = 1;
        const totalLines = Math.floor(length / (centerLineSpacing + centerLineDash));
        
        for (let i = 0; i < totalLines; i++) {
            const z = i * (centerLineSpacing + centerLineDash) + centerLineDash/2;
            const centerLineGeometry = new THREE.PlaneGeometry(width, centerLineDash);
            const centerLine = new THREE.Mesh(centerLineGeometry, material);
            centerLine.position.set(0, 0.01, z);
            centerLine.rotation.x = -Math.PI / 2;
            segment.add(centerLine);
        }
    }
    
    // Add simple curved markings
    addCurvedMarkings(segment, isLeftTurn, material) {
        const radius = this.segmentLength / 2;
        
        // Add edge lines
        const edges = [
            { radius: radius + this.roadWidth/2, isInner: false },
            { radius: radius - this.roadWidth/2, isInner: true }
        ];
        
        edges.forEach(edge => {
            const points = [];
            const segments = 20;
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI / 2;
                let x, z;
                
                if (isLeftTurn) {
                    x = edge.radius * Math.cos(angle) - edge.radius;
                    z = edge.radius * Math.sin(angle);
                } else {
                    x = edge.radius - edge.radius * Math.cos(angle);
                    z = edge.radius * Math.sin(angle);
                }
                
                points.push(new THREE.Vector3(x, 0.01, z));
            }
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, material);
            segment.add(line);
        });
        
        // Add center dashed line
        const dashLength = 1;
        const gapLength = 2;
        const totalLength = Math.PI * radius / 2;
        const totalDashes = Math.floor(totalLength / (dashLength + gapLength));
        
        for (let i = 0; i < totalDashes; i++) {
            const startAngle = (i * (dashLength + gapLength)) / totalLength * Math.PI / 2;
            const endAngle = ((i * (dashLength + gapLength)) + dashLength) / totalLength * Math.PI / 2;
            
            if (endAngle > Math.PI/2) continue;
            
            const points = [];
            const dashSegments = 5;
            
            for (let j = 0; j <= dashSegments; j++) {
                const angle = startAngle + (j / dashSegments) * (endAngle - startAngle);
                let x, z;
                
                if (isLeftTurn) {
                    x = radius * Math.cos(angle) - radius;
                    z = radius * Math.sin(angle);
                } else {
                    x = radius - radius * Math.cos(angle);
                    z = radius * Math.sin(angle);
                }
                
                points.push(new THREE.Vector3(x, 0.01, z));
            }
            
            const dashGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const dash = new THREE.Line(dashGeometry, material);
            segment.add(dash);
        }
    }
    
    // Generate initial road segments
    generateInitialSegments() {
        const totalInitialSegments = this.visibleSegments + this.segmentsBehind - 1;
        // Start with segments behind (already complete)
        for (let i = 0; i < this.segmentsBehind; i++) {
            const z = this.segmentsBehind * this.segmentLength - i * this.segmentLength;
            const segment = this.createSegment('straight', 0, z, 0);
            
            // These segments are already complete
            segment.userData.state = SegmentState.COMPLETE;
            
            // Add to segments array
            this.segments.push(segment);
        }
        
        // Then add visible segments ahead (except the last one)
        for (let i = 0; i < this.visibleSegments - 1; i++) {
            const z = -i * this.segmentLength;
            const segment = this.createSegment('straight', 0, z, 0);
            
            // These segments are already complete
            segment.userData.state = SegmentState.COMPLETE;
            
            // Add to segments array
            this.segments.push(segment);
        }
        
        // Add the last segment as flying-in
        const lastZ = -(this.visibleSegments - 1) * this.segmentLength;
        const lastSegment = this.createSegment('straight', 0, lastZ, 0);
        
        // Set this segment to fly in
        lastSegment.userData.state = SegmentState.FLYING_IN;
        lastSegment.userData.animationStart = performance.now() / 1000;
        lastSegment.position.y = -this.flyInDistance;  // Start below ground
        
        // Add to segments array
        this.segments.push(lastSegment);
        
        console.log(`Generated ${totalInitialSegments + 1} initial segments, last one is flying in`);
    }
    
    // Generate the next road segment ahead
    generateNextSegment() {
        console.log(`generateNextSegment called. Current segment count: ${this.segments.length}`);

        // Ensure segments array is not empty
        if (this.segments.length === 0) {
            console.error("!!! ERROR: generateNextSegment called with empty segments array!");
            return;
        }

        // Get the last segment
        const lastSegment = this.segments[this.segments.length - 1];

        // Basic check for lastSegment validity
        if (!lastSegment || typeof lastSegment.position === 'undefined') {
            console.error("!!! ERROR: lastSegment is invalid!", lastSegment);
            return;
        }

        // --- SIMPLIFICATION START ---
        // Force segment type to straight
        const nextType = 'straight';

        // Calculate position based *only* on the last segment being straight
        let startX = lastSegment.position.x; // Keep X the same for straight road
        let startZ = lastSegment.position.z - this.segmentLength; // Ensure Z decreases
        let startAngle = lastSegment.rotation.y; // Keep angle the same

        // Remove all logic related to turn counters, lastType checks, and turn adjustments
        // this.segmentCounter++; // No longer needed
        // if (this.segmentCounter >= ...) { ... } // Remove turn triggering
        // if (lastType === 'left_turn') { ... } // Remove left turn adjustment block
        // if (lastType === 'right_turn') { ... } // Remove right turn adjustment block
        // --- SIMPLIFICATION END ---


        // Create the new segment (will always be 'straight')
        const newSegment = this.createSegment(nextType, startX, startZ, startAngle);

        // Set as flying in
        newSegment.userData.state = SegmentState.FLYING_IN;
        newSegment.userData.animationStart = performance.now() / 1000;
        // --- Temporarily keep Y set for fly-in ---
        newSegment.position.y = -this.flyInDistance;  // Start below ground


        // Logging (ensure lastSegment properties are accessed safely if needed)
        console.log(">>> GENERATING NEW SEGMENT (Straight Only) <<<", {
            lastSegmentZ: lastSegment.position.z,
            generatedType: nextType, // Will always be 'straight'
            generatedStartZ: startZ
        });
        console.log(`>>> New segment INITIAL Y: ${newSegment.position.y}`);


        // Add to segments array
        this.segments.push(newSegment);

        console.log(`>>> Segment pushed. Total segments: ${this.segments.length}`);

        return newSegment;
    }
    
    
    // Update system based on player position
    update(playerZ, deltaTime) {
        const currentTime = performance.now() / 1000;
        const removalThresholdZ = playerZ - (this.segmentsBehind * this.segmentLength);

        // Check if we need to remove old segments behind
        if (this.segments.length > 0) {
            // Keep removing segments that are too far behind the player
            while (this.segments.length > this.visibleSegments + this.segmentsBehind && // Ensure we don't remove too many
                this.segments[0].position.z < removalThresholdZ)
            {
                const oldSegment = this.segments.shift();
                
                // Move to pool for recycling
                this.scene.remove(oldSegment);
                this.segmentPool.push(oldSegment);
                
                if (this.debug) {
                    console.log("Removed old segment, recycled to pool");
                }
            }
        }
        
        // Check if we need to generate a new segment ahead
        if (this.segments.length > 0) {
            const lastSegment = this.segments[this.segments.length - 1];
            const lastSegmentEndZ = lastSegment.position.z - this.segmentLength; // Middle of last segment approx end
            // OR more simply: just check segment origin Z
            // const lastSegmentEndZ = lastSegment.position.z;
    
            const generationHorizonZ = playerZ - (this.visibleSegments - 1) * this.segmentLength;
            // Corrected condition: Generate if last segment Z is 'behind' (greater Z) the horizon
            const shouldGenerate = lastSegment.position.z < generationHorizonZ;
            console.log(`>>> ShouldGenerate: ${shouldGenerate} ` +
                        `lastSegment.pos.z=${lastSegment.position.z.toFixed(2)}, ` +
                        `horizonZ=${generationHorizonZ.toFixed(2)} 
                        playerZ=${playerZ.toFixed(2)}`);
    
            // Log the check values
            // console.log(`Update Check: playerZ=${playerZ.toFixed(2)}, ` +
            //             `lastSegment.pos.z=${lastSegment.position.z.toFixed(2)}, ` +
            //             // `lastSegmentEndZ=${lastSegmentEndZ.toFixed(2)}, ` + // Using simpler check now
            //             `horizonZ=${generationHorizonZ.toFixed(2)}, ` +
            //             `ShouldGenerate=${shouldGenerate}`);
    
    
            if (shouldGenerate) {
                 console.log(">>> Condition Met - Calling generateNextSegment() <<<");
                 this.generateNextSegment();
            }
    
        }
        
        // Update flying-in animation for any segments in that state
        this.segments.forEach((segment, index) => {
            if (segment.userData.state === SegmentState.FLYING_IN) {
                // Using deltaTime for frame-rate independent animation
                const startTime = segment.userData.animationStart;
                const currentTime = performance.now() / 1000;
                const elapsedTime = currentTime - startTime;
                
                // Store animation speed to allow faster/slower animation based on player speed
                // Higher deltaTime = more movement per frame
                const animationSpeed = 1.0 * deltaTime * 60; // Normalize for 60fps
                
                // GOogle telling to comment it ---
                // Calculate animation progress
                // Using a mix of elapsed time and delta time for smoother animation
                // let progress;
                
                /* if (!segment.userData.lastProgress) {
                    // First update for this segment
                    progress = Math.min(elapsedTime / this.flyInDuration, 1.0);
                    segment.userData.lastProgress = progress;
                } else {
                    // Calculate how much to move this frame based on deltaTime
                    const progressIncrement = (animationSpeed / this.flyInDuration);
                    progress = Math.min(segment.userData.lastProgress + progressIncrement, 1.0);
                    segment.userData.lastProgress = progress;
                } */

                const progress = Math.min(elapsedTime / this.flyInDuration, 1.0);
                
                // Ease-out function for smooth deceleration
                const easeOutProgress = 1 - Math.pow(1 - progress, 3);

                // --- ADD THIS LOG ---
                const targetY = -this.flyInDistance + (this.flyInDistance * easeOutProgress);
                // console.log(`Animating Segment [Index: ${index}, State: ${segment.userData.state}] - ` +
                //     `Elapsed: ${elapsedTime.toFixed(2)}s, ` +
                //     `Progress: ${progress.toFixed(3)}, ` +
                //     `Current Y: ${segment.position.y.toFixed(2)}, ` + // <<< Observe this value
                //     `Target Y: ${targetY.toFixed(2)}`); // <<< Compare with this value
                // --- END LOG ---
                
                // Animate Y position from below to road level
                segment.position.y = targetY;
                
                // Once complete, mark as complete
                if (progress >= 1.0) {
                    segment.position.y = 0;  // Ensure it's at exactly ground level
                    segment.userData.state = SegmentState.COMPLETE;
                    
                    delete segment.userData.animationStart;

                    if (this.debug) {
                        console.log(`Segment ${index} completed flying in (took ${elapsedTime.toFixed(2)}s)`);
                    }
                }
            }
        });
        
        // Debug output occasionally - reduced rate based on deltaTime
        if (this.debug && Math.random() < 0.01 * deltaTime * 60) {
            const flyingSegments = this.segments.filter(s => s.userData.state === SegmentState.FLYING_IN);
            if (flyingSegments.length > 0) {
                console.log(`Flying segments: ${flyingSegments.length}, at positions:`, 
                    flyingSegments.map(s => `y=${s.position.y.toFixed(2)}, z=${s.position.z.toFixed(2)}`));
            }
        }
    }
}