$("#version").append(".u04"); // agrego la version de util.js


//////////////////////////////////////////////// COLA ////////////////////////////////////////////////

class ColaTareas {
    constructor() {
        this.tareas = [];
        this.procesando = false;
        this.pausado = false;
    }

    agregarTarea(tareaAsync, nombre = "tarea") {
        const tareaObj = {
            tarea: tareaAsync,
            nombre,
            id: Date.now()
        };

        // veo si la tarea ya esta cargada y es la proxima, si esta no la recargo
        if (this.tareas.length >0){           
            if (this.tareas[this.tareas.length-1].nombre == nombre){
                console.log("La tarea "+nombre+ " ya esta cargada!");
                return false;
            }
        }
        

        this.tareas.push(tareaObj);
        //console.log(`➕ Tarea agregada: ${nombre}`);

        // Intentar procesar inmediatamente si no está pausado
        if (!this.pausado && !this.procesando) {
            this.procesarSiguiente();
        }
        
        return tareaObj.id;
    }
        
    async procesarSiguiente() {
        //muestro el estado de la cola
        $("#estado_cola").text(this.obtenerEstado().estado); 
        if (this.pausado || this.procesando || this.tareas.length === 0) return;

        this.procesando = true;
        const { tarea, nombre, id } = this.tareas.shift();

        try {
            $("#estado_cola").text(`🚀 Ejecutando: ${nombre}`);
            const resultado = await tarea();         
            $("#estado_cola").text(`✅ Completado: ${nombre}`);
        } catch (error) {
            $("#estado_cola").text(`❌ Error en: ${nombre}`);
        } finally {
            this.procesando = false;

            // Procesar siguiente tarea si hay más y no está pausado
            if (!this.pausado) {
                setTimeout(() => this.procesarSiguiente(), 0);
            }
        }
    }

    // Pausar todo el procesamiento de la cola
    pausar() {
        if (!this.pausado) {
            this.pausado = true;
            //$("#estado_cola").text(`⏸️  COLA PAUSADA. Tareas en espera: ${this.tareas.length}`);
            if (this.procesando) {
                $("#estado_cola").text(`ℹ️  La tarea actual terminará, pero no se procesarán nuevas`);
            }
        } else {
            console.log(`ℹ️  La cola ya está pausada`);
        }
        return this.pausado;
    }

    // Reanudar el procesamiento de toda la cola
    reanudar() {
        if (this.pausado) {
            this.pausado = false;
            //$("#estado_cola").text(`▶️  COLA REANUDADA. Tareas pendientes: ${this.tareas.length}`);
            
            // Reiniciar el procesamiento si hay tareas y no se está procesando
            if (this.tareas.length > 0 && !this.procesando) {
                this.procesarSiguiente();
            }
        } else {
            console.log(`ℹ️  La cola ya está activa`);
        }
        return !this.pausado;
    }

    // LIMPIAR LA COLA - Eliminar todas las tareas pendientes
    limpiar() {        
        // Limpiar todas las tareas         
        this.tareas = [];           
    }

     // Obtener el estado actual de la cola
    obtenerEstado() {
        return {
            pausado: this.pausado,
            procesando: this.procesando,
            tareasEnCola: this.tareas.length,
            estado: this.pausado ? "⏸️ COLA PAUSADA" : 
                   this.procesando ? "🚀 PROCESANDO TAREA" : 
                   this.tareas.length > 0 ? "📋 COLA CON TAREAS" : "✅ COLA VACÍA"
        };
    }

    //retorna la cantidad de elementos de la cola
    tamano() {
        return this.tareas.length;
    }

    // Obtener lista de tareas pendientes
    listarTareas() {
        return this.tareas.map((t, index) => ({
            posicion: index + 1,
            nombre: t.nombre,
            id: t.id,
            timestamp: t.timestamp
        }));
    }

    mostrar() {
        let resultado = "";
        for (let i =0; i <  this.tareas.length; i++) {
            resultado += (  this.tareas.length-i) + ". "+ this.tareas[i].nombre + (i < this.tareas.length - 1 ? "\n" : "");
        }
        return resultado;
    }
};


//////////////////////////////////////////////// CALC ////////////////////////////////////////////////

function calc_motorA(x,y){
   return Math.round((machine_specs.stepsPerRev * Math.sqrt(Math.pow(x,2) + Math.pow(y,2))) / machine_specs.mmPerRev);
};

function calc_motorB(x,y){
    return Math.round((1/machine_specs.stepMultiplier) * Math.sqrt(Math.pow((machine_specs.machineSizeMm_x * (machine_specs.stepMultiplier * machine_specs.stepsPerRev / machine_specs.mmPerRev)),2) + Math.pow( (Math.sqrt( Math.pow(x,2) + Math.pow(y,2)) / (machine_specs.mmPerRev/(machine_specs.stepsPerRev*machine_specs.stepMultiplier))),2) - (2 * machine_specs.machineSizeMm_x * (machine_specs.stepMultiplier * machine_specs.stepsPerRev / machine_specs.mmPerRev) * x) / (machine_specs.mmPerRev/(machine_specs.stepsPerRev*machine_specs.stepMultiplier)) ));
};

function multiplier(valor){
  return valor * machine_specs.stepMultiplier;
}  

function getCartesianX(motorA,motorB){
    stepsPerMm = multiplier(machine_specs.stepsPerRev) / machine_specs.mmPerRev;
    machineSizeStepsX= machine_specs.machineSizeMm_x * stepsPerMm;
    calcX = (Math.pow(machineSizeStepsX, 2) - Math.pow(multiplier(motorB), 2) + Math.pow(multiplier(motorA), 2)) / (machineSizeStepsX*2);
    return calcX;
}

function getCartesianY( cX,  motorA){
    calcY = Math.sqrt(Math.pow(multiplier(motorA),2)-Math.pow(cX,2));
    return calcY;
}

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function screenToWorld(x, y) {
    return {
        x: (x - offsetX) /scale,
        y: (y - offsetY) / scale
    };
}

function worldToScreen(x, y) {
    return {
        x: x * scale + offsetX,
        y: y * scale +offsetY
    };
}

function gcode_valido(gcode){   
    partes = gcode.split(',');
    cant = partes.length;

    if (partes[cant-1]!='END'){
        return false;
    }
    
    cod = partes[0];
    num = cod.substring(1);
    console.log (num);

    if (!cod.startsWith('C')){
        return false;
    }

    if(num === '01' || num === '02' || num === '03' || num === '05' || num === '06' || num === '08' || num === '09' || 
       num === '10' || num === '11' || num === '13' || num === '14' || num === '17' ||
       num === '24' || num === '25' || num === '26' || num === '27' || num === '29' || 
       num === '30' || num === '31' || num === '32' || num === '37' || num === '45' || 
       num === '46' || num === '47'){
        return true;
    }

    return false;
};
//////////////////////////////////////////////// DRAW ////////////////////////////////////////////////



function aplicar_offset_scale(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale,scale);    
}



function draw_image(src,x,y,width,height,aspectRatio = true,globalAlpha=1){

    const img = new Image();
    img.onload = function () {

           // Establecer transparencia global
        ctx.globalAlpha =globalAlpha;
      
        // Calcular dimensiones manteniendo la proporcion
        aspectRatio = 1;
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
        s = worldToScreen(x, y);
        ctx.drawImage(img,s.x, s.y, width*scale, (height * aspectRatio)*scale);


        // Restaurar opacidad para las lineas
        ctx.globalAlpha = 1.0;

       
    };
    img.src = src;
}

function linedash(x, y, x1, y1,ancho_punto=2,acho_separacion=2,line_color='#000000') {   
    ctx.lineWidth = 0.5;
    ctx.strokeStyle =line_color; 
    ctx.fillStyle = line_color;
    ctx.setLineDash([ancho_punto,acho_separacion]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1,y1);
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
    ctx.beginPath(); 
    ctx.arc(x, y, radio, 0, 2 * Math.PI);     
    if (color){
        ctx.fillStyle =color;
        ctx.fill(); 
    }     
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


function draw_queue() {
    //dibujo lo que esta guardado en la cola

    lista = tareas.listarTareas();
    //  console.log(lista);

    pen_is_down = true;

    ctx.lineWidth = pen.penWidth;

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


    pen_is_down = true;

    // dibujo las tareas terminadas
    ctx.strokeStyle ="#000";
    ctx.beginPath();
    for (const tarea of tareas_completadas) {
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