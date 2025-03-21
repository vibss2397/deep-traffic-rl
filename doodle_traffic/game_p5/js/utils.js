/**
 * Utility functions for the Doodle Dash game
 */

// Draw a sketchy circle with hand-drawn effect
function drawSketchyCircle(x, y, diameter) {
    push();
    translate(x, y);
    
    beginShape();
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let r = diameter/2 + random(-1, 1);
      let px = cos(angle) * r;
      let py = sin(angle) * r;
      curveVertex(px, py);
    }
    endShape(CLOSE);
    
    pop();
  }