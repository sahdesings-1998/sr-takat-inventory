import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import TableActionButton from "@/components/ui/TableActionButton";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

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
      {isLoading && !products?.length ? (
        <SkeletonPageHeader showButton={false} />
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Costing Engine</h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            Material Cost + Production Cost + Other Cost = Total Cost &rarr; Selling Price &rarr; Gross Profit &rarr; Charity (20%) &rarr; Net Profit
          </p>
        </div>
      )}

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
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary truncate text-xs sm:text-sm">{prod.productCode}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">{prod.name}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{prod.category}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">
              ${prod.costPrice.toLocaleString()}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">
              ${prod.sellingPrice.toLocaleString()}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">${(prod.grossProfit || 0).toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-emerald-600 whitespace-nowrap text-xs sm:text-sm">
              ${(prod.netProfit || 0).toLocaleString()}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <Link to={`/products/${prod._id}`} title="View Product Costing Details">
                <TableActionButton
                  icon={Eye}
                  title="View Product Costing Details"
                />
              </Link>
            </td>
          </tr>
        )}
        renderMobileCard={(prod, idx, { isExpanded, toggleExpand }) => (
          <div
            key={prod._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{prod.productCode}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {prod.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-mono font-bold text-gray-900">Cost: ${prod.costPrice.toLocaleString()}</span>
                  <span className="text-gray-400 font-medium">•</span>
                  <span className="font-mono font-bold text-emerald-600">Net: ${(prod.netProfit || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">{prod.category}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Selling Price</span>
                  <span className="font-mono font-medium text-gray-900">${prod.sellingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Gross Profit</span>
                  <span className="font-mono font-medium text-gray-900">${(prod.grossProfit || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/products/${prod._id}`} title="View Product Costing Details">
                    <TableActionButton
                      icon={Eye}
                      title="View Product Costing Details"
                      showLabel
                      label="View Details"
                    />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
