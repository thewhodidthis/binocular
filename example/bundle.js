(function () {
'use strict';

// # Binocular
// Helps inspect sounds

const analyse = (node, fft = false, k = 1, fftSize = 256) => {
  if (node === undefined || !(node instanceof AudioNode)) {
    throw TypeError('Missing valid source')
  }

  // Create scope
  const analyser = node.context.createAnalyser();

  // Adjust scope
  analyser.fftSize = fftSize;

  // Avoids having to polyfill `AnalyserNode.getFloatTimeDomainData`
  const data = new Uint8Array(analyser.frequencyBinCount);

  // Decide type of data
  const copy = a => (fft ? analyser.getByteFrequencyData(a) : analyser.getByteTimeDomainData(a));

  // Center values 1 / 128 for waveforms or 1 / 256 for spectra
  const norm = v => (fft ? v * 0.00390625 : (v * 0.0078125) - 1) * k;

  // Produce normalized copy of data
  const snap = a => Float32Array.from(a, norm);

  // Connect
  node.connect(analyser);

  /* eslint no-sequences: 1 */
  return () => (copy(data), snap(data))
};

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const ivory = document.documentElement;

const audio = new AudioContext();
const fader = audio.createGain();
const input = audio.createBufferSource();

const canvas = document.querySelector('canvas');
const target = canvas.getContext('2d');
const buffer = canvas.cloneNode().getContext('2d');

buffer.lineWidth = 3;

const { width: w, height: h } = target.canvas;

const sketch = (offset = 0) => {
  const edge = 0.5 * h;
  const step = w / 128;
  const butt = 0.5 * step;

  return (points) => {
    buffer.beginPath();

    points.forEach((v, i) => {
      const x = i * step;
      const y = Math.floor(v * edge) || 1;

      buffer.moveTo(butt + x, offset + y);
      buffer.lineTo(butt + x, offset - y);
    });

    buffer.strokeStyle = offset > h * 0.5 ? '#00d' : '#d00';
    buffer.stroke();
  }
};

const graph1 = sketch(h * 0.35);
const graph2 = sketch(h * 0.65);

// Time domain
const scope1 = analyse(fader, 0, 0.75);

// Partials
const scope2 = analyse(fader, 1, 0.25);

const update = () => {
  const a = scope1();
  const b = scope2();

  graph1(a);
  graph2(b);
};

const render = () => {
  target.clearRect(0, 0, w, h);
  target.drawImage(buffer.canvas, 0, 0);
  buffer.clearRect(0, 0, w, h);
};

const repeat = () => {
  update();
  render();

  window.requestAnimationFrame(repeat);
};

const launch = (e) => {
  if (e) {
    ivory.classList.remove('is-frozen');
    document.removeEventListener('touchstart', launch);
  }

  if (input.buffer && !input.playbackState) {
    input.start();
  }

  window.requestAnimationFrame(repeat);
};

const revert = () => {
  const request = new XMLHttpRequest();

  // The clip is from Stephen Fry's reading of `The Hitchhikers Guide to the Galaxy` by Douglas Adams
  // http://www.penguinrandomhouseaudio.com/book/670/the-hitchhikers-guide-to-the-galaxy
  request.open('GET', 'clip.mp3', true);

  request.responseType = 'arraybuffer';
  request.onload = (e) => {
    audio.decodeAudioData(e.target.response, (data) => {
      input.buffer = data;
      input.loop = true;

      input.connect(fader);
      fader.connect(audio.destination);

      ivory.classList.remove('is-mining');

      if ('ontouchstart' in window) {
        ivory.classList.add('is-frozen');
        document.addEventListener('touchstart', launch);

        // Avoid spaces on mobile
        buffer.lineWidth = 5;
      } else {
        launch();
      }
    }, () => {
      ivory.classList.add('is-broken');
    });
  };

  ivory.classList.add('is-mining');

  request.send();
};

if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const source = audio.createMediaStreamSource(stream);

    source.connect(fader);
    launch();
  }).catch(revert);
} else {
  revert();
}

}());
