# v-plotter

vertical plotter esp32 + wifi polargraph

    Como plotear un svg:
    -------------------
       1. poner la gondola en posicion de dibujado (penDown)
       2. colocar la fibra en la gondola un milimetro por fuera de la estructura.
       3. poner la gondola en posicion de descanso (penLift)
       4. colocar el papel
       5. mover la gondola hasta su posicion de home, idealmente en el centro de la pizarra a 20 cms desde arriba.
       6. presionar el boton [input]->[set home]   para que la maquina sepa que ese es el punto de inicio.
       7. presionar [return to home] para asegurarse de que la gondola va as su home.
       8. borrar todo de la pantalla con [clear vector] y [clear image]
       9. presionar [load vector] y elegir la imagen, posicionarla en su lugar.
      10. presionar [move vector] para acomodarla y [resize vector] para acomodar su tamaÃ±o.
      11. presionar [select area] y elegir el area donde va a trabajar el plotter
      12. presionar [set frame to area]
      13. presionar [draw vector] para que genere el gcode
      14. presionar nuevamente [return to home] para que la gondola vuelva en su sitio inicial.
      15. activar la cola

    como convertir imagen a lineas y plotear:
    ----------------------------------------
       1. poner la gondola en posicion de dibujado (penDown)
       2. colocar la fibra en la gondola un milimetro por fuera de la estructura.
       3. poner la gondola en posicion de descanso (penLift)
       4. colocar el papel
       5. mover la gondola hasta su posicion de home, idealmente en el centro de la pizarra a 20 cms desde arriba.
       6. presionar el boton [input]->[set home]   para que la maquina sepa que ese es el punto de inicio.
       7. presionar [return to home] para asegurarse de que la gondola va as su home.
       8. borrar todo de la pantalla con [clear vector] y [clear image]
       9. presionar [load image from file] y elegir el archivo grafico
      10. poner en posicion con [move image]
      11. escalar con [resize image]
      12. presionar [select area] y elegir el area donde va a trabajar el plotter
      13. presionar [set frame to area]
      14. ir a [trace]
      15. presionar [capture]
      16. presionar [draw capture] para que genere el gcode
      17. ir a [input] para que muestre el path que seguira el plotter
      18. presionar nuevamente [return to home] para que la gondola vuelva en su sitio inicial.
      19. activar la cola

    Creaci�n de una imagen cl�sica (foto, dibujo, etc.)
    ---------------------------------------------------

       1. poner la gondola en posicion de dibujado (penDown)
       2. colocar la fibra en la gondola un milimetro por fuera de la estructura.
       3. poner la gondola en posicion de descanso (penLift)
       4. colocar el papel
       5. mover la gondola hasta su posicion de home, idealmente en el centro de la pizarra a 20 cms desde arriba.
       6. presionar el boton [input]->[set home]   para que la maquina sepa que ese es el punto de inicio.
       7. presionar [return to home] para asegurarse de que la gondola va as su home.
       8. borrar todo de la pantalla con [clear vector] y [clear image]
       9. presionar [load image from file] y elegir el archivo grafico
      10. poner en posicion con [move image]
      11. escalar con [resize image]
      12. presionar [select area] y elegir el area donde va a trabajar el plotter
      13. presionar [set frame to area]
      14. presionar [slect frame] para confirmar el �rea a dibujar.
      15. presionar [render pixels]

            Aparece una tabla con las diferentes opciones disponibles en cuanto a patrones, inicio y otras opciones:

            Deber�s elegir desde qu� punto comenzar� el dibujo:
                  parte superior derecha
                  abajo a la derecha
                  abajo a la izquierda
                  arriba a la izquierda

            Hay 6 matrices de renderizado disponibles y deber�s elegir una para dibujar:
                  onda cuadrada de frecuencia variable
                  onda cuadrada de tama�o variable
                  onda cuadrada s�lida
                  garabatear
                  espirales
                  Diente de sierra

      16. presionar el bot�n [generate commands] para generar los comandos gcode.
      17. presionar nuevamente [return to home] para que la gondola vuelva en su sitio inicial.
      18. activar la cola



    Plotear archivo gcode guardado en SD:
    ------------------------------------
       1. poner la gondola en posicion de dibujado (penDown)
       2. colocar la fibra en la gondola un milimetro por fuera de la estructura.
       3. poner la gondola en posicion de descanso (penLift)
       4. colocar el papel
       5. mover la gondola hasta su posicion de home, idealmente en el centro de la pizarra a 20 cms desde arriba.
       6. presionar el boton [input]->[set home]   para que la maquina sepa que ese es el punto de inicio.
       7. presionar [return to home] para asegurarse de que la gondola va as su home.
       8. Crear el archivo gcode y guardarlo en el root de la SD con el nombre 'AUTORUN.TXT'
       9. reiniciar el sistema.

    Aclaraciones:
    ------------
      * aumentar el [setup]->[step multiplier]  le da mas resolucion a la impresion.
      * si se baja la resolucion parece escrito a mano.
      * Para imprimir texto pequeÃ±o primero pasarlo a hershey text usando inkscape, ir a 'Extensions' > 'Text' > 'Hershey Text'
        (fuente: https://support.shapertools.com/hc/en-us/articles/360055222354-Create-a-single-line-text-with-Inkscape)


    Instalar vpype para convertir imagenes a svg:
    --------------------------------------------

      * instalar con
            pipx install "vpype[all]"

      * instalar plugins
            pipx inject vpype vpype-vectrace
            pipx inject vpype deduplicate
            pipx inject vpype vpype-pixelart
            pipx inject vpype 'git+https://github.com/serycjon/vpype-flow-imager.git#egg=vpype-flow-imager[all]'
            pipx install vpype-ttf --include-deps
            pipx inject vpype vpype-occult
            pipx inject vpype hatched
            pipx inject vpype vpype-perspective
            pipx inject vpype vpype-gcode

      * desinstalarlo con
            pipx uninstall vpype

      * para entrar en la version dockerizada de vpype:
            docker exec -it vpype bash
