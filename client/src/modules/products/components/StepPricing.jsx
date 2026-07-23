import { useMemo, useEffect } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { DollarSign, Calculator, ShieldCheck } from "lucide-react";
import CostingCalculatorWidget from "@/modules/costing/components/CostingCalculatorWidget";

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "AED", label: "AED (Dhs)" },
  { value: "INR", label: "INR (₹)" },
];

export default function StepPricing({ register, errors, setValue, watch }) {
  const sellingPrice = Number(watch("sellingPrice") || 0);
  const costBreakdown = watch("costBreakdown") || {};
  const category = watch("category") || "";
  const currency = watch("currency") || "USD";
  const discountAllowed = watch("discountAllowed") === "true" || watch("discountAllowed") === true;
  const components = watch("components") || [];

  const recipeMaterialCost = useMemo(() => {
    return components.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
      0
    );
  }, [components]);

  const handleCostingChange = ({ costBreakdown: updatedBreakdown, sellingPrice: updatedSp, summary }) => {
    setValue("costBreakdown", updatedBreakdown, { shouldDirty: true });
    setValue("sellingPrice", updatedSp, { shouldDirty: true });

    if (summary) {
      setValue("costPrice", summary.totalCost, { shouldDirty: true });
      setValue("totalCost", summary.totalCost, { shouldDirty: true });
      setValue("materialCost", summary.materialCost, { shouldDirty: true });
      setValue("manufacturingCost", summary.productionCost, { shouldDirty: true });
      setValue("otherCosts", summary.otherCost, { shouldDirty: true });
      setValue("grossProfit", summary.grossProfit, { shouldDirty: true });
      setValue("profit", summary.grossProfit, { shouldDirty: true });
      setValue("margin", summary.profitMargin, { shouldDirty: true });
      setValue("charityAmount", summary.charityAmount, { shouldDirty: true });
      setValue("netProfit", summary.netProfit, { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Retail Commercial Settings Header Bar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Commercial Pricing & Currency</h3>
              <p className="text-xs text-gray-500">Retail price, floor price, wholesale, currency, and discount policy</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shrink-0">
            <label htmlFor="discountAllowed" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Discount Allowed?
            </label>
            <input
              id="discountAllowed"
              type="checkbox"
              checked={discountAllowed}
              onChange={(e) => setValue("discountAllowed", e.target.checked ? "true" : "false")}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Selling Price (Retail) *"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("sellingPrice", { valueAsNumber: true })}
            error={errors?.sellingPrice?.message}
          />

          <Input
            label="Minimum Selling Price ($)"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("minimumSellingPrice", { valueAsNumber: true })}
          />

          <Input
            label="Wholesale Price ($)"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("wholesalePrice", { valueAsNumber: true })}
          />

          <Select
            label="Currency"
            options={currencyOptions}
            value={currency}
            onChange={(e) => setValue("currency", e.target.value)}
          />
        </div>
      </div>

      {/* Embedded Flexible Costing Engine */}
      <CostingCalculatorWidget
        costBreakdown={costBreakdown}
        sellingPrice={sellingPrice}
        recipeMaterialCost={recipeMaterialCost}
        charityPercentage={20.0}
        category={category}
        onChange={handleCostingChange}
      />
    </div>
  );
}

