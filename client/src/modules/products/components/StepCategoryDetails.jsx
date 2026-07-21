import { useMemo } from "react";
import { getEngineCategory, CATEGORY_TYPES, PRODUCT_TYPE_CONFIG } from "../config/productTypeConfig";
import GemstoneSpecFields from "./GemstoneSpecFields";
import JewellerySpecFields from "./JewellerySpecFields";
import WatchSpecFields from "./WatchSpecFields";
import AccessorySpecFields from "./AccessorySpecFields";
import { SlidersHorizontal } from "lucide-react";

export default function StepCategoryDetails({ register, errors, setValue, watch, control }) {
  const category = watch("category") || "Jewellery";
  const engineCategory = useMemo(() => getEngineCategory(category), [category]);
  const config = PRODUCT_TYPE_CONFIG[engineCategory] || PRODUCT_TYPE_CONFIG[CATEGORY_TYPES.CUSTOM];

  return (
    <div className="space-y-6">
      {/* Dynamic Header Badge */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">{config.label} Specification Engine</h3>
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {category}
              </span>
            </div>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Render matching specification fields dynamically */}
      {engineCategory === CATEGORY_TYPES.GEMSTONE && (
        <GemstoneSpecFields register={register} errors={errors} setValue={setValue} watch={watch} />
      )}

      {engineCategory === CATEGORY_TYPES.JEWELLERY && (
        <JewellerySpecFields register={register} errors={errors} setValue={setValue} watch={watch} control={control} />
      )}

      {engineCategory === CATEGORY_TYPES.WATCH && (
        <WatchSpecFields register={register} errors={errors} setValue={setValue} watch={watch} control={control} />
      )}

      {engineCategory === CATEGORY_TYPES.ACCESSORY && (
        <AccessorySpecFields register={register} errors={errors} />
      )}

      {engineCategory === CATEGORY_TYPES.CUSTOM && (
        <JewellerySpecFields register={register} errors={errors} setValue={setValue} watch={watch} control={control} />
      )}
    </div>
  );
}
