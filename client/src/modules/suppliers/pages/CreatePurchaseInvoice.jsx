import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, CheckCircle2, FileText, Paperclip, Truck } from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import { useCreatePurchaseInvoice } from "../hooks/usePurchaseInvoices";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";

export default function CreatePurchaseInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplierId = searchParams.get("supplierId");

  const { suppliers, isLoading: isLoadingSuppliers } = useSuppliers();
  const { createInvoice, isCreating } = useCreatePurchaseInvoice();
  const { showSuccess, showError } = useToast();

  const [supplierId, setSupplierId] = useState(preselectedSupplierId || "");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]);

  // Line items state
  const [items, setItems] = useState([
    {
      name: "",
      inventoryType: "Material",
      itemType: "Gold",
      quantity: 1,
      unit: "grams",
      purchasePrice: 0,
      discount: 0,
      tax: 0,
    },
  ]);

  useEffect(() => {
    if (preselectedSupplierId) {
      setSupplierId(preselectedSupplierId);
    }
  }, [preselectedSupplierId]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        inventoryType: "Material",
        itemType: "Gold",
        quantity: 1,
        unit: "grams",
        purchasePrice: 0,
        discount: 0,
        tax: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      showError("Validation Error", "Invoice must contain at least one item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: reader.result,
            fileType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Subtotal and totals calculation
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.purchasePrice || 0)), 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  const finalTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  const handleSubmit = async (confirmImmediately = false) => {
    if (!supplierId) {
      showError("Validation Error", "Please select a supplier.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.name.trim()) {
        showError("Validation Error", `Item #${i + 1} must have a name.`);
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        showError("Validation Error", `Item #${i + 1} quantity must be greater than 0.`);
        return;
      }
      if (Number(item.purchasePrice) < 0) {
        showError("Validation Error", `Item #${i + 1} purchase price cannot be negative.`);
        return;
      }
    }

    try {
      const res = await createInvoice({
        supplierId,
        supplierInvoiceNumber,
        invoiceDate,
        purchaseDate,
        dueDate: dueDate || null,
        notes,
        attachments,
        items,
        confirmImmediately,
      });

      showSuccess(
        confirmImmediately ? "Purchase Confirmed" : "Draft Invoice Saved",
        confirmImmediately
          ? "Purchase invoice confirmed and stock inward recorded successfully!"
          : "Purchase invoice draft saved."
      );
      navigate(`/purchase-invoices/${res.data._id}`);
    } catch (err) {
      showError("Creation Failed", err?.response?.data?.message || "Failed to create purchase invoice.");
    }
  };

  return (
    <div className="page-container space-y-6">
      <div>
        <Link
          to="/suppliers?tab=purchase-invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Purchase Invoices
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Create Purchase Invoice</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Record a new purchase invoice from supplier and process stock inward.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            isLoading={isCreating}
            disabled={isCreating}
          >
            Save as Draft
          </Button>

          <Button
            onClick={() => handleSubmit(true)}
            isLoading={isCreating}
            disabled={isCreating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Confirm & Inward Stock
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Header Details */}
          <Card p={5}>
            <CardHeader className="border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                1. Select Supplier &amp; Invoice Metadata
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Supplier *"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  options={[
                    { value: "", label: "-- Select Supplier --" },
                    ...suppliers.map((s) => ({ value: s._id, label: `${s.companyName} (${s.contactName || "No contact"})` })),
                  ]}
                  required
                />

                <Input
                  label="Supplier Invoice / Bill Number"
                  placeholder="e.g. INV-SUP-98231"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Invoice Date *"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
                <Input
                  label="Purchase Date *"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
                <Input
                  label="Payment Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Purchased Items Section */}
          <Card p={5}>
            <CardHeader className="border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                2. Add Purchased Items / Materials
              </h2>
              <Button size="sm" variant="outline" onClick={handleAddItem} icon={<Plus className="h-3.5 w-3.5" />}>
                Add Line Item
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              {items.map((item, idx) => {
                const lineTotal = Math.max(
                  0,
                  Number(item.quantity || 0) * Number(item.purchasePrice || 0) - Number(item.discount || 0) + Number(item.tax || 0)
                );

                return (
                  <div key={idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary">Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Product / Material Name *"
                        placeholder="e.g. 24K Pure Gold Grain / Emerald"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                        required
                      />

                      <Select
                        label="Inventory Type *"
                        value={item.inventoryType}
                        onChange={(e) => handleItemChange(idx, "inventoryType", e.target.value)}
                        options={[
                          { value: "Material", label: "Raw Material / Metal / Finding" },
                          { value: "Gemstone", label: "Gemstone Single Piece" },
                          { value: "GemstoneLot", label: "Gemstone Parcel / Lot" },
                          { value: "Product", label: "Finished Product / Jewellery" },
                        ]}
                      />

                      <Select
                        label="Item Sub-Type / Category"
                        value={item.itemType}
                        onChange={(e) => handleItemChange(idx, "itemType", e.target.value)}
                        options={[
                          { value: "Gold", label: "Gold" },
                          { value: "Silver", label: "Silver" },
                          { value: "Platinum", label: "Platinum" },
                          { value: "Setting", label: "Setting" },
                          { value: "Findings", label: "Findings" },
                          { value: "Packaging", label: "Packaging" },
                          { value: "Gemstone", label: "Gemstone" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <Input
                        label="Quantity *"
                        type="number"
                        step="0.001"
                        min="0.0001"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        required
                      />

                      <Select
                        label="Unit *"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        options={[
                          { value: "grams", label: "grams (g)" },
                          { value: "pcs", label: "pieces (pcs)" },
                          { value: "ct", label: "carats (ct)" },
                          { value: "kg", label: "kilograms (kg)" },
                        ]}
                      />

                      <Input
                        label="Purchase Price ($) *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.purchasePrice}
                        onChange={(e) => handleItemChange(idx, "purchasePrice", e.target.value)}
                        required
                      />

                      <Input
                        label="Discount ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.discount}
                        onChange={(e) => handleItemChange(idx, "discount", e.target.value)}
                      />

                      <Input
                        label="Tax ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.tax}
                        onChange={(e) => handleItemChange(idx, "tax", e.target.value)}
                      />
                    </div>

                    <div className="text-right pt-1 font-mono text-xs font-bold text-gray-900">
                      Line Total: <span className="text-sm text-primary">${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Invoice Summary & Attachments */}
        <div className="space-y-6">
          {/* Summary Box */}
          <Card p={5}>
            <CardHeader className="border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Financial Summary</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-gray-900">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono font-bold">-${totalDiscount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {totalTax > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-700">
                  <span>Total Tax:</span>
                  <span className="font-mono font-bold">+${totalTax.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-900">Final Total:</span>
                <span className="font-mono text-xl text-primary font-bold">
                  ${finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Notes & Attachments */}
          <Card p={5}>
            <CardHeader className="border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Notes &amp; Supporting Document</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Textarea
                label="Invoice Notes"
                placeholder="Add purchase notes, terms, or reference details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Attach Supplier Original Bill (Image/PDF)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachments.map((att, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200">
                        <Paperclip className="h-3 w-3 text-primary" />
                        {att.name}
                        <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-rose-600 hover:text-rose-800 font-bold ml-1">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
