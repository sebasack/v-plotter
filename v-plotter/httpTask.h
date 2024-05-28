#include <AccelStepper.h>

#include <SD.h>


TaskHandle_t httpHandle = NULL;
int httpCore = 0;



#ifndef HTTP_H
    #define HTTP_H
    #include <WebServer.h>

    WebServer server(80);

#endif

extern int commsReadCore, commsCommandCore, impleReleaseMotorsCore;
extern TaskHandle_t commsReadHandle, commsCommandHandle, impleReleaseMotorsHandle;



File uploadFile;

extern AccelStepper motorA, motorB;

extern boolean commandBuffered,cardPresent;
extern volatile int bufferPosition;
extern char nextCommand[];
extern char currentCommandRaw[];

extern int commsWhere;

boolean manualControlInProgress = false;
//--------------------------------------------


  

void handleRoot(){

  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.sendHeader("Content-Type", "text/html", true);
  server.sendHeader("Cache-Control", "no-cache");
  server.send(200);

  //--------------------------------------------
// trae la pagina web y los js desde la CDN de github, los archivos usados estan en web-control

  sprintf(temp,
          "\
 <!DOCTYPE html>\
<html>\
  <head>\
    <title>Control v-plotter</title> \
    <script src='https://code.jquery.com/jquery-3.6.3.min.js'></script> \
    <script>\
      $(function () {\
        $('#b-placeholder').load(\
          'https://cdn.jsdelivr.net/gh/sasnull/v-plotter/web-control/page.html'\
        );\
      });\
    </script>\
  </head>\
  <body>\
    <div id='b-placeholder'>loading html...</div>\
  </body>\
</html>\
");
  server.sendContent(temp);


}

/*
boolean detenerMovimientoManual = true;

void handleStop(){
  // String message = "stop\n\n";
  // server.send(200, "text/plain", message);

  detenerMovimientoManual = true;
  handleRoot();
}
*/

// boolean exec_executeBasicCommand(String inCmd, String inParam1, String inParam2, String inParam3, String inParam4, int inNoOfParams);

void penlift_penUp();
void penlift_penDown();
void releaseMotors();
void reportPosition();   
void comms_ready(); 


void handleControl(){
  // String message = "stop\n\n";
  // server.send(200, "text/plain", message);

  // String user = server.pathArg(0);



  int speedA = 0;
  int speedB = 0;
  int stepsA = 0;
  int stepsB = 0;
  
  String position;
  position.reserve(50);

  
  if (server.hasArg("command"))  {
      Serial.print("________________________________________________________________\n");
      Serial.print("command: ");
      Serial.println(server.arg("command"));

      if (commandBuffered>0 and server.arg("command") != "restart"){
           server.send(200, "text/plain", "{\"result_ok\":false,\"desc_error\":\"draw in progress\"}");
           Serial.println("  command rejected, draw in pregress ");
           return;
      }

       manualControlInProgress = true;

      if (server.arg("command") == "penLift")    {
          penlift_penUp();
      } else if (server.arg("command") == "penDown")    {
          penlift_penDown();
      } else if (server.arg("command") == "restart")    { 
          server.send(200, "text/plain", "{\"result_ok\":true}");
          ESP.restart();
          //}else if (server.arg("command") == "stop")    { // stop motors
          // detenerMovimientoManual=true;
      } else if (server.arg("command") == "releaseMotors")    { 
          releaseMotors();          
      }else if (server.arg("command") == "move")    {
       
          if (server.hasArg("speedA")){
              speedA = server.arg("speedA").toInt();            
          }
          if (server.hasArg("speedB")){
              speedB = server.arg("speedB").toInt();            
          }
          if (server.hasArg("stepsA")){
              stepsA = server.arg("stepsA").toInt();            
          }

          if (server.hasArg("stepsB")){
              stepsB = server.arg("stepsB").toInt();            
          }


          Serial.print(" speedA: ");          
          Serial.println(speedA);
          Serial.print(" speedB: ");          
          Serial.println(speedB);
          Serial.print(" stepsA: ");
          Serial.print(stepsA);
          Serial.print(" stepsB: ");
          Serial.print(stepsB);
        
          motorA.setSpeed(speedA);
          motorB.setSpeed(speedB);

          while (stepsA>0 or stepsB>0) {     
              if (stepsA>0){
                  motorA.runSpeed();
                  stepsA--;
              }
              if (stepsB>0){
                  motorB.runSpeed();
                  stepsB--;
              }

              // esta linea la agregue yo por que se reiniciaba por watchdog
              vTaskDelay(1);

              if (stepsA % 1000==0 or stepsB % 1000 ==0){
                Serial.print(".");
              }              
          }


          Serial.println("");          

          releaseMotors(); 

     
          reportPosition();   // output the SYNC message
          comms_ready(); // output the READY_200 message
      }else if (server.arg("command") == "getPosition")    {
      }

      manualControlInProgress = false;

      Serial.println("comando ok");      



  
      position = position+",\"motorA\":" + motorA.currentPosition()  + ",\"motorB\":" + motorB.currentPosition();
 
      server.send(200, "text/plain", "{\"result_ok\":true" +position+"}");

  } else  {
      Serial.println("comando no valido ");
      server.send(200, "text/plain", "{\"result_ok\":false,\"desc_error\":\"invalid command\"}");
  }


   

 // handleRoot();

}

//--------------------------------------------
// task
//--------------------------------------------
void http(void *pvParameters){
  (void)pvParameters;

  for (;;)  {
    server.handleClient();
    httpCore = xPortGetCoreID();
    vTaskDelay(97 / portTICK_PERIOD_MS);
  }
}

//--------------------------------------------
//--------------------------------------------

void httpTaskCreate(){
    Serial.println("in http...");
    Serial.print("Created task: Executing on core ");
    Serial.println(xPortGetCoreID());

  
    server.on("/", handleRoot);
    //server.on("/stop", handleStop);
    server.on("/control", handleControl);

    
    server.begin();
    Serial.println("http started");

    #ifndef HTTP_TASK
    #define HTTP_TASK
      xTaskCreate(http, "HTTP", 5000, NULL, 1, &httpHandle);
    #endif
}
