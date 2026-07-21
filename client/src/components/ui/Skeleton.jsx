/**
 * Skeleton.jsx
 * ─────────────────────────────────────────────────────────────
 * Central skeleton loading component library.
 *
 * Exports:
 *  - Skeleton           — base shimmer atom
 *  - SkeletonTableRows  — desktop table body rows
 *  - SkeletonMobileCards— mobile accordion card shapes
 *  - SkeletonStatCard   — dashboard KPI card placeholder
 *  - SkeletonPageHeader — page title + subtitle + action button
 *  - SkeletonDetailCard — detail page label-value grid
 *  - SkeletonChartBlock — chart panel placeholder
 *  - SkeletonFormFields — form field row placeholder
 *  - DashboardSkeleton  — full dashboard layout skeleton
 */

// ─── Base Atom ───────────────────────────────────────────────

/**
 * Base skeleton atom. Pass any Tailwind utility classes via `className`.
 */
export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-gray-200/80 rounded-lg ${className}`}
    />
  );
}

// ─── Desktop Table Skeleton Rows ─────────────────────────────

/**
 * Renders `count` skeleton rows matching a table with `colCount` columns.
 */
export function SkeletonTableRows({ count = 5, colCount = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-gray-50">
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <td key={colIdx} className="px-3 py-4 sm:px-4 md:px-6">
              <Skeleton
                className={`h-4 rounded-md ${
                  colIdx === 0
                    ? "w-24"
                    : colIdx === colCount - 1
                    ? "w-16"
                    : colIdx % 3 === 0
                    ? "w-32"
                    : colIdx % 2 === 0
                    ? "w-28"
                    : "w-20"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Mobile Accordion Card Skeletons ─────────────────────────

/**
 * Renders `count` skeleton accordion cards for mobile view (<768px).
 */
export function SkeletonMobileCards({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          aria-hidden="true"
        >
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <Skeleton className={`h-4 rounded-md ${idx % 2 === 0 ? "w-40" : "w-32"}`} />
              <Skeleton className="h-3 rounded-md w-24" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Dashboard Stat Card Skeleton ────────────────────────────

export function SkeletonStatCard({ featured = false }) {
  if (featured) {
    return (
      <div
        className="relative overflow-hidden rounded-[24px] bg-gray-800/80 p-5 min-h-[145px] flex flex-col justify-between animate-pulse"
        aria-hidden="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3 w-24 rounded bg-white/20" />
            <div className="h-7 w-32 rounded bg-white/20" />
            <div className="h-3 w-20 rounded bg-white/20" />
          </div>
          <div className="h-10 w-10 rounded-[12px] bg-white/20" />
        </div>
        <div className="h-5 w-28 bg-white/10 rounded-full mt-3" />
      </div>
    );
  }
  return (
    <div
      className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-3 min-h-[120px] animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-10 w-10 rounded-[12px]" />
      </div>
    </div>
  );
}

// ─── Page Header Skeleton ─────────────────────────────────────

/**
 * Matches the standard page header pattern:
 * H1 line + subtitle + search bar + action button.
 */
export function SkeletonPageHeader({ showButton = true, showSearch = true }) {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 sm:w-64 rounded-lg" />
          <Skeleton className="h-4 w-64 sm:w-96 rounded-md" />
        </div>
        {showButton && (
          <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
        )}
      </div>
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl max-w-sm" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      )}
    </div>
  );
}

// ─── Detail Card Skeleton ─────────────────────────────────────

/**
 * Matches a detail page info card with label-value rows.
 * @param {number} rows - Number of label-value row pairs to show.
 * @param {number} cols - Number of columns in the grid layout (1 or 2).
 * @param {boolean} title - Whether to show a card title row.
 */
export function SkeletonDetailCard({ rows = 6, cols = 2, title = true }) {
  return (
    <div
      className="rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col gap-5"
      aria-hidden="true"
    >
      {title && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      )}
      <div className={`grid grid-cols-1 ${cols === 2 ? "sm:grid-cols-2" : ""} gap-x-8 gap-y-4`}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton
              className={`h-5 rounded-md ${
                idx % 3 === 0 ? "w-full" : idx % 2 === 0 ? "w-3/4" : "w-1/2"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart Block Skeleton ─────────────────────────────────────

export function SkeletonChartBlock({ height = "h-64" }) {
  return (
    <div
      className="rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col gap-4"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-3 w-64 rounded-md" />
      </div>
      <div className={`${height} w-full flex items-end gap-2 pt-2`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`flex-1 rounded-t-lg ${
              i === 0
                ? "h-3/4"
                : i === 1
                ? "h-full"
                : i === 2
                ? "h-1/2"
                : i === 3
                ? "h-5/6"
                : i === 4
                ? "h-2/5"
                : "h-3/5"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Form Fields Skeleton ─────────────────────────────────────

export function SkeletonFormFields({ count = 4 }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ─── Full Dashboard Skeleton ──────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">

      {/* Welcome Banner */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 sm:w-72 rounded-lg" />
          <Skeleton className="h-4 w-64 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="hidden sm:block h-7 w-28 rounded-full" />
      </div>

      {/* KPI Stat Card Grid — 9 cards (1 featured + 8 normal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
        <SkeletonStatCard featured />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Financial Forecast Panel */}
      <div className="rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {["bg-emerald-50", "bg-rose-50", "bg-gray-50"].map((bg, i) => (
            <div key={i} className={`rounded-[18px] border border-gray-100 ${bg} p-4 flex flex-col gap-2`}>
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChartBlock height="h-64" />
        </div>
        <SkeletonChartBlock height="h-64" />
      </div>

      {/* Recent Activity / Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <Skeleton className="h-8 w-8 rounded-[10px] shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className={`h-3 rounded ${idx % 2 === 0 ? "w-32" : "w-24"}`} />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
