'use strict'

const kpow = require('kpow')
const test = require('tape')

import inspect from './'

window.AudioContext = window.AudioContext || window.webkitAudioContext

kpow()

test('need source', (t) => {
  t.throws(inspect, 'throws sans input')
  t.end()
})

test('will default', (t) => {
  const audio = new AudioContext()
  const voice = audio.createOscillator()
  const scope = inspect(voice)

  t.ok(scope, 'init success')
  t.equal(typeof scope, 'function', 'got lambda on init')
  t.doesNotThrow(scope, 'safe to call sans arguments')
  t.ok(scope() instanceof AnalyserNode, 'got analyser on call')
  t.end()
})
