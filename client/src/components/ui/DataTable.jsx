import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonTableRows, SkeletonMobileCards } from "./Skeleton";

export function DataTable({
  headers,
  data = [],
  isLoading,
  emptyMessage = "No items found",
  renderRow,
  renderMobileCard,
  skeletonRows = 5,
}) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full">
      {/* ── DESKTOP & TABLET VIEW (≥ 768px md:block) ────────────────────────── */}
      <div className="hidden md:block w-full overflow-x-auto rounded-[20px] border border-gray-100/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <table className="w-full min-w-0 table-auto border-collapse text-left text-xs sm:text-sm text-gray-900">
          <thead className="border-b border-gray-100 bg-gray-50/60">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap min-w-0 select-none"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <SkeletonTableRows count={skeletonRows} colCount={headers.length} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-16 text-center text-xs sm:text-sm font-medium text-gray-400 sm:px-6">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE ACCORDION CARD VIEW (< 768px md:hidden) ───────────────────── */}
      <div className="md:hidden flex flex-col gap-3 w-full">
        {isLoading ? (
          <SkeletonMobileCards count={skeletonRows} />
        ) : data.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-xs font-medium text-gray-400 shadow-sm">
            {emptyMessage}
          </div>
        ) : (
          data.map((item, idx) => {
            const itemId = item._id || item.id || idx;
            const isExpanded = Boolean(expandedRows[itemId]);

            if (renderMobileCard) {
              return renderMobileCard(item, idx, {
                isExpanded,
                toggleExpand: () => toggleRow(itemId),
              });
            }

            // Fallback mobile accordion card if renderMobileCard is not passed
            return (
              <div
                key={itemId}
                className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden transition-all duration-200"
              >
                {/* Header Row (Tap to expand/collapse) */}
                <button
                  type="button"
                  onClick={() => toggleRow(itemId)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.name || item.companyName || item.title || item.invoiceNo || item.memoNo || item.stoneId || item.jobNo || item.productCode || `Record #${idx + 1}`}
                    </p>
                    {item.createdAt && (
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2 text-xs text-gray-700">
                    {Object.entries(item)
                      .filter(([key]) => !["_id", "id", "updatedAt", "__v", "imageUrls"].includes(key) && typeof item[key] !== "object")
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2 border-b border-gray-100/60 pb-1.5 last:border-b-0">
                          <span className="font-semibold text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                          <span className="font-medium text-gray-900 text-right truncate">{String(val)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DataTable;
