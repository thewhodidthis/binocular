import 'cutaway'
import { assert, report } from 'tapeless'
import inspect from './index.mjs'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const audio = new AudioContext()
const voice = audio.createOscillator()
const scope = inspect(voice)

const { ok } = assert

try {
  inspect()
} catch (e) {
  ok
    .describe('expect TypeError when calling sans input')
    .test(e instanceof TypeError)
}

ok
  .describe('expect lambda on init')
  .test(typeof scope === 'function')
  .describe('safe to call sans arguments')
  .test(scope())

report()
