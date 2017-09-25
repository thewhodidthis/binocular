import { animate, monocle } from '../index.mjs'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const audio = new AudioContext()
const fader = audio.createGain()

const store = []
const total = 12
const plier = Math.pow(2, 1 / total)

const play = (frame) => {
  let f = 20

  for (let i = 0; i < total; i += 1) {
    if (store[i]) {
      store[i].stop()
    }

    const sound = audio.createOscillator()

    sound.frequency.value = f * Math.pow(plier, frame)
    sound.connect(fader)
    sound.start()

    store[i] = sound

    f *= 2
  }
}

fader.gain.value = 0
fader.connect(audio.destination)

const master = document.querySelector('canvas').getContext('2d')
const board1 = document.createElement('canvas').getContext('2d')
const board2 = document.createElement('canvas').getContext('2d')

board1.strokeStyle = '#fff'

// Partials
const scope1 = monocle(fader, board1, true)

// Time domain
const scope2 = monocle(fader, board2)

const { width, height } = master.canvas

const draw = () => {
  scope1()
  scope2()

  master.clearRect(0, 0, width, height)
  master.fillRect(0, 0, 250, height)

  master.drawImage(board1.canvas, -25, 75)
  master.drawImage(board2.canvas, 225, 75)
}

const loop = animate((id) => {
  if (id % 25 === 0) {
    play(id % total)
  }

  draw()
})

const next = () => {
  const time = audio.currentTime
  const busy = loop()

  if (busy === 1) {
    play(0)
  }

  if (busy === undefined) {
    fader.gain.setTargetAtTime(0, time, 0.25)
  } else {
    fader.gain.setTargetAtTime(1 / total, time, 1)
  }
}

document.addEventListener('DOMContentLoaded', draw)
document.addEventListener('click', next)
