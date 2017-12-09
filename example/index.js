(function () {
'use strict';

var draw = function (mapping, context, footing) {
  if ( footing === void 0 ) footing = 1;

  var ref = context.canvas;
  var w = ref.width;
  var h = ref.height;

  var x = w * 0.5;
  var y = h * 0.5;

  var max = Math.max(w, h);
  var min = Math.min(w, h);

  var transform = mapping(max, min, footing);

  return function (points) {
    context.clearRect(0, 0, w, h);
    context.save();
    context.translate(x, y);
    context.beginPath();

    Array.from(points).map(transform).forEach(function (ref) {
      var a = ref[0];
      var b = ref[1];

      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
    });

    context.stroke();
    context.restore();

    return context
  }
};

var dial = function (max, min, bottom) { return function (v, i, ref) {
  var total = ref.length;

  // Step size
  var s = 2 * Math.PI / total;

  // Outer radius
  var r = min * 0.25;

  // Current step
  var q = s * i;

  // Line height
  var k = r * v || bottom;

  // Angles
  var cos = Math.cos(q);
  var sin = Math.sin(q);

  // Lower part
  var v1 = r - k;

  // Upper part
  var v2 = r + k;

  // From, to
  var a = { x: v1 * cos, y: v1 * sin };
  var b = { x: v2 * cos, y: v2 * sin };

  return [a, b]
}; };

var around = function () {
  var args = [], len = arguments.length;
  while ( len-- ) args[ len ] = arguments[ len ];

  return draw.apply(void 0, [ dial ].concat( args ));
};

var analyse = function (node, fft, k, fftSize) {
  if ( fft === void 0 ) fft = false;
  if ( k === void 0 ) k = 1;
  if ( fftSize === void 0 ) fftSize = 256;

  if (node === undefined || !(node instanceof AudioNode)) {
    throw TypeError('Missing valid source')
  }

  // Create scope
  var analyser = node.context.createAnalyser();

  // Adjust scope
  analyser.fftSize = fftSize;

  // Avoids having to polyfill `AnalyserNode.getFloatTimeDomainData`
  var data = new Uint8Array(analyser.frequencyBinCount);

  // Decide type of data
  var copy = function (a) { return (fft ? analyser.getByteFrequencyData(a) : analyser.getByteTimeDomainData(a)); };

  // Center values 1 / 128 for waveforms or 1 / 256 for spectra
  var norm = function (v) { return (fft ? v * 0.00390625 : (v * 0.0078125) - 1) * k; };

  // Produce normalized copy of data
  var snap = function (a) { return Float32Array.from(a, norm); };

  // Connect
  node.connect(analyser);

  return function (draw) {
    if ( draw === void 0 ) draw = function (v) { return v; };

    copy(data);
    draw(snap(data));

    return analyser
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

var ref = master.canvas;
var width = ref.width;
var height = ref.height;

var middle = 0.5 * width;
var spaceY = 0.5 * (height - middle);

board2.canvas.width = board2.canvas.height = middle;
board1.canvas.width = board1.canvas.height = middle;

board1.strokeStyle = '#fff';
board1.transform(0, -1, 1, 0, 0, middle);

var graph1 = around(board1);
var graph2 = around(board2);

// Partials
var scope1 = analyse(fader, true, 0.25);

// Time domain
var scope2 = analyse(fader, null, 0.5);

var render = function () {
  scope1(graph1);
  scope2(graph2);

  master.clearRect(0, 0, width, height);
  master.fillRect(0, 0, middle, height);

  master.drawImage(board1.canvas, 0, spaceY);
  master.drawImage(board2.canvas, middle, spaceY);
};

var lineup = function (fn) { return window.requestAnimationFrame(fn); };
var cancel = function (id) { return window.cancelAnimationFrame(id); };

var rounds = 1;
var frames = 0;

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

  if (frames === 0) {
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

