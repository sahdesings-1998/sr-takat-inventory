import { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Wrench,
  Package,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import {
  MATERIAL_FIELDS,
  PRODUCTION_FIELDS,
  OTHER_FIELDS,
  BASIS_OPTIONS,
  normalizeItem,
  calculateCostingDetails,
} from "@/utils/costingCalculator";

function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default function CostingCalculatorWidget({
  costBreakdown = {},
  sellingPrice = 0,
  recipeMaterialCost = 0,
  charityPercentage = 20.0,
  category = "",
  onChange,
  readOnly = false,
}) {
  const [localBreakdown, setLocalBreakdown] = useState(() => {
    return {
      materials: costBreakdown.materials || {},
      production: costBreakdown.production || {},
      other: costBreakdown.other || {},
    };
  });

  const [localSellingPrice, setLocalSellingPrice] = useState(() => Number(sellingPrice) || 0);

  useEffect(() => {
    setLocalBreakdown({
      materials: costBreakdown.materials || {},
      production: costBreakdown.production || {},
      other: costBreakdown.other || {},
    });
  }, [costBreakdown]);

  useEffect(() => {
    setLocalSellingPrice(Number(sellingPrice) || 0);
  }, [sellingPrice]);

  const summary = useMemo(() => {
    return calculateCostingDetails({
      costBreakdown: localBreakdown,
      sellingPrice: localSellingPrice,
      recipeMaterialCost,
      charityPercentage,
    });
  }, [localBreakdown, localSellingPrice, recipeMaterialCost, charityPercentage]);

  const handleItemChange = (categoryKey, fieldKey, keyToUpdate, val) => {
    if (readOnly) return;
    setLocalBreakdown((prev) => {
      const categoryObj = { ...(prev[categoryKey] || {}) };
      const currentItem = normalizeItem(
        categoryObj[fieldKey],
        categoryKey === "materials"
          ? "Material Cost"
          : categoryKey === "production"
          ? "Production Cost"
          : fieldKey === "commission"
          ? "Gross Profit"
          : "Total Cost"
      );

      const updatedItem = {
        ...currentItem,
        [keyToUpdate]: keyToUpdate === "value" ? Number(val) || 0 : val,
      };

      const updatedBreakdown = {
        ...prev,
        [categoryKey]: {
          ...categoryObj,
          [fieldKey]: updatedItem,
        },
      };

      if (onChange) {
        const newSummary = calculateCostingDetails({
          costBreakdown: updatedBreakdown,
          sellingPrice: localSellingPrice,
          recipeMaterialCost,
          charityPercentage,
        });
        onChange({
          costBreakdown: updatedBreakdown,
          sellingPrice: localSellingPrice,
          summary: newSummary,
        });
      }

      return updatedBreakdown;
    });
  };

  const handleSellingPriceChange = (val) => {
    const newSp = Number(val) || 0;
    setLocalSellingPrice(newSp);
    if (onChange && !readOnly) {
      const newSummary = calculateCostingDetails({
        costBreakdown: localBreakdown,
        sellingPrice: newSp,
        recipeMaterialCost,
        charityPercentage,
      });
      onChange({
        costBreakdown: localBreakdown,
        sellingPrice: newSp,
        summary: newSummary,
      });
    }
  };

  const renderCostRow = (categoryKey, fieldKey, label) => {
    const item = summary.normalized[categoryKey][fieldKey];
    const isPercentage = item.type === "percentage";

    return (
      <div
        key={fieldKey}
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors"
      >
        {/* Cost Name */}
        <div className="sm:col-span-3 flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{label}</span>
        </div>

        {/* Cost Type Toggle */}
        <div className="sm:col-span-3 flex items-center justify-start gap-1">
          <div className="inline-flex p-0.5 rounded-lg bg-gray-200/70 text-xs font-semibold select-none">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => handleItemChange(categoryKey, fieldKey, "type", "fixed")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                !isPercentage
                  ? "bg-white text-gray-900 shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Fixed ($)
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => handleItemChange(categoryKey, fieldKey, "type", "percentage")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                isPercentage
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Rate (%)
            </button>
          </div>
        </div>

        {/* Input Value */}
        <div className="sm:col-span-2">
          <div className="relative">
            <input
              type="number"
              step="any"
              disabled={readOnly}
              placeholder="0.00"
              value={item.value || ""}
              onChange={(e) => handleItemChange(categoryKey, fieldKey, "value", e.target.value)}
              className="w-full text-xs sm:text-sm font-mono font-semibold rounded-lg border border-gray-200 bg-white px-3 py-1.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-gray-400 font-bold">
              {isPercentage ? "%" : "$"}
            </span>
          </div>
        </div>

        {/* Calculation Source Selector (If Percentage) */}
        <div className="sm:col-span-2">
          {isPercentage ? (
            <select
              disabled={readOnly}
              value={item.basis}
              onChange={(e) => handleItemChange(categoryKey, fieldKey, "basis", e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-2 py-1.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              {BASIS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] font-medium text-gray-400 block text-center">Fixed Amount</span>
          )}
        </div>

        {/* Calculated Amount */}
        <div className="sm:col-span-2 text-right">
          <span className="text-xs sm:text-sm font-mono font-bold text-gray-900 block">
            {formatCurrency(item.amount)}
          </span>
          {isPercentage && (
            <span className="text-[10px] text-primary font-medium block">
              {item.value}% of {item.basis}
            </span>
          )}
        </div>
      </div>
    );
  };

  const hasSavedData = useMemo(() => {
    if (!costBreakdown) return false;
    const m = costBreakdown.materials || {};
    const p = costBreakdown.production || {};
    const o = costBreakdown.other || {};
    return Object.keys(m).length > 0 || Object.keys(p).length > 0 || Object.keys(o).length > 0;
  }, [costBreakdown]);

  return (
    <div className="space-y-6">
      {/* Prefill Status Banner */}
      <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
        hasSavedData
          ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
          : "bg-blue-50/60 border-blue-200 text-blue-900"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className={`h-4 w-4 ${hasSavedData ? "text-emerald-600" : "text-blue-600"}`} />
          <span>
            {hasSavedData
              ? "Prefilled Saved Costing Data — Product-specific cost breakdown loaded."
              : "Unconfigured Product Costing — Enter product-specific material, production, or other costs below."}
          </span>
        </div>
        <Badge variant={hasSavedData ? "success" : "info"}>
          {hasSavedData ? "Saved Data Loaded" : "New / Blank"}
        </Badge>
      </div>

      {/* Dynamic Summary Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Material Cost */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block truncate">
              Material Cost
            </span>
            <span className="text-lg font-bold text-gray-900 font-mono block">
              {formatCurrency(summary.materialCost)}
            </span>
          </div>
        </div>

        {/* Total Production Cost */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block truncate">
              Production Cost
            </span>
            <span className="text-lg font-bold text-gray-900 font-mono block">
              {formatCurrency(summary.productionCost)}
            </span>
          </div>
        </div>

        {/* Total Other Cost */}
        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block truncate">
              Other Cost
            </span>
            <span className="text-lg font-bold text-gray-900 font-mono block">
              {formatCurrency(summary.otherCost)}
            </span>
          </div>
        </div>

        {/* Total Product Cost */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block truncate">
              Total Product Cost
            </span>
            <span className="text-lg font-bold text-primary font-mono block">
              {formatCurrency(summary.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Target Selling Price Bar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Commercial Target Selling Price</h4>
            <p className="text-xs text-gray-500">
              Selling Price drives Gross Profit, Commission %, and Charity Allocations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-600 shrink-0">Target Selling Price ($):</span>
          <input
            type="number"
            step="any"
            disabled={readOnly}
            value={localSellingPrice || ""}
            onChange={(e) => handleSellingPriceChange(e.target.value)}
            className="w-full sm:w-44 text-base font-bold font-mono text-emerald-700 rounded-xl border border-emerald-300 bg-emerald-50/40 px-3.5 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Section 1: Material Cost Category */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-amber-600">
            <Layers className="h-5 w-5" />
            <h3 className="text-base font-bold text-gray-900">1. Material Cost Breakdown</h3>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Category Total: {formatCurrency(summary.materialCost)}
          </span>
        </div>

        {recipeMaterialCost > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50/60 rounded-xl border border-amber-100 text-xs font-medium text-amber-800">
            <span>Recipe BOM Components Cost (Auto-linked)</span>
            <span className="font-mono font-bold">{formatCurrency(recipeMaterialCost)}</span>
          </div>
        )}

        <div className="space-y-2">
          {MATERIAL_FIELDS.map(({ key, label }) => renderCostRow("materials", key, label))}
        </div>
      </div>

      {/* Section 2: Production Cost Category */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Wrench className="h-5 w-5" />
            <h3 className="text-base font-bold text-gray-900">2. Production Cost Breakdown</h3>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Category Total: {formatCurrency(summary.productionCost)}
          </span>
        </div>

        <div className="space-y-2">
          {PRODUCTION_FIELDS.map(({ key, label }) => renderCostRow("production", key, label))}
        </div>
      </div>

      {/* Section 3: Other Cost Category */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-purple-600">
            <Package className="h-5 w-5" />
            <h3 className="text-base font-bold text-gray-900">3. Other Cost Breakdown</h3>
          </div>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            Category Total: {formatCurrency(summary.otherCost)}
          </span>
        </div>

        <div className="space-y-2">
          {OTHER_FIELDS.map(({ key, label }) => renderCostRow("other", key, label))}
        </div>
      </div>

      {/* Section 4: Dynamic Cost Summary & Financial Performance */}
      <div className="rounded-2xl border border-gray-200/90 bg-slate-900 text-white p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-base font-bold text-white">Cost Summary & Financial Performance</h3>
          </div>
          <Badge variant="success">Real-time Calculation</Badge>
        </div>

        {/* 3 Categories Breakdown Equation */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-xs font-mono">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-sans">Material</span>
            <span className="text-amber-300 font-bold text-sm">{formatCurrency(summary.materialCost)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-sans">Production</span>
            <span className="text-blue-300 font-bold text-sm">{formatCurrency(summary.productionCost)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-sans">Other</span>
            <span className="text-purple-300 font-bold text-sm">{formatCurrency(summary.otherCost)}</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            <span className="text-gray-400 block text-[10px] uppercase font-sans">Total Product Cost</span>
            <span className="text-emerald-400 font-extrabold text-sm">{formatCurrency(summary.totalCost)}</span>
          </div>
        </div>

        {/* Commercial Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Selling Price</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(summary.sellingPrice)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Profit</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(summary.grossProfit)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Profit Margin</span>
            <span className="text-sm font-bold text-primary font-mono">{summary.profitMargin.toFixed(2)}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Commission</span>
            <span className="text-sm font-bold text-amber-300 font-mono">{formatCurrency(summary.commissionAmount)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Charity ({charityPercentage}%)</span>
            <span className="text-sm font-bold text-rose-400 font-mono">{formatCurrency(summary.charityAmount)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Profit</span>
            <span className="text-sm font-bold text-emerald-300 font-mono">{formatCurrency(summary.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
