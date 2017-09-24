const animate = (callback, fps = 1) => {
  let frameId

  const play = fn => window.requestAnimationFrame(fn)
  const stop = () => window.cancelAnimationFrame(frameId)
  const loop = () => {
    if (frameId % fps === 0) {
      callback(frameId)
    }

    if (frameId) {
      frameId = play(loop)
    }
  }

  // Toggle
  return () => {
    frameId = (frameId === undefined) ? play(loop) : stop()

    return frameId
  }
}

export default animate
