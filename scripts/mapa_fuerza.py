#!/usr/bin/env python
import sys
from PIL import Image, ImageDraw
from math import sqrt,sin,cos,acos,atan2,degrees,fabs
# setup the constants
version=1.7
outputFile="./../SD/vPlotterMap.png"
width,height=882,1100
border=32
# V line end points
v1=border/2,border/2
v2=width-border/2-1,border/2

#Here we draw the fixed parts of the picture: the crosses showing the end points of the control lines, and the background for the drawing. 
# Note that this drawing package has the origin in the upper left hand corner and a Y #axis with positive values progressing downward.

def cross(draw,p,n):
    c="#000000"
    draw.line((p[0],p[1]-n,p[0],p[1]+n),c)
    draw.line((p[0]-n,p[1],p[0]+n,p[1]),c)

def drawFixtures(draw):
    # border of calculation pixels
    draw.rectangle([border-1,border-1,width-border,height-border],"#FFFFFF","#000000")
    # V line end points
    cross(draw,v1,border/4)
    cross(draw,v2,border/4)

#There is a one to one correspondence between the tension calculation code here and the tension calculation derivation in the first math section.

def lineTensions(a1,a2):
    d=cos(a1)*sin(a2)+sin(a1)*cos(a2)
    return cos(a2)/d,cos(a1)/d

def tensionOk(p):
    # find angles
    a1=atan2(p[1]-v1[1],p[0]-v1[0])
    a2=atan2(p[1]-v2[1],v2[0]-p[0])
    # strings tension check
    t1,t2=lineTensions(a1,a2)
    lo,hi=.5,1.5
    return lo<t1<hi and lo<t2<hi

#Similarly, the resolution check code here is an implementation of the math in the previous section. In addition, 
# there is a "sanity check" to verify that the calculated point for the triangle is the same as the point passed #in to the calculation.

def dx(p1,p2):
    return sqrt((p1[0]-p2[0])**2+(p1[1]-p2[1])**2);

def calcPointB(a,b,c):
    alpha=acos((b**2+c**2-a**2)/(2*b*c))
    return b*cos(alpha)+v1[0],b*sin(alpha)+v1[1]

def resolutionOk(p):
    max=1.4
    # law of cosines calculation and nomenclature
    c=dx(v1,v2)
    b=dx(v1,p)
    a=dx(v2,p)
    # sanity check
    err=.00000000001
    pc=calcPointB(a,b,c)
    assert p[0]-err<pc[0]<p[0]+err
    assert p[1]-err<pc[1]<p[1]+err
    # calculate mapped differences
    db=dx(p,calcPointB(a,b+1,c)) # extend left line by 1 unit
    da=dx(p,calcPointB(a+1,b,c)) # extend right line by 1 unit
    return db<max and da<max # line pull of 1 unit does not move x,y by more than max

#Each pixel in the drawing area is assigned a color based on the tension and resolution calculations. 
# Dots are written on the terminal window to indicate that the calculation is underway.

def calcPixel(draw,p):
    t=tensionOk(p)
    r=resolutionOk(p)
    
    #  Colors designate:
    #    Orange: poor resolution
    #    Light Blue: too little tension in one of the lines
    #    Dark Blue: too much tension in one of the lines (and poor resolution)
    #    White: drawing area candidate 
        
    if not t and not r:
        draw.point(p,"#3A5FBD")
    if not t and r:
        draw.point(p,"#4876FF")
    if t and not r:
        draw.point(p,"#FF7F24")
    # default to background color

def drawPixels(draw):
    for y in range(border,height-border):
        sys.stdout.write('.')
        sys.stdout.flush()
        for x in range(border,width-border):
            calcPixel(draw,(x,y))
    sys.stdout.write('\n')

#The main section of the program prepares an image for the calculation and writes it to disk when done.

def main():
    print("V plotter map, version", version)

    image = Image.new("RGB",(width,height),"#D0D0D0")
    draw = ImageDraw.Draw(image)

    drawFixtures(draw)
    drawPixels(draw)

    image.save(outputFile,"PNG")
    print("map image written to", outputFile)
    print( "done.")

if __name__ == "__main__":
    main()
