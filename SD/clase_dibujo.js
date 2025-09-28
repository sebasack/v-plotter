        // Clase Vértice
        class Vertice {
            constructor(x, y) {
                this.id = `v_${Math.random().toString(36).substr(2, 9)}`;
                this.x = x;
                this.y = y;             
            }

            distanciaA(vertice) {
                return Math.sqrt((this.x - vertice.x) ** 2 + (this.y - vertice.y) ** 2);
            }
             
        }

        // Clase Línea
        class Linea {
            constructor(id, color = null) {
                this.id = id;
                this.color = color || this.generarColorAleatorio();
                this.vertices = [];
            }

           
            
            generarColorAleatorio() {
                const colores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                                '#ff7700', '#7700ff', '#00ff77', '#ff0077', '#77ff00', '#0077ff'];
               
                return colores[Math.floor(Math.random() * colores.length)];
            }
            
            agregarVertice(x, y,previo = false) {
                const vertice = new Vertice(x, y,this.id);
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


            reducirVerticesLinea(ciclos){
                dibujo.lineas.forEach(function(linea) {   
                    let termine =false;
                    
                    let angulo_ant =360;
                    for (let i=0;y<linea.vertices.length-2; y = y+2){
                        // para cada tres vertices calculo el angulo
                        let angulo=  calculateAngle(linea.vertices[i],linea.vertices[i+1]);

                        let diff=angleDifference(angulo_ant, angulo);
                        console.log(i + ' '+diff)

                    }
                    
                });
            }
         

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
                this.lineas = [];
                this.contadorLineas = 0;
            }

            crearLinea(color = null) {
                const nuevaLinea = new Linea(this.contadorLineas, color);
                this.lineas.push(nuevaLinea);
                this.contadorLineas++;                
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


            reducirVertices(eliminar){

                this.lineas.forEach(function(linea) {   

                    let diferencias=[];
                    let angulo_ant =calculateAngle(linea.vertices[0],linea.vertices[1]);
                    for (let i=1;i<linea.vertices.length-1; i++){

                        // para cada par de vertices calculo el angulo
                        let angulo=  calculateAngle(linea.vertices[i],linea.vertices[i+1]);

                        let diff=angleDifference(angulo_ant, angulo);
                        //guardo el angulo en un arreglo
                        diferencias.push({indice:i, angulo: diff});
                        angulo_ant=angulo;
                    }                            

                    // ordeno los vertices por angulos en Orden ascendente
                    diferencias.sort((a, b) => a.angulo - b.angulo);

                    //calculo que cantidad de vertices voy a borrar
                    let cantidad = 0;
                    if ( linea.vertices.length > 10){
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

                let termine =false;
                let i = 0;
                while (!termine){
                    const linea1 = dibujo.lineas[i];

                    // busco los vertices inicial y final de la linea 1
                    const iniL1 = linea1.vertices[0];
                    const i_finL1 =linea1.vertices.length-1;
                    const finL1 = linea1.vertices[i_finL1];

                    let termine2 = false;
                    let j = i+1;
                    let siguiente_linea = true;
                    while (!termine2 && j< dibujo.lineas.length ){
                        const linea2 = dibujo.lineas[j];

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
                            dibujo.eliminarLinea(linea2.id) ;              
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
                            dibujo.eliminarLinea(linea2.id);               
                            termine2 = true;
                            siguiente_linea=false;
                        }else if (finL1.distanciaA(iniL2)<=cercaniaMinima){
                            //  console.log('unir fin linea '+linea1.id + ' y ini linea ' + linea2.id );
                            /**          *           *  
                                L1:  3 4 5       L2: 6 7 8
                                L1:  3 4 5 6 7 8
                            */                        
                            linea1.concatenarLinea(linea2);     
                            dibujo.eliminarLinea(linea2.id) ;
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
                            dibujo.eliminarLinea(linea2.id) ;      
                            termine2 = true;
                            siguiente_linea=false;
                        }

                        j++;
                        if (j === dibujo.lineas.length -1){
                            termine2=true;
                        }
                    };      
                    
                    // avanzo a la siguiente linea
                    if (siguiente_linea){
                        i++;
                    }
                    
                    // ya recorri todas las lineas
                    if (i === dibujo.lineas.length -1){
                        termine=true;
                    }                   

                };


            }
                        
        }
