// Pure builders for the hover tooltips of the SVG charts (donut, pie, rings, sparklines): they turn real numbers into
// the rows ChartHover prints. No React, no DOM, so they are unit tested.
import type { ChartHoverTip } from "@/components/ui/chart-hover"

const plain = (n: number) => n.toLocaleString("en-US")

/** Whole-number share of `value` in `total` (0 when the total is 0). */
export const percentOf = (value: number, total: number) => (total > 0 ? Math.round((Math.max(0, value) / total) * 100) : 0)

/** One tip per slice / ring: its name, its count and its share of the total. */
export function shareTips(
  items: { label: string; value: number; color: string }[],
  text: { count: string; share: string },
  format: (n: number) => string = plain
): ChartHoverTip[] {
  const total = items.reduce((sum, i) => sum + Math.max(0, i.value), 0)
  return items.map((item) => ({
    title: item.label,
    rows: [
      { label: text.count, value: format(item.value), color: item.color },
      { label: text.share, value: `${percentOf(item.value, total)}%` },
    ],
  }))
}

/** The half-circle completion gauge: done / remaining / total. */
export function completionTip(
  done: number,
  total: number,
  text: { title: string; done: string; remaining: string; total: string },
  format: (n: number) => string = plain
): ChartHoverTip {
  return {
    title: text.title,
    rows: [
      { label: text.done, value: format(done), color: "var(--blue-500)" },
      { label: text.remaining, value: format(Math.max(0, total - done)) },
      { label: text.total, value: `${format(total)} (${percentOf(done, total)}%)`, strong: true },
    ],
  }
}

/** One tip per point of a sparkline: the point's label (month) and its value. */
export function seriesTips(
  labels: readonly string[],
  values: readonly number[],
  seriesLabel: string,
  color: string,
  format: (n: number) => string = plain
): ChartHoverTip[] {
  return values.map((value, i) => ({ title: labels[i], rows: [{ label: seriesLabel, value: format(value), color }] }))
}
