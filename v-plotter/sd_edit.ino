
#include <SD.h>

File uploadFile;


#define TIPO_DATO_TEXTO_JSON "text/json"
#define DURACION_CACHE_HTTP 31536000       // 86400=1 dia,  31536000=1 anio
boolean cachear = false;


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



/*
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
}*/
