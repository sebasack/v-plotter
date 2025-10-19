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
      
            <span id="nombreArchivo" class="nombre-archivo"></span>

            `);


            
            document.getElementById('imageLoader').addEventListener('change', this.cargar_imagen.bind(this), false);
        
            
    }

    obtener_lineas_svg(imagen,svg){        
        //  Variables globales
        this.dibujo = new Dibujo();

        let linea = this.dibujo.crearLinea(colores[9]);

        linea.agregarVertice(0,297/2);
        linea.agregarVertice(210/2,297/2);
        linea.agregarVertice(210/2,0);
        linea.agregarVertice(0,0);
        linea.agregarVertice(0,297/2);
        linea.agregarVertice(210/2,0);

        linea.agregarVertice(0,0);
        linea.agregarVertice(0,297);
        linea.agregarVertice(210,297);
        linea.agregarVertice(210,0);
        linea.agregarVertice(0,0);
        linea.agregarVertice(210,297);

        linea.agregarVertice(0,297*2);
        linea.agregarVertice(210*2,297*2);
        linea.agregarVertice(210*2,0);
        linea.agregarVertice(0,0);
        linea.agregarVertice(0,297*2);
        linea.agregarVertice(210*2,0);
                  
        // lo meto dentro de un timeout por que si no no llega a crearse la imagen
        setTimeout(() => {
              // entrego a captura el dibujo y la imagen que lo genero
            captura.dibujo = this.dibujo;
            captura.imagen = imagen;

            captura.dibujar_captura(true);
        }, 1);
      
 
    }
    
    actualizarNombreArchivo(svg) {

        const input = document.getElementById('imageLoader');
        const nombreSpan = document.getElementById('nombreArchivo');
        
        if (input.files.length > 0) {
            this.nombre_archivo_imagen = input.files[0].name;
            nombreSpan.textContent = input.files[0].name;/// + " (" + img.width + "x" + img.height + ")";
        }else{
            nombreSpan.textContent = '';
        }
    }

   


        analyzeChildElements(element, depth) {
            const children = Array.from(element.children);
            
            children.forEach(child => {
                this.logElementInfo(child, depth);
                this.analyzeChildElements(child, depth + 1);
            });
        }
        
        logElementInfo(element, depth) {
            const indent = '  '.repeat(depth);
            const tagName = element.tagName.toLowerCase();
            
            eco(`${indent}🏷️ <${tagName}>`, 'element');
            
            // Atributos principales
            const attributes = element.attributes;
            if (attributes.length > 0) {
                eco(`${indent}  📋 Atributos:`, 'attribute');
                
                for (let attr of attributes) {
                    let value = attr.value;
                    if (value.length > 50) {
                        value = value.substring(0, 50) + '...';
                    }
                    eco(`${indent}    • ${attr.name}: "${value}"`, 'value');
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
                            eco(`${indent}    → ${cmd.trim()}`, 'command');
                        });
                    }
                    break;
                    
                case 'rect':
                    const x = element.getAttribute('x') || '0';
                    const y = element.getAttribute('y') || '0';
                    const width = element.getAttribute('width') || '0';
                    const height = element.getAttribute('height') || '0';
                    eco(`${indent}  📐 Dimensiones: x=${x}, y=${y}, width=${width}, height=${height}`, 'dimensions');
                    break;
                    
                case 'circle':
                    const cx = element.getAttribute('cx') || '0';
                    const cy = element.getAttribute('cy') || '0';
                    const r = element.getAttribute('r') || '0';
                    eco(`${indent}  ⭕ Centro: (${cx}, ${cy}), Radio: ${r}`, 'circle');
                    break;
                    
                case 'line':
                    const x1 = element.getAttribute('x1') || '0';
                    const y1 = element.getAttribute('y1') || '0';
                    const x2 = element.getAttribute('x2') || '0';
                    const y2 = element.getAttribute('y2') || '0';
                    eco(`${indent}  📏 Línea: (${x1}, ${y1}) → (${x2}, ${y2})`, 'line');
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
                        eco(`${indent}  📝 Texto: "${textContent}"`, 'text');
                    }
                    break;
                    
                case 'g':
                    const transform = element.getAttribute('transform');
                    if (transform) {
                        eco(`${indent}  🔄 Transformación: ${transform}`, 'transform');
                    }
                    const fill = element.getAttribute('fill');
                    const stroke = element.getAttribute('stroke');
                    if (fill || stroke) {
                        eco(`${indent}  🎨 Estilos: fill="${fill || 'none'}", stroke="${stroke || 'none'}"`, 'style');
                    }
                    break;
            }
            
            // Información de estilo
            const style = element.getAttribute('style');
            if (style) {
                eco(`${indent}  🎨 Estilos CSS:`, 'style');
                const styleRules = style.split(';').filter(rule => rule.trim());
                styleRules.forEach(rule => {
                    eco(`${indent}    • ${rule.trim()}`, 'css');
                });
            }
            
            // Contenido de texto (si existe)
            const childNodes = Array.from(element.childNodes);
            const textNodes = childNodes.filter(node => node.nodeType === Node.TEXT_NODE);
            const textContent = textNodes.map(node => node.textContent.trim()).filter(text => text).join(' ');
            
            if (textContent && !['text', 'tspan'].includes(tagName)) {
                eco(`${indent}  📄 Contenido: "${textContent}"`, 'content');
            }
            
            eco('', 'spacer');
        }
        

        analyzeSVGStructure(svgElement) { 
            
            // Información del elemento SVG raíz
            this.logElementInfo(svgElement, 0);
            
            // Analizar todos los elementos hijos recursivamente
            this.analyzeChildElements(svgElement, 1);
                    
        }

            // Función para extraer dimensiones del contenido SVG
        obtenerDimensionesSVG(svgContent) {
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;
                
                // Obtener width y height del elemento SVG
                let ancho = parseInt(svgElement.getAttribute('width'));
                let alto = parseInt(svgElement.getAttribute('height'));
                
                // Si no tiene width/height, usar viewBox
                if (isNaN(ancho) || isNaN(alto)) {
                    const viewBox = svgElement.getAttribute('viewBox');
                    if (viewBox) {
                        const partes = viewBox.split(' ').map(Number);
                        if (partes.length === 4) {
                            ancho = partes[2];
                            alto = partes[3];
                        }
                    }
                }
                
                // Si aún no tenemos dimensiones, usar valores por defecto
                if (isNaN(ancho) || ancho === 0) ancho = 300;
                if (isNaN(alto) || alto === 0) alto = 150;
                
                return { ancho, alto };
                
            } catch (error) {
                console.warn('Error al obtener dimensiones SVG, usando valores por defecto:', error);
                return { ancho: 300, alto: 150 };
            }
        }

        async convertSVG(svgContent) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
            
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    
                    // Crear canvas con fondo
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const dimensiones = this.obtenerDimensionesSVG(svgContent);
                
                    // Asignar dimensiones manualmente si la imagen no las tiene
                    if (img.width === 0 || img.height === 0) {
                        img.width = dimensiones.ancho;
                        img.height = dimensiones.alto;
                    }

                    console.log('SVG convertido a imagen exitosamente ('+img.width+','+img.height+')');
                    
                    canvas.width = img.width ;
                    canvas.height = img.height ;
                    
                    // Dibujar fondo
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Dibujar SVG sobre el fondo
                    ctx.drawImage(img, 0, 0);
                    
                    // Crear nueva imagen desde canvas
                    const imgConFondo = new Image();
                    imgConFondo.src = canvas.toDataURL('image/png');
                    imgConFondo.width = canvas.width;
                    imgConFondo.height = canvas.height;                    
                  
                    resolve(imgConFondo);
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Error al cargar la imagen SVG'));
                };
                
                img.src = url;
            });
        }
/*
//ESTA FUNCION FUNIONA OK PARA CONVERTIR, PERO CON FONDO TRANSPARENTE
        // Función convertSVG mejorada que recibe el SVG y retorna la imagen
        convertSVG(svgContent) {
            return new Promise((resolve, reject) => {
                // Crear imagen desde SVG
                const img = new Image();
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                    URL.revokeObjectURL(url);

                    const dimensiones = this.obtenerDimensionesSVG(svgContent);
                
                    // Asignar dimensiones manualmente si la imagen no las tiene
                    if (img.width === 0 || img.height === 0) {
                        img.width = dimensiones.ancho;
                        img.height = dimensiones.alto;
                    }

                    console.log('SVG convertido a imagen exitosamente ('+img.width+','+img.height+')');

                    resolve(img);
                };
                
                img.onerror = function() {
                    URL.revokeObjectURL(url);
                    reject(new Error('Error al convertir el SVG a imagen'));
                };
                
                img.src = url;
            });
        }
*/
        // Leer archivo SVG
        leerArchivoSVG(archivo) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
                reader.readAsText(archivo);
            });
        }


        // carga la imagen desde un archivo y la manda a procesar
       async cargar_imagen(e){
            const archivo = e.target.files[0];                 
            try {
                this.actualizarNombreArchivo(archivo);
                const contenidoSVG = await this.leerArchivoSVG(archivo);    
                const imagen = await this.convertSVG(contenidoSVG);
                this.obtener_lineas_svg(imagen,contenidoSVG);                      
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
