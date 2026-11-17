import { Skeleton } from "@/components/ui/skeleton"

/**
 * Body of /dashboard while it streams in: same column and spacing as DashboardPage, same grid as WidgetBoard
 * (24 tracks from @5xl, 2 from @xl, 1 below; charts 540 tall, tiles 164), so the real page replaces it without a jump.
 * The board itself is per-user and client-only, so this mirrors the default one: three charts, tiles, a table.
 * Used by app/dashboard/loading.tsx and inside DashboardSkeleton (shell fallback).
 */
function DashboardHomeSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="mx-auto flex w-full max-w-300 flex-col gap-6 md:gap-8 md:px-9 md:py-8 lg:py-12">
      <div className="flex flex-col gap-6 px-5 pt-5 md:gap-8 md:p-0">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="hidden h-8 w-28 rounded-r32 sm:block" />
            <Skeleton className="h-8 w-28 rounded-r32" />
          </div>
        </div>
      </div>
      <div className="min-h-210 px-5 md:px-0">
        <div className="@container">
          <div className="grid auto-rows-[minmax(164px,auto)] grid-cols-1 gap-3 @xl:grid-cols-2 @xl:gap-6 @5xl:grid-cols-24">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={`chart-${i}`} className="row-span-3 h-135 rounded-r20 @xl:col-span-1 @5xl:col-span-8" />
            ))}
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={`tile-${i}`} className="h-41 rounded-r20 @5xl:col-span-6" />
            ))}
            <Skeleton className="h-80 rounded-r20 @xl:col-span-2 @5xl:col-span-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Placeholder for the dashboard shell while the layout size is still unknown (first paint) and while a section loads.
 * Pure CSS breakpoints, so it matches the final layout at every size without needing JS: sidebar rail from md,
 * full sidebar from lg, same 64px bar on top.
 */
function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="flex min-h-svh bg-background-20">
      <aside className="sticky top-0 hidden h-svh w-16 shrink-0 flex-col justify-between bg-background-0 p-3 outline outline-background-100 -outline-offset-1 md:flex lg:w-62">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-8 rounded-r32" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 rounded-r32" />
          ))}
          <Skeleton className="h-10 rounded-r32" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-background-100 bg-background-0 p-4">
          <Skeleton className="h-8 w-32 rounded-r32 lg:w-48" />
          <Skeleton className="hidden h-4 w-56 md:block" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="hidden h-8 w-24 rounded-r32 lg:block" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </header>
        <main className="min-w-0 flex-1">
          <DashboardHomeSkeleton />
        </main>
      </div>
    </div>
  )
}

export { DashboardHomeSkeleton, DashboardSkeleton }
