$("#version").append(".c09");// agrego la version del control.js

machine_specs = {};
pen = {};
page = {};
home = {};
config = {};


tareas_completadas = [];

var canvas = document.getElementById("machine");
var ctx = canvas.getContext("2d");


let isDragging = false;
let lastX = 0;
let lastY = 0;
let offsetX = 0;
let offsetY = 0;
let scale =1;
let pen_down = true; // down

// defino la variable donde guardaran los dibujos importados
let dibujo_importado = false;

// creo la cola de tareas
const tareas = new ColaTareas();


function guardar_parametros() {
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
    }


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

    machine_specs = machine_specs_tmp;
    pen = pen_tmp;
    page = page_tmp;
    home = home_tmp;
    config = config_tmp;

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
    draw_machine();
}

function config_default() {
    localStorage.clear();
    document.location.reload(true); // fuerza recarga de valores default cargados en los input de la pagina
}

function recuperar_parametros() {
    //localStorage.clear();

    if (localStorage.length == 0) {
        console.log("no hay parametros guardados, se usaran los default");
        guardar_parametros();
    }

    machine_specs_guardados = localStorage.getItem("machine_specs");
    machine_specs = JSON.parse(machine_specs_guardados);

    pen_guardado = localStorage.getItem("pen");
    pen = JSON.parse(pen_guardado);

    page_guardado = localStorage.getItem("page");
    page = JSON.parse(page_guardado);

    home_guardado = localStorage.getItem("home");
    home = JSON.parse(home_guardado);

    config_guardado = localStorage.getItem("config");
    config = JSON.parse(config_guardado);

    //console.log(machine_specs);
    //console.log(pen);
    //console.log(page);
    //console.log(home);
    //console.log(config);

    $("#machineSizeMm_x").val(machine_specs.machineSizeMm_x);
    $("#machineSizeMm_y").val(machine_specs.machineSizeMm_y);
    $("#mmPerRev").val(machine_specs.mmPerRev);
    $("#stepMultiplier").val(machine_specs.stepMultiplier);
    $("#stepsPerRev").val(machine_specs.stepsPerRev);

    $("#page_width").val(page.page_width);
    $("#page_height").val(page.page_height);
    $("#page_pos_x").val(page.page_pos_x);
    $("#page_pos_y").val(page.page_pos_y);

    $("#pen_x").val(pen.x);
    $("#pen_y").val(pen.y);
    $("#pen_motorA").html(pen.motorA);
    $("#pen_motorB").html(pen.motorB);

    $("#downPosition").val(pen.downPosition);
    $("#upPosition").val(pen.upPosition);
    $("#penWidth").val(pen.penWidth);    

    $("#home_pos_x").val(home.x);
    $("#home_pos_y").val(home.y);

    $("#mostrar_mapa_tension").prop("checked", config.mostrar_mapa_tension);
    $("#mover_gondola").prop("checked", config.mover_gondola);


    actualizar_estado_pen();
    //console.log("parametros recuperados de localStore");
}




function draw_machine() {

    if (canvas.getContext) {

        aplicar_offset_scale();
       
        // muestra el mapa de tension si esta habilitado
        if (config.mostrar_mapa_tension) {        
            draw_image("https://cdn.jsdelivr.net/gh/sebasack/v-plotter@latest/SD/vPlotterMap.png",-15,-20,machine_specs.machineSizeMm_x + 30,false,true,0.1);  
        }

        // dibujo el contorno de la maquina maquina
        rectangle(1,1,machine_specs.machineSizeMm_x-1,machine_specs.machineSizeMm_y-1,'#000000',"#FFE6C9");
        //text("Machine: " +machine_specs.machineSizeMm_x +"x" +machine_specs.machineSizeMm_y,10,10);

        // dibujo la hoja
        rectangle(page.page_pos_x, page.page_pos_y, page.page_width, page.page_height,'#000000','#ffffff');

        draw_queue();

        //dibujo las lineas que indican el home
        linedash(0,home.y,machine_specs.machineSizeMm_x,home.y,5,5,"#777");
        linedash(home.x,0,home.x,machine_specs.machineSizeMm_y,5,5,"#777");


        // dibujo la gondola y el marcador
        rectangle(pen.x - 10, pen.y - 10, 20, 30, "#000000", "#ccc");
        circle(pen.x, pen.y, 3, "#000000", "#000000");
        if (!pen_down){ // el pen esta up, lo dibujo levantado           
            circle(pen.x, pen.y-10, 3, "#000000", "#000000");
            rectangle(pen.x-3, pen.y-10,6,10,'#000000',"#000000");
        }

        //dibujo los motores
        rectangle(-20,-20,20,20,'#000000',"#000000");
        rectangle(machine_specs.machineSizeMm_x,-20,20,20,'#000000',"#000000");


        // dibujo los hilos de los motores a la gondola
        line(0, 0, pen.x, pen.y);
        line(machine_specs.machineSizeMm_x, 0, pen.x, pen.y);                                 
        ctx.restore();
    }
}


function update_pen_position(pen_position) {
    if (pen_position.result_ok) {
        //{"result_ok":true,"motorA":15664,"motorB":15664}
        pen.motorA = pen_position.motorA;
        pen.motorB = pen_position.motorB;

        // calculo las coordenadas cartesianas de la gondola
        mmPerStep = machine_specs.mmPerRev / multiplier(machine_specs.stepsPerRev);
        cartesianX = getCartesianX(pen.motorA,pen.motorB);
        pen.x = Math.round(cartesianX*mmPerStep);
        pen.y = Math.round(getCartesianY(cartesianX,pen.motorA)*mmPerStep);

        // console.log(pen);

        $("#pen_motorA").html(pen.motorA);
        $("#pen_motorB").html(pen.motorB);

        $("#pen_x").val(pen.x);
        $("#pen_y").val(pen.y);

        guardar_parametros();
    }
}



function actualizar_estado_pen(){
    if (pen_down){
        $("#cambiar_status_pen").html("Down");
    }else{
        $("#cambiar_status_pen").html("Up");
    }  
    draw_machine();    
}

function cambiar_status_pen() {
    if (pen_down){                                          // esta bajado, lo subo
        encolar_tarea("C14,END");
    }else{                                                  // esta subido, lo bajo
        encolar_tarea("C13,END");
    }
}


function set_home() {
    motorA = calc_motorA(home.x, home.y);
    motorB = calc_motorB(home.x, home.y);

    // envio la terea, cuando termine actualiza los datos de posicion
    encolar_tarea("C09," + motorA + "," + motorB + ",END", update_pen_status);
}

function update_machine_specs(specs) {
    machine_specs = specs;
    $("#machineSizeMm_x").val(machine_specs.machineSizeMm_x);
    $("#machineSizeMm_y").val(machine_specs.machineSizeMm_y);
    $("#mmPerRev").val(machine_specs.mmPerRev);
    $("#stepMultiplier").val(machine_specs.stepMultiplier);
    $("#stepsPerRev").val(machine_specs.stepsPerRev);
    $("#downPosition").val(machine_specs.downPosition);
    $("#upPosition").val(machine_specs.upPosition);
    $("#penWidth").val(pen.penWidth);
    draw_machine();
}

function resultado_tarea_ok(resultado){
    if (!resultado.result_ok){
        console.log("error enviando comando!");
    }
}

function send_machine_specs(){
    encolar_tarea("C25,NOMBRE_PG,END", resultado_tarea_ok);// cambio el nombre de la maquina, no esta implementado
    encolar_tarea("C24," + machine_specs.machineSizeMm_x + "," + machine_specs.machineSizeMm_y + ",END", resultado_tarea_ok);// cambio el tamaño de la maquina
    encolar_tarea("C29," + machine_specs.mmPerRev + ",END", resultado_tarea_ok);// cambio los mm por revolucion
    encolar_tarea("C30," + machine_specs.stepsPerRev + ",END", resultado_tarea_ok);// cambio los pasos por revolucion
    encolar_tarea("C37," + machine_specs.stepMultiplier + ",END", resultado_tarea_ok);// cambio el multiplicador de pasos
    encolar_tarea("C45," + machine_specs.downPosition +"," + machine_specs.upPosition +",END", resultado_tarea_ok);// cambio las posisciones up y down del pen
    encolar_tarea("C31," + machine_specs.currentMaxSpeed +",END", resultado_tarea_ok);// cambio la velocidad maxima actual
    encolar_tarea("C32," + machine_specs.currentAcceleration +",END", resultado_tarea_ok);// cambio la aceleracion actual
    encolar_tarea("C02," + pen.penWidth +",END", resultado_tarea_ok);// cambio el tamaño del pen   
}

async function ejecutar_comando(parametros, funcionExito) {
    /*parametros va en la forma
            "getPosition"                  cuando es solo el comando sin otros parametros
            "C06,15664,15664,END"          cuando es gcode
            "move&motorA=55&motorB=-66"    cuando es un comando y lleva varios parametros  */

    const ini = new Date();

    // SE EJECUTA SI ESTA EN DESARROLLO
    if (location.href.includes('file://')){
        //console.log("EJECUTANDO COMANDO EN MODO LOCAL, SE RETORNAN DATOS DE PRUEBA");
        data= {'result_ok':false};
        if (parametros=='getPosition'){
            //retorno valores random
            data= {"result_ok":true,"motorA":Math.floor(Math.random() *8000)+13000,"motorB":Math.floor(Math.random() *8000)+13000};       
        }else if (parametros=='getMachineSpecs'){
            data=  {"result_ok":true,"machineSizeMm_x":882,"machineSizeMm_y":1100,"mmPerRev":126,"stepsPerRev":4076,"stepMultiplier":8,"downPosition":90,"upPosition":123,"currentMaxSpeed":1000,"currentAcceleration":400,"penWidth":0.5} 
        }else if (parametros.includes(',END')){  // es gcode
            let params = parametros.split(","); // Splits by space
            if (params[0]=='C13' ){ // down
                data= {"result_ok":true};  
                pen_down = true;
                funcionExito=actualizar_estado_pen;    
            }else if ( params[0]=='C14'){ // up
                data= {"result_ok":true};    
                pen_down = false;
                funcionExito=actualizar_estado_pen;        
            }else{
                motorA = params[1];
                motorB = params[2];
                data = { result_ok: true, motorA: motorA, motorB: motorB };
            }
            tareas_completadas.push(parametros);
        }   

        // logueo llamado y respuesta
        const fin = new Date();        
        $("#log").val(formatTime(ini)+ " (LOCAL) "+ parametros+ "\n" + formatTime(fin) + " (LOCAL) "+ JSON.stringify(data).replaceAll(",", ", ") +"\n" + $("#log").val());

        //actualizo la lista de tareas
        $("#tareas").val(tareas.mostrar());
        $("#estado_cola").text(tareas.obtenerEstado().estado);
        if (funcionExito && typeof funcionExito === "function") {
            funcionExito(data);
        }
        return;
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
            $("#tareas").val(tareas.mostrar());

            tareas_completadas.push(parametros);
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


function limpiar_cola() {
    tareas.limpiar();
    draw_machine();
    $("#tareas").val(tareas.mostrar());
}

function limpiar_ejecutadas(){
    tareas_completadas = [];
    draw_machine();
    $("#log").val('');    
}

function encolar_tarea(tarea, funcionExito) {
    tareas.agregarTarea(() => ejecutar_comando(tarea, funcionExito), tarea);
    $("#tareas").val(tareas.mostrar());
}

function cambiar_estado_cola() {
    if (!tareas.obtenerEstado().pausado) {
        tareas.pausar();
    } else {
        tareas.reanudar();
    }
    $("#estado_cola").text(tareas.obtenerEstado().estado);
}


function return_to_home() {
    encolar_tarea("C14,END"); // levanto el pen antes de moverlo
    motorA = calc_motorA(home.x, home.y);
    motorB = calc_motorB(home.x, home.y);
    encolar_tarea("C01," + motorA + "," + motorB + ",END", update_pen_position);
}

function centrar_pagina_x() {
    page.page_pos_x = machine_specs.machineSizeMm_x / 2 - page.page_width / 2;
    $("#page_pos_x").val(page.page_pos_x);
    guardar_parametros();
}


function init_tabs(){
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
        });
    });
};

function zoom_default(){

    // Obtener dimensiones del td que contiene el canvas
    const td = canvas.closest('td');       

   // Cambiar dimensiones del canvas
    canvas.width = td.clientWidth;
    canvas.height = td.clientHeight;    

    // centro la maquina en el canvas    
    scale =1;    
    offsetX =(canvas.width - machine_specs.machineSizeMm_x )/2;
    offsetY =0;
}


function resetZoom() {
    zoom_default();
    draw_machine();
}


function init() {
    if ($("#sdcard_present") != null) {
        //console.log("cargo edit");
        $("#sdcard_present").html(
            '<a href="edit.html" target="_blank">Editor de SD</a>'
        );
    }

    // mostrarCamara();

    $("#estado_cola").on("click", function () {
        cambiar_estado_cola();
    });


    // inicio con la cola pausada
    cambiar_estado_cola();

    $("#estado_cola").text(tareas.obtenerEstado().estado);

    // busco los parametros de la maquina y llamo a la funcion de mostrar maquina
    recuperar_parametros();


    // precargo las tareas de inicio
    encolar_tarea("C14,END", update_pen_position);   // subo el pen
    encolar_tarea("C02," + pen.penWidth +",END", resultado_tarea_ok);// cambio el tamaño del pen   
    encolar_tarea("C31," + machine_specs.currentMaxSpeed +",END", resultado_tarea_ok);// cambio la velocidad maxima actual
    encolar_tarea("C32," + machine_specs.currentAcceleration +",END", resultado_tarea_ok);// cambio la aceleracion actual


    zoom_default();

    init_tabs();

    draw_machine();
      
}




/**************************************************** LISTENERS *************************************************************/


// listener para elegir con que plugin se va a capturar la imagen
document.getElementById('select_capturar').addEventListener('change', function(event) {

    // busco el nombre del plugin seleccionado
    var seleccionado = $(this).val();
    
    // llamo a la funcion que carga las fonfiguraciones de captura
    window[seleccionado]();

});
  


// Event listener para el input de archivo GCODE
document.getElementById('fileInput').addEventListener('change', function(event) {
    selectedFile = event.target.files[0];
    
 

    if (selectedFile) {        
        const reader = new FileReader();    
        reader.onload = function(e) {

         
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
                    arrayBufferReader.onload = function (arrayBufferEvent) {
                        fileData.arrayBuffer = arrayBufferEvent.target.result;

                        cola = fileData.content.split("\n");

                        tareas.limpiar();
                        tareas_completadas = [];

                        tareas.pausar();
                        $("#estado_cola").text(
                            tareas.obtenerEstado().estado + " (IMPORTANDO)"
                        );

                        setTimeout(function () {
                            for (const tarea of cola) {
                                if (tarea.startsWith("C") && tarea.includes(",END")) {
                                    encolar_tarea(tarea, update_pen_position);
                                } else {
                                    console.log(" LA TAREA " + tarea + " NO PARECE SER GCODE!!"
                                    );
                                }
                            }
                            $("#estado_cola").text(
                                tareas.obtenerEstado().estado
                            );
                            draw_machine();
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
);


// Add a click event listener to the canvas
canvas.addEventListener("dblclick", function (event) {
    // Calculate the mouse coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;


    // corrijo las coordenadas teniendo en cuenta el zoom y el offset
    w= screenToWorld(x, y);


    if (config.mover_gondola) {
        // calculo los datos de la nueva posicion
        pen_x = Math.round(w.x);
        pen_y = Math.round(w.y);

        motorA = calc_motorA(pen_x, pen_y);
        motorB = calc_motorB(pen_x, pen_y);

        // envio la terea, cuando termine actualiza los datos de posicion
        encolar_tarea('C01,'+motorA+','+motorB+',END',update_pen_position);
    }else{
         // guardo la nueva posicion
        pen.x = Math.round(w.x);
        pen.y = Math.round(w.y);

        $("#pen_x").val(pen.x);
        $("#pen_y").val(pen.y);

        pen.motorA = calc_motorA(pen.x, pen.y);
        pen.motorB = calc_motorB(pen.x, pen.y);

        $("#pen_motorA").html(pen.motorA);
        $("#pen_motorB").html(pen.motorB);

        guardar_parametros();
    }
});

// Eventos para el zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity);
    
    // Calcular nuevo scale y offset
    offsetX -= (mouseX - offsetX) * (zoom - 1);
    offsetY -= (mouseY - offsetY) * (zoom - 1);
    scale *= zoom;
    

    draw_machine();
});

// Pan (arrastrar)
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        offsetX += (e.clientX - lastX) / scale;
        offsetY += (e.clientY - lastY) / scale;
        lastX = e.clientX;
        lastY = e.clientY;                  
        draw_machine();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;   
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});


document.getElementById('comando_gcode').addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      // Prevent the default form submission behavior if the input is within a form
      event.preventDefault(); 

      let comando = $("#comando_gcode").val().toUpperCase();
      //valido el gcode
        if (gcode_valido(comando)){
            $("#comando_gcode").val('');
            encolar_tarea(comando, update_pen_position);
        }else{
            alert("gcode " + comando + " no valido!");
        }
    }
});

/******************************** IMPORTACION IMAGENES *************************/




function importar_dibujo(){
    if (dibujo_importado === false){
        alert('No importo ningun dibujo!');
        return;
    }
alert('no implementado');

}