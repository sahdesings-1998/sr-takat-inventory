import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, ArrowRightLeft, Image as ImageIcon } from "lucide-react";
import { useGemstones } from "../hooks/useInventory";
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
import ImageUploader from "@/components/ui/ImageUploader";

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
      await updateGemstoneStatus({
        id: selectedStone._id,
        status: statusValue,
        remarks: statusRemarks,
      });
      showSuccess("Status Updated", "Gemstone status updated successfully!");
      setStatusOpen(false);
    } catch (err) {
      showError("Update Failed", "Failed to update gemstone status.");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Individual Gemstone Stock</h2>
          <p className="text-sm text-gray-500">Track individual stones by ID, type, origin, carat weight, certificate, and status lifecycle</p>
        </div>
        <Button onClick={handleOpenAdd} className="w-fit">
          <Plus className="h-4 w-4" /> Add Gemstone
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <SearchInput
          placeholder="Search by ID, type, variety, shape, origin..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="flex-1 w-full"
          id="gemstones-search"
        />
        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="w-full sm:w-48"
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
        {(search || statusFilter) && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {gemstones.length} result{gemstones.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={headers}
        data={gemstones}
        isLoading={isLoading}
        emptyMessage="No gemstones found"
        renderRow={(stone) => (
          <tr
            key={stone._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm"
          >
            <td className="px-6 py-4 font-semibold text-primary">
              <div className="flex items-center gap-3">
                {stone.images && stone.images[0] ? (
                  <img
                    src={stone.images[0]}
                    alt={stone.stoneId}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(stone.images[0]);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-100 text-gray-400">
                    <ImageIcon className="h-4.5 w-4.5" />
                  </div>
                )}
                <span>{stone.stoneId}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{stone.stockNo}</td>
            <td className="px-6 py-4 font-medium text-gray-900">
              {stone.gemstone} {stone.variety ? `(${stone.variety})` : ""}
            </td>
            <td className="px-6 py-4 text-gray-600">{stone.shape || "—"}</td>
            <td className="px-6 py-4 text-gray-900 font-semibold">
              {stone.carat} ct ({stone.pieces} pc)
            </td>
            <td className="px-6 py-4 text-gray-600">
              ${stone.costPerCarat ? stone.costPerCarat.toFixed(2) : "0.00"}
            </td>
            <td className="px-6 py-4 font-semibold text-gray-900">
              ${stone.purchasePrice.toLocaleString()}
            </td>
            <td className="px-6 py-4 text-gray-600">{stone.location}</td>
            <td className="px-6 py-4">
              <Badge variant={getStatusVariant(stone.status)}>{stone.status}</Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={() => handleOpenStatus(stone)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Adjust Status"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(stone)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(stone._id)}
                  className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
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
            <Button type="submit">Update Status</Button>
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

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Image Preview"
      >
        <div className="flex items-center justify-center w-full max-h-[70vh] md:max-h-[60vh] overflow-auto">
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-gray-100"
          />
        </div>
      </Modal>
    </div>
  );
}
