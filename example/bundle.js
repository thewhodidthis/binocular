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

  // Prompt for user interaction to bypass autoplay restrictions
  ivory.classList.add('is-frozen');

  // Click handler
  const start = () => {
    ivory.classList.remove('is-frozen');

    const canvas = document.querySelector('canvas');
    const target = canvas.getContext('2d');
    const buffer = canvas.cloneNode().getContext('2d');

    // Avoid spaces on mobile
    buffer.lineWidth = 'ontouchstart' in window ? 5 : 3;

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

    const audio = new AudioContext();
    const fader = audio.createGain();
    const input = audio.createBufferSource();

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

    const loop = () => {
      update();
      render();

      window.requestAnimationFrame(loop);
    };

    const play = () => {
      try {
        input.start();

        window.requestAnimationFrame(loop);
      } catch (x) {
        console.log(x);
      }
    };

    const revert = () => {
      const request = new XMLHttpRequest();

      request.responseType = 'arraybuffer';
      request.onload = (e) => {
        audio.decodeAudioData(e.target.response, (data) => {
          input.buffer = data;
          input.loop = true;

          input.connect(fader);
          fader.connect(audio.destination);

          play();

          ivory.classList.remove('is-mining');
        }, () => {
          ivory.classList.add('is-broken');
        });
      };

      // Stephen Fry's reading of
      // http://www.penguinrandomhouseaudio.com/book/670/the-hitchhikers-guide-to-the-galaxy
      request.open('GET', 'clip.mp3', true);
      request.send();

      // Signal loading started
      ivory.classList.add('is-mining');
    };

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const source = audio.createMediaStreamSource(stream);

          source.connect(fader);
          play();
        }).catch(revert);
    } else {
      revert();
    }

    document.removeEventListener('click', start);
  };

  document.addEventListener('click', start);

}());
