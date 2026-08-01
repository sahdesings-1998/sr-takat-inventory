import { useState, useEffect } from "react";
import { Truck, AlertCircle, Edit3, Save, X, Plus, DollarSign, Calendar, FileText, User } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/contexts/ToastContext";

function hasValue(val) {
  return val !== null && val !== undefined && val !== "" && val !== 0;
}

function Field({ label, value, fullWidth }) {
  if (!hasValue(value)) return null;
  return (
    <div className={`group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 ${fullWidth ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800 break-words">{typeof value === "number" ? `$${value.toLocaleString()}` : String(value)}</span>
    </div>
  );
}

const PAYMENT_VARIANT = {
  Paid: "success",
  Partial: "warning",
  Unpaid: "danger",
  Pending: "warning",
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Partial", label: "Partial" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Pending", label: "Pending" },
];

export default function TabSupplier({ product, updateProduct, isUpdating }) {
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplier: "",
    supplierReference: "",
    purchaseDate: "",
    purchaseInvoice: "",
    paymentStatus: "Paid",
    outstandingAmount: 0,
    supplierNotes: "",
  });

  // Sync state with product prop
  useEffect(() => {
    if (product) {
      setFormData({
        supplier: product.supplier || "",
        supplierReference: product.supplierReference || "",
        purchaseDate: product.purchaseDate ? product.purchaseDate.slice(0, 10) : "",
        purchaseInvoice: product.purchaseInvoice || "",
        paymentStatus: product.paymentStatus || "Paid",
        outstandingAmount: product.outstandingAmount || 0,
        supplierNotes: product.supplierNotes || "",
      });
    }
  }, [product]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (product) {
      setFormData({
        supplier: product.supplier || "",
        supplierReference: product.supplierReference || "",
        purchaseDate: product.purchaseDate ? product.purchaseDate.slice(0, 10) : "",
        purchaseInvoice: product.purchaseInvoice || "",
        paymentStatus: product.paymentStatus || "Paid",
        outstandingAmount: product.outstandingAmount || 0,
        supplierNotes: product.supplierNotes || "",
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updateProduct) {
      showError("Update Error", "Update functionality is not available.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        supplier: formData.supplier.trim(),
        supplierReference: formData.supplierReference.trim(),
        purchaseDate: formData.purchaseDate,
        purchaseInvoice: formData.purchaseInvoice.trim(),
        paymentStatus: formData.paymentStatus,
        outstandingAmount: Number(formData.outstandingAmount) || 0,
        supplierNotes: formData.supplierNotes.trim(),
      };

      await updateProduct(payload);
      showSuccess("Supplier Updated", "Supplier details updated successfully.");
      setIsEditing(false);
    } catch (err) {
      console.error("[SupplierUpdate] Failed to update supplier:", err);
      showError("Update Failed", err?.response?.data?.message || "Failed to update supplier details.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasOutstanding = (product?.outstandingAmount || 0) > 0;
  const paymentVariant = PAYMENT_VARIANT[product?.paymentStatus] || "neutral";

  const hasSupplierData =
    hasValue(product?.supplier) ||
    hasValue(product?.supplierReference) ||
    hasValue(product?.purchaseDate) ||
    hasValue(product?.purchaseInvoice) ||
    hasValue(product?.paymentStatus) ||
    hasValue(product?.outstandingAmount) ||
    hasValue(product?.supplierNotes);

  return (
    <div className="space-y-5">
      {/* Outstanding Alert */}
      {!isEditing && hasOutstanding && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Outstanding Balance</p>
            <p className="text-xs text-amber-600">
              ${product.outstandingAmount?.toLocaleString()} remaining unpaid to supplier.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l-[3px] border-purple-400/60 text-purple-600">
                <Truck className="h-4 w-4" />
                <h3 className="font-semibold text-gray-900 text-sm">Supplier & Acquisition Details</h3>
              </div>
              {!isEditing && product?.paymentStatus && (
                <Badge variant={paymentVariant}>{product.paymentStatus}</Badge>
              )}
            </div>

            {/* Edit / Actions */}
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                icon={<Edit3 className="h-3.5 w-3.5" />}
                className="text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                Edit Supplier Info
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving || isUpdating}
                  icon={<X className="h-3.5 w-3.5" />}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={isSaving || isUpdating}
                  icon={<Save className="h-3.5 w-3.5" />}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Supplier / Vendor Name"
                  placeholder="e.g. Royal Gems Ltd."
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  leftIcon={<User className="h-4 w-4 text-gray-400" />}
                />

                <Input
                  label="Supplier Reference / SKU"
                  placeholder="e.g. SUP-REF-9920"
                  value={formData.supplierReference}
                  onChange={(e) => handleChange("supplierReference", e.target.value)}
                  leftIcon={<FileText className="h-4 w-4 text-gray-400" />}
                />

                <Input
                  label="Purchase Date"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange("purchaseDate", e.target.value)}
                  leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
                />

                <Input
                  label="Purchase Invoice #"
                  placeholder="e.g. INV-2026-0042"
                  value={formData.purchaseInvoice}
                  onChange={(e) => handleChange("purchaseInvoice", e.target.value)}
                  leftIcon={<FileText className="h-4 w-4 text-gray-400" />}
                />

                <Select
                  label="Payment Status"
                  options={PAYMENT_STATUS_OPTIONS}
                  value={formData.paymentStatus}
                  onChange={(val) => handleChange("paymentStatus", typeof val === "string" ? val : val?.target?.value || "Paid")}
                />

                <Input
                  label="Outstanding Amount ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.outstandingAmount}
                  onChange={(e) => handleChange("outstandingAmount", e.target.value)}
                  leftIcon={<DollarSign className="h-4 w-4 text-gray-400" />}
                />
              </div>

              <Textarea
                label="Supplier Notes & Acquisition Remarks"
                placeholder="Enter any notes regarding supplier terms, warranty, or acquisition context..."
                rows={3}
                value={formData.supplierNotes}
                onChange={(e) => handleChange("supplierNotes", e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving || isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving || isUpdating}
                  icon={<Save className="h-3.5 w-3.5" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          ) : hasSupplierData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="Supplier / Vendor" value={product?.supplier} />
              <Field label="Supplier Reference" value={product?.supplierReference} />
              <Field label="Purchase Date" value={product?.purchaseDate?.slice(0, 10)} />
              <Field label="Purchase Invoice #" value={product?.purchaseInvoice} />
              <Field label="Payment Status" value={product?.paymentStatus} />
              {hasOutstanding && (
                <Field label="Outstanding Amount" value={product?.outstandingAmount} />
              )}
              {product?.supplierNotes && (
                <Field label="Supplier Notes" value={product?.supplierNotes} fullWidth />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">No Supplier Details Recorded</p>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Supplier and acquisition details have not been added for this product yet.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                icon={<Plus className="h-4 w-4" />}
                className="text-purple-700 border-purple-200 hover:bg-purple-50 mt-1"
              >
                Add Supplier Details
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
