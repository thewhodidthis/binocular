export const TAU = Math.PI * 2
export const deg = TAU / 360

export const linear = (source, target) => {
  const count = source.frequencyBinCount
  const { width: w, height: h } = target.canvas

  const halfH = h * 0.5
  const halfW = w * 0.5

  const f = (h / 256) * 0.75
  const g = Math.round(w / count)

  return (values) => {
    target.save()
    target.clearRect(0, 0, w, h)
    target.translate(0, halfH)

    target.beginPath()

    for (let i = 0; i < count; i += 1) {
      const x = i * g
      const v = f * values[i]

      target.moveTo(x, v * 0.5)
      target.lineTo(x, v * 0.5 * -1)
      target.stroke()
    }

    target.restore()
  }
}

export const radial = (source, target) => {
  const count = source.frequencyBinCount
  const { width: w, height: h } = target.canvas

  const steps = 360 / count
  const halfH = h * 0.5
  const halfW = w * 0.5

  const r = h * 0.325
  const f = (h - r) / 256

  return (values) => {
    target.save()
    target.clearRect(0, 0, w, h)
    target.translate(halfW, halfH)
    target.rotate(-0.25 * TAU)

    for (let i = 0; i < count; i += 1) {
      const angle = i * steps * deg
      const v = f * values[i]

      const r1 = r - (v * 0.25)
      const r2 = r + (v * 0.25)
      const x1 = r1 * Math.cos(angle)
      const y1 = r1 * Math.sin(angle)
      const x2 = r2 * Math.cos(angle)
      const y2 = r2 * Math.sin(angle)

      target.beginPath()
      target.moveTo(x1, y1)
      target.lineTo(x2, y2)
      target.stroke()
    }

    target.restore()
  }
}
