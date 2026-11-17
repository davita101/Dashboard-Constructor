import { describe, expect, it } from "vitest"

import { SEED_SPAN_DAYS, spreadProjectDate, spreadTaskDate } from "@/db/seed-dates"

const DAY = 86_400_000
const now = Date.UTC(2026, 10, 17, 12)

describe("spreadProjectDate", () => {
  const dates = Array.from({ length: 13 }, (_, i) => spreadProjectDate(i, 13, now).getTime())

  it("keeps the project order (oldest first)", () => {
    expect(dates).toEqual([...dates].sort((a, b) => a - b))
  })

  it("starts within the span and ends about a day ago", () => {
    expect(now - dates[0]).toBeLessThanOrEqual((SEED_SPAN_DAYS + 3) * DAY)
    expect(now - dates[12]).toBeGreaterThanOrEqual(DAY)
    expect(now - dates[12]).toBeLessThan(5 * DAY)
  })

  it("covers many different months", () => {
    expect(new Set(dates.map((d) => new Date(d).toISOString().slice(0, 7))).size).toBeGreaterThanOrEqual(8)
  })
})

describe("spreadTaskDate", () => {
  const start = now - 120 * DAY

  it("stays between the project start and a day ago, never in the future", () => {
    for (let n = 0; n < 200; n++) {
      const t = spreadTaskDate(start, n, now).getTime()
      expect(t).toBeGreaterThanOrEqual(start)
      expect(t).toBeLessThanOrEqual(now - DAY)
    }
  })

  it("is deterministic and leans toward recent dates", () => {
    expect(spreadTaskDate(start, 5, now).getTime()).toBe(spreadTaskDate(start, 5, now).getTime())
    const times = Array.from({ length: 300 }, (_, n) => spreadTaskDate(start, n, now).getTime())
    const recentHalf = times.filter((t) => t > start + (now - DAY - start) / 2).length
    expect(recentHalf).toBeGreaterThan(150)
  })

  it("handles a project that starts after 'yesterday'", () => {
    expect(spreadTaskDate(now, 0, now).getTime()).toBe(now)
  })
})
