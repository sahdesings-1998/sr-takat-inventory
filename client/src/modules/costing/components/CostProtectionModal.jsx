import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { AlertTriangle, ShieldCheck, Check, ArrowRight } from "lucide-react";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default function CostProtectionModal({
  isOpen,
  onClose,
  onConfirm,
  productCode = "",
  productName = "",
  isSaving = false,
  oldCost = 0,
  newCost = 0,
  oldSellingPrice = 0,
  newSellingPrice = 0,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title="Protected Costing Update Confirmation"
      className="md:max-w-xl"
    >
      <div className="space-y-5 pt-2">
        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3.5 text-amber-900">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold text-amber-950">
              You are updating active costing records for product{" "}
              <span className="font-mono text-amber-800">{productCode}</span> ({productName})
            </p>
            <p className="text-amber-800 text-xs leading-relaxed">
              Please review the calculated financial changes below before confirming.
            </p>
          </div>
        </div>

        {/* Financial Comparison Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 text-xs">
          <div className="p-3 rounded-xl bg-white border border-gray-150 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Total Product Cost</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-gray-500 line-through">{formatCurrency(oldCost)}</span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <span className="font-bold text-gray-900">{formatCurrency(newCost)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-150 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Target Selling Price</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-gray-500 line-through">{formatCurrency(oldSellingPrice)}</span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <span className="font-bold text-emerald-600">{formatCurrency(newSellingPrice)}</span>
            </div>
          </div>
        </div>

        {/* Historical Integrity Assurance Notice */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white text-xs">Historical Sales & Data Protection Guaranteed</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Completed sales invoices, customer receipts, and historical financial reports will maintain their original recorded costs and COGS without modification.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isSaving}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirm & Save Costing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
