import React from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters.js";

export function FinancialSummary({ totalIncome = 0, totalExpense = 0, isLoading = false }) {
  const netBalance = totalIncome - totalExpense;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Income</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="bg-green-100 rounded-full p-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Total Expense */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-red-100 rounded-full p-3">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Net Balance */}
      <div
        className={`rounded-lg shadow p-6 border-l-4 ${
          netBalance >= 0
            ? "bg-white border-blue-500"
            : "bg-white border-orange-500"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Net Balance</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                netBalance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              {formatCurrency(netBalance)}
            </p>
          </div>
          <div
            className={`rounded-full p-3 ${
              netBalance >= 0 ? "bg-blue-100" : "bg-orange-100"
            }`}
          >
            <DollarSign
              className={`w-6 h-6 ${
                netBalance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialSummary;
