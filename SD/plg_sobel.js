

/////////////////////////////////////////////////////////////////////////////////////////////

class sobel {
    constructor() {
        this.originalCanvas = document.createElement('canvas');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.canvas_debug = false;

        this.nombre_archivo_imagen = '';
        this.imagen = false;
        this.umbral_value = 50;

        this.binaryEdges = false;

        this.clase_captura_bordes = false;    
        this.clase_captura_lineas = false;     
        this.clase_captura_elegida = false;
  
        this.init();
    }

    init(){
         $("#select_capturar").append('<option value="cargar_config_sobel">Metodo Sobel</option>');
        this.agregar_controles_captura();
    }

    agregar_controles_captura(imagen_precargada = false){
          
        $("#parametros_captura").html(`
            <legend>Sobel</legend>

            <input type="file" id="imageLoader"  style="display: none;" accept="image/*"  />
            <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>

            <span id="nombreArchivo" class="nombre-archivo"></span>
            <div class="slider-container">
                <label for="umbral_slider">Umbral de detección: <span id="umbral_value">50</span></label><br>
                <input type="range" id="umbral_slider" min="5" max="500" value="50">
            </div>            
                      
            <select id = "select_metodo_captura" class="select-fijo2">     
                <option value="bordes">Bordes gruesos</option>
                <option value="lineas">Lineas finas</option>
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
        document.getElementById('umbral_slider').addEventListener('input', this.update_umbral.bind(this), false);
    //    document.getElementById('grosor_slider').addEventListener('input', this.update_grosor.bind(this), false);      
     //   document.getElementById('unificar_lineas_adyacentes').addEventListener('change', this.update_adyacentes.bind(this), false);


        // captura
        this.clase_captura_lineas = new ImprovedLineExtractor("#parametros_metodo_captura_lineas",this.actualizar_dibujo);
        this.clase_captura_bordes = new deteccionBordes("#parametros_metodo_captura_bordes",this.actualizar_dibujo);

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


    update_umbral(event){   
        this.umbral_value = event.target.value;
        $('#umbral_value').html(event.target.value);
        this.obtener_lineas();
    }

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

        mostrar_matriz_debug(binaryEdges);

        return binaryEdges;
    }


    // esta funcion la llama la clase que captura el dibujo
    actualizar_dibujo(dibujo, ajuste_inicial_offset_scale = false){
        // hago unificacion de lineas
        dibujo.unificarLineas(6);

        captura.dibujo = dibujo;
        hideLoading();
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

        showLoading('Cargando imagen');

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
    async cargar_imagen(e){

        const archivo = e.target.files[0];
        const extension = archivo.name.split('.').pop() ;
        if (extension == 'svg'){
            // es un SVG, lo convierto a imagen
            await SVGToImage(archivo).then( (imagen)=> { 
                    this.cambioArchivoImagen(imagen)
                }
            );
        }else{
            let reader = new FileReader();
            reader.onload = (event) => {
                let img = new Image();
                img.onload = () => {
                    this.cambioArchivoImagen(img);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cargar_config_sobel(imagen_precargada){
    captureLines.agregar_controles_captura(imagen_precargada);
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let captureLines = new sobel();   
