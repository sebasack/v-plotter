
        function mostrar_matriz(canvas,matriz){



         let canvas1 = document.getElementById(canvas);
        let debugCtx = canvas1.getContext('2d');


               canvas1.width =  imagen.width;
            canvas1.height = imagen.height;

 
     
            borde =0;
             if (matriz[0] === undefined) {
                borde =1;
             }
            let width = matriz[borde].length;
           let  height= matriz.length; 


              // Limpiar el canvas
            //    debugCtx.clearRect(0, 0, width, height);
                               
                // Dibujar puntos
             
            for (let y = borde; y < height-borde; y++) {
                for (let x = borde; x < width-borde; x++) {               
                
                    color =  matriz[y][x];
                    if (color === 0){
                        color="#000000";
                    }else if (color === 1){
                        color="#ffffff";
                    }else if (color === 2){
                        color="#ff0000";         
                    }else if ( color === 3){                     
                        color="#0000ff";     
                    }else{
                        color="#00ff00";                   
                    }             

                    debugCtx.lineWidth = 10;
                    debugCtx.strokeStyle =color;
                    debugCtx.fillStyle = color;

                    debugCtx.fillStyle =color;
                    debugCtx.fillRect(x, y, 1, 1); // x, y, ancho=1, alto=1
                    debugCtx.stroke(); // Dibujar la línea
                   
                   
                }
            }

        };
        
        function processImage() {
       //     console.log('procesando...');
            // Limpiar canvas de líneas
            lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
            
            // Obtener datos de la imagen
            let imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
            let data = imageData.data;
            
            // Crear matriz de grises y detectar bordes
            let grayMatrix = [];
            let edgeMatrix = [];
            let threshold = parseInt(thresholdSlider.value);
            
            // Convertir a escala de grises
            for (let y = 0; y < originalCanvas.height; y++) {
                grayMatrix[y] = [];
                for (let x = 0; x < originalCanvas.width; x++) {
                    let idx = (y * originalCanvas.width + x) * 4;
                    let r = data[idx];
                    let g = data[idx + 1];
                    let b = data[idx + 2];
                    // Fórmula para convertir RGB a escala de grises
                    grayMatrix[y][x] = 0.3 * r + 0.59 * g + 0.11 * b;
                }
            }

          //  mostrar_matriz('debug2',grayMatrix);
            
            // Aplicar detección de bordes simple (operador Sobel simplificado)
            for (let y = 1; y < originalCanvas.height - 1; y++) {
                edgeMatrix[y] = [];
                for (let x = 1; x < originalCanvas.width - 1; x++) {
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
            


       //   mostrar_matriz('debug',edgeMatrix);

            // Umbralizar para obtener bordes binarios
            let binaryEdges = [];
            
            for (let y = 0; y < originalCanvas.height; y++) {
                binaryEdges[y] = [];
                for (let x = 0; x < originalCanvas.width; x++) {
                    if (y === 0 || y === originalCanvas.height-1 || x === 0 || x === originalCanvas.width-1) {
                        binaryEdges[y][x] = 0; // Borde de la imagen
                    } else {
                        binaryEdges[y][x] = edgeMatrix[y][x] > threshold ? 1 : 0;
                    }
                }
            }

            
          mostrar_matriz('debug',binaryEdges);

          radio_pen = parseInt(lines_slider.value);
 
   

           // Función para calcular la distancia entre dos puntos
            function distance(x1, y1, x2, y2) {
                return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            }

            
            function getCirclePoints(centerX, centerY, radius,borderX=0,borderY=0) {

                const tipos = [];
                                       
                        /*|  1 |  2 | 3 | 4 | 5 |  6 | 7  | 8 */
                tipos[1] = [-1,0,-1,1,0,1,1,1,1,0,1,-1,0,-1,-1,-1]; 
                /* 8 7 6                                                                     
                   1 . 5                                                                     
                   2 3 4*/                                                       

                          /*  1    2    3   4   5   6   7   8    9    10    11    12 */
                tipos[2] = [-2,0,-2,1,-1,2,0,2,1,2,2,1,2,0,2,-1,1,-2,0,-2,-1,-2,-2,-1];
                /*   11 10  9                           
                  12          8
                   1    .     7
                   2          6 
                     3  4  5
                */        
                          
                          /*  1    2    3    4   5   6   7   8   9   10   11   12   13    14    15    16 */              
                tipos[3] = [-3,0,-3,1,-2,2,-1,3,0,3,1,3,2,2,3,1,3,0,3,-1,2,-2,1,-3,0,-3,-1,-3,-2,-2,-3,-1]; 
                /*   14 13 12
                   15        11
                 16            10
                  1      .      9 
                  2             8
                    3         7
                      4  5  6
                */
              

                           /* 1 |  2 |  3 |  4 |  5 | 6 | 7 | 8 | 9 | 10| 11| 12 | 13 | 14 | 15 | 16 |  17 |  18 |  19 |  20 */              
            //  tipos[4] = [-4,0,-4,1,-3,2,-2,3,-1,4,0,4,1,4,2,3,3,2,4,1,4,0,4,-1,3,-2,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-2,-4,-1];
                /*     17 16 15
                     18        14
                   19            13
                 20                12
                  1       .        11
                  2                10
                    3             9
                      4         8
                        5  6  7
                */               


                           /* 1 |  2 |  3 |  4 |  5 | 6  | 7 | 8 | 9 | 10| 11| 12| 13| 14 | 15 | 16 | 17 | 18 | 19 |  20 |  21 |  22 |  23 |  24*/              
                tipos[4] = [-4,0,-4,1,-3,2,-3,3,-2,3,-1,4,0,4,1,4,2,3,3,3,3,2,4,1,4,0,4,-1,3,-2,3,-3,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-3,-3,-2,-4,-1];
                /*      20 19 18
                   22 21        17 16
                   23              15
                 24                  14
                  1        .         13
                  2                  12
                    3              11
                    4  5         9 10
                        6  7  8
                */               
                
                      


                         /* | 1 | 2  |  3 |  4 |  5 |  6 |  7 | 8 | 9 | 10| 11| 12| 13| 14| 15| 16 | 17 | 18 | 19 | 20 | 21 | 22 |  23 |  24 |  25 |  26 |  27 | 28  */    
                tipos[5] = [-5,0,-5,1,-4,2,-4,3,-3,4,-2,4,-1,5,0,5,1,5,2,4,3,4,4,3,4,2,5,1,5,0,5,-1,4,-2,3,-4,4,-3,2,-4,1,-5,0,-5,-1,-5,-2,-4,-3,-4,-4,-3,-4,-2,-5,-1];
                /*       23 22 21
                    25 24        20 19
                  26                  18
                  27                  17
                28                      16
                 1           .          15
                 2                      14
                   3                  13
                   4                  12
                     5 6         10 11
                         7  8  9                
                */
            
                         /* | 1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 | 9 | 10| 11| 12| 13| 14| 15| 16| 17| 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 |  26 |  27 |  28 |  29 |  30 |  31 |  32  */    
                tipos[6] = [-6,0,-6,1,-5,2,-5,3,-4,4,-3,5,-2,5,-1,6,0,6,1,6,2,5,3,5,4,4,5,3,5,2,6,1,6,0,6,-1,5,-2,5,-3,4,-4,3,-5,2,-5,1,-6,0,-6,-1,-6,-2,-5,-3,-5,-4,-4,-5,-3,-5,-2,-6,-1];           
                /*          26 25 24
                       28 17        23 22
                     29                  21
                   30                      20
                   31                      19
                32                           18 
                 1             .             17
                 2                           16
                   3                       15
                   4                       14
                      5                  13
                        6  7        11 12
                            8  9  10
                */
            
                
                const points = [];

                for (let i = 0; i < tipos[radius].length; i+=2) {
                    // me aseguro de que quede dentro del canvas                       
                    
                    // Encontrar el punto más cercano a la referencia
                    let closestIndex = 0;
                   
                    let minDistance = distance(tipos[radius][0] + centerX, tipos[radius][1] + centerY, borderX, borderY);
                   
                    if (centerX - radius > 0 && centerY - radius > 0 && centerX + radius < originalCanvas.width && centerY + radius < originalCanvas.height ){ 
                      
                        points.push([ tipos[radius][i] + centerX, tipos[radius][i+1] + centerY]);

                        const d = distance( tipos[radius][i] + centerX, tipos[radius][i+1] + centerY, borderX, borderY);
                        if (d < minDistance) {
                            minDistance = d;
                            closestIndex = i;
                        }
                    }
                  
                }


                // Reordenar el array comenzando desde el punto más cercano
                return points.slice(closestIndex).concat(points.slice(0, closestIndex));

                return points;

            }
        

            // Función para ordenar los puntos del círculo comenzando desde el más cercano a [x1,y1]
            function orderPointsFromReference(points, refX, refY) {
                if (points.length === 0) return points;
                
                // Encontrar el punto más cercano a la referencia
                let closestIndex = 0;
                let minDistance = distance(points[0][0], points[0][1], refX, refY);
                
                for (let i = 1; i < points.length; i++) {
                    const d = distance(points[i][0], points[i][1], refX, refY);
                    if (d < minDistance) {
                        minDistance = d;
                        closestIndex = i;
                    }
                }
                
                // Reordenar el array comenzando desde el punto más cercano
                return points.slice(closestIndex).concat(points.slice(0, closestIndex));
            }




          function marcar_nodo(binaryEdges,circlePoints,y,x,color){                     
                for (let y1 = y-radio_pen; y1 < y+radio_pen; y1++) {
                    for (let x1 = x-radio_pen; x1 < x+radio_pen; x1++) {
                        if (x1>0 && y1>0 && x1< originalCanvas.width && y1<originalCanvas.height){
                            binaryEdges[y1][x1] = 2;
                        }                        
                    }
                }                    
                binaryEdges[y][x] = 3;
          }

          function seguir_linea(binaryEdges,y,x,borde_y, borde_x,color=10){ 
            
                // busco el siguiente pixel blanco mas cercano al actual 

                // genero los puntos del circulo del pen
                circlePoints = getCirclePoints(x, y, radio_pen) ;

                  // Ordenar puntos comenzando desde el más cercano a [refX, refY]
                const orderedPoints = orderPointsFromReference(circlePoints, borde_x, borde_y);
                                   

                // comenzando en el borde enviado hasta que encuentre un pixel blanco, alternando entre un lado y otro del borde
                
                marcar_nodo(binaryEdges,circlePoints,y,x,color);    
                   

            
          }


          // busco ls primera linea blanca que encuentre y sigo el rastro
            color_linea =10;
           for (let y = 0; y < originalCanvas.height; y++) {            
                for (let x = 0; x < originalCanvas.width; x++) {
                    if (binaryEdges[y][x+1] === 1) { // econtre el primer punto blanco a la derecha del borde negro!!
                        seguir_linea(binaryEdges,y,x+1,y,x,color_linea);      
                        color_linea ++;        
                    }

                    if (binaryEdges[y][x] === 1 && binaryEdges[y][x+1] === 0) { // econtre un punt negro luego de uno blanco!! eso es por que habia una linea blanca muy ancha
                      //  seguir_linea(binaryEdges,y,x+1,y,x,color_linea);      
                      //color_linea ++;        
                      console.warn("FALTA IMPLEMENTAR SEGUIR LINEA INVERSO!!!");
                    }
                }             
            }

              
            mostrar_matriz('debug',binaryEdges,true);

/******************************ORIGINAL******************************************
            // Convertir bordes a líneas (algoritmo simplificado)
            currentLines = [];
            
            
            // Recorrer la matriz de bordes y conectar puntos adyacentes
            for (let y = 0; y < originalCanvas.height; y++) {
                for (let x = 0; x < originalCanvas.width; x++) {
                    if (binaryEdges[y][x] === 1) {
                        // Buscar puntos adyacentes para formar líneas
                        let line = traceLine(binaryEdges, x, y);
                        if (line && line.length > 1) {
                            // Simplificar la línea a segmentos rectos
                            let simplifiedLines = simplifyLine(line);
                            currentLines = currentLines.concat(simplifiedLines);
                        }
                    }
                }
            }
                
           

            //reduzco los lineas
            console.log(currentLines.length);
            currentLines=  reduceLines(currentLines) ;
***************************************************************************/
            
            // Dibujar líneas en el canvas
            drawLines(currentLines);
            
            // Mostrar líneas en el área de texto
            updateOutputText();
        }
        
        function traceLine(edges, startX, startY) {
            // Algoritmo simple para seguir un contorno
            let points = [];
            let x = startX;
            let y = startY;
            
            // Marcar este punto como visitado
            edges[y][x] = 0;
            points.push([x, y]);
            
            // Direcciones para buscar puntos adyacentes (8-vecinos)
            let directions = [
                [-1, -1], [0, -1], [1, -1],
                [-1, 0],           [1, 0],
                [-1, 1],  [0, 1],  [1, 1]
            ];
            
            let foundNext = true;
            
            while (foundNext) {
                foundNext = false;
                
                for (let i = 0; i < directions.length; i++) {
                    let newX = x + directions[i][0];
                    let newY = y + directions[i][1];
                    
                    // Verificar límites
                    if (newX >= 0 && newX < edges[0].length && 
                        newY >= 0 && newY < edges.length) {
                        
                        if (edges[newY][newX] === 1) {
                            // Encontramos el siguiente punto
                            x = newX;
                            y = newY;
                            edges[y][x] = 0; // Marcar como visitado
                            points.push([x, y]);
                            foundNext = true;
                            break;
                        }
                    }
                }
            }
            
            //console.log(points);
                        
            return points;
        }
        
        function simplifyLine(points) {
            // Algoritmo muy simple para convertir puntos en segmentos de línea
            let lines = [];
            
            if (points.length < 2) return lines;
            
            // Solo tomar puntos cada ciertos píxeles para simplificar
            let step = 5;
            for (let i = 0; i < points.length - step; i += step) {
                let x1 = points[i][0];
                let y1 = points[i][1];
                let x2 = points[i + step][0];
                let y2 = points[i + step][1];
                
                lines.push([x1, y1, x2, y2]);
            }
            
            return lines;
        }
        
        function drawLines(lines) {
            lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
            lineCtx.strokeStyle = '#ff0000';
            lineCtx.lineWidth = 1;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                lineCtx.beginPath();
                lineCtx.moveTo(line[0], line[1]);
                lineCtx.lineTo(line[2], line[3]);
                lineCtx.stroke();
            }
        }
        
        function updateOutputText() {
            let outputText = "";
            for (let i = 0; i < currentLines.length; i++) {
                let line = currentLines[i];
                outputText += `[${line[0]},${line[1]},${line[2]},${line[3]}],\n`;
            }
            
            lineOutput.value = currentLines.length +"\n"+ outputText;
        }
        
        function toggleOriginalImage() {
            showOriginalImage = !showOriginalImage;
            
            if (showOriginalImage) {
                originalCanvas.style.display = 'block';
                toggleImageBtn.textContent = 'Ocultar Imagen Original';
            } else {
                originalCanvas.style.display = 'none';
                toggleImageBtn.textContent = 'Mostrar Imagen Original';
            }
        }
        
        function downloadLines() {
            const blob = new Blob([lineOutput.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lineas.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        
        // Calcular ángulo entre dos vectores en grados
        function calculateAngle(v1, v2) {
            const dot = v1.x * v2.x + v1.y * v2.y;
            const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            
            // Evitar división por cero
            if (mag1 * mag2 === 0) return 0;
            
            const cosAngle = dot / (mag1 * mag2);
            // Asegurar que el valor esté en el rango válido para acos
            const clamped = Math.max(-1, Math.min(1, cosAngle));
            const angleRad = Math.acos(clamped);
            return angleRad * (180 / Math.PI); // Convertir a grados
        }
        
        // Reducir líneas según el ángulo
        function reduceLines(lines) {
            const maxAngle = parseFloat(15);
            if (isNaN(maxAngle) || maxAngle < 0 || maxAngle > 180) {
                alert("Por favor, introduce un ángulo válido entre 0 y 180 grados.");
                return;
            }
            
            if (lines.length < 2) return; // No hay suficientes líneas para procesar
            
            const newLines = [];
            let i = 0;
            
            while (i < lines.length) {
                if (i === lines.length - 1) {
                    // Última línea, añadirla sin cambios
                    newLines.push(lines[i]);
                    break;
                }
                
                // Calcular vectores de las líneas actual y siguiente
              //  let currentLine = lines[i];
              //  let nextLine = lines[i + 1];
              let currentLine;
              let nextLine;

                currentLine=  {
                    start:{x:lines[i][0],y:lines[i][1]},
                    end: {x:lines[i][2],y:lines[i][3]}
                };
                nextLine=  {
                    start:{x:lines[i+1][0],y:lines[i+1][1]},
                    end: {x:lines[i+1][2],y:lines[i+1][3]}
                };

                angle=20;

                if (currentLine.end.x==nextLine.start.x && currentLine.end.y==nextLine.start.y ){
                    const v1 = {
                        x: currentLine.end.x - currentLine.start.x,
                        y: currentLine.end.y - currentLine.start.y
                    };
                    
                    const v2 = {
                        x: nextLine.end.x - nextLine.start.x,
                        y: nextLine.end.y - nextLine.start.y
                    };
                    
                    // Calcular ángulo entre las líneas
                     angle = calculateAngle(v1, v2);
                }               
               
                
                if (angle <= maxAngle) {
                    // Unir las líneas (eliminar el punto intermedio)
                    newLines.push([currentLine.start.x,currentLine.start.y,nextLine.end.x,nextLine.end.y]);                
                    i += 2; // Saltar la siguiente línea ya que la hemos unido
                } else {
                    // Mantener la línea actual                 
                      newLines.push([currentLine.start.x,currentLine.start.y,currentLine.end.x,currentLine.end.y]);
                    i += 1;
                }
            }
            
            lines = newLines;

            return lines;
        }    






////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


