/**
*  Polargraph Server for ESP32 based microcontroller boards.
*  Written by Sandy Noble
*  Released under GNU License version 3.
*  http://www.polargraph.co.uk
*  https://github.com/euphy/polargraph_server_polarshield_esp32


Specific features for Polarshield / arduino mega.
Implementation.

So this file is the interface for the extra features available in the
mega/polarshield version of the polargraph.

*/

/*  Implementation of executeCommand for MEGA-sized boards that
have command storage features. */
void impl_processCommand(String inCmd, String inParam1, String inParam2, String inParam3, String inParam4, int inNoOfParams){
  // lcd_echoLastCommandToDisplay(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams, "usb:");

  // The MEGA can change from LIVE to STORING modes
  // LIVE is where it acts on the commands,
  // STORING is where the commands are pushed into a file on an SD card.

  // If the command is to switch between these modes, then these are ALWAYS
  // executed as if LIVE.
  // You can't store a mode-change command to SD.
  if (inCmd.startsWith(CMD_MODE_STORE_COMMANDS) || inCmd.startsWith(CMD_MODE_LIVE)){
    Serial.println("Changing mode.");
    impl_executeCommand(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams);
  }else if (storeCommands){ // else execute / store the command
    Serial.print(F("Storing command:"));
    Serial.println(inCmd);
    sd_storeCommand(inCmd);
  }else
  {
    // execute the implementation if the command:  currentCommand -> lastParsedCommandRaw -> paramsExtracted -> inParam*
    impl_executeCommand(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams);
  }
}

/**
 *  This includes the extra commands the MEGA is capable of handling.
 *  It tries to run the command using the core executeBasicCommand
 *  first, but if that doesn't work, then it will go through
 *  it's own decision tree to try and run one of the additional
 *  routines.
 */
void impl_executeCommand(String inCmd, String inParam1, String inParam2, String inParam3, String inParam4, int inNoOfParams){
  // it's probably a basic command for drawaing so.  currentCommand -> lastParsedCommandRaw -> paramsExtracted -> inParam*
  if (exec_executeBasicCommand(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams)){
    // that's nice, it worked
    //... the messages end up in the right-hand column of the controller... all it shows is the time and command, not the params.  eh.
    // PGclient.print(MSG_COMPLETE_STR);
    // PGclient.println(currentCommand);
  }else if (inCmd.startsWith(CMD_DRAWCIRCLEPIXEL)){
    curves_pixel_drawCircularPixel();
  }else if (inCmd.startsWith(CMD_TESTPENWIDTHSCRIBBLE)){
    impl_pixel_testPenWidthScribble();
  }else if (inCmd.startsWith(CMD_DRAWSAWPIXEL)){
    impl_pixel_drawSawtoothPixel();
  }else if (inCmd.startsWith(CMD_DRAWDIRECTIONTEST)){
    impl_exec_drawTestDirectionSquare();
  }else if (inCmd.startsWith(CMD_MODE_STORE_COMMANDS)){
    impl_exec_changeToStoreCommandMode();
  }else if (inCmd.startsWith(CMD_MODE_LIVE)){
    impl_exec_changeToLiveCommandMode();
  }else if (inCmd.startsWith(CMD_MODE_EXEC_FROM_STORE)){
    impl_exec_execFromStore();
  }else if (inCmd.startsWith(CMD_SET_ROVE_AREA)){
    rove_setRoveArea();
  }else if (inCmd.startsWith(CMD_CHANGELENGTH_RELATIVE)){
    exec_changeLength();
  }else if (inCmd.startsWith(CMD_DRAW_NORWEGIAN)){
    rove_drawNorwegianFromFile();
  }else if (inCmd.startsWith(CMD_DRAW_NORWEGIAN_OUTLINE)){
    rove_drawRoveAreaFittedToImage();
  }else if (inCmd.startsWith(CMD_AUTO_CALIBRATE)){
    calibrate_doCalibration();
  }else if (inCmd.startsWith(CMD_SET_DEBUGCOMMS)){
    impl_setDebugComms();
  }else  {
    comms_unrecognisedCommand(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams);
    // comms_ready();
  }
}

void impl_exec_execFromStore(){
  String fileToExec = inParam1;
  if (fileToExec != ""){
    Serial.print("Filename to read from: ");
    Serial.println(fileToExec);
    commandFilename = fileToExec;
    impl_exec_execFromStore(commandFilename);
  }else
  {
    Serial.println("No filename supplied to read from.");
  }
}

String taskFilename; // you'd think this wouldn't be necessary, but it is
void impl_exec_execFromStore(String inFilename){
  taskFilename = inFilename;
  xTaskCreate(impl_execFromStoreTask, "Playback", 8000, (void *)&taskFilename, 1, NULL);
}

/*-----------------------------------------------------------------*/
// impl Exec Frome Store Task setup
/*-----------------------------------------------------------------*/
// runs once and deletes itself
void impl_execFromStoreTask(void *pvParameters){

  currentlyDrawingFromFile = true;

  String inFilename = *(String *)pvParameters;
  Serial.println("inFilename: " + inFilename);

  if (inFilename != ""){
    String noBlanks = "";
    // remove blanks
    for (int i = 0; i < inFilename.length(); i++){
      if (inFilename[i] != ' '){
        noBlanks = noBlanks + inFilename[i];
      }
    }
    char filename[noBlanks.length() + 1];
    noBlanks.toCharArray(filename, noBlanks.length() + 1);

    File readFile = SD.open(filename, FILE_READ);
    if (readFile){
      Serial.print("Opened file:");
      Serial.println(noBlanks);
      String command = "";

      while (readFile.available() && currentlyDrawingFromFile){
        char ch = readFile.read();
        if (ch == INTERMINATOR || ch == SEMICOLON)
        {
          // execute the line
          command.trim();
          command.toCharArray(currentCommand, INLENGTH + 1);
          boolean commandParsed = comms_parseCommand(currentCommand);
          if (commandParsed)
          {
            Serial.print(F("Executing command:"));
            Serial.println(command);
            if (echoingStoredCommands)
            {
              //      lcd_echoLastCommandToDisplay(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams, inFilename+": ");
            }
            impl_executeCommand(inCmd, inParam1, inParam2, inParam3, inParam4, inNoOfParams);
          }

          command = "";
          // implLcd();  // it's already running as a task, why call it again?
        }else
        {

          command += ch;
        }
      }
      Serial.println("Finished with the file.");
      currentlyDrawingFromFile = false;
      readFile.close();
    }else
    {
      Serial.println("Couldn't find that file, btw.");
      currentlyDrawingFromFile = false;
    }
  }else
  {
    Serial.println("No filename supplied to read from.");
    currentlyDrawingFromFile = false;
  }

  vTaskDelete(NULL);
}

void impl_exec_changeToStoreCommandMode(){
  String newfilename = inParam1;
  String newFile = inParam2;
  if (newfilename != ""){
    Serial.print("Filename for command store: ");
    Serial.println(newfilename);
    storeCommands = true;
    commandFilename = newfilename;
    if (newFile.equals("R")){
      // delete file if it exists
      char filename[newfilename.length() + 1];
      newfilename.toCharArray(filename, newfilename.length() + 1);

      if (SD.exists(filename)){
        // file exists
        Serial.println(F("File already exists."));
        boolean removed = SD.remove(filename);
        if (removed)
        {
          Serial.println(F("File removed."));
        }
      }
    }
  }else
  {
    Serial.println("No filename supplied to write to.");
  }
}

void impl_exec_changeToLiveCommandMode(){
  Serial.println(F("Changing back to live mode."));
  storeCommands = false;
}

void impl_pixel_testPenWidthScribble(){
  int rowWidth = multiplier(atoi(inParam1));
  float startWidth = atof(inParam2);
  float endWidth = atof(inParam3);
  float incSize = atof(inParam4);

  // boolean ltr = true;

  float oldPenWidth = penWidth;
  int iterations = 0;

  int posA = motorA.currentPosition();
  int posB = motorB.currentPosition();

  // int startColumn = posA;
  int startRow = posB;

  for (float pw = startWidth; pw <= endWidth; pw += incSize){
    iterations++;
    // int column = posA;

    penWidth = pw;
    int maxDens = pixel_maxDensity(penWidth, rowWidth);
    Serial.print(F("Penwidth test "));
    Serial.print(iterations);
    Serial.print(F(", pen width: "));
    Serial.print(penWidth);
    Serial.print(F(", max density: "));
    Serial.println(maxDens);

    for (int density = maxDens; density >= 0; density--){
      pixel_drawScribblePixel(posA, posB, rowWidth, density);
      posB += rowWidth;
    }

    posA += rowWidth;
    posB = startRow;
  }

  changeLength(long(posA - (rowWidth / 2)), long(startRow - (rowWidth / 2)));

  penWidth = oldPenWidth;

  moveB(0 - rowWidth);
  for (int i = 1; i <= iterations; i++){
    moveB(0 - (rowWidth / 2));
    moveA(0 - rowWidth);
    moveB(rowWidth / 2);
  }

  penWidth = oldPenWidth;
}

void impl_engageMotors(){
  motorA.enableOutputs();
  motorB.enableOutputs();
  powerIsOn = true;
  motorA.runToNewPosition(motorA.currentPosition() + multiplier(8));
  motorB.runToNewPosition(motorB.currentPosition() + multiplier(8));
  motorA.runToNewPosition(motorA.currentPosition() - multiplier(8));
  motorB.runToNewPosition(motorB.currentPosition() - multiplier(8));

  lastOperationTime = millis();

  Serial.println("Engaged motors.");
}

void impl_releaseMotors(){
  motorA.disableOutputs();
  motorB.disableOutputs();
  powerIsOn = false;
  Serial.println("Released motors");
}

void drawRandom(){
  for (int i = 0; i < 1000; i++){
    Serial.print("Drawing:");
    Serial.println(i);
    while (motorA.distanceToGo() != 0 && motorB.distanceToGo() != 0){
      motorA.run();
      motorB.run();
    }

    if (motorA.distanceToGo() == 0){
      int r = random(-2, 3);
      motorA.move(r);

      Serial.print("Chosen new A target: ");
      Serial.println(r);
    }

    if (motorB.distanceToGo() == 0){
      int r = random(-2, 3);
      motorB.move(r);
      Serial.print("Chosen new B target: ");
      Serial.println(r);
    }

    // reportPosition();
  }
}

void impl_exec_drawTestDirectionSquare(){
  int rowWidth = multiplier(atoi(inParam1));
  int segments = atoi(inParam2);
  pixel_drawSquarePixel(rowWidth, rowWidth, segments, DIR_SE);
  moveA(rowWidth * 2);

  pixel_drawSquarePixel(rowWidth, rowWidth, segments, DIR_SW);
  moveB(rowWidth * 2);

  pixel_drawSquarePixel(rowWidth, rowWidth, segments, DIR_NW);
  moveA(0 - (rowWidth * 2));

  pixel_drawSquarePixel(rowWidth, rowWidth, segments, DIR_NE);
  moveB(0 - (rowWidth * 2));
}

void impl_pixel_drawSawtoothPixel(){
  long originA = multiplier(atol(inParam1));
  long originB = multiplier(atol(inParam2));
  int size = multiplier(atoi(inParam3));
  int density = atoi(inParam4);

  int halfSize = size / 2;

  long startPointA;
  long startPointB;
  long endPointA;
  long endPointB;

  int calcFullSize = halfSize * 2; // see if there's any rounding errors
  int offsetStart = size - calcFullSize;

  if (globalDrawDirectionMode == DIR_MODE_AUTO){
    globalDrawDirection = pixel_getAutoDrawDirection(originA, originB, motorA.currentPosition(), motorB.currentPosition());
  }

  if (globalDrawDirection == DIR_SE){
    //      Serial.println(F("d: SE"));
    startPointA = originA - halfSize;
    startPointA += offsetStart;
    startPointB = originB;
    endPointA = originA + halfSize;
    endPointB = originB;
  }else if (globalDrawDirection == DIR_SW){
    //      Serial.println(F("d: SW"));
    startPointA = originA;
    startPointB = originB - halfSize;
    startPointB += offsetStart;
    endPointA = originA;
    endPointB = originB + halfSize;
  }else if (globalDrawDirection == DIR_NW){
    //      Serial.println(F("d: NW"));
    startPointA = originA + halfSize;
    startPointA -= offsetStart;
    startPointB = originB;
    endPointA = originA - halfSize;
    endPointB = originB;
  }else
  { //(drawDirection == DIR_NE)
    //      Serial.println(F("d: NE"));
    startPointA = originA;
    startPointB = originB + halfSize;
    startPointB -= offsetStart;
    endPointA = originA;
    endPointB = originB - halfSize;
  }

  density = pixel_scaleDensity(density, 255, pixel_maxDensity(penWidth, size));

  changeLength(startPointA, startPointB);
  if (density > 1){
    pixel_drawWavePixel(size, size, density, globalDrawDirection, SAW_SHAPE);
  }
  changeLength(endPointA, endPointB);
}

void impl_setDebugComms(){
  int debugCommsValue = atoi(inParam1);
  switch (debugCommsValue){
  case 0:
    debugComms = false;
    break;
  case 1:
    debugComms = true;
    break;
  }
}

//--------------------------------------------
// task
//--------------------------------------------
/*
int impleExternalControlCore = 0;

void externalControlCreate(void *pvParameters){
  (void)pvParameters;

  Serial.printf("externalControl task: Executing on core %d\n", xPortGetCoreID());

  for (;;){

    impleExternalControlCore = xPortGetCoreID();
    

    vTaskDelay(719 / portTICK_PERIOD_MS);
  }
}

*/
int impleReleaseMotorsCore = 0;

void taskReleaseMotors(void *pvParameters){
  (void)pvParameters;

  Serial.printf("taskReleaseMotors task: Executing on core %d\n", xPortGetCoreID());

  for (;;){

    impleReleaseMotorsCore = xPortGetCoreID();

    long motorCutoffTime = millis() - lastOperationTime;

    

    if (powerIsOn){
      Serial.print(" ---> motors on: ");
      Serial.println(motorCutoffTime);      
    //}else {
    //  Serial.println("  power off ");
    }

    if ((automaticPowerDown) && (powerIsOn) && (motorCutoffTime > motorIdleTimeBeforePowerDown)){
      Serial.println("Powering down motors because of inactivity.");

      //  penlift_penUp();
      releaseMotors();
    }

    vTaskDelay(18013 / portTICK_PERIOD_MS);
  }
}


TaskHandle_t impleReleaseMotorsHandle = NULL;
void implReleaseMotorsCreate(){
    Serial.println("releaseMotors started...");

    xTaskCreate(taskReleaseMotors, // Function that should be called
        "Release motors", // Name of the task (for debugging)
        5000, // Stack size (bytes)
        NULL,   // Parameter to pass
        0,    // Task priority
        &impleReleaseMotorsHandle);// Task handle

  //xTaskCreatePinnedToCore(
  //    taskReleaseMotors,         // Function to implement the task
  //    "Release motors",          // Name of the task
  //    5000,                      // Stack size in words
  //    NULL,                      // Task input parameter
  //    0,                         // Priority of the task
  //    &impleReleaseMotorsHandle, // Task handle.
  //    1);                        // Core where the task should run
}


/*
TaskHandle_t externalControlHandle = NULL;
void externalControlCreate(){
  Serial.println("externalControl started...");

  // xTaskCreate(taskReleaseMotors, // Function that should be called
  // "Release motors", // Name of the task (for debugging)
  //  5000, // Stack size (bytes)
  //  NULL,   // Parameter to pass
  //  0,    // Task priority
  //  &impleReleaseMotorsHandle);// Task handle

  xTaskCreatePinnedToCore(
      taskExternalControl,         // Function to implement the task
      "External Control",          // Name of the task
      5000,                      // Stack size in words
      NULL,                      // Task input parameter
      0,                         // Priority of the task
      &externalControlHandle, // Task handle.
      1);                        // Core where the task should run
}
*/