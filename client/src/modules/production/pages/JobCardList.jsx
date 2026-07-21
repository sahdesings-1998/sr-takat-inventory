import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useJobCards } from "../hooks/useProduction";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useUsers } from "@/modules/settings/hooks/useUsers";
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
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function JobCardList() {
  const [statusFilter, setStatusFilter] = useState("");
  const { jobCards, isLoading, isError, createJobCard } = useJobCards({ status: statusFilter });
  const { products } = useProducts();
  const { users } = useUsers();
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
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      productId: "",
      assignedTo: "",
      expectedDate: "",
      notes: "",
    },
  });

  const handleOpenAdd = () => {
    reset({
      productId: "",
      assignedTo: "",
      expectedDate: "",
      notes: "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      await createJobCard({
        productId: data.productId,
        assignedTo: data.assignedTo,
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

  const productOptions = products.map((p) => ({
    value: p._id,
    label: `${p.productCode} - ${p.name}`,
  }));

  const userOptions = useMemo(() => {
    return (users || [])
      .filter((u) => u.status === "active")
      .map((u) => ({
        value: u._id,
        label: `${u.fullName} (${u.roleId?.name || "No Role"})`,
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

  const headers = ["Job No", "Product", "Due Date", "Status", "Actions"];

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !jobCards?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Production Job Cards</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">Full production workflow: Design &rarr; Materials Issued &rarr; Manufacturing &rarr; Stone Setting &rarr; Polishing &rarr; QC &rarr; Completed</p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit">
            <Plus className="h-4 w-4" /> Add Job Card
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <SearchInput
          placeholder="Search by job number or product name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="flex-1 w-full"
          id="jobcards-search"
        />
        <Select
          placeholder="All Job Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="w-full sm:w-52"
          options={[
            { value: "Assigned", label: "Assigned" },
            { value: "In Progress", label: "In Progress" },
            { value: "Completed", label: "Completed" },
            { value: "Cancelled", label: "Cancelled" },
          ]}
        />
        {(search || statusFilter) && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {filteredJobCards.length} result{filteredJobCards.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={headers}
        data={filteredJobCards}
        isLoading={isLoading}
        emptyMessage="No production job cards scheduled."
        renderRow={(job) => (
          <tr
            key={job._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-primary text-xs sm:text-sm">{job.jobNo}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm" title={job.productId ? `${job.productId.productCode} - ${job.productId.name}` : ""}>
              {job.productId ? `${job.productId.productCode} - ${job.productId.name}` : "—"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
              {job.expectedDate ? new Date(job.expectedDate).toLocaleDateString() : "—"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-xs sm:text-sm">
              <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <Link to={`/production/${job._id}`} title="View Stages">
                <TableActionButton
                  icon={Eye}
                  title="View Stages"
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
                  <span className="text-gray-500">Due: {job.expectedDate ? new Date(job.expectedDate).toLocaleDateString() : "—"}</span>
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

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/production/${job._id}`} title="View Stages">
                    <TableActionButton
                      icon={Eye}
                      title="View Stages"
                      showLabel
                      label="View Stages"
                    />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Add Job Card Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Job Card">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          <Select
            label="Select Product"
            options={productOptions}
            {...register("productId")}
            required
          />
          <Select
            label="Assigned Artisan / Workshop"
            options={userOptions}
            {...register("assignedTo")}
            required
            placeholder="Select artisan or workshop staff"
          />
          <DatePicker label="Due Date" {...register("expectedDate")} required />
          <Textarea label="Special Notes" {...register("notes")} />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Job Card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
