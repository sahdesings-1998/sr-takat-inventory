import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShieldCheck,
  Save,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  HeartHandshake,
  Tag,
  Hash,
  Package,
  Layers,
  Pencil,
} from "lucide-react";
import { useProduct } from "../hooks/useProducts";
import { useGemstones, useLots, useMaterials } from "@/modules/inventory/hooks/useInventory";
import { componentSchema } from "../validation/productSchema";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";

// Product types that support component/recipe management
const COMPONENT_ELIGIBLE_TYPES = ["Jewellery", "Watch", "Custom Product"];

const hasValue = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return false;
    const lower = trimmed.toLowerCase();
    return !["-", "n/a", "not available", "null", "undefined", "none", "—"].includes(lower);
  }
  if (typeof val === "number") {
    return !isNaN(val);
  }
  if (typeof val === "boolean") {
    return true;
  }
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  return true;
};

function DetailField({ label, value, className = "" }) {
  if (!hasValue(value)) return null;

  let displayValue = value;
  if (typeof value === "boolean") {
    displayValue = value ? "Yes" : "No";
  } else if (typeof value === "number") {
    displayValue = value.toLocaleString();
  }

  return (
    <div className={`group p-3.5 rounded-xl bg-gray-50/40 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary/60 transition-colors">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800 break-words leading-snug">{displayValue}</span>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, accent = "primary" }) {
  const accentMap = {
    primary: "border-primary/50 text-primary",
    emerald: "border-emerald-400/60 text-emerald-600",
    violet: "border-violet-400/60 text-violet-600",
    amber: "border-amber-400/60 text-amber-600",
    sky: "border-sky-400/60 text-sky-600",
    rose: "border-rose-400/60 text-rose-600",
  };
  const cls = accentMap[accent] || accentMap.primary;
  return (
    <div className={`flex items-center gap-2.5 pl-3 border-l-[3px] ${cls}`}>
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <h3 className="font-semibold text-gray-900 font-display text-sm">{title}</h3>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    product,
    components,
    costing,
    isLoading,
    isError,
    addComponent,
    deleteComponent,
    saveCosting,
    approveCosting,
  } = useProduct(id);

  const { gemstones } = useGemstones();
  const { lots } = useLots();
  const { materials } = useMaterials();
  const { showSuccess, showError } = useToast();

  const [compOpen, setCompOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });
  const [previewImage, setPreviewImage] = useState(null);

  // Detailed Costing State
  const [costingForm, setCostingForm] = useState({
    sellingPrice: 0,
    materials: { gemstones: 0, diamonds: 0, gold: 0, watchComponents: 0, strap: 0, other: 0 },
    production: { cad: 0, casting: 0, stoneSetting: 0, polishing: 0, assembly: 0, qc: 0 },
    other: { certificate: 0, shipping: 0, insurance: 0, packaging: 0, marketing: 0, commission: 0 },
    percentageItems: []
  });

  // Local Percentage Item Builder State
  const [newPercentItem, setNewPercentItem] = useState({
    name: "",
    percentage: "",
    basis: "Material Cost"
  });

  const isWorkshop = user?.roleId?.name === "Workshop-Staff";
  const isManagerOrAdmin = user?.roleId?.name === "Admin" || user?.roleId?.name === "Manager";

  // Component management is only available for specific product types
  const showComponents = product ? COMPONENT_ELIGIBLE_TYPES.includes(product.category) : false;

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch product details.");
    }
  }, [isError, showError]);

  useEffect(() => {
    if (costing) {
      setCostingForm({
        sellingPrice: costing.sellingPrice || 0,
        materials: costing.costBreakdown?.materials || { gemstones: 0, diamonds: 0, gold: 0, watchComponents: 0, strap: 0, other: 0 },
        production: costing.costBreakdown?.production || { cad: 0, casting: 0, stoneSetting: 0, polishing: 0, assembly: 0, qc: 0 },
        other: costing.costBreakdown?.other || { certificate: 0, shipping: 0, insurance: 0, packaging: 0, marketing: 0, commission: 0 },
        percentageItems: costing.costBreakdown?.percentageItems || []
      });
    }
  }, [costing]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      sourceType: "Gemstone",
      sourceId: "",
      quantity: 1,
      weight: 0,
      remarks: "",
    },
  });

  const selectedType = watch("sourceType");

  const handleOpenComp = () => {
    reset({
      sourceType: "Gemstone",
      sourceId: "",
      quantity: 1,
      weight: 0,
      remarks: "",
    });
    setCompOpen(true);
  };

  const onAddComp = async (data) => {
    try {
      await addComponent(data);
      showSuccess("Component Added", "Component added to composition successfully!");
      setCompOpen(false);
    } catch (err) {
      showError("Add Failed", err?.response?.data?.message || "Failed to add component.");
    }
  };

  const onDeleteComp = (compId) => {
    setDeleteConfirm({ open: true, id: compId, isLoading: false });
  };

  const handleConfirmDeleteComp = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteComponent(deleteConfirm.id);
      showSuccess("Component Removed", "Component removed successfully!");
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Remove Failed", "Failed to remove component.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveCosting = async () => {
    try {
      await saveCosting(costingForm);
      showSuccess("Costing Saved", "Detailed product costing saved successfully!");
    } catch (err) {
      showError("Save Failed", "Failed to save product costing.");
    }
  };

  const handleApprove = async () => {
    try {
      await approveCosting();
      showSuccess("Costing Approved", "Costing approved and product status updated to In Stock!");
    } catch (err) {
      showError("Approval Failed", "Failed to approve costing.");
    }
  };

  // Real-time calculation helper
  const rt = (() => {
    const recipeMat = costing?.recipeMaterialCost || 0;
    const matSum = Object.values(costingForm.materials).reduce((a, b) => a + Number(b || 0), 0);
    const materialCost = recipeMat + matSum;

    const productionCost = Object.values(costingForm.production).reduce((a, b) => a + Number(b || 0), 0);
    const otherCost = Object.values(costingForm.other).reduce((a, b) => a + Number(b || 0), 0);
    const baseCost = materialCost + productionCost + otherCost;

    let percentageCostIncreases = 0;
    const items = costingForm.percentageItems.map((item) => {
      let amount = 0;
      if (item.basis === "Material Cost") {
        amount = materialCost * (Number(item.percentage || 0) / 100);
        percentageCostIncreases += amount;
      } else if (item.basis === "Production Cost") {
        amount = productionCost * (Number(item.percentage || 0) / 100);
        percentageCostIncreases += amount;
      } else if (item.basis === "Total Cost") {
        amount = baseCost * (Number(item.percentage || 0) / 100);
        percentageCostIncreases += amount;
      }
      return { ...item, amount };
    });

    const finalCostPrice = baseCost + percentageCostIncreases;
    const finalSellingPrice = Number(costingForm.sellingPrice || 0);
    const grossProfit = Math.max(0, finalSellingPrice - finalCostPrice);

    let postSellingAdjustments = 0;
    const updatedItems = items.map((item) => {
      let amount = item.amount;
      if (item.basis === "Selling Price") {
        amount = finalSellingPrice * (Number(item.percentage || 0) / 100);
        postSellingAdjustments += amount;
      } else if (item.basis === "Gross Profit") {
        amount = grossProfit * (Number(item.percentage || 0) / 100);
        postSellingAdjustments += amount;
      }
      return { ...item, amount };
    });

    const charityPct = costing?.charityPercentage || 2.0;
    const charityAmount = grossProfit * (charityPct / 100);
    const netProfit = Math.max(0, grossProfit - charityAmount - postSellingAdjustments);

    return {
      recipeMaterialCost: recipeMat,
      materialCost,
      productionCost,
      otherCost,
      baseCost,
      finalCostPrice,
      grossProfit,
      charityAmount,
      netProfit,
      percentageItems: updatedItems,
      postSellingAdjustments,
    };
  })();

  const handleAddPercentItem = () => {
    if (!newPercentItem.name || !newPercentItem.percentage) return;
    const item = {
      name: newPercentItem.name,
      percentage: Number(newPercentItem.percentage),
      basis: newPercentItem.basis,
    };
    setCostingForm({
      ...costingForm,
      percentageItems: [...costingForm.percentageItems, item],
    });
    setNewPercentItem({ name: "", percentage: "", basis: "Material Cost" });
  };

  const handleDeletePercentItem = (idx) => {
    const updated = costingForm.percentageItems.filter((_, i) => i !== idx);
    setCostingForm({ ...costingForm, percentageItems: updated });
  };

  if (isLoading) return <div className="text-gray-500 text-sm p-6">Loading details...</div>;
  if (isError || !product)
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch product details.
      </div>
    );

  let itemOptions = [];
  if (selectedType === "Gemstone") {
    itemOptions = gemstones
      .filter((g) => g.status === "In Stock")
      .map((g) => ({ value: g._id, label: `${g.stoneId} - ${g.gemstone} (${g.carat} ct)` }));
  } else if (selectedType === "GemstoneLot") {
    itemOptions = lots
      .filter((l) => l.status === "Active" || l.status === "In Stock")
      .map((l) => ({
        value: l._id,
        label: `${l.lotId} - ${l.gemstone} (${l.remainingCarat} ct remaining)`,
      }));
  } else if (selectedType === "Material") {
    itemOptions = materials
      .filter((m) => m.status === "active")
      .map((m) => ({
        value: m._id,
        label: `${m.materialCode} - ${m.materialName} (${m.quantity} ${m.unit})`,
      }));
  }

  const generalFields = [
    { label: "Product Name", value: product.name },
    { label: "Category", value: product.category },
    { label: "Status", value: product.status },
    { label: "SKU", value: product.sku },
    { label: "Barcode", value: product.barcode },
    { label: "QR Code", value: product.qrCode },
    { label: "Sub Category", value: product.subCategory },
    { label: "Collection", value: product.productCollection || product.collection },
    { label: "Brand", value: product.brand },
    { label: "Model / Series", value: product.model },
    { label: "Description", value: product.description, fullWidth: true },
    { label: "Short Description", value: product.shortDescription, fullWidth: true },
  ];
  const hasGeneralData = generalFields.some((field) => hasValue(field.value));

  const hasFinancialData =
    hasValue(product.sellingPrice) ||
    hasValue(product.costPrice) ||
    hasValue(product.grossProfit) ||
    hasValue(product.netProfit);

  const inventoryFields = [
    { label: "Warehouse", value: product.warehouse },
    { label: "Location", value: product.location },
    { label: "Shelf", value: product.shelf },
    { label: "Quantity", value: product.quantity },
    { label: "Available Quantity", value: product.availableQuantity },
    { label: "Reserved Quantity", value: product.reservedQuantity },
    { label: "Minimum Stock", value: product.minimumStock },
    { label: "Maximum Stock", value: product.maximumStock },
    { label: "Reorder Level", value: product.reorderLevel },
  ];
  const hasInventoryData = inventoryFields.some((field) => hasValue(field.value));

  const specFields = [
    { label: "Weight", value: product.weight },
    { label: "Dimensions", value: product.dimensions },
    { label: "Material", value: product.material },
    { label: "Metal Type", value: product.metalType },
    { label: "Gold Purity", value: product.goldPurity },
    { label: "Country of Origin", value: product.countryOfOrigin },
    { label: "Manufactured By", value: product.manufacturedBy },
    { label: "Manufactured Date", value: product.manufacturedDate ? product.manufacturedDate.slice(0, 10) : null },
  ];
  const hasSpecData = specFields.some((field) => hasValue(field.value));

  const gemstoneFields = [
    { label: "Gemstone Type", value: product.gemstoneType },
    { label: "Variety", value: product.variety },
    { label: "Origin", value: product.origin },
    { label: "Shape", value: product.shape },
    { label: "Cut", value: product.cut },
    { label: "Colour", value: product.colour },
    { label: "Clarity", value: product.clarity },
    { label: "Treatment", value: product.treatment },
    { label: "Heat Status", value: product.heatStatus },
    { label: "Oil Level", value: product.oilLevel },
    { label: "Transparency", value: product.transparency },
    { label: "Quality Grade", value: product.qualityGrade },
    { label: "Natural / Synthetic", value: product.naturalSynthetic },
    { label: "Pieces", value: product.pieces },
    { label: "Total Carat", value: product.totalCarat },
    { label: "Average Carat", value: product.averageCarat },
    { label: "Cost Per Carat", value: product.costPerCarat },
    { label: "Selling Price Per Carat", value: product.sellingPricePerCarat },
  ];
  const hasGemstoneData = gemstoneFields.some((field) => hasValue(field.value));

  const certificateFields = [
    { label: "Certificate Available", value: product.certificateAvailable },
    { label: "Laboratory", value: product.laboratory },
    { label: "Certificate Number", value: product.certificateNumber },
    { label: "Certificate Date", value: product.certificateDate ? product.certificateDate.slice(0, 10) : null },
    { label: "Certificate Cost", value: product.certificateCost },
    { label: "Certificate Notes", value: product.certificateNotes, fullWidth: true },
  ];
  const hasCertificateData = certificateFields.some((field) => hasValue(field.value));

  const purchaseFields = [
    { label: "Supplier", value: product.supplier },
    { label: "Supplier Reference", value: product.supplierReference },
    { label: "Purchase Date", value: product.purchaseDate ? product.purchaseDate.slice(0, 10) : null },
    { label: "Payment Status", value: product.paymentStatus },
    { label: "Outstanding Amount", value: product.outstandingAmount },
    { label: "Supplier Notes", value: product.supplierNotes, fullWidth: true },
  ];
  const hasPurchaseData = purchaseFields.some((field) => hasValue(field.value));

  const salesFields = [
    { label: "Selling Status", value: product.sellingStatus },
    { label: "Last Selling Price", value: product.lastSellingPrice },
    { label: "Customer", value: product.customer },
    { label: "Salesperson", value: product.salesperson },
    { label: "Last Sold Date", value: product.lastSoldDate ? product.lastSoldDate.slice(0, 10) : null },
    { label: "Sales Payment Status", value: product.salesPaymentStatus },
    { label: "Consignment Status", value: product.consignmentStatus },
  ];
  const hasSalesData = salesFields.some((field) => hasValue(field.value));

  const notesFields = [
    { label: "Internal Notes", value: product.internalNotes },
    { label: "Customer Notes", value: product.customerNotes },
    { label: "Special Instructions", value: product.specialInstructions },
  ];
  const hasNotesData = notesFields.some((field) => hasValue(field.value));

  const hasFiles =
    hasValue(product.videos) ||
    hasValue(product.documents) ||
    hasValue(product.warranty) ||
    hasValue(product.cadFiles) ||
    hasValue(product.certificatePdf) ||
    hasValue(product.certificateImages);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Top accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 sm:p-6">
          {/* Left: product identity */}
          <div className="flex items-start gap-4 min-w-0">
            {/* Category icon badge */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight break-words">
                  {product.name || "Unnamed Product"}
                </h1>
                <Badge
                  variant={
                    product.status === "In Stock" || product.status === "Available"
                      ? "success"
                      : product.status === "Sold"
                      ? "danger"
                      : product.status === "Draft"
                      ? "neutral"
                      : "warning"
                  }
                >
                  {product.status}
                </Badge>
                {hasValue(product.category) && (
                  <Badge variant="primary">{product.category}</Badge>
                )}
              </div>

              {/* ID chips row */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
                  <Hash className="h-3 w-3" />
                  {product.productCode || "—"}
                </span>
                {hasValue(product.stockNo) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
                    <Layers className="h-3 w-3" />
                    {product.stockNo}
                  </span>
                )}
                {hasValue(product.sku) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
                    <Tag className="h-3 w-3" />
                    {product.sku}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showComponents && (
              <Button variant="outline" onClick={handleOpenComp} size="sm">
                <Plus className="h-4 w-4" /> Add Component
              </Button>
            )}
            {isManagerOrAdmin && product.status !== "In Stock" && (
              <Button onClick={handleApprove} size="sm">
                <ShieldCheck className="h-4 w-4" /> Approve Costing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Overview Grid (Only if there is financial data) */}
      {hasFinancialData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-sans">
          {hasValue(product.sellingPrice) && product.sellingPrice > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Selling Price</p>
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">${product.sellingPrice.toLocaleString()}</p>
            </div>
          )}
          {hasValue(product.costPrice) && product.costPrice > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cost Price</p>
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-3.5 w-3.5 text-gray-500" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-700">${product.costPrice.toLocaleString()}</p>
            </div>
          )}
          {hasValue(product.grossProfit) && product.grossProfit > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gross Profit</p>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-600">${product.grossProfit.toLocaleString()}</p>
            </div>
          )}
          {hasValue(product.charityAmount) && product.charityAmount > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Charity ({costing?.charityPercentage || 2.0}%)</p>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <HeartHandshake className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </div>
              <p className="text-lg font-bold text-amber-600">${product.charityAmount.toLocaleString()}</p>
            </div>
          )}
          {hasValue(product.netProfit) && (
            <div className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1 ${
              product.netProfit > 0 ? "border-emerald-100" : "border-rose-100"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Net Profit</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  product.netProfit > 0 ? "bg-emerald-50" : "bg-rose-50"
                }`}>
                  {product.netProfit > 0
                    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                </div>
              </div>
              <p className={`text-lg font-bold ${
                product.netProfit > 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                ${product.netProfit.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: General Profile and Details (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* General Information Card */}
          {hasGeneralData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={Package} title="General Details" accent="primary" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generalFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} className={f.fullWidth ? "md:col-span-2" : ""} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Specifications Card */}
          {hasSpecData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={Layers} title="Physical Specifications" accent="violet" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Gemstone Details Card */}
          {hasGemstoneData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={BarChart3} title="Gemstone & Material Details" accent="sky" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gemstoneFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Composition & Component List — only for eligible product types */}
          {showComponents && components && components.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-white flex items-center gap-3">
                <SectionHeading icon={Pencil} title="Composition & Recipe" accent="amber" />
                <p className="text-xs text-gray-400 ml-auto">Gemstones and materials in this assembly</p>
              </div>
              <DataTable
                headers={["Type", "Source Component ID/Details", "Used Qty", "Used Weight", "Remarks", "Actions"]}
                data={components}
                emptyMessage="No components linked to this product recipe yet."
                renderRow={(comp) => (
                  <tr key={comp._id} className="border-b border-gray-100 text-xs sm:text-sm">
                    <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 truncate text-xs sm:text-sm">{comp.sourceType}</td>
                    <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 break-words min-w-0 text-xs sm:text-sm">
                      {comp.sourceId
                        ? comp.sourceType === "Material"
                          ? `${comp.sourceId.materialCode} - ${comp.sourceId.materialName}`
                          : comp.sourceType === "Gemstone"
                          ? `${comp.sourceId.stoneId} - ${comp.sourceId.gemstone}`
                          : `${comp.sourceId.lotId} - ${comp.sourceId.gemstone}`
                        : "Linked Item Deleted"}
                    </td>
                    <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 whitespace-nowrap text-xs sm:text-sm">{comp.quantity}</td>
                    <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 font-medium whitespace-nowrap text-xs sm:text-sm">
                      {comp.weight > 0 ? `${comp.weight} ct` : "—"}
                    </td>
                    <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-500 break-words text-xs sm:text-sm">{comp.remarks || "—"}</td>
                    <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
                      <button
                        onClick={() => onDeleteComp(comp._id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        title="Remove Component"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )}
              />
            </div>
          )}

          {/* Certificate Information Card */}
          {hasCertificateData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={ShieldCheck} title="Certificate Information" accent="emerald" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {certificateFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} className={f.fullWidth ? "md:col-span-2" : ""} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Purchase Info Card */}
          {hasPurchaseData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={Tag} title="Purchase & Supplier Info" accent="rose" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {purchaseFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} className={f.fullWidth ? "md:col-span-2" : ""} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Sales Card */}
          {hasSalesData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={TrendingUp} title="Sales & Consignment Details" accent="emerald" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {salesFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Inventory & Stock Details Card */}
          {hasInventoryData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={Layers} title="Inventory & Stock Status" accent="sky" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inventoryFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Notes Card */}
          {hasNotesData && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={Pencil} title="Notes & Special Instructions" accent="amber" />
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-3">
                {notesFields.map((f, idx) => (
                  <DetailField key={idx} label={f.label} value={f.value} className="col-span-2" />
                ))}
              </CardBody>
            </Card>
          )}

        </div>

        {/* Right Side: Costing Engine, History, and Files (lg:col-span-1) */}
        <div className="flex flex-col gap-6">

          {/* Gallery Images Card */}
          {product.imageUrls && product.imageUrls.length > 0 && (
            <Card className="premium-card">
              <CardHeader>
                <h3 className="font-semibold text-gray-900 font-display">Gallery</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-3">
                  {product.imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer"
                      onClick={() => setPreviewImage(url)}
                    >
                      <img
                        src={url}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-md">View</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Attachments Card */}
          {hasFiles && (
            <Card className="premium-card">
              <CardHeader>
                <h3 className="font-semibold text-gray-900 font-display">Documents & Files</h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-2.5">
                {hasValue(product.certificatePdf) && (
                  <a
                    href={product.certificatePdf}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all text-sm text-primary font-semibold"
                  >
                    <span className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">PDF</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">Certificate Report</p>
                      <p className="truncate text-gray-700 text-xs">View Certificate PDF</p>
                    </div>
                  </a>
                )}
                {hasValue(product.warranty) && (
                  <a
                    href={product.warranty}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-155 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all text-sm text-primary font-semibold"
                  >
                    <span className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">WTY</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">Warranty</p>
                      <p className="truncate text-gray-700 text-xs">View Warranty Document</p>
                    </div>
                  </a>
                )}
                {hasValue(product.cadFiles) && (
                  <a
                    href={product.cadFiles}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-155 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all text-sm text-primary font-semibold"
                  >
                    <span className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">CAD</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">CAD / 3D File</p>
                      <p className="truncate text-gray-700 text-xs">Download CAD File</p>
                    </div>
                  </a>
                )}
                {hasValue(product.videos) && (
                  <a
                    href={product.videos}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-155 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all text-sm text-primary font-semibold"
                  >
                    <span className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">VID</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">Video Clip</p>
                      <p className="truncate text-gray-700 text-xs">Play Product Video</p>
                    </div>
                  </a>
                )}
                {hasValue(product.documents) && (
                  <a
                    href={product.documents}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-155 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all text-sm text-primary font-semibold"
                  >
                    <span className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">DOC</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">Attachment</p>
                      <p className="truncate text-gray-700 text-xs">View Document File</p>
                    </div>
                  </a>
                )}
              </CardBody>
            </Card>
          )}

          {/* Tags */}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <Card className="premium-card">
              <CardHeader>
                <SectionHeading icon={Tag} title="Tags" accent="primary" />
              </CardHeader>
              <CardBody className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Interactive Costing Engine calculations (PRD §3.6 requirements) */}
          <Card className="premium-card overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900 font-display">Costing Engine</h3>
                  {!isWorkshop && (
                    <Button onClick={handleSaveCosting} size="sm" className="w-fit">
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">Material → Production → Other → Markup → Final Cost & Profits</p>
              </div>
            </CardHeader>
            <CardBody className="flex flex-col gap-5 p-4">
              {/* 1. Material Costs */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-[11px] text-primary uppercase tracking-wider pb-1 border-b border-gray-100">
                  1. Material Costs
                </h4>
                <div className="flex justify-between text-xs text-gray-500 py-1 bg-gray-50 rounded-lg px-3">
                  <span>Recipe Materials:</span>
                  <span className="font-bold text-gray-800">${rt.recipeMaterialCost.toLocaleString()}</span>
                </div>
                <Input
                  label="Gemstones Cost ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.materials.gemstones}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      materials: { ...costingForm.materials, gemstones: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Diamonds Cost ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.materials.diamonds}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      materials: { ...costingForm.materials, diamonds: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Precious Gold ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.materials.gold}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      materials: { ...costingForm.materials, gold: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Watch Parts ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.materials.watchComponents}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      materials: { ...costingForm.materials, watchComponents: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Strap / Packaging ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.materials.strap}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      materials: { ...costingForm.materials, strap: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Other Materials ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.materials.other}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      materials: { ...costingForm.materials, other: Number(e.target.value) },
                    })
                  }
                />
              </div>

              {/* 2. Production Costs */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-[11px] text-primary uppercase tracking-wider pb-1 border-b border-gray-100">
                  2. Production Costs
                </h4>
                <Input
                  label="CAD Designing ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.production.cad}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      production: { ...costingForm.production, cad: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Casting / Metalwork ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.production.casting}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      production: { ...costingForm.production, casting: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Stone Setting ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.production.stoneSetting}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      production: { ...costingForm.production, stoneSetting: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Polishing / Finishing ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.production.polishing}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      production: { ...costingForm.production, polishing: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Assembly ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.production.assembly}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      production: { ...costingForm.production, assembly: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="QC Testing ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.production.qc}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      production: { ...costingForm.production, qc: Number(e.target.value) },
                    })
                  }
                />
              </div>

              {/* 3. Other Costs */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-[11px] text-primary uppercase tracking-wider pb-1 border-b border-gray-100">
                  3. Other Costs
                </h4>
                <Input
                  label="Lab Certificate ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.other.certificate}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      other: { ...costingForm.other, certificate: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Shipping / Courier ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.other.shipping}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      other: { ...costingForm.other, shipping: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Insurance ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.other.insurance}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      other: { ...costingForm.other, insurance: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Packaging ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.other.packaging}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      other: { ...costingForm.other, packaging: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Marketing ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.other.marketing}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      other: { ...costingForm.other, marketing: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Broker Commission ($)"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.other.commission}
                  onChange={(e) =>
                    setCostingForm({
                      ...costingForm,
                      other: { ...costingForm.other, commission: Number(e.target.value) },
                    })
                  }
                />
              </div>

              {/* Percentage Based Items */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-[11px] text-primary uppercase tracking-wider">
                  Percentage-based Items
                </h4>

                {!isWorkshop && (
                  <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <Input
                      label="Item Name"
                      value={newPercentItem.name}
                      onChange={(e) => setNewPercentItem({ ...newPercentItem, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Percent (%)"
                        type="number"
                        value={newPercentItem.percentage}
                        onChange={(e) => setNewPercentItem({ ...newPercentItem, percentage: e.target.value })}
                      />
                      <Select
                        label="Basis"
                        value={newPercentItem.basis}
                        onChange={(e) => setNewPercentItem({ ...newPercentItem, basis: e.target.value })}
                        options={[
                          { value: "Material Cost", label: "Mat Cost" },
                          { value: "Production Cost", label: "Prod Cost" },
                          { value: "Total Cost", label: "Total Cost" },
                          { value: "Selling Price", label: "Sell Price" },
                          { value: "Gross Profit", label: "GP" },
                        ]}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={handleAddPercentItem}
                    >
                      + Add Item
                    </Button>
                  </div>
                )}

                <DataTable
                  headers={["Line Item", "%", "Calculated Amt", "Actions"]}
                  data={rt.percentageItems}
                  emptyMessage="No percentage-based items added."
                  renderRow={(item, idx) => (
                    <tr key={idx} className="border-b border-gray-50 text-[11px]">
                      <td className="px-2 py-1.5 font-medium">{item.name}</td>
                      <td className="px-2 py-1.5">{item.percentage}%</td>
                      <td className="px-2 py-1.5 font-semibold text-gray-900">${item.amount?.toFixed(2) || "0.00"}</td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          disabled={isWorkshop}
                          className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer disabled:opacity-50"
                          onClick={() => handleDeletePercentItem(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  )}
                />
              </div>

              {/* Ledger Summary */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl flex flex-col gap-2 text-xs text-gray-600 border border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 pb-1 border-b border-gray-200">
                  Real-time Ledger
                </h4>
                <div className="flex justify-between">
                  <span>Materials Cost:</span>
                  <span className="font-semibold text-gray-950">${rt.materialCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Production Cost:</span>
                  <span className="font-semibold text-gray-950">${rt.productionCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Cost:</span>
                  <span className="font-semibold text-gray-950">${rt.otherCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-medium text-gray-900">
                  <span>Base Cost:</span>
                  <span>${rt.baseCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Markup % items:</span>
                  <span>+${(rt.finalCostPrice - rt.baseCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Final Cost Price:</span>
                  <span>${rt.finalCostPrice.toLocaleString()}</span>
                </div>

                <div className="flex flex-col gap-1 pt-1.5 border-t border-gray-200">
                  <Input
                    label="Target Selling Price ($)"
                    type="number"
                    disabled={isWorkshop}
                    value={costingForm.sellingPrice}
                    onChange={(e) => setCostingForm({ ...costingForm, sellingPrice: Number(e.target.value) })}
                  />
                </div>

                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span>Gross Profit:</span>
                  <span className="font-bold text-gray-900">${rt.grossProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-rose-500">
                  <span>Charity Allocation ({costing?.charityPercentage || 2.0}%):</span>
                  <span>-${rt.charityAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-danger">
                  <span>Post-selling % items:</span>
                  <span>-${rt.postSellingAdjustments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 border-t border-gray-200 pt-1 text-sm">
                  <span>Calculated Net Profit:</span>
                  <span>${rt.netProfit.toLocaleString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Activity Logs / History Feed */}
          {Array.isArray(product.history) && product.history.length > 0 && (
            <Card className="premium-card">
              <CardHeader>
                <h3 className="font-semibold text-gray-900 font-display">Product Activity History</h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="flow-root px-5 pb-5">
                  <ul className="-mb-8">
                    {product.history
                      .slice(-6)
                      .reverse()
                      .map((entry, index) => (
                        <li key={`${entry.action}-${index}`}>
                          <div className="relative pb-8">
                            {index !== product.history.slice(-6).length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold ring-8 ring-white">
                                  {entry.action.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-xs text-gray-800 font-semibold">{entry.action}</p>
                                  <p className="text-[10px] text-gray-400">By {entry.user || "System"}</p>
                                </div>
                                <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-medium">
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          )}

        </div>

      </div>

      {/* Add Component Modal */}
      <Modal isOpen={compOpen} onClose={() => setCompOpen(false)} title="Add Component to Composition">
        <form onSubmit={handleSubmit(onAddComp)} className="flex flex-col gap-4" noValidate>
          <Select
            label="Component Type *"
            error={errors.sourceType?.message}
            options={[
              { value: "Gemstone", label: "Gemstone (Individual)" },
              { value: "GemstoneLot", label: "Gemstone Lot (Aggregate)" },
              { value: "Material", label: "Raw Material (Metal/Settings)" },
            ]}
            {...register("sourceType")}
          />
          <Select
            label="Select Inventory Item *"
            error={errors.sourceId?.message}
            options={itemOptions}
            {...register("sourceId")}
          />
          <Input
            label="Quantity (Pieces/Grams) *"
            type="number"
            error={errors.quantity?.message}
            {...register("quantity")}
          />
          <Input
            label="Weight (Carats) (If Gemstone)"
            type="number"
            step="0.001"
            error={errors.weight?.message}
            {...register("weight")}
          />
          <Input label="Remarks / Description" error={errors.remarks?.message} {...register("remarks")} />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setCompOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Component</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDeleteComp}
        title="Remove Component"
        message="This component will be removed from the product composition. The source inventory item will not be affected."
        confirmLabel="Remove"
        isLoading={deleteConfirm.isLoading}
        variant="warning"
      />

      <Modal isOpen={Boolean(previewImage)} onClose={() => setPreviewImage(null)} title="Image Preview">
        <div className="flex items-center justify-center w-full max-h-[70vh] md:max-h-[60vh] overflow-auto">
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-gray-100"
          />
        </div>
      </Modal>
    </div>
  );
}
