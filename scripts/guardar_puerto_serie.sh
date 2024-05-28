#!/bin/bash

# si no se mando ningun parametro actualizo todas las bases de datos
if (test $# = 0); then # si no se enviaron parametros regenero todo
     echo "
              ERROR! debe especificar el puerto de entrada!
                   Ejemplo:  guardar_puerto_serie.sh 0
             ";
    exit 1;
fi;   


  puerto="/dev/ttyUSB$1";
    # echo "nombre_puerto $puerto";
      
    EXISTE_PUERTO="$(ls $puerto)"
   # echo "${OUTPUT}"

    if [ "${EXISTE_PUERTO}" ]; then	          
        destino=$puerto;
    else
        echo "El puerto $puerto no existe! no se puede mostrar su contenido!"
        exit 1;
    fi;

sudo chmod 777 $puerto

#nombre_archivo=/tmp/v-plotter_$(date +%F_%H.%M).txt
nombre_archivo=/tmp/v-plotter.txt

stty -F $puerto cs8 115200 ignbrk -brkint -icrnl -imaxbel -opost -onlcr -isig -icanon -iexten -echo -echoe -echok -echoctl -echoke noflsh -ixon -crtscts
#stty -F /dev/ttyUSB1 cs8 115200 ignbrk -brkint -icrnl -imaxbel -opost -onlcr -isig -icanon -iexten -echo -echoe -echok -echoctl -echoke noflsh -ixon -crtscts

cat $puerto > $nombre_archivo &
tail -f $nombre_archivo &

sudo chmod 777 $nombre_archivo


