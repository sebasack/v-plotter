class lineas {
    constructor() {
        this.originalCanvas = document.createElement('canvas');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.imagen = false;
        this.umbral_value = 50;
        this.grosor_value = 2;
        
        this.unificar_adyacentes = false;

        this.init();
    }
         
    agregar_controles_captura(){        

        $("#parametros_captura").html(`
            <legend>Contornos</legend>

            <input type="file" id="imageLoader"  style="display: none;" accept="image/*"  />
            <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>

            <span id="nombreArchivo" class="nombre-archivo"></span>
            <div class="slider-container">
                <label for="umbral_slider">Umbral de detección: <span id="umbral_value">50</span></label><br>
                <input type="range" id="umbral_slider" min="10" max="500" value="50">
            </div>                                     
            <div class="slider-container">
                <label for="grosor_slider">Grosor lineas: <span id="grosor_value">2</span></label><br>
                <input type="range" id="grosor_slider" min="1" max="6"  step="1" value="2">
            </div>

            Unificar adyacentes:<input type="checkbox" id="unificar_lineas_adyacentes" checked="checked" title="Unifica lineas adyacentes"/><br>      
            `);

        // listeners de botones y sliders
        document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
        document.getElementById('umbral_slider').addEventListener('change', this.update_umbral.bind(this), false);
        document.getElementById('grosor_slider').addEventListener('change', this.update_grosor.bind(this), false);      
        document.getElementById('unificar_lineas_adyacentes').addEventListener('change', this.update_adyacentes.bind(this), false);                    
    }

    init() {        
        
        $("#select_capturar").append('<option value="cargar_config_lines">Contornos</option>');

             
        this.agregar_controles_captura();        

                       
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

    update_adyacentes(event){        
        this.unificar_adyacentes = $("#unificar_lineas_adyacentes").prop("checked") ;
        $('#grosor_value').html(event.target.value);
        this.obtener_lineas();
    }

    // funcion que dado un punto negro parte del borde y un punto blanco adyacente sigue el borde y agrega los puntos a la linea
    seguir_linea(linea,binaryEdges,radio_pen,y,x,borde_y,borde_x,color=10,sentido_antihorario=true,unificar_adyacentes=true){      

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


    // Función para calcular la distancia entre dos puntos
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // funcion que pinta del color elegido los puntos blancos dentro del circulo que respresenta el marcador
    marcar_nodo(binaryEdges,circlePoints,unificar_adyacentes,y,x,color){ 
        
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

    // funcion que genera la circunsferencia y el relleno del marcador 
    getCirclePoints(binaryEdges,centerX, centerY, radius, borderX=0, borderY=0, sentido_antihorario=true) {

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

    //funcion que procesa la imagen poniendola en escala de grises, aplicando filtros sobel y pasandola a blanco y negro, para despues seguir las lineas
    procesar_imagen(){

        //  Variables globales
        this.dibujo = new Dibujo();
        
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
    }

    obtener_lineas(){
        if (this.imagen === false){
            eco('sin imagen que procesar');
            return;
        }

        // capturo las lineas de la imagen con los parametros seleccionados
        this.procesar_imagen();

        // hago unificacion de lineas
        this.dibujo.unificarLineas(6);
      
        // muestro las estadisticas de la imagen
        $("#estadisticas").html("Lineas:" + this.dibujo.cantidadLineas() + "<br/>Vertices:" + this.dibujo.cantidadVertices());

        // entrego a captura el dibujo y la imagen que lo genero
        captura.dibujo = this.dibujo;
        captura.imagen = this.imagen;
        captura.dibujar_captura(true);
    }
    
    actualizarNombreArchivo() {
        const input = document.getElementById('imageLoader');
        const nombreSpan = document.getElementById('nombreArchivo');
        
        if (input.files.length > 0) {
            nombreSpan.textContent = input.files[0].name;
        }else{
            nombreSpan.textContent = '';
        }
    }

    // carga la imagen desde un archivo y la manda a procesar
    cargar_imagen(e){

        let reader = new FileReader();
        // reader.onload = function(event) {
        reader.onload = (event) => {
            let img = new Image();
            //img.onload = function() {
            img.onload = () => {
                this.imagen = img;
             
                this.actualizarNombreArchivo();
            
                // Ajustar tamaño del canvas donde proceso la imagen al de la imagen
                this.originalCanvas.width = this.imagen.width;
                this.originalCanvas.height = this.imagen.height;
                
                // Dibujar imagen en el canvas original
                this.originalCtx.drawImage(img, 0, 0);     

                // Procesar imagen y detectar contornos
                this.obtener_lineas();    
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);            
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let captureLines = false;

function cargar_config_lines(){
    captureLines.agregar_controles_captura();
}

// Ejecutar el modulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function(){
    captureLines = new lineas();   
});
