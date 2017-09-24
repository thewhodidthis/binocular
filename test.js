'use strict'

window.AudioContext = window.AudioContext || window.webkitAudioContext

const kpow = require('kpow')
const test = require('tape')
const { monocle } = require('./')

kpow()

test('will init', (t) => {
  t.plan(1)

  try {
    const audio = new AudioContext()
    const sound = audio.createOscillator()
    const board = document.createElement('canvas').getContext('2d')

    monocle(sound, board)

    t.pass('Success!')
  } catch (e) {
    t.fail('Unable to connect')
  }
})
