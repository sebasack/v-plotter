class svg {
    constructor() {
       
        this.svgContainer = document.createElement('div');

        this.imagen = false;
        this.nombre_archivo_imagen = '';

        this.init();
    }
    
    init(){
        $("#select_capturar").append('<option value="cargar_config_svg">SVG</option>');       
        this.agregar_controles_svg();
    }
         
    agregar_controles_svg(){             

        $("#parametros_captura").html(`
            <legend>SVG</legend>          
            
            <input type="file" id="imageLoader"  style="display: none;" accept=".svg"  />
            <button type="button" class="boton-archivo" onclick="document.getElementById('imageLoader').click()">Examinar</button>
    
            <span id="nombreArchivo" class="nombre-archivo"></span>`);
            
        document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
    }




    obtener_lineas_svg(imagen, svgElement){

        let dibujo = this.analyzeSVGStructure(svgElement) ;

        eco(JSON.stringify( dibujo.lineas));                  
        // lo meto dentro de un timeout por que si no no llega a crearse la imagen
        setTimeout(() => {
              // entrego a captura el dibujo y la imagen que lo genero
            captura.dibujo = dibujo;
            captura.imagen = imagen;
            eco(dibujo);
            captura.dibujar_captura(true);
        }, 10);     
 
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


    analyzeChildElements(element, depth, dibujo) {
        const children = Array.from(element.children);
        
        children.forEach(child => {
            this.logElementInfo(child, depth, dibujo);
            this.analyzeChildElements(child, depth + 1, dibujo);
        });
    }


    parsePath(d,dibujo) {
               
        const puntos = [];

        let currentPoint = { x: 0, y: 0 };
        let startPoint = { x: 0, y: 0 };
        let previousCommand = '';

        this.comandos = {
                    'M': 'moveTo', 
                    'L': 'lineTo', 
                    'H': 'horizontalLineTo', 
                    'V': 'verticalLineTo',
                    'C': 'curveTo', 
                    'S': 'smoothCurveTo', 
                    'Q': 'quadraticCurveTo', 
                    'T': 'smoothQuadraticCurveTo',
                    'A': 'arcTo', 
                    'Z': 'closePath', 
                    'm': 'moveToRelative', 
                    'l': 'lineToRelative',
                    'h': 'horizontalLineToRelative', 
                    'v': 'verticalLineToRelative', 
                    'c': 'curveToRelative',
                    's': 'smoothCurveToRelative', 
                    'q': 'quadraticCurveToRelative', 
                    't': 'smoothQuadraticCurveToRelative',
                    'a': 'arcToRelative', 
                    'z': 'closePath'
                };
        
        const normalized = d
            .replace(/([A-Za-z])/g, ' $1 ')
            .replace(/,/g, ' ')
            .replace(/-/g, ' -')
            .replace(/\s+/g, ' ')
            .trim();
        
        const tokens = normalized.split(' ');
        let i = 0;


        let linea = dibujo.crearLinea();
        while (i < tokens.length) {
            let token = tokens[i];
            
            if (this.comandos[token]) {
                previousCommand = token;
                i++;
            } else if (!isNaN(parseFloat(token)) && previousCommand) {
                token = previousCommand;
            } else {
                i++;
                continue;
            }
            
            const comando = token;
            const metodo = this.comandos[comando];
            
            switch (metodo) {
                case 'moveTo':// M
                    currentPoint = this.parsePoint(tokens, i);
                    startPoint = { ...currentPoint };
                    puntos.push({ ...currentPoint, tipo: 'M' });
                    if (linea.vertices.length == 0){
                        dibujo.eliminarLinea(linea.id);
                    }
                    linea = dibujo.crearLinea();
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 2;
                    break;
                case 'moveToRelative':// m
                    currentPoint.x += parseFloat(tokens[i]);
                    currentPoint.y += parseFloat(tokens[i + 1]);
                    startPoint = { ...currentPoint };
                    puntos.push({ ...currentPoint, tipo: 'M' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 2;
                    break;
                case 'lineTo':
                    currentPoint = this.parsePoint(tokens, i);
                    puntos.push({ ...currentPoint, tipo: 'L' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 2;
                    break;
                case 'lineToRelative':
                    currentPoint.x += parseFloat(tokens[i]);
                    currentPoint.y += parseFloat(tokens[i + 1]);
                    puntos.push({ ...currentPoint, tipo: 'L' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 2;
                    break;
                case 'horizontalLineTo':
                    currentPoint.x = parseFloat(tokens[i]);
                    puntos.push({ ...currentPoint, tipo: 'H' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 1;
                    break;
                case 'horizontalLineToRelative':
                    currentPoint.x += parseFloat(tokens[i]);
                    puntos.push({ ...currentPoint, tipo: 'H' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 1;
                    break;
                case 'verticalLineTo':
                    currentPoint.y = parseFloat(tokens[i]);
                    puntos.push({ ...currentPoint, tipo: 'V' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 1;
                    break;
                case 'verticalLineToRelative':
                    currentPoint.y += parseFloat(tokens[i]);
                    puntos.push({ ...currentPoint, tipo: 'V' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 1;
                    break;
                case 'curveTo':
                    currentPoint = { x: parseFloat(tokens[i + 4]), y: parseFloat(tokens[i + 5]) };
                    puntos.push({ ...currentPoint, tipo: 'C' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 6;
                    break;
                case 'curveToRelative':
                    currentPoint.x += parseFloat(tokens[i + 4]);
                    currentPoint.y += parseFloat(tokens[i + 5]);
                    puntos.push({ ...currentPoint, tipo: 'C' });
                    linea.agregarVertice(currentPoint.x, currentPoint.y);
                    i += 6;
                    break;
                case 'closePath': //Z
                    if (puntos.length > 0) {
                        puntos.push({ ...startPoint, tipo: 'Z' });
                        currentPoint = { ...startPoint };
                        linea.agregarVertice(startPoint.x+0.000001, startPoint.y+0.000001);
                    }
                    i += 1;
                    break;
                default:
                    i += this.getParamCount(comando);
                    break;
            }
        }
        eco(puntos);
        return puntos;
    }
    
    parsePoint(tokens, index) {
        return { x: parseFloat(tokens[index]), y: parseFloat(tokens[index + 1]) };
    }
    
    getParamCount(comando) {
        const paramCounts = {
            'M': 2, 'm': 2, 'L': 2, 'l': 2, 'H': 1, 'h': 1, 'V': 1, 'v': 1,
            'C': 6, 'c': 6, 'S': 4, 's': 4, 'Q': 4, 'q': 4, 'T': 2, 't': 2,
            'A': 7, 'a': 7, 'Z': 0, 'z': 0
        };
        return paramCounts[comando] || 0;
    }
    






        
    logElementInfo(element, depth, dibujo) {
        const indent = '  '.repeat(depth);
        const tagName = element.tagName.toLowerCase();
        
        eco(`${indent}🏷️ <${tagName}>`, 'element');
        
        // Atributos principales
        const attributes = element.attributes;
        if (attributes.length > 0) {
          //  eco(`${indent}  📋 Atributos:`, 'attribute');
            
            for (let attr of attributes) {
                let value = attr.value;
                if (value.length > 50) {
                    value = value.substring(0, 50) + '...';
                }
           //     eco(`${indent}    • ${attr.name}: "${value}"`, 'value');
            }
        }
        
        // Información específica por tipo de elemento
        switch (tagName) {
            case 'path':
                const d = element.getAttribute('d');
                if (d) {
                    eco(`${indent}  🛣️ Comandos path:`, 'path');
                    const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
                    commands.forEach(cmd => {
                     //   eco(`${indent}    → ${cmd.trim()}`, 'command');
                    });

                    this.parsePath(d,dibujo);
                  //this.pathToLines(d,dibujo);
                }
                break;
                
            case 'rect':
                const x = parseFloat(element.getAttribute('x') || '0');
                const y = parseFloat(element.getAttribute('y') || '0');
                const width = parseFloat(element.getAttribute('width') || '0');
                const height = parseFloat(element.getAttribute('height') || '0');
            //    eco(`${indent}  📐 Dimensiones: x=${x}, y=${y}, width=${width}, height=${height}`, 'dimensions');

                const rectangulo = dibujo.crearLinea();
                rectangulo.agregarVertice(x, y);
                rectangulo.agregarVertice(x, y + height);
                rectangulo.agregarVertice(x + width, y + height);
                rectangulo.agregarVertice(x + width, y);
                rectangulo.agregarVertice(x + 0.0000001,y + 0.0000001); // cierro el cuadrado               

                break;
                
            case 'circle':
                const centroX = parseFloat(element.getAttribute('cx') || '0');
                const centroY = parseFloat(element.getAttribute('cy') || '0');
                const radio = parseFloat(element.getAttribute('r') || '0');
              //  eco(`${indent}  ⭕ Centro: (${centroX}, ${centroY}), Radio: ${radio}`, 'circle');

                const cantidadPuntos = 50;

                const circulo = dibujo.crearLinea();    
                // genero los puntos del circulo
                for (let i = 0; i < cantidadPuntos; i++) {
                    // Calcular ángulo (distribución uniforme)
                    const angulo = (2 * Math.PI * i) / cantidadPuntos;                    
                    // Calcular coordenadas
                    const x = centroX + radio * Math.cos(angulo);
                    const y = centroY + radio * Math.sin(angulo);                    
                    circulo.agregarVertice(x, y);                   
                }

                // agrego el ultimo punto que cierra el circulo
                circulo.agregarVertice(circulo.vertices[0].x + 0.0000001, circulo.vertices[0].y + 0.0000001);

                break;
                
            case 'line':
                const x1 = parseFloat(element.getAttribute('x1') || '0');
                const y1 = parseFloat(element.getAttribute('y1') || '0');
                const x2 = parseFloat(element.getAttribute('x2') || '0');
                const y2 = parseFloat(element.getAttribute('y2') || '0');
            //    eco(`${indent}  📏 Línea: (${x1}, ${y1}) → (${x2}, ${y2})`, 'line');

                const linea = dibujo.crearLinea();   
                linea.agregarVertice(x1, y1);       
                linea.agregarVertice(x2, y2);       

                break;
                
            case 'polygon':
            case 'polyline':
                const points = element.getAttribute('points');
                if (points) {
                    eco(`${indent}  📍 Puntos: ${points}`, 'points');
                }
                break;
                
            case 'text':
                const textContent = element.textContent.trim();
                if (textContent) {
                 //   eco(`${indent}  📝 Texto: "${textContent}"`, 'text');
                }
                break;
                
            case 'g':
                const transform = element.getAttribute('transform');
                if (transform) {
              //      eco(`${indent}  🔄 Transformación: ${transform}`, 'transform');
                }
                const fill = element.getAttribute('fill');
                const stroke = element.getAttribute('stroke');
                if (fill || stroke) {
             //       eco(`${indent}  🎨 Estilos: fill="${fill || 'none'}", stroke="${stroke || 'none'}"`, 'style');
                }
                break;
        }
        /*
        // Información de estilo
        const style = element.getAttribute('style');
        if (style) {
            eco(`${indent}  🎨 Estilos CSS:`, 'style');
            const styleRules = style.split(';').filter(rule => rule.trim());
            styleRules.forEach(rule => {
                eco(`${indent}    • ${rule.trim()}`, 'css');
            });
        }
        */
       /*
        // Contenido de texto (si existe)
        const childNodes = Array.from(element.childNodes);
        const textNodes = childNodes.filter(node => node.nodeType === Node.TEXT_NODE);
        const textContent = textNodes.map(node => node.textContent.trim()).filter(text => text).join(' ');
        
        if (textContent && !['text', 'tspan'].includes(tagName)) {
            eco(`${indent}  📄 Contenido: "${textContent}"`, 'content');
        }
        
        eco('', 'spacer');
        */
    }
        
        
    /*
    getElementStructure(element) {
            const structure = {
                tagName: element.tagName.toLowerCase(),
                attributes: {},
                children: []
            };
            
            // Recopilar atributos
            for (let attr of element.attributes) {
                structure.attributes[attr.name] = attr.value;
            }
            
            // Recopilar hijos
            Array.from(element.children).forEach(child => {
                structure.children.push(this.getElementStructure(child));
            });
            
            return structure;
        }*/






    analyzeSVGStructure(svgElement) { 

        // obtengo la parte que necesito del svg
        this.svgContainer.innerHTML = svgElement;
        svgElement = this.svgContainer.querySelector('svg');


    // //estructura del svg en json
    //  const structure = this.getElementStructure(svgElement);
    // const jsonString = JSON.stringify(structure, null, 2);            
    //  eco(jsonString);


        // creo el objeto dibujo
        let dibujo = new Dibujo();
    
        // Información del elemento SVG raíz
        this.logElementInfo(svgElement, 0,dibujo);
        
        // Analizar todos los elementos hijos recursivamente
        this.analyzeChildElements(svgElement, 1,dibujo);

        return dibujo;
                
    }

 

    randomId() {
        return 'l_' + Math.random().toString(36).substring(2,10);
    }

    randomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
    }

    async parseSVG(fileText, step) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileText, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        const all = [...doc.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')];
        const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        document.body.appendChild(holder); holder.style.display = 'none';
      //  const results = [];


        // creo el objeto dibujo
        let dibujo = new Dibujo();

        function rectToPath(x,y,w,h){return `M${x},${y}h${w}v${h}h${-w}Z`;}
        function circleToPath(cx,cy,r){return `M${cx-r},${cy}a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0`; }
        function lineToPath(x1,y1,x2,y2){return `M${x1},${y1}L${x2},${y2}`;}

        for (const el of all) {
            let d=null;
            const tag=el.tagName.toLowerCase();
            if(tag==='path') d=el.getAttribute('d');
            else if(tag==='rect') d=rectToPath(el.x.baseVal.value, el.y.baseVal.value, el.width.baseVal.value, el.height.baseVal.value);
            else if(tag==='circle') d=circleToPath(el.cx.baseVal.value, el.cy.baseVal.value, el.r.baseVal.value);
            else if(tag==='line') d=lineToPath(el.x1.baseVal.value, el.y1.baseVal.value, el.x2.baseVal.value, el.y2.baseVal.value);
            else if(tag==='polyline'||tag==='polygon'){
                const pts=(el.getAttribute('points')||'').trim().replace(/\s+/g,' ');
                d='M'+pts+(tag==='polygon'?' Z':'');
            }
            if(!d) continue;

            const path = document.createElementNS('http://www.w3.org/2000/svg','path');
       
            path.setAttribute('d', d);
            const t = el.getAttribute('transform'); if(t) path.setAttribute('transform', t);
            holder.appendChild(path);

            const color = el.getAttribute('stroke') || this.randomColor();
            const total = path.getTotalLength();
         //   const pts=[];
            const linea = dibujo.crearLinea();
            for(let s = 0; s <= total; s += step){
                const p=path.getPointAtLength(s);
              //  pts.push({x:p.x, y:p.y});
                linea.agregarVertice(p.x, p.y);

                if (s % 1000 == 0){// Permitir que la página responda                    
                    await new Promise(r => setTimeout(r, 0));                 
                }
               
            }
            holder.removeChild(path);
           // results.push({color, vertices:pts});
          
        }
        holder.remove();
        return dibujo;
      //  return results;
    }


    // carga la imagen desde un archivo y la manda a procesar
    async cargar_imagen(e){
        const archivo = e.target.files[0];
        this.txt = await archivo.text();

        showLoading('Cargando archivo svg');     
        try {            
            const imagen = await SVGToImage(archivo);
            this.actualizarNombreArchivo(imagen);
           
            await this.parseSVG(this.txt,3)  // entrego a captura el dibujo y la imagen que lo genero
                .then((dibujo) => {
                    // cuando termina dibuja                                      
                    captura.dibujo = dibujo;
                    captura.imagen = imagen;
                    captura.dibujar_captura(true);
                    hideLoading();
                });
                    
        } catch (error) {
            console.error('Error en test:', error);
        }
    }      
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cargar_config_svg(){
    objeto_svg.agregar_controles_svg();
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let objeto_svg = new svg();   
