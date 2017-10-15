'use strict';

var scan = function (node, fft, fftSize) {
  if ( fft === void 0 ) fft = false;
  if ( fftSize === void 0 ) fftSize = 256;

  if (node === undefined || !(node instanceof AudioNode)) {
    throw TypeError('Missing valid source')
  }

  // Setup scope
  var scanner = node.context.createAnalyser();

  scanner.fftSize = fftSize;

  var bins = scanner.frequencyBinCount;
  var data = new Uint8Array(bins);

  // Decide type of data
  var copy = function (a) { return (fft ? scanner.getByteFrequencyData(a) : scanner.getByteTimeDomainData(a)); };

  // Center values 1 / 128 for waveforms or 1 / 256 for spectra
  var norm = function (v) { return (fft ? v * 0.00390625 : (v * 0.0078125) - 1); };

  // Connect
  node.connect(scanner);

  return function (draw) {
    if ( draw === void 0 ) draw = (function () {});

    copy(data);
    draw(data.map(norm));

    return scanner
  }
};

module.exports = scan;

