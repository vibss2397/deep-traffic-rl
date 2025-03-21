function Road() {
  this.top = 0;
  this.bottom = height;
  this.x1 = 3*width/8;
  this.x2 = 4*width/8;
  this.x3 = 5*width/8;
  this.interspace = width/6;
  this.height= 0;   
  this.speed = 4;

  this.highlight = false;

  this.hits = function(bird) {
    if (bird.y < this.top || bird.y > height - this.bottom) {
      if (bird.x > this.x && bird.x < this.x + this.w) {
        this.highlight = true;
        return true;
      }
    }
    this.highlight = false;
    return false;
  }

  this.show = function() {
    fill('#bbb');
    if (this.highlight) {
      fill(255, 0, 0);
    }
    strokeWeight(2); 
    rect(this.x1, this.height, 0, 12);
    rect(this.x2, this.height, 0, 12);
    rect(this.x3, this.height, 0, 12);
    
  }

  this.update = function() {
    this.height += this.speed;
  }

  this.offscreen = function() {
    if (this.height > height) {
      return true;
    } else {
      return false;
    }
  }


}