$("#version").append(".c7"); // agrego la version del control.js

machine_specs = {};
pen = {};
page = {};
home = {};
config = {};

/*      15,15            20,15
             17,17  18,17
             17,18  18,18
        15,20            20,20*/

draw = [[15000,15000,0],[20000,15000,1],[20000,20000,1],[15000,20000,1],[15000,15000,1],
        [17000,17000,0],[18000,17000,1],[18000,18000,1],[17000,18000,1],[17000,17000,1]];

var canvas = document.getElementById("machine");
var ctx = canvas.getContext("2d");

// creo la cola de tareas
const tareas = new ColaTareasAuto();



// Add a click event listener to the canvas
canvas.addEventListener('click', function(event) {
    // Calculate the mouse coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (config.mover_gondola){
        // calculo los datos de la nueva posicion
        pen_x = Math.round(x);
        pen_y = Math.round(y);

        motorA = calc_motorA(pen_x,pen_y);
        motorB = calc_motorB(pen_x,pen_y);

        // envio la terea, cuando termine actualiza los datos de posicion
        encolar_tarea('C01,'+motorA+','+motorB+',END',update_pen_position);
    }else{
         // guardo la nueva posicion
        pen.x = Math.round(x);
        pen.y = Math.round(y);

        $("#pen_x").val(pen.x);
        $("#pen_y").val(pen.y);

        pen.motorA = calc_motorA(pen.x,pen.y);
        pen.motorB = calc_motorB(pen.x,pen.y);

        $("#pen_motorA").html(pen.motorA);
        $("#pen_motorB").html(pen.motorB);

        guardar_parametros(); 
    }
   
});

function guardar_parametros(){

    const machine_specs_tmp = {
        machineSizeMm_x : $("#machineSizeMm_x").val(),
        machineSizeMm_y : $("#machineSizeMm_y").val(),
        mmPerRev        : $("#mmPerRev").val(),
        stepMultiplier  : $("#stepMultiplier").val(),
        stepsPerRev     : $("#stepsPerRev").val()
      //currentMaxSpeed:  $("#currentMaxSpeed").val(),
      //currentAcceleration:    $("#currentAcceleration").val()
    };

    const page_tmp = {
        page_width  : $("#page_width").val(),
        page_height : $("#page_height").val(),
        page_pos_x  : $("#page_pos_x").val(),
        page_pos_y  : $("#page_pos_y").val()
    }

    const pen_tmp = {
        x : $("#pen_x").val(),
        y : $("#pen_y").val(),
        motorA : $("#pen_motorA").html(),
        motorB : $("#pen_motorB").html(),
        downPosition : $("#downPosition").val(),
        upPosition: $("#upPosition").val()
        //penWidth : $("#penWidth").val()
    }

    const home_tmp = {
        x : $("#home_pos_x").val(),
        y : $("#home_pos_y").val()
    }

    const config_tmp = {
        mapa_tension : $("#mapa_tension").prop('checked'),
        mover_gondola : $("#mover_gondola").prop('checked')
    }

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

    localStorage.setItem('machine_specs', JSON.stringify(machine_specs_tmp));
    localStorage.setItem('pen', JSON.stringify(pen_tmp));
    localStorage.setItem('page', JSON.stringify(page_tmp));
    localStorage.setItem('home', JSON.stringify(home_tmp));
    localStorage.setItem('config', JSON.stringify(config_tmp));

    //console.log("parametros guardados");
    draw_machine() ;
};

function config_default(){
    localStorage.clear();
    document.location.reload(true); // fuerza recarga de valores default cargados en los input de la pagina
};

function recuperar_parametros(){

    //localStorage.clear();

    if (localStorage.length == 0) {           
        console.log("no hay parametros guardados, se usaran los default");        
        guardar_parametros();       
    }

    machine_specs_guardados = localStorage.getItem('machine_specs')
    machine_specs =JSON.parse( machine_specs_guardados);    

    pen_guardado = localStorage.getItem('pen')
    pen = JSON.parse(pen_guardado);    

    page_guardado = localStorage.getItem('page')
    page = JSON.parse(page_guardado);
   
    home_guardado = localStorage.getItem('home')
    home = JSON.parse(home_guardado);
   
    config_guardado = localStorage.getItem('config')
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

    $("#home_pos_x").val(home.x);
    $("#home_pos_y").val(home.y);

    $("#mapa_tension").prop('checked',config.mapa_tension);
    $("#mover_gondola").prop('checked',config.mover_gondola);

    //console.log("parametros recuperados de localStore");
};




function draw_machine() {
  

    if (config.mapa_tension){ // muestra el mapa de tension si esta habilitado
        /*
        Colors designate:
            Orange: poor resolution
            Light Blue: too little tension in one of the lines
            Dark Blue: too much tension in one of the lines (and poor resolution)
            White: drawing area candidate 
        */
        const img = new Image();
        img.onload = function() {
            // Establecer transparencia global
            ctx.globalAlpha = 0.1;
            // Calcular dimensiones manteniendo la proporcion
            const aspectRatio = img.height / (img.width+30);
            const newWidth = canvas.width+30;
            const newHeight = (canvas.width+30) * aspectRatio;
            // Dibujar la imagen manteniendo proporcion
            ctx.drawImage(img, -15, -15, newWidth, newHeight);
            // Restaurar opacidad para las lineas
            ctx.globalAlpha = 1.0;        
        };
        img.src = 'vPlotterMap.png';
    }


    // Cambiar dimensiones del canvas
    canvas.width = machine_specs.machineSizeMm_x; // Ancho en pixeles
    canvas.height = machine_specs.machineSizeMm_y; // Alto en pixeles

    if (canvas.getContext) {
        // dibujo el contorno de la maquina maquina
        rectangle(1,1,machine_specs.machineSizeMm_x-1,machine_specs.machineSizeMm_y-1,'#000000',"#FFE6C9");
        //text("Machine: " +machine_specs.machineSizeMm_x +"x" +machine_specs.machineSizeMm_y,10,10);

        // dibujo la hoja
        rectangle(page.page_pos_x, page.page_pos_y, page.page_width, page.page_height,'#000000','#ffffff');

        //dibujo las lineas que indican el home
        linedash(0, home.y, machine_specs.machineSizeMm_x, home.y,5,5,'#777');
        linedash( home.x,0, home.x,machine_specs.machineSizeMm_y,5,5,'#777');

        // dibujo la gondola y el marcador
        rectangle(pen.x -10,pen.y - 10,20,30,'#000000','#ccc');
        circle(pen.x ,pen.y ,3,'#000000','#ffffff');

        // dibujo los hilos de los motores a la gondola
        line(0,0,pen.x ,pen.y);
        line(machine_specs.machineSizeMm_x,0,pen.x ,pen.y);

        //dibujo lo que esta dentro de draw
        x0=pen.x;
        y0=pen.y;

        ctx.beginPath();
        for (const punto of draw) {
            // calculo las coordenadas cartesianas del punto
            mmPerStep = machine_specs.mmPerRev / multiplier(machine_specs.stepsPerRev);
            cartesianX = getCartesianX(punto[0],punto[1]);
            x = Math.round(cartesianX*mmPerStep);
            y = Math.round(getCartesianY(cartesianX,punto[0])*mmPerStep);
           // circle(x,y,2);
         //   text(punto[0]+','+punto[1],x,y);

            if (punto[2] ==0){
                ctx.moveTo(x,y);
            }else if(punto[2] ==1){
                ctx.lineTo(x,y);
            }
        }
        ctx.closePath();
        ctx.stroke();
/*
//ctx.save();
ctx.fillStyle = "#000";
ctx.beginPath();
ctx.moveTo(40,100);
ctx.lineTo(80,20);
ctx.lineTo(120,100);
ctx.closePath();
ctx.stroke();
//ctx.restore();
*/

    }
}


function update_pen_position(pen_position) {

    if (pen_position.result_ok){
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

function set_home(){       
    
    motorA = calc_motorA(home.x,home.y );
    motorB = calc_motorB(home.x,home.y );

    // envio la terea, cuando termine actualiza los datos de posicion
    encolar_tarea('C09,'+ motorA +','+ motorB +',END',update_pen_position);
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
        console.log("EJECUTANDO COMANDO EN MODO LOCAL, SE RETORNAN DATOS DE PRUEBA");
        data= {'result_ok':false};
        if (parametros=='getPosition'){
            //retorno valores random
            data= {"result_ok":true,"motorA":Math.floor(Math.random() *8000)+13000,"motorB":Math.floor(Math.random() *8000)+13000};       
        }else if (parametros=='getMachineSpecs'){
            data=  {"result_ok":true,"machineSizeMm_x":882,"machineSizeMm_y":1100,"mmPerRev":126,"stepsPerRev":4076,"stepMultiplier":8,"downPosition":90,"upPosition":123,"currentMaxSpeed":1000,"currentAcceleration":400,"penWidth":0.5} 
        }else if (parametros.includes(',END')){  // es gcode
            let params = parametros.split(","); // Splits by space
            if (params[0]=='C13' || params[0]=='C14'){ // es un movimiento del pen
                data= {"result_ok":true};       
            }else{
                motorA = params[1];
                motorB = params[2];
                data= {"result_ok":true,"motorA":motorA,"motorB":motorB};       
            }
            
        };

        // logueo llamado y respuesta
        const fin = new Date();        
        $("#log").val(formatTime(ini)+ " (LOCAL) "+ parametros+ "\n" + formatTime(fin) + " (LOCAL) "+ JSON.stringify(data).replaceAll(",", ", ") +"\n" + $("#log").val());

        //actualizo la lista de tareas        
        $("#tareas").val(tareas.mostrar());
        $("#estado_cola").text( tareas.obtenerEstado().estado); 
        if (funcionExito && typeof funcionExito === "function") {                 
            funcionExito(data);
        };
        return;
    }


    try {
        const url = `/control?command=`+parametros;
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


            if (selectedFile.type.startsWith('text/')) {
                const arrayBufferReader = new FileReader();
                arrayBufferReader.onload = function(arrayBufferEvent) {

                    fileData.arrayBuffer = arrayBufferEvent.target.result;                  
            
                    cola= fileData.content.split("\n");

                    tareas.pausar();               
                    $("#estado_cola").text( tareas.obtenerEstado().estado + " (IMPORTANDO)"); 

                    setTimeout(function() {
                        for (const tarea of cola) {                              
                            if (tarea.includes(',END')){                                                  
                                encolar_tarea(tarea,update_pen_position);                                          
                            }else{
                                console.log(' LA TAREA ' + tarea + ' NO PARECE SER GCODE!!');
                            }
                        }
                        $("#estado_cola").text( tareas.obtenerEstado().estado ); 
                    }, 100);

                
                //  console.log( cola);
                };
                arrayBufferReader.readAsArrayBuffer(selectedFile);      
            
            }
        };

        // Leer el archivo según su tipo
        if (selectedFile.type.startsWith('text/')) {
            reader.readAsText(selectedFile);    
        }


    }
});



function limpiar_cola(){
    tareas.limpiar();
    $("#tareas").val(tareas.mostrar());
}

function encolar_tarea(tarea,funcionExito){   
    tareas.agregarTarea(() => ejecutar_comando(tarea,funcionExito),tarea);
    $("#tareas").val(tareas.mostrar());
};

function cambiar_estado_cola(){
    if (!tareas.obtenerEstado().pausado){
        tareas.pausar();
    }else{
        tareas.reanudar();
    }    
    $("#estado_cola").text( tareas.obtenerEstado().estado); 
}

function pen_up(){
    encolar_tarea('C14,'+ pen.upPosition +',END');   
}

function pen_down(){
    encolar_tarea('C13,'+ pen.downPosition +',END');   
}

function return_to_home(){
    motorA = calc_motorA(home.x,home.y);
    motorB = calc_motorB(home.x,home.y);
    encolar_tarea('C01,'+motorA+','+motorB+',END',update_pen_position)
}

function centrar_pagina_x(){  
    page.page_pos_x = (machine_specs.machineSizeMm_x / 2) - (page.page_width / 2);    
    $("#page_pos_x").val(page.page_pos_x);
    guardar_parametros();
};

function init() {
    if ($("#sdcard_present") != null) {
        //console.log("cargo edit");
        $("#sdcard_present").html(
            '<a href="edit.html" target="_blank">Editor de SD</a>'
        );
    }

    // mostrarCamara();
  
    $('#estado_cola').on('click', function() {
        cambiar_estado_cola();
    });
    
    $("#estado_cola").text(tareas.obtenerEstado().estado); 

    // busco los parametros de la maquina y llamo a la funcion de mostrar maquina
    recuperar_parametros();
    draw_machine() ;
   
}

