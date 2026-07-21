import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import { supplierSchema } from "../validation/supplierSchema";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function SupplierList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const { suppliers, isLoading, isError, createSupplier, updateSupplier, deleteSupplier } =
    useSuppliers({ search });
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch suppliers.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      notes: "",
    },
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    reset({
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      notes: "",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    reset({
      companyName: supplier.companyName,
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone,
      address: supplier.address || "",
      status: supplier.status || "active",
      notes: supplier.notes || "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingSupplier) {
        await updateSupplier({ id: editingSupplier._id, data });
        showSuccess("Supplier Updated", "Supplier information updated successfully!");
      } else {
        await createSupplier(data);
        showSuccess("Supplier Created", "New supplier added successfully!");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, id, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteSupplier(deleteConfirm.id);
      showSuccess("Supplier Deleted", "Supplier has been removed successfully.");
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete supplier.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const headers = ["Company Name", "Contact", "Phone", "Email", "Status", "Actions"];

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !suppliers?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Suppliers</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">Manage gemstone, metal, and component suppliers including purchase history and outstanding payments</p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <SearchInput
          placeholder="Search by company, contact, phone, email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="max-w-md w-full"
          id="suppliers-search"
        />
        {search && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {suppliers.length} result{suppliers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={headers}
        data={suppliers}
        isLoading={isLoading}
        emptyMessage="No suppliers found"
        renderRow={(supplier) => (
          <tr key={supplier._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary truncate text-xs sm:text-sm">{supplier.companyName}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{supplier.contactName || "—"}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm break-all">{supplier.phone}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{supplier.email || "—"}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-xs sm:text-sm">
              <Badge variant={supplier.status === "active" ? "success" : "neutral"}>
                {supplier.status}
              </Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
                <TableActionButton
                  icon={Edit2}
                  title="Edit"
                  onClick={() => handleOpenEdit(supplier)}
                />
                <TableActionButton
                  icon={Trash2}
                  title="Delete"
                  variant="danger"
                  isLoading={deleteConfirm.open && deleteConfirm.id === supplier._id && deleteConfirm.isLoading}
                  onClick={() => handleDelete(supplier._id)}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(supplier, idx, { isExpanded, toggleExpand }) => (
          <div
            key={supplier._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm truncate">{supplier.companyName}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{supplier.contactName || "—"}</span>
                  <span>•</span>
                  <span>{supplier.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={supplier.status === "active" ? "success" : "neutral"}>
                  {supplier.status}
                </Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Email Address</span>
                  <span className="font-medium text-gray-900 truncate">{supplier.email || "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Phone Number</span>
                  <span className="font-medium text-gray-900">{supplier.phone}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <TableActionButton
                    icon={Edit2}
                    title="Edit"
                    showLabel
                    label="Edit"
                    onClick={() => handleOpenEdit(supplier)}
                  />
                  <TableActionButton
                    icon={Trash2}
                    title="Delete"
                    variant="danger"
                    showLabel
                    label="Delete"
                    isLoading={deleteConfirm.open && deleteConfirm.id === supplier._id && deleteConfirm.isLoading}
                    onClick={() => handleDelete(supplier._id)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            label="Company Name *"
            error={errors.companyName?.message}
            {...register("companyName")}
          />
          <Input
            label="Contact Person"
            error={errors.contactName?.message}
            {...register("contactName")}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Phone *"
                error={errors.phone?.message}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Address"
            error={errors.address?.message}
            {...register("address")}
          />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            {...register("status")}
          />
          <Textarea
            label="Notes"
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingSupplier ? "Save Changes" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message="This supplier will be removed. All associated gemstone and purchase records will be preserved."
        confirmLabel="Delete"
        isLoading={deleteConfirm.isLoading}
        variant="danger"
      />
    </div>
  );
}
