int n = 1500;
Ball[] balls = new Ball[n];
int l = 0;
PImage img;       
PVector pos,vel;

void setup() {
  noStroke();
  ellipseMode(CENTER); 
  smooth();  
  // Picture from Sukanto Debnath 
  // http://www.flickr.com/photos/sukanto_debnath/3081836966/
  img = loadImage("http://farm4.staticflickr.com/3137/3081836966_7945315150.jpg"); 
  //size(img.width, img.height); 
    size(500, 500); 
  background(0);
}

void draw() {
  fill(0);
  rect(0,0,width,height);

  if(l < n){
    pos = new PVector(random(0.55*width-10,0.55*width+10),random(0.4*height-10,0.4*height+10),0);
    //pos = new PVector(mouseX,mouseY,0);
    vel = new PVector(0,0,0);
    balls[l] = new Ball(pos,vel);
    l+=1;
  }

  for(int i = 0; i < l; i+=1) {
    balls[i].update();
    balls[i].paint();
  }

  for(int i = 0; i < l; i+=1) {
    for(int j = 0; j < l; j+=1) {
      if (j != i){
        balls[i].checkOver(balls[j]);
      }
    }
  }
}

void mousePressed() {
  for(int i = 0; i < l; i+=1) {
    balls[i].force();
  }
  //save("pic.jpg");
}
