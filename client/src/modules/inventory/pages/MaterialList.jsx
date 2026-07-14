import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, ArrowRightLeft } from "lucide-react";
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
      await adjustMaterialStock({
        id: selectedMaterial._id,
        quantityChange: Number(adjustQty),
        remarks: adjustRemarks,
      });
      showSuccess("Stock Adjusted", `Adjusted stock by ${adjustQty} ${selectedMaterial.unit}`);
      setAdjustOpen(false);
    } catch (err) {
      showError("Adjustment Failed", err?.response?.data?.message || "Failed to adjust stock.");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Raw Materials & Metals</h2>
          <p className="text-sm text-gray-500">
            Track gold, silver, platinum, settings, components, straps, and other raw materials used in manufacturing
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="w-fit">
          <Plus className="h-4 w-4" /> Add Material
        </Button>
      </div>

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
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm"
          >
            <td className="px-6 py-4 font-semibold text-primary">{mat.materialCode}</td>
            <td className="px-6 py-4 text-gray-600">{mat.category}</td>
            <td className="px-6 py-4 font-medium text-gray-900">{mat.materialName}</td>
            <td className="px-6 py-4 font-semibold text-gray-900">{mat.quantity}</td>
            <td className="px-6 py-4 text-gray-600">{mat.unit}</td>
            <td className="px-6 py-4 text-gray-600">${mat.cost.toFixed(2)}</td>
            <td className="px-6 py-4 text-gray-600">{mat.location}</td>
            <td className="px-6 py-4">
              <Badge variant={mat.status === "active" ? "success" : "neutral"}>{mat.status}</Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={() => handleOpenAdjust(mat)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Adjust Stock"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(mat)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
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
