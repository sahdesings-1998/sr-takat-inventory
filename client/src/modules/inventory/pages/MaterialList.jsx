import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, ArrowRightLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useMaterials } from "../hooks/useInventory";
import { materialSchema } from "../validation/inventorySchema";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Textarea from "@/components/ui/Textarea";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function MaterialList() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { materials, isLoading, isError, createMaterial, updateMaterial, adjustMaterialStock } =
    useMaterials({ search, category: categoryFilter });
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustRemarks, setAdjustRemarks] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch materials.");
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
    resolver: zodResolver(materialSchema),
    defaultValues: {
      materialCode: "",
      category: "Other",
      materialName: "",
      unit: "grams",
      quantity: 0,
      cost: 0,
      location: "Workshop Vault",
      status: "active",
    },
  });

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    reset({
      materialCode: "",
      category: "Other",
      materialName: "",
      unit: "grams",
      quantity: 0,
      cost: 0,
      location: "Workshop Vault",
      status: "active",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    reset({
      materialCode: material.materialCode,
      category: material.category || "Other",
      materialName: material.materialName,
      unit: material.unit || "grams",
      quantity: material.quantity,
      cost: material.cost,
      location: material.location || "Workshop Vault",
      status: material.status || "active",
    });
    setIsOpen(true);
  };

  const handleOpenAdjust = (material) => {
    setSelectedMaterial(material);
    setAdjustQty("");
    setAdjustRemarks("");
    setAdjustOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingMaterial) {
        await updateMaterial({ id: editingMaterial._id, data });
        showSuccess("Material Updated", "Material details updated successfully!");
      } else {
        await createMaterial(data);
        showSuccess("Material Created", "New material added successfully!");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsAdjusting(true);
      await adjustMaterialStock({
        id: selectedMaterial._id,
        quantityChange: Number(adjustQty),
        remarks: adjustRemarks,
      });
      showSuccess("Stock Adjusted", `Adjusted stock by ${adjustQty} ${selectedMaterial.unit}`);
      setAdjustOpen(false);
    } catch (err) {
      showError("Adjustment Failed", err?.response?.data?.message || "Failed to adjust stock.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const headers = [
    "Code",
    "Category",
    "Material Name",
    "Quantity",
    "Unit",
    "Unit Cost",
    "Location",
    "Status",
    "Actions",
  ];

  const activeFilterCount = (search ? 1 : 0) + (categoryFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
  };

  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "Gold", label: "Gold" },
    { value: "Silver", label: "Silver" },
    { value: "Platinum", label: "Platinum" },
    { value: "Setting", label: "Setting" },
    { value: "Findings", label: "Findings" },
    { value: "Packaging", label: "Packaging" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="page-container space-y-0">
      {isLoading && !materials?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Raw Materials &amp; Metals</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Track gold, silver, platinum, settings, components, straps, and other raw materials used in manufacturing
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Add Material
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Material Filters"
        chips={
          activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Active Filters:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                  Search: "{search}"
                  <button onClick={() => setSearch("")}>✕</button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter("")}>✕</button>
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
              Search Raw Materials
            </label>
            <SearchInput
              placeholder="Search code, name, category, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              className="w-full"
              id="materials-search"
            />
          </div>

          {/* Filter 2: Category */}
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categoryOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{materials.length}</strong> raw materials
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <DataTable
        headers={headers}
        data={materials}
        isLoading={isLoading}
        emptyMessage="No materials found. Add gold, silver, or other raw materials to begin tracking."
        renderRow={(mat) => (
          <tr
            key={mat._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary truncate text-xs sm:text-sm">{mat.materialCode}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{mat.category}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">{mat.materialName}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">{mat.quantity}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">{mat.unit}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">${mat.cost.toFixed(2)}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{mat.location}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6">
              <Badge variant={mat.status === "active" ? "success" : "neutral"}>{mat.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <TableActionButton
                  icon={ArrowRightLeft}
                  title="Adjust Stock"
                  onClick={() => handleOpenAdjust(mat)}
                />
                <TableActionButton
                  icon={Edit2}
                  title="Edit"
                  onClick={() => handleOpenEdit(mat)}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(mat, idx, { isExpanded, toggleExpand }) => (
          <div
            key={mat._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{mat.materialCode}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {mat.materialName}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-mono font-bold text-gray-900">{mat.quantity} {mat.unit}</span>
                  <span className="text-gray-400 font-medium">•</span>
                  <span className="font-mono font-bold text-emerald-600">${mat.cost ? mat.cost.toFixed(2) : "0.00"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={mat.status === "active" ? "success" : "neutral"}>{mat.status}</Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">{mat.category}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">{mat.location || "—"}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <TableActionButton
                    icon={ArrowRightLeft}
                    title="Adjust Stock"
                    showLabel
                    label="Adjust"
                    onClick={() => handleOpenAdjust(mat)}
                  />
                  <TableActionButton
                    icon={Edit2}
                    title="Edit"
                    showLabel
                    label="Edit"
                    onClick={() => handleOpenEdit(mat)}
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
        title={editingMaterial ? "Edit Material" : "Add Material"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            label="Material Code *"
            error={errors.materialCode?.message}
            {...register("materialCode")}
          />
          <Select
            label="Category *"
            type="material"
            error={errors.category?.message}
            value={watch("category") || "Other"}
            onChange={(val) => setValue("category", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input
            label="Material Name *"
            error={errors.materialName?.message}
            {...register("materialName")}
          />
          <Select
            label="Unit (e.g. grams, pieces) *"
            type="unit"
            error={errors.unit?.message}
            value={watch("unit") || "grams"}
            onChange={(val) => setValue("unit", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input
            label="Initial Quantity"
            type="number"
            error={errors.quantity?.message}
            {...register("quantity")}
          />
          <Input
            label="Unit Cost *"
            type="number"
            step="0.01"
            error={errors.cost?.message}
            {...register("cost")}
          />
          <Select
            label="Location"
            type="location"
            error={errors.location?.message}
            value={watch("location") || "Workshop Vault"}
            onChange={(val) => setValue("location", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={watch("status") || "active"}
            onChange={(val) => setValue("status", typeof val === "string" ? val : val?.target?.value || "active")}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingMaterial ? "Save Changes" : "Add Material"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust stock modal */}
      <Modal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust Material Stock">
        <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Adjust stock quantity for this material. Use a positive value to add stock and a negative value to reduce it.
            Note: scrap gold recovered from production is tracked in a separate Scrap Gold Stock bucket, not merged back into clean metal stock.<br />
            Current stock:{" "}
            <span className="font-semibold text-gray-900">
              {selectedMaterial?.quantity} {selectedMaterial?.unit}
            </span>
          </p>
          <Input
            label="Quantity Adjustment (e.g. +10 or -5) *"
            type="number"
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
          />
          <Textarea
            label="Remarks / Reason *"
            value={adjustRemarks}
            onChange={(e) => setAdjustRemarks(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isAdjusting}
              disabled={
                !adjustQty ||
                !adjustRemarks ||
                (Number(adjustQty) < 0 &&
                  Math.abs(Number(adjustQty)) > (selectedMaterial?.quantity || 0))
              }
            >
              Adjust
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
