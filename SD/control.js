$("#version").append(".5"); // agrego la version del js

machine_specs = {};
pen = {};
page = {};
home = {};
config = {};

var canvas = document.getElementById("machine");
var ctx = canvas.getContext("2d");
//const cola_tareas = new cola();

// Ejemplo de uso con tareas reales
const tareas = new ColaTareasAuto();



/*
    machineSizeMm_x	    882	    c21
    mmPerRev            126	    c22
    stepsPerRev         4076    c23
    stepMultiplier      8       c24

    pen.x    409   c62
    pen.y    445   c63


    motorA = (C23 * SQRT(C62^2 + C63^2)) / C22
    motorB = (1/C24) * SQRT(     (C21 * (C24 * C23 / C22))^2 +      (SQRT(C62^2 + C63^2) / (C22/(C23*C24)))^2 -      (2 * C21 * (C24 * C23 / C22) * C62) / (C22/(C23*C24)) )
     
*/
function calc_motorA(x,y){
   return Math.round((machine_specs.stepsPerRev * Math.sqrt(Math.pow(x,2) + Math.pow(y,2))) / machine_specs.mmPerRev);
};

function calc_motorB(x,y){
    return Math.round((1/machine_specs.stepMultiplier) * Math.sqrt(Math.pow((machine_specs.machineSizeMm_x * (machine_specs.stepMultiplier * machine_specs.stepsPerRev / machine_specs.mmPerRev)),2) + Math.pow( (Math.sqrt( Math.pow(x,2) + Math.pow(y,2)) / (machine_specs.mmPerRev/(machine_specs.stepsPerRev*machine_specs.stepMultiplier))),2) - (2 * machine_specs.machineSizeMm_x * (machine_specs.stepMultiplier * machine_specs.stepsPerRev / machine_specs.mmPerRev) * x) / (machine_specs.mmPerRev/(machine_specs.stepsPerRev*machine_specs.stepMultiplier)) ));
};


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

    console.log("parametros guardados");
    draw_machine() ;
}

function config_default(){
    localStorage.clear();
    document.location.reload(true); // fuerza recarga de valores default cargados en los input de la pagina
}

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

    console.log("parametros recuperados de localStore");
}

function linedash(x, y, x1, y1,ancho_punto=2,acho_separacion=2,line_color='#000000') {   
    ctx.lineWidth = 0.5;
    ctx.strokeStyle =line_color; 
    ctx.fillStyle = line_color;
    ctx.setLineDash([ancho_punto,acho_separacion]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]); // reestablezco linea solida
}

function line(x, y, x1, y1,line_color='#000000',lineWidth=1) {    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle =line_color;
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function circle(x, y, radio,line_color='#000000',color=false,lineWidth=1) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle =line_color;
    if (color){
        ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, 2 * Math.PI);
    ctx.stroke();
}

function rectangle(x, y, ancho, alto,line_color='#000000',color=false,lineWidth=1) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle =line_color;
    ctx.fillStyle = line_color;
    if (color){
        ctx.fillStyle = color;
        ctx.fillRect(x, y, ancho, alto);
    }
    ctx.strokeRect(x, y, ancho, alto);
}

function text(text, x, y,line_color='#000000') {
    ctx.fillStyle = line_color;
    ctx.fillText(text, x, y);
}



function draw_machine() {
    /*
    machine_specs = {
        "machineSizeMm_x":882,
        "machineSizeMm_y":1100,
        "mmPerRev":126,
        "stepsPerRev":4076,
        "stepMultiplier":8,

        "downPosition":90,
        "upPosition":123,
        "penWidth":0.5,

        "currentMaxSpeed":1000,
        "currentAcceleration":400
    }

    pen = {
        "motorA":15664,
        "motorB":15664,
        "x":441,
        "Y":200
    }

    page = {
        page_width  : 210,
        page_height : 297,
        page_pos_x  : 335,
        page_pos_y  : 200
    }
    */


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
    }
}


function multiplier(valor){
  return valor * machine_specs.stepMultiplier;
}  

function getCartesianX(){
    stepsPerMm = multiplier(machine_specs.stepsPerRev) / machine_specs.mmPerRev;
    machineSizeStepsX= machine_specs.machineSizeMm_x * stepsPerMm;
    calcX = (Math.pow(machineSizeStepsX, 2) - Math.pow(multiplier(pen.motorB), 2) + Math.pow(multiplier(pen.motorA), 2)) / (machineSizeStepsX*2);
    return calcX;
}

function getCartesianY( cX,  motorA){
    calcY = Math.sqrt(Math.pow(multiplier(motorA),2)-Math.pow(cX,2));
    return calcY;
}

function update_pen_position(pen_position) {

    if (pen_position.result_ok){

        //{"result_ok":true,"motorA":15664,"motorB":15664}
        pen.motorA = pen_position.motorA;
        pen.motorB = pen_position.motorB;

        // calculo las coordenadas cartesianas de la gondola
        mmPerStep = machine_specs.mmPerRev / multiplier(machine_specs.stepsPerRev);
        cartesianX = getCartesianX();
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


function hora(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
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
            data= {"result_ok":true,"motorA":15664,"motorB":15664};       
        }else if (parametros=='getMachineSpecs'){
            data=  {"result_ok":true,"machineSizeMm_x":882,"machineSizeMm_y":1100,"mmPerRev":126,"stepsPerRev":4076,"stepMultiplier":8,"downPosition":90,"upPosition":123,"currentMaxSpeed":1000,"currentAcceleration":400,"penWidth":0.5} 
        }else if (parametros.includes(',END')){  // es un gcode
            data= {"result_ok":true,"motorA":15664,"motorB":15664};       
        }

        // logueo llamado y respuesta
        const fin = new Date();        
        $("#log").val(hora(ini)+ " (LOCAL) "+ parametros+ "\n" + hora(fin) + " "+ JSON.stringify(data).replaceAll(",", ", ") +"\n" + $("#log").val());

        //actualizo la lista de tareas        
        $("#tareas").val(tareas.mostrar());
        $("#estado_cola").text( tareas.obtenerEstado().estado); 
        if (funcionExito && typeof funcionExito === "function") {                 
            funcionExito(data);
        }
        return;
    }


    try {
        const url = `/control?command=`+parametros;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();

            // logueo llamado y respuesta
            const fin = new Date();
            $("#log").val( hora(ini)+ " "+parametros + "\n" + hora(ini)+ + " "+JSON.stringify(data).replaceAll(",", ", ") +"\n" +$("#log").val());

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

function limpiar_cola(){
    tareas.limpiar();
    $("#tareas").val(tareas.mostrar());
}

function encolar_tarea(tarea,funcionExito){
    //cola_tareas.encolar(tarea);
    //$("#log").val(cola_tareas.mostrar());

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
    //console.log("location href: " + location.href);
    //console.log("window location:" + window.location);

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


    $("#estado_cola").text( tareas.obtenerEstado().estado); 

    // busco los parametros de la maquina y llamo a la funcion de mostrar maquina
    recuperar_parametros();
    draw_machine() ;
   
}

