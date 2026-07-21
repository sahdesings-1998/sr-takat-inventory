import { Edit2, CheckCircle, Info, DollarSign, Warehouse, Award, Layers, Image as ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function StepReviewPublish({ watch, onJumpToStep }) {
  const stockNo = watch("stockNo");
  const name = watch("name");
  const category = watch("category");
  const status = watch("status");
  const brand = watch("brand");
  const model = watch("model");

  const purchasePrice = Number(watch("purchasePrice") || 0);
  const additionalCost = Number(watch("additionalCost") || 0);
  const totalCost = Number(watch("totalCost") || 0);
  const sellingPrice = Number(watch("sellingPrice") || 0);
  const profit = Number(watch("profit") || 0);
  const margin = Number(watch("margin") || 0);

  const warehouse = watch("warehouse");
  const quantity = watch("quantity");
  const supplier = watch("supplier");
  const imageUrls = watch("imageUrls") || [];
  const components = watch("components") || [];

  return (
    <div className="space-y-6">
      {/* Executive Summary Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-[#0D3545] p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                {category || "Product"}
              </span>
              <span className="text-xs text-white/80 font-mono font-bold">#{stockNo || "NO-STOCK"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{name || "Untitled Product"}</h2>
            <p className="text-xs text-white/70 mt-1">Ready for catalog publication and inventory tracking</p>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/20 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <span className="text-[11px] font-semibold text-white/70 block uppercase">Selling Price</span>
              <span className="text-2xl font-bold text-amber-300 font-mono">${sellingPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-white/70 block uppercase">Margin %</span>
              <span className={`text-base font-bold px-2.5 py-1 rounded-lg ${margin >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Basic Info Review Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Info className="h-4 w-4" />
              <span>Basic Information</span>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onJumpToStep(1)} icon={<Edit2 className="h-3.5 w-3.5" />}>
              Edit Step 1
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-gray-400 font-medium">Stock Number</dt>
              <dd className="font-bold text-gray-900 font-mono mt-0.5">{stockNo || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Category</dt>
              <dd className="font-bold text-gray-900 mt-0.5">{category || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Status</dt>
              <dd className="mt-0.5">
                <Badge variant="success" className="text-[10px]">{status || "Draft"}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Brand / Model</dt>
              <dd className="font-semibold text-gray-900 mt-0.5">{brand || model ? `${brand || ""} ${model || ""}` : "—"}</dd>
            </div>
          </dl>
        </div>

        {/* 2. Pricing Review Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Pricing & Profitability</span>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onJumpToStep(3)} icon={<Edit2 className="h-3.5 w-3.5" />}>
              Edit Step 3
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-gray-400 font-medium">Purchase Price</dt>
              <dd className="font-semibold text-gray-900 mt-0.5">${purchasePrice.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Total Cost Price</dt>
              <dd className="font-bold text-gray-900 font-mono mt-0.5">${totalCost.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Selling Price</dt>
              <dd className="font-bold text-primary font-mono mt-0.5">${sellingPrice.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Calculated Profit</dt>
              <dd className={`font-bold mt-0.5 ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                ${profit.toFixed(2)} ({margin.toFixed(1)}%)
              </dd>
            </div>
          </dl>
        </div>

        {/* 3. Inventory & Supplier Review Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Warehouse className="h-4 w-4" />
              <span>Inventory & Supplier</span>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onJumpToStep(4)} icon={<Edit2 className="h-3.5 w-3.5" />}>
              Edit Step 4
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-gray-400 font-medium">Warehouse</dt>
              <dd className="font-semibold text-gray-900 mt-0.5">{warehouse || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-medium">Initial Quantity</dt>
              <dd className="font-bold text-gray-900 mt-0.5">{quantity} Units</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-400 font-medium">Supplier Vendor</dt>
              <dd className="font-semibold text-gray-900 mt-0.5">{supplier || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* 4. Media & Attachments Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <ImageIcon className="h-4 w-4" />
              <span>Media & Components</span>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onJumpToStep(1)} icon={<Edit2 className="h-3.5 w-3.5" />}>
              Edit Media
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Gallery Images:</span>
              <span className="font-bold text-gray-900">{imageUrls.length} Files</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">BOM Components:</span>
              <span className="font-bold text-gray-900">{components.length} Items</span>
            </div>

            {imageUrls.length > 0 && (
              <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                {imageUrls.slice(0, 5).map((url, i) => (
                  <img key={i} src={url} alt={`Thumb ${i}`} className="h-12 w-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
