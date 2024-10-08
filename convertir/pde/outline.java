import processing.core.*; 

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

public class outline extends PApplet {

//
// outline: takes an image (image.jpg) and creates a sketch version
//
// procsilas (procsilas@hotmail.com / http://procsilas.net)
//

String iName="image.jpg";

public void setup() {
  llegeixImatge("./"+iName);
  size(img.width, img.height);
}

// parameters
// NO real control, so be careful

int NP=6000; // 1000 for line art, 10000 for complex images, O(N^2) so be patient!!!
int B=1; // try 2 or 3
float THR=28; // range 5-50
float MD=6; // range 0-10
int NMP=6; // range 1-15

float[][] punts;
int[] cpunts;
int [] usat;
int [] NmP=new int[NMP];
float [] NdmP=new float[NMP];

int inici=0;

PImage img;

public void llegeixImatge(String s) {
  img = loadImage(s);
  img.loadPixels();
}

public float fVar(int x, int y) {
  // neighborhood 2B+1x2B+1 pixels
  float m=0;
  for (int k1=-B; k1<=B; k1++) {
    for (int k2=-B; k2<=B; k2++) {
      int c=img.pixels[(y+k1)*img.width+(x+k2)];
      m+=brightness(c);
    }
  }
  m/=PApplet.parseFloat((2*B+1)*(2*B+1));
  float v=0;
  for (int k1=-B; k1<B; k1++) {
    for (int k2=-B; k2<B; k2++) {
      int c=img.pixels[(y+k1)*img.width+(x+k2)];
      v+=(brightness(c)-m)*(brightness(c)-m);
    }
  }
  v=sqrt(v)/(float) (2*B+1);    

  return v;
}

public void creaPunts() {
  punts = new float[NP][2];
  cpunts = new int[NP];
  usat = new int[NP];

  int nint1=0;
  int nint2=0;

  for (int i=0; i<NP;) {

    int x=B+PApplet.parseInt(random(width-2*B));
    int y=B+PApplet.parseInt(random(height-2*B));

    //println(i+" = "+x+", "+y+": "+THR+", "+MD);

    // points need to be at least MD far from each other
    int flag=0;
    if (MD>0.0f) {  
      for (int j=0; flag==0 && j<i; j++) {
        if (dist(x, y, punts[j][0], punts[j][1])<MD) {
          flag=1;
        }
      }
    }

    if (flag==0) { 
      nint1=0;
      float f=fVar(x, y);

      // use only "valid" points      
      if (f>=THR) {
        nint2=0;
        punts[i][0]=x;
        punts[i][1]=y;
        cpunts[i]=img.pixels[y*img.width+x];
        usat[i]=0;
        i++;
      } 
      else {
        nint2++;
        if (nint2>=10) {
          THR/=(1+1.0f/PApplet.parseFloat(NP-i));
          MD/=(1+1.0f/PApplet.parseFloat(NP-i));
          nint2=0;
        }
      }
    } 
    else {
      nint1++;
      if (nint1>=10) {
        MD/=2.0f;
        THR*=1.618f;
        nint1=0;
      }
    }
  }
}

public int NessimMesProper(int i) {
  if (NMP<=1) {
    int mP=-1;
    float dmP=dist(0, 0, width, height);
    for (int j=0; j<NP; j++) {
      if (usat[j]==0) {
        float jmP=dist(punts[i][0], punts[i][1], punts[j][0], punts[j][1]);
        if (jmP<dmP) {
          dmP=jmP;
          mP=j;
        }
      }
    }
    return mP;
  } 
  else {
    for (int j=0; j<NMP; j++) {
      NmP[j]=-1;    
      NdmP[j]=dist(0, 0, width, height);
    }
    for (int j=0; j<NP; j++) {
      if (usat[j]==0) {
        float jmP=dist(punts[i][0], punts[i][1], punts[j][0], punts[j][1]);
        int k=NMP;
        while(k>0 && NdmP[k-1]>jmP) {
          k--;
        }
        if (k<NMP) {
          for (int l=0; l<(NMP-k)-1; l++) {
            NmP[(NMP-1)-l]=NmP[(NMP-1)-(l+1)];
            NdmP[(NMP-1)-l]=NdmP[(NMP-1)-(l+1)];
          }
          NmP[k]=j;
          NdmP[k]=jmP;
        }
      }
    }
    return NmP[NMP-1];
  }
}

int fase=0;

public void draw() {
  if (fase==0) {
    creaPunts();
    background(0xffFFFFFF);
    fase=1;
  } 
  else {
    if (inici!=-1) {
      stroke(0xff000000);
      usat[inici]=1;

      int seguent=NessimMesProper(inici);
      if (seguent!=-1) {
        line(punts[inici][0], punts[inici][1], punts[seguent][0], punts[seguent][1]);
      }
      inici=seguent;
    } 
    else {
      save("outline_"+iName);
      noLoop();
    }
  }
}

  static public void main(String args[]) {
    PApplet.main(new String[] { "--bgcolor=#ECE9D8", "outline" });
  }
}
