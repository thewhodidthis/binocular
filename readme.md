> For monitoring web audio signals

### Setup
```sh
# Fetch latest from github
npm i thewhodidthis/binocular
```

### Usage
```js
import inspect from '@thewhodidthis/binocular'

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audio = new AudioContext()
const sound = audio.createOscillator()

sound.connect(audio.destination)

const board = document.createElement('canvas').getContext('2d')
const scope = inspect(sound)

const size = 256
const half = size * 0.5

board.canvas.width = board.canvas.height = size

const chart = (values, weight) => {
    board.clearRect(0, 0, size, size)

    values.forEach((v, i) => {
        const x = i * 2
        const h = 0.5 * half * weight(v)

        board.fillRect(i * 2, half, 1, h)
    })
}

const frame = () => {
    scope(chart)

    window.requestAnimationFrame(frame)
}

document.body.appendChild(board.canvas)
document.addEventListener('DOMContentLoaded', frame)

let isIdle = true

document.addEventListener('click', () => {
    if (isIdle) {
        isIdle = sound.start()
    }
})
```
