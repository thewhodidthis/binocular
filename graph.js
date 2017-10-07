export const TAU = Math.PI * 2

export const linearly = (context) => {
  const { width: w, height: h } = context.canvas

  // Vertical center
  const halfH = h * 0.5

  // Available space
  const d = Math.min(w, h)

  // Base radius
  const r = d * 0.5

  return (values, weight) => {
    const bins = values.length
    const step = Math.round(w / bins)

    context.clearRect(0, 0, w, h)

    context.save()
    context.translate(0, halfH)
    context.beginPath()

    for (let i = 0; i < bins; i += 1) {
      const v = values[i]

      // Make sure a pixel is drawn when zero, doesn't look very nice otherwise
      const y = r * weight(v) || 1
      const x = i * step

      context.moveTo(x, y)
      context.lineTo(x, y * -1)
      context.stroke()
    }

    context.restore()
  }
}

export const radially = (context) => {
  const { width: w, height: h } = context.canvas

  const halfH = h * 0.5
  const halfW = w * 0.5

  // Available space
  const d = Math.min(w, h) * 0.75

  // Base radius
  const r = d * 0.5

  // Radial multiplier
  const f = r * 0.25

  return (values, weight) => {
    const bins = values.length
    const step = TAU / bins

    context.clearRect(0, 0, w, h)

    context.save()
    context.translate(halfW, halfH)
    context.rotate(-0.25 * TAU)

    for (let i = 0; i < bins; i += 1) {
      const angle = i * step

      const v = values[i]
      const k = f * weight(v) || 1

      const r1 = r - k
      const r2 = r + k
      const x1 = r1 * Math.cos(angle)
      const y1 = r1 * Math.sin(angle)
      const x2 = r2 * Math.cos(angle)
      const y2 = r2 * Math.sin(angle)

      context.beginPath()
      context.moveTo(x1, y1)
      context.lineTo(x2, y2)
      context.stroke()
    }

    context.restore()
  }
}
