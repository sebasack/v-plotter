#!/bin/bash


programa='./../v-plotter/v-plotter.ino';
plataforma='esp32:esp32:esp32doit-devkit-v1';
destino='';

# si no se mando ningun parametro actualizo todas las bases de datos
if (test $# = 0); then # si no se enviaron parametros regenero todo
     echo "
              ERROR! debe especificar los parametros de entrada!
                   Ejemplo:  compilar_y_subir.sh 1
             ";
   # exit 1;
fi;   




#chequeo que el puerto exista
puerto="/dev/ttyUSB$1";
# echo "nombre_puerto $puerto";
    
EXISTE_PUERTO="$(ls $puerto)"
# echo "${OUTPUT}"

if [ "${EXISTE_PUERTO}" ]; then	          
    destino=$puerto;
else
    echo "El puerto $puerto no existe! no se puede subir el firmware!"
    #exit 1;
fi;




echo "se compilara el programa $programa para la plataforma $plataforma y se enviara a $destino ";

#cd ..
#cd $programa

directorio_compilacion="./../../../compilado-cli/v-plotter";

rm -rf $directorio_compilacion

echo "Comando de compilacion: arduino-cli compile --fqbn $plataforma $programa --output-dir $directorio_compilacion"


#ejecuto el comando que compila 
arduino-cli compile --fqbn $plataforma $programa --output-dir $directorio_compilacion



if (test "$destino" = ""); then
    echo "No se cargara el firmware en la placa."
else
    # cargo el firmware por el puerto serie

    echo "Comando Upload:  arduino-cli  upload -p $puerto --fqbn $plataforma  $programa   --input-dir  $directorio_compilacion"

    arduino-cli  upload -p $puerto --fqbn $plataforma  $programa   --input-dir  $directorio_compilacion


    # arduino-cli  upload -p /dev/ttyUSB1 --fqbn esp32:esp32:esp32doit-devkit-v1  ./v-plotter.ino   --input-dir  ./../../compilado-cli/v-plotter
fi;



exit 1;
