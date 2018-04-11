function Car() {
  this.y = height-120;
  this.x=6.2*width/16;
  this.highlight=false;
  this.show = function(img) {
    noTint();
    if(this.highlight){
        tint(0, 153, 204, 126); // Tint blue and set transparency
    } 
    image(img,this.x,this.y,img.width/5.7,img.height/5.7);
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