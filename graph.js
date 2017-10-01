export const TAU = Math.PI * 2
export const deg = TAU / 360

export const linear = (source, target, adjust) => {
  const count = source.frequencyBinCount
  const { width: w, height: h } = target.canvas

  // Vertical center
  const halfH = h * 0.5

  // Diameter, available space
  const d = Math.min(w, h)

  // Radius
  const r = d * 0.5

  // Horizontal step multiplier
  const s = Math.round(w / count)

  return (values) => {
    target.clearRect(0, 0, w, h)

    target.save()
    target.translate(0, halfH)
    target.beginPath()

    for (let i = 0; i < count; i += 1) {
      const v = values[i]

      // Make sure a pixel is drawn when zero, doesn't look very nice otherwise
      const y = r * adjust(v) || 1
      const x = i * s

      target.moveTo(x, y)
      target.lineTo(x, y * -1)
      target.stroke()
    }

    target.restore()
  }
}

export const radial = (source, target, adjust) => {
  const count = source.frequencyBinCount
  const { width: w, height: h } = target.canvas

  const steps = 360 / count
  const halfH = h * 0.5
  const halfW = w * 0.5

  // Figure out available space
  const d = Math.min(w, h)

  // Base radius
  const r = d * 0.325

  // Precalculate multiplier
  const f = r * 0.5

  return (values) => {
    target.clearRect(0, 0, w, h)

    target.save()
    target.translate(halfW, halfH)
    target.rotate(-0.25 * TAU)

    for (let i = 0; i < count; i += 1) {
      const angle = i * steps * deg

      const v = values[i]
      const k = f * adjust(v) || 1

      const r1 = r - k
      const r2 = r + k
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
