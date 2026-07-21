import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useCustomers } from "../hooks/useCustomers";
import { customerSchema } from "../validation/customerSchema";
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

export default function CustomerList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const { customers, isLoading, isError, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers({ search });
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch customers.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      companyName: "",
      status: "active",
      notes: "",
    },
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    reset({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      companyName: "",
      status: "active",
      notes: "",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (customer, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCustomer(customer);
    reset({
      fullName: customer.fullName,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
      companyName: customer.companyName || "",
      status: customer.status || "active",
      notes: customer.notes || "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer._id, data });
        showSuccess("Customer Updated", "Customer information updated successfully!");
      } else {
        await createCustomer(data);
        showSuccess("Customer Created", "New customer added successfully!");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleDelete = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ open: true, id, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteCustomer(deleteConfirm.id);
      showSuccess("Customer Deleted", "Customer has been removed successfully.");
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete customer.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const headers = ["Name", "Company", "Phone", "Email", "Status", "Actions"];

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !customers?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Customers</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">Manage client profiles including customer type, purchase history, memo history, and outstanding amounts</p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <SearchInput
          placeholder="Search by name, company, phone, email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="max-w-md w-full"
          id="customers-search"
        />
        {search && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {customers.length} result{customers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={headers}
        data={customers}
        isLoading={isLoading}
        emptyMessage="No customers found"
        renderRow={(customer) => (
          <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary text-xs sm:text-sm">
              <Link to={`/customers/${customer._id}`} className="hover:underline truncate block">
                {customer.fullName}
              </Link>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{customer.companyName || "—"}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm break-all">{customer.phone}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{customer.email || "—"}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-xs sm:text-sm">
              <Badge variant={customer.status === "active" ? "success" : "neutral"}>
                {customer.status}
              </Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
                <Link to={`/customers/${customer._id}`} title="View Details">
                  <TableActionButton
                    icon={Eye}
                    title="View Details"
                  />
                </Link>
                <TableActionButton
                  icon={Edit2}
                  title="Edit"
                  onClick={(e) => handleOpenEdit(customer, e)}
                />
                <TableActionButton
                  icon={Trash2}
                  title="Delete"
                  variant="danger"
                  isLoading={deleteConfirm.open && deleteConfirm.id === customer._id && deleteConfirm.isLoading}
                  onClick={(e) => handleDelete(customer._id, e)}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(customer, idx, { isExpanded, toggleExpand }) => (
          <div
            key={customer._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm truncate">{customer.fullName}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{customer.companyName || "—"}</span>
                  <span>•</span>
                  <span>{customer.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={customer.status === "active" ? "success" : "neutral"}>
                  {customer.status}
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
                  <span className="font-medium text-gray-900 truncate">{customer.email || "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Phone Number</span>
                  <span className="font-medium text-gray-900">{customer.phone}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/customers/${customer._id}`} title="View Details">
                    <TableActionButton
                      icon={Eye}
                      title="View Details"
                      showLabel
                      label="View"
                    />
                  </Link>
                  <TableActionButton
                    icon={Edit2}
                    title="Edit"
                    showLabel
                    label="Edit"
                    onClick={(e) => handleOpenEdit(customer, e)}
                  />
                  <TableActionButton
                    icon={Trash2}
                    title="Delete"
                    variant="danger"
                    showLabel
                    label="Delete"
                    isLoading={deleteConfirm.open && deleteConfirm.id === customer._id && deleteConfirm.isLoading}
                    onClick={(e) => handleDelete(customer._id, e)}
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
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            label="Customer Name *"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Company Name"
            error={errors.companyName?.message}
            {...register("companyName")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <Controller
              name="whatsApp"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  label="WhatsApp"
                  error={errors.whatsApp?.message}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Country"
              error={errors.country?.message}
              {...register("country")}
            />
          </div>
          <Select
            label="Customer Type"
            error={errors.customerType?.message}
            options={[
              { value: "Private Client", label: "Private Client" },
              { value: "Dealer", label: "Dealer" },
              { value: "Wholesaler", label: "Wholesaler" },
              { value: "VIP", label: "VIP" },
            ]}
            {...register("customerType")}
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
              {editingCustomer ? "Save Changes" : "Add Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message="This customer will be permanently removed. Their sale and memo history will be preserved."
        confirmLabel="Delete"
        isLoading={deleteConfirm.isLoading}
        variant="danger"
      />
    </div>
  );
}
