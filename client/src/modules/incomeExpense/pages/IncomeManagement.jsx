import React, { useMemo, useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import TableActionButton from "@/components/ui/TableActionButton";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import DatePicker from "@/components/ui/DatePicker";
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, useIncomeStats } from "../hooks/useIncomes.js";
import { useExpenseStats } from "../hooks/useExpenses.js";
import IncomeModal from "../components/IncomeModal.jsx";
import FinancialSummary from "../components/FinancialSummary.jsx";
import { INCOME_CATEGORIES, STATUS_OPTIONS } from "../constants/index.js";
import { formatCurrency, formatDate } from "@/utils/formatters.js";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export function IncomeManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, isLoading: false });

  const { showSuccess, showError } = useToast();
  const search = useDebounce(searchInput, 300);

  const queryParams = useMemo(
    () => ({
      ...(search && { search }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedStatus && { status: selectedStatus }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    }),
    [search, selectedCategory, selectedStatus, startDate, endDate]
  );

  const { data: incomes = [], isLoading, isError } = useIncomes(queryParams);
  const { data: incomeStats = {}, isLoading: incomeStatsLoading } = useIncomeStats(queryParams);
  const { data: expenseStats = {}, isLoading: expenseStatsLoading } = useExpenseStats({ startDate, endDate });

  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const deleteMutation = useDeleteIncome();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Unable to load income records.");
    }
  }, [isError, showError]);

  const handleOpenModal = () => {
    setEditingIncome(null);
    setIsModalOpen(true);
  };

  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (editingIncome) {
        await updateMutation.mutateAsync({ id: editingIncome._id, data: formData });
        showSuccess("Income Updated", "Income record updated successfully.");
      } else {
        await createMutation.mutateAsync(formData);
        showSuccess("Income Created", "Income record added successfully.");
      }
      setIsModalOpen(false);
      setEditingIncome(null);
    } catch (err) {
      showError("Save Failed", err?.response?.data?.message || "Unable to save income record.");
    }
  };

  const handleDeleteIncome = (id) => {
    setConfirmDelete({ open: true, id, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    setConfirmDelete((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      showSuccess("Income Deleted", "Income record deleted successfully.");
      setConfirmDelete({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Unable to delete income record.");
      setConfirmDelete((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const totalIncome = incomeStats?.totalIncome || 0;
  const totalExpense = expenseStats?.totalExpense || 0;

  return (
    <div className="page-container space-y-0">
      {isLoading && !incomes?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Income Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Track and manage all income sources with filtering and search.</p>
          </div>
          <Button onClick={handleOpenModal} className="w-fit flex items-center gap-2" icon={<Plus className="w-4 h-4" />}>
            Add Income
          </Button>
        </div>
      )}

      <FinancialSummary
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        isLoading={incomeStatsLoading || expenseStatsLoading}
      />

      <div className="space-y-4">
        <FilterPanel
          activeFilterCount={
            (search ? 1 : 0) + (selectedCategory ? 1 : 0) + (selectedStatus ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0)
          }
          onReset={() => {
            setSearchInput("");
            setSelectedCategory("");
            setSelectedStatus("");
            setStartDate("");
            setEndDate("");
          }}
          title="Income Filters"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
            <div className="min-w-0">
              <SearchInput
                label="Search"
                placeholder="Search description or reference..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onClear={() => setSearchInput("")}
                containerClassName="w-full"
              />
            </div>

            <div className="min-w-0">
              <DatePicker
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                label="From Date"
                containerClassName="w-full"
              />
            </div>
            <div className="min-w-0">
              <DatePicker
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                label="To Date"
                containerClassName="w-full"
              />
            </div>
            <div className="min-w-0">
              <Select
                label="Category"
                placeholder="All categories"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[{ label: "All Categories", value: "" }, ...INCOME_CATEGORIES]}
                containerClassName="w-full"
              />
            </div>
            <div className="min-w-0">
              <Select
                label="Status"
                placeholder="All statuses"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[{ label: "All Statuses", value: "" }, ...STATUS_OPTIONS]}
                containerClassName="w-full"
              />
            </div>
          </div>
        </FilterPanel>

        <DataTable
          headers={["Date", "Category", "Description", "Amount", "Payment", "Status", "Actions"]}
          data={incomes}
          isLoading={isLoading}
          emptyMessage="No income records found"
          renderRow={(income) => (
            <tr key={income._id} className="hover:bg-gray-50/70 transition-colors border-b border-gray-100 text-xs sm:text-sm">
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 whitespace-nowrap">{formatDate(income.date)}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 truncate">{income.category}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 break-words min-w-0">{income.description}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-green-600 font-semibold whitespace-nowrap">{formatCurrency(income.amount)}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 truncate">{income.paymentMethod}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6">
                <Badge variant={income.status === "Completed" ? "success" : income.status === "Pending" ? "warning" : "danger"}>
                  {income.status}
                </Badge>
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleEditIncome(income)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Edit income"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteIncome(income._id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete income"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          renderMobileCard={(income, idx, { isExpanded, toggleExpand }) => (
            <div
              key={income._id}
              className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
            >
              <button
                type="button"
                onClick={toggleExpand}
                className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">{income.description || income.category}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(income.amount)}</span>
                    <span className="text-gray-400 font-medium">•</span>
                    <span className="text-gray-500">{formatDate(income.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={income.status === "Completed" ? "success" : income.status === "Pending" ? "warning" : "danger"}>
                    {income.status}
                  </Badge>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                  <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                    <span className="font-semibold text-gray-500">Category</span>
                    <span className="font-medium text-gray-900">{income.category}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                    <span className="font-semibold text-gray-500">Payment Method</span>
                    <span className="font-medium text-gray-900">{income.paymentMethod}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <TableActionButton
                      icon={Edit2}
                      title="Edit Income"
                      showLabel
                      label="Edit"
                      onClick={() => handleEditIncome(income)}
                    />
                    <TableActionButton
                      icon={Trash2}
                      title="Delete Income"
                      variant="danger"
                      showLabel
                      label="Delete"
                      onClick={() => handleDeleteIncome(income._id)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        />
      </div>

      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIncome(null);
        }}
        initialData={editingIncome}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete income record"
        message="This action will soft delete the income record. You can restore it later by updating it if your backend restores deleted records."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={confirmDelete.isLoading}
      />
    </div>
  );
}

export default IncomeManagement;
