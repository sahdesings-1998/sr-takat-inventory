import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Copy,
  Trash2,
  Archive,
  Package,
  Hash,
  Tag,
  Layers,
  ShieldCheck,
  Calendar,
  Clock,
  Gem,
  Watch,
  Sparkles,
  Boxes,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Map category → icon
const CATEGORY_ICON = {
  Gemstone: Gem,
  Jewellery: Sparkles,
  Watch: Watch,
  "Custom Product": Layers,
  Accessory: Boxes,
  Ring: Sparkles,
  Necklace: Sparkles,
  Earrings: Sparkles,
  Bracelet: Sparkles,
  Pendant: Sparkles,
  Other: Package,
};

const STATUS_VARIANT = {
  Available: "success",
  "In Stock": "success",
  Reserved: "warning",
  "On Consignment": "warning",
  "On Memo": "info",
  "In Production": "info",
  Draft: "neutral",
  Sold: "danger",
  Returned: "warning",
  Archived: "neutral",
  Missing: "danger",
  Damaged: "danger",
};

function InfoChip({ icon: Icon, value, label }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-lg px-2.5 py-1 border border-gray-200">
      {Icon && <Icon className="h-3 w-3 text-gray-400 shrink-0" />}
      <span className="text-gray-400 font-medium">{label}:</span>
      <span className="text-gray-700 truncate max-w-[140px] sm:max-w-[200px]">{value}</span>
    </span>
  );
}

export default function ProductViewHeader({ product, onDelete, onArchive }) {
  const navigate = useNavigate();
  const CategoryIcon = CATEGORY_ICON[product?.category] || Package;
  const statusVariant = STATUS_VARIANT[product?.status] || "neutral";
  const hasCert = product?.certificateAvailable === true || product?.certificateAvailable === "true";
  const primaryImage = product?.imageUrls?.[0];

  const createdAt = product?.createdAt
    ? new Date(product.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;
  const updatedAt = product?.updatedAt
    ? new Date(product.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top gradient accent stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-accent/60" />

      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">

          {/* Left: Image + Identity */}
          <div className="flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0">
            {/* Product Image / Icon */}
            <div className="flex-shrink-0">
              {primaryImage ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
                  <img
                    src={primaryImage}
                    alt={product?.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <CategoryIcon className="h-9 w-9 text-primary/60" />
                </div>
              )}
            </div>

            {/* Text identity block */}
            <div className="flex-1 min-w-0">
              {/* Back link */}
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors mb-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Products
              </Link>

              {/* Name + status row */}
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight break-words">
                  {product?.name || "Unnamed Product"}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <Badge variant={statusVariant}>{product?.status}</Badge>
                  {product?.category && (
                    <Badge variant="primary">{product.category}</Badge>
                  )}
                  {product?.subCategory && (
                    <Badge variant="neutral">{product.subCategory}</Badge>
                  )}
                  {hasCert && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      <ShieldCheck className="h-3 w-3" /> Certified
                    </span>
                  )}
                </div>
              </div>

              {/* ID chips */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {product?.productCode && <InfoChip icon={Hash} label="Code" value={product.productCode} />}
                {product?.stockNo && <InfoChip icon={Layers} label="Stock" value={product.stockNo} />}
                {product?.sku && <InfoChip icon={Tag} label="SKU" value={product.sku} />}
                {product?.barcode && <InfoChip icon={Hash} label="Barcode" value={product.barcode} />}
                {product?.brand && <InfoChip icon={Sparkles} label="Brand" value={product.brand} />}
                {product?.productCollection && (
                  <InfoChip icon={Boxes} label="Collection" value={product.productCollection} />
                )}
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                {createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {createdAt}
                  </span>
                )}
                {updatedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {updatedAt}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:flex-col lg:items-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/products/edit/${product?._id}`)}
              icon={<Edit3 className="h-3.5 w-3.5" />}
              className="flex-1 lg:flex-none justify-center"
            >
              Edit Product
            </Button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto lg:flex-col">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/products/add`, { state: { duplicateFrom: product } })}
                icon={<Copy className="h-3.5 w-3.5" />}
                className="flex-1 lg:flex-none justify-center"
              >
                Duplicate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onArchive}
                icon={<Archive className="h-3.5 w-3.5" />}
                className="text-amber-600 border-amber-200 hover:bg-amber-50 flex-1 lg:flex-none justify-center"
              >
                Archive
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                className="text-danger border-danger/20 hover:bg-danger/5 flex-1 lg:flex-none justify-center"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
