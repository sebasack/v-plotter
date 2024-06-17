class JoystickController {
  // stickID: ID of HTML element (representing joystick) that will be dragged
  // maxDistance: maximum amount joystick can move in any direction
  // deadzone: joystick must move at least this amount from origin to register value change
  constructor(stickID, maxDistance, deadzone) {
    this.id = stickID;
    let stick = document.getElementById(stickID);

    // location from which drag begins, used to calculate offsets
    this.dragStart = null;

    // track touch identifier in case multiple joysticks present
    this.touchId = null;

    this.active = false;
    this.value = { x: 0, y: 0 };

    let self = this;

    function handleDown(event) {
      self.active = true;

      // all drag movements are instantaneous
      stick.style.transition = "0s";

      // touch event fired before mouse event; prevent redundant mouse event from firing
      event.preventDefault();

      if (event.changedTouches)
        self.dragStart = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };
      else self.dragStart = { x: event.clientX, y: event.clientY };

      // if this is a touch event, keep track of which one
      if (event.changedTouches)
        self.touchId = event.changedTouches[0].identifier;
    }

    function handleMove(event) {
      if (!self.active) return;

      // if this is a touch event, make sure it is the right one
      // also handle multiple simultaneous touchmove events
      let touchmoveId = null;
      if (event.changedTouches) {
        for (let i = 0; i < event.changedTouches.length; i++) {
          if (self.touchId == event.changedTouches[i].identifier) {
            touchmoveId = i;
            event.clientX = event.changedTouches[i].clientX;
            event.clientY = event.changedTouches[i].clientY;
          }
        }

        if (touchmoveId == null) return;
      }

      const xDiff = event.clientX - self.dragStart.x;
      const yDiff = event.clientY - self.dragStart.y;
      const angle = Math.atan2(yDiff, xDiff);
      const distance = Math.min(maxDistance, Math.hypot(xDiff, yDiff));
      const xPosition = distance * Math.cos(angle);
      const yPosition = distance * Math.sin(angle);

      //console.log("angle:"+ angle+ "  distance:"+ distance);
      // move stick image to new position
      stick.style.transform = `translate3d(${xPosition}px, ${yPosition}px, 0px)`;

      // deadzone adjustment
      const distance2 =
        distance < deadzone
          ? 0
          : (maxDistance / (maxDistance - deadzone)) * (distance - deadzone);
      const xPosition2 = distance2 * Math.cos(angle);
      const yPosition2 = distance2 * Math.sin(angle);
      const xPercent = parseFloat((xPosition2 / maxDistance).toFixed(4));
      const yPercent = parseFloat((yPosition2 / maxDistance).toFixed(4));

      self.value = { x: xPercent, y: yPercent };
    }

    function handleUp(event) {
      if (!self.active) return;

      // if this is a touch event, make sure it is the right one
      if (
        event.changedTouches &&
        self.touchId != event.changedTouches[0].identifier
      )
        return;

      // transition the joystick position back to center
      stick.style.transition = ".2s";
      stick.style.transform = `translate3d(0px, 0px, 0px)`;

      // reset everything
      self.value = { x: 0, y: 0 };
      self.touchId = null;
      self.active = false;
    }

    stick.addEventListener("mousedown", handleDown);
    stick.addEventListener("touchstart", handleDown);
    document.addEventListener("mousemove", handleMove, { passive: false });
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchend", handleUp);
  }
}

let x_value = 0;
let y_value = 0;
let max = 0;

function update() {
  document.getElementById("status1").innerText =
    "Joystick 1: " + JSON.stringify(joystick1.value);
  /*
    x_value=  Math.round(joystick1.value.x*1000);
    y_value=  Math.round(joystick1.value.y*1000);
  */
  x_value = joystick1.value.x;
  y_value = joystick1.value.y;
}

function loop() {
  requestAnimationFrame(loop);
  update();
}

let myVar = setInterval(myTimer, 1000);
function myTimer() {
  if (x_value != 0 || y_value != 0) {
    move_joystick(x_value, y_value);
  }
}

function move(motor) {
  let speedA = $("#velocidadA option:selected").val();
  let stepsA = $("#pasosA option:selected").val();
  let speedB = $("#velocidadB option:selected").val();
  let stepsB = $("#pasosB option:selected").val();

  if (motor == 1) {
    speedB = 0;
  }

  if (motor == 2) {
    speedA = 0;
  }

  // console.log("speedA:" + speedA+ "\t pasosA:" + stepsA+  "\t speedB:" +speedB+ "\t pasosB:" + stepsB);
  // $('#log').val("speedA:" + speedA+ "\t pasosA:" + stepsA+ "\t speedB:" +speedB+ "\t pasosB:" + stepsB +"\n"+ $('#log').val());

  params = {
    command: "move",
    speedA: speedA,
    stepsA: stepsA,
    speedB: speedB,
    stepsB: stepsB,
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
  });
}

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
          comando + "... " + JSON.stringify(datos) + " \n" + $("#log").val()
        );
      } else {
        alert(datos.desc_error);
      }
    },
  });
}

function radians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Convert from radians to degrees.
function degrees(radians) {
  return (radians * 180) / Math.PI;
}

function move_joystick(x_value, y_value) {
  let speed = Math.sqrt(Math.pow(x_value, 2) + Math.pow(y_value, 2)); //hipotenusa

  let angA = degrees(Math.acos(x_value / speed));
  let angB = 180 - angA;

  let stepsA = angA * 100;
  let stepsB = angB * 100;

  let signo = 1;
  if (y_value < 0) {
    //  -y
    signo = -1;
  }

  speed = Math.round(speed * signo * 1000);

  /* 


arr        x: -0.0   	y: -1.0   angulo:  90
izq-arr    x: -0.7 	  y: -0.7 	angulo: 135
arr-der    x:  0.7	  y: -0.7   angulo:  45
izq        x: -0.1  	y: -0.0 	angulo: 180
aba        x:  0.0	  y:  1.0	  angulo:  90 
izq-aba    x: -0.7	  y:  0.7	  angulo: 135
aba-der    x:  0.7   	y:  0.7 	angulo:  45
der        x:  1.0 	  y:  0.0	  angulo:   0


                     90(-0.0,-1.0)
       135(-0.7,-0.7)             45(0.7,-0.7)
180(-0.1,-0.0)                              0(1.0,0.0) 
      135(-0.7,0.7)               45(0.7,0.7)      
                     90(0.0,1.0)                
    */

  // modifico la velocidad del tramo mas largo para que vallan juntas y no termine antes con un motor que con otro

  //{"command":"move","speedA":1000,"stepsA":687,"speedB":1000,"stepsB":213}

  params = {
    command: "move",
    speedA: speed,
    stepsA: Math.round(angA * 5),
    speedB: speed,
    stepsB: Math.round(angB * 5),
  };

  $("#log").val(JSON.stringify(params) + "\n" + $("#log").val());

  $.ajax({
    url: "/control",
    data: params,
    type: "GET",
    timeout: 1000,
    async: true,
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
        $("#log").val(JSON.stringify(datos) + "\n" + $("#log").val());
      } else {
        alert(datos.desc_error);
      }
    },
  });
}

function cargar_pagina(url) {
  $("#b-placeholder").load(url);
}

// inicio el objeto del joystick
let joystick1 = new JoystickController("stick1", 64, 8);

window.onload = function () {
  loop();
  mostrarCamara();
  command("getPosition");
};
