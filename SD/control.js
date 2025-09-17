$("#version").append(".c7"); // agrego la version del control.js

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


// creo la cola de tareas
const tareas = new ColaTareasAuto();




function screenToWorld(x, y) {
    return {
        x: (x - $("#offsetX").val()) /$("#scale").val(),
        y: (y - $("#offsetY").val()) / $("#scale").val()
    };
}

function worldToScreen(x, y) {
    return {
        x: x * $("#scale").val() + $("#offsetX").val(),
        y: y * $("#scale").val() +$("#offsetY").val()
    };
}


// Add a click event listener to the canvas
canvas.addEventListener("dblclick", function (event) {
    // Calculate the mouse coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;


    if (config.mover_gondola) {
        // calculo los datos de la nueva posicion
        pen_x = Math.round(x);
        pen_y = Math.round(y);

        motorA = calc_motorA(pen_x, pen_y);
        motorB = calc_motorB(pen_x, pen_y);

        // envio la terea, cuando termine actualiza los datos de posicion
        encolar_tarea('C01,'+motorA+','+motorB+',END',update_pen_position);
    }else{
         // guardo la nueva posicion
        pen.x = Math.round(x);
        pen.y = Math.round(y);

        $("#pen_x").val(pen.x);
        $("#pen_y").val(pen.y);

        pen.motorA = calc_motorA(pen.x, pen.y);
        pen.motorB = calc_motorB(pen.x, pen.y);

        $("#pen_motorA").html(pen.motorA);
        $("#pen_motorB").html(pen.motorB);

        guardar_parametros();
    }
});

function guardar_parametros() {
    const machine_specs_tmp = {
        machineSizeMm_x : $("#machineSizeMm_x").val(),
        machineSizeMm_y : $("#machineSizeMm_y").val(),
        mmPerRev        : $("#mmPerRev").val(),
        stepMultiplier  : $("#stepMultiplier").val(),
        stepsPerRev     : $("#stepsPerRev").val(),
      //currentMaxSpeed:  $("#currentMaxSpeed").val(),
      //currentAcceleration:    $("#currentAcceleration").val()
    };

    const page_tmp = {
        page_width  : $("#page_width").val(),
        page_height : $("#page_height").val(),
        page_pos_x  : $("#page_pos_x").val(),
        page_pos_y  : $("#page_pos_y").val(),
    }


    const pen_tmp = {
        x : $("#pen_x").val(),
        y : $("#pen_y").val(),
        motorA : $("#pen_motorA").html(),
        motorB : $("#pen_motorB").html(),
        status : $("#pen_status").val(),
        downPosition : $("#downPosition").val(),
        upPosition: $("#upPosition").val(),
        //penWidth : $("#penWidth").val()
    };

    const home_tmp = {
        x: $("#home_pos_x").val(),
        y: $("#home_pos_y").val(),
    };

    const config_tmp = {
        mostrar_mapa_tension: $("#mostrar_mapa_tension").prop("checked"),
        mover_gondola: $("#mover_gondola").prop("checked"),
        offsetX:parseFloat($("#offsetX").val()),
        offsetY:parseFloat($("#offsetY").val()),
        scale:parseFloat($("#scale").val()),
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
    $("#pen_status").val(pen.status)
    $("#downPosition").val(pen.downPosition);
    $("#upPosition").val(pen.upPosition);

    $("#home_pos_x").val(home.x);
    $("#home_pos_y").val(home.y);

    $("#mostrar_mapa_tension").prop("checked", config.mostrar_mapa_tension);
    $("#mover_gondola").prop("checked", config.mover_gondola);

    $("#offsetY").val(parseFloat(config.offsetY));
    $("#offsetX").val(parseFloat(config.offsetX));
    $("#scale").val(parseFloat(config.scale));


    actualizar_estado_pen();
    //console.log("parametros recuperados de localStore");
}


function draw_machine() {



    // Cambiar dimensiones del canvas
    canvas.width = machine_specs.machineSizeMm_x; // Ancho en pixeles    
    canvas.height = machine_specs.machineSizeMm_y; // Alto en pixeles

    aplicar_offset_scale();

    // muestra el mapa de tension si esta habilitado
    if (config.mostrar_mapa_tension) {        
        draw_image("vPlotterMap.png");      
    }



    if (canvas.getContext) {
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
        circle(pen.x, pen.y, 3, "#000000", "#ffffff");

        //dibujo los motores
        rectangle(-20,-20,20,20,'#000000',"#000000");
        rectangle(machine_specs.machineSizeMm_x,-20,20,20,'#000000',"#000000");


        // dibujo los hilos de los motores a la gondola
        line(0, 0, pen.x, pen.y);
        line(machine_specs.machineSizeMm_x, 0, pen.x, pen.y);
      
    
        ctx.restore();
    }
}

function draw_queue() {
    //dibujo lo que esta guardado en la cola

    lista = tareas.listarTareas();
    //  console.log(lista);

    pen_is_down = true;

    //dibujo las tareas pendientes
    ctx.strokeStyle ="#aaa";
    ctx.beginPath();
    for (const tarea of lista) {
        gcode = tarea.nombre.split(',');
        if (gcode[0]=='C14'){ // pen up
            pen_is_down = false;
        }else  if (gcode[0]=='C13'){ // pen down
            pen_is_down = true;
        }

        // calculo las coordenadas cartesianas del punto
        mmPerStep = machine_specs.mmPerRev / multiplier(machine_specs.stepsPerRev);
        cartesianX = getCartesianX(gcode[1],gcode[2]);
        x = Math.round(cartesianX*mmPerStep);
        y = Math.round(getCartesianY(cartesianX,gcode[1])*mmPerStep);
        //  circle(x,y,2);

        if (pen_is_down) {
            ctx.lineTo(x,y);
        } else {
            ctx.moveTo(x,y);
        }

        //  console.log(tarea.nombre);
    }
    ctx.closePath();
    ctx.stroke();


    // dibujo las tareas terminadas
    ctx.strokeStyle ="#000";
    ctx.beginPath();
    for (const tarea of tareas_completadas  ) {
        gcode = tarea.split(',');
        if (gcode[0]=='C14'){ // pen up
            pen_is_down = false;
        }else  if (gcode[0]=='C13'){ // pen down
            pen_is_down = true;
        }

        // calculo las coordenadas cartesianas del punto
        mmPerStep = machine_specs.mmPerRev / multiplier(machine_specs.stepsPerRev);
        cartesianX = getCartesianX(gcode[1],gcode[2]);
        x = Math.round(cartesianX*mmPerStep);
        y = Math.round(getCartesianY(cartesianX,gcode[1])*mmPerStep);
        //  circle(x,y,2);

        if (pen_is_down) {
            ctx.lineTo(x, y);
        } else {
            ctx.moveTo(x, y);
        }        
    }

  //  ctx.closePath();
    ctx.stroke();


};


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

        draw_machine();
        guardar_parametros();
    }
}



function actualizar_estado_pen(){    
    $("#pen_status").val(pen.status);
    if ( pen.status==1){
        $("#cambiar_status_pen").html("Bajar");
    }else{
        $("#cambiar_status_pen").html("Subir");
    }   
    guardar_parametros();
}

function cambiar_status_pen() {
    if ( pen.status == 0){ // esta bajado, lo subo
        encolar_tarea("C14," + pen.upPosition + ",END");
    }else{ // esta subido, lo bajo
        encolar_tarea("C13," + pen.downPosition + ",END");
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
    draw_machine();
}

async function ejecutar_comando(parametros, funcionExito) {
    /*parametros va en la forma
            "getPosition"                  cuando es solo el comando sin otros parametros
            "C06,15664,15664,END"          cuando es gcode
            "move&motorA=55&motorB=-66"    cuando es un comando y lleva varios parametros  */

    const ini = new Date();

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
                funcionExito=actualizar_estado_pen;    
                pen.status = 0;
            }else if ( params[0]=='C14'){ // up
                data= {"result_ok":true};    
                pen.status = 1;
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

    try {
        const url = `/control?command=` + parametros;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();

            // logueo llamado y respuesta
            const fin = new Date();
            $("#log").val( formatTime(ini)+ " "+parametros + "\n" + formatTime(ini)+ + " "+JSON.stringify(data).replaceAll(",", ", ") +"\n" +$("#log").val());

            //actualizo la lista de tareas
            $("#tareas").val(tareas.mostrar());
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

// Event listener para el input de archivo
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
                                if (tarea.includes(",END")) {
                                    encolar_tarea(tarea, update_pen_position);
                                } else {
                                    console.log(
                                        " LA TAREA " +
                                            tarea +
                                            " NO PARECE SER GCODE!!"
                                    );
                                }
                            }
                            $("#estado_cola").text(
                                tareas.obtenerEstado().estado
                            );
                            draw_queue();
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
    });

function limpiar_cola() {
    tareas.limpiar();
    tareas_completadas = [];
    draw_machine();
    $("#tareas").val(tareas.mostrar());
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
    motorA = calc_motorA(home.x, home.y);
    motorB = calc_motorB(home.x, home.y);
    encolar_tarea("C01," + motorA + "," + motorB + ",END", update_pen_position);
}

function centrar_pagina_x() {
    page.page_pos_x = machine_specs.machineSizeMm_x / 2 - page.page_width / 2;
    $("#page_pos_x").val(page.page_pos_x);
    guardar_parametros();
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

    $("#estado_cola").text(tareas.obtenerEstado().estado);

    // busco los parametros de la maquina y llamo a la funcion de mostrar maquina
    recuperar_parametros();
    draw_machine();


// Event listener para el input de archivo
document.getElementById('svgInput').addEventListener('change', function() {
    if (this.files.length > 0) {
        processSVG();
    }
});

      
}


// Función para procesar el SVG
async function processSVG() {
    const fileInput = document.getElementById('svgInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecciona un archivo SVG');
        return;
    }

    try {
        const svgContent = await readFileAsText(file);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        // Verificar si el parsing fue exitoso
        if (svgDoc.querySelector('parsererror')) {
            throw new Error('Error al parsear el SVG');
        }

        const svgElement = svgDoc.querySelector('svg');
        
        // Reiniciar la estructura de datos
        svgData = {
            filename: file.name,
            paths: [],
            viewBox: svgElement.getAttribute('viewBox') || '',
            dimensions: {
                width: svgElement.getAttribute('width') || '',
                height: svgElement.getAttribute('height') || ''
            },
            metadata: {
                created: new Date().toISOString(),
                fileSize: file.size,
                fileType: file.type
            }
        };

        // Extraer todos los paths
        const paths = svgElement.querySelectorAll('path');
        
        if (paths.length === 0) {
            throw new Error('No se encontraron elementos path en el SVG');
        }

        paths.forEach((path, index) => {
            const pathData = {
                id: path.getAttribute('id') || `path-${index}`,
                d: path.getAttribute('d') || '',
                fill: path.getAttribute('fill') || 'none',
                stroke: path.getAttribute('stroke') || 'none',
                strokeWidth: path.getAttribute('stroke-width') || '1',
                opacity: path.getAttribute('opacity') || '1',
                transform: path.getAttribute('transform') || ''
            };
            
            svgData.paths.push(pathData);
        });

        // Mostrar vista previa
        showPreview(svgContent);
        
        // Mostrar datos en pantalla
        displayPathData();
        
        console.log('Datos del SVG:', svgData);
        
    } catch (error) {
        console.error('Error procesando el SVG:', error);
        alert('Error al procesar el SVG: ' + error.message);
    }
}


// Función para mostrar vista previa
function showPreview(svgContent) {
    const previewDiv = document.getElementById('svgPreview');
    previewDiv.innerHTML = svgContent;
    
    // Ajustar el tamaño para la vista previa
    const svg = previewDiv.querySelector('svg');
    if (svg) {
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '200px';
    }
}




// Función para mostrar los datos del path
function displayPathData() {
    const pathDataDiv = document.getElementById('pathData');
    
    if (svgData.paths.length > 0) {
        const mainPath = svgData.paths[0]; // Tomamos el primer path
        pathDataDiv.textContent = JSON.stringify(mainPath, null, 2);
    } else {
        pathDataDiv.textContent = 'No se encontraron paths';
    }
}



// Función para leer el archivo como texto
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}




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
    config.offsetX -= (mouseX - config.offsetX) * (zoom - 1);
    config.offsetY -= (mouseY - config.offsetY) * (zoom - 1);
    config.scale *= zoom;
    
      $("#offsetY").val(config.offsetY);
      $("#offsetX").val(config.offsetX);
      $("#scale").val(config.scale);

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
        config.offsetX += (e.clientX - lastX) / config.scale;
        config.offsetY += (e.clientY - lastY) / config.scale;
        lastX = e.clientX;
        lastY = e.clientY;  
                

      $("#offsetY").val(config.offsetY);
      $("#offsetX").val(config.offsetX);
      $("#scale").val(config.scale);

        draw_machine();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;   
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});