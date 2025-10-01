        class CaptureLines {
            constructor(canvasId) {
                this.lineCanvas = document.getElementById(canvasId);
                this.lineCtx = this.lineCanvas.getContext('2d');

                this.originalCanvas = document.createElement('canvas');
                this.originalCtx = this.originalCanvas.getContext('2d');

               // this.lines = [];
                this.vertices_elegidos = new Set();
                
                // Estados de interacción
                this.isDrawing = false;
                this.isPanning = false;
                this.startX = 0;
                this.startY = 0;
                this.currentX = 0;
                this.currentY = 0;
                
                // Transformaciones de vista
                this.viewX = 10;
                this.viewY = 10;
                this.scale = 1;
                this.lastX = 0;
                this.lastY = 0;
                
                this.init();
              
                this.updateUI();

                this.imagen = false;
                this.umbral_value = 50;
                this.grosor_value = 2;
                this.vertices_value = 10;
                this.unificar_adyacentes = false;
                this.mostrar_imagen = true;
                this.detalle_lineas = false;
                this.dibujo = false;
            }





            dibujar_captura(){

                this.lineCtx.clearRect(0, 0,this.lineCanvas.width,this.lineCanvas.height);
                this.lineCtx.save();

                // muestro la maquina y la pagina centradas, lo hago antes del escalado para que quede en posicion fija
                this.lineCtx.fillStyle = "#FFE6C9";
                this.lineCtx.fillRect(0,0, this.lineCanvas.width,this.lineCanvas.height);

                // Calcular el 90% del espacio disponible
                const maxWidth = canvas.width * 0.95;
                const maxHeight = canvas.height * 0.95;

                // Calcular la escala para mantener la proporción
                const scaleX = maxWidth / page.page_width ;
                const scaleY = maxHeight/ page.page_height;
                const scale = Math.min(scaleX, scaleY);
                
                // Calcular las dimensiones escaladas
                const scaledWidth = page.page_width * scale;
                const scaledHeight =  page.page_height * scale;
                
                // Calcular la posición para centrar
                const x = (this.lineCanvas.width - scaledWidth) / 2;
                const y = (this.lineCanvas.height - scaledHeight) / 2;
                

                // Dibujar fondo del cuadro
                this.lineCtx.fillStyle = '#ffffff';
                this.lineCtx.fillRect(x, y, scaledWidth, scaledHeight);
                
                // Dibujar borde del cuadro
                this.lineCtx.strokeStyle = '#000000';
                this.lineCtx.lineWidth = 3;
                this.lineCtx.strokeRect(x, y, scaledWidth, scaledHeight);

              

                  // Aplicar transformaciones de vista
                this.lineCtx.translate(this.viewX, this.viewY);
                this.lineCtx.scale(this.scale, this.scale);

                if (this.mostrar_imagen){
                   this.lineCtx.drawImage(this.imagen, 0, 0);
                }   
                
                this.lineCtx.lineWidth = 1;

                if (!this.detalle_lineas){
                    this.lineCtx.strokeStyle ="#000000";                
                }       

              //  this.dibujo.lineas.forEach(function(linea) {
               this.dibujo.lineas.forEach((linea) => {
                    this.lineCtx.beginPath();

                    if (this.detalle_lineas){  
                       this.lineCtx.strokeStyle = linea.color;
                    }   
                    
                    // Dibujar líneas
                    this.lineCtx.moveTo(linea.vertices[0].x, linea.vertices[0].y);                       
                    for (let i=1;i< linea.vertices.length;i++){                                          
                       this.lineCtx.lineTo(linea.vertices[i].x,linea.vertices[i].y);
                       this.lineCtx.stroke();                      
                    }    
                
                });

                this.lineCtx.restore();

            }  



            cargar_imagen(e){

                let reader = new FileReader();
                // reader.onload = function(event) {
                reader.onload = (event) => {
                    let img = new Image();
                    //img.onload = function() {
                    img.onload = () => {

                        this.imagen=img;
                    
                        // Ajustar tamaño del canvas donde proceso la imagen al de la imagen
                        this.originalCanvas.width =  this.imagen.width;
                        this.originalCanvas.height =  this.imagen.height;

                        
                        // agrando el canvas donde muestro el resultado para que tape el de la maquina y no se pueda modificar el zoom y offset
                        this.lineCanvas.width = canvas.width;
                        this.lineCanvas.height = canvas.height;

                        // pongo el zoom y offset de la maquina en su posicion original
                        //resetZoom();
                
                        
                        // Dibujar imagen en el canvas original
                        this.originalCtx.drawImage(img, 0, 0);     


                        // Dibujar imagen en el canvas mostrado
                        this.lineCtx.drawImage(img, 0, 0);     

                        // Procesar imagen y detectar contornos
                        this.obtener_lineas();

            
                    }
                    img.src = event.target.result;
                }
                reader.readAsDataURL(e.target.files[0]);
                    
            }

            update_umbral(event){   
                this.umbral_value = event.target.value;
                $('#umbral_value').html(event.target.value);
                this.obtener_lineas();
            }


            update_grosor(event){   
                this.grosor_value = event.target.value;
                $('#grosor_value').html(event.target.value);
                this.obtener_lineas();
            }

            update_vertices(event){   
                this.vertices_value = event.target.value;
                $('#vertices_value').html(event.target.value);
                this.obtener_lineas();
            }

            obtener_lineas(event){

                this.unificar_adyacentes = $("#unificar_lineas_adyacentes").prop("checked") ;
                this.mostrar_imagen = $("#mostrar_imagen").prop("checked") ;
                this.detalle_lineas = $("#detalle_lineas").prop("checked") ;

                // capturo las lineas de la imagen con los parametros seleccionados
                this.procesar_imagen();

                // muestro las estadisticas de la imagen
                $("#lineas").text("Lineas:" + this.dibujo .cantidadLineas() + ", vertices:" + this.dibujo .cantidadVertices());
                

                // dibujo la figura
                this.dibujar_captura();


            }

            // Función para calcular la distancia entre dos puntos
            distance(x1, y1, x2, y2) {
                return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            }


            marcar_nodo(binaryEdges,circlePoints,unificar_adyacentes,y,x,color){   
                //console.log(JSON.stringify(circlePoints.relleno));    
                
                binaryEdges[y][x] = color;   // marco el primer punto, es la semilla si no voy a marcar lineas adyacentes

                circlePoints.relleno.forEach(function(punto) {                               
                    let marcar = true;
                    if (!unificar_adyacentes){ // no unificar!                            
                        marcar = false;

                        // veo que el punto en cuestion este al lado de otro punto del color elegido     
                        if (binaryEdges[punto[1]  ][punto[0]-1] === color ||  
                            binaryEdges[punto[1]+1][punto[0]-1] === color ||
                            binaryEdges[punto[1]+1][punto[0]  ] === color ||
                            binaryEdges[punto[1]+1][punto[0]+1] === color ||
                            binaryEdges[punto[1]  ][punto[0]+1] === color ||
                            binaryEdges[punto[1]-1][punto[0]+1] === color ||
                            binaryEdges[punto[1]-1][punto[0]  ] === color ||
                            binaryEdges[punto[1]-1][punto[0]-1] === color ){
                                marcar = true;
                        }                      
                    }

                    if (marcar){                        
                        binaryEdges[punto[1]][punto[0]] = color;                       
                    }

                });                 
            }



            
            getCirclePoints(binaryEdges,centerX, centerY, radius, borderX=0, borderY=0, sentido_antihorario=true) {

                //  console.log('getCirclePoints('+centerX +','+ centerY+','+ radius+','+ borderX+','+ borderY+','+ sentido_antihorario+')' );

                const tipos = [];
                                        
                        /*|  1 |  2 | 3 | 4 | 5 |  6 | 7  | 8 */
                tipos[1] = [-1,0,-1,1,0,1,1,1,1,0,1,-1,0,-1,-1,-1]; 
                /* 8 7 6                                                                     
                *  1 . 5                                                                     
                *  2 3 4
                */                                                       

                        /*|  1 |  2 |  3 | 4 | 5 | 6 | 7 |  8 | 9  | 10 |  11 |  12 */
                tipos[2] = [-2,0,-2,1,-1,2,0,2,1,2,2,1,2,0,2,-1,1,-2,0,-2,-1,-2,-2,-1];
                /*   11 10  9                           
                * 12          8
                *  1    .     7
                *  2          6 
                *    3  4  5
                */        
                            
                            /*  1    2    3    4   5   6   7   8   9   10   11   12   13    14    15    16 */              
                tipos[3] = [-3,0,-3,1,-2,2,-1,3,0,3,1,3,2,2,3,1,3,0,3,-1,2,-2,1,-3,0,-3,-1,-3,-2,-2,-3,-1]; 
                /*   14 13 12
                *  15        11
                *16            10
                *1      .      9 
                *2             8
                *  3         7
                *    4  5  6
                */
                

                            /*| 1 |  2 |  3 |  4 |  5 | 6 | 7 | 8 | 9 | 10| 11| 12 | 13 | 14 | 15 | 16 |  17 |  18 |  19 |  20 */              
                //  tipos[4] = [-4,0,-4,1,-3,2,-2,3,-1,4,0,4,1,4,2,3,3,2,4,1,4,0,4,-1,3,-2,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-2,-4,-1];
                /*     17 16 15
                *    18        14
                *  19            13
                *20                12
                *1       .        11
                *2                10
                *  3             9
                *    4         8
                *      5  6  7
                */               


                        /* 1 |  2 |  3 |  4 |  5 | 6  | 7 | 8 | 9 | 10| 11| 12| 13| 14 | 15 | 16 | 17 | 18 | 19 |  20 |  21 |  22 |  23 |  24*/              
                tipos[4] = [-4,0,-4,1,-3,2,-3,3,-2,3,-1,4,0,4,1,4,2,3,3,3,3,2,4,1,4,0,4,-1,3,-2,3,-3,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-3,-3,-2,-4,-1];
                /*      20 19 18
                *  22 21        17 16
                *  23              15
                *24                  14
                * 1        .         13
                * 2                  12
                *   3              11
                *   4  5         9 10
                *        6  7  8
                */               
                
                        


                            /* | 1 | 2  |  3 |  4 |  5 |  6 |  7 | 8 | 9 | 10| 11| 12| 13| 14| 15| 16 | 17 | 18 | 19 | 20 | 21 | 22 |  23 |  24 |  25 |  26 |  27 | 28  */    
                tipos[5] = [-5,0,-5,1,-4,2,-4,3,-3,4,-2,4,-1,5,0,5,1,5,2,4,3,4,4,3,4,2,5,1,5,0,5,-1,4,-2,3,-4,4,-3,2,-4,1,-5,0,-5,-1,-5,-2,-4,-3,-4,-4,-3,-4,-2,-5,-1];
                /*       23 22 21
                *    25 24        20 19
                *  26                  18
                *  27                  17
                *28                      16
                * 1           .          15
                * 2                      14
                *  3                  13
                *  4                  12
                *    5 6         10 11
                *        7  8  9                
                */

                        /* | 1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 | 9 | 10| 11| 12| 13| 14| 15| 16| 17| 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 |  26 |  27 |  28 |  29 |  30 |  31 |  32  */    
                tipos[6] = [-6,0,-6,1,-5,2,-5,3,-4,4,-3,5,-2,5,-1,6,0,6,1,6,2,5,3,5,4,4,5,3,5,2,6,1,6,0,6,-1,5,-2,5,-3,4,-4,3,-5,2,-5,1,-6,0,-6,-1,-6,-2,-5,-3,-5,-4,-4,-5,-3,-5,-2,-6,-1];           
                /*          26 25 24
                *      28 17        23 22
                *    29                  21
                *  30                      20
                *  31                      19
                *32                           18 
                * 1             .             17
                * 2                           16
                *   3                       15
                *   4                       14
                *     5                  13
                *       6  7        11 12
                *           8  9  10
                */
                            
                const points = [];
                let fill =[];                                 
                let closestIndex = 0;



                //agrego el centro a los puntos de relleno (fue movido a marcar_nodo para ser usado como semilla en la buzqueda de adyacentes)
                //fill.push([centerX, centerY]);

                let a1=[]; // anillo 1 del relleno
                let a2=[]; // anillo 2 del relleno
                let a3=[]; // anillo 3 del relleno
                let a4=[]; // anillo 4 del relleno
                let a5=[]; // anillo 5 del relleno


                // busco el pixel con menos distancia al borde inicial
                let minDistance = this.distance(tipos[radius][0] + centerX, tipos[radius][1] + centerY, borderX, borderY);

                for (let i = 0; i < tipos[radius].length; i+=2) {                                                             
                    
                    // me aseguro de que quede dentro del canvas   
                    if (tipos[radius][i] + centerX >= 0 && 
                        tipos[radius][i+1] + centerY >= 0 &&
                        tipos[radius][i] + centerX <this.originalCanvas.width && 
                        tipos[radius][i+1] + centerY <this.originalCanvas.height ){ 
                        
                        points.push([tipos[radius][i] + centerX, tipos[radius][i+1] + centerY]);
                        
                        // lleno los distintos anillos para luego armar el rellono
                        if (radius >= 2 && i < tipos[1].length &&
                            tipos[1][i] + centerX >= 0 && 
                            tipos[1][i+1] + centerY >= 0 &&
                            tipos[1][i] + centerX <this.originalCanvas.width && 
                            tipos[1][i+1] + centerY <this.originalCanvas.height &&
                            binaryEdges[tipos[1][i+1]+ centerY][tipos[1][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                                a1.push([tipos[1][i] + centerX, tipos[1][i+1] + centerY]);                                                                                 
                        }
                        if (radius >= 3 && i < tipos[2].length &&
                            tipos[2][i] + centerX >= 0 && 
                            tipos[2][i+1] + centerY >= 0 &&
                            tipos[2][i] + centerX <this.originalCanvas.width && 
                            tipos[2][i+1] + centerY <this.originalCanvas.height  &&
                            binaryEdges[tipos[2][i+1]+ centerY][tipos[2][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                                a2.push([tipos[2][i] + centerX, tipos[2][i+1] + centerY]);                                                                          
                        }
                        if (radius >= 4 && i < tipos[3].length &&
                            tipos[3][i] + centerX >= 0 && 
                            tipos[3][i+1] + centerY >= 0 &&
                            tipos[3][i] + centerX <this.originalCanvas.width && 
                            tipos[3][i+1] + centerY <this.originalCanvas.height &&
                            binaryEdges[tipos[3][i+1]+ centerY][tipos[3][i]+ centerX] === 1 ){      // solo elijo puntos blancos                           
                                a3.push([tipos[3][i] + centerX, tipos[3][i+1] + centerY]);                                                                                
                        }
                        if (radius >= 5 && i < tipos[4].length &&
                            tipos[4][i] + centerX >= 0 && 
                            tipos[4][i+1] + centerY >= 0 &&
                            tipos[4][i] + centerX <this.originalCanvas.width && 
                            tipos[4][i+1] + centerY <this.originalCanvas.height &&
                            binaryEdges[tipos[4][i+1]+ centerY][tipos[4][i]+ centerX] === 1 ){// solo elijo puntos blancos
                                a4.push([tipos[4][i] + centerX, tipos[4][i+1] + centerY]);                                                                          
                        }
                        if (radius >= 6 && i < tipos[5].length &&
                            tipos[5][i] + centerX >= 0 && 
                            tipos[5][i+1] + centerY >= 0 &&
                            tipos[5][i] + centerX <this.originalCanvas.width && 
                            tipos[5][i+1] + centerY <this.originalCanvas.height &&
                            binaryEdges[tipos[5][i+1]+ centerY][tipos[5][i]+ centerX] === 1){// solo elijo puntos blancos
                                a5.push([tipos[5][i] + centerX, tipos[5][i+1] + centerY]);                                                                                 
                        }                      

                        // Encontrar el punto más cercano a la referencia
                        const d = this.distance( tipos[radius][i] + centerX, tipos[radius][i+1] + centerY, borderX, borderY);
                        if (d < minDistance) {
                            minDistance = d;
                            closestIndex = i;
                        }
                    }                                           
                }

                // agrego los anillos necesarios al relleno
                fill = [].concat(fill, a1, a2,a3,a4,a5);


                // Reordenar el contorno del marcador comenzando desde el punto más cercano
                points.slice(closestIndex).concat(points.slice(0, closestIndex));

                // si el sentido es horario invierto el arreglo de puntos
                if (!sentido_antihorario){
                    points.reverse();
                }

                return {contorno :points,
                        relleno : fill
                };

            }




            // funcion que dado un punto negro parte del borde y un punto blanco adyacente sigue el borde y agrega los puntos a la linea
            seguir_linea(linea,binaryEdges,radio_pen,y,x,borde_y,borde_x,color=10,sentido_antihorario=true,unificar_adyacentes=true){        

                //   console.log(linea.id +'  seguir_linea ' + x + ',' + y + ' / '+borde_x+','+ borde_y + ' / '+ color);

                let i_borde=1;
                while (i_borde > -1){
                    i_borde =-1;
                    let i_nuevo_centro = -1;

                    // genero los puntos del circulo del pen
                    let circlePoints = this.getCirclePoints(binaryEdges,x, y, radio_pen,borde_x,borde_y,sentido_antihorario) ;
                
                    let p = circlePoints.contorno;

                    // busco el siguiente pixel blanco mas cercano al actual                                     
                    for (let i = 0; i < p.length-1; i++) {                                                  
                        if ((binaryEdges[p[i][1]][p[i][0]] === 0 || binaryEdges[p[i][1]][p[i][0]] === color) &&   // el borde es negro o del color buscado
                            // binaryEdges[p[i][1]][p[i][0]] != 0 && // el borde es de cualquier color
                            binaryEdges[p[i+1][1]][p[i+1][0]] === 1){ // el siguiente punto es blanco
                            // encontre el borde!!!
                            i_borde = i;
                            i_nuevo_centro = i+1;

                            // agrego el punto encontrado a la linea
                            linea.agregarVertice(p[i+1][0], p[i+1][1],!sentido_antihorario);

                            this.marcar_nodo(binaryEdges,circlePoints,unificar_adyacentes,p[i+1][1],p[i+1][0],color);  
                            /*
                            // MUESTRO EL CENTRO Y BORDE ORIGINALES...
                            binaryEdges[y][x] =2;
                            binaryEdges[borde_y][ borde_x] =3;
                            //MUESTRO EL PUNTO INICIAL DE BUSQUEDA Y EL PUNGO ESPERADO DE AVANCE
                            binaryEdges[p[0][1]][p[0][0]]=2;
                            binaryEdges[p[radio_pen][1]][p[radio_pen][0]]=20;
                            */
                            x=p[i_nuevo_centro][0];
                            y=p[i_nuevo_centro][1];
                            borde_x=p[i_borde][0];
                            borde_y=p[i_borde][1];

                            // encontre el pixel blanco, salgo del for
                            break;
                        }
                    };
                }
            }


            procesar_imagen(){

                //  Variables globales
                this.dibujo = new Dibujo();

                // Limpiar canvas de líneas
                //lineCtx.clearRect(0, 0,this.lineCanvas.width,this.lineCanvas.height);
                
                // Obtener datos de la imagen
                let imageData = this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
                let data = imageData.data;
                
                // Crear matriz de grises y detectar bordes
                let grayMatrix = [];
                let edgeMatrix = [];
                
                // Convertir a escala de grises
                for (let y = 0; y < this.originalCanvas.height; y++) {
                    grayMatrix[y] = [];
                    for (let x = 0; x < this.originalCanvas.width; x++) {
                        let idx = (y * this.originalCanvas.width + x) * 4;
                        let r = data[idx];
                        let g = data[idx + 1];
                        let b = data[idx + 2];
                        // Fórmula para convertir RGB a escala de grises
                        grayMatrix[y][x] = 0.3 * r + 0.59 * g + 0.11 * b;
                    }
                }

                //  mostrar_matriz_debug('debug2',grayMatrix);
                
                // Aplicar detección de bordes simple (operador Sobel simplificado)
                for (let y = 1; y < this.originalCanvas.height - 1; y++) {
                    edgeMatrix[y] = [];
                    for (let x = 1; x < this.originalCanvas.width - 1; x++) {
                        // Aplicar kernel horizontal
                        let gx =   -grayMatrix[y-1][x-1] +  grayMatrix[y-1][x+1] + -2 * grayMatrix[y][x-1] + 
                                2 * grayMatrix[y][x+1]   + -grayMatrix[y+1][x-1] + grayMatrix[y+1][x+1];
                        
                        // Aplicar kernel vertical
                        let gy = -grayMatrix[y-1][x-1] - 2 * grayMatrix[y-1][x] - grayMatrix[y-1][x+1] +
                                    grayMatrix[y+1][x-1] + 2 * grayMatrix[y+1][x] + grayMatrix[y+1][x+1];
                        
                        // Calcular magnitud del gradiente
                        edgeMatrix[y][x] = Math.sqrt(gx * gx + gy * gy);
                    }
                }
                

            //   mostrar_matriz_debug('debug',edgeMatrix);

                // Umbralizar para obtener bordes binarios
                let binaryEdges = [];
                
                for (let y = 0; y < this.originalCanvas.height; y++) {
                    binaryEdges[y] = [];
                    for (let x = 0; x < this.originalCanvas.width; x++) {
                        if (y === 0 || y === this.originalCanvas.height-1 || x === 0 || x === this.originalCanvas.width-1) {
                            binaryEdges[y][x] = 0; // Borde de la imagen
                        } else {
                            binaryEdges[y][x] = edgeMatrix[y][x] > this.umbral_value ? 1 : 0;
                        }
                    }
                }
                                

                // busco ls primera linea blanca que encuentre y sigo el rastro
                let color_linea =2;           

                // elimino el dibujo anterior si existia
                this.dibujo.limpiar();

                let linea = this.dibujo.crearLinea( colores[color_linea]);

                for (let y = 0; y < this.originalCanvas.height; y++) {            
                    for (let x = 0; x < this.originalCanvas.width; x++) {                    
                        if (binaryEdges[y][x+1] === 1) { // econtre el primer punto blanco
                            
                            this.seguir_linea(linea,binaryEdges,this.grosor_value,y,x+1, y,x, color_linea,true,this.unificar_adyacentes);     
                            // si se encontro solo un punto descarto la linea
                            if (linea.vertices.length === 1 ) {
                               this.dibujo.eliminarLinea(linea.id);
                                linea =this.dibujo.crearLinea( colores[color_linea]);
                            }

                            //sigo la linea hacia el otro lado
                            this.seguir_linea(linea,binaryEdges,this.grosor_value,y,x+1, y,x, color_linea,false,this.unificar_adyacentes);   
                            // si se encontro solo un punto descarto la linea
                            if (linea.vertices.length === 1) {
                               this.dibujo.eliminarLinea(linea.id);
                                linea =this.dibujo.crearLinea( colores[color_linea]);
                            }

                            if (linea.vertices.length >1){
                                linea =this.dibujo.crearLinea( colores[color_linea]);
                                color_linea ++;                               
                            }                                             
                        }
                        
                        if (color_linea ==16){
                            color_linea =2;
                        }
                        
                    }             
                }

                // la ultima linea creada nunca se va a llenar
               this.dibujo.eliminarLinea(linea.id);


                //mostrar_matriz_debug('debug',binaryEdges,true);
                    
                // unifico lineas contiguas
               this.dibujo.unificarLineas(6);

                // reduzco cantidad de vertices
               this.dibujo.reducirVertices(this.vertices_value );

                //retorno las el dibujo procesado
                //return this.dibujo;
                    
            }



            init() {
                // Event listeners del mouse
                this.lineCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
                this.lineCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
                this.lineCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
                this.lineCanvas.addEventListener('wheel', this.handleWheel.bind(this));
                this.lineCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

                // listeners de botones y sliders
                document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
                document.getElementById('umbral_slider').addEventListener('change', this.update_umbral.bind(this), false);
                document.getElementById("unificar_lineas_adyacentes").addEventListener('change', this.obtener_lineas.bind(this), false);
                document.getElementById('grosor_slider').addEventListener('change', this.update_grosor.bind(this), false);
                document.getElementById('vertices_slider').addEventListener('change', this.update_vertices.bind(this), false);
                document.getElementById("mostrar_imagen").addEventListener('change', this.obtener_lineas.bind(this), false);
                document.getElementById("detalle_lineas").addEventListener('change', this.obtener_lineas.bind(this), false);

                // seteo el title al canvas
                this.lineCanvas.title=`Zoom con rueda del mouse: Acerca/aleja la vista
Arrastrar con click derecho: Mueve la vista
Dibujar rectángulo con click izquierdo: Selecciona líneas
Shift + click izquierdo: Zoom al área seleccionada
`;


            }


            handleMouseDown(e) {
                const rect = this.lineCanvas.getBoundingClientRect();
                this.startX = (e.clientX - rect.left - this.viewX) / this.scale;
                this.startY = (e.clientY - rect.top - this.viewY) / this.scale;
                this.currentX = this.startX;
                this.currentY = this.startY;
                
                if (e.button === 0) { // Click izquierdo
                    this.isDrawing = true;
                    this.lineCanvas.style.cursor = 'crosshair';
                } else if (e.button === 2) { // Click derecho
                    this.isPanning = true;
                    this.lastX = e.clientX;
                    this.lastY = e.clientY;
                    this.lineCanvas.style.cursor = 'grabbing';
                }
            }

            handleMouseMove(e) {
                const rect = this.lineCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                if (this.isDrawing) {
                    this.currentX = (mouseX - this.viewX) / this.scale;
                    this.currentY = (mouseY - this.viewY) / this.scale;
                    this.dibujar_captura();
                    this.drawSelectionBox();
                } else if (this.isPanning) {
                    const dx = mouseX - this.lastX;
                    const dy = mouseY - this.lastY;
                    
                    this.viewX += dx;
                    this.viewY += dy;
                    
                    this.lastX = mouseX;
                    this.lastY = mouseY;
                    
                    this.dibujar_captura();
                    this.updateUI();
                }
            }

            handleMouseUp(e) {
                if (this.isDrawing) {
                    this.isDrawing = false;
                    this.lineCanvas.style.cursor = 'crosshair';
                    
                    if (e.shiftKey) {
                        // Zoom al área con Shift
                        this.zoomToArea();
                    } else {
                        // Selección normal
                        this.selectLinesInBox();
                    }
                    
                    this.dibujar_captura();
                } else if (this.isPanning) {
                    this.isPanning = false;
                    this.lineCanvas.style.cursor = 'crosshair';
                }
            }

            handleWheel(e) {
                e.preventDefault();
                
                const rect = this.lineCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const zoomIntensity = 0.1;
                const wheel = e.deltaY < 0 ? 1 : -1;
                const zoom = Math.exp(wheel * zoomIntensity);
                
                // Calcular la posición del mouse en coordenadas del mundo
                const worldX = (mouseX - this.viewX) / this.scale;
                const worldY = (mouseY - this.viewY) / this.scale;
                
                // Aplicar zoom
                this.scale *= zoom;
                
                // Limitar el zoom
                this.scale = Math.max(0.1, Math.min(10, this.scale));
                
                // Ajustar la vista para mantener el punto del mouse en la misma posición
                this.viewX = mouseX - worldX * this.scale;
                this.viewY = mouseY - worldY * this.scale;
                
                this.dibujar_captura();
                this.updateUI();
            }

            zoomToArea() {
                const box = {
                    x: Math.min(this.startX, this.currentX),
                    y: Math.min(this.startY, this.currentY),
                    width: Math.abs(this.currentX - this.startX),
                    height: Math.abs(this.currentY - this.startY)
                };
                
                if (box.width < 5 || box.height < 5) return;
                
                // Calcular el zoom necesario para que el área ocupe el 80% del canvas
                const scaleX = this.lineCanvas.width * 0.8 / box.width;
                const scaleY = this.lineCanvas.height * 0.8 / box.height;
                this.scale = Math.min(scaleX, scaleY);
                
                // Centrar el área en la vista
                this.viewX = (this.lineCanvas.width - (box.x + box.width/2) * this.scale) / 2;
                this.viewY = (this.lineCanvas.height - (box.y + box.height/2) * this.scale) / 2;
                
                this.dibujar_captura();
                this.updateUI();
            }


            drawSelectionBox() {
                this.lineCtx.save();
                this.lineCtx.setTransform(1, 0, 0, 1, 0, 0);
                
                this.lineCtx.beginPath();
                this.lineCtx.rect(
                    this.startX * this.scale + this.viewX, 
                    this.startY * this.scale + this.viewY, 
                    (this.currentX - this.startX) * this.scale, 
                    (this.currentY - this.startY) * this.scale
                );
                
                this.lineCtx.strokeStyle = '#007bff';
                this.lineCtx.lineWidth = 1;
                this.lineCtx.setLineDash([5, 5]);
                this.lineCtx.stroke();
                this.lineCtx.setLineDash([]);
                this.lineCtx.restore();
            }

            selectLinesInBox() {
                const box = {
                    x: Math.min(this.startX, this.currentX),
                    y: Math.min(this.startY, this.currentY),
                    width: Math.abs(this.currentX - this.startX),
                    height: Math.abs(this.currentY - this.startY)
                };

                this.vertices_elegidos.clear();

                this.dibujo.lineas.forEach(linea => {
                    this.vertices_en_recuadro(linea,box);

                                  
                    /*
                    if (this.isLineInBox(linea, box)) {
                        this.vertices_elegidos.add(linea.id);
                    }*/
                });

                eco(this.vertices_elegidos);

                this.updateUI();
            }

            vertices_en_recuadro(linea,box){

               // eco('aca busco que vertices estan dentro del cuadro');
                linea.vertices.forEach( vertice => {                  
                    if (vertice.x >= box.x && vertice.x <= box.x + box.width &&
                        vertice.y >= box.y && vertice.y <= box.y + box.height){
                            this.vertices_elegidos.add(vertice.id);
                    }
                });

            };
/*
            isLineInBox(linea, box) {
                const p1InBox = this.isPointInBox(linea.x1, linea.y1, box);
                const p2InBox = this.isPointInBox(linea.x2, linea.y2, box);
                
                return p1InBox && p2InBox || 
                       this.lineIntersectsBox(linea, box);
            }

            isPointInBox(x, y, box) {
                return x >= box.x && x <= box.x + box.width &&
                       y >= box.y && y <= box.y + box.height;
            }

            lineIntersectsBox(line, box) {
                const edges = [
                    { x1: box.x, y1: box.y, x2: box.x + box.width, y2: box.y },
                    { x1: box.x + box.width, y1: box.y, x2: box.x + box.width, y2: box.y + box.height },
                    { x1: box.x, y1: box.y + box.height, x2: box.x + box.width, y2: box.y + box.height },
                    { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.height }
                ];

                for (let edge of edges) {
                    if (this.linesIntersect(line, edge)) {
                        return true;
                    }
                }
                
                return false;
            }

            linesIntersect(line1, line2) {
                const a1 = line1.y2 - line1.y1;
                const b1 = line1.x1 - line1.x2;
                const c1 = a1 * line1.x1 + b1 * line1.y1;

                const a2 = line2.y2 - line2.y1;
                const b2 = line2.x1 - line2.x2;
                const c2 = a2 * line2.x1 + b2 * line2.y1;

                const determinant = a1 * b2 - a2 * b1;

                if (determinant === 0) {
                    return false;
                }

                const x = (b2 * c1 - b1 * c2) / determinant;
                const y = (a1 * c2 - a2 * c1) / determinant;

                return this.isBetween(x, line1.x1, line1.x2) &&
                       this.isBetween(y, line1.y1, line1.y2) &&
                       this.isBetween(x, line2.x1, line2.x2) &&
                       this.isBetween(y, line2.y1, line2.y2);
            }

            isBetween(value, bound1, bound2) {
                return value >= Math.min(bound1, bound2) && value <= Math.max(bound1, bound2);
            }
*/
            updateUI() {
                document.getElementById('zoomLevel').textContent = Math.round(this.scale * 100) + '%';
            }

            removevertices_elegidos() {
                this.lines = this.lines.filter(line => !this.vertices_elegidos.has(line.id));
                this.vertices_elegidos.clear();
                this.dibujar_captura();
                this.updateUI();
            }

            getvertices_elegidos() {
                return this.lines.filter(line => this.vertices_elegidos.has(line.id));
            }

            clearSelection() {
                this.vertices_elegidos.clear();
                this.dibujar_captura();
                this.updateUI();
            }

            resetView() {
                this.viewX = 0;
                this.viewY = 0;
                this.scale = 1;
                this.dibujar_captura();
                this.updateUI();
            }
        }



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




function cargar_config_lines(){
    $("#parametros_captura").html(`
        <legend>Contornos</legend>

        <input type="file" id="imageLoader"  style="display: none;" accept="image/*"  />
        <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>

        <span id="nombreArchivo" class="nombre-archivo"></span>
            <div class="slider-container">
            <label for="umbral_slider">Umbral de detección: <span id="umbral_value">50</span></label><br>
            <input type="range" id="umbral_slider" min="10" max="500" value="50">
        </div>
            Unificar adyacentes:<input type="checkbox" id="unificar_lineas_adyacentes" checked="checked" title="Unifica lineas adyacentes"/><br>                               
            <div class="slider-container">
            <label for="grosor_slider">Grosor lineas: <span id="grosor_value">2</span></label><br>
            <input type="range" id="grosor_slider" min="1" max="6"  step="1" value="2">
        </div>
            <div class="slider-container">
            <label for="vertices_slider">Vertices eliminados: <span id="vertices_value">10%</span></label><br>
            <input type="range" id="vertices_slider" min="0" max="95"  step="5" value="10">
        </div>
        <hr>
        Mostrar imagen:<input type="checkbox" id="mostrar_imagen" checked /><br>
        Detalle lineas:<input type="checkbox" id="detalle_lineas" checked_ />         
                       
        
        <select id="modo_seleccion">
            <option value='0'>seleccionar lineas</option>
            <option value='1'>seleccionar vertices</option>
        </select>
        
     
        <hr>
        <div id="lineas"></div> 
        
     
        Zoom:<span id="zoomLevel">100%</span></p>



        `);            
   


    const captureLines = new CaptureLines('lineCanvas');

 
}



function iniciar_captura_lines() {
   
    $("#select_capturar").append('<option value="cargar_config_lines">Contornos</option>');

    cargar_config_lines();
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', iniciar_captura_lines);
