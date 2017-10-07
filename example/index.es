import { radially } from '../graph.js'
import inspect from '../index.js'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const audio = new AudioContext()
const fader = audio.createGain()

fader.gain.value = 0
fader.connect(audio.destination)

const base = 87.31
const keys = 12
const semi = 1 / keys

const getFrequency = n => Math.pow(2, n * semi)
const getAmplitude = n => (0.5 * Math.cos(Math.PI * n)) + 0.5

const octaves = 9
const spectra = 256

const real = new Float32Array(spectra)
const imag = new Float32Array(spectra)

for (let i = 0, exp = 1; i < octaves; i += 1, exp *= 2) {
  real[exp] = getAmplitude(i / octaves)
}

const lookup = audio.createPeriodicWave(real, imag)
const createVoice = (v, i) => {
  const vco = audio.createOscillator()
  const vca = audio.createGain()

  vco.setPeriodicWave(lookup)
  vco.connect(vca)
  vca.connect(fader)

  vco.frequency.value = v
  vca.gain.value = getAmplitude(i)

  return { vco, vca }
}

const voices = Array.from({ length: 2 })
  .map((v, i) => base * (i + 1))
  .reverse()
  .map(createVoice)

const strike = x => voices.forEach(({ vco, vca }, i) => {
  const t = audio.currentTime
  const b = base + (base * (1 - i))
  const f = getFrequency(x) * b

  const g = semi * x
  const k = Math.abs(i - g)
  const a = getAmplitude(k)

  vco.frequency.setValueAtTime(f, 0)

  vca.gain.cancelScheduledValues(t)
  vca.gain.setValueAtTime(0, t)
  vca.gain.linearRampToValueAtTime(a, t + 0.002)
  vca.gain.linearRampToValueAtTime(0, t + 0.9)
})

const master = document.querySelector('canvas').getContext('2d')
const board1 = document.createElement('canvas').getContext('2d')
const board2 = document.createElement('canvas').getContext('2d')

const graph1 = radially(board1)
const graph2 = radially(board2)

const { width, height } = master.canvas

const halfW = width * 0.5

const jumpX = -25
const jumpY = board1.canvas.height * 0.5

board1.strokeStyle = '#fff'

// Partials
const scope1 = inspect(fader, true)

// Time domain
const scope2 = inspect(fader)

const render = () => {
  scope1(graph1)
  scope2(graph2)

  master.clearRect(0, 0, width, height)
  master.fillRect(0, 0, halfW, height)

  master.drawImage(board1.canvas, jumpX, jumpY)
  master.drawImage(board2.canvas, jumpX + halfW, jumpY)
}

const lineup = fn => window.requestAnimationFrame(fn)
const cancel = id => window.cancelAnimationFrame(id)

let rounds = 1
let frames = -1

const repeat = () => {
  if (frames % 25 === 0) {
    strike(rounds)

    rounds += 1
    rounds %= keys
  }

  render()

  frames = lineup(repeat)
}

const toggle = () => {
  const time = audio.currentTime

  if (frames === -1) {
    frames = voices.forEach(({ vco }) => vco.start())
  }

  if (frames === undefined) {
    fader.gain.setTargetAtTime(1, time, 0.5)
  } else {
    fader.gain.setTargetAtTime(0, time, 0.125)
  }

  frames = frames ? cancel(frames) : lineup(repeat)
}

document.addEventListener('click', toggle)
document.addEventListener('DOMContentLoaded', () => {
  lineup(render)
})
