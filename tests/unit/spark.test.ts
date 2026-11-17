import { describe, expect, it } from "vitest"

import { barHeights, linePoints, scaleSeries } from "@/lib/charts/spark"

describe("scaleSeries", () => {
  it("scales against the maximum, with zero on the baseline", () => {
    expect(scaleSeries([0, 5, 10])).toEqual([0, 0.5, 1])
  })

  it("is flat for an empty or all-zero series", () => {
    expect(scaleSeries([])).toEqual([])
    expect(scaleSeries([0, 0, 0])).toEqual([0, 0, 0])
  })

  it("treats negatives as zero", () => {
    expect(scaleSeries([-4, 2])).toEqual([0, 1])
  })
})

describe("linePoints", () => {
  it("always returns at least two points", () => {
    expect(linePoints([])).toEqual([0, 0])
    expect(linePoints([7])).toEqual([1, 1])
    expect(linePoints([1, 2])).toEqual([0.5, 1])
  })
})

describe("barHeights", () => {
  it("is proportional to the series and never thinner than the minimum", () => {
    expect(barHeights([0, 5, 10], 60)).toEqual([2, 30, 60])
    expect(barHeights([0, 0], 60)).toEqual([2, 2])
  })
})
