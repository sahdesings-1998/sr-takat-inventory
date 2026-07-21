import { Warehouse, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function Field({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "number" ? value.toLocaleString() : String(value);
  return (
    <div className="group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800">{display}</span>
    </div>
  );
}

function StockLevelBadge({ qty, min, reorder }) {
  if (qty === 0 || qty === undefined) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-100">
        <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-rose-700">Out of Stock</p>
          <p className="text-xs text-rose-500">Quantity is zero</p>
        </div>
      </div>
    );
  }
  if (reorder && qty <= reorder) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-100">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-700">Low Stock — Reorder Required</p>
          <p className="text-xs text-amber-500">{qty} pcs remaining (reorder level: {reorder})</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
      <div>
        <p className="text-sm font-bold text-emerald-700">In Stock</p>
        <p className="text-xs text-emerald-500">{qty} pcs available</p>
      </div>
    </div>
  );
}

export default function TabInventory({ product }) {
  return (
    <div className="space-y-5">
      {/* Stock Status Banner */}
      <StockLevelBadge
        qty={product?.quantity}
        min={product?.minimumStock}
        reorder={product?.reorderLevel}
      />

      {/* Location */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-sky-400/60 text-sky-600">
            <Warehouse className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Storage Location</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Primary Warehouse" value={product?.warehouse} />
            <Field label="Location / Safe" value={product?.location} />
            <Field label="Shelf / Bin ID" value={product?.shelf} />
          </div>
        </CardBody>
      </Card>

      {/* Stock Quantities */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-emerald-400/60 text-emerald-600">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Stock Quantities</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {[
              { label: "Current Quantity", value: product?.quantity, color: "text-primary" },
              { label: "Available Qty", value: product?.availableQuantity, color: "text-emerald-600" },
              { label: "Reserved Qty", value: product?.reservedQuantity, color: "text-amber-600" },
              { label: "Minimum Stock", value: product?.minimumStock, color: "text-gray-700" },
              { label: "Maximum Stock", value: product?.maximumStock, color: "text-gray-700" },
              { label: "Reorder Level", value: product?.reorderLevel, color: "text-rose-600" },
            ].map(({ label, value, color }) =>
              value !== null && value !== undefined ? (
                <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 sm:p-4 text-center hover:shadow-sm transition-all">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 line-clamp-1">{label}</p>
                  <p className={`text-xl sm:text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">pcs</p>
                </div>
              ) : null
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
