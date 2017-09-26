'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

var linear = function (source, target, adjust) {
  var count = source.frequencyBinCount;
  var ref = target.canvas;
  var w = ref.width;
  var h = ref.height;

  // Vertical center
  var halfH = h * 0.5;

  // Diameter, available space
  var d = Math.min(w, h);

  // Radius
  var r = d * 0.5;

  // Horizontal step multiplier
  var s = Math.round(w / count);

  return function (values, domain) {
    target.clearRect(0, 0, w, h);

    target.save();
    target.translate(0, halfH);
    target.beginPath();

    for (var i = 0; i < count; i += 1) {
      var v = values[i];

      // Make sure a pixel is drawn when zero, doesn't look very nice otherwise
      var y = (r * adjust(v)) + 1;
      var x = i * s;

      target.moveTo(x, y);
      target.lineTo(x, y * -1);
      target.stroke();
    }

    target.restore();
  }
};
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
  var scale = function (v) { return pitch ? v * 0.00390625 : (v * 0.0078125) - 1; };

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

exports.animate = animate;
exports.monocle = monocle;
exports.TAU = TAU;
exports.deg = deg;
exports.linear = linear;
exports.radial = radial;

