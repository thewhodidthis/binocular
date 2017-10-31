import 'cutaway'
import { assert, report } from 'tapeless'
import inspect from './index.es'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const audio = new AudioContext()
const voice = audio.createOscillator()
const scope = inspect(voice)

const { ok } = assert

try {
  inspect()
} catch (e) {
  ok(e instanceof TypeError, 'expect TypeError when calling sans input')
}

ok(typeof scope === 'function', 'expect lambda on init')
ok(scope(), 'safe to call sans arguments')
ok(scope() instanceof AnalyserNode, 'expect AudioAnalyser on call')

report()
