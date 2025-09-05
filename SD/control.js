$("#version").append(".1"); // agrego la version del js

machine_specs = [];
pen_position = [];

var canvas = document.getElementById("machine");
var ctx = canvas.getContext("2d");

function line(x, y, x1, y1) {
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function circle(x, y, radio) {
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, 2 * Math.PI);
    ctx.stroke();
}

function rectangle(x, y, ancho, alto) {
    ctx.strokeRect(x, y, ancho, alto);
}

function text(text, x, y) {
    ctx.fillText(text, x, y);
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
     */

    // Cambiar dimensiones del canvas
    canvas.width = machine_specs.machineSizeMm_x; // Ancho en pixeles
    canvas.height = machine_specs.machineSizeMm_y; // Alto en pixeles

    if (canvas.getContext) {
        // dibujo el contorno de la maquina maquina
        rectangle(0,0,machine_specs.machineSizeMm_x,machine_specs.machineSizeMm_y);
        text("Machine: " +machine_specs.machineSizeMm_x +"x" +machine_specs.machineSizeMm_y,10,10);

        //   ctx.fillRect(25, 25, 100, 100);
        //ctx.clearRect(45, 45, 60, 60);

        // dibujo la hora centrada
        rectangle(machine_specs.machineSizeMm_x / 2 - 210 / 2, 200, 210, 297);

        // dibujo la gondola y el marcador
        rectangle(machine_specs.machineSizeMm_x / 2 - 10,machine_specs.machineSizeMm_y / 2 - 10,20,30);
        circle(machine_specs.machineSizeMm_x / 2,machine_specs.machineSizeMm_y / 2,3);

        // dibujo los hilos de los motores a la gondola
        line(0,0,machine_specs.machineSizeMm_x / 2,machine_specs.machineSizeMm_y / 2);
        line(machine_specs.machineSizeMm_x,0,machine_specs.machineSizeMm_x / 2,machine_specs.machineSizeMm_y / 2);

        /*
        circle(0,0,484);
        circle(882,0,484);
*/
        circle(0, 0, pen_position.motorA);
        circle(machine_specs.machineSizeMm_x, 0, pen_position.motorB);
    }
}

function update_machine_specs(specs) {
    machine_specs = specs;
    draw_machine();
}

function update_pen_position(pen) {
    pen_position = pen;

    //{"result_ok":true,"motorA":15664,"motorB":15664}

    draw_machine();
}

function move(motor) {
    let pasosA = $("input[type='radio'][name='pasosA']:checked").val();
    let pasosB = $("input[type='radio'][name='pasosB']:checked").val();

    // console.log("speedA:" + speedA+ "\t pasosA:" + stepsA+  "\t speedB:" +speedB+ "\t pasosB:" + stepsB);
    // $('#log').val("speedA:" + speedA+ "\t pasosA:" + stepsA+ "\t speedB:" +speedB+ "\t pasosB:" + stepsB +"\n"+ $('#log').val());

    parametros = {
        command: "move",
        stepsA: pasosA,
        stepsB: pasosB,
    };

    ejecutar_comando(parametros, update_pen_position);

    /*
    $.ajax({
        url: "/control",
        data: params,
        type: "GET",
        timeout: 10,
        async: false,
        cache: false,
        global: true,
        processData: true,
        ifModified: false,
        contentType: "application/x-www-form-urlencoded",
        dataType: "json",
        error: function (objeto, quepaso, otroobj) {
            console.log("No se pudo completar la operacion: " + quepaso);
            $("#errores").val(
                "No se pudo completar la operacion: " +
                    quepaso +
                    "\n" +
                    $("#errores").val()
            );
        },
        success: function (datos) {
            if (datos.result_ok) {
                $("#log").val(
                    JSON.stringify(params) +
                        " " +
                        JSON.stringify(datos) +
                        "\n" +
                        $("#log").val()
                );
            } else {
                alert(datos.desc_error);
            }
        },
    });*/
}

async function ejecutar_comando(parametros, funcionExito) {
    /*parametros va en la forma 
            "getPosition"                         cuando es solo el comando sin otros parametros
            {command:move, motorA:55, motorB:-66} cuando es un comando y lleva varios parametros 
    */
    let params;
    if (typeof parametros === "string" || parametros instanceof String) {
        params = new URLSearchParams();
        params.append("command", parametros);
    } else {
        params = parametros;
    }

    try {
        const url = `/control?${params.toString()}`;
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();

            // Llama a la función de éxito si existe
            if (funcionExito && typeof funcionExito === "function") {
                $("#log").val(
                    comando +
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

function init() {
    console.log("location href: " + location.href);
    console.log("window location:" + window.location);

    if ($("#sdcard_present") != null) {
        console.log("cargo edit");
        $("#sdcard_present").html(
            '<a href="edit.html" target="_blank">Editor de SD</a>'
        );
    }

    // mostrarCamara();

    // busco los parametros de la maquina y si los recibo ok llamo a la funcion de mostrar maquina
    ejecutar_comando("getMachineSpecs", update_machine_specs);

    ejecutar_comando("getPosition", update_pen_position);
}
