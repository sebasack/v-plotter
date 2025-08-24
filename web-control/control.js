function command(comando) {
    //  $('#log').val(comando+"..." + "\n"+ $('#log').val());

    params = {
        command: comando,
    };

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
            console.log(
                "No se pudo completar la operacion " + comando + ": " + quepaso
            );
            $("#errores").val(
                "No se pudo completar la operacion " +
                    comando +
                    ": " +
                    quepaso +
                    "\n" +
                    $("#errores").val()
            );
        },
        success: function (datos) {
            if (datos.result_ok) {
                $("#log").val(
                    comando +
                        "... " +
                        JSON.stringify(datos) +
                        " \n" +
                        $("#log").val()
                );
            } else {
                alert(datos.desc_error);
            }
        },
    });
}

function cargar_pagina(url) {
    $("#b-placeholder").load(url);
}

window.onload = function () {
    console.log("onload");
    console.log("location href: " + location.href);
    console.log("window location:" + window.location);

    if (document.getElementById("sdcard_present") !== null) {
        console.log("cargo edit");
        $("#sdcard_present").html(
            '<a href="/edit/index.htm" target="_blank">Editor de SD</a>'
        );
    }

    // mostrarCamara();
    // command("getPosition");

    draw_machine(400, 600);

    console.log("onload1");
};

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

function draw_machine(ancho, alto) {
    // Cambiar dimensiones
    canvas.width = ancho; // Ancho en p�xeles
    canvas.height = alto; // Alto en p�xeles

    if (canvas.getContext) {
        //   ctx.fillRect(25, 25, 100, 100);
        //ctx.clearRect(45, 45, 60, 60);

        // dibujo los motores
        rectangle(ancho - 21, 2, 20, 20);
        rectangle(2, 2, 20, 20);

        // dibujo la hora centrada
        rectangle(ancho / 2 - 210 / 2, 100, 210, 297);

        // dibujo la gondola y el marcador
        rectangle(ancho / 2 - 10, alto / 2 - 10, 20, 30);
        circle(ancho / 2, alto / 2, 3);

        // dibujo los hilos de los motores a la gondola
        line(20, 20, ancho / 2, alto / 2);
        line(ancho - 21, 20, ancho / 2, alto / 2);
    }
}
