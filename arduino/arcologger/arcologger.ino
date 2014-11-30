#include <WiFi.h>
#include "SPI.h"

WiFiClient client;

char ssid[] = "Arconet";     //  your network SSID (name)

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

  while(!client.connected()){
    client.stop();
    client.connect("awesomegraphs.com", 80);
  }  

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
    String tosend = "payload=" + payload;

//    Serial.print("string building: ");
//    Serial.println(millis()-last);
    last = millis();
    
    
    char payloadChar[payload.length()+1];
    payload.toCharArray(payloadChar, payload.length()+1);
    
//    Serial.print("string to char: ");
//    Serial.println(millis()-last);
    last = millis();
    
    //curl -X POST -d 'payload=[[725,725,726],[492,492,493],[0,0,1],[482,482,483],[480,480,480]]' http://awesomegraphs.com/test.json    
    client.println("POST /save.json HTTP/1.1");
    client.println("Host: www.awesomegraphs.com");    
    client.println("Content-type: application/x-www-form-urlencoded");
    client.println("User-Agent: Arduino/1.0");
    client.print("Content-length: ");
    client.println(tosend.length());
    client.println();
    client.print(tosend);

   Serial.println(payload);
   Serial.println(freeRam());
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

int freeRam () {
  extern int __heap_start, *__brkval; 
  int v; 
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval); 
}
