import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";

function hasValue(val) {
  return val !== null && val !== undefined && val !== 0 && val !== "";
}

function fmt(num, currency = "USD") {
  if (!hasValue(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function PriceRow({ label, value, currency, accent, bold, separator }) {
  if (!hasValue(value) && !separator) return null;
  if (separator) {
    return <div className="border-t border-gray-100 my-1" />;
  }
  return (
    <div className={`flex items-center justify-between gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl transition-all ${bold ? "bg-primary/5 border border-primary/15" : "hover:bg-gray-50"}`}>
      <span className={`text-xs sm:text-sm ${bold ? "font-bold text-gray-900" : "text-gray-600 font-medium"}`}>
        {label}
      </span>
      <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${accent || (bold ? "text-primary" : "text-gray-800")}`}>
        {fmt(value, currency)}
      </span>
    </div>
  );
}

export default function TabPricing({ product }) {
  const currency = product?.currency || "USD";
  const profit = product?.profit ?? 0;
  const margin = product?.margin ?? 0;
  const profitPositive = profit >= 0;

  return (
    <div className="space-y-5">
      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-primary/50 text-primary">
            <DollarSign className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Cost Breakdown</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">All values in {currency}</span>
        </CardHeader>
        <CardBody className="space-y-1">
          <PriceRow label="Purchase / Acquisition Price" value={product?.purchasePrice} currency={currency} />
          <PriceRow label="Additional Cost" value={product?.additionalCost} currency={currency} />
          <PriceRow label="Manufacturing Cost" value={product?.manufacturingCost} currency={currency} />
          <PriceRow label="Certificate Cost" value={product?.certificateCost} currency={currency} />
          <PriceRow label="Shipping & Courier" value={product?.shippingCost} currency={currency} />
          <PriceRow label="Insurance" value={product?.insuranceCost} currency={currency} />
          <PriceRow label="Packaging" value={product?.packagingCost} currency={currency} />
          <PriceRow label="Other Costs" value={product?.otherCosts} currency={currency} />
          <PriceRow separator />
          <PriceRow label="Total Cost" value={product?.totalCost || product?.costPrice} currency={currency} bold />
        </CardBody>
      </Card>

      {/* Selling Prices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-emerald-400/60 text-emerald-600">
            <DollarSign className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Selling Prices</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-1">
          <PriceRow label="Selling Price" value={product?.sellingPrice} currency={currency} bold />
          <PriceRow label="Minimum Selling Price" value={product?.minimumSellingPrice} currency={currency} />
          <PriceRow label="Wholesale Price" value={product?.wholesalePrice} currency={currency} />
          <PriceRow label="Retail Price" value={product?.retailPrice} currency={currency} />
          <PriceRow label="Discount Allowed" value={null} currency={currency} />
          <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-600 font-medium">Discount Allowed</span>
            <span className={`text-sm font-bold ${product?.discountAllowed ? "text-emerald-600" : "text-gray-400"}`}>
              {product?.discountAllowed ? "Yes" : "No"}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Profit & Margin */}
      <Card>
        <CardHeader>
          <div className={`flex items-center gap-2 pl-3 border-l-[3px] ${profitPositive ? "border-emerald-400/60 text-emerald-600" : "border-rose-400/60 text-rose-600"}`}>
            {profitPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <h3 className="font-semibold text-gray-900 text-sm">Profit & Margin Analysis</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Profit card */}
            <div className={`rounded-2xl p-5 border ${profitPositive ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gross Profit</p>
              <p className={`text-3xl font-extrabold ${profitPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {fmt(profit, currency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Selling Price − Total Cost</p>
            </div>

            {/* Margin card */}
            <div className={`rounded-2xl p-5 border ${margin >= 25 ? "bg-emerald-50 border-emerald-100" : margin >= 10 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Margin %</p>
              <p className={`text-3xl font-extrabold ${margin >= 25 ? "text-emerald-600" : margin >= 10 ? "text-amber-600" : "text-gray-600"}`}>
                {margin > 0 ? `${margin.toFixed(2)}%` : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Profit as % of Selling Price</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
