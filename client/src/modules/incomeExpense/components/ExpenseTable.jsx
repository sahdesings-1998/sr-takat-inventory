import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/Table";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { EXPENSE_CATEGORIES, STATUS_OPTIONS } from "../constants/index.js";
import { formatCurrency, formatDate } from "../../../utils/formatters.js";
import { Trash2, Edit2 } from "lucide-react";
import TableActionButton from "@/components/ui/TableActionButton";

export function ExpenseTable({
  data = [],
  isLoading,
  onEdit,
  onDelete,
  onSearch,
  onCategoryFilter,
  onStatusFilter,
  searchTerm,
  selectedCategory,
  selectedStatus,
}) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedData = data?.slice(startIdx, startIdx + itemsPerPage) || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Search by description, reference, or vendor..."
          value={searchTerm}
          onChange={(e) => {
            onSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={[{ value: "", label: "All Categories" }, ...EXPENSE_CATEGORIES]}
          value={selectedCategory}
          onChange={(e) => {
            onCategoryFilter(e.target.value);
            setPage(1);
          }}
        />
        <Select
          options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
          value={selectedStatus}
          onChange={(e) => {
            onStatusFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableHeader>Date</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Vendor</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Payment Method</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No expense records found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((expense) => (
                <TableRow key={expense._id} className="hover:bg-gray-50">
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell>{expense.vendor || "-"}</TableCell>
                  <TableCell className="font-semibold text-red-600">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : expense.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {expense.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionButton
                        icon={Edit2}
                        title="Edit expense"
                        onClick={() => onEdit(expense)}
                      />
                      <TableActionButton
                        icon={Trash2}
                        title="Delete expense"
                        variant="danger"
                        onClick={async () => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this expense record?"
                            )
                          ) {
                            await onDelete(expense._id);
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, data.length)} of{" "}
            {data.length} records
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-3 py-2 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseTable;
