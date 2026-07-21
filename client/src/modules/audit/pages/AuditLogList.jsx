import { useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuditLogs } from "@/modules/dashboard/hooks/useReports";
import { useToast } from "@/contexts/ToastContext";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function AuditLogList() {
  const { data: logsData, isLoading, isError } = useAuditLogs();
  const logs = logsData?.data || [];
  const { showError } = useToast();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch system audit logs.");
    }
  }, [isError, showError]);

  const headers = ["Timestamp", "User", "Entity / Action", "Target Entity ID", "Status / Details"];

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !logs?.length ? (
        <SkeletonPageHeader showButton={false} showSearch={false} />
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Audit Log</h1>
          <p className="text-subtitle mt-1">
            Full activity trail for every create, update, and delete action across inventory, costing, memos, and sales
          </p>
        </div>
      )}

      <DataTable
        headers={headers}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No audit entries recorded yet."
        renderRow={(log) => (
          <tr
            key={log._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
              {new Date(log.timestamp).toLocaleString()}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-950 truncate text-xs sm:text-sm">
              {log.userId?.fullName || "System Admin"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 text-xs sm:text-sm min-w-0">
              {log.entity} / <span className="text-primary font-bold">{log.action}</span>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 font-mono text-[10px] sm:text-xs break-all">{log.entityId}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6">
              <Badge
                variant={
                  log.action === "delete"
                    ? "danger"
                    : log.action === "create"
                      ? "success"
                      : "info"
                }
              >
                {log.action}
              </Badge>
            </td>
          </tr>
        )}
        renderMobileCard={(log, idx, { isExpanded, toggleExpand }) => (
          <div
            key={log._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm truncate">{log.entity} / <span className="text-primary font-bold">{log.action}</span></span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-medium text-gray-900">{log.userId?.fullName || "System Admin"}</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    log.action === "delete"
                      ? "danger"
                      : log.action === "create"
                        ? "success"
                        : "info"
                  }
                >
                  {log.action}
                </Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Target Entity ID</span>
                  <span className="font-mono text-gray-900 break-all">{log.entityId || "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Timestamp</span>
                  <span className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
