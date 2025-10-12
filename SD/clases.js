//////////////////////////////////////////////// CLASES DIBUJO ////////////////////////////////////////////////

// Clase Vértice
class Vertice {
    constructor(x, y) {
        this.id = `v_${Math.random().toString(36).substr(2, 9)}`;
        this.x = x;
        this.y = y;     
        this.elegido = false;        
    }

    distanciaA(vertice) {
        return Math.sqrt((this.x - vertice.x) ** 2 + (this.y - vertice.y) ** 2);
    }        
}

// Clase Línea
class Linea {
    constructor(id = null, color = null) {
        this.id = id || `l_${Math.random().toString(36).substr(2, 9)}`;
        this.color = color || this.generarColorAleatorio();
        this.vertices = [];
    }    
    
    generarColorAleatorio() {
        const colores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                        '#ff7700', '#7700ff', '#00ff77', '#ff0077', '#77ff00', '#0077ff'];
        
        return colores[Math.floor(Math.random() * colores.length)];
    }
    
    agregarVertice(x, y,previo = false) {
        const vertice = new Vertice(x, y);
        if (previo){                    
            this.vertices.unshift(vertice);                    
        }else {
            this.vertices.push(vertice);
        }
        return vertice;
    }
    
    eliminarVertice(indice) {
        if (indice >= 0 && indice < this.vertices.length) {
            return this.vertices.splice(indice, 1)[0];
        }
        return null;
    }
/*
    reducirVerticesLinea(ciclos){
        this.lineas.forEach((linea) => {   
            let termine =false;
            
            let angulo_ant =360;
            for (let i=0;y<linea.vertices.length-2; y = y+2){
                // para cada tres vertices calculo el angulo
                let angulo = this.calculateAngle(linea.vertices[i],linea.vertices[i+1]);

                let diff = this.angleDifference(angulo_ant, angulo);
              //  console.log(i + ' '+ diff)
            }            
        });
    }
  */  
    obtenerSegmentos() {
        const segmentos = [];
        
        if (this.vertices.length < 2) return segmentos;
        
        for (let i = 0; i < this.vertices.length - 1; i++) {
            segmentos.push({
                inicio: this.vertices[i],
                fin: this.vertices[i + 1]
            });
        }                                     
        return segmentos;
    }
                                
    obtenerVerticeCercano(x, y, radio = 10) {
        for (let i = 0; i < this.vertices.length; i++) {
            const vertice = this.vertices[i];
            const distancia = Math.sqrt((vertice.x - x) ** 2 + (vertice.y - y) ** 2);
            if (distancia <= radio) {
                return { vertice, indice: i };
            }
        }
        return null;
    }
    
    mover(dx, dy) {
        this.vertices.forEach(vertice => {
            vertice.mover(dx, dy);
        });
    }
    
    invertirVertices() {
        //this.vertices.reverse();  // esta linea no anda, no entiendo por que
        const invertido = this.vertices.slice().reverse(); //
        this.vertices = invertido;
    }

    concatenarLinea(otraLinea) {
        this.vertices = this.vertices.concat(otraLinea.vertices);        
    }
    
    escalar(factor, centroX = null, centroY = null) {
        if (centroX === null || centroY === null) {
            // Calcular centro si no se proporciona
            const centro = this.obtenerCentro();
            centroX = centro.x;
            centroY = centro.y;
        }
        
        this.vertices.forEach(vertice => {
            vertice.x = centroX + (vertice.x - centroX) * factor;
            vertice.y = centroY + (vertice.y - centroY) * factor;
        });
    }
    
    obtenerCentro() {
        if (this.vertices.length === 0) return { x: 0, y: 0 };
        
        const sumX = this.vertices.reduce((sum, v) => sum + v.x, 0);
        const sumY = this.vertices.reduce((sum, v) => sum + v.y, 0);
        
        return {
            x: sumX / this.vertices.length,
            y: sumY / this.vertices.length
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            color: this.color,
            vertices: this.vertices.map(v => ({ x: v.x, y: v.y}))
        };
    }
}

// Clase Dibujo
class Dibujo {
    constructor() {
        // lineas
        this.lineas = [];
        this.contadorLineas = 0;

        // lineas guardadas para poder reconstruir si cambia la cantidad de vertices eliminados
        this.lineas_originales = [];
        this.contadorLineasOriginales = 0;

        // estadisticas de seleccion
        this.vertices_elegidos = 0;

        // estadisticas de dibujo
        this.min_x = 0;
        this.max_x = 0;
        this.min_y = 0;
        this.max_y = 0;
        this.width = 0;
        this.height = 0;
    }

    crearLinea(color = null) {
        const nuevaLinea = new Linea(this.contadorLineas, color);
        this.lineas.push(nuevaLinea);
        this.contadorLineas++;                
        return nuevaLinea;
    }

    copiarLinea(linea){
        //creo linea nueva 
        const nuevaLinea = new Linea(linea.id, linea.color);         
        //copio los vertices
        linea.vertices.forEach(ver => {
            nuevaLinea.agregarVertice(ver.x,ver.y);
        });
        return nuevaLinea;
    }

    eliminarLinea(id) {
        const indice = this.lineas.findIndex(linea => linea.id === id);
        if (indice !== -1) {
            const lineaEliminada = this.lineas.splice(indice, 1)[0];
            this.contadorLineas--;                    
            return lineaEliminada;
        }
        return null;
    }

    obtenerLinea(id) {
        return this.lineas.find(linea => linea.id === id);
    }
                
    agregarVerticeALinea(idLinea, x, y) {
        const linea = this.obtenerLinea(idLinea);
        if (linea) {
            const vertice = linea.agregarVertice(x, y);
            return vertice;
        }
        return null;
    }
    
    obtenerInfoLineas() {
        return this.lineas.map(linea => linea.toJSON());
    }
    
    limpiar() {
        this.lineas = [];
        this.contadorLineas=0;
    }
    
    cantidadLineas(){
        return this.contadorLineas;
    }

    cantidadVertices(){
        let cant =0;
        this.lineas.forEach(function(linea) {   
            cant += linea.vertices.length;
        });
        return cant;
    }

    backupLineas(){
        this.lineas_originales = [];
        this.contadorLineasOriginales = 0;
        this.lineas.forEach(linea => {
            //creo linea nueva 
            const nuevaLinea = new Linea(linea.id, linea.color);
            this.lineas_originales.push(nuevaLinea);
            this.contadorLineasOriginales++; 
            //copio los vertices
            linea.vertices.forEach(ver => {
                nuevaLinea.agregarVertice(ver.x,ver.y);
            });
        });
    };

    restoreLineas(){
        this.lineas = [];
        this.contadorLineas = 0;
        this.lineas_originales.forEach(linea => {
            //creo linea nueva 
            const nuevaLinea = new Linea(linea.id, linea.color);
            this.lineas.push(nuevaLinea);
            this.contadorLineas++; 
            //copio los vertices
            linea.vertices.forEach(ver => {
                nuevaLinea.agregarVertice(ver.x,ver.y);
            });
        });
    };

    // Calcular el ángulo de una línea en radianes
    calculateAngle(v1,v2) {
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        return Math.atan2(dy, dx);
    }

    // Calcular la diferencia entre dos ángulos (en grados)
    angleDifference(angle1, angle2) {
        let diff = Math.abs(angle1 - angle2) % (2 * Math.PI);
        diff = diff > Math.PI ? (2 * Math.PI - diff) : diff;
        return Math.abs(diff * 180 / Math.PI); // Convertir a grados
    } 


    rotarVertice(vertice, anguloGrados, centroX, centroY) {
        const anguloRadianes = anguloGrados * Math.PI / 180;
        const cos = Math.cos(anguloRadianes);
        const sin = Math.sin(anguloRadianes);
        
        // Trasladar punto al sistema de coordenadas del centro de rotación
        const xRelativo = vertice.x - centroX;
        const yRelativo = vertice.y - centroY;
        
        // Aplicar rotación
        const xRotado = xRelativo * cos - yRelativo * sin;
        const yRotado = xRelativo * sin + yRelativo * cos;
        
        // Trasladar de vuelta al sistema original
        vertice.x= Math.round((xRotado + centroX) * 10) / 10; // Redondear a 1 decimal
        vertice.y= Math.round((yRotado + centroY) * 10) / 10;       
    }

    rotarVertices(angulo_rotacion, centroX, centroY){

        // guardo una copia del dibujo por que la rotacion es destructiva
        if (this.contadorLineasOriginales == 0){             
            this.backupLineas();
        }else{
            //recupero la copia de las lineas guardadas
            this.restoreLineas();
        }

        this.lineas.forEach((linea) => {                                           
            for (let i = 0; i < linea.vertices.length; i++){   
                this.rotarVertice(linea.vertices[i], angulo_rotacion, centroX, centroY);
            };
        });

    }

    reducirVertices(eliminar){

         // guardo una copia del dibujo por que la reduccion es destructiva
        if (this.contadorLineasOriginales == 0){             
            this.backupLineas();
        }else{
            //recupero la copia de las lineas guardadas
            this.restoreLineas();
        }
               
        this.lineas.forEach((linea) => {   
            let diferencias=[];
            let angulo_ant = this.calculateAngle(linea.vertices[0],linea.vertices[1]);
            for (let i=1;i<linea.vertices.length-1; i++){

                // para cada par de vertices calculo el angulo
                let angulo = this.calculateAngle(linea.vertices[i],linea.vertices[i+1]);

                let diff = this.angleDifference(angulo_ant, angulo);
                //guardo el angulo en un arreglo
                diferencias.push({indice:i, angulo: diff});
                angulo_ant=angulo;
            }                            

            // ordeno los vertices por angulos en Orden ascendente
            diferencias.sort((a, b) => a.angulo - b.angulo);

            //calculo que cantidad de vertices voy a borrar
            let cantidad = 0;
            if ( linea.vertices.length > 2){
                cantidad = eliminar * diferencias.length/100;
            }

            // elimino los vertices que tiene menor angulo, si la linea tiene menos de 10 vertices no elimino nada                   
            for (let i=0;i<cantidad;i++){
                linea.eliminarVertice(diferencias[i].indice);                        
            }        
        });
    }   
    
    unificarLineas(cercaniaMinima = 5){ 
        // busco cercania entre los vertices de iniciales y finales de una linea y los de otra,
        // si encuentro dos que estan cerca uno las lineas

        if (this.lineas.length == 0){
            eco('no hay lineas que unificar!');
            return;
        }

        let termine =false;
        let i = 0;
        while (!termine){
            const linea1 = this.lineas[i];

            // busco los vertices inicial y final de la linea 1
            const iniL1 = linea1.vertices[0];
            const i_finL1 =linea1.vertices.length-1;
            const finL1 = linea1.vertices[i_finL1];

            let termine2 = false;
            let j = i+1;
            let siguiente_linea = true;
            while (!termine2 && j< this.lineas.length ){
                const linea2 = this.lineas[j];

                // busco los vertices inicial y final de la linea 2
                const iniL2 = linea2.vertices[0];
                const i_finL2 =linea2.vertices.length-1;
                const finL2 = linea2.vertices[i_finL2];

                if (iniL1.distanciaA(iniL2)<=cercaniaMinima){
                    //       console.log('unir ini linea '+linea1.id + ' y ini linea ' + linea2.id );
                    /**      *               *
                        L1:  5 4 3       L2: 6 7 8 
                        L1:  3 4 5       L2: 6 7 8
                        L1:  3 4 5 6 7 8
                    */
                    linea1.invertirVertices();
                    linea1.concatenarLinea(linea2);
                    this.eliminarLinea(linea2.id) ;              
                    termine2 = true;
                    siguiente_linea=false;
                } else if (iniL1.distanciaA(finL2)<=cercaniaMinima){
                    //      console.log('unir ini linea '+linea1.id + ' y fin linea ' + linea2.id );
                    /**      *                   *  
                        L1:  5 4 3       L2: 8 7 6
                        L1:  3 4 5       L2: 6 7 8 
                        L1:  3 4 5 6 7 8
                    */
                    linea1.invertirVertices();
                    linea2.invertirVertices();
                    linea1.concatenarLinea(linea2); 
                    this.eliminarLinea(linea2.id);               
                    termine2 = true;
                    siguiente_linea=false;
                }else if (finL1.distanciaA(iniL2)<=cercaniaMinima){
                    //  console.log('unir fin linea '+linea1.id + ' y ini linea ' + linea2.id );
                    /**          *           *  
                        L1:  3 4 5       L2: 6 7 8
                        L1:  3 4 5 6 7 8
                    */                        
                    linea1.concatenarLinea(linea2);     
                    this.eliminarLinea(linea2.id) ;
                    termine2 = true;
                    siguiente_linea=false;
                }else if (finL1.distanciaA(finL2)<=cercaniaMinima){
                    //   console.log('unir fin linea '+linea1.id + ' y fin linea ' + linea2.id );
                    /**          *               *  
                        L1:  3 4 5       L2: 8 7 6
                        L1:  3 4 5 6 7 8
                    */                           
                    linea2.invertirVertices();
                    linea1.concatenarLinea(linea2);    
                    this.eliminarLinea(linea2.id) ;      
                    termine2 = true;
                    siguiente_linea=false;
                }

                j++;
                if (j === this.lineas.length -1){
                    termine2=true;
                }
            };      
            
            // avanzo a la siguiente linea
            if (siguiente_linea){
                i++;
            }
            
            // ya recorri todas las lineas
            if (i === this.lineas.length -1){
                termine=true;
            }                  
        };
    }        

    limpiarSeleccionElementos(){ 
         this.lineas.forEach(linea => {           
            linea.vertices.forEach( vertice => {     
                             
                vertice.elegido=false;     
                             
            });             
        });
        this.vertices_elegidos = 0;
    }

    calcularBordes(){
        let minx = Infinity;
        let maxx = -Infinity;
        let miny = Infinity;
        let maxy = -Infinity;

        this.lineas.forEach(linea => {          
            linea.vertices.forEach( vertice => {       
                if (vertice.x < minx) minx = vertice.x;
                if (vertice.x > maxx) maxx = vertice.x;
                if (vertice.y < miny) miny = vertice.y;
                if (vertice.y > maxy) maxy = vertice.y;                      
            });             
        });         
                    
        this.min_x = Math.round(minx);
        this.max_x = Math.round(maxx);                    
        this.min_y = Math.round(miny);
        this.max_y = Math.round(maxy);
        this.width = Math.round(maxx - minx);
        this.height = Math.round(maxy - miny);
    }

    seleccionarElementos(box, limpiar_seleccion = true, quitar_encontrados = false){
      //  eco(box);
        let seleccionar = true;
        let sumar = 1;
        if (quitar_encontrados){
            seleccionar = false; // deseleccionando
            sumar = -1;
        }else if(limpiar_seleccion){
            this.limpiarSeleccionElementos();
        }
     
        this.lineas.forEach(linea => {
            // eco('aca busco que vertices estan dentro del cuadro');
            linea.vertices.forEach( vertice => {                  
                if (vertice.x >= box.x && vertice.x <= box.x + box.width &&
                    vertice.y >= box.y && vertice.y <= box.y + box.height){
                    vertice.elegido = seleccionar;
                    this.vertices_elegidos += sumar;                               
                }
            });   
        });
        
    }    
}

//////////////////////////////////////////////// CLASE COLA TAREAS ////////////////////////////////////////////////

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
                //console.log("La tarea "+nombre+ " ya esta cargada!");
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
        //} else {
           // console.log(`ℹ️  La cola ya está pausada`);
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
        //} else {
           // console.log(`ℹ️  La cola ya está activa`);
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

const colores = ['#000000','#ffffff','#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                 '#ff7700', '#7700ff', '#abcdef', '#ff0077', '#77ff00', '#0077ff','#17f8edff','#80c5ecff'];       
                                       
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
  //  console.log (num);

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

function string_aleatorio(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
