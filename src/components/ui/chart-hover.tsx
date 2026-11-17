"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Shared look of every chart tooltip (Figma: black 80% pill, white text; white stays white in dark mode).
const chartTooltipClass = "grid min-w-26 items-start rounded-r10 bg-black-alpha-80 pb-1 font-default text-11 leading-20 font-bold text-white"

type ChartTooltipSeriesRow = { label: string; value: string; color?: string; /** Bold, e.g. a total. */ strong?: boolean }

/**
 * Tooltip with a title and one row per series, for charts whose hovered point has more values than the plot draws
 * (every series of that month, the status breakdown of a project, a slice's count and share). Same look as ChartTooltipContent.
 */
function ChartTooltipSeries({
  active = true,
  title,
  rows,
  className,
  style,
}: {
  active?: boolean
  title?: React.ReactNode
  rows: ChartTooltipSeriesRow[]
  className?: string
  style?: React.CSSProperties
}) {
  if (!active || !rows.length) return null
  return (
    <div data-slot="chart-tooltip-series" style={style} className={cn(chartTooltipClass, "min-w-34", className)}>
      {title ? <div className="px-2 pt-2 pb-1">{title}</div> : null}
      <div className="grid">
        {rows.map((row, i) => (
          <div key={i} className="flex w-full items-center gap-2 py-1 pr-4 pl-2">
            {row.color ? <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} /> : null}
            <span className={cn("flex-1", !row.strong && "font-semibold text-white-alpha-80")}>{row.label}</span>
            <span className="tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type ChartHoverTip = { title?: React.ReactNode; rows: ChartTooltipSeriesRow[] }

type HoverState = { tip: ChartHoverTip; x: number; y: number } | null

const ChartHoverContext = React.createContext<((tip: ChartHoverTip | undefined) => React.DOMAttributes<Element>) | null>(null)

/**
 * Hover tooltip for plain SVG / DOM charts (donut, pie, rings, sparklines) that have no Recharts tooltip.
 * Wrap the chart in <ChartHover> and spread `useChartHover()(tip)` on each hoverable element: the tooltip follows the
 * pointer. It is `fixed`, so a card's overflow never clips it, and it takes no layout space (`display: contents`).
 */
function ChartHover({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<HoverState>(null)
  const handlers = React.useCallback(
    (tip: ChartHoverTip | undefined): React.DOMAttributes<Element> =>
      tip
        ? {
            onPointerEnter: (e) => setState({ tip, x: e.clientX, y: e.clientY }),
            onPointerMove: (e) => setState({ tip, x: e.clientX, y: e.clientY }),
            onPointerLeave: () => setState(null),
          }
        : {},
    []
  )
  return (
    <ChartHoverContext.Provider value={handlers}>
      <span className="contents">
        {children}
        {state ? (
          <ChartTooltipSeries
            title={state.tip.title}
            rows={state.tip.rows}
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
            style={{ left: state.x, top: state.y - 12 }}
          />
        ) : null}
      </span>
    </ChartHoverContext.Provider>
  )
}

function HoverSpan({ tip, className, children }: { tip: ChartHoverTip; className?: string; children: React.ReactNode }) {
  const hover = useChartHover()
  return (
    <span className={className} {...hover(tip)}>
      {children}
    </span>
  )
}

/** Gives a whole element (a progress ring, a number) a hover tooltip without wrapping the page in <ChartHover> first. */
function ChartHoverTarget({ tip, className, children }: { tip?: ChartHoverTip; className?: string; children: React.ReactNode }) {
  if (!tip) return <>{children}</>
  return (
    <ChartHover>
      <HoverSpan tip={tip} className={className}>
        {children}
      </HoverSpan>
    </ChartHover>
  )
}

/** Handlers for one hoverable element; a no-op outside a <ChartHover> or without a tip. */
function useChartHover() {
  return React.useContext(ChartHoverContext) ?? noHover
}

const noHover = (): React.DOMAttributes<Element> => ({})

export { ChartHover, ChartHoverTarget, ChartTooltipSeries, chartTooltipClass, useChartHover }
export type { ChartHoverTip, ChartTooltipSeriesRow }
