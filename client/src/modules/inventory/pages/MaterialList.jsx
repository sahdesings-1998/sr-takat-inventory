import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, ArrowRightLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useMaterials } from "../hooks/useInventory";
import { materialSchema } from "../validation/inventorySchema";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
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

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !materials?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Raw Materials &amp; Metals</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Track gold, silver, platinum, settings, components, straps, and other raw materials used in manufacturing
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit">
            <Plus className="h-4 w-4" /> Add Material
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Input
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="flex-1 w-full"
        />
        <Select
          placeholder="All Categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          containerClassName="w-full sm:w-48"
          options={[
            { value: "Gold", label: "Gold" },
            { value: "Silver", label: "Silver" },
            { value: "Platinum", label: "Platinum" },
            { value: "Setting", label: "Setting" },
            { value: "Findings", label: "Findings" },
            { value: "Packaging", label: "Packaging" },
            { value: "Other", label: "Other" },
          ]}
        />
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
            error={errors.category?.message}
            options={[
              { value: "Gold", label: "Gold" },
              { value: "Silver", label: "Silver" },
              { value: "Platinum", label: "Platinum" },
              { value: "Setting", label: "Setting" },
              { value: "Findings", label: "Findings" },
              { value: "Packaging", label: "Packaging" },
              { value: "Other", label: "Other" },
            ]}
            {...register("category")}
          />
          <Input
            label="Material Name *"
            error={errors.materialName?.message}
            {...register("materialName")}
          />
          <Input
            label="Unit (e.g. grams, pieces) *"
            error={errors.unit?.message}
            {...register("unit")}
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
          <Input label="Location" error={errors.location?.message} {...register("location")} />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            {...register("status")}
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
