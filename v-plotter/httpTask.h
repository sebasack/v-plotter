#include <AccelStepper.h>



TaskHandle_t httpHandle = NULL;
int httpCore = 0;



#ifndef HTTP_H
    #define HTTP_H
    #include <WebServer.h>

    WebServer server(80);

#endif

extern int commsReadCore, commsCommandCore, impleReleaseMotorsCore;
extern float currentMaxSpeed;
extern TaskHandle_t commsReadHandle, commsCommandHandle, impleReleaseMotorsHandle;
bool loadFromSdCard(String path) ;
void printDirectory();
void handleDelete();
void handleCreate();
void handleFileUpload();
void returnOK();
void calibrate_doCalibration();
void calibrate_doInitialCalibration();
void changeLength(float tA, float tB);

void set_home();
void go_home();


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
          'https://cdn.jsdelivr.net/gh/sebasack/v-plotter/web-control/page.html'\
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
      } else if (server.arg("command") == "setHome")    { 
          set_home();
      } else if (server.arg("command") == "goHome")    { 
          go_home();
      } else if (server.arg("command") == "releaseMotors")    { 
          releaseMotors();    
      } else if (server.arg("command") == "calibrate")    { 
          calibrate_doCalibration();        
      } else if (server.arg("command") == "initialCalibrate")    { 
          calibrate_doInitialCalibration();               
      }else if (server.arg("command") == "move")    {      
          if (server.hasArg("stepsA")){
              stepsA = server.arg("stepsA").toInt();            
          }

          if (server.hasArg("stepsB")){
              stepsB = server.arg("stepsB").toInt();            
          }


          int sentidoA =1;
          if (stepsA < 0 ){
            sentidoA =-1;
            stepsA=-stepsA;
          }
        
          int sentidoB =1;
          if (stepsB < 0 ){
            sentidoB =-1;
            stepsB=-stepsB;
          }


          Serial.print(" stepsA: ");
          Serial.print(stepsA);
          Serial.print(" sentidoA: ");
          Serial.print(sentidoA);
          Serial.print(" stepsB: ");
          Serial.print(stepsB);
          Serial.print(" sentidoB: ");
          Serial.print(sentidoB);
        
          motorA.setSpeed(currentMaxSpeed * sentidoA);
          motorB.setSpeed(currentMaxSpeed * sentidoB);

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
      }else{    
       //  exec_executeBasicCommand( server.arg("command"),  server.arg("param1"),  server.arg("param2"), server.arg("param3"), server.arg("param4")) 
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


void handleNotFound(){
    
    if (cardPresent && loadFromSdCard(server.uri()))  {
        return;
    }

    String message = "File Not Found\n\n";
    message += "URI: ";
    message += server.uri();
    message += "\nMethod: ";
    message += (server.method() == HTTP_GET) ? "GET" : "POST";
    message += "\nArguments: ";
    message += server.args();
    message += "\n";

    for (uint8_t i = 0; i < server.args(); i++)  {
        message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
    }

    server.send(404, "text/plain", message);
}


void httpTaskCreate(){
    Serial.println("in http...");
    Serial.print("Created task: Executing on core ");
    Serial.println(xPortGetCoreID());

  
    server.on("/list", HTTP_GET, printDirectory);
    server.on("/edit", HTTP_DELETE, handleDelete);
    server.on("/edit", HTTP_PUT, handleCreate);
    server.on("/edit", HTTP_POST, []() {
        returnOK();
    }, handleFileUpload);
  
    server.on("/", handleRoot);
    //server.on("/stop", handleStop);


    server.on("/control", handleControl);
    server.onNotFound(handleNotFound);
    
    server.begin();
    Serial.println("http started");

    #ifndef HTTP_TASK
    #define HTTP_TASK
      xTaskCreate(http, "HTTP", 5000, NULL, 1, &httpHandle);
    #endif
}