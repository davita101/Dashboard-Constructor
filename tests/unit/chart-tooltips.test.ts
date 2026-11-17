import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CategoryTooltip, PointsTooltip } from "@/components/charts/cartesian-chart"

const usd = (v: number) => `$${v.toLocaleString("en-US")}`
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el)

describe("PointsTooltip (live line/column charts)", () => {
  const points = [
    { label: "Sep", values: [13200, 8897] },
    { label: "Oct", values: [28200, 19006] },
  ]
  const base = { points, seriesLabels: ["Income", "Cost"], colors: ["var(--purple-500)", "var(--orange-500)"], format: usd }

  it("shows the hovered month with every series, real names and formatted values", () => {
    const out = html(createElement(PointsTooltip, { ...base, active: true, label: "Oct" }))
    expect(out).toContain("Oct")
    expect(out).toContain("Income")
    expect(out).toContain("$28,200")
    expect(out).toContain("Cost")
    expect(out).toContain("$19,006")
  })

  it("never shows the Figma sample text or numbers", () => {
    const out = html(createElement(PointsTooltip, { ...base, active: true, label: "Sep" }))
    for (const fake of ["Views Products", "Avr. Month", "35,454", "28,454"]) expect(out).not.toContain(fake)
  })

  it("finds the month from the hovered row when Recharts gives no usable label", () => {
    const out = html(createElement(PointsTooltip, { ...base, active: true, label: undefined, payload: [{ payload: { month: "Sep", s0: 13200 } }] }))
    expect(out).toContain("Sep")
    expect(out).toContain("$13,200")
  })

  it("renders nothing when inactive or for an unknown label", () => {
    expect(html(createElement(PointsTooltip, { ...base, active: false, label: "Oct" }))).toBe("")
    expect(html(createElement(PointsTooltip, { ...base, active: true, label: "Jan" }))).toBe("")
  })
})

describe("CategoryTooltip (live tasks by project)", () => {
  const categories = [
    { name: "Website", values: [21], detail: [{ label: "New", value: 5 }, { label: "In work", value: 6 }, { label: "Done", value: 8 }, { label: "Failed", value: 2 }] },
  ]

  it("shows the project, its total and the status split", () => {
    const out = html(createElement(CategoryTooltip, { active: true, label: "Website", categories, totalLabel: "Tasks", colors: ["a", "b", "c", "d"], format: (v: number) => String(v) }))
    expect(out).toContain("Website")
    expect(out).toContain("Tasks")
    expect(out).toContain(">21<")
    for (const s of ["New", "In work", "Done", "Failed"]) expect(out).toContain(s)
  })

  it("finds the project from the hovered row when the label is not the category (vertical bars)", () => {
    const out = html(createElement(CategoryTooltip, { active: true, label: "New", payload: [{ payload: { name: "Website", p0: 5 } }], categories, totalLabel: "Tasks", colors: ["a", "b", "c", "d"], format: (v: number) => String(v) }))
    expect(out).toContain("Website")
    expect(out).not.toContain(">New<</div>")
  })

  it("uses the hovered row's position, so two projects with the same name do not mix up", () => {
    const twins = [
      { name: "Bank", values: [3], detail: [{ label: "Done", value: 3 }] },
      { name: "Bank", values: [9], detail: [{ label: "Done", value: 9 }] },
    ]
    const out = html(createElement(CategoryTooltip, { active: true, payload: [{ payload: { name: "Bank", i: 1 } }], categories: twins, totalLabel: "Tasks", colors: ["a"], format: (v: number) => String(v) }))
    expect(out).toContain(">9<")
    expect(out).not.toContain(">3<")
  })
})
