import { animate, monocle } from '../'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const audio = new AudioContext()
const fader = audio.createGain()

const store = []
const total = 12
const cents = 1 / total
const plier = Math.pow(2, cents)

const play = (frame) => {
  let f = 20

  for (let i = 0; i < total; i += 1) {
    let voice = store[i]

    if (voice) {
      voice.stop()
    }

    voice = audio.createOscillator()

    voice.frequency.value = f * Math.pow(plier, frame)
    voice.connect(fader)
    voice.start()

    store[i] = voice

    f *= 2
  }
}

fader.gain.value = 0
fader.connect(audio.destination)

const master = document.querySelector('canvas').getContext('2d')
const board1 = document.createElement('canvas').getContext('2d')
const board2 = document.createElement('canvas').getContext('2d')

const { width, height } = master.canvas

const halfW = width * 0.5
const jumpX = -25
const jumpY = board1.canvas.height * 0.5

board1.strokeStyle = '#fff'

// Partials
const scope1 = monocle(fader, board1, true)

// Time domain
const scope2 = monocle(fader, board2)

const draw = () => {
  scope1()
  scope2()

  master.clearRect(0, 0, width, height)
  master.fillRect(0, 0, halfW, height)

  master.drawImage(board1.canvas, jumpX, jumpY)
  master.drawImage(board2.canvas, halfW + jumpX, jumpY)
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
    fader.gain.setTargetAtTime(0, time, 0.125)
  } else {
    fader.gain.setTargetAtTime(cents, time, 1)
  }
}

document.addEventListener('DOMContentLoaded', draw)
document.addEventListener('click', next)
