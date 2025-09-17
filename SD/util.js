$("#version").append(".u1"); // agrego la version de util.js

//////////////////////////////////////////////// COLA ////////////////////////////////////////////////


class ColaTareasAuto {
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
        $("#estado_cola").text(tareas.obtenerEstado().estado); 
        if (this.pausado || this.procesando || this.tareas.length === 0) return;

        this.procesando = true;
        const { tarea, nombre, id } = this.tareas.shift();

        try {
            $("#estado_cola").text(`🚀 Ejecutando: ${nombre}`);
            const resultado = await tarea();
            $("#estado_cola").text(`✅ Completado: ${nombre}`, resultado);
        } catch (error) {
            $("#estado_cola").text(`❌ Error en: ${nombre}`, error);
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


//////////////////////////////////////////////// DRAW ////////////////////////////////////////////////



function aplicar_offset_scale(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(config.offsetX, config.offsetY);
    ctx.scale(config.scale,config.scale);    
}

function draw_image(src){

    const img = new Image();
    img.onload = function () {
        // Establecer transparencia global
        ctx.globalAlpha = 0.1;
        // Calcular dimensiones manteniendo la proporcion
        const aspectRatio = img.height / (img.width + 30);
        const newWidth = canvas.width + 30;
        const newHeight = (canvas.width + 30) * aspectRatio;
        // Dibujar la imagen manteniendo proporcion
        ctx.drawImage(img, -15, -15, newWidth, newHeight);
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