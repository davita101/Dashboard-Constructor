import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RadialChart } from "@/components/charts/radial-chart"
import { ChartColumnsMini, ChartLine, ChartLineArea } from "@/components/ui/chart-parts"
import { completionTip, percentOf, seriesTips, shareTips } from "@/lib/charts/hover-tips"

const usd = (n: number) => `$${n.toLocaleString("en-US")}`

describe("percentOf", () => {
  it("rounds and survives an empty total", () => {
    expect(percentOf(1, 3)).toBe(33)
    expect(percentOf(2, 3)).toBe(67)
    expect(percentOf(5, 0)).toBe(0)
    expect(percentOf(-4, 10)).toBe(0)
  })
})

describe("shareTips", () => {
  const tips = shareTips(
    [
      { label: "New", value: 163, color: "blue" },
      { label: "Done", value: 110, color: "orange" },
    ],
    { count: "Tasks", share: "Share" }
  )

  it("gives each slice its name, count and share of the total", () => {
    expect(tips[0]).toEqual({ title: "New", rows: [{ label: "Tasks", value: "163", color: "blue" }, { label: "Share", value: "60%" }] })
    expect(tips[1].rows[1].value).toBe("40%")
  })

  it("is 0% everywhere when nothing is counted", () => {
    const empty = shareTips([{ label: "New", value: 0, color: "x" }], { count: "Tasks", share: "Share" })
    expect(empty[0].rows[1].value).toBe("0%")
  })
})

describe("completionTip", () => {
  it("shows done, remaining and the total with the completed share", () => {
    const tip = completionTip(163, 273, { title: "Task completion", done: "Done", remaining: "Remaining", total: "Tasks" })
    expect(tip.rows.map((r) => [r.label, r.value])).toEqual([
      ["Done", "163"],
      ["Remaining", "110"],
      ["Tasks", "273 (60%)"],
    ])
  })
})

describe("seriesTips", () => {
  it("labels each point with its month and formatted value", () => {
    const tips = seriesTips(["Jun", "Jul"], [16500, 2600], "Income", "purple", usd)
    expect(tips[0]).toEqual({ title: "Jun", rows: [{ label: "Income", value: "$16,500", color: "purple" }] })
    expect(tips[1].rows[0].value).toBe("$2,600")
  })
})

describe("charts render their hover targets", () => {
  const tips = seriesTips(["A", "B", "C"], [1, 2, 3], "Value", "var(--blue-500)")

  it("sparkline lines and areas get one strip per point", () => {
    for (const el of [createElement(ChartLine, { series: [1, 2, 3], tips }), createElement(ChartLineArea, { series: [1, 2, 3], tips })]) {
      expect(renderToStaticMarkup(el).match(/<rect /g)).toHaveLength(3)
    }
  })

  it("without tips there are no hover strips", () => {
    expect(renderToStaticMarkup(createElement(ChartLine, { series: [1, 2, 3] }))).not.toContain("<rect")
  })

  it("column sparklines render one bar per value", () => {
    const html = renderToStaticMarkup(createElement(ChartColumnsMini, { type: 4, series: [1, 2, 3], tips }))
    expect(html.match(/class="w-1 rounded-r2"/g)).toHaveLength(3)
  })

  it("donut slices render with their tips (one path per non-empty slice)", () => {
    const sliceTips = shareTips(
      [
        { label: "New", value: 3, color: "a" },
        { label: "Done", value: 1, color: "b" },
      ],
      { count: "Tasks", share: "Share" }
    )
    const html = renderToStaticMarkup(createElement(RadialChart, { preset: "card", kind: "donut", count: 4, values: [3, 1], tips: sliceTips }))
    expect(html.match(/<path /g)).toHaveLength(2)
  })
})
