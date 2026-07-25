import { useMemo } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import { Warehouse, Truck, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";

const paymentStatusOptions = [
  { value: "Paid", label: "Paid" },
  { value: "Partial", label: "Partial" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "On Credit", label: "On Credit" },
];

export default function StepInventorySupplier({ register, errors, setValue, watch }) {
  const quantity = Number(watch("quantity") || 0);
  const minStock = Number(watch("minimumStock") || 0);
  const reorderLevel = Number(watch("reorderLevel") || 0);
  const maxStock = Number(watch("maximumStock") || 0);

  // Fetch list of suppliers for dropdown selection
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-dropdown-list"],
    queryFn: async () => {
      const res = await apiClient.get("/suppliers");
      return res.data?.data || [];
    },
  });

  const supplierOptions = useMemo(() => {
    if (!suppliersData) return [];
    return suppliersData.map((s) => ({
      value: s.name || s.companyName,
      label: `${s.name || s.companyName} (${s.supplierCode || "Supplier"})`,
    }));
  }, [suppliersData]);

  // Stock status calculation
  const stockBadge = useMemo(() => {
    if (quantity <= 0) return { label: "Out of Stock", variant: "danger", icon: ShieldAlert };
    if (reorderLevel > 0 && quantity <= reorderLevel) return { label: "Reorder Level Reached", variant: "warning", icon: AlertTriangle };
    if (minStock > 0 && quantity <= minStock) return { label: "Low Stock Alert", variant: "warning", icon: AlertTriangle };
    if (maxStock > 0 && quantity > maxStock) return { label: "Overstocked", variant: "info", icon: CheckCircle2 };
    return { label: "In Stock & Available", variant: "success", icon: CheckCircle2 };
  }, [quantity, minStock, reorderLevel, maxStock]);

  const StatusIcon = stockBadge.icon;

  return (
    <div className="space-y-6">
      {/* Warehouse Management Card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Warehouse & Physical Inventory</h3>
              <p className="text-xs text-gray-500">Storage locations, shelf details, stock count, and reorder points</p>
            </div>
          </div>

          <Badge variant={stockBadge.variant} className="flex items-center gap-1 px-3 py-1 text-xs self-start sm:self-auto shrink-0">
            <StatusIcon className="h-3.5 w-3.5" />
            {stockBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Primary Warehouse / Vault *"
            type="location"
            value={watch("warehouse") || ""}
            onChange={(val) => setValue("warehouse", typeof val === "string" ? val : val?.target?.value || "", { shouldValidate: true })}
            error={errors?.warehouse?.message}
          />
          <Select
            label="Specific Location / Cabinet"
            type="location"
            value={watch("location") || ""}
            onChange={(val) => setValue("location", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Shelf / Bin ID" placeholder="e.g. Shelf B4" {...register("shelf")} />

          <Input
            label="Current Stock Quantity *"
            type="number"
            placeholder="1"
            {...register("quantity", { valueAsNumber: true })}
            error={errors?.quantity?.message}
          />
          <Input
            label="Minimum Stock Threshold"
            type="number"
            placeholder="1"
            {...register("minimumStock", { valueAsNumber: true })}
          />
          <Input
            label="Reorder Alert Level"
            type="number"
            placeholder="2"
            {...register("reorderLevel", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Supplier Card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Supplier & Acquisition Info</h3>
            <p className="text-xs text-gray-500">Vendor source, invoice record, purchase date, and outstanding balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Supplier Vendor"
            type="supplier"
            options={supplierOptions}
            value={watch("supplier") || ""}
            onChange={(val) => setValue("supplier", typeof val === "string" ? val : val?.target?.value || "")}
          />
          <Input label="Supplier Reference / Lot No" placeholder="e.g. SUP-INV-8910" {...register("supplierReference")} />
          <DatePicker
            label="Purchase Date"
            value={watch("purchaseDate") || ""}
            onChange={(val) => {
              const str = typeof val === "string" ? val : val?.target?.value || "";
              setValue("purchaseDate", str, { shouldValidate: true, shouldDirty: true });
            }}
          />

          <Input label="Purchase Invoice #" placeholder="e.g. INV-2026-904" {...register("purchaseInvoice")} />
          <Select
            label="Payment Status"
            options={paymentStatusOptions}
            value={watch("paymentStatus") || "Paid"}
            onChange={(e) => setValue("paymentStatus", e.target.value)}
          />
          <Input
            label="Outstanding Balance ($)"
            type="number"
            step="any"
            placeholder="0.00"
            {...register("outstandingAmount", { valueAsNumber: true })}
          />

          <div className="sm:col-span-3">
            <Textarea label="Supplier Notes & Instructions" rows={2} placeholder="Terms, warranty conditions, or vendor remarks..." {...register("supplierNotes")} />
          </div>
        </div>
      </div>
    </div>
  );
}
