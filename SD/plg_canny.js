
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

        this.dibujo = false;

        this.nombre_archivo_imagen = '';
        this.imagen = false;
        this.lowThreshold = 20;
        this.highThreshold = 50;     

        this.binaryEdges = false;

        this.clase_captura_bordes = false;    
        this.clase_captura_lineas = false;     
        this.clase_captura_elegida = false;

        this.init();
     
    }

    init(){
        $("#select_capturar").append('<option value="cargar_config_canny">Canny</option>');         
        this.agregar_controles_captura();
    }
  

    agregar_controles_captura(imagen_precargada = false){            

        $("#parametros_captura").html(`
            <legend>Canny</legend>

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
        
            <select id = "select_metodo_captura" class="select-fijo">     
                <option value="lineas">Lineas finas</option>
                <option value="bordes">Bordes gruesos</option>
            </select>

            <div id="parametros_metodo_captura_lineas">
                parametros_metodo_captura_lineas
            </div>
            <div id="parametros_metodo_captura_bordes">
                parametros_metodo_captura_bordes
            </div>

            
            `);

        // listeners de botones y sliders
        document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
        document.getElementById('lowThreshold').addEventListener('input', this.update_lowThreshold.bind(this), false);
        document.getElementById('highThreshold').addEventListener('input', this.update_highThreshold.bind(this), false);


        // captura   
        this.clase_captura_bordes = new deteccionBordes("#parametros_metodo_captura_bordes",this.actualizar_dibujo);    
        this.clase_captura_lineas = new ImprovedLineExtractor("#parametros_metodo_captura_lineas",this.actualizar_dibujo);     

        // listener para elegir con que plugin se va a capturar la imagen
        document.getElementById("select_metodo_captura").addEventListener('change', this.cambio_metodo_captura.bind(this));
       
        // cargo los parametros del elemento elegido
        this.cambio_metodo_captura();

       
        if (imagen_precargada){
            this.cambioArchivoImagen(imagen_precargada);
        }

    }
    
    
    cambio_metodo_captura(event){
        const select = document.getElementById("select_metodo_captura")
        // busco el nombre del plugin seleccionado
        var seleccionado = $(select).val();   
    
        // muestro o oculto las configuraciones segun que halla elegido
        if (seleccionado == 'lineas'){
            this.clase_captura_elegida = this.clase_captura_lineas;   
            $("#parametros_metodo_captura_lineas").show();
            $("#parametros_metodo_captura_bordes").hide();
        }else{  // bordes
            this.clase_captura_elegida = this.clase_captura_bordes;      
            $("#parametros_metodo_captura_lineas").hide();
            $("#parametros_metodo_captura_bordes").show();     
        }

        // esta funcion cuando termine llamara a la funcion actualizar_dibujo() con el resultado de la captura
        if (this.binaryEdges){
            this.clase_captura_elegida.generar_dibujo(this.binaryEdges.map(innerArray => [...innerArray]));
        }
        
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
/*
      // Visualizar líneas en el canvas
    visualizeLines(lines, width, height) {

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


        // Limpiar canvas
        debugCtx.fillStyle = 'black';
        debugCtx.fillRect(0, 0, width, height);
        

        // Dibujar cada línea
        lines.forEach((line, index) => {
            if (line.length < 2) return;
            
            // Color diferente para cada línea
            const hue = (index * 137.5) % 360; // Ángulo dorado
           // debugCtx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
            debugCtx.strokeStyle = colores[Math.floor(Math.random() * colores.length - 2) + 2];
            debugCtx.lineWidth = 1;
            debugCtx.beginPath();
                        
            // Mover al primer punto
            debugCtx.moveTo(line[0][0], line[0][1]);
            
            // Dibujar línea a través de todos los puntos
            for (let i = 1; i < line.length; i++) {
                debugCtx.lineTo(line[i][0], line[i][1]);
            }
            
            debugCtx.stroke();
           
            return;
            // Dibujar vértices
            debugCtx.fillStyle = 'white';
            line.forEach(point => {
                debugCtx.beginPath();
                debugCtx.arc(point[0], point[1], 1, 0, Math.PI * 2);
                debugCtx.fill();
            });
        });
    }
*/

    //funcion que procesa la imagen poniendola en escala de grises, aplicando filtros sobel y pasandola a blanco y negro, para despues seguir las lineas
    procesar_imagen(){
         
        // Obtener datos de la imagen
        let imageData = this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
              
        const detector = new CannyEdgeDetector();

        // Obtener datos de la imagen
        const width = this.originalCanvas.width;
        const height = this.originalCanvas.height;
                
        // Detectar bordes
        return detector.detectEdges(
            imageData.data, 
            width, 
            height, 
            parseInt(this.lowThreshold), 
            parseInt(this.highThreshold)
        );                     
            
    }

    // a esta funcion la llama la clase que captura el dibujo
    actualizar_dibujo(dibujo, ajuste_inicial_offset_scale = false){
        captura.dibujo = dibujo;
        captura.dibujar_captura(ajuste_inicial_offset_scale,true);
    }

    obtener_lineas(ajuste_inicial_offset_scale = false){
        if (this.imagen === false){
            //eco('sin imagen que procesar');
            return;
        }

        // capturo las lineas de la imagen con los parametros seleccionados
        const binaryEdges = this.procesar_imagen();

        // guardo el arreglo capturado de la imagen por si cambia de metodo de captura
        this.binaryEdges = binaryEdges;

        captura.imagen = this.imagen;
        captura.nombre_archivo_imagen = this.nombre_archivo_imagen;

        // esta funcion cuando termine llamara a la funcion actualizar_dibujo() con el resultado de la captura
        this.clase_captura_elegida.generar_dibujo(binaryEdges, ajuste_inicial_offset_scale);      

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

    cambioArchivoImagen(imagen){

        this.imagen = imagen;

        this.actualizarNombreArchivo(imagen);
    
        // Ajustar tamaño del canvas donde proceso la imagen al de la imagen
        this.originalCanvas.width = this.imagen.width;
        this.originalCanvas.height = this.imagen.height;
        
        // Dibujar imagen en el canvas original
        this.originalCtx.drawImage(imagen, 0, 0);     

        // Procesar imagen y detectar contornos
        this.obtener_lineas(true);    

    }

    // carga la imagen desde un archivo y la manda a procesar
    cargar_imagen(e){

        let reader = new FileReader();
        // reader.onload = function(event) {
        reader.onload = (event) => {
            let img = new Image();
            //img.onload = function() {
            img.onload = () => {
                this.cambioArchivoImagen(img);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);            
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cargar_config_canny(imagen_precargada){
    captureCanny.agregar_controles_captura(imagen_precargada);
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let captureCanny = new canny();   
