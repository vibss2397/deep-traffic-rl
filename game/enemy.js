function Enemy() {
  this.top = 0;
  this.bottom = height;
  this.x1 = 2.2*width/16;
  this.interspace = width/6;
  this.height= 0;   
  this.speed = (Math.random()*1.2)+0.5;
  this.rando = Math.floor((Math.random() * (Math.floor(4)-Math.ceil(1)+1))+1);
  this.highlight = false;
  this.final=this.x1+2*this.rando*width/16;

  this.hits = function(car) {
    if(car.x==this.final){
        if(car.y==this.top) return true;
    }
     else return false;
  }

  this.show = function(img) {
    fill('#bbb');
    if (this.highlight) {
      fill(255, 0, 0);
    }
    strokeWeight(2);  
    image(img,this.final,this.top,img.width/7,img.height/7)
  }
  
//  this.setSpeed=function(level){
//      this.speed+=level/100;
//  }

  this.update = function() {
    this.top += this.speed;
  }

  this.offscreen = function() {
    if (this.top > height) {
      return true;
    } else {
      return false;
    }
  }


}