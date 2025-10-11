class Control {
    constructor() {        
        this.canvas = document.getElementById("machine");
        this.ctx = this.canvas.getContext("2d");

        this.machine_specs = {};
        this.pen = {};
        this.page = {};
        this.home = {};
        this.config = {};

        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.pen_down = true; // down

        // creo la cola de tareas
        this.tareas = new ColaTareas();
        this.tareas_completadas = [];
     
        this.init();
    }


    cambio_plugin_captura(event){
        const select = document.getElementById("select_capturar")
        // busco el nombre del plugin seleccionado
        var seleccionado = $(select).val();   
        
        // llamo a la funcion que carga las configuraciones de captura
        window[seleccionado]();
    }

    cargar_archivo_gcode(event){
        let selectedFile = event.target.files[0];
     
        if (selectedFile) {        
            const reader = new FileReader();    
            reader.onload = (e) => {
            
                // Crear objeto con información del archivo
                const fileData = {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    lastModified: selectedFile.lastModified,
                    content: e.target.result, // Contenido en base64 o texto
                    arrayBuffer: null
                };

                if (selectedFile.type.startsWith("text/")) {
                    const arrayBufferReader = new FileReader();
                    arrayBufferReader.onload = (arrayBufferEvent) => {
                 
                        fileData.arrayBuffer = arrayBufferEvent.target.result;

                        let cola = fileData.content.split("\n");

                        this.tareas.limpiar();
                        this.tareas_completadas = [];

                        this.tareas.pausar();
                        $("#estado_cola").text(
                            this.tareas.obtenerEstado().estado + " (IMPORTANDO)"
                        );

                        setTimeout(() => {
                            for (const tarea of cola) {
                                if (tarea.startsWith("C") && tarea.includes(",END")) {
                                    this.encolar_tarea(tarea, this.update_pen_position.bind(this));
                                } else {
                                    console.log(" LA TAREA " + tarea + " NO PARECE SER GCODE!!");
                                }
                            }
                            $("#estado_cola").text(
                                this.tareas.obtenerEstado().estado
                            );
                            this.draw_machine();
                        }, 100);

                        //  console.log( cola);
                    };
                    arrayBufferReader.readAsArrayBuffer(selectedFile);
                }
            };

            // Leer el archivo según su tipo
            if (selectedFile.type.startsWith("text/")) {
                reader.readAsText(selectedFile);
            }
        }
    }


    dobleClick_canvas(event){
        // Calculate the mouse coordinates relative to the canvas
        const rect = this.canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        // corrijo las coordenadas teniendo en cuenta el zoom y el offset
        let w = this.screenToWorld(x, y);

        if (this.config.mover_gondola) {
            // calculo los datos de la nueva posicion
            let pen_x = Math.round(w.x);
            let pen_y = Math.round(w.y);

            let motorA = this.calc_motorA(pen_x, pen_y);
            let motorB = this.calc_motorB(pen_x, pen_y);

            // envio la terea, cuando termine actualiza los datos de posicion
            this.encolar_tarea('C01,'+motorA+','+motorB+',END',this.update_pen_position.bind(this));
        }else{
            // guardo la nueva posicion
            this.pen.x = Math.round(w.x);
            this.pen.y = Math.round(w.y);

            $("#pen_x").val(this.pen.x);
            $("#pen_y").val(this.pen.y);

            this.pen.motorA = this.calc_motorA(this.pen.x, this.pen.y);
            this.pen.motorB = this.calc_motorB(this.pen.x, this.pen.y);

            $("#pen_motorA").html(this.pen.motorA);
            $("#pen_motorB").html(this.pen.motorB);

            this.guardar_parametros();
        }
    }

    // Eventos para el zoom
    wheel_canvas(event){
        event.preventDefault();
    
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const zoomIntensity = 0.1;
        const wheel = event.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        // Calcular nuevo scale y offset
        this.offsetX -= (mouseX - this.offsetX) * (zoom - 1);
        this.offsetY -= (mouseY - this.offsetY) * (zoom - 1);
        this.scale *= zoom;        

        this.draw_machine();
    }

    // Pan (arrastrar)
    mousedown_canvas(event){
        this.isDragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
    }

    mousemove_canvas(event){
        if (this.isDragging) {
            this.offsetX += (event.clientX - this.lastX) / this.scale;
            this.offsetY += (event.clientY - this.lastY) / this.scale;
            this.lastX = event.clientX;
            this.lastY = event.clientY;                  
            this.draw_machine();       
        }
    }

    mouseup_canvas(event){
        this.isDragging = false;
    }

    mouseleave_canvas(event){
        this.isDragging = false;
    }

    comando_gcode_keydown(event){
        if (event.key === "Enter") {
        // Prevent the default form submission behavior if the input is within a form
        event.preventDefault(); 

        let comando = $("#comando_gcode").val().toUpperCase();
        //valido el gcode
            if (this.gcode_valido(comando)){
                $("#comando_gcode").val('');
                this.encolar_tarea(comando, this.update_pen_position.bind(this));
            }else{
                alert("gcode " + comando + " no valido!");
            }
        }
    }

    limpiar_cola(event) {
        this.tareas.limpiar();
        this.draw_machine();
        $("#tareas").val(this.tareas.mostrar());
    }

    descargar_gcode(event){
        alert('descargar_gcode no implementado');
    }

    init(){        
        // Add a click event listener to the canvas
        this.canvas.addEventListener("dblclick",  this.dobleClick_canvas.bind(this));
        this.canvas.addEventListener("wheel",  this.wheel_canvas.bind(this));
        this.canvas.addEventListener("mousedown",  this.mousedown_canvas.bind(this));
        this.canvas.addEventListener("mousemove",  this.mousemove_canvas.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseup_canvas.bind(this) );
        this.canvas.addEventListener("mouseleave", this.mouseleave_canvas.bind(this) );      
         
        // agrego los listeners de interface
        //dibujar
        document.getElementById("mostrar_mapa_tension").addEventListener('change', this.guardar_parametros.bind(this), false);
        document.getElementById("recargar_config_default").addEventListener('click', this.config_default.bind(this), false);
        document.getElementById("reset_zoom").addEventListener('click', this.resetZoom.bind(this), false);

        document.getElementById("pen_x").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("pen_y").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("upPosition").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("downPosition").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("cambiar_status_pen").addEventListener('click', this.cambiar_status_pen.bind(this), false);
        document.getElementById("penWidth").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("return_to_home").addEventListener('click', this.return_to_home.bind(this).bind(this), false);
        document.getElementById("posicion_actual").addEventListener('click', () => {this.encolar_tarea('getPosition', this.update_pen_position.bind(this));}, false);
        document.getElementById("mover_gondola").addEventListener('change', this.guardar_parametros.bind(this), false);        
        document.getElementById("calibrado_inicial").addEventListener('click', () => {this.encolar_tarea('initialCalibrate');}, false);
        document.getElementById("recalibrar").addEventListener('click', () => {this.encolar_tarea('calibrate');}, false);

        // captura
        // listener para elegir con que plugin se va a capturar la imagen
        document.getElementById("select_capturar").addEventListener('change', this.cambio_plugin_captura);
        //genera tareas gcode
        document.getElementById("capturar_tareas").addEventListener('click',  this.capturar_tareas.bind(this), false);        

        // listeners de configuraciones de la maquina
        document.getElementById("machineSizeMm_x").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("machineSizeMm_y").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("stepMultiplier").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("mmPerRev").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("stepsPerRev").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("currentMaxSpeed").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("currentAcceleration").addEventListener('click', this.guardar_parametros.bind(this), false);        
        document.getElementById("getMachineSpecs").addEventListener('click', () => {this.encolar_tarea('getMachineSpecs', this.update_pen_position.bind(this));}, false);        
        document.getElementById("send_machine_specs").addEventListener('click', this.send_machine_specs.bind(this), false);       
        document.getElementById("releaseMotors").addEventListener('click', () => {this.encolar_tarea('releaseMotors', this.update_pen_position.bind(this));}, false);      
        document.getElementById("restart").addEventListener('click', () => {this.encolar_tarea('restart')}, false);           
        
        document.getElementById("page_width").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("page_height").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("page_pos_x").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("centrar_pagina").addEventListener('click', this.centrar_pagina_x.bind(this), false);
        document.getElementById("page_pos_y").addEventListener('click', this.guardar_parametros.bind(this), false);
        document.getElementById("home_pos_x").addEventListener('change', this.guardar_parametros.bind(this), false);       

        document.getElementById("set_home").addEventListener('click', this.set_home.bind(this), false);      
        document.getElementById("home_pos_y").addEventListener('change',this.guardar_parametros.bind(this), false); 
                
        // listeners de la cola de tareas
        document.getElementById("estado_cola").addEventListener('click', this.cambiar_estado_cola.bind(this), false);      
        document.getElementById("fileInput").addEventListener('change', this.cargar_archivo_gcode.bind(this));
        document.getElementById("cargar_gcode").addEventListener('click', () => {document.getElementById('fileInput').click();}, false);   
        document.getElementById("descargar_gcode").addEventListener('click', this.descargar_gcode.bind(this), false);                   
        document.getElementById("limpiar_cola").addEventListener('click', this.limpiar_cola.bind(this), false);  
        document.getElementById("comando_gcode").addEventListener('keydown', this.comando_gcode_keydown.bind(this));       
        document.getElementById("limpiar_ejecutadas").addEventListener('click', this.limpiar_ejecutadas.bind(this), false);                    



        // seteo el title al canvas
        this.canvas.title=`Zoom con rueda del mouse: Acerca/aleja la vista
Arrastrar con click izquierdo: Mueve la vista
Doble click: mueve la gondola`;

        if ($("#sdcard_present") != null) {
            //console.log("cargo edit");
            $("#sdcard_present").html(
                '<a href="edit.html" target="_blank">Editor de SD</a>'
            );
        }

        // mostrarCamara();

        // inicio con la cola pausada
        this.cambiar_estado_cola();

        $("#estado_cola").text(this.tareas.obtenerEstado().estado);

        // busco los parametros de la maquina y llamo a la funcion de mostrar maquina
        this.recuperar_parametros();

        // precargo las tareas de inicio
        this.encolar_tarea("C14,END", this.update_pen_position.bind(this));   // subo el pen
        this.encolar_tarea("C02," + this.pen.penWidth +",END", this.resultado_tarea_ok.bind(this));// cambio el tamaño del pen   
        this.encolar_tarea("C31," + this.machine_specs.currentMaxSpeed +",END", this.resultado_tarea_ok.bind(this));// cambio la velocidad maxima actual
        this.encolar_tarea("C32," + this.machine_specs.currentAcceleration +",END", this.resultado_tarea_ok.bind(this));// cambio la aceleracion actual
        
        this.zoom_default();
        this.init_tabs();
        this.draw_machine();       
    }

    guardar_parametros() {
        const machine_specs_tmp = {
            machineSizeMm_x     : parseInt($("#machineSizeMm_x").val()),
            machineSizeMm_y     : parseInt($("#machineSizeMm_y").val()),
            mmPerRev            : parseInt($("#mmPerRev").val()),
            stepMultiplier      : parseInt($("#stepMultiplier").val()),
            stepsPerRev         : parseInt($("#stepsPerRev").val()),
            currentMaxSpeed     : parseInt($("#currentMaxSpeed").val()),
            currentAcceleration : parseInt($("#currentAcceleration").val())
        };

        const page_tmp = {
            page_width  : parseInt($("#page_width").val()),
            page_height : parseInt($("#page_height").val()),
            page_pos_x  : parseInt($("#page_pos_x").val()),
            page_pos_y  : parseInt($("#page_pos_y").val()),
        };

        const pen_tmp = {
            x : parseInt($("#pen_x").val()),
            y : parseInt($("#pen_y").val()),
            motorA : parseInt($("#pen_motorA").html()),
            motorB : parseInt($("#pen_motorB").html()),
            status : parseInt($("#pen_status").val()),
            downPosition : parseInt($("#downPosition").val()),
            upPosition: parseInt($("#upPosition").val()),
            penWidth : parseFloat($("#penWidth").val())
        };

        const home_tmp = {
            x: parseInt($("#home_pos_x").val()),
            y: parseInt($("#home_pos_y").val()),
        };

        const config_tmp = {
            mostrar_mapa_tension: $("#mostrar_mapa_tension").prop("checked"),
            mover_gondola: $("#mover_gondola").prop("checked"),
        };

        this.machine_specs = machine_specs_tmp;
        this.pen = pen_tmp;
        this.page = page_tmp;
        this.home = home_tmp;
        this.config = config_tmp;

        //console.log("machine_specs");    console.log(machine_specs_tmp);
        //console.log("pen");    console.log(pen_tmp);
        //console.log("page");    console.log(page_tmp);
        //console.log("home");    console.log(home_tmp);
        //console.log("config");    console.log(config_tmp);

        localStorage.setItem("machine_specs", JSON.stringify(machine_specs_tmp));
        localStorage.setItem("pen", JSON.stringify(pen_tmp));
        localStorage.setItem("page", JSON.stringify(page_tmp));
        localStorage.setItem("home", JSON.stringify(home_tmp));
        localStorage.setItem("config", JSON.stringify(config_tmp));

        //console.log("parametros guardados");
        this.draw_machine();
    }

    config_default() {
        localStorage.clear();
        document.location.reload(true); // fuerza recarga de valores default cargados en los input de la pagina
    }

    recuperar_parametros() {
        //localStorage.clear();

        if (localStorage.length == 0) {
            console.log("no hay parametros guardados, se usaran los default");
            this.guardar_parametros();
        }

        let machine_specs_guardados = localStorage.getItem("machine_specs");
        this.machine_specs = JSON.parse(machine_specs_guardados);

        let pen_guardado = localStorage.getItem("pen");
        this.pen = JSON.parse(pen_guardado);

        let page_guardado = localStorage.getItem("page");
        this.page = JSON.parse(page_guardado);

        let home_guardado = localStorage.getItem("home");
        this.home = JSON.parse(home_guardado);

        let config_guardado = localStorage.getItem("config");
        this.config = JSON.parse(config_guardado);

        // console.log(this.machine_specs);
        // console.log(this.pen);
        // console.log(this.page);
        // console.log(this.home);
        // console.log(this.config);

        $("#machineSizeMm_x").val(this.machine_specs.machineSizeMm_x);
        $("#machineSizeMm_y").val(this.machine_specs.machineSizeMm_y);
        $("#mmPerRev").val(this.machine_specs.mmPerRev);
        $("#stepMultiplier").val(this.machine_specs.stepMultiplier);
        $("#stepsPerRev").val(this.machine_specs.stepsPerRev);

        $("#page_width").val(this.page.page_width);
        $("#page_height").val(this.page.page_height);
        $("#page_pos_x").val(this.page.page_pos_x);
        $("#page_pos_y").val(this.page.page_pos_y);

        $("#pen_x").val(this.pen.x);
        $("#pen_y").val(this.pen.y);
        $("#pen_motorA").html(this.pen.motorA);
        $("#pen_motorB").html(this.pen.motorB);

        $("#downPosition").val(this.pen.downPosition);
        $("#upPosition").val(this.pen.upPosition);
        $("#penWidth").val(this.pen.penWidth);    

        $("#home_pos_x").val(this.home.x);
        $("#home_pos_y").val(this.home.y);

        $("#mostrar_mapa_tension").prop("checked", this.config.mostrar_mapa_tension);
        $("#mover_gondola").prop("checked", this.config.mover_gondola);

        this.actualizar_estado_pen();
        //console.log("parametros recuperados de localStore");
    }

    aplicar_offset_scale(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale,this.scale);    
    }

    screenToWorld(x, y,offsetX = this.offsetX, offsetY = this.offsetY,scale = this.scale) {
        return {
            x: (x - offsetX) / scale,
            y: (y - offsetY) / scale
        };
    }

    worldToScreen(x, y, offsetX = this.offsetX, offsetY = this.offsetY,scale = this.scale) {
        return {
            x: (x * scale) + offsetX,
            y: (y * scale) + offsetY
        };
    }

    draw_image(src,x,y,width,height,globalAlpha=1){
        const img = new Image();
        img.onload = (event) => {
            // Establecer transparencia global
            this.ctx.globalAlpha = globalAlpha;
        
            // Calcular dimensiones manteniendo la proporcion
            let aspectRatio = 1;
            if(!width){
                width= img.width;
            }

            if(!height){
                height= img.height;
            }

            if (aspectRatio){ // si conserva el aspect ratio ignora el alto y usa el proporsional al ancho
                height=width;
                aspectRatio = img.height / img.width;
            }        
    
            // Dibujar la imagen manteniendo proporcion
            let s = this.worldToScreen(x, y);
            this.ctx.drawImage(img,s.x, s.y, width*this.scale, (height * aspectRatio)*this.scale);

            // Restaurar opacidad para las lineas
            this.ctx.globalAlpha = 1.0;        
        };
        img.src = src;
    }


    linedash(x, y, x1, y1,ancho_punto=2,acho_separacion=2,line_color='#000000') {   
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeStyle = line_color; 
        this.ctx.fillStyle = line_color;
        this.ctx.setLineDash([ancho_punto,acho_separacion]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x1,y1);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // reestablezco linea solida
    }

    line(x, y, x1, y1,line_color='#000000', lineWidth=1) {    
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = line_color;
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    circle(x, y, radio,line_color='#000000',color=false,lineWidth=1) {
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = line_color;    
        this.ctx.beginPath(); 
        this.ctx.arc(x, y, radio, 0, 2 * Math.PI);     
        if (color){
            this.ctx.fillStyle = color;
            this.ctx.fill(); 
        }     
        this.ctx.stroke();    
    }

    rectangle(x, y, ancho, alto,line_color='#000000',color=false,lineWidth=1) {
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle =line_color;
        this.ctx.fillStyle = line_color;
        if (color){
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, ancho, alto);
        }
        this.ctx.strokeRect(x, y, ancho, alto);
    }

    text(text, x, y,line_color='#000000') {
        this.ctx.fillStyle = line_color;
        this.ctx.fillText(text, x, y);
    }

    draw_queue() {
        //dibujo lo que esta guardado en la cola

        let lista = this.tareas.listarTareas();
        //  console.log(lista);

        this.pen_is_down = true;

        this.ctx.lineWidth = this.pen.penWidth;

        //dibujo las tareas pendientes
        this.ctx.strokeStyle ="#aaa";
        this.ctx.beginPath();

        let ant = {x:0,y: 0};
        // proceso cada tarea de la lista de tareas
        for (const tarea of lista) {
            
     
            let gcode = tarea.nombre.split(',');
            if (gcode[0] == 'C14'){ // es un pen up
                this.pen_is_down = false;
            }else  if (gcode[0] == 'C13'){ // es un pen down
                this.pen_is_down = true;
            }

            // calculo las coordenadas cartesianas del punto
            let mmPerStep = this.machine_specs.mmPerRev / this.multiplier(this.machine_specs.stepsPerRev);
            let cartesianX = this.getCartesianX(gcode[1],gcode[2]);
            let x = Math.round(cartesianX*mmPerStep);
            let y = Math.round(this.getCartesianY(cartesianX,gcode[1])*mmPerStep);
            //  circle(x,y,2);

            if (this.pen_is_down) {
                this.ctx.lineTo(x,y);  
                ant ={x:x,y:y};   // guardo ultima posicion que se dibujo     
            } else {
                // dibujo el trazado de la gondola mientras no esta dibujando
                this.ctx.stroke();
                this.linedash(ant.x,ant.y, x, y,1,1,  colores[0]);
                this.ctx.strokeStyle ="#aaa";
                this.ctx.beginPath();                  
                
                // si no dibuja las lineas punteadas muevo directametne al proximo punto
                //this.ctx.moveTo(x,y);
            }

            //  console.log(tarea.nombre);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        this.pen_is_down = true;

        // dibujo las tareas terminadas
        this.ctx.strokeStyle ="#000";
        this.ctx.beginPath();
        for (const tarea of this.tareas_completadas) {
            let gcode = tarea.split(',');
            if (gcode[0]=='C14'){ // pen up
                this.pen_is_down = false;
            }else  if (gcode[0]=='C13'){ // pen down
                this.pen_is_down = true;
            }

            // calculo las coordenadas cartesianas del punto
            let mmPerStep = this.machine_specs.mmPerRev / this.multiplier(this.machine_specs.stepsPerRev);
            let cartesianX = this.getCartesianX(gcode[1],gcode[2]);
            let x = Math.round(cartesianX * mmPerStep);
            let y = Math.round(this.getCartesianY(cartesianX, gcode[1]) * mmPerStep);
            //  circle(x,y,2);

            if (this.pen_is_down) {
                this.ctx.lineTo(x, y);
            } else {
                this.ctx.moveTo(x, y);
            }        
        }

    //  ctx.closePath();
        this.ctx.stroke();
    };

    draw_machine() {
        if (this.canvas.getContext) {
            this.aplicar_offset_scale();
        
            // muestra el mapa de tension si esta habilitado
            if (this.config.mostrar_mapa_tension) {        
                this.draw_image("https://cdn.jsdelivr.net/gh/sebasack/v-plotter@latest/SD/vPlotterMap.png",-15,-20,this.machine_specs.machineSizeMm_x + 30,false,0.1);  
            }

            // dibujo el contorno de la maquina maquina
            this.rectangle(1,1,this.machine_specs.machineSizeMm_x-1,this.machine_specs.machineSizeMm_y-1,'#000000',"#FFE6C9");
            //text("Machine: " +machine_specs.machineSizeMm_x +"x" +machine_specs.machineSizeMm_y,10,10);

            // dibujo la hoja
            this.rectangle(this.page.page_pos_x, this.page.page_pos_y,this.page.page_width, this.page.page_height,'#000000','#ffffff');

            this.draw_queue();

            //dibujo las lineas que indican el home
            this.linedash(0,this.home.y,this.machine_specs.machineSizeMm_x,this.home.y,5,5,"#777");
            this.linedash(this.home.x,0,this.home.x,this.machine_specs.machineSizeMm_y,5,5,"#777");

            // dibujo la gondola y el marcador
            this.rectangle(this.pen.x - 10, this.pen.y - 10, 20, 30, "#000000", "#ccc");
            this.circle(this.pen.x, this.pen.y, 3, "#000000", "#000000");
            if (!this.pen_down){ // el pen esta up, lo dibujo levantado           
                this.circle(this.pen.x, this.pen.y-10, 3, "#000000", "#000000");
                this.rectangle(this.pen.x-3, this.pen.y-10,6,10,'#000000',"#000000");
            }

            //dibujo los motores
            this.rectangle(-20,-20,20,20,'#000000',"#000000");
            this.rectangle(this.machine_specs.machineSizeMm_x,-20,20,20,'#000000',"#000000");

            // dibujo los hilos de los motores a la gondola
            this.line(0, 0, this.pen.x, this.pen.y);
            this.line(this.machine_specs.machineSizeMm_x, 0, this.pen.x, this.pen.y);                                 
            this.ctx.restore();
        }
    }


    update_pen_position(pen_position) { 
        if (pen_position.result_ok) {
            //{"result_ok":true,"motorA":15664,"motorB":15664}
            this.pen.motorA = pen_position.motorA;
            this.pen.motorB = pen_position.motorB;

            // calculo las coordenadas cartesianas de la gondola
            let mmPerStep = this.machine_specs.mmPerRev / this.multiplier(this.machine_specs.stepsPerRev);
            let cartesianX = this.getCartesianX(this.pen.motorA,this.pen.motorB);
            this.pen.x = Math.round(cartesianX * mmPerStep);
            this.pen.y = Math.round(this.getCartesianY(cartesianX, this.pen.motorA) * mmPerStep);

            $("#pen_motorA").html(this.pen.motorA);
            $("#pen_motorB").html(this.pen.motorB);

            $("#pen_x").val(this.pen.x);
            $("#pen_y").val(this.pen.y);

            this.guardar_parametros();
        }
    }

    actualizar_estado_pen(){
        if (this.pen_down){
            $("#cambiar_status_pen").html("Down");
        }else{
            $("#cambiar_status_pen").html("Up");
        }  
        this.draw_machine();    
    }

    cambiar_status_pen() {
        if (this.pen_down){                                     // esta bajado, lo subo
            this.encolar_tarea("C14,END");
        }else{                                                  // esta subido, lo bajo
            this.encolar_tarea("C13,END");
        }
    }

    set_home() {
        let motorA = this.calc_motorA(this.home.x, this.home.y);
        let motorB = this.calc_motorB(this.home.x, this.home.y);

        // envio la terea, cuando termine actualiza los datos de posicion
        this.encolar_tarea("C09," + motorA + "," + motorB + ",END", this.update_pen_status);
    }

    update_machine_specs(specs) {
        this.machine_specs = specs;
        $("#machineSizeMm_x").val(this.machine_specs.machineSizeMm_x);
        $("#machineSizeMm_y").val(this.machine_specs.machineSizeMm_y);
        $("#mmPerRev").val(this.machine_specs.mmPerRev);
        $("#stepMultiplier").val(this.machine_specs.stepMultiplier);
        $("#stepsPerRev").val(this.machine_specs.stepsPerRev);
        $("#downPosition").val(this.machine_specs.downPosition);
        $("#upPosition").val(this.machine_specs.upPosition);
        $("#penWidth").val(this.pen.penWidth);
        this.draw_machine();
    }

    resultado_tarea_ok(resultado){
        if (!resultado.result_ok){
            console.log("error enviando comando!");
        }
    }

    send_machine_specs(){               
        this.encolar_tarea("C25,NOMBRE_PG,END", this.resultado_tarea_ok.bind(this));// cambio el nombre de la maquina, no esta implementado
        this.encolar_tarea("C24," + this.machine_specs.machineSizeMm_x + "," + this.machine_specs.machineSizeMm_y + ",END", this.resultado_tarea_ok.bind(this));// cambio el tamaño de la maquina
        this.encolar_tarea("C29," + this.machine_specs.mmPerRev + ",END", this.resultado_tarea_ok.bind(this));// cambio los mm por revolucion
        this.encolar_tarea("C30," + this.machine_specs.stepsPerRev + ",END", this.resultado_tarea_ok.bind(this));// cambio los pasos por revolucion
        this.encolar_tarea("C37," + this.machine_specs.stepMultiplier + ",END", this.resultado_tarea_ok.bind(this));// cambio el multiplicador de pasos
        this.encolar_tarea("C45," + this.machine_specs.downPosition +"," + this.machine_specs.upPosition +",END", this.resultado_tarea_ok.bind(this));// cambio las posisciones up y down del pen
        this.encolar_tarea("C31," + this.machine_specs.currentMaxSpeed +",END", this.resultado_tarea_ok.bind(this));// cambio la velocidad maxima actual
        this.encolar_tarea("C32," + this.machine_specs.currentAcceleration +",END", this.resultado_tarea_ok.bind(this));// cambio la aceleracion actual
        this.encolar_tarea("C02," + this.pen.penWidth +",END", this.resultado_tarea_ok.bind(this));// cambio el tamaño del pen   
    }

    async ejecutar_comando(parametros, funcionExito) {    
        /*parametros va en la forma
                "getPosition"                  cuando es solo el comando sin otros parametros
                "C06,15664,15664,END"          cuando es gcode
                "move&motorA=55&motorB=-66"    cuando es un comando y lleva varios parametros  */

        const ini = new Date();

        try {

            // SE EJECUTA SI ESTA EN DESARROLLO
            if (location.href.includes('file://') || location.href.includes('http://127.0.0.1') ){
                //console.log("EJECUTANDO COMANDO EN MODO LOCAL, SE RETORNAN DATOS DE PRUEBA");
                let data= {'result_ok':false};
                if (parametros=='getPosition'){
                    //retorno valores random
                    data= {"result_ok":true,"motorA":Math.floor(Math.random() *8000)+13000,"motorB":Math.floor(Math.random() *8000)+13000};       
                }else if (parametros=='getMachineSpecs'){
                    data=  {"result_ok":true,"machineSizeMm_x":882,"machineSizeMm_y":1100,"mmPerRev":126,"stepsPerRev":4076,"stepMultiplier":8,"downPosition":90,"upPosition":123,"currentMaxSpeed":1000,"currentAcceleration":400,"penWidth":0.5} 
                }else if (parametros.includes(',END')){  // es gcode
                    let params = parametros.split(","); // Splits by space
                    if (params[0]=='C13' ){ // down
                        data= {"result_ok":true};  
                        this.pen_down = true;
                        funcionExito=this.actualizar_estado_pen.bind(this);    
                    }else if ( params[0]=='C14'){ // up
                        data= {"result_ok":true};    
                        this.pen_down = false;
                        funcionExito=this.actualizar_estado_pen.bind(this);        
                    }else{
                        let motorA = params[1];
                        let motorB = params[2];
                        data = { result_ok: true, motorA: motorA, motorB: motorB };
                    }
                    this.tareas_completadas.push(parametros);
                }   

                // logueo llamado y respuesta
                const fin = new Date();        
                $("#log").val(formatTime(ini)+ " (LOCAL) "+ parametros+ "\n" + formatTime(fin) + " (LOCAL) "+ JSON.stringify(data).replaceAll(",", ", ") +"\n" + $("#log").val());

                //actualizo la lista de tareas
                $("#tareas").val(this.tareas.mostrar());
                $("#estado_cola").text(this.tareas.obtenerEstado().estado);
                if (funcionExito && typeof funcionExito === "function") {               
                    funcionExito(data);
                }
                return;
            }
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }

        // EJECUTO EN PRODUCCION
        try {
            const url = `/control?command=` + parametros;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();

                // logueo llamado y respuesta
                const fin = new Date();
                $("#log").val( formatTime(ini)+ " "+parametros +"\n" +formatTime(ini) + " "+JSON.stringify(data).replaceAll(",", ", ") +"\n" +$("#log").val());

                //actualizo la lista de tareas
                $("#tareas").val(this.tareas.mostrar());

                this.tareas_completadas.push(parametros);
                // Llama a la función de éxito si existe
                if (funcionExito && typeof funcionExito === "function") {
                    funcionExito(data);
                }
                return data;
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }    

    limpiar_ejecutadas(){
        this.tareas_completadas = [];
        this.draw_machine();
        $("#log").val('');    
    }

    encolar_tarea(tarea, funcionExito) {
        this.tareas.agregarTarea(() => this.ejecutar_comando(tarea, funcionExito), tarea);
        $("#tareas").val(this.tareas.mostrar());
    }

    cambiar_estado_cola() {
        if (!this.tareas.obtenerEstado().pausado) {
            this.tareas.pausar();
        } else {
            this.tareas.reanudar();
        }
        $("#estado_cola").text(this.tareas.obtenerEstado().estado);
    }    

    return_to_home() {
        this.encolar_tarea("C14,END"); // levanto el pen antes de moverlo
        let motorA = this.calc_motorA(this.home.x, this.home.y);
        let motorB = this.calc_motorB(this.home.x, this.home.y);
        this.encolar_tarea("C01," + motorA + "," + motorB + ",END", this.update_pen_position.bind(this));
    }

    centrar_pagina_x() {
        this.page.page_pos_x = this.machine_specs.machineSizeMm_x / 2 - this.page.page_width / 2;
        $("#page_pos_x").val(this.page.page_pos_x);
        this.guardar_parametros();
    }

    init_tabs(){
        const tabs = document.querySelectorAll('.tab');    
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');            
                // Desactivar todas las pestañas
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));            
                // Activar la pestaña clickeada
                tab.classList.add('active');
                document.getElementById(target).classList.add('active');

                // activo y desactivo el canvas de captura
                if (tab.getAttribute('data-tab') == 'captura'){
                    $('#lineCanvas').show();
                }else{
                    $('#lineCanvas').hide();
                }
            });
        });

        // selecciono el primer option 
        $('#select_capturar option:first').prop('selected', true);

        this.cambio_plugin_captura();
    };

    zoom_default(){
        // Obtener dimensiones del td que contiene el canvas
        const td = this.canvas.closest('td');       

        // Cambiar dimensiones del canvas
        this.canvas.width = td.clientWidth;
        this.canvas.height = td.clientHeight;    

        // centro la maquina en el canvas    
        this.scale =1;    
        this.offsetX =(this.canvas.width - this.machine_specs.machineSizeMm_x )/2;
        this.offsetY =0;
    }

    resetZoom() {
        this.zoom_default();
        this.draw_machine();
    }

    multiplier(valor){
        return valor * this.machine_specs.stepMultiplier;
    }  

    calc_motorA(x,y){
        return Math.round((this.machine_specs.stepsPerRev * Math.sqrt(Math.pow(x,2) + Math.pow(y,2))) / this.machine_specs.mmPerRev);
    };

    calc_motorB(x,y){
        return Math.round((1/this.machine_specs.stepMultiplier) * Math.sqrt(Math.pow((this.machine_specs.machineSizeMm_x * (this.machine_specs.stepMultiplier * this.machine_specs.stepsPerRev / this.machine_specs.mmPerRev)),2) + Math.pow( (Math.sqrt( Math.pow(x,2) + Math.pow(y,2)) / (this.machine_specs.mmPerRev/(this.machine_specs.stepsPerRev*this.machine_specs.stepMultiplier))),2) - (2 * this.machine_specs.machineSizeMm_x * (this.machine_specs.stepMultiplier * this.machine_specs.stepsPerRev / this.machine_specs.mmPerRev) * x) / (this.machine_specs.mmPerRev/(this.machine_specs.stepsPerRev*this.machine_specs.stepMultiplier)) ));
    };

    getCartesianX(motorA,motorB){
        let stepsPerMm = this.multiplier(this.machine_specs.stepsPerRev) / this.machine_specs.mmPerRev;
        let machineSizeStepsX = this.machine_specs.machineSizeMm_x * stepsPerMm;
        let calcX = (Math.pow(machineSizeStepsX, 2) - Math.pow(this.multiplier(motorB), 2) + Math.pow(this.multiplier(motorA), 2)) / (machineSizeStepsX*2);
        return calcX;
    }

    getCartesianY( cX,  motorA){
        let calcY = Math.sqrt(Math.pow(this.multiplier(motorA),2)-Math.pow(cX,2));
        return calcY;
    }


    // esta funcion ajusta los offsets y escala recibido de la captura
    ajustarOffsetEscala(vertice,captura){

         // copio el vertice por que si lo uso directamente le cambia el offset y la escala
        let copia_vertice = {x: vertice.x, y:vertice.y};

        // aca ajusto la escala
        copia_vertice.x *= captura.scale / captura.scale_pagina;
        copia_vertice.y *= captura.scale / captura.scale_pagina;                        

        // ajusto el offset
        copia_vertice.x += (captura.offsetX - captura.offsetX_pagina) / captura.scale_pagina;
        copia_vertice.y += (captura.offsetY - captura.offsetY_pagina) / captura.scale_pagina;
                            
        // muevo la gondola al proximo punto
        let motorA = this.calc_motorA(copia_vertice.x + this.page.page_pos_x ,copia_vertice.y + this.page.page_pos_y);
        let motorB = this.calc_motorB(copia_vertice.x + this.page.page_pos_x ,copia_vertice.y + this.page.page_pos_y);    

        return {motorA:motorA,motorB:motorB}

    }


    ajustarOffsetEscalaInverso(vertice) {
        let verticeInverso = new Vertice(vertice.x,vertice.y);
        
        // Revertir en orden inverso a la transformación original
        verticeInverso.x -= this.page.page_pos_x;
        verticeInverso.y -= this.page.page_pos_y;
        
        verticeInverso.x -= (captura.offsetX - captura.offsetX_pagina) / captura.scale_pagina;
        verticeInverso.y -= (captura.offsetY - captura.offsetY_pagina) / captura.scale_pagina;
        
        const factorEscala = captura.scale / captura.scale_pagina;
         
        verticeInverso.x = Math.round(verticeInverso.x / factorEscala);
        verticeInverso.y = Math.round(verticeInverso.y /factorEscala);        
        
        return verticeInverso;
    }

    optimizarRecorrido(){

        // separo las lineas que fueron cortadas en la seleccion en lineas individuales para poder optimizar el recorrido
        let lineas = [];
        captura.dibujo.lineas.forEach(function(linea) {         
            let nueva_linea =  new Linea();
            linea.vertices.forEach(function(vertice) {   
                if (vertice.elegido){    
                    let v = nueva_linea.agregarVertice(vertice.x, vertice.y);                    
                    v.elegido = true;
                }else{ 
                    //si la linea tiene mas de un vertice la agrego
                    if (nueva_linea.vertices.length > 1){
                        lineas.push(nueva_linea);
                        nueva_linea = new Linea();
                    }
                }              
            });
            // agrego la ultima linea si tiene mas de un vertice
            if (nueva_linea.vertices.length > 1){
                lineas.push(nueva_linea);
            }
        });
   
        let ultimo_ver = this.ajustarOffsetEscalaInverso(this.home);

        //ultimo_ver.id='ultimo';
        let lineas_ordenadas = [];
          
        // mientras haya lineas que procesar 
        while (lineas.length > 0){
            let pos_linea_mas_cercana = -1;
            let pos_vertice_mas_cercano =-1; // es el primero
            let menor_distancia = Infinity;
            let distancia = Infinity;
           
            for (let i = 0; i < lineas.length; i++){
                // busco que linea comienza o termina mas cerca del ultimo vertice
                let pos_ultimo_vertice = lineas[i].vertices.length-1;
                let primero_linea = lineas[i].vertices[0];
                let ultimo_linea = lineas[i].vertices[pos_ultimo_vertice];
            
                // el primer vertice de esta linea esta mas cerca del punto inicial que el anterior
                distancia = ultimo_ver.distanciaA(primero_linea);
             
                if (distancia < menor_distancia){              
                    pos_linea_mas_cercana = i;
                    pos_vertice_mas_cercano = 0; // es el primero
                    menor_distancia = distancia;
                }

                // el ultimo vertice de esta linea esta mas cerca del punto inicial que el anterior
                distancia = ultimo_ver.distanciaA(ultimo_linea);
                if (distancia < menor_distancia){   
                    pos_linea_mas_cercana = i;
                    pos_vertice_mas_cercano = pos_ultimo_vertice; // es el ultimo
                    menor_distancia = distancia;                
                }
          
            };
        
            // copio la linea mas cercana
            let linea_mas_cercana = captura.dibujo.copiarLinea(lineas[pos_linea_mas_cercana]);

            // si tengo que empezar por el ultimo vertice invierto el arreglo
            if (pos_vertice_mas_cercano > 0){       
                linea_mas_cercana.vertices = linea_mas_cercana.vertices.slice().reverse();
            }
      
            // redefino el ultimo_ver para que siga buscando
            ultimo_ver = linea_mas_cercana.vertices[ linea_mas_cercana.vertices.length-1];

            // agrego la linea mas cercana a lineas_ordenadas
            lineas_ordenadas.push(linea_mas_cercana);
          
            // elimino la linea del arreglo original
            lineas.splice(pos_linea_mas_cercana, 1)[0];
        };
        return lineas_ordenadas;
    }   

    capturar_tareas(){
        if (captura.dibujo === false){
            alert('No importo ningun dibujo!');
            return;
        }   

        if (this.tareas.tamano() > 0 && !this.tareas.pausado){
            alert(`La maquina esta procesando una cola en este momento, 
Pausela o elimine las tareas para importar una nueva cola.`);
            return;
        };
       
        if (captura.dibujo.vertices_elegidos == 0){          
            //calculo el box de la hoja donde voy a seleccionar
            const box = {
                    x: (captura.offsetX_pagina - captura.offsetX) / captura.scale,
                    y: (captura.offsetY_pagina - captura.offsetY) / captura.scale,
                    width: captura.width_pagina / captura.scale,
                    height: captura.height_pagina / captura.scale
                };
            // dibujo el cuadro que indica que se seleccionara
            //captura.drawSelectionBox_TEST(box,4) ;                                     
            captura.dibujo.seleccionarElementos(box,captura.modo_seleccion );              
        }

        let lineas_optimizadas = this.optimizarRecorrido();
        
        // limpio la cola de tareas 
        this.limpiar_cola();

        //encolo tareas de volver a home
        this.return_to_home();    

    
        // para cada linea del dibujo   
        lineas_optimizadas.forEach((linea) => {         
            // subo el pen      
            this.encolar_tarea("C14,END", this.update_pen_position.bind(this)); 
            
            let pen_is_down = false;
            linea.vertices.forEach((vertice) => {
                // muevo la gondola al proximo punto                       
                let ajustado = this.ajustarOffsetEscala(vertice,captura);
                this.encolar_tarea('C17,'+ajustado.motorA+','+ajustado.motorB+',END', this.update_pen_position.bind(this));
                if (!pen_is_down){
                    // bajo el pen
                    this.encolar_tarea("C13,END", this.update_pen_position.bind(this));   
                    pen_is_down = true;
                }                   
            });            
        });
              

        // encolo tarea de volver a home al final
        this.return_to_home();

        //limpio las tareas ejecutadas
        this.limpiar_ejecutadas();        
        
        //pauso la cola para que no arranque inmediatamente
        this.tareas.pausar();

        //voy a la solapa de dibujado
        document.getElementById('tab_dibujar').click();

        //mustro la maquina con la captura
        this.draw_machine();                
    }    
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// tengo que dejar disponible el objeto de control para poder obtener datos de la maquina
let control = false;

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function(){
   control = new Control();
});




