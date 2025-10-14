

/////////////////////////////////////////////////////////////////////////////////////////////

class sobel {
    constructor() {
        this.originalCanvas = document.createElement('canvas');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.canvas_debug = false;

        this.nombre_archivo_imagen = '';
        this.imagen = false;
        this.umbral_value = 50;

        this.grosor_value = 2;        
        this.unificar_adyacentes = false;

        this.init();
    }

    init() {
        $("#select_capturar").append('<option value="cargar_config_sobel">Sobel</option>');             
        //this.agregar_controles_captura();

    }

    agregar_controles_captura(){        

        $("#parametros_captura").html(`
            <legend>Sobel</legend>

            <input type="file" id="imageLoader"  style="display: none;" accept="image/*"  />
            <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>

            <span id="nombreArchivo" class="nombre-archivo"></span>
            <div class="slider-container">
                <label for="umbral_slider">Umbral de detección: <span id="umbral_value">50</span></label><br>
                <input type="range" id="umbral_slider" min="10" max="500" value="50">
            </div>            
            <hr>                         
            <div class="slider-container">
                <label for="grosor_slider">Grosor lineas: <span id="grosor_value">2</span></label><br>
                <input type="range" id="grosor_slider" min="1" max="6"  step="1" value="2">
            </div>

            Unificar adyacentes:<input type="checkbox" id="unificar_lineas_adyacentes" checked="checked" title="Unifica lineas adyacentes"/><br>      
            `);

        // listeners de botones y sliders
        document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
        document.getElementById('umbral_slider').addEventListener('input', this.update_umbral.bind(this), false);
        document.getElementById('grosor_slider').addEventListener('input', this.update_grosor.bind(this), false);      
        document.getElementById('unificar_lineas_adyacentes').addEventListener('change', this.update_adyacentes.bind(this), false);                    
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

        //  mostrar_matriz_debug(grayMatrix);        
        
        // Aplicar detección de bordes simple (operador Sobel simplificado)
        for (let y = 1; y < this.originalCanvas.height - 1; y++) {
            edgeMatrix[y] = [];
            for (let x = 1; x < this.originalCanvas.width - 1; x++) {
                // Aplicar kernel horizontal
                let gx =   -grayMatrix[y-1][x-1] +  grayMatrix[y-1][x+1] + -2 * grayMatrix[y][x-1] + 
                        2 * grayMatrix[y][x+1]   + -grayMatrix[y+1][x-1] +      grayMatrix[y+1][x+1];
                
                // Aplicar kernel vertical
                let gy = -grayMatrix[y-1][x-1] - 2 * grayMatrix[y-1][x] - grayMatrix[y-1][x+1] +
                          grayMatrix[y+1][x-1] + 2 * grayMatrix[y+1][x] + grayMatrix[y+1][x+1];
                
                // Calcular magnitud del gradiente
                edgeMatrix[y][x] = Math.sqrt(gx * gx + gy * gy);
            }
        }
        
        //   mostrar_matriz_debug(edgeMatrix);

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


        //this.mostrar_matriz_debug(binaryEdges);

        const lineExtractor = new deteccionBordes();


        // Obtener datos de la imagen
        const width = this.originalCanvas.width;
        const height = this.originalCanvas.height;

        this.dibujo = lineExtractor.detectarBordes(binaryEdges, width, height, this.grosor_value, this.unificar_adyacentes);
             
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

function cargar_config_sobel(){
    captureLines.agregar_controles_captura();
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let captureLines = new sobel();   
