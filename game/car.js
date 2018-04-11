function Car() {
  this.y = height-80;
  this.x=6.2*width/16;

  this.gravity = 0.6;
  this.lift = -15;
  this.velocity = 0;
  
  this.show = function(img) {
    fill(255);
    image(img,this.x,this.y,img.width/6,img.height/6);
  }


  this.doSomething = function(action) {
    if(action=='left'){
     if(this.x>5.3*width/16){
         this.x-=width/8;
     } 
    } 
     else if(action=='right'){
       if(this.x<10.2*width/16){
         this.x+=width/8;
        }  
    }

  }

}