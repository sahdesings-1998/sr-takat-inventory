import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit2, Eye, Image as ImageIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useAuditLogs } from "@/modules/dashboard/hooks/useReports";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
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

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "Gemstone", label: "Gemstone" },
  { value: "Jewellery", label: "Jewellery" },
  { value: "Watch", label: "Watch" },
  { value: "Custom Product", label: "Custom Product" },
  { value: "Accessory", label: "Accessory" },
  { value: "Ring", label: "Ring" },
  { value: "Necklace", label: "Necklace" },
  { value: "Earrings", label: "Earrings" },
  { value: "Bracelet", label: "Bracelet" },
  { value: "Pendant", label: "Pendant" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "On Consignment", label: "On Consignment" },
  { value: "On Memo", label: "On Memo" },
  { value: "In Production", label: "In Production" },
  { value: "Sold", label: "Sold" },
  { value: "In Stock", label: "In Stock" },
  { value: "Archived", label: "Archived" },
];

export default function ProductList() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeCatalogTab, setActiveCatalogTab] = useState("catalog");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedProductIds, setExpandedProductIds] = useState([]);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);

  const toggleProductAccordion = (id) => {
    setExpandedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const { products, isLoading, isError, deleteProduct, isDeleting } = useProducts({
    search,
    category: categoryFilter,
    status: statusFilter,
  });
  const { data: logsData, isLoading: isLogsLoading, isError: isLogsError } = useAuditLogs();
  const { showError, showSuccess } = useToast();

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
      console.error("[ProductDelete] Failed to delete product from list:", err);
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete product. Please try again.");
    }
  };

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
    if (isError) {
      showError("Fetch Failed", "Failed to fetch products.");
    }
    if (isLogsError) {
      showError("Fetch Failed", "Failed to fetch product audit logs.");
    }
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
    "Stock",
    "Cost Price",
    "Selling Price",
    "Margin",
    "Status",
    "Actions",
  ];

  if (isLoading && products.length === 0) {
    return <SkeletonPageHeader />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Enterprise inventory catalog, dynamic product specifications, and cost margins
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeCatalogTab === "catalog" ? (
        <>
          {/* Filters & Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <SearchInput
              placeholder="Search stock #, product code, name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full sm:w-80"
            />

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryOptions}
                containerClassName="w-full sm:w-44"
              />

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                containerClassName="w-full sm:w-44"
              />
            </div>
          </div>

          {/* Desktop Table View (768px and above) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <DataTable
              headers={headers}
              data={products}
              isLoading={isLoading}
              emptyMessage="No products match your search criteria."
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
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${marginVal >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
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
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                No products match your search criteria.
              </div>
            ) : (
              products.map((prod) => {
                const isExpanded = expandedProductIds.includes(prod._id);
                const coverImage = prod.imageUrls?.[0];
                const marginVal = Number(prod.margin || 0);

                return (
                  <div
                    key={prod._id}
                    className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Accordion Header - Click to expand/collapse */}
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
                          <div className="flex items-center gap-1.5 mt-0.5">
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
                        {/* 4 Key Metrics Grid */}
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

                        {/* Extra Specifications if present */}
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

                        {/* Quick Actions Footer */}
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
        </>
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
              options={[{ value: "", label: "All Products" }, ...products.map((p) => ({ value: p._id, label: `${p.name || p.stockNo} (#${p.stockNo})` }))]}
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
