/**
*  Polargraph Server for ESP32 based microcontroller boards.
*  Written by Sandy Noble
*  Released under GNU License version 3.
*  http://www.polargraph.co.uk
*  https://github.com/euphy/polargraph_server_polarshield_esp32

Configuration.

This is one of the core files for the polargraph server program.
It sets up the motor objects (AccelSteppers), and has default
values for the motor, sprocket and microstepping combinations used
by polargraphs so far.

*/

// =================================================================
// Polarshield motor driver board
// This uses stepstick-format stepper drivers on arduino pins 3 to 8.



#if MOTHERBOARD == POLARSHIELD
  #define MOTOR_A_ENABLE_PIN 3
  #define MOTOR_A_STEP_PIN 4
  #define MOTOR_A_DIR_PIN 5

  #define MOTOR_B_ENABLE_PIN 6
  #define MOTOR_B_STEP_PIN 7
  #define MOTOR_B_DIR_PIN 8

  #define MOTOR_C_ENABLE_PIN 30
  #define MOTOR_C_STEP_PIN 31  
  #define MOTOR_C_DIR_PIN 32
  AccelStepper motorA(1, MOTOR_A_STEP_PIN, MOTOR_A_DIR_PIN);
  AccelStepper motorB(1, MOTOR_B_STEP_PIN, MOTOR_B_DIR_PIN);

#elif MOTHERBOARD == RAMPS14

  // Uses E1 driver on RAMPS
  #define MOTOR_A_ENABLE_PIN 30
  #define MOTOR_A_STEP_PIN 36
  #define MOTOR_A_DIR_PIN 34

  // Uses Y motor driver on RAMPS
  #define MOTOR_B_ENABLE_PIN 56
  #define MOTOR_B_STEP_PIN 60
  #define MOTOR_B_DIR_PIN 61
  AccelStepper motorA(1, MOTOR_A_STEP_PIN, MOTOR_A_DIR_PIN);
  AccelStepper motorB(1, MOTOR_B_STEP_PIN, MOTOR_B_DIR_PIN);

#elif MOTHERBOARD == TFTSHIELD

  // Uses E1 driver on RAMPS
  #define MOTOR_A_ENABLE_PIN 21
  #define MOTOR_A_STEP_PIN 20
  #define MOTOR_A_DIR_PIN 19

  // Uses Y motor driver on RAMPS
  #define MOTOR_B_ENABLE_PIN 18
  #define MOTOR_B_STEP_PIN 17
  #define MOTOR_B_DIR_PIN 16
  AccelStepper motorA(1, MOTOR_A_STEP_PIN, MOTOR_A_DIR_PIN);
  AccelStepper motorB(1, MOTOR_B_STEP_PIN, MOTOR_B_DIR_PIN);

#elif MOTHERBOARD == NODEMCU32S

  #define MOTOR_A_ENABLE_PIN 27
  #define MOTOR_A_STEP_PIN 14
  #define MOTOR_A_DIR_PIN 12

  #define MOTOR_B_ENABLE_PIN 13
  #define MOTOR_B_STEP_PIN 4
  #define MOTOR_B_DIR_PIN 15
  AccelStepper motorA(1, MOTOR_A_STEP_PIN, MOTOR_A_DIR_PIN);
  AccelStepper motorB(1, MOTOR_B_STEP_PIN, MOTOR_B_DIR_PIN);

#elif MOTHERBOARD == ESP32_UNL2003
    // Contributed by @j0nson
    // Initialize ULN2003 stepper driver
    // first number is type of stepper motor, 4 for a normal 4 wire step motor, 8 for a halfstepped normal 4 wire motor
    //Connection Directions
    // MotorA
    //ULN2003  Arduino  AcceStepper Init
    //IN1      2        2
    //IN2      3        4
    //IN3      4        3
    //IN4      5        5
    // MotorB
    //ULN2003  Arduino  AcceStepper Init
    //IN1      6        6
    //IN2      7        8
    //IN3      8        7
    //IN4      9        9
    
    //for a 28YBJ-48 Stepper, change these parameters above
    //Step angle (8-step) 5.625deg, 64 steps per rev
    //Step angle (4-step) 11.25deg, 32 steps per rev
    //gear reduction ratio 1/63.68395
    
    // motorStepsPerRev = 32 * 63.68395 = 2038; //for 4 step sequence
    // motorStepsPerRev = 64 * 63.68395 = 4076; //for 8 step sequence
    
    //motorStepsPerRev = 4076;
    //mmPerRev = 63;
    
    //DEFAULT_STEPS_PER_REV = 4076;
    //DEFAULT_MM_PER_REV = 63;
    
       
  // AccelStepper motorA(8, 26,33,32,25);  //   
  // AccelStepper motorB(8, 13,14,27,12);  //   

// esta configuracion dibuja invertido de cabeza
 //   AccelStepper motorA(8, 25,32,33,26);  //inv
  //  AccelStepper motorB(8, 13,14,27,12);  
       
    AccelStepper motorA(8, 26,33,32,25);
    AccelStepper motorB(8, 12,27,14,13);  //inv
       
  //  AccelStepper motorA(8, 25,32,33,26);  //inv
  //  AccelStepper motorB(8, 12,27,14,13);  //inv

//INVIERTO A Y B

  //  AccelStepper motorB(8, 26,33,32,25);
  //  AccelStepper motorA(8, 13,14,27,12);  
       
  //  AccelStepper motorB(8, 25,32,33,26);  //inv
  //  AccelStepper motorA(8, 13,14,27,12);  
       
  //  AccelStepper motorB(8, 26,33,32,25);
  //  AccelStepper motorA(8, 12,27,14,13);  //inv
       
  //  AccelStepper motorB(8, 25,32,33,26);  //inv
  //  AccelStepper motorA(8, 12,27,14,13);  //inv

   



#endif




void configuration_motorSetup(){

#ifdef DEBUG
  Serial.print(F("A: En:"));
  Serial.print(MOTOR_A_ENABLE_PIN);
  Serial.print(F(", St:"));
  Serial.print(MOTOR_A_STEP_PIN);
  Serial.print(F(", Di:"));
  Serial.println(MOTOR_A_DIR_PIN);

  Serial.print(F("B: En:"));
  Serial.print(MOTOR_B_ENABLE_PIN);
  Serial.print(F(", St:"));
  Serial.print(MOTOR_B_STEP_PIN);
  Serial.print(F(", Di:"));
  Serial.println(MOTOR_B_DIR_PIN);
#endif


#if MOTHERBOARD != ESP32_UNL2003
  pinMode(MOTOR_A_ENABLE_PIN, OUTPUT);
  digitalWrite(MOTOR_A_ENABLE_PIN, HIGH);
  pinMode(MOTOR_B_ENABLE_PIN, OUTPUT);
  digitalWrite(MOTOR_B_ENABLE_PIN, HIGH);
  motorA.setEnablePin(MOTOR_A_ENABLE_PIN);
  motorA.setPinsInverted(false, false, true);
  motorB.setEnablePin(MOTOR_B_ENABLE_PIN);
  motorB.setPinsInverted(true, false, true); // this one turns the opposite direction to A, hence inverted.
#endif

}

void configuration_setup(){
  recalculateStepsPerMm();

  //Serial.println("Temporary commented out sd_inidSD in configuration.ino:configuration_setup");
  sd_initSD();

  releaseMotors();

  motorA.setMaxSpeed(currentMaxSpeed);
  motorA.setAcceleration(currentAcceleration);
  motorB.setMaxSpeed(currentMaxSpeed);
  motorB.setAcceleration(currentAcceleration);

  motorA.setCurrentPosition(startLengthStepsA);
  motorB.setCurrentPosition(startLengthStepsB);

}

// end of Polarshield definition
// =================================================================
