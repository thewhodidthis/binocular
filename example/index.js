(function () {
'use strict';

var animate = function (callback, count) {
  if ( count === void 0 ) count = 1;

  var frameId;

  var play = function (fn) { return window.requestAnimationFrame(fn); };
  var stop = function () { return window.cancelAnimationFrame(frameId); };
  var loop = function () {
    if (frameId % count === 0) {
      callback(frameId);
    }

    if (frameId) {
      frameId = play(loop);
    }
  };

  // Toggle
  return function () {
    frameId = (frameId === undefined) ? play(loop) : stop();

    return frameId
  }
};

var TAU = Math.PI * 2;
var deg = TAU / 360;



var radial = function (source, target) {
  var count = source.frequencyBinCount;
  var ref = target.canvas;
  var w = ref.width;
  var h = ref.height;

  var steps = 360 / count;
  var halfH = h * 0.5;
  var halfW = w * 0.5;

  var r = h * 0.325;
  var f = (h - r) / 256;

  return function (values) {
    target.save();
    target.clearRect(0, 0, w, h);
    target.translate(halfW, halfH);
    target.rotate(-0.25 * TAU);

    for (var i = 0; i < count; i += 1) {
      var angle = i * steps * deg;
      var v = f * values[i];

      var r1 = r - (v * 0.25);
      var r2 = r + (v * 0.25);
      var x1 = r1 * Math.cos(angle);
      var y1 = r1 * Math.sin(angle);
      var x2 = r2 * Math.cos(angle);
      var y2 = r2 * Math.sin(angle);

      target.beginPath();
      target.moveTo(x1, y1);
      target.lineTo(x2, y2);
      target.stroke();
    }

    target.restore();
  }
};

var monocle = function () {
  var param = [], len = arguments.length;
  while ( len-- ) param[ len ] = arguments[ len ];

  var graph = radial;

  param.forEach(function (v, i) {
    if (typeof v === 'function') {
      param.splice(i, 1);
      graph = v;
    }
  });

  var input = param[0];
  var board = param[1];
  var pitch = param[2]; if ( pitch === void 0 ) pitch = false;
  var fftSize = param[3]; if ( fftSize === void 0 ) fftSize = 256;

  var audio = input.context;
  var scope = audio.createAnalyser();

  scope.fftSize = fftSize;

  var bins = scope.frequencyBinCount;
  var data = new Uint8Array(bins);

  var copy = function (d) { return (pitch ? scope.getByteFrequencyData(d) : scope.getByteTimeDomainData(d)); };
  var draw = graph(scope, board);

  input.connect(scope);

  return function (extra) {
    copy(data);
    draw(data, extra);

    return scope
  }
};

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audio = new AudioContext();
var fader = audio.createGain();

var store = [];
var total = 12;
var plier = Math.pow(2, 1 / total);

var play = function (frame) {
  var f = 20;

  for (var i = 0; i < total; i += 1) {
    if (store[i]) {
      store[i].stop();
    }

    var sound = audio.createOscillator();

    sound.frequency.value = f * Math.pow(plier, frame);
    sound.connect(fader);
    sound.start();

    store[i] = sound;

    f *= 2;
  }
};

fader.gain.value = 0;
fader.connect(audio.destination);

var master = document.querySelector('canvas').getContext('2d');
var board1 = document.createElement('canvas').getContext('2d');
var board2 = document.createElement('canvas').getContext('2d');

board1.strokeStyle = '#fff';

// Partials
var scope1 = monocle(fader, board1, true);

// Time domain
var scope2 = monocle(fader, board2);

var ref = master.canvas;
var width = ref.width;
var height = ref.height;

var draw = function () {
  scope1();
  scope2();

  master.clearRect(0, 0, width, height);
  master.fillRect(0, 0, 250, height);

  master.drawImage(board1.canvas, -25, 75);
  master.drawImage(board2.canvas, 225, 75);
};

var loop = animate(function (id) {
  if (id % 25 === 0) {
    play(id % total);
  }

  draw();
});

var firstRun = true;

var kick = audio.createOscillator();

var next = function () {
  // Quick iOS fix
  if (firstRun) {
    firstRun = kick.start();
  }

  var time = audio.currentTime;
  var busy = loop();

  if (busy === undefined) {
    fader.gain.setTargetAtTime(0, time, 0.25);
  } else {
    fader.gain.setTargetAtTime(1 / total, time, 1);
  }
};

document.addEventListener('DOMContentLoaded', draw);
document.addEventListener('click', next);

}());

