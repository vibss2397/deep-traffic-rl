function Enemy() {
  this.top = 0;
  this.bottom = height;
  this.x1 = 2.2*width/16;
  this.interspace = width/6;  
  this.speed = (Math.random()*1.2)+1;
  this.rando = Math.floor((Math.random() * (Math.floor(4)-Math.ceil(1)+1))+1);
  this.highlight = false;
  this.final=this.x1+2*this.rando*width/16;

  this.hits = function(car,img) {
    if(car.x==this.x1+2*this.rando*width/16){
        while((int)(this.top+img.height/5.7)>=car.y &&(int)(this.top)<=(car.y+height/5.9) ){
            return true;
        }
    }
     return false;
  }

  this.show = function(img) {
   noTint();
      if(this.highlight){
        tint(0, 153, 204, 126); // Tint blue and set transparency
    }  
    image(img,this.x1+2*this.rando*width/16,this.top,img.width/5.7,img.height/5.7);
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