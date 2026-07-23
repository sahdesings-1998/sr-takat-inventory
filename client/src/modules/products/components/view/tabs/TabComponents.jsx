import { useState } from "react";
import { Plus, Trash2, Layers, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { componentSchema } from "../../../validation/productSchema";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import TableActionButton from "@/components/ui/TableActionButton";
import Badge from "@/components/ui/Badge";

function EmptyComponents() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
        <Layers className="h-8 w-8 text-gray-300" />
      </div>
      <p className="font-semibold text-gray-500">No Components Added</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Add gemstones, materials, or other inventory items to define the Bill of Materials for this product.
      </p>
    </div>
  );
}

export default function TabComponents({ product, components, addComponent, deleteComponent, gemstones, lots, materials }) {
  const [compOpen, setCompOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(componentSchema),
    defaultValues: { sourceType: "Gemstone", sourceId: "", quantity: 1, weight: 0, remarks: "" },
  });
  const selectedType = watch("sourceType");

  let itemOptions = [];
  if (selectedType === "Gemstone") {
    itemOptions = (gemstones || [])
      .filter((g) => g.status === "In Stock")
      .map((g) => ({ value: g._id, label: `${g.stoneId} - ${g.gemstone} (${g.carat} ct)` }));
  } else if (selectedType === "GemstoneLot") {
    itemOptions = (lots || [])
      .filter((l) => l.status === "Active" || l.status === "In Stock")
      .map((l) => ({ value: l._id, label: `${l.lotId} - ${l.gemstone} (${l.remainingCarat} ct remaining)` }));
  } else if (selectedType === "Material") {
    itemOptions = (materials || [])
      .filter((m) => m.status === "active")
      .map((m) => ({ value: m._id, label: `${m.materialCode} - ${m.materialName} (${m.quantity} ${m.unit})` }));
  }

  const onAddComp = async (data) => {
    try {
      await addComponent(data);
      setCompOpen(false);
      reset();
    } catch (err) {
      console.error("Add component failed:", err);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteComponent(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const totalComponentCost = (components || []).reduce((sum, c) => {
    const unitCost = c.unitCost || 0;
    return sum + unitCost * (c.quantity || 1);
  }, 0);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-amber-400/60 text-amber-600">
            <Layers className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Bill of Materials (BOM)</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { reset(); setCompOpen(true); }}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Component
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {!components || components.length === 0 ? (
            <EmptyComponents />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  headers={["Type", "Component / Source", "Quantity", "Weight", "Remarks", "Actions"]}
                  data={components}
                  emptyMessage="No components added."
                  renderRow={(comp) => (
                    <tr key={comp._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant={comp.sourceType === "Gemstone" ? "info" : comp.sourceType === "GemstoneLot" ? "primary" : "neutral"}>
                          {comp.sourceType}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {comp.sourceId
                          ? comp.sourceType === "Material"
                            ? `${comp.sourceId.materialCode} — ${comp.sourceId.materialName}`
                            : comp.sourceType === "Gemstone"
                              ? `${comp.sourceId.stoneId} — ${comp.sourceId.gemstone}`
                              : `${comp.sourceId.lotId} — ${comp.sourceId.gemstone}`
                          : <span className="text-gray-400 italic">Linked item deleted</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{comp.quantity}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {comp.weight > 0 ? `${comp.weight} ct` : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{comp.remarks || "—"}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TableActionButton
                          icon={Trash2}
                          title="Remove Component"
                          variant="danger"
                          onClick={() => setDeleteConfirm({ open: true, id: comp._id, isLoading: false })}
                        />
                      </td>
                    </tr>
                  )}
                />
              </div>
              {/* Total row */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  {components.length} component{components.length !== 1 ? "s" : ""}
                </span>
                {totalComponentCost > 0 && (
                  <span className="text-sm font-bold text-primary">
                    Total: ${totalComponentCost.toLocaleString()}
                  </span>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Add Component Modal */}
      <Modal isOpen={compOpen} onClose={() => setCompOpen(false)} title="Add Component to BOM">
        <form onSubmit={handleSubmit(onAddComp)} className="flex flex-col gap-4" noValidate>
          <Select
            label="Component Type *"
            error={errors.sourceType?.message}
            options={[
              { value: "Gemstone", label: "Gemstone (Individual)" },
              { value: "GemstoneLot", label: "Gemstone Lot (Aggregate)" },
              { value: "Material", label: "Raw Material (Metal / Settings)" },
            ]}
            {...register("sourceType")}
          />
          <Select
            label="Select Inventory Item *"
            error={errors.sourceId?.message}
            options={itemOptions}
            {...register("sourceId")}
          />
          <Input label="Quantity *" type="number" error={errors.quantity?.message} {...register("quantity")} />
          <Input label="Weight (Carats, if gemstone)" type="number" step="0.001" error={errors.weight?.message} {...register("weight")} />
          <Input label="Remarks" error={errors.remarks?.message} {...register("remarks")} />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" type="button" onClick={() => setCompOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Add Component</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Remove Component"
        message="This component will be removed from the BOM. The source inventory item will not be affected."
        confirmLabel="Remove"
        isLoading={deleteConfirm.isLoading}
        variant="warning"
      />
    </div>
  );
}
