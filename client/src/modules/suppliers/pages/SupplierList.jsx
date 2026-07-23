import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  Building2,
  User,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
} from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import { usePurchaseInvoices } from "../hooks/usePurchaseInvoices";
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
import FilterPanel from "@/components/ui/FilterPanel";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import PurchaseInvoiceList from "./PurchaseInvoiceList";

export default function SupplierList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "purchase-invoices" ? "purchaseInvoices" : "suppliers";

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey === "purchaseInvoices" ? "purchase-invoices" : "suppliers" });
  };

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const { suppliers = [], isLoading, isError, createSupplier, updateSupplier, deleteSupplier } =
    useSuppliers({ search });
  const { invoices = [] } = usePurchaseInvoices();
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
      whatsApp: "",
      country: "",
      supplierType: "Gemstone Supplier",
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
      whatsApp: "",
      country: "",
      supplierType: "Gemstone Supplier",
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
      whatsApp: supplier.whatsApp || "",
      country: supplier.country || "",
      supplierType: supplier.supplierType || "Gemstone Supplier",
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

  const headers = ["Company Name", "Contact", "Phone", "Total Purchases", "Total Paid", "Outstanding Balance", "Status", "Actions"];

  const [statusFilter, setStatusFilter] = useState("");

  const filteredSuppliers = useMemo(() => {
    return (suppliers || []).filter((sup) => {
      if (statusFilter && sup.status !== statusFilter) return false;
      return true;
    });
  }, [suppliers, statusFilter]);

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
    <div className="page-container space-y-6">
      {/* Top Header */}
      {isLoading && !suppliers?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">Suppliers &amp; Purchasing</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Manage supplier contacts, purchase invoices, stock inward, and payment records.
            </p>
          </div>

          <div>
            {activeTab === "suppliers" ? (
              <Button
                onClick={handleOpenAdd}
                className="w-fit bg-primary hover:bg-primary/90 text-white font-bold"
                icon={<Plus className="h-4 w-4" />}
              >
                Add Supplier
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/purchase-invoices/new")}
                className="w-fit bg-primary hover:bg-primary/90 text-white font-bold"
                icon={<Plus className="h-4 w-4" />}
              >
                Create Purchase Invoice
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          type="button"
          onClick={() => handleTabChange("suppliers")}
          className={`pb-3 font-display font-bold text-sm sm:text-base transition-all relative cursor-pointer ${
            activeTab === "suppliers"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4.5 w-4.5" />
            <span>Suppliers</span>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
              {suppliers.length}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("purchaseInvoices")}
          className={`pb-3 font-display font-bold text-sm sm:text-base transition-all relative cursor-pointer ${
            activeTab === "purchaseInvoices"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5" />
            <span>Purchase Invoices</span>
            {invoices.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
                {invoices.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Tab 1: Suppliers Directory */}
      {activeTab === "suppliers" && (
        <div className="space-y-6">
          {/* Main Search & Filters Card */}
          <FilterPanel
            activeFilterCount={activeFilterCount}
            onReset={handleResetFilters}
            title="Supplier Filters"
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
              {/* Search */}
              <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
                  Search Suppliers
                </label>
                <SearchInput
                  placeholder="Search company, contact, phone, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onClear={() => setSearchInput("")}
                  className="w-full"
                  id="suppliers-search"
                />
              </div>

              {/* Status */}
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
              Showing <strong className="text-gray-900 font-bold">{filteredSuppliers.length}</strong> of{" "}
              <strong className="text-gray-900">{suppliers.length}</strong> suppliers
            </span>
            {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
          </div>

          <DataTable
            headers={headers}
            data={filteredSuppliers}
            isLoading={isLoading}
            emptyMessage="No suppliers found"
            renderRow={(supplier) => {
              const purchases = supplier.totalPurchases || 0;
              const paid = supplier.totalPaid || 0;
              const due = supplier.outstandingBalance || 0;

              return (
                <tr key={supplier._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                  <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary truncate text-xs sm:text-sm">
                    <Link to={`/suppliers/${supplier._id}`} className="hover:underline">
                      {supplier.companyName}
                    </Link>
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{supplier.contactName || "—"}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm break-all">{supplier.phone}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-bold text-gray-900 text-xs sm:text-sm">${purchases.toLocaleString()}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-bold text-emerald-700 text-xs sm:text-sm">${paid.toLocaleString()}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-bold text-rose-700 text-xs sm:text-sm">${due.toLocaleString()}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-xs sm:text-sm">
                    <Badge variant={supplier.status === "active" ? "success" : "neutral"}>
                      {supplier.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
                      <Link to={`/suppliers/${supplier._id}`}>
                        <TableActionButton icon={Eye} title="View Supplier Details" />
                      </Link>
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
              );
            }}
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
                      <span className="font-semibold text-gray-500">Total Purchases</span>
                      <span className="font-mono font-bold text-gray-900">${(supplier.totalPurchases || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                      <span className="font-semibold text-gray-500">Outstanding Balance</span>
                      <span className="font-mono font-bold text-rose-700">${(supplier.outstandingBalance || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <Link to={`/suppliers/${supplier._id}`}>
                        <TableActionButton icon={Eye} title="View Details" showLabel label="View" />
                      </Link>
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
        </div>
      )}

      {/* Tab 2: Purchase Invoices */}
      {activeTab === "purchaseInvoices" && (
        <PurchaseInvoiceList hideHeader={true} />
      )}

      {/* Redesigned Add / Edit Supplier Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">
                {editingSupplier ? "Edit Supplier Record" : "Add New Supplier"}
              </h3>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                {editingSupplier
                  ? "Update business contact, category, and location information"
                  : "Enter supplier business details, contact information, and terms"}
              </p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Section 1: Business & Company Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider pb-1.5 border-b border-gray-100">
              <Building2 className="h-3.5 w-3.5" />
              <span>1. Business &amp; Company Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                placeholder="e.g. Takat Gems SR Ltd."
                error={errors.companyName?.message}
                leftIcon={<Building2 className="h-4 w-4 text-gray-400" />}
                {...register("companyName")}
              />

              <Input
                label="Contact Person Name"
                placeholder="e.g. Rehman Ahmed Takat"
                error={errors.contactName?.message}
                leftIcon={<User className="h-4 w-4 text-gray-400" />}
                {...register("contactName")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Supplier Category / Type *"
                error={errors.supplierType?.message}
                options={[
                  { value: "Gemstone Supplier", label: "Gemstone Supplier" },
                  { value: "Metal Dealer", label: "Metal Dealer (Gold/Silver/Platinum)" },
                  { value: "Component Supplier", label: "Component Supplier (Findings/Settings)" },
                  { value: "Artisan / Workshop", label: "Artisan / Workshop" },
                  { value: "Other", label: "Other" },
                ]}
                {...register("supplierType")}
              />

              <Select
                label="Status *"
                error={errors.status?.message}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                {...register("status")}
              />
            </div>
          </div>

          {/* Section 2: Contact & Communication */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider pb-1.5 border-b border-gray-100">
              <Phone className="h-3.5 w-3.5" />
              <span>2. Contact &amp; Communication</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    label="Phone Number *"
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
                    label="WhatsApp Number"
                    error={errors.whatsApp?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. info@supplier.com"
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
                {...register("email")}
              />

              <Input
                label="Country / Origin"
                placeholder="e.g. Thailand / India"
                error={errors.country?.message}
                leftIcon={<Globe className="h-4 w-4 text-gray-400" />}
                {...register("country")}
              />
            </div>
          </div>

          {/* Section 3: Office Address & Internal Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider pb-1.5 border-b border-gray-100">
              <MapPin className="h-3.5 w-3.5" />
              <span>3. Address &amp; Internal Notes</span>
            </div>

            <Input
              label="Office / Warehouse Address"
              placeholder="e.g. 919/336 JTC Building, Silom Rd, Bangkok"
              error={errors.address?.message}
              leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
              {...register("address")}
            />

            <Textarea
              label="Internal Notes / Remarks"
              placeholder="Add payment terms, banking details, or special notes..."
              error={errors.notes?.message}
              rows={3}
              {...register("notes")}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-primary hover:bg-primary/90 text-white font-bold">
              {editingSupplier ? "Update Supplier Record" : "Save Supplier Record"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
}
