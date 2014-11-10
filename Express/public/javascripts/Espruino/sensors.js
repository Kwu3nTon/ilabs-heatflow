/*var ow1 = new OneWire(A1);
var sensor1 = require("DS18B20").connect(ow1);
var temp1 = sensor1.getTemp();

var ow2 = new OneWire(A2);
var sensor2 = require("DS18B20").connect(ow2);
var temp2 = sensor2.getTemp();

var ow3 = new OneWire(A3);
var sensor3 = require("DS18B20").connect(ow3);
var temp3 = sensor3.getTemp();*/

var ow = new OneWire(A1);
var sensor1 = require("DS18B20").connect(ow, 0);
var sensor2 = require("DS18B20").connect(ow, 1);
var sensor3 = require("DS18B20").connect(ow, 2);
var sensors = [sensor1, sensor2, sensor3]; 

setInterval(function() {
  sensors.forEach(function (sensor, index) {
    console.log(index + ": " + sensor.getTemp());
  });
}, 1000);