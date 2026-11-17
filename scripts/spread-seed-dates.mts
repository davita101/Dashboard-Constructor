// Spreads the seeded demo data over time so the dashboard charts (per-month series, trends) have something to show.
// Only rows owned by the seed user are touched; real users' own projects are left alone.
//   Dry run (default): pnpm exec tsx --conditions=react-server scripts/spread-seed-dates.mts
//   Apply:             pnpm exec tsx --conditions=react-server scripts/spread-seed-dates.mts --apply
// Seeded RNG, relative to "now" (re-running shifts dates by the elapsed time). Project order by created_at is kept, so the
// sidebar order does not change. src/db/seed.ts uses the same spread for fresh seeds.
process.loadEnvFile(".env.local")

const { db } = await import("../src/db")
const { sql } = await import("drizzle-orm")
const { spreadProjectDate, spreadTaskDate } = await import("../src/db/seed-dates")

const SEED_OWNER = "seed_john-smith"
const apply = process.argv.includes("--apply")
const now = Date.now()

const projectRows = await db.execute<{ id: string; slug: string }>(sql`
  select id, slug from projects where owner_id = ${SEED_OWNER} order by created_at, slug
`)
const projects = projectRows.rows
const projectDates = projects.map((p, i) => ({ id: p.id, at: spreadProjectDate(i, projects.length, now) }))

const taskRows = await db.execute<{ id: string; project_id: string }>(sql`
  select t.id, t.project_id from tasks t join projects p on p.id = t.project_id
  where p.owner_id = ${SEED_OWNER} order by t.project_id, t.id
`)
const startByProject = new Map(projectDates.map((p) => [p.id, p.at.getTime()]))
const seen = new Map<string, number>()
const taskDates = taskRows.rows.map((t) => {
  const n = seen.get(t.project_id) ?? 0
  seen.set(t.project_id, n + 1)
  return { id: t.id, at: spreadTaskDate(startByProject.get(t.project_id)!, n, now) }
})

const month = (d: Date) => d.toISOString().slice(0, 7)
const hist = (dates: Date[]) => {
  const out = new Map<string, number>()
  for (const d of dates) out.set(month(d), (out.get(month(d)) ?? 0) + 1)
  return [...out.entries()].sort().map(([m, n]) => `${m}:${n}`).join(" ")
}
console.log(`seed projects: ${projects.length}, tasks: ${taskDates.length}`)
console.log("projects per month:", hist(projectDates.map((p) => p.at)))
console.log("tasks per month:   ", hist(taskDates.map((t) => t.at)))

if (!apply) {
  console.log("\nDry run: nothing written. Re-run with --apply.")
  process.exit(0)
}

// drizzle expands a JS array into a tuple, so build real Postgres arrays explicitly.
const ids = (rows: { id: string }[]) => sql`array[${sql.join(rows.map((r) => sql`${r.id}`), sql`, `)}]::uuid[]`
const stamps = (rows: { at: Date }[]) => sql`array[${sql.join(rows.map((r) => sql`${r.at.toISOString()}`), sql`, `)}]::timestamptz[]`

await db.transaction(async (tx) => {
  await tx.execute(sql`
    update projects p set created_at = v.at
    from unnest(${ids(projectDates)}, ${stamps(projectDates)}) as v(id, at)
    where p.id = v.id
  `)
  await tx.execute(sql`
    update tasks t set created_at = v.at
    from unnest(${ids(taskDates)}, ${stamps(taskDates)}) as v(id, at)
    where t.id = v.id
  `)
})
console.log("\nApplied.")
process.exit(0)
