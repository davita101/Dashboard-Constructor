import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ChartColumnsMini, ChartLine, ChartLineArea } from "@/components/ui/chart-parts"

// The dashboard tiles pass a real monthly series; without one the Figma sample shapes stay.
describe("sparkline series", () => {
  it("ChartLine plots the series: max at the top, zero on the baseline", () => {
    const html = renderToStaticMarkup(createElement(ChartLine, { series: [0, 5, 10] }))
    // 96 high, pad 2: value 0 -> y 94, 5 -> y 48, 10 -> y 2.
    expect(html).toContain("M0.0 94.0 L100.0 48.0 L200.0 2.0")
  })

  it("ChartLine without a series keeps the sample curve", () => {
    const html = renderToStaticMarkup(createElement(ChartLine, {}))
    expect(html).toContain("<path")
    expect(html).not.toContain("M0.0 94.0 L100.0")
  })

  it("ChartLineArea fills under the real line", () => {
    const html = renderToStaticMarkup(createElement(ChartLineArea, { series: [10, 0] }))
    expect(html).toContain("M0.0 2.0 L200.0 94.0 L200 96 L0 96 Z")
  })

  it("ChartColumnsMini draws one bar per value, proportional, never below 2px", () => {
    const html = renderToStaticMarkup(createElement(ChartColumnsMini, { type: 4, series: [0, 30, 60] }))
    expect(html.match(/height:\d+px/g)).toEqual(["height:60px", "height:2px", "height:30px", "height:60px"])
  })
})
