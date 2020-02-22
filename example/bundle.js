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

  const html = document.documentElement;

  document.addEventListener('click', () => {
    const canvas = document.querySelector('canvas');
    const { width, height } = canvas;

    const finalContext = canvas.getContext('2d');
    const dummyContext = canvas.cloneNode().getContext('2d');

    // Avoid spaces on mobile
    dummyContext.lineWidth = 'ontouchstart' in window ? 5 : 3;

    const sketch = (offset = 0) => {
      const verticalMax = 0.5 * height;
      const step = width / 128;
      const halfStep = 0.5 * step;

      return (points) => {
        dummyContext.beginPath();

        points.forEach((v, i) => {
          const x = i * step;
          const y = Math.floor(v * verticalMax) || 1;

          dummyContext.moveTo(halfStep + x, offset + y);
          dummyContext.lineTo(halfStep + x, offset - y);
        });

        dummyContext.strokeStyle = offset > height * 0.5 ? '#00d' : '#d00';
        dummyContext.stroke();
      }
    };

    const graphTop = sketch(height * 0.35);
    const graphBottom = sketch(height * 0.65);

    const audioContext = new AudioContext();
    const fader = audioContext.createGain();
    const input = audioContext.createBufferSource();

    const amplitudeInspector = analyse(fader, 0, 0.75);
    const frequencyInspector = analyse(fader, 1, 0.25);

    const update = () => {
      const amplitudeData = amplitudeInspector();

      graphTop(amplitudeData);

      const frequencyData = frequencyInspector();

      graphBottom(frequencyData);
    };

    const render = () => {
      finalContext.clearRect(0, 0, width, height);
      finalContext.drawImage(dummyContext.canvas, 0, 0);
      dummyContext.clearRect(0, 0, width, height);
    };

    const repeat = () => {
      update();
      render();

      window.requestAnimationFrame(repeat);
    };

    const start = () => {
      try {
        input.start();

        window.requestAnimationFrame(repeat);
      } catch (x) {
        console.log(x);
      }
    };

    const revert = () => {
      const request = new XMLHttpRequest();

      request.responseType = 'arraybuffer';
      request.onload = (e) => {
        audioContext.decodeAudioData(e.target.response, (data) => {
          input.buffer = data;
          input.loop = true;

          input.connect(fader);
          fader.connect(audioContext.destination);
          start();

          html.classList.remove('is-mining');
        }, () => {
          html.classList.add('is-broken');
        });
      };

      // Stephen Fry's reading of
      // http://www.penguinrandomhouseaudio.com/book/670/the-hitchhikers-guide-to-the-galaxy
      request.open('GET', 'clip.mp3', true);
      request.send();

      // Signal loading started
      html.classList.add('is-mining');
    };

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaStreamSource = audioContext.createMediaStreamSource(stream);

          mediaStreamSource.connect(fader);
          start();
        })
        .catch(revert);
    } else {
      revert();
    }

    html.classList.remove('is-frozen');
  }, { once: true });

  // Prompt for user interaction to bypass autoplay restrictions
  html.classList.add('is-frozen');

}());
