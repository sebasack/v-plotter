#!/bin/bash

# convierte un archivo grafico en tres archivos que contienen las capas RGB del original


print_help() {
    echo "Debe pasar como parametro el nombre del archivo de imagen a convertir!  ejemplos:

        convertir_vpype.sh dog.jpg       (genera dog.svg)

        convertir_vpype.sh dog.jpg cmyk  (genera 4 archivos separado por colores dog_C.svg dog_M.svg dog_Y.svg dog_K.svg)

        convertir_vpype.sh dog.jpg line  (genera el contorno del dibujo)

        convertir_vpype.sh dog.jpg flow  (genera dibujo con otro efecto)
        "
}



if [ "$#" -eq 0 ];then
  print_help
  exit 
fi

PARAMETRO=""
SUFIJO_SALIDA=""
COLOR_CAPAS="color --layer 1 #000"


DIR_OUTPUT="/home/sebas/v-plotter1/svg/"

if [ "$#" -eq 2 ]; then
    if [  $2 = 'cmyk' ]; then
        PARAMETRO="--cmyk"
        #                           CYAN                 MAGENTA               YELLOW                BLACK     
        COLOR_CAPAS="color --layer 1 #0ff color --layer 2 #f0f  color --layer 3 #ff0  color --layer 4 #000"
        SUFIJO_SALIDA="_CMYK"
    
    elif [  $2 = 'line' ]; then
        PARAMETRO="line"
        SUFIJO_SALIDA="_line"

    elif [  $2 = 'flow' ]; then
        PARAMETRO="flow"
        SUFIJO_SALIDA="_flow"

    else
        echo "Parametro '$2' no valido.";
        exit 1
    fi
fi


if [ -f $1 ]; then

    FILE=$1
    #ARCHIVO=${FILE%%.*}
    #EXTENSION=${FILE#*.}

    ARCHIVO=$( echo ${FILE##*/} )
    ARCHIVO=${ARCHIVO%%.*}

    echo "
            Convirtiendo el archivo '$1' a SVG $PARAMETRO...
         "

    if [ "$PARAMETRO" = "line" ]; then

        echo " creando lineas..."

        vpype iread $FILE  write ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}.svg

       #cambio el color de las lineas a negro
        sed -i -e 's/stroke="#[0-9a-f]*"/stroke="#000000"/g' ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}.svg
    elif [ "$PARAMETRO" = "flow" ]; then
        vpype -v -s 42 flow_img  $FILE ${COLOR_CAPAS} write ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}.svg
    else
        vpype -v -s 42 flow_img -f curl_noise -dfm 1 -nc 0.03 ${PARAMETRO} $FILE ${COLOR_CAPAS} write ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}.svg
    fi

    # optimizo el svg
    echo '
          Optimizando svg...
         '    
    vpype read  ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}.svg linemerge --tolerance 0.1mm   linesort   reloop  linesimplify   write  ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}_opt.svg

    
   

    # si puso el parametro cmyk lo separo en capas
    if [ "$PARAMETRO" = "--cmyk" ]; then
        echo "
              Separando capas CMYK del archivo SVG...\n
             "
        vpype read ${DIR_OUTPUT}${ARCHIVO}${SUFIJO}_opt.svg forlayer write "${DIR_OUTPUT}${ARCHIVO}_%_name or _lid%.svg" end

        mv ${DIR_OUTPUT}${ARCHIVO}_1.svg  ${DIR_OUTPUT}${ARCHIVO}_C.svg
        mv ${DIR_OUTPUT}${ARCHIVO}_2.svg  ${DIR_OUTPUT}${ARCHIVO}_M.svg
        mv ${DIR_OUTPUT}${ARCHIVO}_3.svg  ${DIR_OUTPUT}${ARCHIVO}_Y.svg
        mv ${DIR_OUTPUT}${ARCHIVO}_4.svg  ${DIR_OUTPUT}${ARCHIVO}_K.svg
    fi

#    echo "
#            Convirtiendo archivos svg a gcode...
#         "
    
#     if [ "$PARAMETRO" = "--cmyk" ]; then
#        #./juicy-gcode-1.0.0.0/juicy-gcode  "${DIR_OUTPUT}${ARCHIVO}.svg" -o "Gcode/${ARCHIVO}.gcode"
#        ./juicy-gcode-1.0.0.0/juicy-gcode  "${DIR_OUTPUT}${ARCHIVO}_C.svg" -o "Gcode/${ARCHIVO}_C.gcode"
#        ./juicy-gcode-1.0.0.0/juicy-gcode  "${DIR_OUTPUT}${ARCHIVO}_M.svg" -o "Gcode/${ARCHIVO}_M.gcode"
#        ./juicy-gcode-1.0.0.0/juicy-gcode  "${DIR_OUTPUT}${ARCHIVO}_Y.svg" -o "Gcode/${ARCHIVO}_Y.gcode"
#        ./juicy-gcode-1.0.0.0/juicy-gcode  "${DIR_OUTPUT}${ARCHIVO}_K.svg" -o "Gcode/${ARCHIVO}_K.gcode"
#    else 
      #  ./juicy-gcode-1.0.0.0/juicy-gcode  "${DIR_OUTPUT}${ARCHIVO}.svg" -o "Gcode/${ARCHIVO}_juicy.gcode"


#        vpype read  "${DIR_OUTPUT}${ARCHIVO}.svg"  gwrite --profile gcode "Gcode/${ARCHIVO}_vpype.gcode"
#    fi
   
   # elimino los arhivos temporales

    #rm  ${DIR_OUTPUT}*.svg

    echo "Archivos convertidos! ${DIR_OUTPUT}${ARCHIVO}.svg"

    

else
    echo "El archivo '$1' no existe."
fi