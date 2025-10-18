class ClaseReduccionVertices {

    constructor(lineas,metodo = 0){
        this.lineas = lineas;
        this.metodo = metodo; // 0 = Douglas Peucher, 1 = por porcentaje
    }

    reducirVertices(porcentaje = 20){
        if (this.metodo == 0){
            //convierto el porcentaje en una tolerencia entre 1 y 10
            const tolerancia = porcentaje / 10;
            return this.reducirVerticesDouglasPeucker(this.lineas, tolerancia);
        }else{
            return this.reducirPorPorcentaje(this.lineas, porcentaje);
        }      
    }

    // Algoritmo Douglas-Peucker
    reducirVerticesDouglasPeucker(arregloFiguras, tolerancia = 1.0) {
        return arregloFiguras.map(figura => {
            return {
                ...figura,
                vertices: this.simplificarLinea(figura.vertices, tolerancia)
            };
        });
    }

    simplificarLinea(puntos, tolerancia) {
        if (puntos.length <= 2) return puntos;
        
        let maxDistancia = 0;
        let indiceMax = 0;
        const primerPunto = puntos[0];
        const ultimoPunto = puntos[puntos.length - 1];
        
        for (let i = 1; i < puntos.length - 1; i++) {
            const distancia = this.distanciaPuntoALinea(puntos[i], primerPunto, ultimoPunto);
            if (distancia > maxDistancia) {
                maxDistancia = distancia;
                indiceMax = i;
            }
        }
        
        if (maxDistancia > tolerancia) {
            const primeraMitad = this.simplificarLinea(puntos.slice(0, indiceMax + 1), tolerancia);
            const segundaMitad = this.simplificarLinea(puntos.slice(indiceMax), tolerancia);
            return primeraMitad.slice(0, -1).concat(segundaMitad);
        } else {
            return [primerPunto, ultimoPunto];
        }
    }

    distanciaPuntoALinea(punto, lineaInicio, lineaFin) {
        const numerador = Math.abs(
            (lineaFin.y - lineaInicio.y) * punto.x -
            (lineaFin.x - lineaInicio.x) * punto.y +
            lineaFin.x * lineaInicio.y -
            lineaFin.y * lineaInicio.x
        );
        
        const denominador = Math.sqrt(
            Math.pow(lineaFin.y - lineaInicio.y, 2) +
            Math.pow(lineaFin.x - lineaInicio.x, 2)
        );
        
        return denominador === 0 ? 0 : numerador / denominador;
    }

    ////////////////////////////////  POR PORCENTAJE ////////////////////////////////
    
    // Algoritmo de reducción por porcentaje
     reducirPorPorcentaje(arregloFiguras, porcentajeReduccion = 50) {
        return arregloFiguras.map(figura => {
            const verticesOriginales = figura.vertices;
            const cantidadFinal = Math.max(
                2,
                Math.floor(verticesOriginales.length * (1 - porcentajeReduccion / 100))
            );
            
            return {
                ...figura,
                vertices: this.muestrearPuntos(verticesOriginales, cantidadFinal)
            };
        });
    }

    muestrearPuntos(puntos, cantidadDeseada) {
        if (puntos.length <= cantidadDeseada) return puntos;
        
        const resultado = [];
        const paso = (puntos.length - 1) / (cantidadDeseada - 1);
        
        for (let i = 0; i < cantidadDeseada; i++) {
            const indice = Math.min(Math.floor(i * paso), puntos.length - 1);
            resultado.push(puntos[indice]);
        }
        
        return resultado;
    }


}



//////////////////////////////////////////////// CLASE DETECCION DE BORDES IA ////////////////////////////////////////////////

// recibe una matriz binaria de lineas blancas sobre negro y retorna un dibujo con las lineas vectorizadas
class ImprovedLineExtractor {
    constructor(placeholder, funcion_retorno) {
        // 8 direcciones de vecindad
        this.directions = [
            [0, 1],   // Abajo
            [1, 1],   // Abajo-derecha
            [1, 0],   // Derecha
            [1, -1],  // Arriba-derecha
            [0, -1],  // Arriba
            [-1, -1], // Arriba-izquierda
            [-1, 0],  // Izquierda
            [-1, 1]   // Abajo-izquierda
        ];

        this.gapValue = 2;
        this.minLineLength = 10;

        this.binaryEdges = false;
        this.funcion_retorno = funcion_retorno;

        this.agregar_controles_captura(placeholder);
    }

    agregar_controles_captura(placeholder){
        $(placeholder).html(`       
            <div class="slider-container">
                <label for="minLineLength">Long. Mín. Línea:</label>
                <input type="range" id="minLineLength" min="5" max="100" value="10">
                <span id="minLineValue" class="value">10</span>
            </div>
            
            <div class="slider-container">
                <label for="gapSize">Tamaño Brecha:</label>
                <input type="range" id="gapSize" min="0" max="10" value="2">
                <span id="gapValue" class="value">2</span>
            </div>
            `);

        // listeners de botones y sliders
        document.getElementById('minLineLength').addEventListener('input', this.update_minLineLength.bind(this), false);
        document.getElementById('gapSize').addEventListener('input', this.update_gapSize.bind(this), false);
    }

    generar_dibujo(binaryEdges = false, ajuste_inicial_offset_scale = false){
                
        // si envio el arreglo con la imagen procesada lo reemplazo en memoria
        if (binaryEdges){
            this.binaryEdges = binaryEdges.map(innerArray => [...innerArray]);           
        }else if (!this.binaryEdges){
            // si tengo copia en memoria no puedo hacer nada  
            return;            
        }        

        // llamo a la funcion de retorno para entregarle el digujo generado
        this.funcion_retorno(
              // envio una copia por que podria modifica el arreglo   
             this.extractLinesWithGaps(this.binaryEdges.map(innerArray => [...innerArray]), this.minLineLength, this.gapValue),
             ajuste_inicial_offset_scale
        );
    }


    update_gapSize(event){   
        this.gapValue = event.target.value;
        $('#gapValue').html(this.gapValue);            
        this.generar_dibujo();    
    }

    update_minLineLength(event){   
        this.minLineLength = event.target.value;
        $('#minLineValue').html(this.minLineLength);             
        this.generar_dibujo(); 
    }

    // Método alternativo: extracción por componentes conectados con brechas
    extractLinesWithGaps(edgeMatrix, minLineLength = 10, maxGap = 2) {
        const height = edgeMatrix.length;
        const width = edgeMatrix[0].length;

        // creo el objeto dibujo
        let dibujo = new Dibujo();
        
        // Crear matriz de visitados
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        
        // Recorrer todos los píxeles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Si es un borde y no ha sido visitado
                if (edgeMatrix[y][x] === 1 && !visited[y][x]) {
                    // Encontrar todos los puntos conectados (incluyendo brechas)
                    const component = this.findConnectedComponentWithGaps(edgeMatrix, visited, x, y, maxGap);
                    
                    if (component.length >= minLineLength) {
                        // Ordenar los puntos para formar una línea continua
                        const orderedLine = this.orderPointsToLine(component);                                                           
                        
                        let color = 2;                                
                        let linea = dibujo.crearLinea(colores[color]);
                        for (let i = 0; i < orderedLine.length; i++){        
                            // si el vertices esta separado por mas de maxGap pixels es otra linea, la separo                   
                            if (i > 0 && this.distance(orderedLine[i-1],orderedLine[i]) > maxGap ){                                       
                                if (linea.vertices.length < 2){
                                    // si la linea tiene menos de dos vertices la elimino
                                    dibujo.eliminarLinea(linea.id);
                                }      
                                linea = dibujo.crearLinea(colores[color]);
                            }    
                            linea.agregarVertice(orderedLine[i][0], orderedLine[i][1]);     
                            color++;
                            if (color > colores.length){
                                color = 2;
                            }                      
                        }
                        if (linea.vertices.length < 2){
                            // si la linea tiene menos de dos vertices la elimino
                            dibujo.eliminarLinea(linea.id);
                        }                            
                    }
                }
            }
        }
        
        return dibujo;
    }

    // Encuentra componentes conectados permitiendo brechas
    findConnectedComponentWithGaps(edgeMatrix, visited, startX, startY, maxGap) {
        const component = [];
        const queue = [[startX, startY]];
        visited[startY][startX] = true;
        
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            component.push([x, y]);
            
            // Revisar los 8 vecinos, permitiendo brechas
            for (let gap = 1; gap <= maxGap + 1; gap++) {
                for (const [dx, dy] of this.directions) {
                    const nx = x + dx * gap;
                    const ny = y + dy * gap;
                    
                    // Verificar límites y si es un borde no visitado
                    if (nx >= 0 && nx < edgeMatrix[0].length && 
                        ny >= 0 && ny < edgeMatrix.length &&
                        edgeMatrix[ny][nx] === 1 && !visited[ny][nx]) {
                        
                        visited[ny][nx] = true;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
        
        return component;
    }

    // Ordena puntos para formar una línea continua
    orderPointsToLine(points) {
        if (points.length <= 1) return points;
        
        // Encontrar el punto más extremo (el que tiene la menor coordenada x)
        let startPoint = points[0];
        for (const point of points) {
            if (point[0] < startPoint[0] || (point[0] === startPoint[0] && point[1] < startPoint[1])) {
                startPoint = point;
            }
        }
        
        const ordered = [startPoint];
        const remaining = [...points];
        
        // Eliminar el punto de inicio de los restantes
        const startIndex = remaining.findIndex(p => p[0] === startPoint[0] && p[1] === startPoint[1]);
        if (startIndex !== -1) remaining.splice(startIndex, 1);
        
        let currentPoint = startPoint;
        
        // Ordenar puntos por proximidad
        while (remaining.length > 0) {
            let closestIndex = -1;
            let minDistance = Infinity;
            
            for (let i = 0; i < remaining.length; i++) {
                const dist = this.distance(currentPoint, remaining[i]);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestIndex = i;
                }
            }
            
            if (closestIndex !== -1) {
                currentPoint = remaining[closestIndex];
                ordered.push(currentPoint);
                remaining.splice(closestIndex, 1);
            } else {
                break;
            }
        }
        
        return ordered;
    }

    distance(p1, p2) {
        return Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
    }
}



//////////////////////////////////////////////// CLASE DETECCION DE BORDES MIA ////////////////////////////////////////////////


// recibe una matriz binaria de lineas blancas sobre negro y retorna un dibujo con las lineas vectorizadas
class deteccionBordes{
    constructor(placeholder,funcion_retorno) {
        this.width = 0;
        this.height = 0;
        this.grosor_value = 2;
        this.unificar_adyacentes = true;

        this.binaryEdges = false;
        this.funcion_retorno = funcion_retorno;

        this.agregar_controles_captura(placeholder);
    }

    agregar_controles_captura(placeholder){        

        $(placeholder).html(`
            <div class="slider-container">
                <label for="grosor_slider">Grosor lineas: <span id="grosor_value">2</span></label><br>
                <input type="range" id="grosor_slider" min="1" max="6"  step="1" value="2">
            </div>

            Unificar adyacentes:<input type="checkbox" id="unificar_lineas_adyacentes" checked="checked" title="Unifica lineas adyacentes"/><br>      
            `);

        // listeners de botones y sliders
        document.getElementById('grosor_slider').addEventListener('input', this.update_grosor.bind(this), false);      
        document.getElementById('unificar_lineas_adyacentes').addEventListener('change', this.update_adyacentes.bind(this), false);                    
    }

    generar_dibujo(binaryEdges = false,ajuste_inicial_offset_scale = false){          
       
        // si envio el arreglo con la imagen procesada lo reemplazo en memoria
        if (binaryEdges){
            this.binaryEdges = binaryEdges.map(innerArray => [...innerArray]);           
        }else if (!this.binaryEdges){
            // no lo mando ni lo tengo en memoria,no puedo hacer nada
            return;            
        }        

        // llamo a la funcion de retorno para entregarle el digujo generado
        this.funcion_retorno(         
            // envio una copia a detectar bordes por que modifica el arreglo   
            this.detectarBordes(this.binaryEdges.map(innerArray => [...innerArray])),
            ajuste_inicial_offset_scale
        );       
        
    }
    
    update_grosor(event){   
        this.grosor_value = event.target.value;
        $('#grosor_value').html(event.target.value);
        this.generar_dibujo();
    }

    update_adyacentes(event){        
        this.unificar_adyacentes = $("#unificar_lineas_adyacentes").prop("checked") ;
        $('#grosor_value').html(event.target.value);
        this.generar_dibujo();
    }

    // funcion que dado un punto negro parte del borde y un punto blanco adyacente sigue el borde y agrega los puntos a la linea
    seguir_linea(linea,binaryEdges,radio_pen,y,x,borde_y,borde_x,color=10,sentido_antihorario=true,unificar_adyacentes=true){      

        let i_borde=1;
        while (i_borde > -1){
            i_borde =-1;
            let i_nuevo_centro = -1;

            // genero los puntos del circulo del pen
            let circlePoints = this.getCirclePoints(binaryEdges,x, y, radio_pen,borde_x,borde_y,sentido_antihorario) ;
        
            let p = circlePoints.contorno;

            // busco el siguiente pixel blanco mas cercano al actual                                     
            for (let i = 0; i < p.length-1; i++) {                                                  
                if ((binaryEdges[p[i][1]][p[i][0]] === 0 || binaryEdges[p[i][1]][p[i][0]] === color) &&   // el borde es negro o del color buscado
                    // binaryEdges[p[i][1]][p[i][0]] != 0 && // el borde es de cualquier color
                    binaryEdges[p[i+1][1]][p[i+1][0]] === 1){ // el siguiente punto es blanco
                    // encontre el borde!!!
                    i_borde = i;
                    i_nuevo_centro = i+1;

                    // agrego el punto encontrado a la linea
                    linea.agregarVertice(p[i+1][0], p[i+1][1],!sentido_antihorario);

                    this.marcar_nodo(binaryEdges,circlePoints,unificar_adyacentes,p[i+1][1],p[i+1][0],color);  
                    /*
                    // MUESTRO EL CENTRO Y BORDE ORIGINALES...
                    binaryEdges[y][x] =2;
                    binaryEdges[borde_y][ borde_x] =3;
                    //MUESTRO EL PUNTO INICIAL DE BUSQUEDA Y EL PUNTO ESPERADO DE AVANCE
                    binaryEdges[p[0][1]][p[0][0]]=2;
                    binaryEdges[p[radio_pen][1]][p[radio_pen][0]]=20;
                    */
                    x=p[i_nuevo_centro][0];
                    y=p[i_nuevo_centro][1];
                    borde_x=p[i_borde][0];
                    borde_y=p[i_borde][1];

                    // encontre el pixel blanco, salgo del for
                    break;
                }
            };
        }
    }

    // Función para calcular la distancia entre dos puntos
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // funcion que pinta del color elegido los puntos blancos dentro del circulo que respresenta el marcador
    marcar_nodo(binaryEdges,circlePoints,unificar_adyacentes,y,x,color){ 
        
        binaryEdges[y][x] = color;   // marco el primer punto, es la semilla si no voy a marcar lineas adyacentes

        circlePoints.relleno.forEach(function(punto) {                               
            let marcar = true;
            if (!unificar_adyacentes){ // no unificar!                            
                marcar = false;

                // veo que el punto en cuestion este al lado de otro punto del color elegido     
                if (binaryEdges[punto[1]  ][punto[0]-1] === color ||  
                    binaryEdges[punto[1]+1][punto[0]-1] === color ||
                    binaryEdges[punto[1]+1][punto[0]  ] === color ||
                    binaryEdges[punto[1]+1][punto[0]+1] === color ||
                    binaryEdges[punto[1]  ][punto[0]+1] === color ||
                    binaryEdges[punto[1]-1][punto[0]+1] === color ||
                    binaryEdges[punto[1]-1][punto[0]  ] === color ||
                    binaryEdges[punto[1]-1][punto[0]-1] === color ){
                        marcar = true;
                }                      
            }

            if (marcar){                        
                binaryEdges[punto[1]][punto[0]] = color;                       
            }

        });                 
    }

    // funcion que genera la circunsferencia y el relleno del marcador 
    getCirclePoints(binaryEdges,centerX, centerY, radius, borderX=0, borderY=0, sentido_antihorario=true) {

        const tipos = [];
                                
                /*|  1 |  2 | 3 | 4 | 5 |  6 | 7  | 8 */
        tipos[1] = [-1,0,-1,1,0,1,1,1,1,0,1,-1,0,-1,-1,-1]; 
        /* 8 7 6                                                                     
        *  1 . 5                                                                     
        *  2 3 4
        */                                                       

                /*|  1 |  2 |  3 | 4 | 5 | 6 | 7 |  8 | 9  | 10 |  11 |  12 */
        tipos[2] = [-2,0,-2,1,-1,2,0,2,1,2,2,1,2,0,2,-1,1,-2,0,-2,-1,-2,-2,-1];
        /*  111009                           
        * 12      08
        * 01   .  07
        * 02      06 
        *   030405
        */        

                    /*  1    2    3    4   5   6   7   8   9   10   11   12   13    14    15    16 */              
        tipos[3] = [-3,0,-3,1,-2,2,-1,3,0,3,1,3,2,2,3,1,3,0,3,-1,2,-2,1,-3,0,-3,-1,-3,-2,-2,-3,-1]; 
        /*   141312
        *  15      11
        *16          10
        *01     .    09 
        *02          08
        *  03      07
        *    040506
        */
        
                    /*| 1 |  2 |  3 |  4 |  5 | 6 | 7 | 8 | 9 | 10| 11| 12 | 13 | 14 | 15 | 16 |  17 |  18 |  19 |  20 */              
        //  tipos[4] = [-4,0,-4,1,-3,2,-2,3,-1,4,0,4,1,4,2,3,3,2,4,1,4,0,4,-1,3,-2,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-2,-4,-1];
        /*     171615
        *    18      14
        *  19          13
        *20              12
        *01      .       11
        *02              10
        *  03          09
        *    04      08
        *      050607
        */               


                /* 1 |  2 |  3 |  4 |  5 | 6  | 7 | 8 | 9 | 10| 11| 12| 13| 14 | 15 | 16 | 17 | 18 | 19 |  20 |  21 |  22 |  23 |  24*/              
        tipos[4] = [-4,0,-4,1,-3,2,-3,3,-2,3,-1,4,0,4,1,4,2,3,3,3,3,2,4,1,4,0,4,-1,3,-2,3,-3,2,-3,1,-4,0,-4,-1,-4,-2,-3,-3,-3,-3,-2,-4,-1];
        /*     201918
        *  2221      1716
        *  23          15
        *24              14
        *01       .      13
        *02              12
        *  03          11
        *  0405      0910
        *      060708
        */               
                       

                    /* | 1 | 2  |  3 |  4 |  5 |  6 |  7 | 8 | 9 | 10| 11| 12| 13| 14| 15| 16 | 17 | 18 | 19 | 20 | 21 | 22 |  23 |  24 |  25 |  26 |  27 | 28  */    
        tipos[5] = [-5,0,-5,1,-4,2,-4,3,-3,4,-2,4,-1,5,0,5,1,5,2,4,3,4,4,3,4,2,5,1,5,0,5,-1,4,-2,3,-4,4,-3,2,-4,1,-5,0,-5,-1,-5,-2,-4,-3,-4,-4,-3,-4,-2,-5,-1];
        /*       232221
        *    2524      2019
        *  26              18
        *  27              17
        *28                  16
        *01         .        15
        *02                  14
        *  03              13
        *  04              12
        *    0506      1011
        *        070809                
        */

                /* | 1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 | 9 | 10| 11| 12| 13| 14| 15| 16| 17| 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 |  26 |  27 |  28 |  29 |  30 |  31 |  32  */    
        tipos[6] = [-6,0,-6,1,-5,2,-5,3,-4,4,-3,5,-2,5,-1,6,0,6,1,6,2,5,3,5,4,4,5,3,5,2,6,1,6,0,6,-1,5,-2,5,-3,4,-4,3,-5,2,-5,1,-6,0,-6,-1,-6,-2,-5,-3,-5,-4,-4,-5,-3,-5,-2,-6,-1];           
        /*         262524
        *      2817      2322
        *    29              21
        *  30                  20
        *  31                  19
        *32                      18 
        *01           .          17
        *02                      16
        *  03                  15
        *  04                  14
        *    05              13
        *      0607      1112
        *          080910
        */
                    
        const points = [];
        let fill =[];                                 
        let closestIndex = 0;

        //agrego el centro a los puntos de relleno (fue movido a marcar_nodo para ser usado como semilla en la buzqueda de adyacentes)
        //fill.push([centerX, centerY]);

        let a1=[]; // anillo 1 del relleno
        let a2=[]; // anillo 2 del relleno
        let a3=[]; // anillo 3 del relleno
        let a4=[]; // anillo 4 del relleno
        let a5=[]; // anillo 5 del relleno

        // busco el pixel con menos distancia al borde inicial
        let minDistance = this.distance(tipos[radius][0] + centerX, tipos[radius][1] + centerY, borderX, borderY);

        for (let i = 0; i < tipos[radius].length; i+=2) {                                                             
            
            // me aseguro de que quede dentro del canvas   
            if (tipos[radius][i] + centerX >= 0 && 
                tipos[radius][i+1] + centerY >= 0 &&
                tipos[radius][i] + centerX <this.width && 
                tipos[radius][i+1] + centerY <this.height ){ 
                
                points.push([tipos[radius][i] + centerX, tipos[radius][i+1] + centerY]);
                
                // lleno los distintos anillos para luego armar el rellono
                if (radius >= 2 && i < tipos[1].length &&
                    tipos[1][i] + centerX >= 0 && 
                    tipos[1][i+1] + centerY >= 0 &&
                    tipos[1][i] + centerX <this.width && 
                    tipos[1][i+1] + centerY <this.height &&
                    binaryEdges[tipos[1][i+1]+ centerY][tipos[1][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                        a1.push([tipos[1][i] + centerX, tipos[1][i+1] + centerY]);                                                                                 
                }
                if (radius >= 3 && i < tipos[2].length &&
                    tipos[2][i] + centerX >= 0 && 
                    tipos[2][i+1] + centerY >= 0 &&
                    tipos[2][i] + centerX <this.width && 
                    tipos[2][i+1] + centerY <this.height  &&
                    binaryEdges[tipos[2][i+1]+ centerY][tipos[2][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                        a2.push([tipos[2][i] + centerX, tipos[2][i+1] + centerY]);                                                                          
                }
                if (radius >= 4 && i < tipos[3].length &&
                    tipos[3][i] + centerX >= 0 && 
                    tipos[3][i+1] + centerY >= 0 &&
                    tipos[3][i] + centerX <this.width && 
                    tipos[3][i+1] + centerY <this.height &&
                    binaryEdges[tipos[3][i+1]+ centerY][tipos[3][i]+ centerX] === 1 ){ // solo elijo puntos blancos                           
                        a3.push([tipos[3][i] + centerX, tipos[3][i+1] + centerY]);                                                                                
                }
                if (radius >= 5 && i < tipos[4].length &&
                    tipos[4][i] + centerX >= 0 && 
                    tipos[4][i+1] + centerY >= 0 &&
                    tipos[4][i] + centerX <this.width && 
                    tipos[4][i+1] + centerY <this.height &&
                    binaryEdges[tipos[4][i+1]+ centerY][tipos[4][i]+ centerX] === 1 ){ // solo elijo puntos blancos
                        a4.push([tipos[4][i] + centerX, tipos[4][i+1] + centerY]);                                                                          
                }
                if (radius >= 6 && i < tipos[5].length &&
                    tipos[5][i] + centerX >= 0 && 
                    tipos[5][i+1] + centerY >= 0 &&
                    tipos[5][i] + centerX <this.width && 
                    tipos[5][i+1] + centerY <this.height &&
                    binaryEdges[tipos[5][i+1]+ centerY][tipos[5][i]+ centerX] === 1){ // solo elijo puntos blancos
                        a5.push([tipos[5][i] + centerX, tipos[5][i+1] + centerY]);                                                                                 
                }                      

                // Encontrar el punto más cercano a la referencia
                const d = this.distance( tipos[radius][i] + centerX, tipos[radius][i+1] + centerY, borderX, borderY);
                if (d < minDistance) {
                    minDistance = d;
                    closestIndex = i;
                }
            }                                           
        }

        // agrego los anillos necesarios al relleno
        fill = [].concat(fill, a1, a2,a3,a4,a5);

        // Reordenar el contorno del marcador comenzando desde el punto más cercano
        points.slice(closestIndex).concat(points.slice(0, closestIndex));

        // si el sentido es horario invierto el arreglo de puntos
        if (!sentido_antihorario){
            points.reverse();
        }

        return {contorno :points,
            relleno : fill
        };
    }
               
    detectarBordes (binaryEdges){

        this.height = binaryEdges.length;
        this.width = binaryEdges[0].length;       

        // creo el objeto dibujo
        const dibujo = new Dibujo();

        // busco la primera linea blanca que encuentre y sigo el rastro
        let color_linea =2;           

        // elimino el dibujo anterior si existia
        dibujo.limpiar();

        let linea = dibujo.crearLinea(colores[color_linea]);

        for (let y = 0; y < this.height; y++) {            
            for (let x = 0; x < this.width; x++) {                    
                if (binaryEdges[y][x+1] === 1) { // econtre el primer punto blanco
                    
                    this.seguir_linea(linea,binaryEdges, this.grosor_value, y, x+1, y, x, color_linea, true, this.unificar_adyacentes);     
                    // si se encontro solo un punto descarto la linea
                    if (linea.vertices.length === 1) {
                        dibujo.eliminarLinea(linea.id);
                        linea = dibujo.crearLinea( colores[color_linea]);
                    }

                    //sigo la linea hacia el otro lado
                    this.seguir_linea(linea,binaryEdges, this.grosor_value, y, x+1, y, x, color_linea, false, this.unificar_adyacentes);   
                    // si se encontro solo un punto descarto la linea
                    if (linea.vertices.length === 1) {
                        dibujo.eliminarLinea(linea.id);
                        linea = dibujo.crearLinea(colores[color_linea]);
                    }

                    if (linea.vertices.length >1){
                        linea = dibujo.crearLinea(colores[color_linea]);
                        color_linea ++;                               
                    }                                             
                }
                
                if (color_linea == 16){
                    color_linea = 2;
                }                
            }             
        }

        // la ultima linea creada nunca se va a llenar
        dibujo.eliminarLinea(linea.id);    
    
        return dibujo;    
    }    
}

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
        //no uso los dos primeros
        return colores[Math.floor(Math.random() * colores.length - 2) + 2];
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

        this.centroX = 0;
        this.centroY = 0;
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

    reducirVertices( eliminar) {

        // guardo una copia del dibujo por que la reduccion es destructiva
        if (this.contadorLineasOriginales == 0){             
            this.backupLineas();
        }else{
            //recupero la copia de las lineas guardadas
            this.restoreLineas();
        }           

        let clase_reduccion = new ClaseReduccionVertices(this.lineas);        
        this.lineas = clase_reduccion.reducirVertices(eliminar);
       
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

        //backupeo si no estaba hecho el backup
        if (this.contadorLineasOriginales == 0){             
            this.backupLineas();
        }

        this.lineas.forEach((linea) => {                                           
            for (let i = 0; i < linea.vertices.length; i++){   
                this.rotarVertice(linea.vertices[i], angulo_rotacion, centroX, centroY);
            };
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

        this.centroX = this.width / 2;
        this.centroY = this.height / 2;
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
    constructor(funcion_actualizar_estadisticas = false, mmPerStep = false) {
        this.tareas = [];
        this.procesando = false;
        this.pausado = false;
        

        // variables usadas para calcular estadisticas
        this.mmPerStep = mmPerStep;
        this.funcion_actualizar_estadisticas = funcion_actualizar_estadisticas;
        
        this.inicio_procesado = 0;

        this.distancia_inicial = 0;
        this.velocidad = 0;


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

        // si no hay mas tareas que procesar guardo estadisticas
        if (this.tareas.length === 0){
            this.mostrarEstadisticas(true);
        }

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

            //detengo estadisticas de procesado
            this.mostrarEstadisticas(true);
          //  this.inicio_procesado = 0;

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

            //seteo el inicio de procesado
            this.inicio_procesado = new Date();
            this.mostrarEstadisticas(true);

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

    mostrar(maximo_tareas_mostradas = 30) {
        let resultado = "";
        let cant = this.tareas.length;
        if (cant > maximo_tareas_mostradas){
            cant = maximo_tareas_mostradas;
        }
        for (let i = 0; i < cant; i++) {
            resultado += (this.tareas.length-i) + ". " + this.tareas[i].nombre + "\n";
        }
        if (this.tareas.length > maximo_tareas_mostradas){
            resultado += "se muestran las primeras "+maximo_tareas_mostradas+" tareas..."
        }
        return resultado;
    }


    ///////////////////////////////////////////// FUNCIONES ESTADISTICAS DEL TRABAJO /////////////////////////////////////////////
  
    calcularDistanciaRestante(guardar_inicial = false){
       
        let x_ant = false;
        let y_ant = false;
        let distancia = 0;

      
        this.tareas.forEach((tarea) => {
            let gcode = tarea.nombre.split(',');
            if (gcode[0] == 'C17'){
                // calculo las coordenadas cartesianas del punto
               
                let cartesianX = control.getCartesianX(gcode[1],gcode[2]);
                let x = Math.round(cartesianX * this.mmPerStep);
                let y = Math.round(control.getCartesianY(cartesianX,gcode[1]) * this.mmPerStep);
                
                if (x_ant && y_ant){
                    distancia += Math.sqrt((x - x_ant) ** 2 + (y - y_ant) ** 2);
                }
                x_ant = x;
                y_ant = y;
              //  eco(distancia);       
            }                      
        });

        //eco('distancia restante: ' + ( distancia  / 10));
        if (guardar_inicial){
            //eco('guardo inicial...');
            this.distancia_inicial = distancia / 10;
            this.mostrarEstadisticas();
        }

        return (distancia / 10);
    }

    cargarEstadisticas(){

        //localStorage.clear();

         // recupero los valores anteriores
        let estadisticas_guardadas = {segundos:1, milimetros:1};
        let estadisticas_storeage = localStorage.getItem("estadisticas");

        if (estadisticas_storeage !== null){
            estadisticas_guardadas = JSON.parse(estadisticas_storeage);
        }
        //console.log('cargar estadisticas',estadisticas_guardadas);

        this.velocidad = estadisticas_guardadas.milimetros / estadisticas_guardadas.segundos; 
      
    }


    GuardarEstadisticas(){
        // si todavia no inicio el procesamiento de tareas no hago nada
        if (!this.inicio_procesado || this.inicio_procesado == 0){
            return;
        }

        const distancia_restante = this.calcularDistanciaRestante();
        const distancia_recorrida = this.distancia_inicial - distancia_restante;
      
        let hora_actual = new Date();
        const tiempo_transcurrido = (hora_actual - this.inicio_procesado) / 1000;

        if (tiempo_transcurrido < 10){ // con menos de 10 segundos tengo muy poco tiempo apra hacer calculos
            return;
        }

        const estadisticas = {
            segundos : tiempo_transcurrido,
            milimetros : distancia_recorrida
        };

        this.velocidad = distancia_recorrida / tiempo_transcurrido; 

        if (this.velocidad < 0.01){
            this.velocidad = 0.01;
        }

       //console.log('guardo estadisticas',estadisticas);

        localStorage.setItem("estadisticas", JSON.stringify(estadisticas));
    
    }


    mostrarEstadisticas(recalcular = false){
       
        const actual = new Date();
        let inicio = '00:00:00';
        let tiempo_transcurrido = 0;
        
        if (this.inicio_procesado == 0){
            this.cargarEstadisticas();    
        }else{
            inicio = formatTime(this.inicio_procesado, false);
            tiempo_transcurrido = Math.round((actual - this.inicio_procesado) / 1000); 
        }

        // cada un minuto recalculo estadisticas
        if (recalcular || tiempo_transcurrido % 60 == 0){
            this.GuardarEstadisticas();
        }
     
        let tiempo_estimado = (this.distancia_inicial / this.velocidad) ;

        let estadisticas = {
            inicio: inicio,
            tiempo_transcurrido: FormateartiempoTranscurrido(tiempo_transcurrido),
            velocidad: (this.velocidad>99) ? this.velocidad.toFixed(0) : (this.velocidad>9) ? this.velocidad.toFixed(1) : this.velocidad.toFixed(2),
            tiempo_estimado : FormateartiempoTranscurrido(tiempo_estimado),
            tiempo_restante:  FormateartiempoTranscurrido(tiempo_estimado- tiempo_transcurrido),
            mm: this.distancia_inicial.toFixed(0)
        };
  
        // llamo a la funcion de retorno para actualizar las estadisticas en pantalla
        this.funcion_actualizar_estadisticas(         
           estadisticas
        );    
        
        // mostrar nuevamente las estadisticas cada un segundo mientras la cola esta activa y tenga cosas que procesar
        if (!this.pausado &&  this.tareas.length > 0 ) {
            setTimeout(() => this.mostrarEstadisticas(), 1000);
        }
   
    }
   
};

//////////////////////////////////////////////// FUNCIONES VARIAS ////////////////////////////////////////////////

const colores = ['#000000','#ffffff','#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                 '#ff7700', '#7700ff', '#abcdef', '#ff0077', '#77ff00', '#0077ff','#17f8edff','#80c5ecff'];       
                                       
function eco(obj){
    console.log(obj);
};

function FormateartiempoTranscurrido(seg){

    if (isNaN(seg) || seg == 0){
        return '00:00:00';
    }

     // Convertir milisegundos a segundos totales
    let segundosTotales = Math.floor(Math.abs(seg));
    
    // Calcular horas, minutos y segundos
    let horas = Math.floor(segundosTotales / 3600);
    let minutos = Math.floor((segundosTotales % 3600) / 60);
    let segundos = segundosTotales % 60; 
    let signo = '';

    if (seg<-1){
        signo ='+';
    }

    if (horas < 10){
        horas = '0' + horas;
    }
    if (minutos < 10){
        minutos = '0' + minutos;
    }
    if (segundos < 10){
        segundos = '0' + segundos;
    }
    
    return `${signo}${horas}:${minutos}:${segundos}`;

}

function formatTime(date, milisegundos = true) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    let milliseconds = '';
    if (milisegundos){
        milliseconds += '.'+date.getMilliseconds().toString().padStart(3, '0')
    };
    return `${hours}:${minutes}:${seconds}${milliseconds}`;
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
