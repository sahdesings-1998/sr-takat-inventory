import { FileText, Tag, Package, ShoppingBag, ArrowRight } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function hasValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim() !== "";
  if (typeof val === "number") return !isNaN(val);
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function Field({ label, value, fullWidth }) {
  if (!hasValue(value)) return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className={`group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 ${fullWidth ? "md:col-span-2" : ""}`}>
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary/60 transition-colors">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800 break-words leading-snug">{display}</span>
    </div>
  );
}

const STATUS_VARIANT = {
  Available: "success", "In Stock": "success", Reserved: "warning",
  Draft: "neutral", Sold: "danger", Returned: "warning", Archived: "neutral",
};

export default function TabOverview({ product }) {
  const remQty = Number(product?.quantity ?? 0);
  const soldQty = Number(product?.soldQuantity ?? 0);
  const origQty = Number(product?.originalQuantity || (remQty + soldQty) || remQty);

  return (
    <div className="space-y-5">
      {/* General Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-primary/50 text-primary">
            <FileText className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">General Information</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Product Name" value={product.name} />
            <Field label="Category" value={product.category} />
            <Field label="Sub Category" value={product.subCategory} />
            <Field label="Brand" value={product.brand} />
            <Field label="Collection" value={product.productCollection || product.collection} />
            <Field label="Model / Series" value={product.model} />
            <div className="group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 md:col-span-2 hover:border-primary/20 transition-all">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={STATUS_VARIANT[product.status] || "neutral"}>{product.status}</Badge>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stock Quantity & Sales Tracker Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-emerald-500/60 text-emerald-600">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Stock Quantity & Sales Tracker</h3>
          </div>
          <Badge variant={remQty > 0 ? "success" : "danger"}>
            {remQty > 0 ? `${remQty} Units In Stock` : "Sold Out"}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Original Stock Quantity</span>
              <span className="text-2xl font-extrabold text-sky-950 font-mono">{origQty} <span className="text-xs text-sky-700 font-normal">pcs</span></span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Quantity Sold</span>
              <span className="text-2xl font-extrabold text-amber-950 font-mono">{soldQty} <span className="text-xs text-amber-700 font-normal">pcs</span></span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Remaining Stock Quantity</span>
              <span className="text-2xl font-extrabold text-emerald-950 font-mono">{remQty} <span className="text-xs text-emerald-700 font-normal">pcs</span></span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs font-medium text-gray-700">
            <span className="font-bold text-gray-900">Remaining Stock Formula:</span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">{origQty} Orig</span>
              <span>−</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{soldQty} Sold</span>
              <span>=</span>
              <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded font-extrabold">{remQty} Remaining</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Description */}
      {(hasValue(product.description) || hasValue(product.shortDescription)) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 pl-3 border-l-[3px] border-violet-400/60 text-violet-600">
              <FileText className="h-4 w-4" />
              <h3 className="font-semibold text-gray-900 text-sm">Description</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {hasValue(product.shortDescription) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Short Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{product.shortDescription}</p>
              </div>
            )}
            {hasValue(product.description) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full Description</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tags */}
      {Array.isArray(product.tags) && product.tags.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 pl-3 border-l-[3px] border-amber-400/60 text-amber-600">
              <Tag className="h-4 w-4" />
              <h3 className="font-semibold text-gray-900 text-sm">Tags</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Internal Notes */}
      {(hasValue(product.internalNotes) || hasValue(product.customerNotes) || hasValue(product.specialInstructions)) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 pl-3 border-l-[3px] border-rose-400/60 text-rose-600">
              <FileText className="h-4 w-4" />
              <h3 className="font-semibold text-gray-900 text-sm">Notes & Instructions</h3>
            </div>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-3">
            <Field label="Internal Notes" value={product.internalNotes} fullWidth />
            <Field label="Customer Notes" value={product.customerNotes} fullWidth />
            <Field label="Special Instructions" value={product.specialInstructions} fullWidth />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
