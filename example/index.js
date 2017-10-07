(function () {
'use strict';

var TAU = Math.PI * 2;



var radially = function (context) {
  var ref = context.canvas;
  var w = ref.width;
  var h = ref.height;

  var halfH = h * 0.5;
  var halfW = w * 0.5;

  // Available space
  var d = Math.min(w, h) * 0.75;

  // Base radius
  var r = d * 0.5;

  // Radial multiplier
  var f = r * 0.25;

  return function (values, weight) {
    var bins = values.length;
    var step = TAU / bins;

    context.clearRect(0, 0, w, h);

    context.save();
    context.translate(halfW, halfH);
    context.rotate(-0.25 * TAU);

    for (var i = 0; i < bins; i += 1) {
      var angle = i * step;

      var v = values[i];
      var k = f * weight(v) || 1;

      var r1 = r - k;
      var r2 = r + k;
      var x1 = r1 * Math.cos(angle);
      var y1 = r1 * Math.sin(angle);
      var x2 = r2 * Math.cos(angle);
      var y2 = r2 * Math.sin(angle);

      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }

    context.restore();
  }
};

var inspect = function (input, fft, fftSize) {
  if ( fft === void 0 ) fft = false;
  if ( fftSize === void 0 ) fftSize = 256;

  if (input === undefined || !(input instanceof AudioNode)) {
    throw TypeError('Missing valid source')
  }

  // Setup scope
  var inspector = input.context.createAnalyser();

  inspector.fftSize = fftSize;

  var bins = inspector.frequencyBinCount;
  var data = new Uint8Array(bins);

  // Center values 1 / 128 for waveforms or 1 / 256 for spectra
  var norm = function (v) { return (fft ? v * 0.00390625 : (v * 0.0078125) - 1); };

  // Decide type of data
  var copy = function (a) { return (fft ? inspector.getByteFrequencyData(a) : inspector.getByteTimeDomainData(a)); };

  // Connect
  input.connect(inspector);

  return function (draw) {
    if ( draw === void 0 ) draw = (function () {});

    copy(data);
    draw(data, norm);

    return inspector
  }
};

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audio = new AudioContext();
var fader = audio.createGain();

fader.gain.value = 0;
fader.connect(audio.destination);

var base = 87.31;
var keys = 12;
var semi = 1 / keys;

var getFrequency = function (n) { return Math.pow(2, n * semi); };
var getAmplitude = function (n) { return (0.5 * Math.cos(Math.PI * n)) + 0.5; };

var octaves = 9;
var spectra = 256;

var real = new Float32Array(spectra);
var imag = new Float32Array(spectra);

for (var i = 0, exp = 1; i < octaves; i += 1, exp *= 2) {
  real[exp] = getAmplitude(i / octaves);
}

var lookup = audio.createPeriodicWave(real, imag);
var createVoice = function (v, i) {
  var vco = audio.createOscillator();
  var vca = audio.createGain();

  vco.setPeriodicWave(lookup);
  vco.connect(vca);
  vca.connect(fader);

  vco.frequency.value = v;
  vca.gain.value = getAmplitude(i);

  return { vco: vco, vca: vca }
};

var voices = Array.from({ length: 2 })
  .map(function (v, i) { return base * (i + 1); })
  .reverse()
  .map(createVoice);

var strike = function (x) { return voices.forEach(function (ref, i) {
  var vco = ref.vco;
  var vca = ref.vca;

  var t = audio.currentTime;
  var b = base + (base * (1 - i));
  var f = getFrequency(x) * b;

  var g = semi * x;
  var k = Math.abs(i - g);
  var a = getAmplitude(k);

  vco.frequency.setValueAtTime(f, 0);

  vca.gain.cancelScheduledValues(t);
  vca.gain.setValueAtTime(0, t);
  vca.gain.linearRampToValueAtTime(a, t + 0.002);
  vca.gain.linearRampToValueAtTime(0, t + 0.9);
}); };

var master = document.querySelector('canvas').getContext('2d');
var board1 = document.createElement('canvas').getContext('2d');
var board2 = document.createElement('canvas').getContext('2d');

var graph1 = radially(board1);
var graph2 = radially(board2);

var ref = master.canvas;
var width = ref.width;
var height = ref.height;

var halfW = width * 0.5;

var jumpX = -25;
var jumpY = board1.canvas.height * 0.5;

board1.strokeStyle = '#fff';

// Partials
var scope1 = inspect(fader, true);

// Time domain
var scope2 = inspect(fader);

var render = function () {
  scope1(graph1);
  scope2(graph2);

  master.clearRect(0, 0, width, height);
  master.fillRect(0, 0, halfW, height);

  master.drawImage(board1.canvas, jumpX, jumpY);
  master.drawImage(board2.canvas, jumpX + halfW, jumpY);
};

var lineup = function (fn) { return window.requestAnimationFrame(fn); };
var cancel = function (id) { return window.cancelAnimationFrame(id); };

var rounds = 1;
var frames = -1;

var repeat = function () {
  if (frames % 25 === 0) {
    strike(rounds);

    rounds += 1;
    rounds %= keys;
  }

  render();

  frames = lineup(repeat);
};

var toggle = function () {
  var time = audio.currentTime;

  if (frames === -1) {
    frames = voices.forEach(function (ref) {
      var vco = ref.vco;

      return vco.start();
    });
  }

  if (frames === undefined) {
    fader.gain.setTargetAtTime(1, time, 0.5);
  } else {
    fader.gain.setTargetAtTime(0, time, 0.125);
  }

  frames = frames ? cancel(frames) : lineup(repeat);
};

document.addEventListener('click', toggle);
document.addEventListener('DOMContentLoaded', function () {
  lineup(render);
});

}());

