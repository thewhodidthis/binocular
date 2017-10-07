const inspect = (input, fft = false, fftSize = 256) => {
  if (input === undefined || !(input instanceof AudioNode)) {
    throw TypeError('Missing valid source')
  }

  // Setup scope
  const inspector = input.context.createAnalyser()

  inspector.fftSize = fftSize

  const bins = inspector.frequencyBinCount
  const data = new Uint8Array(bins)

  // Center values 1 / 128 for waveforms or 1 / 256 for spectra
  const norm = v => (fft ? v * 0.00390625 : (v * 0.0078125) - 1)

  // Decide type of data
  const copy = a => (fft ? inspector.getByteFrequencyData(a) : inspector.getByteTimeDomainData(a))

  // Connect
  input.connect(inspector)

  return (draw = (() => {})) => {
    copy(data)
    draw(data, norm)

    return inspector
  }
}

export default inspect
