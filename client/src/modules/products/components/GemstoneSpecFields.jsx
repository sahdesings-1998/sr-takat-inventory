import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import FileUploader from "@/components/ui/FileUploader";
import ImageUploader from "@/components/ui/ImageUploader";
import Textarea from "@/components/ui/Textarea";
import { CERTIFICATE_LABS } from "../config/productTypeConfig";
import { Award, FileText } from "lucide-react";

export function CertificateFields({ register, errors, setValue, watch }) {
  const labOptions = CERTIFICATE_LABS.map((lab) => ({ value: lab, label: lab }));
  const certAvailable = watch("certificateAvailable") === "true" || watch("certificateAvailable") === true;

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Certificate Information</h3>
            <p className="text-xs text-gray-500">Laboratory authentication and cert documentation</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
          <label htmlFor="certificateAvailable" className="text-xs font-semibold text-gray-700 cursor-pointer">
            Certificate Included?
          </label>
          <input
            id="certificateAvailable"
            type="checkbox"
            checked={certAvailable}
            onChange={(e) => setValue("certificateAvailable", e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
        </div>
      </div>

      {certAvailable && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Laboratory / Grading Lab"
            type="laboratory"
            value={watch("laboratory") || ""}
            onChange={(val) => setValue("laboratory", typeof val === "string" ? val : val?.target?.value || "")}
            error={errors?.laboratory?.message}
          />
          <Input
            label="Certificate Number"
            placeholder="e.g. GIA-23849102"
            {...register("certificateNumber")}
            error={errors?.certificateNumber?.message}
          />
          <DatePicker
            label="Certificate Date"
            value={watch("certificateDate") || ""}
            onChange={(val) => {
              const str = typeof val === "string" ? val : val?.target?.value || "";
              setValue("certificateDate", str, { shouldValidate: true, shouldDirty: true });
            }}
            error={errors?.certificateDate?.message}
          />
          <Input
            label="Certificate Cost ($)"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("certificateCost", { valueAsNumber: true })}
            error={errors?.certificateCost?.message}
          />
          <div className="sm:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 block">
              Certificate PDF Document
            </label>
            <FileUploader
              value={watch("certificatePdf")}
              onChange={(url) => setValue("certificatePdf", url)}
              accept=".pdf"
            />
          </div>
          <div className="sm:col-span-3">
            <Textarea
              label="Certificate Notes / Details"
              rows={2}
              placeholder="Comments or special remarks on lab report..."
              {...register("certificateNotes")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function GemstoneSpecFields({ register, errors, setValue, watch }) {
  const gemstoneTypeOptions = [
    "Emerald", "Ruby", "Sapphire", "Diamond", "Tanzanite", "Alexandrite",
    "Spinel", "Tourmaline", "Aquamarine", "Garnet", "Peridot", "Opal", "Pearl", "Other"
  ].map((g) => ({ value: g, label: g }));

  const shapeOptions = [
    "Round", "Oval", "Cushion", "Emerald Cut", "Pear", "Marquise", "Princess",
    "Radiant", "Heart", "Asscher", "Cabochon", "Uncut", "Other"
  ].map((s) => ({ value: s, label: s }));

  const cutOptions = ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Cabochon", "Uncut"].map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Gemstone Specifications</h3>
            <p className="text-xs text-gray-500">Physical and optical gemological attributes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Gemstone Type"
            type="gemstoneType"
            value={watch("gemstoneType") || ""}
            onChange={(val) => setValue("gemstoneType", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Variety" placeholder="e.g. Colombian, Royal Blue" {...register("variety")} />
          <Select
            label="Country of Origin"
            type="origin"
            value={watch("origin") || ""}
            onChange={(val) => setValue("origin", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Shape"
            type="shape"
            value={watch("shape") || ""}
            onChange={(val) => setValue("shape", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Cut Grade"
            type="cut"
            value={watch("cut") || ""}
            onChange={(val) => setValue("cut", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Select
            label="Color / Shade"
            type="color"
            value={watch("colour") || ""}
            onChange={(val) => setValue("colour", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Clarity Grade" placeholder="e.g. VVS1, Eye Clean, Included" {...register("clarity")} />
          <Select
            label="Treatment / Enhancement"
            type="treatment"
            value={watch("treatment") || ""}
            onChange={(val) => setValue("treatment", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Heat Status" placeholder="e.g. Unheated, Heated" {...register("heatStatus")} />
          <Input label="Oil Level" placeholder="e.g. None, Minor, Moderate" {...register("oilLevel")} />
          <Input label="Transparency" placeholder="e.g. Transparent, Semi-Transparent" {...register("transparency")} />
          <Select
            label="Natural / Synthetic"
            options={[{ value: "Natural", label: "Natural" }, { value: "Synthetic", label: "Synthetic" }, { value: "Lab Grown", label: "Lab Grown" }]}
            value={watch("naturalSynthetic") || "Natural"}
            onChange={(e) => setValue("naturalSynthetic", e.target.value)}
          />

          <Input
            label="Total Carat Weight (ct)"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("totalCarat", { valueAsNumber: true })}
          />
          <Input
            label="Number of Pieces"
            type="number"
            placeholder="1"
            {...register("pieces", { valueAsNumber: true })}
          />
          <Input
            label="Average Carat / Piece"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("averageCarat", { valueAsNumber: true })}
          />
        </div>
      </div>

      <CertificateFields register={register} errors={errors} setValue={setValue} watch={watch} />
    </div>
  );
}
