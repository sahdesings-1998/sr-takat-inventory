import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2, ShieldCheck, Save } from "lucide-react";
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

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <Badge variant={product.status === "In Stock" ? "success" : "warning"}>{product.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Product Code: <span className="font-semibold text-gray-900">{product.productCode}</span>{" "}
            | Stock No: <span className="font-semibold text-gray-900">{product.stockNo}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleOpenComp}>
            <Plus className="h-4 w-4" /> Add Component
          </Button>
          {isManagerOrAdmin && (
            <Button onClick={handleApprove}>
              <ShieldCheck className="h-4 w-4" /> Approve Costing
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Product Profile</h3>
          <p className="text-xs text-gray-500">Dynamic fields for the selected product category</p>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Category</p>
            <p className="font-semibold text-gray-900">{product.category}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
            <p className="font-semibold text-gray-900">{product.status}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">SKU</p>
            <p className="font-semibold text-gray-900">{product.sku || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Currency</p>
            <p className="font-semibold text-gray-900">{product.currency || "USD"}</p>
          </div>
          {product.material && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Material</p>
              <p className="font-semibold text-gray-900">{product.material}</p>
            </div>
          )}
          {product.metalType && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Metal Type</p>
              <p className="font-semibold text-gray-900">{product.metalType}</p>
            </div>
          )}
          {product.gemstoneType && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Gemstone Type</p>
              <p className="font-semibold text-gray-900">{product.gemstoneType}</p>
            </div>
          )}
          {product.origin && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Origin</p>
              <p className="font-semibold text-gray-900">{product.origin}</p>
            </div>
          )}
          {product.supplier && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Supplier</p>
              <p className="font-semibold text-gray-900">{product.supplier}</p>
            </div>
          )}
          {product.internalNotes && (
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gray-500">Internal Notes</p>
              <p className="font-semibold text-gray-900">{product.internalNotes}</p>
            </div>
          )}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gray-500">Tags</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(product.history) && product.history.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-gray-500">History</p>
              <ul className="mt-2 space-y-2">
                {product.history.slice(-4).reverse().map((entry, index) => (
                  <li key={`${entry.action}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{entry.action}</span> · {new Date(entry.date).toLocaleDateString()} · {entry.user}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Financial Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Selling Price
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            ${product.sellingPrice.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cost Price</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            ${product.costPrice.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Gross Profit
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            ${(product.grossProfit || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Charity ({costing?.charityPercentage || 2.0}%)
          </p>
          <p className="mt-1 text-lg font-bold text-amber-600">
            ${(product.charityAmount || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Net Profit</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">
            ${(product.netProfit || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Components composition */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Product Composition & Recipe</h3>
          <p className="text-xs text-gray-500">
            Gemstones and precious materials used in this assembly
          </p>
        </div>

        <DataTable
          headers={[
            "Type",
            "Source Component ID/Details",
            "Used Qty",
            "Used Weight",
            "Remarks",
            "Actions",
          ]}
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

      {/* ── Detailed Costing Engine (PRD §3.6 requirements) ────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 font-display">Costing Engine Calculations</h3>
              <p className="text-xs text-gray-500 mt-1">Material Cost → Production Cost → Other Cost → Total Cost → Selling Price → Gross Profit</p>
            </div>
            {!isWorkshop && (
              <Button onClick={handleSaveCosting} className="w-fit shrink-0">
                <Save className="h-4 w-4" /> Calculate & Save Costing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Material Costs */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider pb-2 border-b border-gray-100">1. Material Costs</h4>
              <div className="flex justify-between text-xs text-gray-500 py-1 bg-gray-50 rounded-lg px-3">
                <span>Recipe Materials:</span>
                <span className="font-bold text-gray-800">${rt.recipeMaterialCost.toLocaleString()}</span>
              </div>
              <Input
                label="Gemstones Cost ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.materials.gemstones}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  materials: { ...costingForm.materials, gemstones: Number(e.target.value) }
                })}
              />
              <Input
                label="Diamonds Cost ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.materials.diamonds}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  materials: { ...costingForm.materials, diamonds: Number(e.target.value) }
                })}
              />
              <Input
                label="Precious Gold ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.materials.gold}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  materials: { ...costingForm.materials, gold: Number(e.target.value) }
                })}
              />
              <Input
                label="Watch Parts ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.materials.watchComponents}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  materials: { ...costingForm.materials, watchComponents: Number(e.target.value) }
                })}
              />
              <Input
                label="Strap / Packaging ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.materials.strap}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  materials: { ...costingForm.materials, strap: Number(e.target.value) }
                })}
              />
              <Input
                label="Other Materials ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.materials.other}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  materials: { ...costingForm.materials, other: Number(e.target.value) }
                })}
              />
            </div>

            {/* 2. Production Costs */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider pb-2 border-b border-gray-100">2. Production Costs</h4>
              <Input
                label="CAD Designing ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.production.cad}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  production: { ...costingForm.production, cad: Number(e.target.value) }
                })}
              />
              <Input
                label="Casting / Metalwork ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.production.casting}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  production: { ...costingForm.production, casting: Number(e.target.value) }
                })}
              />
              <Input
                label="Stone Setting ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.production.stoneSetting}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  production: { ...costingForm.production, stoneSetting: Number(e.target.value) }
                })}
              />
              <Input
                label="Polishing / Finishing ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.production.polishing}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  production: { ...costingForm.production, polishing: Number(e.target.value) }
                })}
              />
              <Input
                label="Assembly ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.production.assembly}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  production: { ...costingForm.production, assembly: Number(e.target.value) }
                })}
              />
              <Input
                label="QC Testing ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.production.qc}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  production: { ...costingForm.production, qc: Number(e.target.value) }
                })}
              />
            </div>

            {/* 3. Other Costs */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider pb-2 border-b border-gray-100">3. Other Costs</h4>
              <Input
                label="Lab Certificate ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.other.certificate}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  other: { ...costingForm.other, certificate: Number(e.target.value) }
                })}
              />
              <Input
                label="Shipping / Courier ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.other.shipping}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  other: { ...costingForm.other, shipping: Number(e.target.value) }
                })}
              />
              <Input
                label="Insurance ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.other.insurance}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  other: { ...costingForm.other, insurance: Number(e.target.value) }
                })}
              />
              <Input
                label="Packaging ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.other.packaging}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  other: { ...costingForm.other, packaging: Number(e.target.value) }
                })}
              />
              <Input
                label="Marketing ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.other.marketing}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  other: { ...costingForm.other, marketing: Number(e.target.value) }
                })}
              />
              <Input
                label="Broker Commission ($)"
                type="number"
                disabled={isWorkshop}
                value={costingForm.other.commission}
                onChange={(e) => setCostingForm({
                  ...costingForm,
                  other: { ...costingForm.other, commission: Number(e.target.value) }
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* Percentage Based Line Items */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Percentage-based Line Items</h4>
              
              {!isWorkshop && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <Input
                    label="Item Name"
                    value={newPercentItem.name}
                    onChange={(e) => setNewPercentItem({ ...newPercentItem, name: e.target.value })}
                  />
                  <Input
                    label="Percentage (%)"
                    type="number"
                    value={newPercentItem.percentage}
                    onChange={(e) => setNewPercentItem({ ...newPercentItem, percentage: e.target.value })}
                  />
                  <Select
                    label="Basis"
                    value={newPercentItem.basis}
                    onChange={(e) => setNewPercentItem({ ...newPercentItem, basis: e.target.value })}
                    options={[
                      { value: "Material Cost", label: "Material Cost" },
                      { value: "Production Cost", label: "Production Cost" },
                      { value: "Total Cost", label: "Total Cost" },
                      { value: "Selling Price", label: "Selling Price" },
                      { value: "Gross Profit", label: "Gross Profit" }
                    ]}
                  />
                  <Button type="button" variant="outline" className="sm:col-span-3 mt-2" onClick={handleAddPercentItem}>
                    <Plus className="h-4 w-4" /> Add Line Item
                  </Button>
                </div>
              )}

              <DataTable
                headers={["Line Item", "%", "Basis", "Calculated Amt", "Actions"]}
                data={rt.percentageItems}
                emptyMessage="No percentage-based items added."
                renderRow={(item, idx) => (
                  <tr key={idx} className="border-b border-gray-50 text-sm">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">{item.percentage}%</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{item.basis}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900">${item.amount?.toFixed(2) || "0.00"}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        disabled={isWorkshop}
                        className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer disabled:opacity-50"
                        onClick={() => handleDeletePercentItem(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}
              />
            </div>

            {/* Calculations Summary Ledger */}
            <div className="bg-gray-50 p-5 rounded-2xl flex flex-col gap-3 text-sm text-gray-600">
              <h4 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">Real-time Calculation Ledger</h4>
              
              <div className="flex justify-between">
                <span>Summed Material Cost:</span>
                <span className="font-semibold text-gray-950">${rt.materialCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Summed Production Cost:</span>
                <span className="font-semibold text-gray-950">${rt.productionCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Summed Other Cost:</span>
                <span className="font-semibold text-gray-950">${rt.otherCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-medium text-gray-900">
                <span>Base Cost:</span>
                <span>${rt.baseCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Cost-increasing % items:</span>
                <span>+${(rt.finalCostPrice - rt.baseCost).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Final Cost Price:</span>
                <span>${rt.finalCostPrice.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-200">
                <Input
                  label="Target Selling Price ($) *"
                  type="number"
                  disabled={isWorkshop}
                  value={costingForm.sellingPrice}
                  onChange={(e) => setCostingForm({ ...costingForm, sellingPrice: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span>Gross Profit Margin:</span>
                <span className="font-bold text-gray-900">${rt.grossProfit.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-xs text-rose-500">
                <span>Charity Allocation ({costing?.charityPercentage || 2.0}%):</span>
                <span>-${rt.charityAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-danger">
                <span>Post-selling % Commissions:</span>
                <span>-${rt.postSellingAdjustments.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-bold text-emerald-600 border-t border-gray-200 pt-2 text-base">
                <span>Calculated Net Profit:</span>
                <span>${rt.netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

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
            <Button type="submit">
              Add Component
            </Button>
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
    </div>
  );
}
