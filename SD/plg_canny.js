
class CannyEdgeDetector {
    constructor() {
        this.gaussianKernel = this.createGaussianKernel(5, 1.4);
    }

    detectEdges(imageData, width, height, lowThreshold = 20, highThreshold = 50) {
        //console.log("Iniciando detección de bordes...");
        
        // 1. Convertir a escala de grises
        //console.log("Convirtiendo a escala de grises...");
        const grayData = this.convertToGrayscale(imageData, width, height);
        
        // 2. Aplicar filtro Gaussiano
        //console.log("Aplicando filtro Gaussiano...");
        const smoothed = this.applyGaussianBlur(grayData, width, height);
        
        // 3. Calcular gradientes
        //console.log("Calculando gradientes...");
        const { magnitude, direction } = this.computeGradients(smoothed, width, height);
        
        // 4. Supresión de no máximos
        //console.log("Aplicando supresión de no máximos...");
        const suppressed = this.nonMaximumSuppression(magnitude, direction, width, height);
        
        // 5. Umbralización con histéresis
        //console.log("Aplicando umbralización con histéresis...");
        const edges = this.hysteresisThresholding(suppressed, width, height, lowThreshold, highThreshold);
        
        //console.log("Detección de bordes completada");
        return edges;
    }

    convertToGrayscale(imageData, width, height) {
        const gray = new Array(height);
        for (let y = 0; y < height; y++) {
            gray[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];
                gray[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
            }
        }
        return gray;
    }

    createGaussianKernel(size, sigma) {
        const kernel = [];
        const center = Math.floor(size / 2);
        let sum = 0;

        for (let y = 0; y < size; y++) {
            kernel[y] = [];
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                kernel[y][x] = value;
                sum += value;
            }
        }

        // Normalizar el kernel
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }

        return kernel;
    }

    applyGaussianBlur(data, width, height) {
        const kernelSize = this.gaussianKernel.length;
        const radius = Math.floor(kernelSize / 2);
        const blurred = new Array(height);
        
        for (let y = 0; y < height; y++) {
            blurred[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                let sum = 0;
                
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const ny = y + ky - radius;
                        const nx = x + kx - radius;
                        
                        // Manejar bordes con reflejo
                        const reflectY = Math.max(0, Math.min(height - 1, Math.abs(ny < 0 ? -ny : (ny >= height ? 2 * height - 1 - ny : ny))));
                        const reflectX = Math.max(0, Math.min(width - 1, Math.abs(nx < 0 ? -nx : (nx >= width ? 2 * width - 1 - nx : nx))));
                        
                        sum += data[reflectY][reflectX] * this.gaussianKernel[ky][kx];
                    }
                }
                
                blurred[y][x] = sum;
            }
        }
        
        return blurred;
    }

    computeGradients(data, width, height) {
        // Kernels de Sobel
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        const magnitude = new Array(height);
        const direction = new Array(height);
        
        // Inicializar matrices
        for (let y = 0; y < height; y++) {
            magnitude[y] = new Array(width).fill(0);
            direction[y] = new Array(width).fill(0);
        }
        
        // Calcular gradientes para píxeles internos
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;
                
                // Aplicar kernels de Sobel
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = data[y + ky][x + kx];
                        gx += pixel * sobelX[ky + 1][kx + 1];
                        gy += pixel * sobelY[ky + 1][kx + 1];
                    }
                }
                
                // Calcular magnitud y dirección
                magnitude[y][x] = Math.sqrt(gx * gx + gy * gy);
                direction[y][x] = Math.atan2(gy, gx);
            }
        }
        
        return { magnitude, direction };
    }

    nonMaximumSuppression(magnitude, direction, width, height) {
        const suppressed = new Array(height);
        
        // Inicializar matriz de salida
        for (let y = 0; y < height; y++) {
            suppressed[y] = new Array(width).fill(0);
        }
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const angle = direction[y][x] * (180 / Math.PI);
                const mag = magnitude[y][x];
                
                // Normalizar ángulo a 0, 45, 90, 135 grados
                let q = 255;
                let r = 255;
                
                // Ángulo 0° (horizontal)
                if ((angle < 22.5 && angle >= -22.5) || angle >= 157.5 || angle < -157.5) {
                    q = magnitude[y][x + 1];
                    r = magnitude[y][x - 1];
                }
                // Ángulo 45° (diagonal \)
                else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
                    q = magnitude[y + 1][x + 1];
                    r = magnitude[y - 1][x - 1];
                }
                // Ángulo 90° (vertical)
                else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
                    q = magnitude[y + 1][x];
                    r = magnitude[y - 1][x];
                }
                // Ángulo 135° (diagonal /)
                else if ((angle >= 112.5 && angle < 157.5) || (angle >= -67.5 && angle < -22.5)) {
                    q = magnitude[y + 1][x - 1];
                    r = magnitude[y - 1][x + 1];
                }
                
                // Mantener solo si es máximo local
                if (mag >= q && mag >= r) {
                    suppressed[y][x] = mag;
                }
            }
        }
        
        return suppressed;
    }

    hysteresisThresholding(data, width, height, lowThreshold, highThreshold) {
        const edgeMatrix = new Array(height);
        
        // Inicializar matriz de bordes
        for (let y = 0; y < height; y++) {
            edgeMatrix[y] = new Array(width).fill(0);
        }
        
        // Primera pasada: identificar bordes fuertes y débiles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = data[y][x];
                if (value >= highThreshold) {
                    edgeMatrix[y][x] = 2; // Borde fuerte
                } else if (value >= lowThreshold) {
                    edgeMatrix[y][x] = 1; // Borde débil
                }
            }
        }
        
        // Segunda pasada: conectar bordes débiles a fuertes
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (edgeMatrix[y][x] === 1) { // Borde débil
                    // Verificar si está conectado a un borde fuerte
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (edgeMatrix[y + dy][x + dx] === 2) {
                                edgeMatrix[y][x] = 2; // Convertir a fuerte
                                break;
                            }
                        }
                        if (edgeMatrix[y][x] === 2) break;
                    }
                    
                    // Si no está conectado, eliminar
                    if (edgeMatrix[y][x] === 1) {
                        edgeMatrix[y][x] = 0;
                    }
                }
            }
        }
        
        // Convertir a matriz binaria (1 = borde, 0 = no borde)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                edgeMatrix[y][x] = edgeMatrix[y][x] === 2 ? 1 : 0;
            }
        }
        
        return edgeMatrix;
    }
}


//////////////////////////////////////////////// CLASE CANNY ////////////////////////////////////////////////


class canny {
    constructor() {
        this.originalCanvas = document.createElement('canvas');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.canvas_debug = false;

        this.nombre_archivo_imagen = '';
        this.imagen = false;
        this.lowThreshold = 20;
        this.highThreshold = 50;
        this.grosor_value = 2;


        
        this.unificar_adyacentes = false;

        this.init();
    }

    init() {
        $("#select_capturar").append('<option value="cargar_config_canny">Canny</option>');             
        //this.agregar_controles_captura();

    }

    agregar_controles_captura(){        

        $("#parametros_captura").html(`
            <legend>Contornos</legend>

            <input type="file" id="imageLoader"  style="display: none;" accept="image/*"  />
            <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>

      
            <span id="nombreArchivo" class="nombre-archivo"></span>
            
            <div class="slider-container">
                <label for="lowThreshold">Umbral Bajo:</label>
                <input type="range" id="lowThreshold" min="1" max="100" value="20">
                <span id="lowValue" class="value">20</span>
            </div>
            
            <div class="slider-container">
                <label for="highThreshold">Umbral Alto:</label>
                <input type="range" id="highThreshold" min="1" max="100" value="50">
                <span id="highValue" class="value">50</span>
            </div>

            <div class="slider-container">
                <label for="grosor_slider">Grosor lineas: <span id="grosor_value">2</span></label><br>
                <input type="range" id="grosor_slider" min="1" max="6"  step="1" value="2">
            </div>
            

            Unificar adyacentes:<input type="checkbox" id="unificar_lineas_adyacentes" checked="checked" title="Unifica lineas adyacentes"/><br>      
            `);

        // listeners de botones y sliders
        document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
        document.getElementById('lowThreshold').addEventListener('input', this.update_lowThreshold.bind(this), false);
        document.getElementById('highThreshold').addEventListener('input', this.update_highThreshold.bind(this), false);      
        document.getElementById('grosor_slider').addEventListener('input', this.update_grosor.bind(this), false);      
        document.getElementById('unificar_lineas_adyacentes').addEventListener('change', this.update_adyacentes.bind(this), false);                    
    }
    
    update_grosor(event){   
        this.grosor_value = event.target.value;
        $('#grosor_value').html(event.target.value);
        this.obtener_lineas();
    }    


    update_lowThreshold(event){   
        this.lowThreshold = event.target.value;

        $('#lowValue').html(this.lowThreshold);
        if (parseInt(this.lowThreshold) >= parseInt(this.highThreshold)) {
            this.highThreshold = parseInt(this.lowThreshold ) + 1;
            $('#highValue').html(this.highThreshold );
            $('#highThreshold').val(this.highThreshold );
        }
     
        this.obtener_lineas();
    }

    update_highThreshold(event){   
        this.highValue = event.target.value;

        $('#highValue').html(this.highValue);

        if (parseInt(this.highValue) <= parseInt(this.lowThreshold)) {
            this.lowThreshold = parseInt(this.highValue) - 1;
            $('#lowValue').html(this.lowThreshold);
            $('#lowThreshold').val(this.lowThreshold );
        }
       
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
                    //MUESTRO EL PUNTO INICIAL DE BUSQUEDA Y EL PUNTO ESPERADO DE AVANCE
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
        /*  111009                           
        * 12      08
        * 01   .  07
        * 02      06 
        *   030405
        */        

                    /*  1    2    3    4   5   6   7   8   9   10   11   12   13    14    15    16 */              
        tipos[3] = [-3,0,-3,1,-2,2,-1,3,0,3,1,3,2,2,3,1,3,0,3,-1,2,-2,1,-3,0,-3,-1,-3,-2,-2,-3,-1]; 
        /*   141312
        *  15      11
        *16          10
        *01     .    09 
        *02          08
        *  03      07
        *    040506
        */
        
                    /*| 1 |  2 |  3 |  4 |  5 | 6 | 7 | 8 | 9 | 10| 11| 12 | 13 | 14 | 15 | 16 |  17 |  18 |  19 |  20 */              
        //  tipos[4] = [-4,0,-4,1,-3,2,-2,3,-1,4,0,4,1,4,2,3,3,2,4,1,4,0,4,-1,3,-2,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-2,-4,-1];
        /*     171615
        *    18      14
        *  19          13
        *20              12
        *01      .       11
        *02              10
        *  03          09
        *    04      08
        *      050607
        */               


                /* 1 |  2 |  3 |  4 |  5 | 6  | 7 | 8 | 9 | 10| 11| 12| 13| 14 | 15 | 16 | 17 | 18 | 19 |  20 |  21 |  22 |  23 |  24*/              
        tipos[4] = [-4,0,-4,1,-3,2,-3,3,-2,3,-1,4,0,4,1,4,2,3,3,3,3,2,4,1,4,0,4,-1,3,-2,3,-3,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-3,-3,-2,-4,-1];
        /*     201918
        *  2221      1716
        *  23          15
        *24              14
        *01       .      13
        *02              12
        *  03          11
        *  0405      0910
        *      060708
        */               
                       

                    /* | 1 | 2  |  3 |  4 |  5 |  6 |  7 | 8 | 9 | 10| 11| 12| 13| 14| 15| 16 | 17 | 18 | 19 | 20 | 21 | 22 |  23 |  24 |  25 |  26 |  27 | 28  */    
        tipos[5] = [-5,0,-5,1,-4,2,-4,3,-3,4,-2,4,-1,5,0,5,1,5,2,4,3,4,4,3,4,2,5,1,5,0,5,-1,4,-2,3,-4,4,-3,2,-4,1,-5,0,-5,-1,-5,-2,-4,-3,-4,-4,-3,-4,-2,-5,-1];
        /*       232221
        *    2524      2019
        *  26              18
        *  27              17
        *28                  16
        *01         .        15
        *02                  14
        *  03              13
        *  04              12
        *    0506      1011
        *        070809                
        */

                /* | 1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 | 9 | 10| 11| 12| 13| 14| 15| 16| 17| 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 |  26 |  27 |  28 |  29 |  30 |  31 |  32  */    
        tipos[6] = [-6,0,-6,1,-5,2,-5,3,-4,4,-3,5,-2,5,-1,6,0,6,1,6,2,5,3,5,4,4,5,3,5,2,6,1,6,0,6,-1,5,-2,5,-3,4,-4,3,-5,2,-5,1,-6,0,-6,-1,-6,-2,-5,-3,-5,-4,-4,-5,-3,-5,-2,-6,-1];           
        /*         262524
        *      2817      2322
        *    29              21
        *  30                  20
        *  31                  19
        *32                      18 
        *01           .          17
        *02                      16
        *  03                  15
        *  04                  14
        *    05              13
        *      0607      1112
        *          080910
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
                    binaryEdges[tipos[3][i+1]+ centerY][tipos[3][i]+ centerX] === 1 ){ // solo elijo puntos blancos                           
                        a3.push([tipos[3][i] + centerX, tipos[3][i+1] + centerY]);                                                                                
                }
                if (radius >= 5 && i < tipos[4].length &&
                    tipos[4][i] + centerX >= 0 && 
                    tipos[4][i+1] + centerY >= 0 &&
                    tipos[4][i] + centerX <this.originalCanvas.width && 
                    tipos[4][i+1] + centerY <this.originalCanvas.height &&
                    binaryEdges[tipos[4][i+1]+ centerY][tipos[4][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                        a4.push([tipos[4][i] + centerX, tipos[4][i+1] + centerY]);                                                                          
                }
                if (radius >= 6 && i < tipos[5].length &&
                    tipos[5][i] + centerX >= 0 && 
                    tipos[5][i+1] + centerY >= 0 &&
                    tipos[5][i] + centerX <this.originalCanvas.width && 
                    tipos[5][i+1] + centerY <this.originalCanvas.height &&
                    binaryEdges[tipos[5][i+1]+ centerY][tipos[5][i]+ centerX] === 1){ // solo elijo puntos blancos
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


    // funcion que muestra la matriz donde se procesan los graficos
    mostrar_matriz_debug(matriz){
      
        // si el canvas no fue creado lo crea
        if (!this.canvas_debug){
            const contenedor = document.getElementById('id_contenedor_canvas');            
            this.canvas_debug = document.createElement('canvas');    
            
            // Estilos 
            Object.assign(this.canvas_debug.style, {
                position: 'absolute', 
                top: '0', 
                left: '0',
            });

            contenedor.appendChild(this.canvas_debug);
        }

        const debugCtx = this.canvas_debug.getContext('2d');                             

        this.canvas_debug.width =  this.imagen.width;
        this.canvas_debug.height = this.imagen.height;

        let borde =0;
        if (matriz[0] === undefined) {
            borde =1;
        }

        let width = matriz[borde].length;
        let height= matriz.length; 
                            
        // Dibujar puntos        
        for (let y = borde; y < height-borde; y++) {
            for (let x = borde; x < width-borde; x++) {  
                
                let color = colores[matriz[y][x]];               

                debugCtx.lineWidth = 10;
                debugCtx.strokeStyle =color;
                debugCtx.fillStyle = color;

                debugCtx.fillStyle =color;
                debugCtx.fillRect(x, y, 1, 1); // x, y, ancho=1, alto=1
                debugCtx.stroke(); // Dibujar la línea
            }
        }
    };


    //funcion que procesa la imagen poniendola en escala de grises, aplicando filtros sobel y pasandola a blanco y negro, para despues seguir las lineas
    procesar_imagen(){

        //  Variables globales
        this.dibujo = new Dibujo();
        
        // Obtener datos de la imagen
        let imageData = this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        
      
        const detector = new CannyEdgeDetector();
        // Obtener datos de la imagen
        const width = this.originalCanvas.width;
        const height = this.originalCanvas.height;
        // const imageData = originalCtx.getImageData(0, 0, width, height);
        
        // Detectar bordes
        const binaryEdges = detector.detectEdges(
            imageData.data, 
            width, 
            height, 
            parseInt(this.lowThreshold), 
            parseInt(this.highThreshold)
        );                     
      
      //  this.mostrar_matriz_debug(binaryEdges);                        

        // busco la primera linea blanca que encuentre y sigo el rastro
        let color_linea = 2;           

        // elimino el dibujo anterior si existia
        this.dibujo.limpiar();

        let linea = this.dibujo.crearLinea(colores[color_linea]);

        for (let y = 0; y < this.originalCanvas.height; y++) {            
            for (let x = 0; x < this.originalCanvas.width; x++) {                    
                if (binaryEdges[y][x+1] === 1) { // econtre el primer punto blanco
                    
                    this.seguir_linea(linea,binaryEdges, this.grosor_value, y, x+1, y, x, color_linea, true, this.unificar_adyacentes);     
                    // si se encontro solo un punto descarto la linea
                    if (linea.vertices.length === 1) {
                        this.dibujo.eliminarLinea(linea.id);
                        linea =this.dibujo.crearLinea( colores[color_linea]);
                    }

                    //sigo la linea hacia el otro lado
                    this.seguir_linea(linea,binaryEdges, this.grosor_value, y, x+1, y, x, color_linea, false, this.unificar_adyacentes);   
                    // si se encontro solo un punto descarto la linea
                    if (linea.vertices.length === 1) {
                        this.dibujo.eliminarLinea(linea.id);
                        linea =this.dibujo.crearLinea(colores[color_linea]);
                    }

                    if (linea.vertices.length >1){
                        linea =this.dibujo.crearLinea(colores[color_linea]);
                        color_linea ++;                               
                    }                                             
                }
                
                if (color_linea == 16){
                    color_linea = 2;
                }                
            }             
        }

        // la ultima linea creada nunca se va a llenar
        this.dibujo.eliminarLinea(linea.id);            
    }

    obtener_lineas(ajuste_inicial_offset_scale = false){
        if (this.imagen === false){
            //eco('sin imagen que procesar');
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
        captura.nombre_archivo_imagen = this.nombre_archivo_imagen;
        captura.dibujar_captura(ajuste_inicial_offset_scale);
    }
    
    actualizarNombreArchivo(img) {
        const input = document.getElementById('imageLoader');
        const nombreSpan = document.getElementById('nombreArchivo');
        
        if (input.files.length > 0) {
            this.nombre_archivo_imagen = input.files[0].name;
            nombreSpan.textContent = input.files[0].name + " (" + img.width + "x" + img.height + ")";
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
             
                this.actualizarNombreArchivo(img);
            
                // Ajustar tamaño del canvas donde proceso la imagen al de la imagen
                this.originalCanvas.width = this.imagen.width;
                this.originalCanvas.height = this.imagen.height;
                
                // Dibujar imagen en el canvas original
                this.originalCtx.drawImage(img, 0, 0);     

                // Procesar imagen y detectar contornos
                this.obtener_lineas(true);    
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);            
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cargar_config_canny(){
    captureCanny.agregar_controles_captura();
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let captureCanny = new canny();   
