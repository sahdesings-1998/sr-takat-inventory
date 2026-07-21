import Input from "@/components/ui/Input";
import { Package } from "lucide-react";

export default function AccessorySpecFields({ register, errors }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Accessory Material & Dimensions</h3>
          <p className="text-xs text-gray-500">Physical dimensions, material composition, and packaging specs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Material Composition" placeholder="e.g. Velvet, Italian Leather, Acrylic" {...register("material")} />
        <Input label="Weight (g or kg)" placeholder="e.g. 350g" {...register("weight")} />
        <Input label="Dimensions (L x W x H)" placeholder="e.g. 20cm x 15cm x 10cm" {...register("dimensions")} />
        <Input label="Country of Origin" placeholder="e.g. Italy, Japan" {...register("countryOfOrigin")} />
      </div>
    </div>
  );
}
