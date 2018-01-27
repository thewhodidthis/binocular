'use strict';

// # Binocular
// Helps inspect sounds

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

module.exports = analyse;

