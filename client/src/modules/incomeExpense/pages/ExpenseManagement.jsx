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
import DatePicker from "@/components/ui/DatePicker";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenseStats } from "../hooks/useExpenses.js";
import { useIncomeStats } from "../hooks/useIncomes.js";
import ExpenseModal from "../components/ExpenseModal.jsx";
import FinancialSummary from "../components/FinancialSummary.jsx";
import { EXPENSE_CATEGORIES, STATUS_OPTIONS } from "../constants/index.js";
import { formatCurrency, formatDate } from "@/utils/formatters.js";

export function ExpenseManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
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

  const { data: expenses = [], isLoading, isError } = useExpenses(queryParams);
  const { data: expenseStats = {}, isLoading: expenseStatsLoading } = useExpenseStats(queryParams);
  const { data: incomeStats = {}, isLoading: incomeStatsLoading } = useIncomeStats({ startDate, endDate });

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Unable to load expense records.");
    }
  }, [isError, showError]);

  const handleOpenModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (editingExpense) {
        await updateMutation.mutateAsync({ id: editingExpense._id, data: formData });
        showSuccess("Expense Updated", "Expense record updated successfully.");
      } else {
        await createMutation.mutateAsync(formData);
        showSuccess("Expense Created", "Expense record added successfully.");
      }
      setIsModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      showError("Save Failed", err?.response?.data?.message || "Unable to save expense record.");
    }
  };

  const handleDeleteExpense = (id) => {
    setConfirmDelete({ open: true, id, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    setConfirmDelete((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      showSuccess("Expense Deleted", "Expense record deleted successfully.");
      setConfirmDelete({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Unable to delete expense record.");
      setConfirmDelete((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const totalIncome = incomeStats?.totalIncome || 0;
  const totalExpense = expenseStats?.totalExpense || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all business expenses with filtering and reports.</p>
        </div>
        <Button onClick={handleOpenModal} className="w-fit flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      <FinancialSummary
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        isLoading={expenseStatsLoading || incomeStatsLoading}
      />

      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Quick filters</p>
              <p className="text-sm text-slate-500">Refine expense records with search, date range, category, and status.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setSelectedCategory("");
                setSelectedStatus("");
                setStartDate("");
                setEndDate("");
              }}
              className="h-11 w-full sm:w-auto"
            >
              Clear filters
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))_auto]">
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
                label="From"
                containerClassName="w-full"
              />
            </div>
            <div className="min-w-0">
              <DatePicker
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                label="To"
                containerClassName="w-full"
              />
            </div>
            <div className="min-w-0">
              <Select
                label="Category"
                placeholder="All categories"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[{ value: "", label: "All Categories" }, ...EXPENSE_CATEGORIES]}
                containerClassName="w-full"
              />
            </div>
            <div className="min-w-0">
              <Select
                label="Status"
                placeholder="All statuses"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
                containerClassName="w-full"
              />
            </div>
          </div>
        </div>

        <DataTable
          headers={["Date", "Category", "Description", "Vendor", "Amount", "Payment", "Status", "Actions"]}
          data={expenses}
          isLoading={isLoading}
          emptyMessage="No expense records found"
          renderRow={(expense) => (
            <tr key={expense._id} className="hover:bg-gray-50/70 transition-colors border-b border-gray-100 text-xs sm:text-sm">
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 whitespace-nowrap">{formatDate(expense.date)}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 truncate">{expense.category}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 break-words min-w-0">{expense.description}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 truncate">{expense.vendor || "—"}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-red-600 font-semibold whitespace-nowrap">{formatCurrency(expense.amount)}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-700 truncate">{expense.paymentMethod}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6">
                <Badge variant={expense.status === "Completed" ? "success" : expense.status === "Pending" ? "warning" : "danger"}>
                  {expense.status}
                </Badge>
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleEditExpense(expense)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Edit expense"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense._id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete expense record"
        message="This action will soft delete the expense record. It will no longer appear in the list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={confirmDelete.isLoading}
      />
    </div>
  );
}

export default ExpenseManagement;
