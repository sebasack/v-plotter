
class CannyEdgeDetector {
    constructor() {
        this.gaussianKernel = this.createGaussianKernel(5, 1.4);
    }

    detectEdges(imageData, width, height, lowThreshold = 20, highThreshold = 50) {
        //console.log("Iniciando detección de bordes...");
        
        // 1. Convertir a escala de grises
        //console.log("Convirtiendo a escala de grises...");
        const grayData = this.convertToGrayscale(imageData, width, height);
        
        // 2. Aplicar filtro Gaussiano
        //console.log("Aplicando filtro Gaussiano...");
        const smoothed = this.applyGaussianBlur(grayData, width, height);
        
        // 3. Calcular gradientes
        //console.log("Calculando gradientes...");
        const { magnitude, direction } = this.computeGradients(smoothed, width, height);
        
        // 4. Supresión de no máximos
        //console.log("Aplicando supresión de no máximos...");
        const suppressed = this.nonMaximumSuppression(magnitude, direction, width, height);
        
        // 5. Umbralización con histéresis
        //console.log("Aplicando umbralización con histéresis...");
        const edges = this.hysteresisThresholding(suppressed, width, height, lowThreshold, highThreshold);
        
        //console.log("Detección de bordes completada");
        return edges;
    }

    convertToGrayscale(imageData, width, height) {
        const gray = new Array(height);
        for (let y = 0; y < height; y++) {
            gray[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];
                gray[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
            }
        }
        return gray;
    }

    createGaussianKernel(size, sigma) {
        const kernel = [];
        const center = Math.floor(size / 2);
        let sum = 0;

        for (let y = 0; y < size; y++) {
            kernel[y] = [];
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                kernel[y][x] = value;
                sum += value;
            }
        }

        // Normalizar el kernel
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }

        return kernel;
    }

    applyGaussianBlur(data, width, height) {
        const kernelSize = this.gaussianKernel.length;
        const radius = Math.floor(kernelSize / 2);
        const blurred = new Array(height);
        
        for (let y = 0; y < height; y++) {
            blurred[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                let sum = 0;
                
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const ny = y + ky - radius;
                        const nx = x + kx - radius;
                        
                        // Manejar bordes con reflejo
                        const reflectY = Math.max(0, Math.min(height - 1, Math.abs(ny < 0 ? -ny : (ny >= height ? 2 * height - 1 - ny : ny))));
                        const reflectX = Math.max(0, Math.min(width - 1, Math.abs(nx < 0 ? -nx : (nx >= width ? 2 * width - 1 - nx : nx))));
                        
                        sum += data[reflectY][reflectX] * this.gaussianKernel[ky][kx];
                    }
                }
                
                blurred[y][x] = sum;
            }
        }
        
        return blurred;
    }

    computeGradients(data, width, height) {
        // Kernels de Sobel
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        const magnitude = new Array(height);
        const direction = new Array(height);
        
        // Inicializar matrices
        for (let y = 0; y < height; y++) {
            magnitude[y] = new Array(width).fill(0);
            direction[y] = new Array(width).fill(0);
        }
        
        // Calcular gradientes para píxeles internos
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0;
                let gy = 0;
                
                // Aplicar kernels de Sobel
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = data[y + ky][x + kx];
                        gx += pixel * sobelX[ky + 1][kx + 1];
                        gy += pixel * sobelY[ky + 1][kx + 1];
                    }
                }
                
                // Calcular magnitud y dirección
                magnitude[y][x] = Math.sqrt(gx * gx + gy * gy);
                direction[y][x] = Math.atan2(gy, gx);
            }
        }
        
        return { magnitude, direction };
    }

    nonMaximumSuppression(magnitude, direction, width, height) {
        const suppressed = new Array(height);
        
        // Inicializar matriz de salida
        for (let y = 0; y < height; y++) {
            suppressed[y] = new Array(width).fill(0);
        }
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const angle = direction[y][x] * (180 / Math.PI);
                const mag = magnitude[y][x];
                
                // Normalizar ángulo a 0, 45, 90, 135 grados
                let q = 255;
                let r = 255;
                
                // Ángulo 0° (horizontal)
                if ((angle < 22.5 && angle >= -22.5) || angle >= 157.5 || angle < -157.5) {
                    q = magnitude[y][x + 1];
                    r = magnitude[y][x - 1];
                }
                // Ángulo 45° (diagonal \)
                else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
                    q = magnitude[y + 1][x + 1];
                    r = magnitude[y - 1][x - 1];
                }
                // Ángulo 90° (vertical)
                else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
                    q = magnitude[y + 1][x];
                    r = magnitude[y - 1][x];
                }
                // Ángulo 135° (diagonal /)
                else if ((angle >= 112.5 && angle < 157.5) || (angle >= -67.5 && angle < -22.5)) {
                    q = magnitude[y + 1][x - 1];
                    r = magnitude[y - 1][x + 1];
                }
                
                // Mantener solo si es máximo local
                if (mag >= q && mag >= r) {
                    suppressed[y][x] = mag;
                }
            }
        }
        
        return suppressed;
    }

    hysteresisThresholding(data, width, height, lowThreshold, highThreshold) {
        const edgeMatrix = new Array(height);
        
        // Inicializar matriz de bordes
        for (let y = 0; y < height; y++) {
            edgeMatrix[y] = new Array(width).fill(0);
        }
        
        // Primera pasada: identificar bordes fuertes y débiles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = data[y][x];
                if (value >= highThreshold) {
                    edgeMatrix[y][x] = 2; // Borde fuerte
                } else if (value >= lowThreshold) {
                    edgeMatrix[y][x] = 1; // Borde débil
                }
            }
        }
        
        // Segunda pasada: conectar bordes débiles a fuertes
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (edgeMatrix[y][x] === 1) { // Borde débil
                    // Verificar si está conectado a un borde fuerte
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (edgeMatrix[y + dy][x + dx] === 2) {
                                edgeMatrix[y][x] = 2; // Convertir a fuerte
                                break;
                            }
                        }
                        if (edgeMatrix[y][x] === 2) break;
                    }
                    
                    // Si no está conectado, eliminar
                    if (edgeMatrix[y][x] === 1) {
                        edgeMatrix[y][x] = 0;
                    }
                }
            }
        }
        
        // Convertir a matriz binaria (1 = borde, 0 = no borde)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                edgeMatrix[y][x] = edgeMatrix[y][x] === 2 ? 1 : 0;
            }
        }
        
        return edgeMatrix;
    }
}



class ImprovedLineExtractor {
    constructor() {
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
    }

    // Método principal mejorado para extraer líneas
    extractLines(edgeMatrix, minLineLength = 10, maxGap = 2) {
        const height = edgeMatrix.length;
        const width = edgeMatrix[0].length;
        
        // Crear matriz de visitados
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        const lines = [];
        
        // Recorrer todos los píxeles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Si es un borde y no ha sido visitado
                if (edgeMatrix[y][x] === 1 && !visited[y][x]) {
                    // Seguir el contorno desde este punto
                    const contour = this.traceContour(edgeMatrix, visited, x, y, maxGap);
                    
                    if (contour.length >= minLineLength) {
                        // Simplificar el contorno para obtener una línea más limpia
                        const simplifiedLine = this.simplifyContour(contour, 1.0);
                        lines.push(simplifiedLine);
                    }
                }
            }
        }
        
        return lines;
    }

    // Algoritmo mejorado para seguir contornos
    traceContour(edgeMatrix, visited, startX, startY, maxGap) {
        const contour = [];
        let x = startX;
        let y = startY;
        
        // Dirección inicial (empezamos buscando en todas direcciones)
        let dir = 0;
        
        // Seguir el contorno hasta volver al inicio o hasta que no haya más bordes
        do {
            // Marcar como visitado y añadir al contorno
            visited[y][x] = true;
            contour.push([x, y]);
            
            // Buscar siguiente punto en el contorno
            const next = this.findNextPoint(edgeMatrix, visited, x, y, dir, maxGap);
            
            if (next) {
                // Actualizar posición y dirección
                x = next.x;
                y = next.y;
                dir = next.dir;
            } else {
                // No se encontró siguiente punto, terminar
                break;
            }
            
            // Prevenir bucles infinitos
            if (contour.length > 10000) break;
            
        } while (!(x === startX && y === startY) && contour.length < 10000);
        
        return contour;
    }

    // Encuentra el siguiente punto en el contorno
    findNextPoint(edgeMatrix, visited, x, y, startDir, maxGap) {
        const height = edgeMatrix.length;
        const width = edgeMatrix[0].length;
        
        // Buscar en las 8 direcciones empezando desde startDir
        for (let i = 0; i < 8; i++) {
            const dir = (startDir + i) % 8;
            const [dx, dy] = this.directions[dir];
            
            // Verificar el punto adyacente
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (edgeMatrix[ny][nx] === 1 && !visited[ny][nx]) {
                    return { x: nx, y: ny, dir: (dir + 5) % 8 }; // +5 para dar la vuelta
                }
            }
        }
        
        // Si no se encontró punto adyacente, buscar con brechas
        if (maxGap > 0) {
            for (let gap = 1; gap <= maxGap; gap++) {
                for (let i = 0; i < 8; i++) {
                    const dir = (startDir + i) % 8;
                    const [dx, dy] = this.directions[dir];
                    
                    // Verificar el punto con brecha
                    const nx = x + dx * gap;
                    const ny = y + dy * gap;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        if (edgeMatrix[ny][nx] === 1 && !visited[ny][nx]) {
                            return { x: nx, y: ny, dir: (dir + 5) % 8 };
                        }
                    }
                }
            }
        }
        
        return null;
    }

    // Simplifica un contorno usando el algoritmo de Douglas-Peucker
    simplifyContour(points, epsilon) {
        if (points.length <= 2) return points;
        
        // Encontrar el punto más lejano
        let maxDistance = 0;
        let maxIndex = 0;
        const start = points[0];
        const end = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const dist = this.pointToLineDistance(points[i], start, end);
            if (dist > maxDistance) {
                maxDistance = dist;
                maxIndex = i;
            }
        }
        
        // Si la distancia máxima es mayor que epsilon, simplificar recursivamente
        if (maxDistance > epsilon) {
            const left = this.simplifyContour(points.slice(0, maxIndex + 1), epsilon);
            const right = this.simplifyContour(points.slice(maxIndex), epsilon);
            
            // Combinar resultados, evitando duplicar el punto en maxIndex
            return left.slice(0, -1).concat(right);
        } else {
            // Todos los puntos están cerca, devolver solo los extremos
            return [start, end];
        }
    }

    // Calcula la distancia de un punto a una línea
    pointToLineDistance(point, lineStart, lineEnd) {
        const x = point[0], y = point[1];
        const x1 = lineStart[0], y1 = lineStart[1];
        const x2 = lineEnd[0], y2 = lineEnd[1];
        
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
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


//////////////////////////////////////////////// CLASE CANNY ////////////////////////////////////////////////


class canny {
    constructor() {
        this.originalCanvas = document.createElement('canvas');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.canvas_debug = false;

        this.dibujo = false;

        this.nombre_archivo_imagen = '';
        this.imagen = false;
        this.lowThreshold = 20;
        this.highThreshold = 50;

        this.minLineLength = 10;
        this.gapSize = 2 ;

        this.init();
    }

    init() {
        $("#select_capturar").append('<option value="cargar_config_canny">Canny</option>');             
        //this.agregar_controles_captura();

    }

    agregar_controles_captura(){        

        $("#parametros_captura").html(`
            <legend>Contornos</legend>

            <input type="file" id="imageLoader"  style="display: none;" accept="image/*"  />
            <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>
      
            <span id="nombreArchivo" class="nombre-archivo"></span>
            
            <div class="slider-container">
                <label for="lowThreshold">Umbral Bajo:</label>
                <input type="range" id="lowThreshold" min="1" max="100" value="20">
                <span id="lowValue" class="value">20</span>
            </div>
            
            <div class="slider-container">
                <label for="highThreshold">Umbral Alto:</label>
                <input type="range" id="highThreshold" min="1" max="100" value="50">
                <span id="highValue" class="value">50</span>
            </div>

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
        document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
        document.getElementById('lowThreshold').addEventListener('input', this.update_lowThreshold.bind(this), false);
        document.getElementById('highThreshold').addEventListener('input', this.update_highThreshold.bind(this), false);

        document.getElementById('minLineLength').addEventListener('input', this.update_minLineLength.bind(this), false);
        document.getElementById('gapSize').addEventListener('input', this.update_gapSize.bind(this), false);
    }
    
    

    update_gapSize(event){   
        this.gapValue = event.target.value;
        $('#gapValue').html(this.gapValue);      
        this.obtener_lineas();
    }

    update_minLineLength(event){   
        this.minLineLength = event.target.value;
        $('#minLineValue').html(this.minLineLength);      
        this.obtener_lineas();
    }

    update_lowThreshold(event){   
        this.lowThreshold = event.target.value;

        $('#lowValue').html(this.lowThreshold);
        if (parseInt(this.lowThreshold) >= parseInt(this.highThreshold)) {
            this.highThreshold = parseInt(this.lowThreshold ) + 1;
            $('#highValue').html(this.highThreshold );
            $('#highThreshold').val(this.highThreshold );
        }
     
        this.obtener_lineas();
    }

    update_highThreshold(event){   
        this.highValue = event.target.value;

        $('#highValue').html(this.highValue);

        if (parseInt(this.highValue) <= parseInt(this.lowThreshold)) {
            this.lowThreshold = parseInt(this.highValue) - 1;
            $('#lowValue').html(this.lowThreshold);
            $('#lowThreshold').val(this.lowThreshold );
        }
       
        this.obtener_lineas();
    }




    // funcion que muestra la matriz donde se procesan los graficos
    mostrar_matriz_debug(matriz){
      
        // si el canvas no fue creado lo crea
        if (!this.canvas_debug){
            const contenedor = document.getElementById('id_contenedor_canvas');            
            this.canvas_debug = document.createElement('canvas');    
            
            // Estilos 
            Object.assign(this.canvas_debug.style, {
                position: 'absolute', 
                top: '0', 
                left: '0',
            });

            contenedor.appendChild(this.canvas_debug);
        }

        const debugCtx = this.canvas_debug.getContext('2d');                             

        this.canvas_debug.width =  this.imagen.width;
        this.canvas_debug.height = this.imagen.height;

        let borde =0;
        if (matriz[0] === undefined) {
            borde =1;
        }

        let width = matriz[borde].length;
        let height= matriz.length; 
                            
        // Dibujar puntos        
        for (let y = borde; y < height-borde; y++) {
            for (let x = borde; x < width-borde; x++) {  
                
                let color = colores[matriz[y][x]];               

                debugCtx.lineWidth = 10;
                debugCtx.strokeStyle =color;
                debugCtx.fillStyle = color;

                debugCtx.fillStyle =color;
                debugCtx.fillRect(x, y, 1, 1); // x, y, ancho=1, alto=1
                debugCtx.stroke(); // Dibujar la línea
            }
        }
    };

      // Visualizar líneas en el canvas
    visualizeLines(lines, width, height) {

        // si el canvas no fue creado lo crea
        if (!this.canvas_debug){
            const contenedor = document.getElementById('id_contenedor_canvas');            
            this.canvas_debug = document.createElement('canvas');    
            
            // Estilos 
            Object.assign(this.canvas_debug.style, {
                position: 'absolute', 
                top: '0', 
                left: '0',
            });

            contenedor.appendChild(this.canvas_debug);
        }

        const debugCtx = this.canvas_debug.getContext('2d');                  
        this.canvas_debug.width =  this.imagen.width;
        this.canvas_debug.height = this.imagen.height;


        // Limpiar canvas
        debugCtx.fillStyle = 'black';
        debugCtx.fillRect(0, 0, width, height);
        

        // Dibujar cada línea
        lines.forEach((line, index) => {
            if (line.length < 2) return;
            
            // Color diferente para cada línea
            const hue = (index * 137.5) % 360; // Ángulo dorado
           // debugCtx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
            debugCtx.strokeStyle = colores[Math.floor(Math.random() * colores.length - 2) + 2];
            debugCtx.lineWidth = 1;
            debugCtx.beginPath();
                        
            // Mover al primer punto
            debugCtx.moveTo(line[0][0], line[0][1]);
            
            // Dibujar línea a través de todos los puntos
            for (let i = 1; i < line.length; i++) {
                debugCtx.lineTo(line[i][0], line[i][1]);
            }
            
            debugCtx.stroke();
           
            return;
            // Dibujar vértices
            debugCtx.fillStyle = 'white';
            line.forEach(point => {
                debugCtx.beginPath();
                debugCtx.arc(point[0], point[1], 1, 0, Math.PI * 2);
                debugCtx.fill();
            });
        });
    }


    //funcion que procesa la imagen poniendola en escala de grises, aplicando filtros sobel y pasandola a blanco y negro, para despues seguir las lineas
    procesar_imagen(){

         
        // Obtener datos de la imagen
        let imageData = this.originalCtx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        
      
        const detector = new CannyEdgeDetector();

        const lineExtractor = new ImprovedLineExtractor();

        // Obtener datos de la imagen
        const width = this.originalCanvas.width;
        const height = this.originalCanvas.height;
        // const imageData = originalCtx.getImageData(0, 0, width, height);
        
        // Detectar bordes
        const binaryEdges = detector.detectEdges(
            imageData.data, 
            width, 
            height, 
            parseInt(this.lowThreshold), 
            parseInt(this.highThreshold)
        );                     
      
      //  this.mostrar_matriz_debug(binaryEdges);
        
       // alert ('aca va la captura de lineas');
        // Extraer líneas (usando el método con brechas)
        this.dibujo = lineExtractor.extractLinesWithGaps(
            binaryEdges, 
            this.minLineLength,
            this.gapSize
        );
                    
                    // Visualizar líneas
      //  this.visualizeLines(lines, width, height);                   


    }

    obtener_lineas(ajuste_inicial_offset_scale = false){
        if (this.imagen === false){
            //eco('sin imagen que procesar');
            return;
        }

        // capturo las lineas de la imagen con los parametros seleccionados
        this.procesar_imagen();
      
        // muestro las estadisticas de la imagen
        $("#estadisticas").html("Lineas:" + this.dibujo.cantidadLineas() + "<br/>Vertices:" + this.dibujo.cantidadVertices());

        // entrego a captura el dibujo y la imagen que lo genero
        captura.dibujo = this.dibujo;
        captura.imagen = this.imagen;
        captura.nombre_archivo_imagen = this.nombre_archivo_imagen;
        captura.dibujar_captura(ajuste_inicial_offset_scale);
    }
    
    actualizarNombreArchivo(img) {
        const input = document.getElementById('imageLoader');
        const nombreSpan = document.getElementById('nombreArchivo');
        
        if (input.files.length > 0) {
            this.nombre_archivo_imagen = input.files[0].name;
            nombreSpan.textContent = input.files[0].name + " (" + img.width + "x" + img.height + ")";
        }else{
            nombreSpan.textContent = '';
        }
    }

    // carga la imagen desde un archivo y la manda a procesar
    cargar_imagen(e){

        let reader = new FileReader();
        // reader.onload = function(event) {
        reader.onload = (event) => {
            let img = new Image();
            //img.onload = function() {
            img.onload = () => {
                this.imagen = img;
             
                this.actualizarNombreArchivo(img);
            
                // Ajustar tamaño del canvas donde proceso la imagen al de la imagen
                this.originalCanvas.width = this.imagen.width;
                this.originalCanvas.height = this.imagen.height;
                
                // Dibujar imagen en el canvas original
                this.originalCtx.drawImage(img, 0, 0);     

                // Procesar imagen y detectar contornos
                this.obtener_lineas(true);    
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);            
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cargar_config_canny(){
    captureCanny.agregar_controles_captura();
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let captureCanny = new canny();   
