// Deterministic "random" creation dates for the seeded demo data, shared by src/db/seed.ts and
// scripts/spread-seed-dates.mts. No DB or Next imports, so it is unit-testable.

const DAY = 86_400_000

/** How far back the oldest seeded project starts: the dashboard charts show 9 months, so it covers most of them. */
export const SEED_SPAN_DAYS = 260

/** mulberry32: small seeded PRNG, 0 <= r < 1. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Start date of project `index` of `count` (0 = oldest): evenly spaced over SEED_SPAN_DAYS with a few days of jitter,
 * oldest first, so ordering by created_at keeps the Figma sidebar order. The newest is about a day old.
 */
export function spreadProjectDate(index: number, count: number, now: number): Date {
  const step = SEED_SPAN_DAYS / Math.max(count, 1)
  const jitter = (rng(index * 7919 + 13)() - 0.5) * Math.min(6, step * 0.6) * DAY
  const at = now - (count - 1 - index) * step * DAY + jitter
  return new Date(Math.min(at, now - DAY))
}

/**
 * Creation date of the `n`th task of a project that started at `start`: anywhere between the start and a day ago,
 * leaning toward recent (r^0.7 pushes values up), so each month has some tasks and the latest months have the most.
 */
export function spreadTaskDate(start: number, n: number, now: number): Date {
  const r = rng(n * 104729 + 31 + (start % 9973))()
  const end = now - DAY
  return new Date(start + Math.max(0, end - start) * Math.pow(r, 0.7))
}
