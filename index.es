const analyse = (node, fft = false, fftSize = 256) => {
  if (node === undefined || !(node instanceof AudioNode)) {
    throw TypeError('Missing valid source')
  }

  // Create scope
  const analyser = node.context.createAnalyser()

  // Adjust scope
  analyser.fftSize = fftSize

  // Avoids having to polyfill `AnalyserNode.getFloatTimeDomainData`
  const data = new Uint8Array(analyser.frequencyBinCount)

  // Decide type of data
  const copy = a => (fft ? analyser.getByteFrequencyData(a) : analyser.getByteTimeDomainData(a))

  // Center values 1 / 128 for waveforms or 1 / 256 for spectra
  const norm = v => (fft ? v * 0.00390625 : (v * 0.0078125) - 1)

  // Produce normalized copy of data
  const snap = a => Float32Array.from(a, norm)

  // Connect
  node.connect(analyser)

  return (draw = (() => {})) => {
    copy(data)
    draw(snap(data))

    return analyser
  }
}

export default analyse
