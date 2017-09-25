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

var linear = function (source, target) {
  var count = source.frequencyBinCount;
  var ref = target.canvas;
  var w = ref.width;
  var h = ref.height;

  var halfH = h * 0.5;
  var f = (h / 256) * 0.75;
  var g = Math.round(w / count);

  return function (values) {
    target.save();
    target.clearRect(0, 0, w, h);
    target.translate(0, halfH);

    target.beginPath();

    for (var i = 0; i < count; i += 1) {
      var x = i * g;
      var v = f * values[i];

      target.moveTo(x, v * 0.5);
      target.lineTo(x, v * 0.5 * -1);
      target.stroke();
    }

    target.restore();
  }
};

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

exports.animate = animate;
exports.monocle = monocle;
exports.TAU = TAU;
exports.deg = deg;
exports.linear = linear;
exports.radial = radial;

