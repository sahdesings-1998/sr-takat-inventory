import { useEffect } from "react";
import { useAuditLogs } from "@/modules/dashboard/hooks/useReports";
import { useToast } from "@/contexts/ToastContext";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Audit Log</h1>
        <p className="text-sm text-gray-500">
          Full activity trail for every create, update, and delete action across inventory, costing, memos, and sales
        </p>
      </div>

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
      />
    </div>
  );
}
