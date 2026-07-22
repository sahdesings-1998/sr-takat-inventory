import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuditLogs } from "@/modules/dashboard/hooks/useReports";
import { useToast } from "@/contexts/ToastContext";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import Select from "@/components/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";

export default function AuditLogList() {
  const { data: logsData, isLoading, isError } = useAuditLogs();
  const logs = logsData?.data || [];
  const { showError } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch system audit logs.");
    }
  }, [isError, showError]);

  // Extract dynamic action & entity options
  const { actionOptions, entityOptions } = useMemo(() => {
    const actionsSet = new Set();
    const entitiesSet = new Set();

    (logs || []).forEach((l) => {
      if (l.action) actionsSet.add(l.action);
      if (l.entity) entitiesSet.add(l.entity);
    });

    const actOpts = [{ value: "", label: "All Actions" }].concat(
      Array.from(actionsSet).sort().map((a) => ({ value: a, label: a }))
    );
    const entOpts = [{ value: "", label: "All Entities" }].concat(
      Array.from(entitiesSet).sort().map((e) => ({ value: e, label: e }))
    );

    return { actionOptions: actOpts, entityOptions: entOpts };
  }, [logs]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return (logs || []).filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        const matchUser = (l.userId?.fullName || "System Admin").toLowerCase().includes(q);
        const matchEntity = (l.entity || "").toLowerCase().includes(q);
        const matchAction = (l.action || "").toLowerCase().includes(q);
        const matchId = (l.entityId || "").toLowerCase().includes(q);
        const matchDetails = (l.details || l.status || "").toLowerCase().includes(q);
        if (!matchUser && !matchEntity && !matchAction && !matchId && !matchDetails) return false;
      }
      if (actionFilter && l.action !== actionFilter) return false;
      if (entityFilter && l.entity !== entityFilter) return false;
      return true;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const activeFilterCount = (search ? 1 : 0) + (actionFilter ? 1 : 0) + (entityFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setActionFilter("");
    setEntityFilter("");
  };

  const headers = ["Timestamp", "User", "Entity / Action", "Target Entity ID", "Status / Details"];

  return (
    <div className="page-container space-y-0">
      {isLoading && !logs?.length ? (
        <SkeletonPageHeader showButton={false} showSearch={false} />
      ) : (
        <div className="border-b border-gray-200/80 pb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Full activity trail for every create, update, and delete action across inventory, costing, memos, and sales
          </p>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Audit Log Filters"
        chips={
          activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Active Filters:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                  Search: "{search}"
                  <button onClick={() => setSearchInput("")}>✕</button>
                </span>
              )}
              {actionFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Action: {actionFilter}
                  <button onClick={() => setActionFilter("")}>✕</button>
                </span>
              )}
              {entityFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Entity: {entityFilter}
                  <button onClick={() => setEntityFilter("")}>✕</button>
                </span>
              )}

              <button onClick={handleResetFilters} className="text-xs font-bold text-danger hover:underline ml-auto">
                Clear All
              </button>
            </div>
          )
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Filter 1: Search (Always First) */}
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
              Search Audit Logs
            </label>
            <SearchInput
              placeholder="Search user, action, entity, ID, details..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="audit-search"
            />
          </div>

          {/* Filter 2: Action */}
          <Select
            label="Action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={actionOptions}
            containerClassName="w-full"
          />

          {/* Filter 3: Entity */}
          <Select
            label="Entity"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            options={entityOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredLogs.length}</strong> of{" "}
          <strong className="text-gray-900">{logs.length}</strong> audit entries
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <DataTable
        headers={headers}
        data={filteredLogs}
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
