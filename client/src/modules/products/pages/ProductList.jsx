import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Eye,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X,
  Sparkles,
  Tag,
  Check,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useAuditLogs } from "@/modules/dashboard/hooks/useReports";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import FilterPanel from "@/components/ui/FilterPanel";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const catalogTabs = [
  { key: "catalog", label: "Product Catalog" },
  { key: "history", label: "Product History / Audit" },
];

const DEFAULT_CATEGORIES = [
  "Gemstone",
  "Jewellery",
  "Watch",
  "Custom Product",
  "Ring",
  "Necklace",
  "Earrings",
  "Bracelet",
  "Pendant",
  "Accessory",
  "Other",
];

const DEFAULT_STATUSES = [
  "Available",
  "In Stock",
  "Reserved",
  "On Consignment",
  "On Memo",
  "In Production",
  "Draft",
  "Sold",
  "Returned",
  "Archived",
];

const PRICE_RANGE_OPTIONS = [
  { value: "", label: "All Price Ranges" },
  { value: "under_500", label: "Under $500" },
  { value: "500_2000", label: "$500 – $2,000" },
  { value: "2000_5000", label: "$2,000 – $5,000" },
  { value: "above_5000", label: "Above $5,000" },
];

const STOCK_STATUS_OPTIONS = [
  { value: "", label: "All Stock Status" },
  { value: "in_stock", label: "In Stock (Qty > 0)" },
  { value: "out_of_stock", label: "Out of Stock (Qty = 0)" },
];

export default function ProductList() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");

  // Catalog tab & modal state
  const [activeCatalogTab, setActiveCatalogTab] = useState("catalog");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedProductIds, setExpandedProductIds] = useState([]);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);

  // Fetch all products (unfiltered from API so we can compute dynamic options & instant multi-filtering)
  const { products: allProducts, isLoading, isError, deleteProduct, isDeleting } = useProducts();
  const { data: logsData, isLoading: isLogsLoading, isError: isLogsError } = useAuditLogs();

  const toggleProductAccordion = (id) => {
    setExpandedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleInitiateDelete = (product) => {
    setDeleteProductTarget(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;
    try {
      await deleteProduct(deleteProductTarget._id);
      showSuccess("Deleted", `"${deleteProductTarget.name || "Product"}" has been removed.`);
      setDeleteProductTarget(null);
    } catch (err) {
      console.error("[ProductDelete] Failed to delete product:", err);
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete product. Please try again.");
    }
  };

  // Dynamically extract filter options from actual product database records
  const dynamicFilterOptions = useMemo(() => {
    const categoriesSet = new Set(DEFAULT_CATEGORIES);
    const subCategoriesSet = new Set();
    const statusesSet = new Set(DEFAULT_STATUSES);
    const brandsSet = new Set();

    (allProducts || []).forEach((p) => {
      if (p.category) categoriesSet.add(p.category);
      if (p.subCategory) subCategoriesSet.add(p.subCategory);
      if (p.status) statusesSet.add(p.status);
      if (p.brand) brandsSet.add(p.brand);
    });

    const categoryOpts = [{ value: "", label: "All Categories" }].concat(
      Array.from(categoriesSet).sort().map((c) => ({ value: c, label: c }))
    );

    const subCategoryOpts = [{ value: "", label: "All Sub-Categories" }].concat(
      Array.from(subCategoriesSet).sort().map((sc) => ({ value: sc, label: sc }))
    );

    const statusOpts = [{ value: "", label: "All Statuses" }].concat(
      Array.from(statusesSet).sort().map((s) => ({ value: s, label: s }))
    );

    const brandOpts = [{ value: "", label: "All Brands" }].concat(
      Array.from(brandsSet).sort().map((b) => ({ value: b, label: b }))
    );

    return { categoryOpts, subCategoryOpts, statusOpts, brandOpts };
  }, [allProducts]);

  // Combined Multi-Field Client-Side Filter Engine
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    return allProducts.filter((p) => {
      // 1. Search Query Match
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const stockMatch = (p.stockNo || "").toLowerCase().includes(q);
        const codeMatch = (p.productCode || "").toLowerCase().includes(q);
        const skuMatch = (p.sku || "").toLowerCase().includes(q);
        const barcodeMatch = (p.barcode || "").toLowerCase().includes(q);
        const brandMatch = (p.brand || "").toLowerCase().includes(q);
        const subCatMatch = (p.subCategory || "").toLowerCase().includes(q);
        const materialMatch = (p.material || "").toLowerCase().includes(q);
        const gemTypeMatch = (p.gemstoneType || "").toLowerCase().includes(q);

        if (
          !nameMatch &&
          !stockMatch &&
          !codeMatch &&
          !skuMatch &&
          !barcodeMatch &&
          !brandMatch &&
          !subCatMatch &&
          !materialMatch &&
          !gemTypeMatch
        ) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter && p.category !== categoryFilter) {
        return false;
      }

      // 3. Sub-Category Filter
      if (subCategoryFilter && p.subCategory !== subCategoryFilter) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter && p.status !== statusFilter) {
        return false;
      }

      // 5. Brand Filter
      if (brandFilter && p.brand !== brandFilter) {
        return false;
      }

      // 6. Stock Status Filter
      if (stockStatusFilter) {
        const qty = Number(p.quantity || 0);
        if (stockStatusFilter === "in_stock" && qty <= 0) return false;
        if (stockStatusFilter === "out_of_stock" && qty > 0) return false;
      }

      // 7. Price Range Filter
      if (priceRangeFilter) {
        const price = Number(p.sellingPrice || 0);
        if (priceRangeFilter === "under_500" && price >= 500) return false;
        if (priceRangeFilter === "500_2000" && (price < 500 || price > 2000)) return false;
        if (priceRangeFilter === "2000_5000" && (price < 2000 || price > 5000)) return false;
        if (priceRangeFilter === "above_5000" && price <= 5000) return false;
      }

      return true;
    });
  }, [
    allProducts,
    search,
    categoryFilter,
    subCategoryFilter,
    statusFilter,
    brandFilter,
    stockStatusFilter,
    priceRangeFilter,
  ]);

  // Count active non-empty filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (subCategoryFilter) count++;
    if (statusFilter) count++;
    if (brandFilter) count++;
    if (stockStatusFilter) count++;
    if (priceRangeFilter) count++;
    if (search) count++;
    return count;
  }, [
    categoryFilter,
    subCategoryFilter,
    statusFilter,
    brandFilter,
    stockStatusFilter,
    priceRangeFilter,
    search,
  ]);

  const handleResetFilters = () => {
    setSearchInput("");
    setCategoryFilter("");
    setSubCategoryFilter("");
    setStatusFilter("");
    setBrandFilter("");
    setStockStatusFilter("");
    setPriceRangeFilter("");
  };

  // Audit Logs derivation
  const logs = useMemo(() => logsData?.data || [], [logsData]);
  const productLogs = useMemo(
    () => logs.filter((log) => String(log.entity || "").toLowerCase().includes("product")),
    [logs]
  );
  const filteredLogs = useMemo(
    () =>
      selectedProductId
        ? productLogs.filter((log) => String(log.entityId) === selectedProductId)
        : productLogs,
    [productLogs, selectedProductId]
  );

  useEffect(() => {
    if (isError) showError("Fetch Failed", "Failed to fetch products.");
    if (isLogsError) showError("Fetch Failed", "Failed to fetch product audit logs.");
  }, [isError, isLogsError, showError]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "Available":
      case "In Stock":
        return "success";
      case "Reserved":
      case "On Memo":
      case "On Consignment":
        return "warning";
      case "Sold":
      case "Archived":
        return "accent";
      default:
        return "neutral";
    }
  };

  const headers = [
    "Product",
    "Category",
    "Stock Qty",
    "Cost Price",
    "Selling Price",
    "Margin",
    "Status",
    "Actions",
  ];

  if (isLoading && (allProducts || []).length === 0) {
    return <SkeletonPageHeader />;
  }

  return (
    <div className="page-container space-y-0">
      {/* Page Header */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Enterprise inventory catalog, dynamic product specifications, and cost margins
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/products/add">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs (Catalog / Audit History) */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide pb-0.5">
        {catalogTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveCatalogTab(tab.key)}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeCatalogTab === tab.key
              ? "border-accent text-accent"
              : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeCatalogTab === "catalog" ? (
        <div className="space-y-4">
          {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
          <FilterPanel
            activeFilterCount={activeFilterCount}
            onReset={handleResetFilters}
            title="Product Filters"
            chips={
              activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Active Filters:
                  </span>

                  {search && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                      Search: "{search}"
                      <button onClick={() => setSearchInput("")} className="hover:text-primary-dark">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {categoryFilter && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                      Category: {categoryFilter}
                      <button onClick={() => setCategoryFilter("")} className="hover:text-gray-950">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {subCategoryFilter && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                      Sub-Category: {subCategoryFilter}
                      <button onClick={() => setSubCategoryFilter("")} className="hover:text-gray-950">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {statusFilter && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                      Status: {statusFilter}
                      <button onClick={() => setStatusFilter("")} className="hover:text-gray-950">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {brandFilter && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                      Brand: {brandFilter}
                      <button onClick={() => setBrandFilter("")} className="hover:text-gray-950">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {stockStatusFilter && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                      Stock: {STOCK_STATUS_OPTIONS.find((o) => o.value === stockStatusFilter)?.label}
                      <button onClick={() => setStockStatusFilter("")} className="hover:text-gray-950">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-danger hover:underline ml-auto flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear All
                  </button>
                </div>
              )
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
              {/* Filter 1: Search (Always First) */}
              <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
                  Search Products
                </label>
                <SearchInput
                  placeholder="Search name, stock #, SKU, barcode, brand..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Filter 2: Category */}
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={dynamicFilterOptions.categoryOpts}
                containerClassName="w-full"
              />

              {/* Filter 3: Sub-Category */}
              <Select
                label="Sub-Category"
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                options={dynamicFilterOptions.subCategoryOpts}
                containerClassName="w-full"
              />

              {/* Filter 4: Status */}
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={dynamicFilterOptions.statusOpts}
                containerClassName="w-full"
              />

              {/* Filter 5: Brand */}
              <Select
                label="Brand"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                options={dynamicFilterOptions.brandOpts}
                containerClassName="w-full"
              />

              {/* Filter 6: Stock Availability */}
              <Select
                label="Stock Availability"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                options={STOCK_STATUS_OPTIONS}
                containerClassName="w-full"
              />
            </div>
          </FilterPanel>

          {/* Results Counter Summary */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>
              Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> of{" "}
              <strong className="text-gray-900">{allProducts.length}</strong> products
            </span>
            {activeFilterCount > 0 && (
              <span className="text-primary font-semibold">Filtered results active</span>
            )}
          </div>

          {/* Desktop Table View (768px and above) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <DataTable
              headers={headers}
              data={filteredProducts}
              isLoading={isLoading}
              emptyMessage="No products match your search or filter criteria."
              renderRow={(prod) => {
                const coverImage = prod.imageUrls && prod.imageUrls.length > 0 ? prod.imageUrls[0] : null;
                const marginVal = Number(prod.margin || 0);

                return (
                  <tr key={prod._id} className="hover:bg-gray-50/60 transition-colors border-b border-gray-100 text-xs sm:text-sm">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={prod.name}
                              className="h-full w-full object-cover cursor-pointer"
                              onClick={() => setPreviewImage(coverImage)}
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/products/${prod._id}`} className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-1">
                            {prod.name || "Untitled Product"}
                          </Link>
                          <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                            #{prod.stockNo || prod.productCode || "NO-STOCK"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">{prod.category}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{prod.quantity ?? 0}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-700">${(prod.totalCost || prod.costPrice || 0).toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">${(prod.sellingPrice || 0).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${marginVal >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {marginVal.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusVariant(prod.status)}>{prod.status || "Draft"}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/products/${prod._id}`}>
                          <TableActionButton icon={Eye} title="View Product Details" />
                        </Link>
                        <Link to={`/products/edit/${prod._id}`}>
                          <TableActionButton icon={Edit2} title="Edit Product Wizard" />
                        </Link>
                        <TableActionButton
                          icon={Trash2}
                          title="Delete Product"
                          onClick={() => handleInitiateDelete(prod)}
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          </div>

          {/* Mobile Accordion View (below 768px) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm space-y-2">
                <p className="font-bold text-gray-700">No products match your criteria</p>
                <p className="text-xs text-gray-500">Try loosening your search terms or clearing applied filters.</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} icon={<RotateCcw className="h-3.5 w-3.5" />} className="mt-2">
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const isExpanded = expandedProductIds.includes(prod._id);
                const coverImage = prod.imageUrls?.[0];
                const marginVal = Number(prod.margin || 0);

                return (
                  <div
                    key={prod._id}
                    className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleProductAccordion(prod._id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/70 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-gray-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 line-clamp-1">
                            {prod.name || "Untitled Product"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-gray-400">
                              #{prod.stockNo || prod.productCode || "NO-STOCK"}
                            </span>
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                              {prod.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={getStatusVariant(prod.status)} className="text-[10px]">
                          {prod.status || "Draft"}
                        </Badge>
                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-3.5 space-y-3 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                            <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">Selling Price</span>
                            <span className="font-bold text-primary text-sm">${(prod.sellingPrice || 0).toFixed(2)}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                            <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">Margin %</span>
                            <span className={`font-bold text-sm ${marginVal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {marginVal.toFixed(1)}%
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                            <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">Total Cost</span>
                            <span className="font-semibold text-gray-700 text-xs">${(prod.totalCost || prod.costPrice || 0).toFixed(2)}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                            <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">Stock Qty</span>
                            <span className="font-semibold text-gray-900 text-xs">{prod.quantity ?? 0} pcs</span>
                          </div>
                        </div>

                        {(prod.subCategory || prod.brand || prod.warehouse) && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 pt-1">
                            {prod.subCategory && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200">
                                Sub: {prod.subCategory}
                              </span>
                            )}
                            {prod.brand && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200">
                                Brand: {prod.brand}
                              </span>
                            )}
                            {prod.warehouse && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200">
                                Vault: {prod.warehouse}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60">
                          <Link to={`/products/${prod._id}`} className="flex-1 sm:flex-none">
                            <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />} className="w-full justify-center text-xs">
                              View
                            </Button>
                          </Link>
                          <Link to={`/products/edit/${prod._id}`} className="flex-1 sm:flex-none">
                            <Button variant="primary" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />} className="w-full justify-center text-xs">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => handleInitiateDelete(prod)}
                            className="flex-1 sm:flex-none text-danger border-danger/20 hover:bg-danger/5 justify-center text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* History & Audit Logs View */
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Product History & Audit Trail</h2>
              <p className="text-xs text-gray-500">
                Traceable history log for creations, edits, price changes, and status updates
              </p>
            </div>
            <Select
              placeholder="Filter by product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              containerClassName="w-full sm:w-72"
              options={[{ value: "", label: "All Products" }, ...allProducts.map((p) => ({ value: p._id, label: `${p.name || p.stockNo} (#${p.stockNo})` }))]}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <DataTable
              headers={["Timestamp", "User", "Action", "Entity", "Details"]}
              data={filteredLogs}
              isLoading={isLogsLoading}
              emptyMessage="No history logs recorded yet."
              renderRow={(log) => (
                <tr key={log._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/60">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                    {log.userId?.fullName || log.user || "System"}
                  </td>
                  <td className="py-3 px-4 text-primary font-bold whitespace-nowrap">{log.action}</td>
                  <td className="py-3 px-4 text-gray-700 font-mono whitespace-nowrap">
                    {log.entity} {log.entityId ? `#${log.entityId.slice(-6)}` : ""}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {log.details || log.status || (log.action && `${log.action} performed`)}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      )}

      <DocumentPreviewModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        fileUrl={previewImage}
        fileName="Product Cover Preview"
        fileType="Image"
      />

      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => !isDeleting && setDeleteProductTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProductTarget?.name || "this product"}"? The product record will be preserved in the database but removed from the active catalog.`}
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
