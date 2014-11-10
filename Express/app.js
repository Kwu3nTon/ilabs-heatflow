var express = require('express');
var fs = require('fs');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mqtt = require('mqtt');
var mqtt_port = 1883;
var mqtt_url = 'winter.ceit.uq.edu.au';

var portName = "/dev/ttyAMA0";
var SerialPort = require("serialport").SerialPort;

function serial_listener(debug) {
	var receivedData = "";
	serialPort = new SerialPort(portName, {
		baudrate: 9600
    	});
 
    	serialPort.on("open", function () {
	      console.log('Serial communication opened');
	         // Listens to incoming data
	      serialPort.on('data', function(data) { 
		var receivedData = data.toString();
		//console.log("Received data " + receivedData);
	      	if (receivedData.indexOf('S') >= 0 && receivedData.indexOf('T') >= 0) {
			console.log("Received data " + data.toString());
			receivedTemp1 = receivedData.substring(receivedData.indexOf('S')+1,receivedData.indexOf('T'));
			receivedTemp2 = receivedData.substring(receivedData.indexOf('T')+1);
			var client = mqtt.createClient(mqtt_port, mqtt_url);
			client.on('connect', function() {
				//console.log("MQTT client connected");
				client.publish('fan', fan_speed.toString());
				client.publish('heater', heater_temp.toString());
				client.publish('sensor1', receivedTemp1);
				client.publish('sensor2', receivedTemp2);
				//console.log("Published sensor 1");
			});
		} 
	     });  
    	})
};


var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// Initialisation of variables
var fan_speed = 300;
var heater_temp = 25;
var sensor1 = 0;
var sensor2;
var turnonoff = 0;
var status;
var led = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);
var debug = require('debug')('ilabs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.get('/', function(req,res) {
	res.render('index', { 
		subtitle: 'Home'
	});
});

app.get('/heatflow', function(req,res) {
	res.render('heatflow', { 
		subtitle: 'Heat Flow Experiment',
		fan_speed: fan_speed.toString(),
		heater_temp: heater_temp.toString(),
		status: status
	});
});

/*************************** MQTT Publish ********************************/

app.post('/heatflow/status/publish', function(req, res) {
	if (turnonoff == 0) {
		status = "on";
		turnonoff = 1;
		var heatflowStart = fs.readFileSync('espruino/heatflowstart.txt').toString();		
		serialPort.write(heatflowStart);
	} else {
		status = "off";
		turnonoff = 0;
		var heatflowStop = fs.readFileSync('espruino/heatflowstop.txt').toString();		
		serialPort.write(heatflowStop);	
	}
	publish('status', status, req, res);
});

app.post('/heatflow/fan/publish/up', function(req, res) {
	if (turnonoff == 1) {
		fan_speed = fan_speed + 10;
		if (fan_speed > 500) fan_speed = 500;
	}
	serialPort.write(
		'var percentageRPM = ' + fan_speed.toString() + '/500;\n' +
		'analogWrite(B8, percentageRPM);\n'
	);
	publish('fan', fan_speed.toString(), req, res);
});

app.post('/heatflow/fan/publish/down', function(req, res) {
	if (turnonoff == 1) {
		fan_speed = fan_speed - 10;
		if (fan_speed < 0) fan_speed = 0;
	}
	serialPort.write(
		'var percentageRPM = ' + fan_speed.toString() + '/500;\n' +
		'analogWrite(B8, percentageRPM);\n'
	);
	publish('fan', fan_speed.toString(), req, res);
});

app.post('/heatflow/heater/publish/up', function(req, res) {
	if (turnonoff == 1) {
		heater_temp = heater_temp + 5;
		if (heater_temp > 35) heater_temp = 35;
	}
	serialPort.write(
		'var percentageTMP = ' + heater_temp.toString() + '/35;\n' +
		'analogWrite(B9, percentageTMP);\n'
	);
	publish('heater', heater_temp.toString(), req, res);
});

app.post('/heatflow/heater/publish/down', function(req, res) {
	if (turnonoff == 1) {
		heater_temp = heater_temp - 5;
		if (heater_temp < 0) heater_temp = 0;
	}
	serialPort.write(
		'var percentageTMP = ' + heater_temp.toString() + '/35;\n' +
		'analogWrite(B9, percentageTMP);\n'
	);
	publish('heater', heater_temp.toString(), req, res);
});


function publish(topic, message, req, res) {
	var client = mqtt.createClient(mqtt_port, mqtt_url);
	client.on('connect', function() {
		//console.log("MQTT client connected");
		client.publish(topic, message, function() {
			console.log("Published '"+ message + "' from '" + topic + "'");
			client.end();
			res.writeHead(204, { 'Connection': 'keep-alive' });
			res.end();
		});
	});
}

/*************************** MQTT Subscribe ********************************/

app.get('/heatflow/fan/subscribe', function(req, res) {
	subscribe('fan',req, res);
});

app.get('/heatflow/status/subscribe', function(req, res) {
	subscribe('status',req, res);
});

app.get('/heatflow/heater/subscribe', function(req, res) {
	subscribe('heater',req, res);
});

app.get('/heatflow/sensor1/subscribe', function(req, res) {
	subscribe('sensor1',req, res);
});

app.get('/heatflow/sensor2/subscribe', function(req, res) {
	subscribe('sensor2',req, res);
});

app.get('/heatflow/sensor3/subscribe', function(req, res) {
	subscribe('sensor3',req, res);
});


function subscribe(Rtopic,req, res) {

	// set timeout as high as possible
	req.socket.setTimeout(Infinity);

	// send headers for event-stream connection
	// see spec for more information
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	res.write('\n');

	// Timeout timer, send a comment line every 20 sec
	var timer = setInterval(function() {
		res.write(':' + '\n');
	}, 20000);
	//console.log("Get the incoming data");
	var client = mqtt.createClient(mqtt_port, mqtt_url);
	client.on('connect', function() {
		//console.log("MQTT client connected");
		client.subscribe(Rtopic, function() {
			client.on('message', function(topic, message) {
				console.log("Received '" + message + "' on '" + topic + "'");
				res.write('data:' + message + '\n\n');
			});
		});
	});
	// When the request is closed, e.g. the browser window
	// is closed. We search through the open connections
	// array and remove this connection.
	req.on("close", function() {
		clearTimeout(timer);
		client.end();
    	});

}

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

// startup everything
http.createServer(app).listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
	app.get('port') + '; press Ctrl-C to terminate...' );
	//client = mqtt.createClient(1883, 'winter.ceit.uq.edu.au', {keepalive: 10000});
	//console.log('MQTT Connected: http://winter.ceit.uq.edu.au:1883');
});
serial_listener(debug);