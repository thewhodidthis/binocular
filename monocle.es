import { radial } from './graph'

const monocle = (...param) => {
  let graph = radial

  param.forEach((v, i) => {
    if (typeof v === 'function') {
      param.splice(i, 1)
      graph = v
    }
  })

  // No matter where the callback in found in the arguments, at least specify these in order
  const [input, board, pitch = false, fftSize = 256] = param

  const audio = input.context
  const scope = audio.createAnalyser()

  // Center values based on whether in the time or frequency domain (1 / 128 or 1 / 256)
  const scale = v => (pitch ? v * 0.00390625 : (v * 0.0078125) - 1)

  scope.fftSize = fftSize

  const bins = scope.frequencyBinCount
  const data = new Uint8Array(bins)

  const copy = d => (pitch ? scope.getByteFrequencyData(d) : scope.getByteTimeDomainData(d))
  const draw = graph(scope, board, scale)

  input.connect(scope)

  return (xtra) => {
    copy(data)
    draw(data, xtra)

    return scope
  }
}

export default monocle
