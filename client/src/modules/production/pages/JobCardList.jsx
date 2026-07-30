import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Eye, ChevronDown, ChevronUp, PackagePlus } from "lucide-react";
import { useJobCards } from "../hooks/useProduction";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useUsers } from "@/modules/settings/hooks/useUsers";
import { useCustomers } from "@/modules/customers/hooks/useCustomers";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function JobCardList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const { jobCards, isLoading, isError, createJobCard } = useJobCards({ status: statusFilter });
  const { products } = useProducts();
  const { users } = useUsers();
  const { customers } = useCustomers();
  const { showSuccess, showError } = useToast();

  // Client-side search
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 250);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch job cards.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      productType: "Custom",
      productId: "",
      customerId: "",
      assignedTo: "",
      startDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
    },
  });

  const handleOpenAdd = () => {
    reset({
      productType: "Custom",
      productId: "",
      customerId: "",
      assignedTo: "",
      startDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data) => {
    if (!data.productId) {
      showError("Validation Error", "Please select a product for production.");
      return;
    }
    if (!data.assignedTo) {
      showError("Validation Error", "Please select an assigned workshop artisan/staff.");
      return;
    }
    if (!data.expectedDate) {
      showError("Validation Error", "Please specify an expected completion date.");
      return;
    }

    try {
      await createJobCard({
        productType: data.productType || "Custom",
        productId: data.productId,
        customerId: data.customerId || null,
        assignedTo: data.assignedTo,
        startDate: data.startDate || null,
        expectedDate: data.expectedDate,
        notes: data.notes,
      });
      showSuccess("Job Card Created", "A new jewelry production job card has been created.");
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Creation Failed", err?.response?.data?.message || "Failed to create job card.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "warning";
      case "Assigned":
        return "info";
      default:
        return "neutral";
    }
  };

  const productOptions = useMemo(() => {
    return (products || []).map((p) => ({
      value: p._id,
      label: `${p.productCode || p.stockNo || "PROD"} - ${p.name}`,
    }));
  }, [products]);

  const customerOptions = useMemo(() => {
    return (customers || []).map((c) => ({
      value: c._id,
      label: `${c.fullName} ${c.companyName ? `(${c.companyName})` : ""} - ${c.phone || c.email || ""}`,
    }));
  }, [customers]);

  const userOptions = useMemo(() => {
    return (users || [])
      .filter((u) => u.status === "active")
      .map((u) => ({
        value: u._id,
        label: `${u.fullName} (${u.roleId?.name || "Artisan/Staff"})`,
      }));
  }, [users]);


  // Client-side filter by job number or product name
  const filteredJobCards = useMemo(() => {
    if (!search.trim()) return jobCards;
    const q = search.toLowerCase();
    return jobCards.filter(
      (j) =>
        j.jobNo?.toLowerCase().includes(q) ||
        j.productId?.name?.toLowerCase().includes(q) ||
        j.productId?.productCode?.toLowerCase().includes(q)
    );
  }, [jobCards, search]);

  const productTypeOptions = [
    { value: "Ring", label: "Ring" },
    { value: "Necklace", label: "Necklace" },
    { value: "Bracelet", label: "Bracelet" },
    { value: "Watch", label: "Watch" },
    { value: "Brooch", label: "Brooch" },
    { value: "Earrings", label: "Earrings" },
    { value: "Custom", label: "Custom Product" },
  ];

  const headers = ["Job No", "Product & Type", "Start Date", "Expected Date", "Assigned Artisan", "Status", "Actions"];

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
  };

  const statusOptions = [
    { value: "", label: "All Job Statuses" },
    { value: "Assigned", label: "Assigned" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div className="page-container space-y-0">
      {isLoading && !jobCards?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Production Job Cards</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Jewelry production workflow: Design &rarr; Materials Issued &rarr; Manufacturing &rarr; Stone Setting &rarr; Polishing &rarr; QC &rarr; Completed
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Create Job Card
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Job Card Filters"
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
              Search Job Cards
            </label>
            <SearchInput
              placeholder="Search job number or product name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="jobcards-search"
            />
          </div>

          {/* Filter 2: Job Status */}
          <Select
            label="Job Status"
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
          Showing <strong className="text-gray-900 font-bold">{filteredJobCards.length}</strong> of{" "}
          <strong className="text-gray-900">{jobCards.length}</strong> job cards
        </span>
      </div>

      <DataTable
        headers={headers}
        data={filteredJobCards}
        isLoading={isLoading}
        renderRow={(job) => (
          <tr key={job._id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-4 py-3.5 text-xs sm:text-sm font-mono font-bold text-primary">{job.jobNo}</td>
            <td className="px-4 py-3.5 text-xs sm:text-sm font-medium text-gray-900">
              {job.productId ? (
                <div>
                  <p className="font-semibold text-gray-900">{job.productId.name}</p>
                  <p className="text-[11px] text-gray-500">{job.productType || job.productId.category || "Jewellery"}</p>
                </div>
              ) : (
                "Unlinked Product"
              )}
            </td>
            <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-600">
              {job.startDate ? new Date(job.startDate).toLocaleDateString() : "—"}
            </td>
            <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-600">
              {job.expectedDate ? new Date(job.expectedDate).toLocaleDateString() : "—"}
            </td>
            <td className="px-4 py-3.5 text-xs sm:text-sm font-medium text-gray-700">
              {job.assignedTo ? job.assignedTo.fullName : "Unassigned"}
            </td>
            <td className="px-4 py-3.5 text-xs sm:text-sm">
              <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
            </td>
            <td className="px-4 py-3.5 text-xs sm:text-sm">
              <Link to={`/production/${job._id}`} title="View Job Card">
                <TableActionButton
                  icon={Eye}
                  title="View Job Card"
                  showLabel
                  label="View Job Card"
                />
              </Link>
            </td>
          </tr>
        )}
        renderMobileCard={(job, idx, { isExpanded, toggleExpand }) => (
          <div
            key={job._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{job.jobNo}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {job.productId ? job.productId.name : "Product"}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-gray-500">Expected: {job.expectedDate ? new Date(job.expectedDate).toLocaleDateString() : "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Product Specification</span>
                  <span className="font-medium text-gray-900 truncate">{job.productId ? `${job.productId.productCode} - ${job.productId.name}` : "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Assigned To</span>
                  <span className="font-medium text-gray-900">{job.assignedTo ? job.assignedTo.fullName : "Unassigned"}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/production/${job._id}`} title="View Job Card">
                    <TableActionButton
                      icon={Eye}
                      title="View Job Card"
                      showLabel
                      label="View Job Card"
                    />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Add Job Card Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Jewelry Production Job" className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Type"
              type="category"
              options={productTypeOptions}
              value={watch("productType") || "Custom"}
              onChange={(val) => setValue("productType", typeof val === "string" ? val : val?.target?.value || "Custom")}
              required
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Select Product *</span>
                <button
                  type="button"
                  onClick={() => navigate("/products/add")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PackagePlus className="h-3.5 w-3.5" /> + Add Product
                </button>
              </div>
              <Select
                isSearchable
                options={productOptions}
                value={watch("productId") || ""}
                onChange={(val) => setValue("productId", typeof val === "string" ? val : val?.target?.value || "")}
                placeholder="Search title, SKU, or code..."
                required
              />
            </div>
          </div>

          <Select
            label="Select Client / Customer (Optional)"
            isSearchable
            type="customer"
            options={customerOptions}
            value={watch("customerId") || ""}
            onChange={(val) => setValue("customerId", typeof val === "string" ? val : val?.target?.value || "")}
            placeholder="Search customer name, company, or phone..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              label="Start Date"
              value={watch("startDate") || ""}
              onChange={(val) => setValue("startDate", typeof val === "string" ? val : val?.target?.value || "")}
            />
            <DatePicker
              label="Expected Completion Date *"
              value={watch("expectedDate") || ""}
              onChange={(val) => setValue("expectedDate", typeof val === "string" ? val : val?.target?.value || "")}
              required
            />
          </div>

          <Select
            label="Assigned Workshop / Artisan *"
            isSearchable
            type="salesperson"
            options={userOptions}
            value={watch("assignedTo") || ""}
            onChange={(val) => setValue("assignedTo", typeof val === "string" ? val : val?.target?.value || "")}
            required
            placeholder="Select artisan or workshop staff"
          />

          <Textarea
            label="Special Production Notes"
            value={watch("notes") || ""}
            onChange={(e) => setValue("notes", e.target.value)}
            placeholder="Enter custom specifications, alloy requirements, or design instructions..."
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Production Job
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
