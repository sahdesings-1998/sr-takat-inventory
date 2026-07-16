import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Eye } from "lucide-react";
import { useJobCards } from "../hooks/useProduction";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";

export default function JobCardList() {
  const [statusFilter, setStatusFilter] = useState("");
  const { jobCards, isLoading, isError, createJobCard } = useJobCards({ status: statusFilter });
  const { products } = useProducts();
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
      assignedToName: "",
      targetDueDate: "",
      notes: "",
    },
  });

  const handleOpenAdd = () => {
    reset({
      productId: "",
      assignedToName: "",
      targetDueDate: "",
      notes: "",
    });
    setIsOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      await createJobCard({
        productId: data.productId,
        assignedTo: null,
        targetDueDate: data.targetDueDate,
        notes: data.notes || `Artisan: ${data.assignedToName}`,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">Production Job Cards</h1>
          <p className="text-sm text-gray-500">Full production workflow: Design → Materials Issued → Manufacturing → Stone Setting → Polishing → QC → Completed</p>
        </div>
        <Button onClick={handleOpenAdd} className="w-fit">
          <Plus className="h-4 w-4" /> Add Job Card
        </Button>
      </div>

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
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary text-xs sm:text-sm">{job.jobNo}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm" title={job.productId ? `${job.productId.productCode} - ${job.productId.name}` : ""}>
              {job.productId ? `${job.productId.productCode} - ${job.productId.name}` : "—"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
              {job.targetDueDate ? new Date(job.targetDueDate).toLocaleDateString() : "—"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-xs sm:text-sm">
              <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <Link
                to={`/production/${job._id}`}
                className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium text-xs sm:text-sm"
              >
                <Eye className="h-4 w-4 flex-shrink-0" /> <span className="hidden sm:inline">View Stages</span><span className="sm:hidden">View</span>
              </Link>
            </td>
          </tr>
        )}
      />

      {/* Add Job Card Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Job Card">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          <Select
            label="Select Product *"
            options={productOptions}
            {...register("productId")}
            required
          />
          <Input
            label="Assigned Artisan / Workshop"
            {...register("assignedToName")}
            placeholder="e.g. Workshop A"
          />
          <Input label="Due Date *" type="date" {...register("targetDueDate")} required />
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
