var x = 100;
var y = 100;

var roads=[];
var car;
var enemies=[];

var img;
var img2;

function preload() {
    img2 = loadImage('assets/police.png');
    img = loadImage('assets/car.png');
}

function getLevel(){
    return Math.floor(frameCount/5);
}

function getEnemyNumber(level){
     min = Math.ceil(1);
     max = Math.floor(3);
     var a;    
    if(level<=500){
                a=Math.floor(Math.random()*1)+1;
    }
    else if(level>500 && level<=1000){
    a=Math.floor(Math.random()*2)+1;}
    else if(level>1000 && level<=2500){
    a=Math.floor(Math.random()*3)+1;}
    else if(level>2500){
    a=Math.floor(Math.random()*4)+1;}
    return a;
}

function pushEnemyToArray(number){
    temp=[0,0,0,0];
    var same=0;
    var a;
    for(var i=0;i<number;i++){
        a=new Enemy();
        if(temp[a.rando-1]==1){
            for(let j=3;j>=0;j--){
                if(temp[j]==0){
                    a.rando=j+1;
                    temp[j]=1;
                    break;
                }
            }
        } else temp[a.rando-1]=1;
        
        if(enemies.length!=0){
            for(let j=0;j<enemies.length;j++){
                if(enemies[j].rando==a.rando){
                    if(enemies[j].speed<a.speed){
                        same=0
                    } else same=1;
                    
                } else same=1;
            }
        }else same=1;
        if(same==1){enemies.push(a);}
    }
}

function setup() {
 createCanvas(500, windowHeight);    
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
        let a=Math.floor(frameCount/5);
        fill(0);
        textSize(18);
        text('Score : '+a,width-100,32);
        
        if(frameCount%300==0){
            var en=getEnemyNumber(getLevel());
            console.log(getLevel()+'----'+en);
            pushEnemyToArray(en);
        }
     if(car.highlight==true){
         text('Reward : -1',width-100,60);
     } else text('Reward : 1',width-100,60);   
    }
    for(let k=enemies.length-1;k>=0;k--){
            enemies[k].show(img2);
            
            enemies[k].update();
            
               if (enemies[k].hits(car,img)) {
                    enemies[k].highlight=true;
                   car.highlight=true;
                } else {
                    car.highlight=false;
                    enemies[k].highlight=false;
                }
                
              if(enemies[k].offscreen()){
                enemies[k].highlight=false;
                enemies.splice(k,1);
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