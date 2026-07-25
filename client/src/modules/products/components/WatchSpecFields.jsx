import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ComponentsTable from "./ComponentsTable";
import { CertificateFields } from "./GemstoneSpecFields";
import { WATCH_MOVEMENTS } from "../config/productTypeConfig";
import { Clock, Layers } from "lucide-react";

export default function WatchSpecFields({ register, errors, setValue, watch, control }) {
  const movementOptions = WATCH_MOVEMENTS.map((m) => ({ value: m, label: m }));

  return (
    <div className="space-y-6">
      {/* Watch Technical Specifications */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Watch Details & Movement</h3>
            <p className="text-xs text-gray-500">Caliber, case materials, strap, and timepiece attributes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Movement Type"
            type="watchMovement"
            value={watch("movement") || ""}
            onChange={(val) => setValue("movement", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Brand / Manufacturer"
            type="brand"
            value={watch("brand") || ""}
            onChange={(val) => setValue("brand", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Model / Reference" placeholder="e.g. Submariner 126610LN" {...register("model")} />
          <Select
            label="Case Material"
            type="material"
            value={watch("material") || ""}
            onChange={(val) => setValue("material", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Strap / Bracelet"
            type="metalType"
            value={watch("metalType") || ""}
            onChange={(val) => setValue("metalType", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Case Diameter / Dimensions" placeholder="e.g. 40mm x 12mm" {...register("dimensions")} />
        </div>
      </div>

      {/* Watch Components */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Watch Components & Spare Parts</h3>
            <p className="text-xs text-gray-500">Bezel, dial, movement parts, straps, and accessories</p>
          </div>
        </div>

        <ComponentsTable register={register} errors={errors} setValue={setValue} watch={watch} control={control} />
      </div>

      {/* Watch Certificate / Box */}
      <CertificateFields register={register} errors={errors} setValue={setValue} watch={watch} />
    </div>
  );
}
