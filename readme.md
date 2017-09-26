## Binocular
> Preset canvas graphs for monitoring web audio signals

### Setup
```sh
# Fetch latest from github repo
npm install thewhodidthis/binocular
```

### Usage
```js
import { monocle } from '@thewhodidthis/binocular'

const audio = new AudioContext()
const sound = audio.createOscillator()

sound.connect(audio.destination)

const board = document.createElement('canvas').getContext('2d')
const chart = monocle(sound, board)
const frame = () => {
  chart()

  window.requestAnimationFrame(frame)
}

document.body.appendChild(board.canvas)
document.addEventListener('DOMContentLoaded', frame)

let idle = true

document.addEventListener('click', () => {
    if (idle) {
        idle = sound.start()
    }
})
```
