import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, ArrowRightLeft, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useGemstones } from "../hooks/useInventory";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import { useSuppliers } from "@/modules/suppliers/hooks/useSuppliers";
import { useCertificates } from "@/modules/certificates/hooks/useCertificates";
import { gemstoneSchema } from "../validation/inventorySchema";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import TableActionButton from "@/components/ui/TableActionButton";
import ImageUploader from "@/components/ui/ImageUploader";
import FilterPanel from "@/components/ui/FilterPanel";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";

export default function GemstoneList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const {
    gemstones,
    isLoading,
    isError,
    createGemstone,
    updateGemstone,
    updateGemstoneStatus,
    deleteGemstone,
  } = useGemstones({ search, status: statusFilter });
  const { suppliers } = useSuppliers();
  const { certificates } = useCertificates();
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingStone, setEditingStone] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [selectedStone, setSelectedStone] = useState(null);
  const [statusValue, setStatusValue] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch gemstones.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(gemstoneSchema),
    defaultValues: {
      stockNo: "",
      gemstone: "",
      variety: "",
      origin: "",
      shape: "",
      carat: 0,
      pieces: 1,
      color: "",
      clarity: "",
      treatment: "None",
      purchasePrice: 0,
      supplierId: "",
      location: "Vault",
      status: "In Stock",
      certificateId: "",
      notes: "",
      images: [],
    },
  });

  const handleOpenAdd = () => {
    setEditingStone(null);
    reset({
      stockNo: "",
      gemstone: "",
      variety: "",
      origin: "",
      shape: "",
      carat: 0,
      pieces: 1,
      color: "",
      clarity: "",
      treatment: "None",
      purchasePrice: 0,
      supplierId: "",
      location: "Vault",
      status: "In Stock",
      certificateId: "",
      notes: "",
      images: [],
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (stone) => {
    setEditingStone(stone);
    reset({
      stockNo: stone.stockNo,
      gemstone: stone.gemstone,
      variety: stone.variety || "",
      origin: stone.origin || "",
      shape: stone.shape || "",
      carat: stone.carat,
      pieces: stone.pieces,
      color: stone.color || "",
      clarity: stone.clarity || "",
      treatment: stone.treatment || "None",
      purchasePrice: stone.purchasePrice,
      supplierId: stone.supplierId?._id || stone.supplierId || "",
      location: stone.location || "Vault",
      status: stone.status || "In Stock",
      certificateId: stone.certificateId?._id || stone.certificateId || "",
      notes: stone.notes || "",
      images: stone.images || [],
    });
    setIsOpen(true);
  };

  const handleOpenStatus = (stone) => {
    setSelectedStone(stone);
    setStatusValue(stone.status);
    setStatusRemarks("");
    setStatusOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingStone) {
        await updateGemstone({ id: editingStone._id, data });
        showSuccess("Gemstone Updated", "Gemstone details updated successfully!");
      } else {
        await createGemstone(data);
        showSuccess("Gemstone Added", "New gemstone added to inventory.");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingStatus(true);
      await updateGemstoneStatus({
        id: selectedStone._id,
        status: statusValue,
        remarks: statusRemarks,
      });
      showSuccess("Status Updated", "Gemstone status updated successfully!");
      setStatusOpen(false);
    } catch (err) {
      showError("Update Failed", "Failed to update gemstone status.");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, id, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteGemstone(deleteConfirm.id);
      showSuccess("Gemstone Deleted", "Gemstone has been removed successfully.");
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete gemstone.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Reserved":
      case "On Memo":
        return "warning";
      case "In Production":
        return "info";
      case "Sold":
        return "accent";
      default:
        return "neutral";
    }
  };

  const supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.companyName }));

  const headers = [
    "Stone ID",
    "Stock No",
    "Gemstone",
    "Variety",
    "Weight",
    "Cost/Carat",
    "Price",
    "Location",
    "Status",
    "Actions",
  ];

  const [typeFilter, setTypeFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");

  // Extract dynamic filter options from gemstone inventory
  const { typeOpts, originOpts } = useMemo(() => {
    const typesSet = new Set();
    const originsSet = new Set();
    (gemstones || []).forEach((g) => {
      if (g.gemstone) typesSet.add(g.gemstone);
      if (g.origin) originsSet.add(g.origin);
    });

    const tOpts = [{ value: "", label: "All Gemstone Types" }].concat(
      Array.from(typesSet).sort().map((t) => ({ value: t, label: t }))
    );
    const oOpts = [{ value: "", label: "All Origins" }].concat(
      Array.from(originsSet).sort().map((o) => ({ value: o, label: o }))
    );

    return { typeOpts: tOpts, originOpts: oOpts };
  }, [gemstones]);

  // Client-side filtering across type, origin, and status
  const filteredGemstones = useMemo(() => {
    if (!gemstones) return [];
    return gemstones.filter((g) => {
      if (typeFilter && g.gemstone !== typeFilter) return false;
      if (originFilter && g.origin !== originFilter) return false;
      return true;
    });
  }, [gemstones, typeFilter, originFilter]);

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0) + (typeFilter ? 1 : 0) + (originFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setTypeFilter("");
    setOriginFilter("");
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "In Stock", label: "In Stock" },
    { value: "Reserved", label: "Reserved" },
    { value: "In Production", label: "In Production" },
    { value: "On Memo", label: "On Memo" },
    { value: "Sold", label: "Sold" },
    { value: "Damaged", label: "Damaged" },
    { value: "Missing", label: "Missing" },
  ];

  return (
    <div className="page-container space-y-0">
      {isLoading && !gemstones?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Individual Gemstone Stock</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Track individual stones by ID, type, origin, carat weight, certificate, and status lifecycle
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Add Gemstone
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Gemstone Filters"
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
              {typeFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter("")}>✕</button>
                </span>
              )}
              {originFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Origin: {originFilter}
                  <button onClick={() => setOriginFilter("")}>✕</button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Filter 1: Search (Always First) */}
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
              Search Gemstones
            </label>
            <SearchInput
              placeholder="Search ID, type, variety, shape, origin..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="gemstones-search"
            />
          </div>

          {/* Filter 2: Gemstone Type */}
          <Select
            label="Gemstone Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOpts}
            containerClassName="w-full"
          />

          {/* Filter 3: Origin */}
          <Select
            label="Origin"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            options={originOpts}
            containerClassName="w-full"
          />

          {/* Filter 4: Status */}
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredGemstones.length}</strong> of{" "}
          <strong className="text-gray-900">{gemstones.length}</strong> gemstones
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <DataTable
        headers={headers}
        data={filteredGemstones}
        isLoading={isLoading}
        emptyMessage="No gemstones found"
        renderRow={(stone) => (
          <tr
            key={stone._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {stone.images && stone.images[0] ? (
                  <img
                    src={stone.images[0]}
                    alt={stone.stoneId}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(stone.images[0]);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-100 text-gray-400 flex-shrink-0">
                    <ImageIcon className="h-4.5 w-4.5" />
                  </div>
                )}
                <span className="truncate">{stone.stoneId}</span>
              </div>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{stone.stockNo}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">
              {stone.gemstone} {stone.variety ? `(${stone.variety})` : ""}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{stone.shape || "—"}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 font-semibold whitespace-nowrap text-xs sm:text-sm">
              {stone.carat} ct ({stone.pieces} pc)
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
              ${stone.costPerCarat ? stone.costPerCarat.toFixed(2) : "0.00"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">
              ${stone.purchasePrice.toLocaleString()}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{stone.location}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6">
              <Badge variant={getStatusVariant(stone.status)}>{stone.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <TableActionButton
                  icon={ArrowRightLeft}
                  title="Adjust Status"
                  onClick={() => handleOpenStatus(stone)}
                />
                <TableActionButton
                  icon={Edit2}
                  title="Edit"
                  onClick={() => handleOpenEdit(stone)}
                />
                <TableActionButton
                  icon={Trash2}
                  title="Delete"
                  variant="danger"
                  isLoading={deleteConfirm.open && deleteConfirm.id === stone._id && deleteConfirm.isLoading}
                  onClick={() => handleDelete(stone._id)}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(stone, idx, { isExpanded, toggleExpand }) => (
          <div
            key={stone._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{stone.stoneId}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {stone.gemstone}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-mono font-bold text-gray-900">{stone.carat} ct</span>
                  <span className="text-gray-400 font-medium">•</span>
                  <span className="font-mono font-bold text-emerald-600">${stone.costPrice ? stone.costPrice.toLocaleString() : "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusVariant(stone.status)}>{stone.status}</Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Variety / Color</span>
                  <span className="font-medium text-gray-900">{stone.variety || "—"} / {stone.color || "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Shape / Cut</span>
                  <span className="font-medium text-gray-900">{stone.shape || "—"} / {stone.cut || "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Origin / Location</span>
                  <span className="font-medium text-gray-900">{stone.origin || "—"} / {stone.location || "—"}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <TableActionButton
                    icon={ArrowRightLeft}
                    title="Adjust Status"
                    showLabel
                    label="Status"
                    onClick={() => handleOpenStatus(stone)}
                  />
                  <TableActionButton
                    icon={Edit2}
                    title="Edit"
                    showLabel
                    label="Edit"
                    onClick={() => handleOpenEdit(stone)}
                  />
                  <TableActionButton
                    icon={Trash2}
                    title="Delete"
                    variant="danger"
                    showLabel
                    label="Delete"
                    isLoading={deleteConfirm.open && deleteConfirm.id === stone._id && deleteConfirm.isLoading}
                    onClick={() => handleDelete(stone._id)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingStone ? "Edit Gemstone" : "Add Gemstone"}
        className="max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          noValidate
        >

          <Input label="Stock No *" error={errors.stockNo?.message} {...register("stockNo")} />
          <Input
            label="Gemstone Type (e.g. Ruby) *"
            error={errors.gemstone?.message}
            {...register("gemstone")}
          />
          <Input label="Variety" error={errors.variety?.message} {...register("variety")} />
          <Input label="Shape/Cut" error={errors.shape?.message} {...register("shape")} />
          <Input label="Origin" error={errors.origin?.message} {...register("origin")} />
          <Input
            label="Carat Weight *"
            type="number"
            step="0.001"
            error={errors.carat?.message}
            {...register("carat")}
          />
          <Input
            label="Pieces *"
            type="number"
            error={errors.pieces?.message}
            {...register("pieces")}
          />
          <Input label="Color" error={errors.color?.message} {...register("color")} />
          <Input label="Clarity" error={errors.clarity?.message} {...register("clarity")} />
          <Input label="Treatment" error={errors.treatment?.message} {...register("treatment")} />
          <Input
            label="Purchase Price *"
            type="number"
            step="0.01"
            error={errors.purchasePrice?.message}
            {...register("purchasePrice")}
          />
          <Select
            label="Supplier *"
            error={errors.supplierId?.message}
            options={supplierOptions}
            {...register("supplierId")}
          />
          <Input label="Location" error={errors.location?.message} {...register("location")} />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "In Stock", label: "In Stock" },
              { value: "Reserved", label: "Reserved" },
              { value: "In Production", label: "In Production" },
              { value: "On Memo", label: "On Memo" },
              { value: "Sold", label: "Sold" },
              { value: "Damaged", label: "Damaged" },
              { value: "Missing", label: "Missing" },
            ]}
            {...register("status")}
          />
          <Select
            label="Assigned Certificate"
            error={errors.certificateId?.message}
            options={[
              { value: "", label: "No Certificate Linked" },
              ...certificates.map((c) => ({
                value: c._id,
                label: `${c.certificateNo} - ${c.lab} (${c.reportType})`,
              })),
            ]}
            {...register("certificateId")}
          />
          <Textarea
            label="Notes"
            containerClassName="md:col-span-2"
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="md:col-span-2">
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader
                  label="Gemstone Images"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.images?.message}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-3 md:col-span-2 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingStone ? "Save Changes" : "Add Gemstone"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Status Modal */}
      <Modal isOpen={statusOpen} onClose={() => setStatusOpen(false)} title="Adjust Gemstone Status">
        <form onSubmit={handleStatusSubmit} className="flex flex-col gap-4">
          <Select
            label="New Status"
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            options={[
              { value: "In Stock", label: "In Stock" },
              { value: "Reserved", label: "Reserved" },
              { value: "In Production", label: "In Production" },
              { value: "On Memo", label: "On Memo" },
              { value: "Sold", label: "Sold" },
              { value: "Damaged", label: "Damaged" },
              { value: "Missing", label: "Missing" },
            ]}
          />
          <Textarea
            label="Adjustment Remarks / Reason"
            value={statusRemarks}
            onChange={(e) => setStatusRemarks(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingStatus}>Update Status</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Gemstone"
        message="This gemstone will be removed from your inventory. This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteConfirm.isLoading}
        variant="danger"
      />

      <DocumentPreviewModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        fileUrl={previewImage}
        fileName="Gemstone Image Preview"
        fileType="Image"
      />
    </div>
  );
}
