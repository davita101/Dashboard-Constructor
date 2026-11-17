import { DashboardHomeSkeleton } from "@/components/dashboard/dashboard-skeleton"

// Body area only: the shell (navbar, sidebar, footer) is already mounted by layout.tsx while a section streams in,
// so a full-shell skeleton here would draw a second sidebar inside the real one.
export default function Loading() {
  return <DashboardHomeSkeleton />
}
