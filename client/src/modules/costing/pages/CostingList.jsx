import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import TableActionButton from "@/components/ui/TableActionButton";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Eye, ChevronDown, ChevronUp, Calculator, Save, CheckCircle2 } from "lucide-react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import Select from "@/components/ui/Select";
import CostingCalculatorWidget from "@/modules/costing/components/CostingCalculatorWidget";
import CostProtectionModal from "@/modules/costing/components/CostProtectionModal";
import { productsApi } from "@/modules/products/api/productsApi";
import { calculateCostingDetails } from "@/utils/costingCalculator";


export default function CostingList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { products, isLoading, isError, refetch } = useProducts({ search });
  const { showSuccess, showError } = useToast();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [costingData, setCostingData] = useState(null);
  const [isLoadingCosting, setIsLoadingCosting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch products for costing analysis.");
    }
  }, [isError, showError]);

  const handleOpenCostingModal = async (prod) => {
    setSelectedProduct(prod);
    setIsLoadingCosting(true);
    try {
      const res = await productsApi.getCosting(prod._id);
      const data = res?.data || res;
      setCostingData({
        costBreakdown: data.costBreakdown || prod.costBreakdown || {},
        sellingPrice: data.sellingPrice ?? prod.sellingPrice ?? 0,
        recipeMaterialCost: data.recipeMaterialCost || 0,
        charityPercentage: data.charityPercentage || 20.0,
      });
    } catch (err) {
      console.error("Failed to load costing details:", err);
      showError("Load Error", "Failed to fetch detailed costing breakdown.");
      setCostingData({
        costBreakdown: prod.costBreakdown || {},
        sellingPrice: prod.sellingPrice || 0,
        recipeMaterialCost: 0,
        charityPercentage: 20.0,
      });
    } finally {
      setIsLoadingCosting(false);
    }
  };

  const handleInitiateSave = () => {
    if (!selectedProduct || !costingData) return;
    // Check if product already has non-zero cost price or saved costing
    if ((selectedProduct.costPrice || 0) > 0 || (selectedProduct.sellingPrice || 0) > 0) {
      setShowProtectionModal(true);
    } else {
      executeSaveCosting();
    }
  };

  const executeSaveCosting = async () => {
    if (!selectedProduct || !costingData) return;
    setIsSaving(true);
    try {
      await productsApi.saveCosting(selectedProduct._id, {
        costBreakdown: costingData.costBreakdown,
        sellingPrice: costingData.sellingPrice,
      });
      showSuccess("Costing Saved", `Updated costing breakdown for ${selectedProduct.productCode}`);
      setShowProtectionModal(false);
      setSelectedProduct(null);
      setCostingData(null);
      refetch();
    } catch (err) {
      console.error("Failed to save costing:", err);
      showError("Save Failed", err.message || "Failed to update costing details.");
    } finally {
      setIsSaving(false);
    }
  };

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
    "Material Cost",
    "Production Cost",
    "Other Cost",
    "Total Cost",
    "Selling Price",
    "Gross Margin",
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
            Material Cost + Production Cost + Other Cost = Total Product Cost &rarr; Selling Price &rarr; Gross Profit &rarr; Charity (20%) &rarr; Net Profit
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
          {/* Filter 1: Search */}
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
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-amber-700 font-medium">
              ${(prod.materialCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-blue-700 font-medium">
              ${(prod.manufacturingCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-purple-700 font-medium">
              ${(prod.otherCosts || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm font-mono">
              ${(prod.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-emerald-700 whitespace-nowrap text-xs sm:text-sm font-mono">
              ${(prod.sellingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-emerald-600 whitespace-nowrap text-xs sm:text-sm font-mono">
              ${(prod.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <TableActionButton
                  icon={Calculator}
                  title="Open Costing Engine Calculator"
                  onClick={() => handleOpenCostingModal(prod)}
                />
                <Link to={`/products/${prod._id}`} title="View Product Details">
                  <TableActionButton
                    icon={Eye}
                    title="View Product Details"
                  />
                </Link>
              </div>
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
                  <span className="font-mono font-bold text-gray-900">Total Cost: ${(prod.costPrice || 0).toLocaleString()}</span>
                  <span className="text-gray-400 font-medium">•</span>
                  <span className="font-mono font-bold text-emerald-600">Gross: ${(prod.grossProfit || 0).toLocaleString()}</span>
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
                  <span className="font-semibold text-gray-500">Material Cost</span>
                  <span className="font-mono font-medium text-amber-700">${(prod.materialCost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Production Cost</span>
                  <span className="font-mono font-medium text-blue-700">${(prod.manufacturingCost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Other Cost</span>
                  <span className="font-mono font-medium text-purple-700">${(prod.otherCosts || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Selling Price</span>
                  <span className="font-mono font-medium text-emerald-700">${(prod.sellingPrice || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <TableActionButton
                    icon={Calculator}
                    title="Open Costing Engine Calculator"
                    onClick={() => handleOpenCostingModal(prod)}
                  />
                  <Link to={`/products/${prod._id}`} title="View Product Details">
                    <TableActionButton
                      icon={Eye}
                      title="View Product Details"
                    />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Interactive Costing Engine Modal */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => {
            if (!isSaving) {
              setSelectedProduct(null);
              setCostingData(null);
            }
          }}
          title={`Costing Engine — ${selectedProduct.productCode} (${selectedProduct.name})`}
          maxWidth="max-w-5xl"
        >
          {isLoadingCosting || !costingData ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 text-primary animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-sm font-semibold text-gray-500">Loading cost breakdown structure...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <CostingCalculatorWidget
                costBreakdown={costingData.costBreakdown}
                sellingPrice={costingData.sellingPrice}
                recipeMaterialCost={costingData.recipeMaterialCost}
                charityPercentage={costingData.charityPercentage}
                category={selectedProduct.category}
                onChange={({ costBreakdown, sellingPrice }) => {
                  setCostingData((prev) => ({
                    ...prev,
                    costBreakdown,
                    sellingPrice,
                  }));
                }}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(null);
                    setCostingData(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleInitiateSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Costing Calculations
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Cost Protection Confirmation Modal */}
      {selectedProduct && costingData && (
        <CostProtectionModal
          isOpen={showProtectionModal}
          onClose={() => setShowProtectionModal(false)}
          onConfirm={executeSaveCosting}
          productCode={selectedProduct.productCode}
          productName={selectedProduct.name}
          isSaving={isSaving}
          oldCost={selectedProduct.costPrice || 0}
          newCost={costingData.costBreakdown ? calculateCostingDetails({ costBreakdown: costingData.costBreakdown, sellingPrice: costingData.sellingPrice }).totalCost : 0}
          oldSellingPrice={selectedProduct.sellingPrice || 0}
          newSellingPrice={costingData.sellingPrice || 0}
        />
      )}
    </div>
  );
}


