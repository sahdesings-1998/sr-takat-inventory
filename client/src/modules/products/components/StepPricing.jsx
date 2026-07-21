import { useMemo, useEffect } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { DollarSign, TrendingUp, Calculator, ShieldCheck, AlertCircle } from "lucide-react";

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "AED", label: "AED (Dhs)" },
  { value: "INR", label: "INR (₹)" },
];

export default function StepPricing({ register, errors, setValue, watch }) {
  const purchasePrice = Number(watch("purchasePrice") || 0);
  const additionalCost = Number(watch("additionalCost") || 0);
  const certCost = Number(watch("certificateCost") || 0);
  const components = watch("components") || [];
  const sellingPrice = Number(watch("sellingPrice") || 0);
  const currency = watch("currency") || "USD";
  const discountAllowed = watch("discountAllowed") === "true" || watch("discountAllowed") === true;

  const componentsCost = useMemo(() => {
    return components.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);
  }, [components]);

  // Read-only calculated Total Cost
  const computedTotalCost = useMemo(() => {
    return purchasePrice + additionalCost + certCost + componentsCost;
  }, [purchasePrice, additionalCost, certCost, componentsCost]);

  // Read-only calculated Profit & Margin
  const profit = useMemo(() => {
    return sellingPrice - computedTotalCost;
  }, [sellingPrice, computedTotalCost]);

  const margin = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return (profit / sellingPrice) * 100;
  }, [profit, sellingPrice]);

  // Keep form totalCost, costPrice, profit, and margin in sync
  useEffect(() => {
    setValue("totalCost", computedTotalCost, { shouldDirty: true });
    setValue("costPrice", computedTotalCost, { shouldDirty: true });
    setValue("profit", profit, { shouldDirty: true });
    setValue("margin", margin, { shouldDirty: true });
  }, [computedTotalCost, profit, margin, setValue]);

  return (
    <div className="space-y-6">
      {/* Real-time Profitability Header Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700 shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Cost Price</span>
            <span className="text-xl font-bold text-gray-900 font-mono">
              ${computedTotalCost.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Target Selling Price</span>
            <span className="text-xl font-bold text-primary font-mono">
              ${sellingPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-xs flex items-center gap-4 ${
          profit >= 0 ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
        }`}>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
            profit >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Gross Profit & Margin</span>
              {profit < 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                  <AlertCircle className="h-3 w-3" /> Loss
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold font-mono ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                ${profit.toFixed(2)}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                margin >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost & Procurement Card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Cost Breakdown & Expense Input</h3>
            <p className="text-xs text-gray-500">Acquisition cost, freight, components, and certification expenses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Base Purchase Price ($) *"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("purchasePrice", { valueAsNumber: true })}
            error={errors?.purchasePrice?.message}
          />

          <Input
            label="Additional Cost / Freight ($)"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("additionalCost", { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700">BOM Components Cost</label>
            <div className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-700 font-mono">
              <span>Components Total</span>
              <span>${componentsCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700">Certificate Cost</label>
            <div className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-700 font-mono">
              <span>Certificate Fee</span>
              <span>${certCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selling Prices Card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Retail & Commercial Selling Prices</h3>
              <p className="text-xs text-gray-500">Retail, wholesale, minimum floor price, and discount authorization</p>
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
    </div>
  );
}
