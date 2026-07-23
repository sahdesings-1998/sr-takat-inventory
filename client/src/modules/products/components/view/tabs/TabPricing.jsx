import { useState } from "react";
import CostingCalculatorWidget from "@/modules/costing/components/CostingCalculatorWidget";
import CostProtectionModal from "@/modules/costing/components/CostProtectionModal";
import Button from "@/components/ui/Button";
import { Save } from "lucide-react";
import { productsApi } from "@/modules/products/api/productsApi";
import { useToast } from "@/contexts/ToastContext";
import { calculateCostingDetails } from "@/utils/costingCalculator";

export default function TabPricing({ product }) {
  const { showSuccess, showError } = useToast();
  const [costingState, setCostingState] = useState(() => ({
    costBreakdown: product?.costBreakdown || {},
    sellingPrice: product?.sellingPrice || 0,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);

  const handleInitiateSave = () => {
    if (!product?._id) return;
    if ((product.costPrice || 0) > 0 || (product.sellingPrice || 0) > 0) {
      setShowProtectionModal(true);
    } else {
      executeSaveCosting();
    }
  };

  const executeSaveCosting = async () => {
    if (!product?._id) return;
    setIsSaving(true);
    try {
      await productsApi.saveCosting(product._id, {
        costBreakdown: costingState.costBreakdown,
        sellingPrice: costingState.sellingPrice,
      });
      showSuccess("Costing Saved", "Updated product cost calculations successfully.");
      setShowProtectionModal(false);
    } catch (err) {
      console.error("Failed to save costing from tab:", err);
      showError("Save Error", err.message || "Failed to update costing details.");
    } finally {
      setIsSaving(false);
    }
  };

  const newSummary = calculateCostingDetails({
    costBreakdown: costingState.costBreakdown,
    sellingPrice: costingState.sellingPrice,
  });

  return (
    <div className="space-y-6">
      <CostingCalculatorWidget
        costBreakdown={costingState.costBreakdown}
        sellingPrice={costingState.sellingPrice}
        recipeMaterialCost={0}
        charityPercentage={20.0}
        category={product?.category}
        onChange={({ costBreakdown, sellingPrice }) => {
          setCostingState({ costBreakdown, sellingPrice });
        }}
      />

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button
          variant="primary"
          onClick={handleInitiateSave}
          disabled={isSaving}
          className="gap-2 shadow-sm"
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Costing Breakdown
        </Button>
      </div>

      {product && (
        <CostProtectionModal
          isOpen={showProtectionModal}
          onClose={() => setShowProtectionModal(false)}
          onConfirm={executeSaveCosting}
          productCode={product.productCode || product.stockNo}
          productName={product.name}
          isSaving={isSaving}
          oldCost={product.costPrice || 0}
          newCost={newSummary.totalCost}
          oldSellingPrice={product.sellingPrice || 0}
          newSellingPrice={costingState.sellingPrice}
        />
      )}
    </div>
  );
}


