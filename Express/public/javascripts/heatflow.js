var fan = new EventSource('/heatflow/fan/subscribe');
var heater = new EventSource('/heatflow/heater/subscribe');
var sensor1 = new EventSource('/heatflow/sensor1/subscribe');
var sensor2 = new EventSource('/heatflow/sensor2/subscribe');
var sensor3 = new EventSource('/heatflow/sensor3/subscribe');
var currentspeed = 300;
var currenttemperature = 0;
var data_fan_sensor1 = [];
var data_fan_sensor2 = [];
var data_fan_sensor3 = [];
var data_heater_sensor1 = [];
var data_heater_sensor2 = [];
var data_heater_sensor3 = [];
var status = document.getElementById("status").value;

fan.onmessage = function(e) { 
	currentspeed = parseInt(e.data);
	document.getElementById("fanspeedfield").value = e.data;
}
heater.onmessage = function(e) { 
	currenttemperature = parseInt(e.data);
	document.getElementById("heatertempfield").value = e.data;
}
sensor1.onmessage = function(e) {
	if (status == "on") {
		var value = parseInt(e.data);
		data_fan_sensor1.push({x: currentspeed, y: value});
		chartfan();
		data_heater_sensor1.push({x: currenttemperature, y: value});
		chartheater();
	}
}
sensor2.onmessage = function(e) {
	if (status == "on") {
		var value = parseInt(e.data);
		data_fan_sensor2.push({x: currentspeed, y: value});
		chartfan();
		data_heater_sensor2.push({x: currenttemperature, y: value});
		chartheater();
	}
}
sensor3.onmessage = function(e) {
	if (status == "on") {
		var value = parseInt(e.data);
		data_fan_sensor3.push({x: currentspeed, y: value});
		chartfan();
		data_heater_sensor3.push({x: currenttemperature, y: value});
		chartheater();
	}
}

$("#on").click(function () {
	$.post('/heatflow/status/publish');
	document.getElementById('on').style.display = "none";
	document.getElementById('off').style.display = "block";
	status = "on";
})
$("#off").click(function () {
	$.post('/heatflow/status/publish');
	document.getElementById('off').style.display = "none";
	document.getElementById('on').style.display = "block";
	status = "off";
})
$("#publishfanspeedup").click(function () {
	$.post('/heatflow/fan/publish/up');
})
$("#publishfanspeeddown").click(function () {
	$.post('/heatflow/fan/publish/down');
})
$("#publishheatertempup").click(function () {
	$.post('/heatflow/heater/publish/up');
})
$("#publishheatertempdown").click(function () {
	$.post('/heatflow/heater/publish/down');
})

function chartfan() {
    var chart = new CanvasJS.Chart("chartfan");
	
	chart.options.axisX = {title: "Fan speed (RPM)" };
	chart.options.axisY = {title: "Sensors temperature", suffix: "°C" };
    chart.options.title = { text: "Temperature of sensors related to the fan speed" };
	
	var sensor1 = {
		type: "line",
		name: "Sensor 1",
		showInLegend: true
	};
	sensor1.dataPoints = data_fan_sensor1;
	
	var sensor2 = {
		type: "line",
		name: "Sensor 2",
		showInLegend: true
	};
	sensor2.dataPoints = data_fan_sensor2;
	
	var sensor3 = {
		type: "line",
		name: "Sensor 3",
		showInLegend: true
	};
	sensor3.dataPoints = data_fan_sensor3;

    chart.options.data = [];
    chart.options.data.push(sensor1);
	chart.options.data.push(sensor2);
	chart.options.data.push(sensor3);
	
	chart.render();
}

function chartheater() {
    var chart = new CanvasJS.Chart("chartheater");
	
	chart.options.axisX = {title: "Temperature of the heater", suffix: "°C" };
	chart.options.axisY = {title: "Sensors temperature", suffix: "°C" };
    chart.options.title = { text: "Temperature of sensors related to the temperature of the heater" };
	
	var sensor1 = {
		type: "line",
		name: "Sensor 1",
		showInLegend: true
	};
	sensor1.dataPoints = data_heater_sensor1;
	
	var sensor2 = {
		type: "line",
		name: "Sensor 2",
		showInLegend: true
	};
	sensor2.dataPoints = data_heater_sensor2;
	
	var sensor3 = {
		type: "line",
		name: "Sensor 3",
		showInLegend: true
	};
	sensor3.dataPoints = data_heater_sensor3;

    chart.options.data = [];
    chart.options.data.push(sensor1);
	chart.options.data.push(sensor2);
	chart.options.data.push(sensor3);
	
	chart.render();
}

function hidden() {
	if (document.getElementById("status").value == "on") {
		document.getElementById('on').style.display = "none";
		document.getElementById('off').style.display = "block";
	} else {
		document.getElementById('off').style.display = "none";
		document.getElementById('on').style.display = "block";
	}
	document.getElementById("fanspeedfield").readOnly = true;
	document.getElementById("heatertempfield").readOnly = true;
}	

window.onload(chartfan(),chartheater(), hidden());