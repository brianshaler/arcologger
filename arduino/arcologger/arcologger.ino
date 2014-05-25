/*
 *                SSSSS  kk                            tt
 *               SS      kk  kk yy   yy nn nnn    eee  tt
 *                SSSSS  kkkkk  yy   yy nnn  nn ee   e tttt
 *                    SS kk kk   yyyyyy nn   nn eeeee  tt
 *                SSSSS  kk  kk      yy nn   nn  eeeee  tttt
 *                               yyyyy
 *
 * SkynetClient for http://skynet.im, OPEN COMMUNICATIONS NETWORK & API FOR
 * THE INTERNET OF THINGS.
 *
 * Works with ethernet shields compatible with EthernetClient library from
 * Arduino. If you don't know, grab the original
 * http://arduino.cc/en/Main/ArduinoEthernetShield
 *
 * Also requires the ArduinoJsonParser 
 * https://github.com/bblanchon/ArduinoJsonParser 
 *
 * This sketch is VERY big both in program space and ram.
 *
 * You will notice we're using F() in Serial.print. It is covered briefly on
 * the arduino print page but it means we can store our strings in program
 * memory instead of in ram.
 *
 * You can turn on debugging within SkynetClient.h by uncommenting
 * #define SKYNETCLIENT_DEBUG but note this takes up a ton of program space
 * which means you'll probably have to debug on a Mega
 */

#include <EEPROM.h>
#include <WiFi.h>
#include "SPI.h"
#include "SkynetClient.h"
#include <JsonParser.h>

#define TOUUID "f32daf50-c83b-11e3-aa24-e1cb42c326cd"

WiFiClient client;

SkynetClient skynetclient(client);

char ssid[] = "Arconet";     //  your network SSID (name)


char hostname[] = "skynet.im";
int port = 80;

int wifiStatus = WL_IDLE_STATUS;



int lightPin = A0;
int micPin = A1;
int tempPin1 = A2;
int tempPin2 = A3;

int power1 = 6;
int power2 = 8;
int power3 = 9;

int gnd = 5;

int sensorValue = 0;

int sampleCount = 0;
int samplesPerUpload = 500;

float lums[3] = {0, 0, 0};
float vols[3] = {0, 0, 0};
float wavs[3] = {0, 0, 0};
float tmps1[3] = {0, 0, 0};
float tmps2[3] = {0, 0, 0};

float audioAvg = 0;

unsigned long last = 0;


void setup()
{
  Serial.begin(9600);
  
  pinMode(power1, OUTPUT);
  digitalWrite(power1, HIGH);  
  pinMode(power2, OUTPUT);
  digitalWrite(power2, HIGH);  
  pinMode(power3, OUTPUT);
  digitalWrite(power3, HIGH);  
  
  pinMode(gnd, OUTPUT);
  digitalWrite(gnd, LOW);
  
  Serial.begin(115200);
  
  float initialSamples = 20;
  audioAvg = 0;
  for (int i = 0; i < initialSamples; i++) {
    audioAvg += float(analogRead(micPin)) / initialSamples;
    delay(10);
  }
}

void loop() {
  //last = millis();
  /**/
  while (wifiStatus != WL_CONNECTED) 
  {
    Serial.print(F("Attempting to connect to WPA SSID: "));
    Serial.println(ssid);

    wifiStatus = WiFi.begin(ssid); //begin WPA
    // status = WiFi.begin(ssid, keyIndex, key); //begin WEP
  }

  while(!skynetclient.monitor())
  {
    bool skynetStatus = false;
    do {
      skynetStatus = skynetclient.connect(hostname, port);
    } while (!skynetStatus);
    
    Serial.println(F("Connected!"));
    
    char uuid[UUIDSIZE];
  
    skynetclient.getUuid(uuid);
    Serial.print(F("uuid: "));
    Serial.println(uuid);
    
    skynetclient.getToken(uuid);
    Serial.print(F("token: "));
    Serial.println(uuid);   
  }
  /**/
  
  
  int lum = 1023 - analogRead(lightPin);
  int wav = analogRead(micPin);
  int vol = wav;
  int tmp1 = 1023 - analogRead(tempPin1);
  int tmp2 = 1023 - analogRead(tempPin2);
  
  //Serial.print("Reads: ");
  //Serial.println(millis()-last);
  last = millis();
  
  wav = abs(vol-audioAvg) * 2;
  
  lums[0] = (lums[0] * sampleCount + lum) / (sampleCount + 1);
  vols[0] = (vols[0] * sampleCount + vol) / (sampleCount + 1);
  wavs[0] = (wavs[0] * sampleCount + wav) / (sampleCount + 1);
  tmps1[0] = (tmps1[0] * sampleCount + tmp1) / (sampleCount + 1);
  tmps2[0] = (tmps2[0] * sampleCount + tmp2) / (sampleCount + 1);
  
  //Serial.print("Rolling avg: ");
  //Serial.println(millis()-last);
  last = millis();
  
  if (sampleCount == 0) {
    lums[1] = lums[2] = lum;
    vols[1] = vols[2] = vol;
    wavs[1] = wavs[2] = wav;
    tmps1[1] = tmps1[2] = tmp1;
    tmps2[1] = tmps2[2] = tmp2;
  } else {
    lums[1] = lums[1] > lum ? lum : lums[1];
    lums[2] = lums[2] < lum ? lum : lums[2];
    vols[1] = vols[1] > vol ? vol : vols[1];
    vols[2] = vols[2] < vol ? vol : vols[2];
    wavs[1] = wavs[1] > wav ? wav : wavs[1];
    wavs[2] = wavs[2] < wav ? wav : wavs[2];
    tmps1[1] = tmps1[1] > tmp1 ? tmp1 : tmps1[1];
    tmps1[2] = tmps1[2] < tmp1 ? tmp1 : tmps1[2];
    tmps2[1] = tmps2[1] > tmp2 ? tmp2 : tmps2[1];
    tmps2[2] = tmps2[2] < tmp2 ? tmp2 : tmps2[2];
  }
  //Serial.print("Min/Max: ");
  //Serial.println(millis()-last);
  last = millis();
  
  
  sampleCount++;
  if (sampleCount > samplesPerUpload) {
    String lumStr = "[" + String(int(lums[0])) + "," + String(int(lums[1])) + "," + String(int(lums[2])) + "]";
    String volStr = "[" + String(int(vols[0])) + "," + String(int(vols[1])) + "," + String(int(vols[2])) + "]";
    String wavStr = "[" + String(int(wavs[0])) + "," + String(int(wavs[1])) + "," + String(int(wavs[2])) + "]";
    String tmpStr1 = "[" + String(int(tmps1[0])) + "," + String(int(tmps1[1])) + "," + String(int(tmps1[2])) + "]";
    String tmpStr2 = "[" + String(int(tmps2[0])) + "," + String(int(tmps2[1])) + "," + String(int(tmps2[2])) + "]";
    String payload = "[" + lumStr + "," + volStr + "," + wavStr + "," + tmpStr1 + "," + tmpStr2 + "]";
    
//    Serial.print("string building: ");
//    Serial.println(millis()-last);
    last = millis();
    
    
    char payloadChar[payload.length()+1];
    payload.toCharArray(payloadChar, payload.length()+1);
    
//    Serial.print("string to char: ");
//    Serial.println(millis()-last);
    last = millis();
    
    skynetclient.sendMessage(TOUUID, payloadChar);
//    Serial.println(payload);
//    Serial.println(payloadChar);
//    Serial.println(audioAvg);
//    Serial.println("[" + lumStr + "," + volStr + "] " + String(sampleCount));
    
    audioAvg = (audioAvg * 4 + vols[0]) / 5;
    
    lums[0] = vols[0] = wavs[0] = tmps1[0] = tmps2[0] = 0;
    lums[1] = vols[1] = wavs[1] = tmps1[1] = tmps2[1] = -1;
    lums[2] = vols[2] = wavs[2] = tmps1[2] = tmps2[2] = -1;
    sampleCount = 0;
  }
}
