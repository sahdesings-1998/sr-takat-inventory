import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import MediaUploader from "./MediaUploader";
import { Info, Sparkles, QrCode, Barcode, Tag } from "lucide-react";

const categoryOptions = [
  { value: "Gemstone", label: "Gemstone" },
  { value: "Jewellery", label: "Jewellery" },
  { value: "Watch", label: "Watch" },
  { value: "Custom Product", label: "Custom Product" },
  { value: "Accessory", label: "Accessory" },
  { value: "Ring", label: "Ring (Jewellery)" },
  { value: "Necklace", label: "Necklace (Jewellery)" },
  { value: "Earrings", label: "Earrings (Jewellery)" },
  { value: "Bracelet", label: "Bracelet (Jewellery)" },
  { value: "Pendant", label: "Pendant (Jewellery)" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "On Consignment", label: "On Consignment" },
  { value: "On Memo", label: "On Memo" },
  { value: "In Production", label: "In Production" },
  { value: "Sold", label: "Sold" },
  { value: "In Stock", label: "In Stock" },
  { value: "Archived", label: "Archived" },
];

export default function StepBasicInfo({ register, errors, setValue, watch }) {
  const stockNo = watch("stockNo") || "";
  const category = watch("category") || "Gemstone";
  const sku = watch("sku") || (stockNo ? `STK-${category.substring(0, 3).toUpperCase()}-${stockNo}` : "Auto-Generated");
  const barcode = watch("barcode") || (stockNo ? `890${stockNo.replace(/\D/g, "").padStart(9, "0")}` : "Auto-Generated");
  const qrCode = watch("qrCode") || (stockNo ? `QR-STK-${stockNo}` : "Auto-Generated");
  const imageUrls = watch("imageUrls") || [];

  return (
    <div className="space-y-6">
      {/* Basic Product Info Card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Basic Product Information</h3>
            <p className="text-xs text-gray-500">Core identification details and inventory status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Stock Number (Stock No) *"
            placeholder="e.g. STK-10045"
            {...register("stockNo")}
            error={errors?.stockNo?.message}
          />

          <Select
            label="Product Category *"
            options={categoryOptions}
            value={watch("category") || "Jewellery"}
            onChange={(e) => setValue("category", e.target.value, { shouldValidate: true })}
            error={errors?.category?.message}
          />

          <Input
            label="Product Name / Title *"
            placeholder="e.g. 18K White Gold Emerald Cut Diamond Ring"
            {...register("name")}
            error={errors?.name?.message}
          />

          <Input
            label="Sub-Category"
            placeholder="e.g. Engagement Ring, Solitaire"
            {...register("subCategory")}
          />

          <Input
            label="Brand / Manufacturer"
            placeholder="e.g. SR Takat Atelier"
            {...register("brand")}
          />

          <Input
            label="Model / Reference No"
            placeholder="e.g. MOD-2026-X"
            {...register("model")}
          />

          <Input
            label="Collection Name"
            placeholder="e.g. Royal Heritage 2026"
            {...register("collection")}
          />

          <Select
            label="Initial Status *"
            options={statusOptions}
            value={watch("status") || "Available"}
            onChange={(e) => setValue("status", e.target.value)}
            error={errors?.status?.message}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <Textarea
            label="Short Summary Description"
            rows={2}
            placeholder="Brief overview for catalogue cards..."
            {...register("shortDescription")}
          />

          <Textarea
            label="Full Detailed Description"
            rows={4}
            placeholder="Detailed narrative description, craftsmanship details, or story..."
            {...register("description")}
          />
        </div>
      </div>

      {/* Auto-Generated Fields Card (Read-only) */}
      <div className="rounded-2xl border border-gray-200/80 bg-gray-50/60 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Auto-Generated Tracking Identifiers</h4>
            <p className="text-xs text-gray-500">System generated tracking barcodes & SKUs (Read-Only)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3.5 flex items-center gap-3">
            <Tag className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Generated SKU</span>
              <span className="text-xs font-mono font-bold text-gray-900 truncate block">{sku}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3.5 flex items-center gap-3">
            <Barcode className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Generated Barcode</span>
              <span className="text-xs font-mono font-bold text-gray-900 truncate block">{barcode}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3.5 flex items-center gap-3">
            <QrCode className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Generated QR Code</span>
              <span className="text-xs font-mono font-bold text-gray-900 truncate block">{qrCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media & Images Upload */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <MediaUploader
          value={imageUrls}
          onChange={(urls) => setValue("imageUrls", urls, { shouldValidate: true, shouldDirty: true })}
          label="Product Photography & Gallery"
          maxFiles={10}
        />
      </div>
    </div>
  );
}
