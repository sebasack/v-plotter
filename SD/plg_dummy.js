class dummy {
    constructor() {
        this.originalCanvas = document.createElement('canvas');
        this.originalCtx = this.originalCanvas.getContext('2d');

        this.imagen = false;
        this.nombre_archivo_imagen = '';

        this.init();
    }
    
    init(){
        $("#select_capturar").append('<option value="cargar_config_dummy">dummy</option>');       
        this.agregar_controles_dummy();
    }
         
    agregar_controles_dummy(){             

        $("#parametros_captura").html(`
            <legend>dummy</legend>          
            <button type="button" id="cargar_dummy" class="boton-archivo">Cargar dummy</button>
            `);

         document.getElementById("cargar_dummy").addEventListener('click', () => {this.cargar_imagen_dummy(this)}, false);             
    }


    obtener_lineas_dummy(){
        
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
                   
     
        // entrego a captura el dibujo y la imagen que lo genero
        captura.dibujo = this.dibujo;
      //  captura.imagen = this.imagen;
        captura.dibujar_captura(true);
    }
    

    // carga la imagen desde un archivo y la manda a procesar
    cargar_imagen_dummy(event){
        let img = new Image();
        
        img.onload = () => {
            this.imagen = img;            
            // genero dibujo dummy
            this.obtener_lineas_dummy();    
        }
        
        img.src = "https://cdn.jsdelivr.net/gh/sebasack/v-plotter@latest/imagenes/perrito.jpg";
    
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cargar_config_dummy(){
    objeto_dummy.agregar_controles_dummy();
}

// tengo que dejar disponible el objeto de captura para poder cargar los parametros en el html
let objeto_dummy = new dummy();   
