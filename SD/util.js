

const colores = ['#000000','#ffffff','#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                 '#ff7700', '#7700ff', '#abcdef', '#ff0077', '#77ff00', '#0077ff','#17f8edff','#80c5ecff'];       
                


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


//////////////////////////////////////////////// FUNCIONES VARIAS ////////////////////////////////////////////////

function eco(obj){
    console.log(obj);
};

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
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