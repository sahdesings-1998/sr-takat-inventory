import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client profiles including customer type, purchase history, memo history, and outstanding amounts</p>
        </div>
        <Button onClick={handleOpenAdd} className="w-fit">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

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
                <Link
                  to={`/customers/${customer._id}`}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button
                  onClick={(e) => handleOpenEdit(customer, e)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(customer._id, e)}
                  className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
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
