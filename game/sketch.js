var x = 100;
var y = 100;

var roads=[];
var car;
var enemies=[];

var img;
var img2;

function preload() {
    img = loadImage('assets/police.png');
    img2 = loadImage('assets/car.png');
}

function getLevel(){
    return(Math.floor(frameCount/100));
}

function getEnemyNumber(level){
     min = Math.ceil(1);
     max = Math.floor(4);
    return 2;
}

function pushEnemyToArray(number){
    temp=[0,0,0,0];
    var same=0;
    for(var i=0;i<number;i++){
        var a=new Enemy();
        if(temp[a.rando-1]==1){
            for(let j=3;j>=0;j--){
                if(temp[j]==0){
                    a.rando=j+1;
                    temp[j]=1;
                    break;
                }
            }
        } else temp[a.rando]=1;
        
        if(enemies.length!=0){
            for(let j=0;j<enemies.length;j++){
                if(enemies[j].rando==a.rando){
                    if(enemies[j].speed<a.speed){
                        same=1;
                    }
                    
                } else {same=1;}
            }
        }else same=1;
        console.log(temp);
        if(same==1){enemies.push(a);}
    }
}

function setup() {
  createCanvas(500, 500);
 for(var i=0; i<34 ;i++){
     roads.push(new Road());
 }
car=new Car();
enemy=new Enemy();    
}

function draw() {
  background(255);
  fill(0);
  
  stroke('#bbb');
  strokeWeight(2);
  
  line(width/4, 0, width/4, height);
  line(3*width/4, 0, 3*width/4, height);
  strokeWeight(0);
    
    for (var i = roads.length-1; i >= 0; i--) {
        roads[i].show();
        roads[i].update(); 
        
        if (roads[i].offscreen()) {
            roads.splice(i, 1);
        }
    }
    
    if (frameCount % 5 == 0) {
            roads.push(new Road());
        }
    if(frameCount>134){
        car.show(img);
        if(frameCount%300==0){
            var en=getEnemyNumber(getLevel());
            pushEnemyToArray(en);
        }
        
    }
    for(var i=enemies.length-1;i>=0;i--){
            enemies[i].show(img2);
            
            enemies[i].update();
            
               if (enemies[i].hits(car)) {
                    console.log("HIT");
                }
            if(enemies[i].offscreen()){
                enemies.splice(i,1);
            }
        }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    car.doSomething('left');
    //console.log("SPACE");
  }
    else if (keyCode === RIGHT_ARROW) {
    car.doSomething('right');
    //console.log("SPACE");
  }
}