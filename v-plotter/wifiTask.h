TaskHandle_t wifiHandle = NULL;
int wifiCore = 0;


#include <WiFi.h>
#include <ESPmDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <DNSServer.h>



struct
{
  char ssid[32] = "";
  char psk[32] = "";
  boolean dns = false;
  boolean ota = false;
  int aps = 0;
  String staMessage = "";
} WIFI;

// DNS server
const byte DNS_PORT = 53;
DNSServer dnsServer;

/* Soft AP network parameters */
IPAddress apIP(192, 168, 4, 1);

char IOTname[64];

// network port for PG Server
WiFiServer PGserver(12345);
WiFiClient PGclient;


//--------------------------------------------
void wifiAP(){

  WiFi.mode(WIFI_AP_STA);

  WiFi.softAP(IOTname, "1234567890");

  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", apIP);

  WIFI.dns = true;

  Serial.printf("AP started: %s (192.168.4.1)\n", IOTname);
}

//--------------------------------------------
void wifiSTA(){
  // adding a new STA

  WiFi.mode(WIFI_AP_STA);

  WiFi.begin(WIFI.ssid, WIFI.psk);

  WiFi.waitForConnectResult();

  Serial.printf(" SSID: %s PSK: %s\n", WIFI.ssid, WIFI.psk);
  Serial.printf(" WiFi STA error: %d\n", WiFi.status());
}

//--------------------------------------------
void wifiReconnect(){
  // reconnecting to a previous STA

  WiFi.mode(WIFI_AP_STA);
  WiFi.reconnect();
  WiFi.waitForConnectResult();

  // it should do the MDNS and Time stuff too...?
  // maybe not. if boot STA, add AP, then reconnect, don't need to...
  //            if boot AP, then reconnect STA, need, but eh, not likely.
  // I guess I'll just leave it that MDNS/time only started when boot STA
}

//--------------------------------------------
void wifiOTA(){
  if (WIFI.ota && (WiFi.status() == WL_CONNECTED)){
    ArduinoOTA.handle();
  }
}

//--------------------------------------------
void wifiDNS(){
  if (WIFI.dns){
    dnsServer.processNextRequest();
  }
}

//--------------------------------------------
// task
//--------------------------------------------
void wifi(void *pvParameters){
  (void)pvParameters;

  Serial.print("wifi task: Executing on core ");
  Serial.println(xPortGetCoreID());

  for (;;){
    // ArduinoOTA.handle();
    wifiOTA();
    wifiDNS();

    // RemoteDebug handle
    //Debug.handle();

    wifiCore = xPortGetCoreID();
    vTaskDelay(109 / portTICK_PERIOD_MS);
  }
}

//--------------------------------------------
//--------------------------------------------
void wifiTaskCreate(){

  strncpy(IOTname, strrchr(fileName, '/') ? strrchr(fileName, '/') + 1 : fileName, sizeof(IOTname) - 1);
  IOTname[strcspn(IOTname, ".")] = '\0';
  Serial.printf("IOTname: %s\n", IOTname);

  // WIFI setup
  WiFi.hostname(IOTname);
  WiFi.persistent(true);      // ESP32 onlyreads persistent at initialization !? (unlike ESP8266)
  //WiFi.setAutoConnect(false); // don't connect until I tell you to!
  WiFi.setAutoReconnect(true);
  WiFi.mode(WIFI_STA);

  WiFi.begin(); // use ssid/password from storage.

  if (WiFi.waitForConnectResult() == WL_CONNECTED){

    MDNS.begin(IOTname);
    MDNS.addService("http", "tcp", 80);

    ArduinoOTA.setHostname(IOTname);
    ArduinoOTA.begin();
    WIFI.ota = true;

    // start PG Server network connection
    PGserver.begin();
    PGclient = PGserver.available();

    Serial.println(" ");
  }else
  {
    Serial.printf("-----------------------------------------------------------------------\n");
    Serial.printf("| WiFi setup error: %d                                                 |\n", WiFi.status());
    Serial.printf("| SSID: %s PSK: %s                                                        |\n", WiFi.SSID().c_str(), WiFi.psk().c_str());
    Serial.printf("| Unable to connect, setting up Access Point: %s (192.168.4.1) |\n", IOTname);
    Serial.printf("| Deshabilite datos moviles y conectese al WIFI v-plotter             |\n", WiFi.status());
    Serial.printf("| Utilice el password '1234567890' para conectarse                 |\n");
    Serial.printf("| Abra un navegador y ponga la URL 192.168.4.1/config                 |\n");
    Serial.printf("| Ingrese el ssid y pass de su wifi y guarde los cambios              |\n");
    Serial.printf("| Si todo esta bien el v-plotter ya estara conectado a su wifi        |\n");
    Serial.printf("-----------------------------------------------------------------------\n");

    wifiAP();
  }

  Serial.print("WiFi started... IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  xTaskCreate(wifi, "WiFi", 5000, NULL, 1, &wifiHandle);
}
