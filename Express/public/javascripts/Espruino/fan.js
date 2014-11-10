var FAN_SPEED_OUT = B8;
var FAN_SPEED_IN = B9;
var targetRPM = 300;

var fanDrive = 0.5;

function onFanMovement(e) { 
  var d = e.time-lastTime;
  lastTime = e.time;
  RPM = 60 / (d*2);
}

function onTimer() {
  if (RPM < targetRPM) {
    if (fanDrive<1) fanDrive += 0.01;
  } else {
    if (fanDrive>0) fanDrive -= 0.01;
  }
  //digitalWrite(LED1, fanDrive>0.5);
  analogWrite(FAN_SPEED_OUT, fanDrive);
}

setInterval(onTimer, 100);

//setWatch(onFanMovement, FAN_SPEED_IN, {repeat: true, edge: 'falling'});
