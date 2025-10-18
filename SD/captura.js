class Captura {
    constructor(canvasId) {
        this.lineCanvas = document.getElementById(canvasId);
        this.lineCtx = this.lineCanvas.getContext('2d');
        
        // Estados de interacción
        this.isDrawing = false;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.ControlLeftPressed = false;
        this.ControlRightPressed = false;
        
        // Transformaciones de vista
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;

        this.offsetX_pagina = 0;
        this.offsetY_pagina = 0;
        this.width_pagina = 0;
        this.height_pagina = 0;
        this.scale_pagina = 0;

        // manejo seleccion
        this.lastX = 0;
        this.lastY = 0;

        //parametros de captura        
        this.vertices_eliminados = 10; // %       
        this.angulo_rotacion = 0 ; // °   
        this.angulo_rotacion_nuevo = 0 ; // °

        // parametros de visualizacion
        this.mostrar_imagen = true;
        this.detalle_lineas = false;
        this.mostrar_vertices = false;

        // objetos de imagen capturada
        this.nombre_archivo_imagen = '';
        this.imagen = false;
        this.dibujo = false;

        this.init();
    }

    init() {
        this.agregar_controles_captura();

        // Event listeners del mouse
        this.lineCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.lineCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.lineCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.lineCanvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.lineCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // listeners del teclado
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        document.getElementById("vertices_slider").addEventListener('input', this.cambio_vertices_eliminados.bind(this), false);
        document.getElementById("angulo_rotacion").addEventListener('input', this.cambio_angulo_rotacion.bind(this), false);       
        document.getElementById("mostrar_imagen").addEventListener('change', this.cambio_mostrar_imagen_o_detalle.bind(this), false);
        document.getElementById("detalle_lineas").addEventListener('change', this.cambio_mostrar_imagen_o_detalle.bind(this), false);
        document.getElementById("mostrar_vertices").addEventListener('change', this.cambio_mostrar_imagen_o_detalle.bind(this), false);        
     
        
        // seteo el title al canvas
        this.lineCanvas.title=`Zoom con rueda del mouse: Acerca/aleja la vista
Arrastrar con click derecho: Mueve la vista
Dibujar rectángulo con click izquierdo: Selecciona líneas
ControlLeft + Dibujar rectángulo con click izquierdo: Agrega líneas a la seleccion
ControlLeft + rueda del mouse: Acerca/aleja la vista lentamente
ControlRight + Dibujar rectángulo con click izquierdo: Quita líneas de la seleccion
Shift + click izquierdo: Zoom al área seleccionada`;
    }

    agregar_controles_captura(){                
        $("#parametros_importacion").html(`
                <legend>Posicionar e importar</legend>
                <div class="slider-container">
                    <label for="vertices_slider">Vertices eliminados: <span id="vertices_value">10%</span></label><br>
                    <input type="range" id="vertices_slider" min="0" max="95"  step="5" value="10">
                </div>
                Rotar:<input type="number" id="angulo_rotacion" min="0" max="359"  step="1" value="0">°
                <hr>
                Mostrar imagen:<input type="checkbox" id="mostrar_imagen" checked /><br>
                Colores lineas:<input type="checkbox" id="detalle_lineas" checked_ />   <br>
                Mostrar Vertices:<input type="checkbox" id="mostrar_vertices" checked_ />
                <hr>
                <div id="estadisticas">Lineas:<br>Vertices:</div>`);            
    }
       
    dibujar_maquina(){
        //redimensiono el canvas
        this.lineCanvas.width = control.canvas.width;
        this.lineCanvas.height = control.canvas.height;

        // limpio el canvas
        this.lineCtx.clearRect(0, 0,this.lineCanvas.width,this.lineCanvas.height);
        this.lineCtx.save();

        // muestro la maquina y la pagina centradas, lo hago antes del escalado para que quede en posicion fija
        this.lineCtx.fillStyle = "#FFE6C9";
        this.lineCtx.fillRect(0,0, this.lineCanvas.width,this.lineCanvas.height);

        // Calcular el 99% del espacio disponible
        const maxWidth = control.canvas.width * 0.95;
        const maxHeight = control.canvas.height * 0.95;

        // Calcular la escala para mantener la proporción
        const scaleX = maxWidth / control.page.page_width ;
        const scaleY = maxHeight/ control.page.page_height;
        const scale = Math.min(scaleX, scaleY);
        

        // Calcular las dimensiones escaladas
        const scaledWidth = control.page.page_width * scale;
        const scaledHeight =  control.page.page_height * scale;
        
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
     
        // dibujar lineas de home


        this.offsetX_pagina = x;
        this.offsetY_pagina = y;
        this.width_pagina = scaledWidth;
        this.height_pagina = scaledHeight;
        this.scale_pagina = scale;
    }
    

    /*
    ajustarImagenEnPantalla() {
        
        // Obtener dimensiones del canvas
        const canvasWidth = this.lineCanvas.width;
        const canvasHeight = this.lineCanvas.height;
        
        // Calcular la escala para que la imagen quepa en el canvas
        const scaleX = canvasWidth / this.imagen.width;
        const scaleY = canvasHeight / this.imagen.height;
        const scale = Math.min(scaleX, scaleY) * 0.70; // 70% para que no ocupe toda la pantalla
        
        // Calcular el offset para centrar la imagen
        const offsetX = (canvasWidth - this.imagen.width * scale) / 2;
        const offsetY = (canvasHeight - this.imagen.height * scale) / 2;        
        
        //ajusto el offset y escala 
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.scale = scale;      
    }
    */

    ajustarDibujoEnPantalla() {
        // calculo bordes, ancho y alto del dibujo capturado
        this.dibujo.calcularBordes();
        //eco(this.dibujo.width + ' ' + this.dibujo.height);

        // Obtener dimensiones del canvas
        const canvasWidth = this.lineCanvas.width;
        const canvasHeight = this.lineCanvas.height;
        
        // Calcular la escala para que el dibujo quepa en el canvas
        const scaleX = canvasWidth / this.dibujo.width;
        const scaleY = canvasHeight / this.dibujo.height;
        const scale = Math.min(scaleX, scaleY) * 0.70; // 70% para que no ocupe toda la pantalla
        
        // Calcular el offset para centrar el dibujo
        const offsetX = (canvasWidth - this.dibujo.width * scale) / 2;
        const offsetY = (canvasHeight - this.dibujo.height * scale) / 2;        
        
        //ajusto el offset y escala 
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.scale = scale;      
    }

    dibujar_captura(ajuste_inicial_offset_scale = false, forzar_rotado_dibujo = false){
    
        this.dibujar_maquina();

        if (!this.dibujo){
            return;
        }

        if (ajuste_inicial_offset_scale){
            // aplico el eliminado inicial de vertices
            this.dibujo.reducirVertices(this.vertices_eliminados);    
        }

        // muestro las estadisticas de la imagen
        $("#estadisticas").html("Lineas:" + captura.dibujo.cantidadLineas() + "<br/>Vertices:" + captura.dibujo.cantidadVertices());
      
        if (forzar_rotado_dibujo){
            this.angulo_rotacion_nuevo = this.angulo_rotacion ;
        }

        //solo ajusta el offset y scale la primera vez que se dibuja, llamado por el plugin de captura
        if (ajuste_inicial_offset_scale){
            this.ajustarDibujoEnPantalla();

            // reseteo valores de rotacion
            $('#angulo_rotacion').val(0);
            this.angulo_rotacion = 0;
            this.angulo_rotacion_nuevo = 0;
        }
  
        // Aplicar transformaciones de vista
        this.lineCtx.translate(this.offsetX, this.offsetY);      
        this.lineCtx.scale(this.scale, this.scale);


        // calculo el centro de la imagen
        let centro_rotacionX = this.dibujo.centroX;
        let centro_rotacionY = this.dibujo.centroY;
        if (this.imagen){
            // calculo el centro de la imagen
            centro_rotacionX = this.imagen.width / 2;
            centro_rotacionY = this.imagen.height / 2;
        }

        // muestro la imagen importada
        if (this.mostrar_imagen && this.imagen){
            // Guardar el estado del contexto
            this.lineCtx.save();
            
            // Mover el punto de origen al centro de la imagen
            this.lineCtx.translate(this.imagen.width / 2, this.imagen.height / 2);
            
            const anguloRadianes = this.angulo_rotacion * Math.PI / 180;
            // Aplicar la rotación
            this.lineCtx.rotate(anguloRadianes);
            
            // Dibujar la imagen centrada en el nuevo origen
            this.lineCtx.drawImage(this.imagen, -this.imagen.width / 2, -this.imagen.height / 2);
            
            // Restaurar el estado del contexto
            this.lineCtx.restore();         
        }   
              
        // roto el dibujo
        if (this.angulo_rotacion_nuevo != 0){
            this.dibujo.rotarVertices(this.angulo_rotacion_nuevo, centro_rotacionX, centro_rotacionY);   
            this.angulo_rotacion_nuevo = 0;
        }


        this.lineCtx.lineWidth = 1;

        // si no esta activado el mostrado de detalle de  lineas lo dibujo en negro
        if (!this.detalle_lineas){
            this.lineCtx.strokeStyle ="#000000";                
        }       

        // dibujo las lineas generadas
        this.dibujo.lineas.forEach((linea) => {
        
            if (this.detalle_lineas){  
                this.lineCtx.strokeStyle = linea.color;
            }else{
                this.lineCtx.strokeStyle = '#000000';
            }
                      
            this.lineCtx.beginPath();        
            this.lineCtx.moveTo(linea.vertices[0].x, linea.vertices[0].y);          
           
            for (let i=1;i< linea.vertices.length;i++){                           
                this.lineCtx.lineTo(linea.vertices[i].x,linea.vertices[i].y);
                this.lineCtx.stroke();                                                  
            }        
        });

        //dibujo vertices 
        this.dibujo.lineas.forEach((linea) => {                                           
            for (let i = 0; i < linea.vertices.length; i++){   
                if (linea.vertices[i].elegido){
                    this.lineCtx.strokeStyle ='#ff0000';                         
                    this.lineCtx.strokeRect(linea.vertices[i].x,linea.vertices[i].y, 0.1, 0.1); 
                }else if (this.mostrar_vertices){
                    this.lineCtx.strokeStyle ='#00ff00';     
                    this.lineCtx.strokeRect(linea.vertices[i].x,linea.vertices[i].y, 0.1, 0.1); 
                }                                 
            }        
        });            

        this.lineCtx.restore();
    }  

    cambio_vertices_eliminados(event){
        this.vertices_eliminados = event.target.value;
        $('#vertices_value').html(event.target.value);

        //si se importo alguna imagen muestro estadisticas
        if (this.dibujo){
            // reduzco cantidad de vertices    
            this.dibujo.reducirVertices(this.vertices_eliminados);

            // mando a girar el dibujo nuevamente por que los vertices fueron guardados sin girar
            this.angulo_rotacion_nuevo = this.angulo_rotacion;
            this.dibujar_captura();
        }
    }
        

    cambio_angulo_rotacion(event){

        // guardo el angulo anterior
        let angulo_anterior = this.angulo_rotacion;

        // guardo el nuevo angulo
        this.angulo_rotacion = event.target.value;

        // calculo cuanto lo tengo que rotar
        this.angulo_rotacion_nuevo = this.angulo_rotacion - angulo_anterior;
               
        this.dibujar_captura();
    }

    cambio_mostrar_imagen_o_detalle(event){      
        this.mostrar_imagen = $("#mostrar_imagen").prop("checked") ;
        this.detalle_lineas = $("#detalle_lineas").prop("checked") ;
        this.mostrar_vertices = $("#mostrar_vertices").prop("checked") ;        
        
        this.dibujar_captura();

    }
        
    // Función para manejar el evento keydown
    handleKeyDown(event) {        
        if (event.code === 'ControlLeft') {
            this.ControlLeftPressed = true;
            //document.body.style.cursor = 'copy';
        } else if (event.code === 'ControlRight') {
            this.ControlRightPressed = true;
        }
    }

    // Función para manejar el evento keyup
    handleKeyUp(event) {
        if (event.code === 'ControlLeft') {
            this.ControlLeftPressed = false;
        } else if (event.code === 'ControlRight') {
            this.ControlRightPressed = false;
        }
        document.body.style.cursor = 'default';
    }
     
    handleMouseDown(e) {
        const rect = this.lineCanvas.getBoundingClientRect();
        this.startX = (e.clientX - rect.left - this.offsetX) / this.scale;
        this.startY = (e.clientY - rect.top - this.offsetY) / this.scale;
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
            this.currentX = (mouseX - this.offsetX) / this.scale;
            this.currentY = (mouseY - this.offsetY) / this.scale;
            this.dibujar_captura();
            this.drawSelectionBox();
        } else if (this.isPanning) {
            const dx = mouseX - this.lastX;
            const dy = mouseY - this.lastY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.lastX = mouseX;
            this.lastY = mouseY;
            
            this.dibujar_captura();
        //   this.updateUI();
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
        
        let zoomIntensity = 0.1;
        if (this.ControlLeftPressed){
            zoomIntensity = zoomIntensity/10;
        }
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        // Calcular la posición del mouse en coordenadas del mundo
        const worldX = (mouseX - this.offsetX) / this.scale;
        const worldY = (mouseY - this.offsetY) / this.scale;
        
        // Aplicar zoom
        this.scale *= zoom;
        
        // Limitar el zoom
        this.scale = Math.max(0.1, Math.min(10, this.scale));
        
        // Ajustar la vista para mantener el punto del mouse en la misma posición
        this.offsetX = mouseX - worldX * this.scale;
        this.offsetY = mouseY - worldY * this.scale;
        
        this.dibujar_captura();
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
        this.offsetX = (this.lineCanvas.width - (box.x + box.width/2) * this.scale) / 2;
        this.offsetY = (this.lineCanvas.height - (box.y + box.height/2) * this.scale) / 2;
        
        this.dibujar_captura();

        this.lineCanvas.style.cursor = 'default';

    }

    drawSelectionBox() {
        this.lineCtx.save();
        this.lineCtx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.lineCtx.beginPath();
        this.lineCtx.rect(
            this.startX * this.scale + this.offsetX, 
            this.startY * this.scale + this.offsetY, 
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

    /*
    drawSelectionBox_TEST( box,color = 3) {
        
        this.lineCtx.save();
        this.lineCtx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.lineCtx.beginPath();
        this.lineCtx.rect(
            box.x * this.scale + this.offsetX, 
            box.y * this.scale + this.offsetY, 
            box.width * this.scale, 
            box.height * this.scale
        );
        
        this.lineCtx.strokeStyle = colores[color];
        this.lineCtx.lineWidth = 3;
        this.lineCtx.setLineDash([5, 5]);
        this.lineCtx.stroke();
        this.lineCtx.setLineDash([]);

        this.lineCtx.restore();
    }*/




    selectLinesInBox() {
      
        // fuerzo el color de las lineas en negro
        if (this.detalle_lineas){
            document.getElementById('detalle_lineas').click();
        }

        const box = {
            x: Math.min(this.startX, this.currentX),
            y: Math.min(this.startY, this.currentY),
            width: Math.abs(this.currentX - this.startX),
            height: Math.abs(this.currentY - this.startY)
        };
       
        this.dibujo.seleccionarElementos(box,!this.ControlLeftPressed,this.ControlRightPressed);

        this.lineCanvas.style.cursor = 'default';
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// tengo que dejar disponible el objeto de captura para poder pasarle el dibujo y la imagen original
let captura = new Captura('lineCanvas');