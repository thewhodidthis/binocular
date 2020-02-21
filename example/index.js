import inspect from '../index.mjs'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const ivory = document.documentElement

// Prompt for user interaction to bypass autoplay restrictions
ivory.classList.add('is-frozen')

// Click handler
const start = () => {
  ivory.classList.remove('is-frozen')

  const canvas = document.querySelector('canvas')
  const target = canvas.getContext('2d')
  const buffer = canvas.cloneNode().getContext('2d')

  // Avoid spaces on mobile
  buffer.lineWidth = 'ontouchstart' in window ? 5 : 3

  const { width: w, height: h } = target.canvas

  const sketch = (offset = 0) => {
    const edge = 0.5 * h
    const step = w / 128
    const butt = 0.5 * step

    return (points) => {
      buffer.beginPath()

      points.forEach((v, i) => {
        const x = i * step
        const y = Math.floor(v * edge) || 1

        buffer.moveTo(butt + x, offset + y)
        buffer.lineTo(butt + x, offset - y)
      })

      buffer.strokeStyle = offset > h * 0.5 ? '#00d' : '#d00'
      buffer.stroke()
    }
  }

  const graph1 = sketch(h * 0.35)
  const graph2 = sketch(h * 0.65)

  const audio = new AudioContext()
  const fader = audio.createGain()
  const input = audio.createBufferSource()

  // Time domain
  const scope1 = inspect(fader, 0, 0.75)

  // Partials
  const scope2 = inspect(fader, 1, 0.25)

  const update = () => {
    const a = scope1()
    const b = scope2()

    graph1(a)
    graph2(b)
  }

  const render = () => {
    target.clearRect(0, 0, w, h)
    target.drawImage(buffer.canvas, 0, 0)
    buffer.clearRect(0, 0, w, h)
  }

  const loop = () => {
    update()
    render()

    window.requestAnimationFrame(loop)
  }

  const play = () => {
    try {
      input.start()

      window.requestAnimationFrame(loop)
    } catch (x) {
      console.log(x)
    }
  }

  const revert = () => {
    const request = new XMLHttpRequest()

    request.responseType = 'arraybuffer'
    request.onload = (e) => {
      audio.decodeAudioData(e.target.response, (data) => {
        input.buffer = data
        input.loop = true

        input.connect(fader)
        fader.connect(audio.destination)

        play()

        ivory.classList.remove('is-mining')
      }, () => {
        ivory.classList.add('is-broken')
      })
    }

    // Stephen Fry's reading of
    // http://www.penguinrandomhouseaudio.com/book/670/the-hitchhikers-guide-to-the-galaxy
    request.open('GET', 'clip.mp3', true)
    request.send()

    // Signal loading started
    ivory.classList.add('is-mining')
  }

  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const source = audio.createMediaStreamSource(stream)

        source.connect(fader)
        play()
      }).catch(revert)
  } else {
    revert()
  }

  document.removeEventListener('click', start)
}

document.addEventListener('click', start)
