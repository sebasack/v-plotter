#include <AccelStepper.h>

#include <SD.h>


TaskHandle_t httpHandle = NULL;
int httpCore = 0;

#define TIPO_DATO_TEXTO_JSON "text/json"
#define DURACION_CACHE_HTTP 31536000       // 86400=1 dia,  31536000=1 anio
boolean cachear = false;


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


  
/*
void handleRoot(){

  int sec = millis() / 1000;
  int min = sec / 60;
  int hr = min / 60;

  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.sendHeader("Content-Type", "text/html", true);
  server.sendHeader("Cache-Control", "no-cache");
  server.send(200);

  //--------------------------------------------

  sprintf(temp,
          "\
 <script src='https://code.jquery.com/jquery-3.6.3.min.js'></script>\
 <script type='text/javascript'>\
    function control(command,motor) {\
        params = {\
            command: command,\
            motor: motor,\
            speed: $('#velocidad option:selected').val(),\
            steps: $('#pasos option:selected').val()\
        };\
        $.ajax({\
            url: '/control',\
            data: params,\
            type: 'GET',\
            timeout: 3000,\
            async: false,\
            cache: false,\
            global: true,\
            processData: true,\
            ifModified: false,\
            contentType:'application/x-www-form-urlencoded',\
            dataType:'json',\
            error: function (objeto, quepaso, otroobj) {\
                console.log('No se pudo completar la operacion: ' + quepaso);\
            },\
            success: function (datos) {\
                if (datos.result_ok) {  } else {\
                    alert(datos.desc_error);\
                }\
            }\
        });\
    }\
 </script>\
 <html>\
  <head>\
");
  server.sendContent(temp);

sprintf(temp,
"\
   <h1> Control </h1>\
 <table border='1'>\
    <tr>\
       <td align='center'>\
            Speed:\
       </td>\
       <td align='center'>\
           <select id='velocidad'>\
              <option value='1000'>1000</option>\
              <option value='500'>500</option>\
              <option value='200'>200</option>\
              <option value='-200'>-200</option>\
              <option value='-500'>-500</option>\
              <option value='-1000'>-1000</option>\
           </select>\
        </td>\
     </tr>\
     <tr>\
       <td align='center'>\
            Distance:\
       </td>\
       <td align='center'>\
           <select id='pasos'>\
              <option value='288'>1cm</option>\
              <option value='1442'>5cm</option>\
              <option value='2883'>10cm</option>\
              <option value='5767'>20cm</option>\
              <option value='14417'>50cm</option>\
              <option value='28834'>100cm</option>\
           </select>\
        </td>\
     </tr>");
  server.sendContent(temp);

  sprintf(temp,
  "\
     <tr>\
       <td align='center'>\
          Motor:\
       </td>\
       <td align='center'>\
           <button type='button' onclick=\"control('move',1)\">MotorA</button>\
           <button type='button' onclick=\"control('move',2)\">MotorB</button><br>\
           <button type='button' onclick=\"control('move',0)\">Both</button>\
        </td>\
     </tr>\
  </table>\
 <br>\
     <button type='button' onclick=\"control('penLift')\">Pen Lift</button>\
     <button type='button' onclick=\"control('penDown')\">Pen Drop</button>\
     <button type='button' onclick=\"control('restart')\">Restart</button>\
 <br>");
  server.sendContent(temp);

  sprintf(temp,
  "\
    <title>PolarGraph</title>\
    <style>\
      body { background-color: #cccccc; font-family: Arial, Helvetica, Sans-Serif; Color: #000088; }\
    </style>\
  </head>\
  <body>\
    <h1>PolarGraph</h1>\
    <p>Uptime: %02d:%02d:%02d</p>\
    ",
          hr, min % 60, sec % 60);
  server.sendContent(temp);

  //--------------------------------------------
  sprintf(temp,
          "\
<table border='1' cellpadding='5'>\
<tr><th colspan=2>Core</th><tr>\
<tr><th>HTTP</th><td>%d</td></tr>\
<tr><th>WIFI</th><td>%d</td></tr>\
<tr><th>COMMS Read</th><td>%d</td></tr>\
<tr><th>COMMS Command</th><td>%d</td></tr>\
<tr><th>Release Motors</th><td>%d</td></tr>\
</table>\
<br>",
          httpCore,
          wifiCore,
          commsReadCore,
          commsCommandCore,
          impleReleaseMotorsCore);
  server.sendContent(temp);

  //--------------------------------------------

  sprintf(temp,
          "\
<table border='1' cellpadding='5'>\
<tr><th colspan=2>Stack</th><tr>\
<tr><th>HTTP</th><td>%d</td></tr>\
<tr><th>WIFI</th><td>%d</td></tr>\
<tr><th>COMMS Read</th><td>%d</td></tr>\
<tr><th>COMMS Command</th><td>%d</td></tr>\
<tr><th>Release Motors</th><td>%d</td></tr>\
</table>\
<br>",
          uxTaskGetStackHighWaterMark(httpHandle),
          uxTaskGetStackHighWaterMark(wifiHandle),
          uxTaskGetStackHighWaterMark(commsReadHandle),
          uxTaskGetStackHighWaterMark(commsCommandHandle),
          uxTaskGetStackHighWaterMark(impleReleaseMotorsHandle));
  server.sendContent(temp);

  //--------------------------------------------
  sprintf(temp,
          "\
<table border='1' cellpadding='5'>\
<tr><th colspan=2>Command</th><tr>\
<tr><th>commandBuffered</th><td>%s</td></tr>\
<tr><th>bufferPosition</th><td>%d</td></tr>\
<tr><th>nextCommand</th><td>%s</td></tr>\
<tr><th>currentCommand</th><td>%s</td></tr>\
</table>\
<br>",
          String(commandBuffered).c_str(),
          bufferPosition,
          nextCommand,
          currentCommandRaw);

  server.sendContent(temp);

  //--------------------------------------------
  sprintf(temp,
          "<p>%s %s %s</p>\
<p>commsWhere: %d</p>\
</body></html>",
          fileName, __DATE__, __TIME__,
          commsWhere);
  server.sendContent(temp);

  server.sendContent(" ");
}
*/
//--------------------------------------------

bool loadFromSdCard(String path) {


  String dataType;
  dataType.reserve(100);
  dataType = String(TIPO_DATO_TEXTO_JSON);
  boolean cachear = true;

  if (path.endsWith("/"))  {
	    path.concat(F("index.htm"));
  }

  if (path.endsWith(".htm"))  {
	    dataType = F("text/html");
  }  else if (path.endsWith(".css"))  {
	    dataType = F("text/css");
  }  else if (path.endsWith(".js"))  {
	    dataType = F("application/javascript");
  }  else if (path.endsWith(".png"))  {
	    dataType = F("image/png");
  }  else if (path.endsWith(".jpg"))  {
	    dataType = F("image/jpeg");
      /*
  }  else if (path.endsWith(".gif"))  {
    	dataType = F("image/gif");
  }  else if (path.endsWith(".ico"))  {
	    dataType = F("image/x-icon");
  }  else if (path.endsWith(".xml"))  {
	    dataType = F("text/xml");
  }  else if (path.endsWith(".pdf"))  {
	    dataType = F("application/pdf");
  }  else if (path.endsWith(".src"))  {
	    path = path.substring(0, path.lastIndexOf("."));
  }  else if (path.endsWith(".zip"))  {
	    dataType = F("application/zip");*/
  }  else if (path.endsWith(".txt"))  {
	    cachear = false;
  }

  File dataFile = SD.open(path.c_str());
  if (dataFile.isDirectory())  {
    path.concat(F("/index.htm"));
    dataType = "text/html";
    dataFile = SD.open(path.c_str());
  }

  if (!dataFile)  {
	    return false;
  }

  if (server.hasArg("download"))  {
	    dataType = F("application/octet-stream");
  };
 
  if (cachear)  {
	    dataType.concat(F("\r\nCache-Control: max-age="));
	    dataType.concat(String(DURACION_CACHE_HTTP));
  }

  if (server.streamFile(dataFile, dataType) != dataFile.size())  {
	    Serial.println(F("Sent less data than expected!"));
  }

  dataFile.close();

  return true;
}

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

void returnOK() {
    server.send(200, TIPO_DATO_TEXTO_JSON, F(""));
}

void returnFail(String msg) {
    server.send(500, TIPO_DATO_TEXTO_JSON, msg);
}

String quitar_path_archivo(String nombre_archivo) {
    // busco la ultima barra del directorio
    int ultima_barra = nombre_archivo.lastIndexOf('/');

    // Ignore '/' prefix}
    String resultado = nombre_archivo.substring(ultima_barra + 1);
    //     Serial.println("quito path a " +nombre_archivo + "  " + resultado );
    return resultado;
};

void printDirectory(){


    if (!server.hasArg("dir"))  {
        return returnFail(F("BAD ARGS\r\n"));
    };

    String path = server.arg("dir");
    if (path != "/" && !SD.exists((char *)path.c_str()))  {
        return returnFail(F("BAD PATH\r\n"));
    };

    // Serial.println(" leo dir "+ path);

    File dir = SD.open((char *)path.c_str());
    path = String();
    if (!dir.isDirectory())  {
        dir.close();
        return returnFail(F("NOT DIR\r\n"));
    }

    dir.rewindDirectory();

    server.setContentLength(CONTENT_LENGTH_UNKNOWN);
    server.send(200, TIPO_DATO_TEXTO_JSON, "");

    String buffer_dir;
    int buffer_dir_lenght = 1000;
    buffer_dir.reserve(buffer_dir_lenght);

    buffer_dir = F("[");

    for (int cnt = 0; true; ++cnt)  {
        File entry = dir.openNextFile();
        if (!entry)    {
            break;
        };

        if (buffer_dir.length() + 100 > buffer_dir_lenght)    {
            server.sendContent(buffer_dir);
            buffer_dir = F("");
        }

        if (cnt > 0)    {
            buffer_dir.concat(F(","));
        };
        buffer_dir.concat(F("{\"type\":\""));
        buffer_dir.concat((entry.isDirectory()) ? F("dir") : F("file"));
        buffer_dir.concat(F("\",\"name\":\""));
        buffer_dir.concat(quitar_path_archivo(entry.name()));
        buffer_dir.concat(F("\",\"size\":\""));
        buffer_dir.concat(String(entry.size()));
        buffer_dir.concat("\"}");

        entry.close();        
    };

    buffer_dir.concat(F("]"));
    server.sendContent(buffer_dir);

    // Send zero length chunk to terminate the HTTP body
    server.sendContent("");

    dir.close();
}


void deleteRecursive(String path) {

    File file = SD.open((char *)path.c_str());
    if (!file.isDirectory())  {
        file.close();
        SD.remove((char *)path.c_str());
        return;
    }

    file.rewindDirectory();
    while (true)  {
        File entry = file.openNextFile();

        if (!entry)	{
            break;
        };
        String entryPath = entry.name();
        if (entry.isDirectory())	{
            entry.close();
            deleteRecursive(entryPath);
        }	else	{
            entry.close();
            SD.remove((char *)entryPath.c_str());
        }
        yield();
    }

    SD.rmdir((char *)path.c_str());
    file.close();
}


void handleDelete()
{

    if (server.args() == 0)  {
        return returnFail("BAD ARGS\r\n");
    }

    String path = server.arg(0);
    if (path == "/" || !SD.exists((char *)path.c_str()))    {
        returnFail("BAD PATH\r\n");
        return;
    }
    deleteRecursive(path);
    returnOK();
}


void handleCreate(){

    if (server.args() == 0)  {
        return returnFail("BAD ARGS\r\n");
    }

    String path = server.arg(0);
    if (path == "/" || SD.exists((char *)path.c_str()))  {
        returnFail("BAD PATH\r\n");
        return;
    }

    if (path.indexOf('.') > 0)  {
        File file = SD.open((char *)path.c_str(), FILE_WRITE);
        if (file)	{
            // TODO Create file with 0 bytes???
            file.write(NULL, 0);

            file.close();
        }
    }  else  {
        SD.mkdir((char *)path.c_str());
    }
    returnOK();
}


void handleFileUpload()
{

    if (server.uri() != "/edit")  {
        return;
    };
    HTTPUpload &upload = server.upload();
    if (upload.status == UPLOAD_FILE_START)  {
        if (SD.exists((char *)upload.filename.c_str()))    {
            SD.remove((char *)upload.filename.c_str());
        };
        uploadFile = SD.open(upload.filename.c_str(), FILE_WRITE);
        Serial.print(F("Upload: START, filename: "));
        Serial.println(upload.filename);
    } else if (upload.status == UPLOAD_FILE_WRITE)  {
        if (uploadFile)    {
            uploadFile.write(upload.buf, upload.currentSize);
        };
        Serial.print(F("Upload: WRITE, Bytes: "));
        Serial.println(upload.currentSize);
    }
    else if (upload.status == UPLOAD_FILE_END)  {
        if (uploadFile)    {
            uploadFile.close();
        };
        Serial.print(F("Upload: END, Size: "));
        Serial.println(upload.totalSize);
    }
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

    //server.on("/", handleRoot);
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
