import { useState, useEffect, useMemo } from "react";
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
import FilterPanel from "@/components/ui/FilterPanel";
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      companyName: "",
      country: "",
      whatsApp: "",
      customerType: "Private Client",
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
      country: "",
      whatsApp: "",
      customerType: "Private Client",
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
      country: customer.country || "",
      whatsApp: customer.whatsApp || "",
      customerType: customer.customerType || "Private Client",
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

  const [statusFilter, setStatusFilter] = useState("");

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((cust) => {
      if (statusFilter && cust.status !== statusFilter) return false;
      return true;
    });
  }, [customers, statusFilter]);

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div className="page-container space-y-0">
      {isLoading && !customers?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage client profiles including customer type, purchase history, memo history, and outstanding amounts
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Add Customer
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Customer Filters"
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
              Search Customers
            </label>
            <SearchInput
              placeholder="Search name, company, phone, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="customers-search"
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
          Showing <strong className="text-gray-900 font-bold">{filteredCustomers.length}</strong> of{" "}
          <strong className="text-gray-900">{customers.length}</strong> customers
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <DataTable
        headers={headers}
        data={filteredCustomers}
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
            type="customerType"
            error={errors.customerType?.message}
            value={watch("customerType") || "Private Client"}
            onChange={(val) => setValue("customerType", typeof val === "string" ? val : val?.target?.value || "")}
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
