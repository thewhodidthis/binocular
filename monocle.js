import { ring } from './graph'

const monocle = (...param) => {
  let graph = ring

  param.forEach((v, i) => {
    if (typeof v === 'function') {
      param.splice(i, 1)
      graph = v
    }
  })

  const [input, board, pitch = false, fftSize = 256] = param

  const audio = input.context
  const scope = audio.createAnalyser()

  scope.fftSize = fftSize

  const bins = scope.frequencyBinCount
  const data = new Uint8Array(bins)

  const copy = d => (pitch ? scope.getByteFrequencyData(d) : scope.getByteTimeDomainData(d))
  const draw = graph(scope, board)

  input.connect(scope)

  return (extra) => {
    copy(data)
    draw(data, extra)

    return scope
  }
}

export default monocle
