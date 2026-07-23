import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Package,
  Archive,
  Lock,
  Warehouse,
  Truck,
} from "lucide-react";

function KpiCard({ icon: Icon, label, value, subLabel, iconBg, iconColor, valueColor, colSpan }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-2xs p-3 sm:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${colSpan ? "col-span-2 sm:col-span-1" : ""
        }`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5 sm:mb-2">
        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight line-clamp-1">{label}</p>
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${iconColor}`} />
        </div>
      </div>
      <p className={`text-sm sm:text-lg font-bold ${valueColor || "text-gray-900"} leading-none truncate`}>{value}</p>
      {subLabel && <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1 truncate">{subLabel}</p>}
    </div>
  );
}

function fmt(num, currency = "USD") {
  if (num === null || num === undefined || num === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function fmtStr(val) {
  if (!val) return "—";
  return val;
}

export default function ProductViewSummaryCards({ product }) {
  const currency = product?.currency || "USD";
  const profit = product?.profit ?? 0;
  const margin = product?.margin ?? 0;
  const remQty = product?.quantity ?? 0;
  const soldQty = product?.soldQuantity ?? 0;
  const origQty = product?.originalQuantity || (remQty + soldQty) || remQty;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      <KpiCard
        icon={DollarSign}
        label="Selling Price"
        value={fmt(product?.sellingPrice, currency)}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        valueColor="text-primary font-extrabold"
      />
      <KpiCard
        icon={Archive}
        label="Total Cost"
        value={fmt(product?.totalCost || product?.costPrice, currency)}
        iconBg="bg-gray-100"
        iconColor="text-gray-500"
      />
      <KpiCard
        icon={profit >= 0 ? TrendingUp : TrendingDown}
        label="Gross Profit"
        value={fmt(profit, currency)}
        subLabel={margin > 0 ? `Margin: ${margin.toFixed(1)}%` : ""}
        iconBg={profit >= 0 ? "bg-emerald-50" : "bg-rose-50"}
        iconColor={profit >= 0 ? "text-emerald-600" : "text-rose-600"}
        valueColor={profit >= 0 ? "text-emerald-600" : "text-rose-600"}
      />
      <KpiCard
        icon={Package}
        label="Original Stock"
        value={`${origQty} pcs`}
        subLabel="Initial Quantity"
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
      />
      <KpiCard
        icon={Package}
        label="Quantity Sold"
        value={`${soldQty} pcs`}
        subLabel="Total Units Sold"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        valueColor="text-amber-700 font-bold"
      />
      <KpiCard
        icon={Package}
        label="Remaining Stock"
        value={`${remQty} pcs`}
        subLabel={remQty > 5 ? "Adequate stock" : remQty > 0 ? "Low stock" : "Out of stock"}
        iconBg={remQty > 5 ? "bg-emerald-50" : remQty > 0 ? "bg-amber-50" : "bg-rose-50"}
        iconColor={remQty > 5 ? "text-emerald-600" : remQty > 0 ? "text-amber-600" : "text-rose-600"}
        valueColor={remQty > 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}
      />
    </div>
  );
}
