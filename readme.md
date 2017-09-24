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
const scope = monocle(sound, board)
const start = (fn = scope) => window.requestAnimationFrame(fn)

document.body.appendChild(board.canvas)
document.addEventListener('DOMContentLoaded', start)
```
