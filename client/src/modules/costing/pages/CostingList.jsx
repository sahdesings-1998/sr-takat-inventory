import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import TableActionButton from "@/components/ui/TableActionButton";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

import { useMemo } from "react";
import Select from "@/components/ui/Select";

export default function CostingList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { products, isLoading, isError } = useProducts({ search });
  const { showError } = useToast();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch products for costing analysis.");
    }
  }, [isError, showError]);

  // Extract dynamic category options
  const categoryOptions = useMemo(() => {
    const catsSet = new Set();
    (products || []).forEach((p) => {
      if (p.category) catsSet.add(p.category);
    });
    return [{ value: "", label: "All Categories" }].concat(
      Array.from(catsSet).sort().map((c) => ({ value: c, label: c }))
    );
  }, [products]);

  // Client-side filtering across category
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      return true;
    });
  }, [products, categoryFilter]);

  const activeFilterCount = (search ? 1 : 0) + (categoryFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setCategoryFilter("");
  };

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
    <div className="page-container space-y-0">
      {isLoading && !products?.length ? (
        <SkeletonPageHeader showButton={false} />
      ) : (
        <div className="border-b border-gray-200/80 pb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Costing Engine</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Material Cost + Production Cost + Other Cost = Total Cost &rarr; Selling Price &rarr; Gross Profit &rarr; Charity (2%) &rarr; Net Profit
          </p>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Costing Filters"
        chips={
          activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Active Filters:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                  Search: "{search}"
                  <button onClick={() => setSearchInput("")}>✕</button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter("")}>✕</button>
                </span>
              )}

              <button onClick={handleResetFilters} className="text-xs font-bold text-danger hover:underline ml-auto">
                Clear All
              </button>
            </div>
          )
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Filter 1: Search (Always First) */}
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
              Search Costing Products
            </label>
            <SearchInput
              placeholder="Search product code or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="costing-search"
            />
          </div>

          {/* Filter 2: Category */}
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categoryOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> of{" "}
          <strong className="text-gray-900">{products.length}</strong> products
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <DataTable
        headers={headers}
        data={filteredProducts}
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
