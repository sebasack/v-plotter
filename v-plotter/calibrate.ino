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

/* =============================================================================
   Here is the calibration routines
   =============================================================================*/

void calibrate_doInitialCalibration()
{

    /* pasos para la calibracion inicial:
       ---------------------------------


        poner la gondola manualmente en home

        iniciar calibracion:

          levanta el pen

          libera motores

          mientras no se active la señal del motorA
            liberar 8 pasos del motorB
            recuperar 8 pasos del motorA        

          mientras no se active la señal del motorB
            liberar 8 pasos del motorA
            recuperar 8 pasos del motorB

          guardar en eeprom posiciones limites de motores

          mover la gondola a home.

          liberar motores


          */

    // limpio los limites para que los vuelva a buscar y guardar
    eeprom_storeMotorLimits(0, 0);

    Serial.println("Doing calibration.");
    // raise pen
    penlift_penUp();
    // turn motors off
    releaseMotors();
    delay(1000);


    /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR A ///////////////////////////

    // seteo los motores en la posision de home



    Serial.println("\nBuscando marcador en motorA...");

    // energise motorA
    motorA.enableOutputs();

    // energise motorB
    motorB.enableOutputs();

    byte endStopSignal = digitalRead(ENDSTOP_MOTORA_PIN);

    // so wind backwards until hitting the stop.
    while (endStopSignal != HIGH)
    {
        // libero en motorB 0.25 mm
        motorB.move(stepMultiplier);
        motorB.setSpeed(currentMaxSpeed);
        while (motorB.distanceToGo() != 0)
        {
            motorB.runSpeed();
        }

        // recojo en motorA 0.25 mm
        motorA.move(-stepMultiplier);
        motorA.setSpeed(-currentMaxSpeed);
        while (motorA.distanceToGo() != 0)
        {
            motorA.runSpeed();
        }

        endStopSignal = digitalRead(ENDSTOP_MOTORA_PIN);
        /*
                Serial.print("Pos motorA: ");
                Serial.print(motorA.currentPosition());
                Serial.print(" Pos motorB: ");
                Serial.println(motorB.currentPosition());
        */
        delay(1);        
    }

    limitStepsMotorA =  motorA.currentPosition();
    Serial.print("Marcador encontrado en motorA, pasos faltantes hasta home: ");
    Serial.println(limitStepsMotorA);
    delay(1000);

    /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR B  ///////////////////////////

    Serial.println("\nBuscando marcador en motorB...");
    

    endStopSignal = digitalRead(ENDSTOP_MOTORB_PIN);

    // so wind backwards until hitting the stop
    while (endStopSignal != HIGH )
    {

        // libero en motorA   0.25 mm
        motorA.move(stepMultiplier);
        motorA.setSpeed(currentMaxSpeed);
        while (motorA.distanceToGo() != 0)
        {
            motorA.runSpeed();
        }

        // recojo en motorB 0.25 mm
        motorB.move(-stepMultiplier);
        motorB.setSpeed(-currentMaxSpeed);
        while (motorB.distanceToGo() != 0)
        {
            motorB.runSpeed();
        }

        endStopSignal = digitalRead(ENDSTOP_MOTORB_PIN);
        /*
                Serial.print("Pos motorA: ");
                Serial.print(motorA.currentPosition());
                Serial.print(" Pos motorB: ");
                Serial.println(motorB.currentPosition());
        */
        delay(1);
    }

    limitStepsMotorB =  motorB.currentPosition();
    Serial.print("Marcador encontrado en motorB, pasos faltantes hasta home: ");
    Serial.println(limitStepsMotorB);

    delay(1000);

    /////////////////////////// calculo posiciones ///////////////////////////

    Serial.println("\nMoviendo gondola a home...");

    // guardo los limites en la eeeprom
    eeprom_storeMotorLimits(limitStepsMotorA, limitStepsMotorB);

    ////////////////////////////// MUEVO LA GONDOLA A HOME  //////////////////////////////
    while (motorA.currentPosition() > startLengthStepsA)    {

        // libero en motorB 0.25 mm
        motorB.move(stepMultiplier);
        motorB.setSpeed(currentMaxSpeed);
        while (motorB.distanceToGo() != 0)
        {
            motorB.runSpeed();
        }

        // recojo en motorA 0.25 mm
        motorA.move(-stepMultiplier);
        motorA.setSpeed(-currentMaxSpeed);
        while (motorA.distanceToGo() != 0)        {
            motorA.runSpeed();
        }
        /*
                Serial.print("Pos motorA: ");
                Serial.print(motorA.currentPosition());
                Serial.print(" Pos motorB: ");
                Serial.println(motorB.currentPosition());
        */
        delay(1);
    }


    // desenergizo los motores
    releaseMotors();

    reportPosition();

    Serial.println("\nfin de la calibracion inicial.\n_____________________________________________________________\n");

    isCalibrated = true;
}

void calibrate_doCalibration()
{

    /*

      go home automatico:
      ------------------

        si limitStepsMotorA y limitStepsMotorB son distintos de 0 proceder:

          mientras no se detecte limite del motorA
            liberar 1cm del motorB
            recuperar 1cm del motorA

          mientras no se detecte limite del motorB
            liberar 1cm del motorA
            recuperar 1cm del motorB

          ir a home

        si son 0 no se hizo la calibracion inicial, no puedo proceder.



    */

    if (limitStepsMotorA > 0 and limitStepsMotorB > 0)    {
        Serial.println("liberacion inicial de cuerda motorB...");

/*
        // hago la liberacion inicial de hilo del motorB para comenzar la calibracion
        // energise motorA
        motorB.enableOutputs();
        motorB.setCurrentPosition(0);
        motorB.move(CALIBRATE_INITIAL_RELEASE_MM);
        motorB.setSpeed(currentMaxSpeed);
        motorB.runSpeed();

        delay(400);
*/

    // raise pen
        penlift_penUp();
        // turn motors off
        releaseMotors();
        delay(1000);



        /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR A ///////////////////////////

        Serial.println("\nBuscando marcador en motorA...");

        // energise motorA
        motorA.enableOutputs();

        // energise motorB
        motorB.enableOutputs();

        byte endStopSignal = digitalRead(ENDSTOP_MOTORA_PIN);

        // so wind backwards until hitting the stop.
        while (endStopSignal != HIGH && motorA.currentPosition() > 0){

            // libero en motorB 0.25 mm
            motorB.move(stepMultiplier);
            motorB.setSpeed(currentMaxSpeed);
            while (motorB.distanceToGo() != 0){
                motorB.runSpeed();
            }

            // recojo en motorA 0.25 mm
            motorA.move(-stepMultiplier);
            motorA.setSpeed(-currentMaxSpeed);
            while (motorA.distanceToGo() != 0){
                motorA.runSpeed();
            }

            endStopSignal = digitalRead(ENDSTOP_MOTORA_PIN);
            /*
            Serial.print("Pos motorA: ");
            Serial.print(motorA.currentPosition());
            Serial.print(" Pos motorB: ");
            Serial.println(motorB.currentPosition());
    */
            delay(1);
        }

        long posStepsMotorA = motorA.currentPosition();
        Serial.print("Marcador encontrado en motorA, pasos : ");
        Serial.println(posStepsMotorA);
        motorA.setCurrentPosition(limitStepsMotorA);

        delay(1000);


    
        /////////////////////////// CALIBRO POSICION DEL SEÑALADOR DEL MOTOR B  ///////////////////////////

        Serial.println("\nBuscando marcador en motorB...");

        endStopSignal =  digitalRead(ENDSTOP_MOTORB_PIN);

        // so wind backwards until hitting the stop
        while (endStopSignal != HIGH && motorB.currentPosition() > 0){

            // libero en motorA   0.25 mm
            motorA.move(stepMultiplier);
            motorA.setSpeed(currentMaxSpeed);
            while (motorA.distanceToGo() != 0){
                motorA.runSpeed();
            }

            // recojo en motorB 0.25 mm
            motorB.move(-stepMultiplier);
            motorB.setSpeed(-currentMaxSpeed);
            while (motorB.distanceToGo() != 0){
                motorB.runSpeed();
            }

            endStopSignal = digitalRead(ENDSTOP_MOTORB_PIN);
            /*
            Serial.print("Pos motorA: ");
            Serial.print(motorA.currentPosition());
            Serial.print(" Pos motorB: ");
            Serial.println(motorB.currentPosition());
            */
            delay(1);
        }

        long posStepsMotorB =  motorB.currentPosition();
        Serial.print("Marcador encontrado en motorB, pasos : ");
        Serial.println(posStepsMotorB);

        motorB.setCurrentPosition(limitStepsMotorB);

        delay(1000);



        Serial.println("\nMoviendo gondola a home...");
        ////////////////////////////// MUEVO LA GONDOLA A HOME  //////////////////////////////



        Serial.println("\nLibero motorB y recojo motorA hasta llegar a home...");
        // libero motorB hasta que llegue a home
        while (motorB.currentPosition() < startLengthStepsB || motorA.currentPosition() > startLengthStepsA)    {

            if (motorB.currentPosition() < startLengthStepsB){
                // libero en motorB 0.25 mm
                motorB.move(stepMultiplier);
                motorB.setSpeed(currentMaxSpeed);
                while (motorB.distanceToGo() != 0)        {
                    motorB.runSpeed();
                }
            }

            if (motorA.currentPosition() > startLengthStepsA){
                 // recojo en motorA 0.25 mm
                motorA.move(-stepMultiplier);
                motorA.setSpeed(-currentMaxSpeed);
                while (motorA.distanceToGo() != 0)        {
                    motorA.runSpeed();
                }
            }
       
            /*
            Serial.print("Pos motorA: ");
            Serial.print(motorA.currentPosition());
            Serial.print(" Pos motorB: ");
            Serial.println(motorB.currentPosition());
    */
            delay(1);
        }   
            
        // desenergizo los motores
        releaseMotors();

        reportPosition();

        Serial.println("\nfin de la calibracion .\n_____________________________________________________________\n");

        isCalibrated = true;



    }    else    {
        Serial.println(" No se puede calibrar, haga primero una calibracion inicial!");
    }
}


void set_home(){

    motorA.setCurrentPosition(startLengthStepsA);
    motorB.setCurrentPosition(startLengthStepsB);

    releaseMotors();

    reportPosition();
};


void go_home(){

    Serial.print("Return to home.");
/*
        Serial.print("  Pos motorA: ");
        Serial.print(motorA.currentPosition());
        Serial.print(" Pos motorB: ");
        Serial.println(motorB.currentPosition());
*/

    // raise pen
    penlift_penUp();
    // turn motors off
    releaseMotors();
    delay(1000);




    Serial.println("\n");

    // libero motorA hasta que llegue a home
    while (motorA.currentPosition() > startLengthStepsA)    {    
   
        // recojo en motorA 0.25 mm
        motorA.move(-stepMultiplier);
        motorA.setSpeed(-currentMaxSpeed);
        while (motorA.distanceToGo() != 0)        {
            motorA.runSpeed();
        }    
        /*
        Serial.print("Pos motorA: ");
        Serial.print(motorA.currentPosition());
        Serial.print(" Pos motorB: ");
        Serial.println(motorB.currentPosition());
*/
        delay(1);
    }   

    // recojo motorA hasta que llegue a home
    while (motorA.currentPosition() < startLengthStepsA)    {    
   
        // recojo en motorA 0.25 mm
        motorA.move(stepMultiplier);
        motorA.setSpeed(currentMaxSpeed);
        while (motorA.distanceToGo() != 0)        {
            motorA.runSpeed();
        }    
        /*
        Serial.print("Pos motorA: ");
        Serial.print(motorA.currentPosition());
        Serial.print(" Pos motorB: ");
        Serial.println(motorB.currentPosition());
*/
        delay(1);
    }   


    // libero motorB hasta que llegue a home
    while (motorB.currentPosition() > startLengthStepsB)    {    
   
        // recojo en motorA 0.25 mm
        motorB.move(-stepMultiplier);
        motorB.setSpeed(-currentMaxSpeed);
        while (motorB.distanceToGo() != 0)        {
            motorB.runSpeed();
        }    
        /*
        Serial.print("Pos motorA: ");
        Serial.print(motorA.currentPosition());
        Serial.print(" Pos motorB: ");
        Serial.println(motorB.currentPosition());
*/
        delay(1);
    }   

    // recojo motorB hasta que llegue a home
    while (motorB.currentPosition() < startLengthStepsA)    {    
   
        // recojo en motorB 0.25 mm
        motorB.move(stepMultiplier);
        motorB.setSpeed(currentMaxSpeed);
        while (motorB.distanceToGo() != 0)        {
            motorB.runSpeed();
        }    
        /*
        Serial.print("Pos motorA: ");
        Serial.print(motorA.currentPosition());
        Serial.print(" Pos motorB: ");
        Serial.println(motorB.currentPosition());
*/
        delay(1);
    }   


    releaseMotors();

    reportPosition();


};