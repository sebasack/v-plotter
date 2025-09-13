
/**
*  Polargraph Server for ESP32 based microcontroller boards.
*  Written by Sandy Noble
*  Released under GNU License version 3.
*  http://www.polargraph.co.uk
*  https://github.com/euphy/polargraph_server_polarshield_esp32
*  https://github.com/euphy/polargraph/wiki
*  https://github.com/obstruse/PGNH/tree/main



This version is for the Polarshield 3, which aggregates:

  * ESP32 DOIT-DEVKIT V1 
  * 2x UNL2003 stepper drivers   
  * SD card reader     

**/

char fileName[] = __FILE__;
char temp[1000];



#include "wifiTask.h"
#include "httpTask.h"
#include "httpWifiTask.h"
// #include "commsTask.h"

#include <SD.h>
#include "FS.h"
#include "SPIFFS.h"
#include <SPI.h>
// #include <TFT_eSPI.h> // Hardware-specific library

#include <AccelStepper.h>
#include <MultiStepper.h>
#include <ESP32Servo.h>

#include <Preferences.h>



/*
Avoid global variables whenever possible...
*/

/* Definition of a function that can be attached to a Button Specification
and will get executed when the button is pushed..
*/
// typedef int (*button_Action) (int buttonId);


// 2D coordinates struct
typedef struct
{
  long x;
  long y;
} Coord2D;

typedef struct
{
  Coord2D pos;
  Coord2D size;
} Rectangle;


/*  ===========================================================
         CONFIGURATION!!
    =========================================================== */

/*  ===========================================================
         Define what kind of driver breakout you're using.
         (By commenting out the one's you _haven't_ got.)
    =========================================================== */
#ifndef MOTHERBOARD
// #define MOTHERBOARD NODEMCU32S
// #define MOTHERBOARD POLARSHIELD
// #define MOTHERBOARD RAMPS14
// #define MOTHERBOARD TFTSHIELD

#define MOTHERBOARD ESP32_UNL2003

#endif

// #define POLARSHIELD 1
// #define RAMPS14 2
// #define TFTSHIELD 3
// #define NODEMCU32S 4
#define ESP32_UNL2003 5

/*  ===========================================================
    Control whether to look for touch input or update LCD
    Comment this out if you DON'T have an LCD connected
=========================================================== */
// #define USE_LCD

/*  ===========================================================
    Some debugging flags
=========================================================== */

// #define DEBUG_COMMS
// #define DEBUG_COMMS_BUFF
//  #define DEBUG_PENLIFT
//  #define DEBUG_STEPRATE

boolean debugComms = false;

// Set REPEAT_CAL to true instead of false to run calibration
// again, otherwise it will only be done once.
// Repeat calibration if you change the screen rotation.
#define REPEAT_CAL false

/*  ===========================================================
    These variables are common to all polargraph server builds
=========================================================== */

const String FIRMWARE_VERSION_NO = "2.3.0";


#if MOTHERBOARD == RAMPS14
const String MB_NAME = "RAMPS14";
#elif MOTHERBOARD == NODEMCU32S
const String MB_NAME = "NODEMCU32S";
#elif MOTHERBOARD == POLARSHIELD
const String MB_NAME = "POLARSHIELD";
#elif MOTHERBOARD == TFTSHIELD
const String MB_NAME = "TFTSHIELD";
#elif MOTHERBOARD == ESP32_UNL2003
const String MB_NAME = "ESP32_UNL2003";
#endif

/*  ===========================================================
    Preferences is the way to store non-volatile values in ESP32.
=========================================================== */

Preferences preferences;

// Pen raising servo , CAMBIAR DESDE POLARGRAPH!!
Servo penHeight;
const int DEFAULT_DOWN_POSITION =90;//90
const int DEFAULT_UP_POSITION = 123;//180
static int upPosition = DEFAULT_UP_POSITION;
static int downPosition = DEFAULT_DOWN_POSITION;
static int penLiftSpeed = 3; // ms between steps of moving motor
#if MOTHERBOARD == RAMPS14
#define PEN_HEIGHT_SERVO_PIN 4
#elif MOTHERBOARD == POLARSHIELD
#define PEN_HEIGHT_SERVO_PIN 9
#elif MOTHERBOARD == NODEMCU32S
#define PEN_HEIGHT_SERVO_PIN 22
#elif MOTHERBOARD == ESP32_UNL2003
#define PEN_HEIGHT_SERVO_PIN 15
#endif
boolean isPenUp = false;

// working machine specification
const long DEFAULT_MACHINE_WIDTH = 882;
const long DEFAULT_MACHINE_HEIGHT = 1100;
const float DEFAULT_MM_PER_REV = 125.66;
const int DEFAULT_STEPS_PER_REV = 4076;
const int DEFAULT_STEP_MULTIPLIER = 8; // mas chico tiene menos resolucion

static int motorStepsPerRev = DEFAULT_STEPS_PER_REV;
static float mmPerRev = DEFAULT_MM_PER_REV;
static int stepMultiplier = DEFAULT_STEP_MULTIPLIER;

static Coord2D machineSizeMm = {DEFAULT_MACHINE_WIDTH, DEFAULT_MACHINE_HEIGHT};

 // float startLength = ((float) startLengthMM / (float) mmPerRev) * (float) motorStepsPerRev;
 //                   =         484,23238223   /   125.66          * 4076
 //                   =                   15704.828
static long startLengthStepsA = 125312;// 15664 * 8
static long startLengthStepsB = 125312;// 15664 * 8

const float DEFAULT_MAX_SPEED = 1000.0;
const float DEFAULT_ACCELERATION = 400.0;
float currentMaxSpeed = DEFAULT_MAX_SPEED;
static float currentAcceleration = DEFAULT_ACCELERATION;
volatile static boolean usingAcceleration = true;

float mmPerStep = mmPerRev / (stepMultiplier * motorStepsPerRev);
float stepsPerMm = (stepMultiplier * motorStepsPerRev) / mmPerRev;

static Coord2D machineSizeSteps = {(long)((float)machineSizeMm.x * stepsPerMm), (long)((float)machineSizeMm.y *stepsPerMm)};
static long maxLength = 0;

const float DEFAULT_PEN_WIDTH = 0.5f;//0.f8
static float penWidth = DEFAULT_PEN_WIDTH; // line width in mm

/*==========================================================================
    COMMUNICATION PROTOCOL, how to chat
  ========================================================================*/

// max length of incoming command
const int INLENGTH = 90;
const char INTERMINATOR = 10;
const char SEMICOLON = 59;

// static char currentCommand[INLENGTH+1];
char currentCommand[INLENGTH + 1];
char currentCommandRaw[INLENGTH + 1];

static char inCmd[10];
static char inParam1[20];
static char inParam2[20];
static char inParam3[20];
static char inParam4[20];
static byte inNoOfParams = 0;
boolean paramsExtracted = false;
// boolean usingCrc = false;

boolean reportingPosition = true;
// boolean requestResend = false;
// boolean checkingForReceivedCommand = false;

#define OUT_CMD_SYNC_STR "SYNC,"

char MSG_ERROR_STR[] = "MSG,E,";
char MSG_INFO_STR[] = "MSG,I,";
char MSG_DEBUG_STR[] = "MSG,D,";
char MSG_COMPLETE_STR[] = "MSG,C:";

// period between status rebroadcasts
// unsigned long comms_rebroadcastStatusInterval =4000;// estaba en 4000
// Chrono broadcastStatusChrono;

/*==========================================================================
    MOTOR interfaces
  ========================================================================*/

extern AccelStepper motorA;
extern AccelStepper motorB;

volatile boolean currentlyRunning = true;
volatile boolean backgroundRunning = false;

volatile long lastOperationTime = 0L;
static long motorIdleTimeBeforePowerDown = 30000L; // 30000=30 seg
static boolean automaticPowerDown = true;
volatile long lastInteractionTime = 0L;

// Pixel drawing
static boolean pixelDebug = true;
static boolean lastWaveWasTop = true;

//  Drawing direction
const static byte DIR_NE = 1;
const static byte DIR_SE = 2;
const static byte DIR_SW = 3;
const static byte DIR_NW = 4;

const static byte DIR_N = 5;
const static byte DIR_E = 6;
const static byte DIR_S = 7;
const static byte DIR_W = 8;

static int globalDrawDirection = DIR_NW;

const static byte DIR_MODE_AUTO = 1;
const static byte DIR_MODE_PRESET = 2;
const static byte DIR_MODE_RANDOM = 3;
static int globalDrawDirectionMode = DIR_MODE_AUTO;

static const byte ALONG_A_AXIS = 0;
static const byte ALONG_B_AXIS = 1;
static const byte SQUARE_SHAPE = 0;
static const byte SAW_SHAPE = 1;

// Command names
const static char COMMA[] = ",";
const static char CMD_END[] = ",END";
const static String CMD_CHANGELENGTH = "C01";
const static String CMD_SETPENWIDTH = "C02";
const static String CMD_DRAWPIXEL = "C05";
const static String CMD_DRAWSCRIBBLEPIXEL = "C06";
const static String CMD_CHANGEDRAWINGDIRECTION = "C08";
const static String CMD_SETPOSITION = "C09";
const static String CMD_TESTPATTERN = "C10";
const static String CMD_TESTPENWIDTHSQUARE = "C11";
const static String CMD_PENDOWN = "C13";
const static String CMD_PENUP = "C14";
const static String CMD_CHANGELENGTHDIRECT = "C17";
const static String CMD_SETMACHINESIZE = "C24";
const static String CMD_SETMACHINENAME = "C25";
const static String CMD_GETMACHINEDETAILS = "C26";
const static String CMD_RESETEEPROM = "C27";
const static String CMD_SETMACHINEMMPERREV = "C29";
const static String CMD_SETMACHINESTEPSPERREV = "C30";
const static String CMD_SETMOTORSPEED = "C31";
const static String CMD_SETMOTORACCEL = "C32";
const static String CMD_SETMACHINESTEPMULTIPLIER = "C37";
const static String CMD_SETPENLIFTRANGE = "C45";
const static String CMD_PIXELDIAGNOSTIC = "C46";
const static String CMD_SET_DEBUGCOMMS = "C47";

// Instrumentation about running background motor tasks
volatile DRAM_ATTR long runCounter = 0L;
volatile DRAM_ATTR long lastPeriodStartTime = 0L;
volatile DRAM_ATTR long sampleBuffer[3] = {0L, 0L, 0L};
volatile DRAM_ATTR int sampleBufferSlot = 0;
volatile DRAM_ATTR long totalTriggers = 0L;
volatile DRAM_ATTR long totalSamplePeriods = 0L;
volatile DRAM_ATTR long steppedCounter = 0L;
volatile DRAM_ATTR long steppedBuffer[3] = {0L, 0L, 0L};
volatile DRAM_ATTR boolean aStepped = false;
volatile DRAM_ATTR boolean bStepped = false;

SemaphoreHandle_t xMutex;

// Ticker commsRunner;

/*===========================================================
    These variables are for the polarshield
=========================================================== */

const static String CMD_TESTPENWIDTHSCRIBBLE = "C12";
const static String CMD_DRAWSAWPIXEL = "C15,";
const static String CMD_DRAWCIRCLEPIXEL = "C16";
const static String CMD_SET_ROVE_AREA = "C21";
const static String CMD_DRAWDIRECTIONTEST = "C28";
const static String CMD_MODE_STORE_COMMANDS = "C33";
const static String CMD_MODE_EXEC_FROM_STORE = "C34";
const static String CMD_MODE_LIVE = "C35";
const static String CMD_RANDOM_DRAW = "C36";
const static String CMD_START_TEXT = "C38";
const static String CMD_DRAW_SPRITE = "C39";
const static String CMD_CHANGELENGTH_RELATIVE = "C40";
const static String CMD_SWIRLING = "C41";
const static String CMD_DRAW_RANDOM_SPRITE = "C42";
const static String CMD_DRAW_NORWEGIAN = "C43";
const static String CMD_DRAW_NORWEGIAN_OUTLINE = "C44";
const static String CMD_AUTO_CALIBRATE = "C48";

/*  End stop pin definitions  */
// there are no endstop switches, so this and the calibrate can be removed
const int ENDSTOP_MOTORA_PIN = 34;
const int ENDSTOP_MOTORB_PIN = 35;

long limitStepsMotorA = 0;
long limitStepsMotorB = 0;


// size and location of rove area
Rectangle roveAreaMm = {200, 120, 210, 297};
Rectangle roveAreaSteps = {
    (long)((float)roveAreaMm.pos.x * stepsPerMm), (long)((float)roveAreaMm.pos.y *stepsPerMm),
    (long)((float)roveAreaMm.size.x *stepsPerMm), (long)((float)roveAreaMm.size.y *stepsPerMm)};

boolean swirling = false;
String spritePrefix = "";
int textRowSize = 200;
int textCharSize = 180;

boolean useRoveArea = false;

int commandNo = 0;
int errorInjection = 0;

boolean storeCommands = false;
boolean drawFromStore = false;
String commandFilename = "";

// sd card stuff
const int sdChipSelectPin = 05;
//boolean sdCardInit = false;

// set up variables using the SD utility library functions:
File root;
boolean cardPresent = false;
boolean cardInit = false;
boolean echoingStoredCommands = false;

// the file itself
File pbmFile;

// information we extract about the bitmap file
long pbmWidth, pbmHeight;
float pbmScaling = 1.0;
int pbmDepth, pbmImageoffset;
long pbmFileLength = 0;
float pbmAspectRatio = 1.0;

volatile int speedChangeIncrement = 100;
volatile int accelChangeIncrement = 100;
volatile float penWidthIncrement = 0.05;
volatile int moveIncrement = 400;

// buttons_actions.ino, impl_ps.ino, sd.ino
boolean currentlyDrawingFromFile = false;
String currentlyDrawingFilename = "";

// calibrate.ino, impl_ps.ino
boolean powerIsOn = false;
boolean isCalibrated = false;
boolean canCalibrate = false;

// Colour scheme
// As seen on http://www.barth-dev.de/online/rgb565-color-picker/
// uint16_t getAsRgb565(uint8_t red, uint8_t green, uint8_t blue){
//  return (((red & 0b11111000)<<8) + ((green & 0b11111100)<<3)+(blue>>3));
//}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
void setup(){
  Serial.begin(115200); // set up Serial library at 57600 bps
  Serial.println(F("\nPOLARGRAPH ON!"));
  Serial.print(F("v"));
  Serial.println(FIRMWARE_VERSION_NO);
  Serial.print(F("Hardware: "));
  Serial.println(MB_NAME);



  Serial.print(F("Servo pin: "));
  Serial.println(PEN_HEIGHT_SERVO_PIN);

  /*-----------------------------------------------------------------*/
  configuration_motorSetup();

  // Load configuration
  preferences.begin("polargraphsd", false);
  eeprom_loadMachineSpecFromEeprom();
  configuration_setup();

  /*-----------------------------------------------------------------*/
  Serial.println("create task: wifi");
  wifiTaskCreate();

  Serial.println("create task: http");
  httpTaskCreate();
  httpWifiTaskCreate();

  /*-----------------------------------------------------------------*/
  Serial.println("create task: commsRead"); // read command
  commsReadTaskCreate();

  Serial.println("create task: commsCommand"); // execute command
  commsCommandTaskCreate();

  Serial.println("create task: releaseMotors"); // chequea si tiene que desenergizar motores
  implReleaseMotorsCreate();

//  Serial.println("create task: externalControl"); // tarea que maneja el control externo de los motores
  //externalControlCreate();


//  Serial.println("create task: remoteDebug"); // actualiza debug
//  Serial.remoteDebugCreate();

  //*-----------------------------------------------------------------*/
  // set the pen lift, raise it to begin.
  pinMode(PEN_HEIGHT_SERVO_PIN, OUTPUT);
  delay(200);
  penlift_penUp();

  /* set endstop motors pins */
  pinMode(ENDSTOP_MOTORA_PIN, INPUT_PULLUP);
  pinMode(ENDSTOP_MOTORB_PIN, INPUT_PULLUP);

  sd_autorunSD();
}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
void loop(){
  // vTaskDelete(NULL);
  vTaskDelay(portMAX_DELAY);

  
}
