class Captura {
    constructor(canvasId) {
        this.lineCanvas = document.getElementById(canvasId);
        this.lineCtx = this.lineCanvas.getContext('2d');

        //this.vertices_elegidos = new Set();
        
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
        this.viewX = 10;
        this.viewY = 10;
        this.scale = 1;
        this.lastX = 0;
        this.lastY = 0;
        
        this.init();
        
        this.vertices_eliminados = 10; // %        
        this.mostrar_imagen = true;
        this.detalle_lineas = false;
        this.modo_seleccion = 0;

        this.imagen = false;
        this.dibujo = false;
    }



    // funcion que muestra la matriz donde se procesan los graficos
    mostrar_matriz_debug(canvas,matriz){

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

    

    dibujar_captura(){
      
        //redimensiono el canvas
        this.lineCanvas.width = canvas.width;
        this.lineCanvas.height = canvas.height;

        // limpio el canvas
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

        // muestro la imagen importada
        if (this.mostrar_imagen){
            this.lineCtx.drawImage(this.imagen, 0, 0);
        }   
        
        this.lineCtx.lineWidth = 1;

        // si no esta activado el mostrado de detalle de  lineas lo dibujo en negro
        if (!this.detalle_lineas){
            this.lineCtx.strokeStyle ="#000000";                
        }       


        // dibujo las lineas generadas
        this.dibujo.lineas.forEach((linea) => {

            if (linea.elegida){ // la linea esta seleccionada
               this.lineCtx.strokeStyle = '#ff0000';
            }else{
                if (this.detalle_lineas){  
                    this.lineCtx.strokeStyle = linea.color;
                }else{
                    this.lineCtx.strokeStyle = '#000000';
                }
            }

            this.lineCtx.beginPath();           
            
            // Dibujar líneas
            this.lineCtx.moveTo(linea.vertices[0].x, linea.vertices[0].y);                       
            for (let i=1;i< linea.vertices.length;i++){     

                let color_ant = this.lineCtx.strokeStyle;// guardo el color anterior

                if (this.modo_seleccion ==0){ // muestra lineas compleatas
                    this.lineCtx.lineTo(linea.vertices[i].x,linea.vertices[i].y);
                    this.lineCtx.stroke();   
                }else{                        // muestra lineas entre vertices elegidos
                    if (linea.vertices[i].elegido){
                        // el vertice esta entre los elegidos, muestro la linea
                        this.lineCtx.lineTo(linea.vertices[i].x,linea.vertices[i].y);
                        this.lineCtx.stroke();   
                    }else{ 
                        // el vertice no esta entre los elegidos, paso al proximo sin dibujar la linea
                        this.lineCtx.moveTo(linea.vertices[i].x, linea.vertices[i].y);               
                    }
                }

                //this.lineCtx.lineTo(linea.vertices[i].x,linea.vertices[i].y);
                //this.lineCtx.stroke();   
                if (this.modo_seleccion ==0){ // muestra vertices sobre las lineas
                    if (linea.vertices[i].elegido){
                        this.lineCtx.strokeStyle ='#00ff00';                                                    
                        this.lineCtx.strokeRect(linea.vertices[i].x,linea.vertices[i].y, 1, 1);
                    }
                }else{                        // muestra vertices
                    this.lineCtx.strokeStyle ='#000000';                                                    
                    this.lineCtx.strokeRect(linea.vertices[i].x,linea.vertices[i].y, 1, 1);
                }

                this.lineCtx.strokeStyle=color_ant; // restauro el color anterior
            }        
        });

        this.lineCtx.restore();

    }  

    agregar_controles_captura(){                
        $("#parametros_importacion").html(`
                <legend>Posicionar e importar</legend>

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
                <div id="estadisticas">Lineas:<br>Vertices:</div>`);            
    }
   
    cambio_vertices_eliminados(event){
        this.vertices_eliminados = event.target.value;
        $('#vertices_value').html(event.target.value);

        // reduzco cantidad de vertices
        if (this.dibujo !== false){
            
            this.dibujo.reducirVertices(this.vertices_eliminados);
            this.dibujar_captura();
        }

    }

    cambio_mostrar_imagen_o_detalle(event){      
        this.mostrar_imagen = $("#mostrar_imagen").prop("checked") ;
        this.detalle_lineas = $("#detalle_lineas").prop("checked") ;
        this.modo_seleccion = $("#modo_seleccion").val();
         // reduzco cantidad de vertices
        if (this.dibujo !== false){          
            this.dibujar_captura();
        }
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

        document.getElementById("vertices_slider").addEventListener('change', this.cambio_vertices_eliminados.bind(this), false);
        document.getElementById("mostrar_imagen").addEventListener('change', this.cambio_mostrar_imagen_o_detalle.bind(this), false);
        document.getElementById("detalle_lineas").addEventListener('change', this.cambio_mostrar_imagen_o_detalle.bind(this), false);
        document.getElementById('modo_seleccion').addEventListener('change', this.cambio_mostrar_imagen_o_detalle.bind(this), false);                        
    
        // seteo el title al canvas
        this.lineCanvas.title=`Zoom con rueda del mouse: Acerca/aleja la vista
Arrastrar con click derecho: Mueve la vista
Dibujar rectángulo con click izquierdo: Selecciona líneas
ControlLeft + Dibujar rectángulo con click izquierdo: Agrega líneas a la seleccion
ControlRight + Dibujar rectángulo con click izquierdo: Quita líneas de la seleccion
Shift + click izquierdo: Zoom al área seleccionada`;
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

        this.lineCanvas.style.cursor = 'default';

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

        //this.vertices_elegidos.clear();
    
        
        this.dibujo.seleccionarElementos(box,!this.ControlLeftPressed,this.ControlRightPressed);

        this.lineCanvas.style.cursor = 'default';

   //     this.vertices_elegidos = this.dibujo.elementosEnBox(box);


    }
/*
    vertices_en_recuadro(linea,box){

        // eco('aca busco que vertices estan dentro del cuadro');
        linea.vertices.forEach( vertice => {                  
            if (vertice.x >= box.x && vertice.x <= box.x + box.width &&
                vertice.y >= box.y && vertice.y <= box.y + box.height){
                    this.vertices_elegidos.add(vertice.id);
            }
        });

    };
    */
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

    updateUI() {
        document.getElementById('zoomLevel').textContent = Math.round(this.scale * 100) + '%';
    }

    removevertices_elegidos() {
        this.lines = this.lines.filter(line => !this.vertices_elegidos.has(line.id));
        this.vertices_elegidos.clear();
        this.dibujar_captura();
    }

    getvertices_elegidos() {
        return this.lines.filter(line => this.vertices_elegidos.has(line.id));
    }

    clearSelection() {
        this.vertices_elegidos.clear();
        this.dibujar_captura();
    }

    resetView() {
        this.viewX = 0;
        this.viewY = 0;
        this.scale = 1;
        this.dibujar_captura();
    }
*/
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// tengo que dejar disponible el objeto de captura para poder pasarle el dibujo y la imagen original
let captura = false;

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function(){
   captura = new Captura('lineCanvas');
});
