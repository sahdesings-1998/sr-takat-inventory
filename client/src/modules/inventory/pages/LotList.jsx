import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { useLots } from "../hooks/useInventory";
import { useSuppliers } from "@/modules/suppliers/hooks/useSuppliers";
import { lotSchema } from "../validation/inventorySchema";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import { useDebounce } from "@/hooks/useDebounce";

export default function LotList() {
  const { lots, isLoading, isError, createLot, updateLot, issueFromLot } = useLots();
  const { suppliers } = useSuppliers();
  const { showSuccess, showError } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [issueCarats, setIssueCarats] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch gemstone lots.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      gemstone: "",
      totalCarat: 0,
      estimatedPieces: 0,
      purchaseCost: 0,
      supplierId: "",
      location: "Vault",
      status: "In Stock",
    },
  });

  const handleOpenAdd = () => {
    setEditingLot(null);
    reset({
      gemstone: "",
      totalCarat: 0,
      estimatedPieces: 0,
      purchaseCost: 0,
      supplierId: "",
      location: "Vault",
      status: "In Stock",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (lot) => {
    setEditingLot(lot);
    reset({
      gemstone: lot.gemstone,
      totalCarat: lot.totalCarat,
      estimatedPieces: lot.estimatedPieces,
      purchaseCost: lot.purchaseCost,
      supplierId: lot.supplierId?._id || lot.supplierId || "",
      location: lot.location || "Vault",
      status: lot.status || "In Stock",
    });
    setIsOpen(true);
  };

  const handleOpenIssue = (lot) => {
    setSelectedLot(lot);
    setIssueCarats("");
    setIssueOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingLot) {
        await updateLot({ id: editingLot._id, data });
        showSuccess("Lot Updated", "Gemstone lot details updated successfully!");
      } else {
        await createLot(data);
        showSuccess("Lot Created", "New gemstone lot created successfully!");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsIssuing(true);
      await issueFromLot({
        id: selectedLot._id,
        carat: Number(issueCarats),
      });
      showSuccess("Issued successfully", `Issued ${issueCarats} carats from lot ${selectedLot.lotId}`);
      setIssueOpen(false);
    } catch (err) {
      showError("Issue Failed", err?.response?.data?.message || "Failed to issue from lot.");
    } finally {
      setIsIssuing(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Active":
        return "warning";
      case "Depleted":
        return "neutral";
      default:
        return "danger";
    }
  };

  const supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.companyName }));

  const headers = [
    "Lot ID",
    "Gemstone",
    "Total Carat",
    "Remaining",
    "Est. Pieces",
    "Cost",
    "Location",
    "Status",
    "Actions",
  ];

  // Client-side filtering
  const filteredLots = (lots || []).filter((lot) => {
    if (search) {
      const q = search.toLowerCase();
      const matchId = (lot.lotId || "").toLowerCase().includes(q);
      const matchGem = (lot.gemstone || "").toLowerCase().includes(q);
      const matchLoc = (lot.location || "").toLowerCase().includes(q);
      if (!matchId && !matchGem && !matchLoc) return false;
    }
    if (statusFilter && lot.status !== statusFilter) return false;
    return true;
  });

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "In Stock", label: "In Stock" },
    { value: "Active", label: "Active" },
    { value: "Depleted", label: "Depleted" },
  ];

  return (
    <div className="page-container space-y-0">
      {isLoading && !lots?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gemstone Lots &amp; Parcels</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Melee and parcel stones grouped by lot. Stock is deducted by carat weight only — piece count is informational.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Add Lot
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Lot Filters"
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
              {statusFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("")}>✕</button>
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
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
              Search Gemstone Lots
            </label>
            <SearchInput
              placeholder="Search lot ID, gemstone type, location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="lots-search"
            />
          </div>

          {/* Filter 2: Status */}
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredLots.length}</strong> of{" "}
          <strong className="text-gray-900">{lots.length}</strong> lots
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <DataTable
        headers={headers}
        data={filteredLots}
        isLoading={isLoading}
        emptyMessage="No lots found. Add gemstone lots or parcels to begin tracking."
        renderRow={(lot) => (
          <tr
            key={lot._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary truncate text-xs sm:text-sm">{lot.lotId}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">{lot.gemstone}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">{lot.totalCarat} ct</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">{lot.remainingCarat} ct</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">{lot.estimatedPieces}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">${lot.purchaseCost.toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{lot.location}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6">
              <Badge variant={getStatusVariant(lot.status)}>{lot.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                {lot.status !== "Depleted" && (
                  <TableActionButton
                    icon={ArrowDown}
                    title="Issue Carat"
                    onClick={() => handleOpenIssue(lot)}
                  />
                )}
                <TableActionButton
                  icon={Edit2}
                  title="Edit"
                  onClick={() => handleOpenEdit(lot)}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(lot, idx, { isExpanded, toggleExpand }) => (
          <div
            key={lot._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{lot.lotNo}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {lot.gemstone}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-mono font-bold text-gray-900">Total: {lot.totalCarat} ct</span>
                  <span className="text-gray-400 font-medium">•</span>
                  <span className="font-mono font-bold text-emerald-600">Rem: {lot.remainingCarat} ct</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusVariant(lot.status)}>{lot.status}</Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Est. Pieces</span>
                  <span className="font-mono font-medium text-gray-900">{lot.totalPieces ? `${lot.totalPieces} pcs` : "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Cost Price</span>
                  <span className="font-mono font-medium text-gray-900">${lot.costPrice ? lot.costPrice.toLocaleString() : "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">{lot.location || "—"}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  {lot.status !== "Depleted" && (
                    <TableActionButton
                      icon={ArrowDown}
                      title="Issue Carat"
                      showLabel
                      label="Issue"
                      onClick={() => handleOpenIssue(lot)}
                    />
                  )}
                  <TableActionButton
                    icon={Edit2}
                    title="Edit"
                    showLabel
                    label="Edit"
                    onClick={() => handleOpenEdit(lot)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingLot ? "Edit Lot" : "Add Lot"}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Select
            label="Gemstone Type *"
            type="gemstoneType"
            error={errors.gemstone?.message}
            value={watch("gemstone") || ""}
            onChange={(val) => setValue("gemstone", typeof val === "string" ? val : val?.target?.value || "", { shouldValidate: true })}
          />
          <Input
            label="Total Carat weight *"
            type="number"
            step="0.001"
            error={errors.totalCarat?.message}
            {...register("totalCarat")}
          />
          <Input
            label="Estimated Pieces"
            type="number"
            error={errors.estimatedPieces?.message}
            {...register("estimatedPieces")}
          />
          <Input
            label="Purchase Cost *"
            type="number"
            step="0.01"
            error={errors.purchaseCost?.message}
            {...register("purchaseCost")}
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">Supplier *</span>
              <Link to="/suppliers" target="_blank" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                + Add Supplier
              </Link>
            </div>
            <Select
              type="supplier"
              error={errors.supplierId?.message}
              options={supplierOptions}
              value={watch("supplierId") || ""}
              onChange={(val) => setValue("supplierId", typeof val === "string" ? val : val?.target?.value || "", { shouldValidate: true })}
            />
          </div>
          <Select
            label="Location"
            type="location"
            error={errors.location?.message}
            value={watch("location") || "Vault"}
            onChange={(val) => setValue("location", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "In Stock", label: "In Stock" },
              { value: "Active", label: "Active" },
              { value: "Depleted", label: "Depleted" },
              { value: "Missing", label: "Missing" },
            ]}
            value={watch("status") || "In Stock"}
            onChange={(val) => setValue("status", typeof val === "string" ? val : val?.target?.value || "In Stock")}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingLot ? "Save Changes" : "Add Lot"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue modal */}
      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Carats from Lot">
        <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Issue carat weight from this lot to production. Stock reduces by carat weight only — piece count is informational and is not used in stock calculations.<br />
            Available:{" "}
            <span className="font-semibold text-gray-900">{selectedLot?.remainingCarat} ct</span>
          </p>
          <Input
            label="Carat weight to issue *"
            type="number"
            step="0.001"
            value={issueCarats}
            onChange={(e) => setIssueCarats(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isIssuing}
              disabled={
                !issueCarats || Number(issueCarats) > (selectedLot?.remainingCarat || 0)
              }
            >
              Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
