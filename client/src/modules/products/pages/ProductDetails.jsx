import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import { useGemstones, useLots, useMaterials } from "@/modules/inventory/hooks/useInventory";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton, SkeletonDetailCard } from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";

// View components
import ProductViewHeader from "../components/view/ProductViewHeader";
import ProductViewSummaryCards from "../components/view/ProductViewSummaryCards";
import ProductViewTabs from "../components/view/ProductViewTabs";
import { getVisibleTabs } from "../components/view/tabConfig";

// Tab content
import TabOverview from "../components/view/tabs/TabOverview";
import TabSpecifications from "../components/view/tabs/TabSpecifications";
import TabPricing from "../components/view/tabs/TabPricing";
import TabInventory from "../components/view/tabs/TabInventory";
import TabComponents from "../components/view/tabs/TabComponents";
import TabSupplier from "../components/view/tabs/TabSupplier";
import TabQrBarcode from "../components/view/tabs/TabQrBarcode";
import TabCertificates from "../components/view/tabs/TabCertificates";
import TabMedia from "../components/view/tabs/TabMedia";
import TabSales from "../components/view/tabs/TabSales";
import TabHistory from "../components/view/tabs/TabHistory";
import TabDocuments from "../components/view/tabs/TabDocuments";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-2xl" />
      <SkeletonDetailCard rows={6} cols={2} />
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();

  const {
    product,
    components,
    salesHistory,
    isLoading,
    isError,
    addComponent,
    deleteComponent,
    deleteProduct,
    isDeleting,
    updateProduct,
    isUpdating,
  } = useProduct(id);

  const { gemstones } = useGemstones();
  const { lots } = useLots();
  const { materials } = useMaterials();

  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, isLoading: false });
  const [archiveDialog, setArchiveDialog] = useState({ open: false, isLoading: false });
  const [previewDoc, setPreviewDoc] = useState({ isOpen: false, fileUrl: "", fileName: "", fileType: "" });

  const visibleTabs = getVisibleTabs(product);

  // Make sure active tab stays valid when product loads
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "overview");
    }
  }, [product]);

  useEffect(() => {
    if (isError) showError("Load Failed", "Could not load product details.");
  }, [isError, showError]);

  const handleOpenDocPreview = (url, name, type = "Document") => {
    setPreviewDoc({ isOpen: true, fileUrl: url, fileName: name, fileType: type });
  };

  const handleDelete = async () => {
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteProduct();
      showSuccess("Deleted", `"${product?.name}" has been removed from the product catalog.`);
      setDeleteDialog({ open: false, isLoading: false });
      navigate("/products");
    } catch (err) {
      console.error("[ProductDelete] Failed to delete product:", err);
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete product. Please try again.");
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleArchive = async () => {
    setArchiveDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await updateProduct({ status: "Archived" });
      showSuccess("Archived", `"${product?.name}" has been archived.`);
      setArchiveDialog({ open: false, isLoading: false });
    } catch (err) {
      console.error("[ProductArchive] Failed to archive product:", err);
      showError("Archive Failed", err?.response?.data?.message || "Failed to archive product. Please try again.");
      setArchiveDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (isLoading) return (
    <div className="page-container">
      <LoadingSkeleton />
    </div>
  );

  if (isError || !product) return (
    <div className="page-container">
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-lg font-bold text-gray-800">Product Not Found</p>
        <p className="text-sm text-gray-500">This product may have been deleted or you may not have access.</p>
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <TabOverview product={product} />;
      case "specifications":
        return <TabSpecifications product={product} />;
      case "pricing":
        return <TabPricing product={product} />;
      case "inventory":
        return <TabInventory product={product} />;
      case "components":
        return (
          <TabComponents
            product={product}
            components={components}
            addComponent={addComponent}
            deleteComponent={deleteComponent}
            gemstones={gemstones}
            lots={lots}
            materials={materials}
          />
        );
      case "supplier":
        return <TabSupplier product={product} updateProduct={updateProduct} isUpdating={isUpdating} />;
      case "qrcode":
        return <TabQrBarcode product={product} updateProduct={updateProduct} isUpdating={isUpdating} />;
      case "certificates":
        return <TabCertificates product={product} onPreviewDoc={handleOpenDocPreview} />;
      case "media":
        return <TabMedia product={product} onPreviewDoc={handleOpenDocPreview} />;
      case "sales":
        return <TabSales product={product} salesHistory={salesHistory} />;
      case "history":
        return <TabHistory product={product} />;
      case "documents":
        return <TabDocuments product={product} onPreviewDoc={handleOpenDocPreview} />;
      default:
        return <TabOverview product={product} />;
    }
  };

  return (
    <div className="page-container space-y-0">
      {/* Header */}
      <ProductViewHeader
        product={product}
        onDelete={() => setDeleteDialog({ open: true, isLoading: false })}
        onArchive={() => setArchiveDialog({ open: true, isLoading: false })}
      />

      {/* Summary KPI Cards */}
      <ProductViewSummaryCards product={product} />

      {/* Tab Navigation */}
      <ProductViewTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="min-h-64">
        {renderTab()}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => !isDeleting && setDeleteDialog({ open: false, isLoading: false })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product?.name}"? The product record will be preserved in the database but removed from the active catalog. This action can only be reversed by an administrator.`}
        confirmLabel="Yes, Delete"
        isLoading={isDeleting || deleteDialog.isLoading}
        variant="danger"
      />

      {/* Archive Confirm */}
      <ConfirmDialog
        isOpen={archiveDialog.open}
        onClose={() => setArchiveDialog({ open: false, isLoading: false })}
        onConfirm={handleArchive}
        title="Archive Product"
        message={`Archive "${product?.name}"? Archived products are hidden from the main list but can be restored.`}
        confirmLabel="Archive"
        isLoading={archiveDialog.isLoading}
        variant="warning"
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc.isOpen}
        onClose={() => setPreviewDoc((p) => ({ ...p, isOpen: false }))}
        fileUrl={previewDoc.fileUrl}
        fileName={previewDoc.fileName}
        fileType={previewDoc.fileType}
      />
    </div>
  );
}
