// Pure helpers for the sparkline parts in ui/chart-parts.tsx (no DOM, no React), so they can be unit tested.

/**
 * Scales a series to 0..1 against its own maximum: the biggest value is 1 and a zero sits on the baseline, so a month
 * with nothing in it reads as nothing. An empty or all-zero series is flat on the baseline. Negatives count as 0.
 */
export function scaleSeries(values: readonly number[]): number[] {
  const max = Math.max(0, ...values)
  return values.map((v) => (max > 0 ? Math.max(0, v) / max : 0))
}

/** A line needs two points to be drawn: a single value is repeated, nothing becomes a flat baseline. */
export function linePoints(values: readonly number[]): number[] {
  const scaled = scaleSeries(values)
  if (scaled.length === 0) return [0, 0]
  return scaled.length === 1 ? [scaled[0], scaled[0]] : scaled
}

/** Bar heights in px for a column sparkline: proportional to the series, never thinner than `min` so zeros stay visible. */
export function barHeights(values: readonly number[], height: number, min = 2): number[] {
  return scaleSeries(values).map((p) => Math.max(min, Math.round(p * height)))
}
