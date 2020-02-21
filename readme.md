> For monitoring web audio signals

### Setup
```sh
# Fetch latest from github
npm i thewhodidthis/binocular
```

### Usage
```js
import inspect from '@thewhodidthis/binocular'

window.AudioContext = window.AudioContext || window.webkitAudioContext

// Draw a sine wave bar chart
const canvas = document.createElement('canvas')
const canvasContext = canvas.getContext('2d')

document.body.appendChild(canvas)

document.addEventListener('click', () => {
  const audio = new AudioContext()
  const oscillator = audio.createOscillator()

  oscillator.connect(audio.destination)
  oscillator.start()

  const oscilloscope = inspect(oscillator)
  const draw = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)

    const data = oscilloscope()

    for (const [index, value] of data.entries()) {
      const barHeight = 0.5 * canvas.height * value

      canvasContext.fillRect(index * 2, canvas.width * 0.5, 1, barHeight)
    }

    window.requestAnimationFrame(draw)
  }

  window.requestAnimationFrame(draw)
}, { once: true })
```
