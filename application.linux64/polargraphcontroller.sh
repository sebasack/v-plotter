#!/bin/sh

APPDIR=$(dirname "$0")
#echo $APPDIR
java -Djna.nosys=true -Djava.library.path="$APPDIR:$APPDIR/lib" -cp "$APPDIR/lib/polargraphcontroller.jar:$APPDIR/lib/core.jar:$APPDIR/lib/jogl-all.jar:$APPDIR/lib/gluegen-rt.jar:$APPDIR/lib/jogl-all-natives-linux-amd64.jar:$APPDIR/lib/gluegen-rt-natives-linux-amd64.jar:$APPDIR/lib/diewald_CV_kit.jar:$APPDIR/lib/geomerative.jar:$APPDIR/lib/batikfont.jar:$APPDIR/lib/net.jar:$APPDIR/lib/controlP5.jar" polargraphcontroller "$@"
