import React, { useMemo, useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, useIncomeStats } from "../hooks/useIncomes.js";
import { useExpenseStats } from "../hooks/useExpenses.js";
import IncomeModal from "../components/IncomeModal.jsx";
import FinancialSummary from "../components/FinancialSummary.jsx";
import { INCOME_CATEGORIES, STATUS_OPTIONS } from "../constants/index.js";
import { formatCurrency, formatDate } from "@/utils/formatters.js";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all income sources with filtering and search.</p>
        </div>
        <Button onClick={handleOpenModal} className="w-fit flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Income
        </Button>
      </div>

      <FinancialSummary
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        isLoading={incomeStatsLoading || expenseStatsLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_26px_rgba(0,0,0,0.05)]">
            <SearchInput
              placeholder="Search description or reference..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              containerClassName="w-full"
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              label="From"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              label="To"
            />
          </div>

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
          />
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_26px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Filters</p>
              <p className="text-xs text-gray-400">Apply quick filters to narrow income records.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Select
              label="Category"
              placeholder="All categories"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[{ value: "", label: "All Categories" }, ...INCOME_CATEGORIES]}
            />
            <Select
              label="Status"
              placeholder="All statuses"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
            />
            <Button variant="outline" onClick={() => {
              setSearchInput("");
              setSelectedCategory("");
              setSelectedStatus("");
              setStartDate("");
              setEndDate("");
            }}>
              Clear Filters
            </Button>
          </div>
        </div>
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
