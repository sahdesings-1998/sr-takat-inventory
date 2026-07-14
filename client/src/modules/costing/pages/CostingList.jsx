import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";

export default function CostingList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const { products, isLoading, isError } = useProducts({ search });
  const { showError } = useToast();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch products for costing analysis.");
    }
  }, [isError, showError]);

  const headers = [
    "Product Code",
    "Name",
    "Category",
    "Cost Price",
    "Proposed Selling Price",
    "Gross Margin",
    "Net Margin",
    "Actions",
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Costing Engine</h1>
        <p className="text-sm text-gray-500 font-medium">
          Material Cost + Production Cost + Other Cost = Total Cost → Selling Price → Gross Profit → Charity (20%) → Net Profit
        </p>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] w-full md:w-[480px]">
        <SearchInput
          placeholder="Filter by product code or name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="w-full"
          id="costing-search"
        />
        {search && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {products.length} result{products.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={headers}
        data={products}
        isLoading={isLoading}
        emptyMessage="No products listed for costing."
        renderRow={(prod) => (
          <tr
            key={prod._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm"
          >
            <td className="px-6 py-4 font-semibold text-primary">{prod.productCode}</td>
            <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
            <td className="px-6 py-4 text-gray-600">{prod.category}</td>
            <td className="px-6 py-4 font-semibold text-gray-900">
              ${prod.costPrice.toLocaleString()}
            </td>
            <td className="px-6 py-4 font-semibold text-gray-900">
              ${prod.sellingPrice.toLocaleString()}
            </td>
            <td className="px-6 py-4 text-gray-600">${(prod.grossProfit || 0).toLocaleString()}</td>
            <td className="px-6 py-4 font-semibold text-emerald-600">
              ${(prod.netProfit || 0).toLocaleString()}
            </td>
            <td className="px-6 py-4">
              <Link
                to={`/products/${prod._id}`}
                className="text-accent hover:underline font-semibold"
              >
                Open Costing
              </Link>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
