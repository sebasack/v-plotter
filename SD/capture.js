
let originalCanvas = document.createElement('canvas');
let originalCtx = originalCanvas.getContext('2d');

// pongo como global la variable donde guardo el dibujo para poder redibujarla sin reprocesar todo
let dibujo = false;

////////////////////////////////////////// INTERFACE DE USUARIO //////////////////////////////////////////



let lineCanvas = document.getElementById('lineCanvas');
let lineCtx = lineCanvas.getContext('2d');


let lineOutput = document.getElementById('log');
let downloadBtn = document.getElementById('downloadBtn');
let umbral_value = document.getElementById('umbral_value');
let escala_value = document.getElementById('escala_value');
let grosor_value = document.getElementById('grosor_value');



// slider umbral de deteccion
let umbral_slider = document.getElementById('umbral_slider');
umbral_slider.addEventListener('input', update_umbral);


// slider escala 
let escalaSlider = document.getElementById('escala_captura');
escalaSlider.addEventListener('input', updateEscala);

// slider pen 
let grosorLineas = document.getElementById('grosor_slider');
grosorLineas.addEventListener('input', update_lines);


// slider vertices 
let reduccionVertices = document.getElementById('vertices_slider');
reduccionVertices.addEventListener('input', update_lines);



function update_umbral() {
    umbral_value.textContent = umbral_slider.value;
    if (originalCanvas.width > 0 && originalCanvas.height > 0) {
        obtener_lineas();
    }
}


function update_lines(){
    grosor_value.textContent = grosor_slider.value;
    vertices_value.textContent = vertices_slider.value + '%';
    obtener_lineas();
}


function updateEscala() {
    escala_value.textContent = escalaSlider.value;


    let detalle_lineas =  $("#detalle_lineas").prop("checked") ;
    
    escala = escalaSlider.value;

    if (lineCanvas.getContext) {


        lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        
        lineCtx.save();
        //lineCtx.translate(offsetX, offsetY);
        lineCtx.scale(escala,escala);    

        if (dibujo){
            dibujar_captura(dibujo,detalle_lineas);
        }
        //obtener_lineas();
    }
}



/*

function centrarEnCanvas(canvas_) {
    const anchoVentana =canvas.width;
    const altoVentana =canvas.height;
    const anchoCanvas = canvas_.width;
    const altoCanvas = canvas_.height;
    
    // Calcular posición centrada
    const left = (anchoVentana - anchoCanvas) / 2;
    const top = (altoVentana - altoCanvas) / 2;
    
    // Aplicar posición absoluta
    canvas_.style.position = 'absolute';
    canvas_.style.left = left + 'px';
    canvas_.style.top = top + 'px';
}


function calcularEscalaCanvas(canvas,ancho) {
    const anchoOriginal = canvas.width;
    const altoOriginal = canvas.height;
    
    // Calcular la escala para que el ancho sea 800px
    const escala = ancho / anchoOriginal;
    
    // Calcular el nuevo alto manteniendo la proporción
    const nuevoAlto = altoOriginal * escala;
    
    return {
        escala: escala,
        nuevoAncho: ancho,
        nuevoAlto: nuevoAlto
    };
}

*/

////////////////////////////////////////// FUNCIONES DE CAPTURA //////////////////////////////////////////

//CARGAR imagen
let imageLoader = document.getElementById('imageLoader');
imageLoader.addEventListener('change', handleImage, false);
imagen =false;

function handleImage(e) {
    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {


            imagen=img;
           
            // Ajustar tamaño del canvas donde proceso la imagen al de la imagen
            originalCanvas.width =  imagen.width;
            originalCanvas.height =  imagen.height;

            
            // agrando el canvas donde muestro el resultado para que tape el de la maquina y no se pueda modificar el zoom y offset
            lineCanvas.width = canvas.width;
            lineCanvas.height = canvas.height;

            // pongo el zoom y offset de la maquina en su posicion original
            resetZoom();
    
            
            // Dibujar imagen en el canvas original
            originalCtx.drawImage(img, 0, 0);     

            // Procesar imagen y detectar contornos
            obtener_lineas();

   
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}


// Función para calcular la distancia entre dos puntos
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}


function marcar_nodo(binaryEdges,circlePoints,unificarAdyacentes,y,x,color){   
    //console.log(JSON.stringify(circlePoints.relleno));    
    
    binaryEdges[y][x] = color;   // marco el primer punto, es la semilla si no voy a marcar lineas adyacentes

    circlePoints.relleno.forEach(function(punto) {                               
        marcar = true;
        if (!unificarAdyacentes){ // no unificar!                            
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


        // muestro donde esta el vertice
        //binaryEdges[y][x] = 2;

    });                 
}


        
function getCirclePoints(binaryEdges,centerX, centerY, radius, borderX=0, borderY=0, sentido_antihorario=true) {

    //  console.log('getCirclePoints('+centerX +','+ centerY+','+ radius+','+ borderX+','+ borderY+','+ sentido_antihorario+')' );

    const tipos = [];
                            
             /*|  1 |  2 | 3 | 4 | 5 |  6 | 7  | 8 */
    tipos[1] = [-1,0,-1,1,0,1,1,1,1,0,1,-1,0,-1,-1,-1]; 
    /* 8 7 6                                                                     
       1 . 5                                                                     
       2 3 4
    */                                                       

             /*|  1 |  2 |  3 | 4 | 5 | 6 | 7 |  8 | 9  | 10 |  11 |  12 */
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
    

                  /*| 1 |  2 |  3 |  4 |  5 | 6 | 7 | 8 | 9 | 10| 11| 12 | 13 | 14 | 15 | 16 |  17 |  18 |  19 |  20 */              
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
    let fill =[];                                 
    let closestIndex = 0;



    //agrego el centro a los puntos de relleno (fue movido a marcar_nodo para ser usado como semilla en la buzqueda de adyacentes)
    //fill.push([centerX, centerY]);

    a1=[]; // anillo 1 del relleno
    a2=[]; // anillo 2 del relleno
    a3=[]; // anillo 3 del relleno
    a4=[]; // anillo 4 del relleno
    a5=[]; // anillo 5 del relleno


    // busco el pixel con menos distancia al borde inicial
    let minDistance = distance(tipos[radius][0] + centerX, tipos[radius][1] + centerY, borderX, borderY);

    for (let i = 0; i < tipos[radius].length; i+=2) {                                                             
        
        // me aseguro de que quede dentro del canvas   
        if (tipos[radius][i] + centerX >= 0 && 
            tipos[radius][i+1] + centerY >= 0 &&
            tipos[radius][i] + centerX < originalCanvas.width && 
            tipos[radius][i+1] + centerY < originalCanvas.height ){ 
            
            points.push([tipos[radius][i] + centerX, tipos[radius][i+1] + centerY]);
            
            // lleno los distintos anillos para luego armar el rellono
            if (radius >= 2 && i < tipos[1].length &&
                tipos[1][i] + centerX >= 0 && 
                tipos[1][i+1] + centerY >= 0 &&
                tipos[1][i] + centerX < originalCanvas.width && 
                tipos[1][i+1] + centerY < originalCanvas.height &&
                binaryEdges[tipos[1][i+1]+ centerY][tipos[1][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                    a1.push([tipos[1][i] + centerX, tipos[1][i+1] + centerY]);                                                                                 
            }
            if (radius >= 3 && i < tipos[2].length &&
                tipos[2][i] + centerX >= 0 && 
                tipos[2][i+1] + centerY >= 0 &&
                tipos[2][i] + centerX < originalCanvas.width && 
                tipos[2][i+1] + centerY < originalCanvas.height  &&
                binaryEdges[tipos[2][i+1]+ centerY][tipos[2][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                    a2.push([tipos[2][i] + centerX, tipos[2][i+1] + centerY]);                                                                          
            }
            if (radius >= 4 && i < tipos[3].length &&
                tipos[3][i] + centerX >= 0 && 
                tipos[3][i+1] + centerY >= 0 &&
                tipos[3][i] + centerX < originalCanvas.width && 
                tipos[3][i+1] + centerY < originalCanvas.height &&
                binaryEdges[tipos[3][i+1]+ centerY][tipos[3][i]+ centerX] === 1 ){      // solo elijo puntos blancos                           
                    a3.push([tipos[3][i] + centerX, tipos[3][i+1] + centerY]);                                                                                
            }
            if (radius >= 5 && i < tipos[4].length &&
                tipos[4][i] + centerX >= 0 && 
                tipos[4][i+1] + centerY >= 0 &&
                tipos[4][i] + centerX < originalCanvas.width && 
                tipos[4][i+1] + centerY < originalCanvas.height &&
                binaryEdges[tipos[4][i+1]+ centerY][tipos[4][i]+ centerX] === 1 ){// solo elijo puntos blancos
                    a4.push([tipos[4][i] + centerX, tipos[4][i+1] + centerY]);                                                                          
            }
            if (radius >= 6 && i < tipos[5].length &&
                tipos[5][i] + centerX >= 0 && 
                tipos[5][i+1] + centerY >= 0 &&
                tipos[5][i] + centerX < originalCanvas.width && 
                tipos[5][i+1] + centerY < originalCanvas.height &&
                binaryEdges[tipos[5][i+1]+ centerY][tipos[5][i]+ centerX] === 1){// solo elijo puntos blancos
                    a5.push([tipos[5][i] + centerX, tipos[5][i+1] + centerY]);                                                                                 
            }                      

            // Encontrar el punto más cercano a la referencia
            const d = distance( tipos[radius][i] + centerX, tipos[radius][i+1] + centerY, borderX, borderY);
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


// funcion que muestra la matriz donde se procesan los graficos
function mostrar_matriz_debug(canvas,matriz){


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
            
            color = colores[matriz[y][x]];               

            debugCtx.lineWidth = 10;
            debugCtx.strokeStyle =color;
            debugCtx.fillStyle = color;

            debugCtx.fillStyle =color;
            debugCtx.fillRect(x, y, 1, 1); // x, y, ancho=1, alto=1
            debugCtx.stroke(); // Dibujar la línea            
            
        }
    }

};




// funcion que dado un punto negro parte del borde y un punto blanco adyacente sigue el borde y agrega los puntos a la linea
function seguir_linea(linea,binaryEdges,radio_pen,y,x,borde_y,borde_x,color=10,sentido_antihorario=true,unificarAdyacentes=true){        

    //   console.log(linea.id +'  seguir_linea ' + x + ',' + y + ' / '+borde_x+','+ borde_y + ' / '+ color);

    i_borde=1;
    while (i_borde > -1){
        i_borde =-1;
        i_nuevo_centro = -1;

        // genero los puntos del circulo del pen
        circlePoints = getCirclePoints(binaryEdges,x, y, radio_pen,borde_x,borde_y,sentido_antihorario) ;
    
        p = circlePoints.contorno;

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

                marcar_nodo(binaryEdges,circlePoints,unificarAdyacentes,p[i+1][1],p[i+1][0],color);  
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
   

//
function processImage(umbralDeteccion, porcentaje_vertices_eliminados=10,radio_pen=2,unificarAdyacentes=true){


    //  Variables globales
    dibujo = new Dibujo();

    // Limpiar canvas de líneas
    //lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    
    // Obtener datos de la imagen
    let imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    let data = imageData.data;
    
    // Crear matriz de grises y detectar bordes
    let grayMatrix = [];
    let edgeMatrix = [];
     
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

    //  mostrar_matriz_debug('debug2',grayMatrix);
    
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
    

//   mostrar_matriz_debug('debug',edgeMatrix);

    // Umbralizar para obtener bordes binarios
    let binaryEdges = [];
    
    for (let y = 0; y < originalCanvas.height; y++) {
        binaryEdges[y] = [];
        for (let x = 0; x < originalCanvas.width; x++) {
            if (y === 0 || y === originalCanvas.height-1 || x === 0 || x === originalCanvas.width-1) {
                binaryEdges[y][x] = 0; // Borde de la imagen
            } else {
                binaryEdges[y][x] = edgeMatrix[y][x] > umbralDeteccion ? 1 : 0;
            }
        }
    }
                    

    // busco ls primera linea blanca que encuentre y sigo el rastro
    color_linea =2;           

    // elimino el dibujo anterior si existia
    dibujo.limpiar();

    linea = dibujo.crearLinea( colores[color_linea]);

    for (let y = 0; y < originalCanvas.height; y++) {            
        for (let x = 0; x < originalCanvas.width; x++) {                    
            if (binaryEdges[y][x+1] === 1) { // econtre el primer punto blanco
                
                seguir_linea(linea,binaryEdges,radio_pen,y,x+1, y,x, color_linea,true,unificarAdyacentes);     
                // si se encontro solo un punto descarto la linea
                if (linea.vertices.length === 1 ) {
                    dibujo.eliminarLinea(linea.id);
                    linea = dibujo.crearLinea( colores[color_linea]);
                }

                //sigo la linea hacia el otro lado
                seguir_linea(linea,binaryEdges,radio_pen,y,x+1, y,x, color_linea,false,unificarAdyacentes);   
                // si se encontro solo un punto descarto la linea
                if (linea.vertices.length === 1) {
                    dibujo.eliminarLinea(linea.id);
                    linea = dibujo.crearLinea( colores[color_linea]);
                }

                if (linea.vertices.length >1){
                    linea = dibujo.crearLinea( colores[color_linea]);
                    color_linea ++;                               
                }                                             
            }
            
            if (color_linea ==16){
                color_linea =2;
            }
            
        }             
    }

    // la ultima linea creada nunca se va a llenar
    dibujo.eliminarLinea(linea.id);


    //mostrar_matriz_debug('debug',binaryEdges,true);
        
    // unifico lineas contiguas
    dibujo.unificarLineas(6);

    // reduzco cantidad de vertices
    dibujo.reducirVertices(porcentaje_vertices_eliminados );

    //retorno las el dibujo procesado
    return dibujo;
          
}

       
        

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




function dibujar_captura(dibujo,detalle_lineas = true){

    //eco(dibujo.obtenerInfoLineas());

   // mostrar_imagen_original();

    lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    lineCtx.save();

    if ($("#mostrar_imagen").prop("checked") ){
        lineCtx.drawImage(imagen, 0, 0);
    }   
    
    lineCtx.lineWidth = 1;

    if (!detalle_lineas){
        lineCtx.strokeStyle ="#000000";     
    }       

    dibujo.lineas.forEach(function(linea) {                 
        lineCtx.beginPath();

        if (detalle_lineas){  
             lineCtx.strokeStyle = linea.color;
        }   
         
        // Dibujar líneas
        lineCtx.moveTo(linea.vertices[0].x, linea.vertices[0].y);       
        d=distancia(linea.vertices[0],linea.vertices[linea.vertices.length-1]);        
        for (i=1;i< linea.vertices.length;i++){                                          
            lineCtx.lineTo(linea.vertices[i].x,linea.vertices[i].y);
            lineCtx.stroke();                      
        }    
      
    });



    lineCtx.restore();

   // lineCtx.closePath();
}  


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function obtener_lineas(){

    let radio_pen = parseInt(grosor_slider.value);
    let umbral = parseInt(umbral_slider.value);
    let unificarAdyacentes = $("#unificar_lineas_adyacentes").prop("checked") ;
    let detalle_lineas =  $("#detalle_lineas").prop("checked") ;
    let vertices_eliminados =  parseInt(vertices_slider.value);


    // capturo las lineas de la imagen con los parametros seleccionados
    dibujo_importado = processImage(umbral,vertices_eliminados,radio_pen,unificarAdyacentes );

    // muestro las estadisticas de la imagen
    $("#lineas").text("Lineas:"+dibujo_importado.cantidadLineas() + ", vertices:"+dibujo_importado.cantidadVertices());

   // console.log(dibujo);    
    

    // dibujo la figura

    dibujar_captura(dibujo_importado,detalle_lineas );


}