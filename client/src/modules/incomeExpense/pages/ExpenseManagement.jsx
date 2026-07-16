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

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
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

        

        <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_26px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-500">Filters</p>
              <p className="text-xs text-gray-400">Apply quick filters to narrow expense records.</p>
            </div>
          </div>
          <div className="space-y-4">
            <Select
              label="Category"
              placeholder="All categories"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[{ value: "", label: "All Categories" }, ...EXPENSE_CATEGORIES]}
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
