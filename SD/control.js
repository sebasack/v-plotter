$("#version").append(".1"); // agrego la version del js

machine_specs = [];
pen = [];
page = [];

var canvas = document.getElementById("machine");
var ctx = canvas.getContext("2d");

function line(x, y, x1, y1,line='#000000') {    
    ctx.strokeStyle =line;
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function circle(x, y, radio,line='#000000',color=false) {
    ctx.strokeStyle =line;
    if (color){
        ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, 2 * Math.PI);
    ctx.stroke();
}

function rectangle(x, y, ancho, alto,line='#000000',color=false) {
    ctx.strokeStyle =line;
    if (color){
        ctx.fillStyle = color;
        ctx.fillRect(x, y, ancho, alto);
    }
    ctx.strokeRect(x, y, ancho, alto);
}

function text(text, x, y,line='#000000') {
    ctx.fillStyle = line;
    ctx.fillText(text, x, y);
}

function guardar_parametros(){

    machine_specs.machineSizeMm_x = $("#machineSizeMm_x").val();
    machine_specs.machineSizeMm_y = $("#machineSizeMm_y").val();
    machine_specs.mmPerRev = $("#mmPerRev").val();
    machine_specs.stepMultiplier = $("#stepMultiplier").val();
    //machine_specs.currentMaxSpeed = $("#currentMaxSpeed").val();
    //machine_specs.currentAcceleration = $("#currentAcceleration").val();


    page.page_width = $("#page_width").val();
    page.page_height = $("#page_height").val();
    page.page_pos_x = $("#page_pos_x").val();
    page.page_pos_y = $("#page_pos_y").val();


    pen.x =  $("#x").val();
    pen.y =  $("#y").val();
    //pen.downPosition = $("#downPosition").val();
    //pen.upPosition = $("#upPosition").val();
    //pen.penWidth = $("#penWidth").val();

    localStorage.setItem('machine_specs', JSON.stringify(machine_specs));
    localStorage.setItem('pen', JSON.stringify(pen));
    localStorage.setItem('page', JSON.stringify(page));

    console.log("parametros guardados");
}


function recuperar_parametros(){


    if (localStorage.getItem('machine_specs') === null) {   
        guardar_parametros();
    }

    datosGuardados = localStorage.getItem('machine_specs')
    machine_specs =JSON.parse( datosGuardados);    

    datosGuardados = localStorage.getItem('pen')
    pen = JSON.parse( datosGuardados);    

    datosGuardados = localStorage.getItem('page')
    page = JSON.parse( datosGuardados);

   


    console.log(machine_specs);
    console.log(pen);
    console.log(page);
  
    $("#machineSizeMm_x").val(machine_specs.machineSizeMm_x);
    $("#machineSizeMm_y").val(machine_specs.machineSizeMm_y);
    $("#mmPerRev").val(machine_specs.mmPerRev);
    $("#stepMultiplier").val(machine_specs.stepMultiplier);


    $("#page_width").val(page.page_width);
    $("#page_height").val(page.page_height);
    $("#page_pos_x").val(page.page_pos_x);
    $("#page_pos_y").val(page.page_pos_y);


    $("#x").val(pen.x);
    $("#y").val(pen.y);


    console.log("parametros recuperados de localStore");
}

function draw_machine() {
    /*getMachineSpecs... 

    {"machineSizeMm_x":882,
     "machineSizeMm_y":1100,
     "mmPerRev":126,
     "stepsPerRev":4076,
     "stepMultiplier":8,
     "downPosition":90,
     "upPosition":123,
     "currentMaxSpeed":1000,
     "currentAcceleration":400,
     "penWidth":0.5
     }

     getPosition... 
     {"motorA":142208,
      "motorB":121096,
      "x":441,
      "Y":200
      }

     */

    // Cambiar dimensiones del canvas
    canvas.width = machine_specs.machineSizeMm_x; // Ancho en pixeles
    canvas.height = machine_specs.machineSizeMm_y; // Alto en pixeles

    if (canvas.getContext) {
        // dibujo el contorno de la maquina maquina
        rectangle(0,0,machine_specs.machineSizeMm_x,machine_specs.machineSizeMm_y,'#000000',"#FFE6C9");
        text("Machine: " +machine_specs.machineSizeMm_x +"x" +machine_specs.machineSizeMm_y,10,10);

        //   ctx.fillRect(25, 25, 100, 100);
        //ctx.clearRect(45, 45, 60, 60);

        //dibujo las lineas que indican el home
        line(0,  machine_specs.home_pos_y , machine_specs.machineSizeMm_x, machine_specs.home_pos_y,'#888');
        line( machine_specs.home_pos_x,0, machine_specs.home_pos_x,machine_specs.machineSizeMm_y,'#888');
        

        // dibujo la hoja centrada
        rectangle(machine_specs.machineSizeMm_x / 2 - 210 / 2, 200, 210, 297,'#000000','#ffffff');

        // dibujo la gondola y el marcador
        rectangle(pen.x -10,pen.y - 10,20,30,'#000000','#000000');
        circle(pen.x ,pen.y ,3,'#000000','#ffffff');

        // dibujo los hilos de los motores a la gondola
        line(0,0,pen.x ,pen.y);
        line(machine_specs.machineSizeMm_x,0,pen.x ,pen.y);

        /*
        circle(0,0,484);
        circle(882,0,484);
*/
      //  circle(0, 0, pen.motorA/32);
      //  circle(machine_specs.machineSizeMm_x, 0, pen.motorB/32);
    }
}

function update_machine_specs(specs) {
    machine_specs = specs;

    $("#machineSizeMm_x").val(machine_specs.machineSizeMm_x);
    $("#machineSizeMm_y").val(machine_specs.machineSizeMm_y);
    $("#mmPerRev").val(machine_specs.mmPerRev);
    $("#stepMultiplier").val(machine_specs.stepMultiplier);

    
    draw_machine();
}



function multiplier(en){
  return en * machine_specs.stepMultiplier;
}  

function getCartesianX(){
    stepsPerMm = multiplier(machine_specs.stepsPerRev) / machine_specs.mmPerRev;
    machineSizeStepsX= machine_specs.machineSizeMm_x * stepsPerMm;
    calcX = (Math.pow(machineSizeStepsX, 2) - Math.pow(pen.motorB, 2) + Math.pow(pen.motorA, 2)) / (machineSizeStepsX*2);
    return calcX;
}

function getCartesianY( cX,  aPos){
    console.log("getCartesianY "+cX+" " + aPos);
    calcY = Math.sqrt(Math.pow(aPos,2)-Math.pow(cX,2));
    console.log(calcY);
    return calcY;
}

function update_pen_position(pen_position) {

    if (pen_position.result_ok){          

        // calculo las coordenadas cartesianas de la gondola
        mmPerStep = machine_specs.mmPerRev / multiplier( machine_specs.stepsPerRev);
        cartesianX=getCartesianX();
        pen.x =cartesianX*mmPerStep;
        pen.y =getCartesianY(cartesianX,pen_position.motorA)*mmPerStep;

        //{"result_ok":true,"motorA":15664,"motorB":15664}
        console.log(pen);

        draw_machine();
    }
}

function move(motor) {
    let pasosA = $("input[type='radio'][name='pasosA']:checked").val();
    let pasosB = $("input[type='radio'][name='pasosB']:checked").val();
    
    parametros = "move&stepsA="+ pasosA + "&stepsB=" + pasosB;
    
    ejecutar_comando(parametros, update_pen_position);
}

async function ejecutar_comando(parametros, funcionExito) {
    /*parametros va en la forma 
            "getPosition"                  cuando es solo el comando sin otros parametros
            "move&motorA=55&motorB=-66"    cuando es un comando y lleva varios parametros  */   
    try {
        const url = `/control?command=`+parametros;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            // Llama a la función de éxito si existe
            if (funcionExito && typeof funcionExito === "function") {
                $("#log").val(
                    parametros +
                        "... " +
                        JSON.stringify(data) +
                        " \n\n " +
                        $("#log").val()
                );
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

function return_to_home(){
    home_pos_x = $("#home_pos_x").val();
    home_pos_y = $("#home_pos_y").val();

    console.log(home_pos_x);
    console.log(home_pos_y);
    // calculo la hipotenusa

    motorA = Math.sqrt(Math.pow(home_pos_x,2) + Math.pow(home_pos_y)) ;
    motorB = motorA;

    ejecutar_comando('C01,'+motorA+','+motorB+',END',update_pen_position);

}

function init() {
    //console.log("location href: " + location.href);
    //console.log("window location:" + window.location);

    if ($("#sdcard_present") != null) {
        console.log("cargo edit");
        $("#sdcard_present").html(
            '<a href="edit.html" target="_blank">Editor de SD</a>'
        );
    }

    // mostrarCamara();

    // busco los parametros de la maquina y si los recibo ok llamo a la funcion de mostrar maquina

    recuperar_parametros();
    //ejecutar_comando("getMachineSpecs", update_machine_specs);
    //ejecutar_comando("getPosition", update_pen_position);
}
