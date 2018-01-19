(function () {
'use strict';

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

  /* eslint no-sequences: 1 */
  return function () { return (copy(data), snap(data)); }
};

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audio = new AudioContext();
var fader = audio.createGain();
var input = audio.createBufferSource();

var canvas = document.querySelector('canvas');
var target = canvas.getContext('2d');
var buffer = canvas.cloneNode().getContext('2d');

target.fillStyle = 'white';
buffer.lineWidth = 4;

var ref = target.canvas;
var w = ref.width;
var h = ref.height;
var middle = h * 0.5;

var sketch = function (offset) {
  if ( offset === void 0 ) offset = 0;

  var grid = { x: w / 128, y: h * 0.25 };

  var spot = grid.y + offset;
  var edge = middle + offset;

  return function (points) {
    buffer.clearRect(0, offset, w, edge);
    buffer.beginPath();

    points.forEach(function (v, i) {
      var x = i * grid.x;
      var y = Math.floor(v * middle) || 1;

      buffer.moveTo(2 + x, spot + y);
      buffer.lineTo(2 + x, spot - y);
    });

    buffer.stroke();
  }
};

var graph1 = sketch();
var graph2 = sketch(middle);

// Time domain
var scope1 = analyse(fader, 0, 0.5);

// Partials
var scope2 = analyse(fader, 1, 0.25);

var update = function () {
  var a = scope1();
  var b = scope2();

  graph1(a);
  graph2(b);
};

var render = function () {
  target.fillRect(0, 0, w, h);
  target.drawImage(buffer.canvas, 0, 0);
};

/* eslint no-unused-vars: 1 */
var repeat = function () {
  update();
  render();

  window.requestAnimationFrame(repeat);
};

var launch = function (e) {
  if (e) {
    document.documentElement.classList.remove('is-frozen');
    document.removeEventListener('touchstart', launch);
  }

  if (input.buffer && !input.playbackState) {
    input.start();
  }

  window.requestAnimationFrame(repeat);
};

var revert = function () {
  var request = new XMLHttpRequest();

  // The clip is from Stephen Fry's reading of `The Hitchhikers Guide to the Galaxy` by Douglas Adams
  // http://www.penguinrandomhouseaudio.com/book/670/the-hitchhikers-guide-to-the-galaxy/
  request.open('GET', 'clip.mp3', true);

  request.responseType = 'arraybuffer';
  request.onload = function (e) {
    audio.decodeAudioData(e.target.response, function (data) {
      input.buffer = data;
      input.loop = true;

      input.connect(fader);
      fader.connect(audio.destination);

      document.documentElement.classList.remove('is-mining');

      if ('ontouchstart' in window) {
        document.documentElement.classList.add('is-frozen');
        document.addEventListener('touchstart', launch);
      } else {
        launch();
      }
    }, function () {
      document.documentElement.classList.add('is-broken');
    });
  };

  document.documentElement.classList.add('is-mining');

  request.send();
};

if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    var source = audio.createMediaStreamSource(stream);

    source.connect(fader);
    launch();
  }).catch(revert);
} else {
  revert();
}

}());

