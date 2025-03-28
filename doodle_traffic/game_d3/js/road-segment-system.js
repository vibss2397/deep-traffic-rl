// Road segment system for dynamic road generation
import * as THREE from 'three';
import { createNotebookTexture } from './utils/texture-generator.js'; // Fixed import path

// Segment types enum
export const SegmentType = {
    STRAIGHT: 'straight',
    LEFT_TURN: 'left_turn',
    RIGHT_TURN: 'right_turn'
};

// Road segment manager class
export class RoadSegmentManager {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.segmentPool = []; // For recycling segments
        this.activeSegments = [];
        
        // Configuration - adjusted for better visibility
        this.segmentLength = 40;    // Length of each segment
        this.roadWidth = 5;         // Width of the road
        this.segmentsAhead = 12;    // Increased to see further ahead
        this.segmentsBehind = 6;    // Increased for smoother transitions
        
        // Track total road length for distance calculation
        this.totalRoadLength = 0;
        
        // Starting position
        this.startZ = 0;
        
        // Tracking for curved segments
        this.currentX = 0;
        this.currentZ = 0;
        this.currentAngle = 0; // Direction the road is facing (in radians)
        
        // For texture scrolling
        this.scrollableTextures = [];
        
        // Turn pattern control - adjusted for smoother gameplay
        this.turnCounter = 0;
        this.segmentCounter = 0;
        this.straightSegmentsBeforeTurn = 8; // More straight segments before turns
        
        // Debug
        this.debug = true;
    }
    
    // Initialize the road system
    init() {
        console.log("Initializing road segment system");
        // Generate initial segments
        this.generateInitialSegments();
    }
    
    // Create a new segment of the specified type
    createSegment(type = SegmentType.STRAIGHT, startX = 0, startZ = 0, startAngle = 0) {
        let segment;
        
        // Check if we can recycle a segment from the pool
        if (this.segmentPool.length > 0) {
            segment = this.segmentPool.pop();
            segment.userData.type = type;
            // Reset segment position
            segment.position.set(startX, 0, startZ);
            segment.rotation.y = startAngle;
            
            // Clear any children (road markings, etc.)
            while (segment.children.length > 0) {
                segment.remove(segment.children[0]);
            }
            
            // Rebuild the segment with new geometry
            this.buildSegmentContent(segment, type);
        } else {
            // Create a new segment
            segment = this.buildSegment(type, startX, startZ, startAngle);
        }
        
        // Add to active segments
        this.activeSegments.push(segment);
        
        if (this.debug) {
            console.log(`Created ${type} segment at x:${startX.toFixed(2)}, z:${startZ.toFixed(2)}, angle:${(startAngle * 180 / Math.PI).toFixed(2)}°`);
        }
        
        // Add to scene
        this.scene.add(segment);
        
        return segment;
    }
    
    // Build a physical segment based on type
    buildSegment(type, startX, startZ, startAngle) {
        const segment = new THREE.Group();
        segment.userData.type = type;
        segment.userData.isRoadSegment = true;
        segment.userData.length = this.segmentLength;
        
        // Set initial position
        segment.position.set(startX, 0, startZ);
        segment.rotation.y = startAngle;
        
        // Build the segment content
        this.buildSegmentContent(segment, type);
        
        return segment;
    }
    
    // Build the content of a segment (road surface, markings, etc.)
    buildSegmentContent(segment, type) {
        let roadGeometry;
        
        switch(type) {
            case SegmentType.LEFT_TURN:
                // Create a curved road geometry for left turn
                roadGeometry = this.createCurvedRoadGeometry(true); // true for left turn
                break;
                
            case SegmentType.RIGHT_TURN:
                // Create a curved road geometry for right turn
                roadGeometry = this.createCurvedRoadGeometry(false); // false for right turn
                break;
                
            case SegmentType.STRAIGHT:
            default:
                // Create a straight segment
                roadGeometry = new THREE.PlaneGeometry(
                    this.roadWidth, 
                    this.segmentLength,
                    10, 20
                );
                break;
        }
        
        // Create road surface with notebook texture
        const notebookTexture = createNotebookTexture();
        // Adjust texture settings for better continuity between segments
        notebookTexture.wrapS = THREE.RepeatWrapping;
        notebookTexture.wrapT = THREE.RepeatWrapping;
        notebookTexture.repeat.set(1, this.segmentLength / 20);
        
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
        
        // Positioning adjustments for different segment types
        if (type === SegmentType.LEFT_TURN || type === SegmentType.RIGHT_TURN) {
            // For turns, center the road surface on the origin of the segment
            roadSurface.position.z = 0;
            roadSurface.position.x = 0;
        } else {
            // For straight segments, center the road
            roadSurface.position.z = this.segmentLength / 2;
        }
        
        segment.add(roadSurface);
        
        // Add road markings based on segment type
        this.addRoadMarkings(segment, type);
        
        // Store reference to material for texture updates
        segment.userData.roadSurface = roadSurface;
        segment.userData.material = roadSurface.material;
        segment.userData.texture = notebookTexture;
        
        // Track this segment's texture for scrolling
        if (roadSurface.material.map) {
            this.scrollableTextures.push({
                texture: roadSurface.material.map,
                object: roadSurface
            });
        }
    }
    
    // Create a curved road geometry for turns
    createCurvedRoadGeometry(isLeftTurn) {
        // Parameters for the turn
        const radius = this.segmentLength / 2; // Radius based on segment length for 90° turn
        const segments = 20; // Increased for smoother curves
        
        // Create a simple plane geometry that we'll deform
        const roadGeometry = new THREE.PlaneGeometry(
            this.roadWidth,
            this.segmentLength,
            20,
            20
        );
        
        // Get position attribute
        const position = roadGeometry.getAttribute('position');
        
        // Deform the plane to create a curved road
        for (let i = 0; i < position.count; i++) {
            // Get current vertex position
            const x = position.getX(i);
            const z = position.getZ(i);
            
            // Normalize z coordinate to t parameter (0 to 1)
            // Adjust range to better match the segment length
            const t = (z + this.segmentLength/2) / this.segmentLength;
            
            // Angle for this point along the curve (0 to 90 degrees)
            const angle = t * Math.PI/2;
            
            // Calculate new position based on curve
            let newX, newZ;
            
            if (isLeftTurn) {
                // For left turn (curve to the negative X direction)
                newX = x + radius * (Math.cos(angle) - 1);
                newZ = radius * Math.sin(angle);
            } else {
                // For right turn (curve to the positive X direction)
                newX = x + radius * (1 - Math.cos(angle));
                newZ = radius * Math.sin(angle);
            }
            
            // Update vertex position
            position.setX(i, newX);
            position.setZ(i, newZ);
        }
        
        // Mark the position attribute as needing an update
        position.needsUpdate = true;
        
        // Update geometry bounds and normals
        roadGeometry.computeBoundingBox();
        roadGeometry.computeVertexNormals();
        
        return roadGeometry;
    }
    
    // Add road markings appropriate for the segment type
    addRoadMarkings(segment, type) {
        // Material for the lane dividers
        const lineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.1
        });
        
        switch(type) {
            case SegmentType.LEFT_TURN:
            case SegmentType.RIGHT_TURN:
                this.addTurnMarkings(segment, type === SegmentType.LEFT_TURN, lineMaterial);
                break;
                
            case SegmentType.STRAIGHT:
            default:
                this.addStraightMarkings(segment, lineMaterial);
                break;
        }
    }
    
    // Add markings for a straight road segment
    addStraightMarkings(segment, material) {
        const width = 0.1;
        const length = this.segmentLength;
        
        // Create left edge
        const leftEdgeGeometry = new THREE.PlaneGeometry(width, length);
        const leftEdge = new THREE.Mesh(leftEdgeGeometry, material);
        leftEdge.position.set(-this.roadWidth/2, 0.01, length/2);
        leftEdge.rotation.x = -Math.PI / 2;
        leftEdge.userData.isRoadMarking = true;
        segment.add(leftEdge);
        
        // Create right edge
        const rightEdgeGeometry = new THREE.PlaneGeometry(width, length);
        const rightEdge = new THREE.Mesh(rightEdgeGeometry, material);
        rightEdge.position.set(this.roadWidth/2, 0.01, length/2);
        rightEdge.rotation.x = -Math.PI / 2;
        rightEdge.userData.isRoadMarking = true;
        segment.add(rightEdge);
        
        // Create center lines (dashed)
        const centerLineSpacing = 2; // Space between dashes
        const centerLineDash = 1;    // Length of each dash
        const totalLines = Math.floor(length / (centerLineSpacing + centerLineDash));
        
        for (let i = 0; i < totalLines; i++) {
            const z = i * (centerLineSpacing + centerLineDash) + centerLineDash/2;
            const centerLineGeometry = new THREE.PlaneGeometry(width, centerLineDash);
            const centerLine = new THREE.Mesh(centerLineGeometry, material);
            centerLine.position.set(0, 0.01, z);
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.userData.isRoadMarking = true;
            segment.add(centerLine);
        }
        
        // Add transverse markers (across road) for better visual cues
        const transverseSpacing = 10; // Space between markers
        const totalTransverse = Math.floor(length / transverseSpacing);
        
        for (let i = 0; i < totalTransverse; i++) {
            const z = i * transverseSpacing + transverseSpacing/2;
            const transverseGeometry = new THREE.PlaneGeometry(this.roadWidth * 0.95, width);
            const transverseLine = new THREE.Mesh(transverseGeometry, material);
            transverseLine.position.set(0, 0.007, z); // Slightly lower than other markings
            transverseLine.rotation.x = -Math.PI / 2;
            transverseLine.userData.isRoadMarking = true;
            segment.add(transverseLine);
        }
    }
    
    // Add markings for a turning road segment
    addTurnMarkings(segment, isLeftTurn, material) {
        const width = 0.1;
        const radius = this.segmentLength / 2;
        const segmentCount = 12;
        
        // Create edge markings for turn
        this.addCurvedMarkings(segment, radius + this.roadWidth / 2, isLeftTurn, material); // Outer edge
        this.addCurvedMarkings(segment, radius - this.roadWidth / 2, isLeftTurn, material); // Inner edge
        
        // Create center line (dashed)
        this.addCurvedDashedLine(segment, radius, isLeftTurn, material);
        
        // Add some transverse markers for better visual cues
        for (let i = 0; i < 4; i++) {
            const angle = (i / 3) * Math.PI / 2; // Distribute evenly over 90 degrees
            this.addTransverseMarker(segment, radius, angle, isLeftTurn, material);
        }
    }
    
    // Add a curved road marking
    addCurvedMarkings(segment, radius, isLeftTurn, material) {
        const curve = new THREE.EllipseCurve(
            0, 0,             // Center x, y
            radius, radius,   // X and Y radius
            0, Math.PI/2,     // Start angle, end angle (0 to 90 degrees)
            !isLeftTurn       // Clockwise for right turns, counterclockwise for left turns
        );
        
        // Get points from the curve
        const points = curve.getPoints(20);
        
        // Convert 2D points to 3D
        const path = new THREE.CurvePath();
        
        for (let i = 0; i < points.length - 1; i++) {
            const startPoint = points[i];
            const endPoint = points[i + 1];
            
            // For left turn, convert (x,y) to (x,z)
            // For right turn, convert (x,y) to (-x,z)
            const start3D = isLeftTurn ?
                new THREE.Vector3(startPoint.x, 0.01, startPoint.y) :
                new THREE.Vector3(startPoint.x, 0.01, startPoint.y);
                
            const end3D = isLeftTurn ?
                new THREE.Vector3(endPoint.x, 0.01, endPoint.y) :
                new THREE.Vector3(endPoint.x, 0.01, endPoint.y);
            
            // Create line segment
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([start3D, end3D]);
            const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 }));
            line.userData.isRoadMarking = true;
            segment.add(line);
        }
    }
    
    // Add a dashed center line along a curve
    addCurvedDashedLine(segment, radius, isLeftTurn, material) {
        const dashLength = 1;
        const gapLength = 2;
        const totalLength = Math.PI * radius / 2; // Quarter circle perimeter
        const totalDashes = Math.floor(totalLength / (dashLength + gapLength));
        
        for (let i = 0; i < totalDashes; i++) {
            const startAngle = (i * (dashLength + gapLength)) / totalLength * Math.PI / 2;
            const endAngle = ((i * (dashLength + gapLength)) + dashLength) / totalLength * Math.PI / 2;
            
            if (endAngle > Math.PI/2) continue; // Skip if beyond the curve
            
            const curve = new THREE.EllipseCurve(
                0, 0,                  // Center x, y
                radius, radius,        // X and Y radius
                startAngle, endAngle,  // Start and end angle
                !isLeftTurn            // Clockwise for right turns, counterclockwise for left turns
            );
            
            // Get points from the curve
            const points = curve.getPoints(5);
            
            // Convert 2D points to 3D
            const path3D = [];
            for (const point of points) {
                path3D.push(isLeftTurn ?
                    new THREE.Vector3(point.x, 0.01, point.y) :
                    new THREE.Vector3(point.x, 0.01, point.y));
            }
            
            // Create line segment
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(path3D);
            const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 }));
            line.userData.isRoadMarking = true;
            segment.add(line);
        }
    }
    
    // Add transverse marker across the road at specified angle
    addTransverseMarker(segment, radius, angle, isLeftTurn, material) {
        // Calculate center point of the transverse line
        const centerX = isLeftTurn ? 
            radius * Math.cos(angle) :
            radius * Math.cos(angle);
        const centerZ = radius * Math.sin(angle);
        
        // Calculate direction perpendicular to the curve at this point
        const dirX = isLeftTurn ? Math.sin(angle) : -Math.sin(angle);
        const dirZ = Math.cos(angle);
        
        // Create line points extended in both directions
        const start = new THREE.Vector3(
            centerX - dirX * this.roadWidth/2,
            0.007,
            centerZ - dirZ * this.roadWidth/2
        );
        
        const end = new THREE.Vector3(
            centerX + dirX * this.roadWidth/2,
            0.007,
            centerZ + dirZ * this.roadWidth/2
        );
        
        // Create line segment
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 }));
        line.userData.isRoadMarking = true;
        segment.add(line);
    }
    
    // Generate the initial set of road segments
    generateInitialSegments() {
        // Start with more straight segments to ensure a better initial view
        const initialSegmentCount = this.segmentsAhead + this.segmentsBehind;
        for (let i = 0; i < initialSegmentCount; i++) {
            const z = -this.segmentsBehind * this.segmentLength + i * this.segmentLength;
            const segment = this.createSegment(SegmentType.STRAIGHT, 0, z, 0);
            this.segments.push(segment);
        }
        console.log(`Generated ${initialSegmentCount} initial segments`);
    }
    
    // Update the road based on player position
    update(playerZ) {
        // Check if we need to generate more segments ahead
        const lastSegment = this.segments[this.segments.length - 1];
        const lastSegmentEndZ = lastSegment.position.z + this.segmentLength;
        
        // If player is getting close to the end of generated road, add more segments
        // Increased buffer to ensure segments are generated well ahead of the player
        if (playerZ + (this.segmentsAhead * this.segmentLength) > lastSegmentEndZ) {
            this.generateNextSegment();
            console.log(`Generated new segment at z=${lastSegmentEndZ}, player at z=${playerZ}`);
        }
        
        // Remove segments too far behind the player but ensure we always keep
        // a minimum number of segments
        this.removeDistantSegments(playerZ);
    }
    
    // Generate the next road segment
    generateNextSegment() {
        // Get the last segment to determine where to start the new one
        const lastSegment = this.segments[this.segments.length - 1];
        const lastSegmentType = lastSegment.userData.type;
        
        // Increment the segment counter
        this.segmentCounter++;
        
        // Calculate the starting position for the new segment
        let startX = lastSegment.position.x;
        let startZ = lastSegment.position.z + this.segmentLength;
        let startAngle = lastSegment.rotation.y;
        
        // Determine next segment type
        let nextType = SegmentType.STRAIGHT;
        
        // If we've had enough straight segments, create a turn
        if (this.segmentCounter >= this.straightSegmentsBeforeTurn && lastSegmentType === SegmentType.STRAIGHT) {
            // Alternate between left and right turns
            nextType = (this.turnCounter % 2 === 0) ? SegmentType.LEFT_TURN : SegmentType.RIGHT_TURN;
            this.turnCounter++;
            this.segmentCounter = 0; // Reset counter after a turn
        }
        
        // If the last segment was a turn, update position and angle for the next segment
        if (lastSegmentType === SegmentType.LEFT_TURN) {
            // After a left turn, the next segment should be positioned correctly
            // For a 90-degree left turn:
            const radius = this.segmentLength / 2;
            startX = lastSegment.position.x - radius;
            startZ = lastSegment.position.z + radius;
            startAngle = startAngle - Math.PI / 2; // 90 degrees left
            
            // Force next segment to be straight after a turn
            nextType = SegmentType.STRAIGHT;
            
            console.log(`LEFT TURN: New segment at x:${startX.toFixed(2)}, z:${startZ.toFixed(2)}, angle:${(startAngle * 180 / Math.PI).toFixed(2)}°`);
        } 
        else if (lastSegmentType === SegmentType.RIGHT_TURN) {
            // After a right turn, the next segment should be positioned correctly
            // For a 90-degree right turn:
            const radius = this.segmentLength / 2;
            startX = lastSegment.position.x + radius;
            startZ = lastSegment.position.z + radius;
            startAngle = startAngle + Math.PI / 2; // 90 degrees right
            
            // Force next segment to be straight after a turn
            nextType = SegmentType.STRAIGHT;
            
            console.log(`RIGHT TURN: New segment at x:${startX.toFixed(2)}, z:${startZ.toFixed(2)}, angle:${(startAngle * 180 / Math.PI).toFixed(2)}°`);
        }
        
        // Create the new segment
        const newSegment = this.createSegment(nextType, startX, startZ, startAngle);
        
        // Add to segments array
        this.segments.push(newSegment);
        
        // Update total road length
        this.totalRoadLength += this.segmentLength;
    }
    
    // Remove segments that are too far behind the player
    removeDistantSegments(playerZ) {
        // Only remove segments if we have more than the minimum required
        if (this.segments.length <= this.segmentsBehind + this.segmentsAhead) {
            return;
        }
        
        const firstSegment = this.segments[0];
        const segmentEndZ = firstSegment.position.z + this.segmentLength;
        
        // Only remove if it's substantially behind the player to avoid any popping effects
        if (segmentEndZ < playerZ - (this.segmentsBehind * this.segmentLength * 1.5)) {
            // Remove from scene and add to pool
            this.scene.remove(firstSegment);
            this.segmentPool.push(firstSegment);
            
            // Remove from active array
            const index = this.activeSegments.indexOf(firstSegment);
            if (index !== -1) {
                this.activeSegments.splice(index, 1);
            }
            
            // Remove from segments array
            this.segments.shift();
            
            if (this.debug) {
                console.log(`Removed segment at z:${firstSegment.position.z.toFixed(2)}, playerZ:${playerZ.toFixed(2)}`);
            }
        }
    }
    
    // Get the texture array for scrolling
    getScrollableTextures() {
        return this.scrollableTextures;
    }
}