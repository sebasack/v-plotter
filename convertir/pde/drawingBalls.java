import processing.core.*; 
import processing.xml.*; 

import java.applet.*; 
import java.awt.Dimension; 
import java.awt.Frame; 
import java.awt.event.MouseEvent; 
import java.awt.event.KeyEvent; 
import java.awt.event.FocusEvent; 
import java.awt.Image; 
import java.io.*; 
import java.net.*; 
import java.text.*; 
import java.util.*; 
import java.util.zip.*; 
import java.util.regex.*; 

public class drawingBalls extends PApplet {

int n = 1500;
Ball[] balls = new Ball[n];
int l = 0;
PImage img;       
PVector pos,vel;

public void setup() {
  noStroke();
  ellipseMode(CENTER); 
  smooth();  
  // Picture from Sukanto Debnath 
  // http://www.flickr.com/photos/sukanto_debnath/3081836966/
  img = loadImage("http://farm4.staticflickr.com/3137/3081836966_7945315150.jpg"); 
  size(img.width, img.height); 
  background(0);
}

public void draw() {
  fill(0);
  rect(0,0,width,height);

  if(l < n){
    pos = new PVector(random(0.55f*width-10,0.55f*width+10),random(0.4f*height-10,0.4f*height+10),0);
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

public void mousePressed() {
  for(int i = 0; i < l; i+=1) {
    balls[i].force();
  }
  //save("pic.jpg");
}


class Ball {
  PVector pos;
  PVector vel;
  float rad;
  int col;
  int pix = width*height/2;  
    
  Ball(PVector posTemp, PVector velTemp) {
    pos = posTemp.get();
    vel = velTemp.get();
    rad = 2;
    col = color(0);
  }
  
  public void update() {
    pos.add(vel);
    if (pos.x > width - rad) {
      pos.x = width - rad;
      vel.x = -vel.x;
    }
    else if (pos.x < rad) {
      pos.x = rad;
      vel.x = -vel.x;
    }
    if (pos.y > height - rad) {
      pos.y = height - rad;
      vel.y = -vel.y;
    }
    else if (pos.y < rad) {
      pos.y = rad;
      vel.y = -vel.y;
    }
    vel.mult(0.999f);
    pix = round(pos.x) + round(pos.y)*width;
    rad = map(brightness(img.pixels[pix]),0,255,3,7);
    col = img.pixels[pix];
  }
    
  public void paint() {
    fill(col);
    ellipse(pos.x,pos.y,(2*rad)-1,(2*rad)-1);
  }

  public void checkOver(Ball b) {
    PVector diff = PVector.sub(pos,b.pos);
    if(diff.mag() < rad + b.rad) {
      PVector cen = PVector.add(pos,b.pos);
      cen.div(2);
      diff.normalize();
      pos = PVector.add(cen,PVector.mult(diff,(rad + b.rad)/2));
      b.pos = PVector.add(cen,PVector.mult(diff,-(rad + b.rad)/2));
      vel.set(0,0,0);
      b.vel.set(0,0,0); 
    }
  }

  public void force() {
    PVector diff = PVector.sub(pos,new PVector(mouseX,mouseY,0.0f));
    float distance = diff.mag();
    diff.normalize();
    if(distance < rad) {
      PVector deltaVel = PVector.mult(diff,15);     
      vel.add(deltaVel);
    }
    else if(distance < 40) {
      PVector deltaVel = PVector.mult(diff,15*sq(rad/distance));     
      vel.add(deltaVel);
    }
  }

}  

  static public void main(String args[]) {
    PApplet.main(new String[] { "--bgcolor=#DFDFDF", "drawingBalls" });
  }
}
