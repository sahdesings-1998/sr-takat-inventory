import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import ComponentsTable from "./ComponentsTable";
import GemstoneSpecFields, { CertificateFields } from "./GemstoneSpecFields";
import { METAL_TYPES, GOLD_PURITIES } from "../config/productTypeConfig";
import { Sparkles, Layers } from "lucide-react";

export default function JewellerySpecFields({ register, errors, setValue, watch, control }) {
  const metalOptions = METAL_TYPES.map((m) => ({ value: m, label: m }));
  const purityOptions = GOLD_PURITIES.map((p) => ({ value: p, label: p }));

  return (
    <div className="space-y-6">
      {/* Metal Specifications */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Metal & Fabrication Specs</h3>
            <p className="text-xs text-gray-500">Gold purity, metal type, weight, and manufacturing information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Metal Type"
            type="metalType"
            value={watch("metalType") || ""}
            onChange={(val) => setValue("metalType", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Gold Purity"
            type="goldPurity"
            value={watch("goldPurity") || ""}
            onChange={(val) => setValue("goldPurity", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Gross Weight (g)" placeholder="e.g. 12.45 g" {...register("weight")} />
          <Input label="Dimensions (mm)" placeholder="e.g. 18mm x 12mm x 4mm" {...register("dimensions")} />
          <Input label="Manufacturer / Craftsman" placeholder="e.g. Master Atelier" {...register("manufacturedBy")} />
          <DatePicker
            label="Manufacturing Date"
            value={watch("manufacturedDate") || ""}
            onChange={(val) => {
              const str = typeof val === "string" ? val : val?.target?.value || "";
              setValue("manufacturedDate", str, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </div>
      </div>

      {/* Components Table (BOM) */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Bill of Materials / Components</h3>
            <p className="text-xs text-gray-500">Stones, metals, and mountings used to craft this piece</p>
          </div>
        </div>

        <ComponentsTable register={register} errors={errors} setValue={setValue} watch={watch} control={control} />
      </div>

      {/* Embedded Center Gemstone Specs */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
          <h3 className="text-base font-bold text-gray-900">Center Stone / Embedded Gemstone Specs</h3>
          <span className="text-xs font-semibold text-gray-400">Optional</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Gemstone Type"
            type="gemstoneType"
            value={watch("gemstoneType") || ""}
            onChange={(val) => setValue("gemstoneType", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Carat Weight (ct)" type="number" step="any" placeholder="0.00" {...register("totalCarat", { valueAsNumber: true })} />
          <Select
            label="Color / Shade"
            type="color"
            value={watch("colour") || ""}
            onChange={(val) => setValue("colour", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Shape & Cut"
            type="shape"
            value={watch("shape") || ""}
            onChange={(val) => setValue("shape", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Origin"
            type="origin"
            value={watch("origin") || ""}
            onChange={(val) => setValue("origin", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Treatment"
            type="treatment"
            value={watch("treatment") || ""}
            onChange={(val) => setValue("treatment", typeof val === "string" ? val : val?.target?.value || "")}
          />
        </div>
      </div>

      {/* Certificate */}
      <CertificateFields register={register} errors={errors} setValue={setValue} watch={watch} />
    </div>
  );
}
