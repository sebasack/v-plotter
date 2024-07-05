/**
*  Polargraph Server for ESP32 based microcontroller boards.
*  Written by Sandy Noble
*  Released under GNU License version 3.
*  http://www.polargraph.co.uk
*  https://github.com/euphy/polargraph_server_polarshield_esp32


Specific features for Polarshield / arduino mega.
Calibration.

Experimental calibration routine.  It is designed to work with
limit switches, triggered by the gondola being a fixed (known)
distance from the sprocket.



*/

static int trundleSpeed = 100;

/* =============================================================================
   Here is the calibration routines
   =============================================================================*/



   

void calibrate_doInitialCalibration(){

/* pasos para la calibracion inicial:
   ---------------------------------


    poner la gondola manualmente en home

    iniciar calibracion:

      levantar el pen

      liberar motores      

      liberar 5 cm de hilo del motorB 
      mientras no se active la señal del motorA
        liberar 1cm del motorB
        recuperar 1cm del motorA      

      mientras no se active la señal del motorB
        liberar 1cm del motorA
        recuperar 1cm del motorB

      guardar en eeprom posiciones limites de motores
    
      mover la gondola a home.
      
      liberar motores*/

    // limpio los limites para que los vuelva a buscar y guardar
    eeprom_storeMotorLimits(0, 0);



    Serial.println("Doing calibration.");
    // raise pen
    penlift_penUp();
    // turn motors off
    releaseMotors();
    delay(1000);


    /////////////////////////// LIBERACION DE SEGURIDAD DE HILO DEL MOTORB ANTES DE EMPEZAR ///////////////////////////

    Serial.println("liberacion inicial de cuerda motorB...");

    // hago la liberacion inicial de hilo del motorB para comenzar la calibracion

    // energise motorA
    motorB.enableOutputs();
    motorB.setCurrentPosition(0);
    motorB.move(CALIBRATE_INITIAL_RELEASE_MM);
    motorB.setSpeed(trundleSpeed);
    motorB.runSpeed();
    
    delay(400);

    /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR A ///////////////////////////

    Serial.println("Buscando señal en motorA...");

    // energise motorA
    motorA.enableOutputs();
    motorA.setCurrentPosition(0);

    byte endStopSignal = 1;
    // so wind backwards until hitting the stop.
    while (endStopSignal != 0)  {
        
        // libero en motorB
        motorB.move(stepMultiplier);
        motorB.setSpeed(trundleSpeed);
        while (motorB.distanceToGo() != 0){
            motorB.runSpeed();
        }

        // recojo en motorA
        motorA.move(-stepMultiplier);
        motorA.setSpeed(-trundleSpeed);
        while (motorA.distanceToGo() != 0){
            motorA.runSpeed();
        }

        endStopSignal = digitalRead(ENDSTOP_MOTORA);
    }

    Serial.println("Señal encontrada en motorA.");

/*

              11         5      6        10
    MotorA-----------LA-----G------LB----------MotorB  
    
    limitStepsMotorA = 5
    limitStepsMotorB = 6

    startLengthStepsA = 11 + limitStepsMotorA
    startLengthStepsB = 10 + limitStepsMotorB

*/

    limitStepsMotorA = abs(motorA.currentPosition()) ;
    motorA.setCurrentPosition(limitStepsMotorA);

    delay(1000);

    /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR B  ///////////////////////////

    Serial.println("Buscando señal en motorB...");

    endStopSignal = 1;
    // so wind backwards until hitting the stop.
    while (endStopSignal != 0)  {
        
        // libero en motorB
        motorA.move(stepMultiplier);
        motorA.setSpeed(trundleSpeed);
        while (motorA.distanceToGo() != 0){
            motorA.runSpeed();
        }

        // recojo en motorB
        motorB.move(-stepMultiplier);
        motorB.setSpeed(-trundleSpeed);
        while (motorB.distanceToGo() != 0){
            motorB.runSpeed();
        }

        endStopSignal = digitalRead(ENDSTOP_MOTORB);
    }

    Serial.println("Señal encontrada en motorB.");

    limitStepsMotorB = abs(motorA.currentPosition()) ;
    motorB.setCurrentPosition(limitStepsMotorB);


    Serial.println("Moviendo gondola a home...");

    //guardo los limites en la eeeprom
    eeprom_storeMotorLimits(limitStepsMotorA, limitStepsMotorB);


    ////////////////////////////// MUEVO LA GONDOLA A HOME  //////////////////////////////
    motorA.setMaxSpeed(currentMaxSpeed);
    motorB.setMaxSpeed(currentMaxSpeed);
    motorA.setAcceleration(currentAcceleration);
    motorB.setAcceleration(currentAcceleration);

    motorA.moveTo(startLengthStepsA);
    motorB.moveTo(startLengthStepsB);
    
    while (motorA.distanceToGo() != 0 || motorB.distanceToGo() != 0)  {
        motorA.run();
        motorB.run();
    }

    Serial.println("fin de la calibracion.");        




    reportPosition();
    powerIsOn = true;
    isCalibrated = true;
  
}






   
void calibrate_doCalibration(){

/*

  go home automatico:
  ------------------

    si limitStepsMotorA y limitStepsMotorB son distintos de 0 proceder:

      liberar 5 cm de hilo del motorB 

      mientras no se detecte limite del motorA
        liberar 1cm del motorB
        recuperar 1cm del motorA

      mientras no se detecte limite del motorB
        liberar 1cm del motorA
        recuperar 1cm del motorB
     
      ir a home    

    si son 0 no se hizo la calibracion inicial, no puedo proceder.
        
*/

    if (limitStepsMotorA >0 and limitStepsMotorB >0){        
        Serial.println("liberacion inicial de cuerda motorB...");

        // hago la liberacion inicial de hilo del motorB para comenzar la calibracion

        // energise motorA
        motorB.enableOutputs();
        motorB.setCurrentPosition(0);
        motorB.move(CALIBRATE_INITIAL_RELEASE_MM);
        motorB.setSpeed(trundleSpeed);
        motorB.runSpeed();
        
        delay(400);

        /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR A ///////////////////////////

        Serial.println("Buscando señal en motorA...");

        // energise motorA
        motorA.enableOutputs();
        motorA.setCurrentPosition(0);

        byte endStopSignal = 1;
        // so wind backwards until hitting the stop.
        while (endStopSignal != 0)  {
            
            // libero en motorB
            motorB.move(stepMultiplier);
            motorB.setSpeed(trundleSpeed);
            while (motorB.distanceToGo() != 0){
                motorB.runSpeed();
            }

            // recojo en motorA
            motorA.move(-stepMultiplier);
            motorA.setSpeed(-trundleSpeed);
            while (motorA.distanceToGo() != 0){
                motorA.runSpeed();
            }

            endStopSignal = digitalRead(ENDSTOP_MOTORA);
        }

        Serial.println("Señal encontrada en motorA.");

        limitStepsMotorA = abs(motorA.currentPosition()) ;
        motorA.setCurrentPosition(limitStepsMotorA);

        delay(1000);

        /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR B  ///////////////////////////

        Serial.println("Buscando señal en motorB...");

        endStopSignal = 1;
        // so wind backwards until hitting the stop.
        while (endStopSignal != 0)  {
            
            // libero en motorB
            motorA.move(stepMultiplier);
            motorA.setSpeed(trundleSpeed);
            while (motorA.distanceToGo() != 0){
                motorA.runSpeed();
            }

            // recojo en motorB
            motorB.move(-stepMultiplier);
            motorB.setSpeed(-trundleSpeed);
            while (motorB.distanceToGo() != 0){
                motorB.runSpeed();
            }

            endStopSignal = digitalRead(ENDSTOP_MOTORB);
        }

        Serial.println("Señal encontrada en motorB.");

    }else{
        Serial.println(" No se puede calibrar, haga primero una calibracion inicial!");
    }
}


