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



var radial = function (source, target, adjust) {
  var count = source.frequencyBinCount;
  var ref = target.canvas;
  var w = ref.width;
  var h = ref.height;

  var steps = 360 / count;
  var halfH = h * 0.5;
  var halfW = w * 0.5;

  // Figure out available space
  var d = Math.min(w, h);

  // Base radius
  var r = d * 0.325;

  // Precalculate multiplier
  var f = r * 0.5;

  return function (values) {
    target.clearRect(0, 0, w, h);

    target.save();
    target.translate(halfW, halfH);
    target.rotate(-0.25 * TAU);

    for (var i = 0; i < count; i += 1) {
      var angle = i * steps * deg;
      var v = values[i];
      var k = adjust(v) * f;

      var r1 = r - k;
      var r2 = r + k;
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

  // No matter where the callback in found in the arguments, at least specify these in order
  var input = param[0];
  var board = param[1];
  var pitch = param[2]; if ( pitch === void 0 ) pitch = false;
  var fftSize = param[3]; if ( fftSize === void 0 ) fftSize = 256;

  var audio = input.context;
  var scope = audio.createAnalyser();

  // Center values based on whether in the time or frequency domain (1 / 128 or 1 / 256)
  var scale = function (v) { return (pitch ? v * 0.00390625 : (v * 0.0078125) - 1); };

  scope.fftSize = fftSize;

  var bins = scope.frequencyBinCount;
  var data = new Uint8Array(bins);

  var copy = function (d) { return (pitch ? scope.getByteFrequencyData(d) : scope.getByteTimeDomainData(d)); };
  var draw = graph(scope, board, scale);

  input.connect(scope);

  return function (xtra) {
    copy(data);
    draw(data, xtra);

    return scope
  }
};

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audio = new AudioContext();
var fader = audio.createGain();

var store = [];
var total = 12;
var cents = 1 / total;
var plier = Math.pow(2, cents);

var play = function (frame) {
  var f = 20;

  for (var i = 0; i < total; i += 1) {
    var voice = store[i];

    if (voice) {
      voice.stop();
    }

    voice = audio.createOscillator();

    voice.frequency.value = f * Math.pow(plier, frame);
    voice.connect(fader);
    voice.start();

    store[i] = voice;

    f *= 2;
  }
};

fader.gain.value = 0;
fader.connect(audio.destination);

var master = document.querySelector('canvas').getContext('2d');
var board1 = document.createElement('canvas').getContext('2d');
var board2 = document.createElement('canvas').getContext('2d');

var ref = master.canvas;
var width = ref.width;
var height = ref.height;

var halfW = width * 0.5;
var jumpX = -25;
var jumpY = board1.canvas.height * 0.5;

board1.strokeStyle = '#fff';

// Partials
var scope1 = monocle(fader, board1, true);

// Time domain
var scope2 = monocle(fader, board2);

var draw = function () {
  scope1();
  scope2();

  master.clearRect(0, 0, width, height);
  master.fillRect(0, 0, halfW, height);

  master.drawImage(board1.canvas, jumpX, jumpY);
  master.drawImage(board2.canvas, halfW + jumpX, jumpY);
};

var loop = animate(function (id) {
  if (id % 25 === 0) {
    play(id % total);
  }

  draw();
});

var next = function () {
  var time = audio.currentTime;
  var busy = loop();

  if (busy === 1) {
    play(0);
  }

  if (busy === undefined) {
    fader.gain.setTargetAtTime(0, time, 0.125);
  } else {
    fader.gain.setTargetAtTime(cents, time, 1);
  }
};

document.addEventListener('DOMContentLoaded', draw);
document.addEventListener('click', next);

}());

