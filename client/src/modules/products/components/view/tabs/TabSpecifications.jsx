import { Gem, Sparkles, Watch, Boxes, Settings } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";

function hasValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim() !== "";
  if (typeof val === "number") return !isNaN(val) && val !== 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function Field({ label, value }) {
  if (!hasValue(value)) return null;
  const display = typeof value === "number" ? value.toLocaleString() : String(value);
  return (
    <div className="group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800 break-words">{display}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, accentClass, children, hasData }) {
  if (!hasData) return null;
  return (
    <Card>
      <CardHeader>
        <div className={`flex items-center gap-2 pl-3 border-l-[3px] ${accentClass}`}>
          <Icon className="h-4 w-4" />
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {children}
        </div>
      </CardBody>
    </Card>
  );
}

// Jewellery categories
const JEWELLERY_CATS = ["Jewellery", "Ring", "Necklace", "Earrings", "Bracelet", "Pendant", "Custom Product"];
const GEMSTONE_CATS = ["Gemstone"];
const WATCH_CATS = ["Watch"];
const ACCESSORY_CATS = ["Accessory"];

export default function TabSpecifications({ product }) {
  const cat = product?.category;
  const isGemstone = GEMSTONE_CATS.includes(cat);
  const isJewellery = JEWELLERY_CATS.includes(cat);
  const isWatch = WATCH_CATS.includes(cat);
  const isAccessory = ACCESSORY_CATS.includes(cat);

  const gemstoneHasData =
    isGemstone && [product.gemstoneType, product.variety, product.shape, product.cut, product.colour,
    product.clarity, product.origin, product.treatment, product.transparency,
    product.totalCarat, product.averageCarat, product.costPerCarat].some(hasValue);

  const jewelleryHasData =
    isJewellery && [product.metalType, product.goldPurity, product.weight, product.dimensions,
    product.manufacturedBy, product.manufacturedDate, product.material].some(hasValue);

  const watchHasData =
    isWatch && [product.metalType, product.material, product.weight, product.dimensions,
    product.model, product.manufacturedBy, product.manufacturedDate].some(hasValue);

  const accessoryHasData =
    isAccessory && [product.material, product.weight, product.dimensions].some(hasValue);

  const physHasData = [product.weight, product.dimensions, product.material, product.countryOfOrigin].some(hasValue);

  const gemLotData =
    [product.pieces, product.totalCarat, product.averageCarat, product.costPerCarat,
    product.sellingPricePerCarat].some(hasValue);

  return (
    <div className="space-y-0">
      {/* Gemstone Specifications */}
      <SectionCard
        icon={Gem}
        title="Gemstone Properties"
        accentClass="border-sky-400/60 text-sky-600"
        hasData={gemstoneHasData}
      >
        <Field label="Gemstone Type" value={product.gemstoneType} />
        <Field label="Variety" value={product.variety} />
        <Field label="Shape" value={product.shape} />
        <Field label="Cut" value={product.cut} />
        <Field label="Colour" value={product.colour} />
        <Field label="Clarity" value={product.clarity} />
        <Field label="Origin" value={product.origin} />
        <Field label="Treatment" value={product.treatment} />
        <Field label="Heat Status" value={product.heatStatus} />
        <Field label="Oil Level" value={product.oilLevel} />
        <Field label="Transparency" value={product.transparency} />
        <Field label="Quality Grade" value={product.qualityGrade} />
        <Field label="Natural / Synthetic" value={product.naturalSynthetic} />
      </SectionCard>

      {/* Carat Data */}
      {gemLotData && (
        <SectionCard
          icon={Gem}
          title="Carat & Weight Details"
          accentClass="border-emerald-400/60 text-emerald-600"
          hasData={gemLotData}
        >
          <Field label="Total Carat" value={product.totalCarat} />
          <Field label="Average Carat" value={product.averageCarat} />
          <Field label="Pieces" value={product.pieces} />
          <Field label="Cost Per Carat" value={product.costPerCarat ? `$${Number(product.costPerCarat).toLocaleString()}` : null} />
          <Field label="Selling Price / Carat" value={product.sellingPricePerCarat ? `$${Number(product.sellingPricePerCarat).toLocaleString()}` : null} />
        </SectionCard>
      )}

      {/* Jewellery Specifications */}
      <SectionCard
        icon={Sparkles}
        title="Jewellery Specifications"
        accentClass="border-amber-400/60 text-amber-600"
        hasData={jewelleryHasData}
      >
        <Field label="Metal Type" value={product.metalType} />
        <Field label="Gold Purity" value={product.goldPurity} />
        <Field label="Gross Weight" value={product.weight} />
        <Field label="Dimensions" value={product.dimensions} />
        <Field label="Material" value={product.material} />
        <Field label="Manufactured By" value={product.manufacturedBy} />
        <Field label="Manufacturing Date" value={product.manufacturedDate?.slice(0, 10)} />
      </SectionCard>

      {/* Watch Specifications */}
      <SectionCard
        icon={Watch}
        title="Watch Specifications"
        accentClass="border-slate-400/60 text-slate-600"
        hasData={watchHasData}
      >
        <Field label="Metal Type / Case" value={product.metalType} />
        <Field label="Strap / Bracelet" value={product.material} />
        <Field label="Model / Reference" value={product.model} />
        <Field label="Weight" value={product.weight} />
        <Field label="Dimensions" value={product.dimensions} />
        <Field label="Manufactured By" value={product.manufacturedBy} />
        <Field label="Manufacturing Date" value={product.manufacturedDate?.slice(0, 10)} />
      </SectionCard>

      {/* Accessory Specifications */}
      <SectionCard
        icon={Boxes}
        title="Accessory Specifications"
        accentClass="border-purple-400/60 text-purple-600"
        hasData={accessoryHasData}
      >
        <Field label="Material" value={product.material} />
        <Field label="Weight" value={product.weight} />
        <Field label="Dimensions" value={product.dimensions} />
      </SectionCard>

      {/* Physical / General Specs (always shown if data exists) */}
      {physHasData && !isGemstone && !isJewellery && !isWatch && !isAccessory && (
        <SectionCard
          icon={Settings}
          title="Physical Specifications"
          accentClass="border-primary/50 text-primary"
          hasData={physHasData}
        >
          <Field label="Weight" value={product.weight} />
          <Field label="Dimensions" value={product.dimensions} />
          <Field label="Material" value={product.material} />
          <Field label="Country of Origin" value={product.countryOfOrigin} />
        </SectionCard>
      )}

      {/* Country of Origin (always show if present) */}
      {hasValue(product.countryOfOrigin) && (
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Country of Origin" value={product.countryOfOrigin} />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
