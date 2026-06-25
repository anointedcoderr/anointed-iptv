// Branded shimmer skeletons for perceived-performance during loads.
export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />
}

export function ChannelCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl glass-card" aria-hidden="true">
      <div className="h-28 p-3">
        <Skeleton className="mx-auto mt-3 h-14 w-14 rounded-xl" />
      </div>
      <div className="space-y-2 px-3 pb-3 pt-2.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}

export function TableRowsSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? "w-40" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
