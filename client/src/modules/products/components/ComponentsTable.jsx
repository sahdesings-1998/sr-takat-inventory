import { useState, useMemo } from "react";
import { Plus, Trash2, Search, Gem, Package, Layers } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";

export default function ComponentsTable({ register, errors, setValue, watch }) {
  const components = watch("components") || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Fetch available gemstones, lots, materials for component selection
  const { data: gemstonesData } = useQuery({
    queryKey: ["inventory-gemstones-picker"],
    queryFn: async () => {
      const res = await apiClient.get("/gemstones");
      return res.data?.data || [];
    },
  });

  const { data: materialsData } = useQuery({
    queryKey: ["inventory-materials-picker"],
    queryFn: async () => {
      const res = await apiClient.get("/materials");
      return res.data?.data || [];
    },
  });

  const inventoryOptions = useMemo(() => {
    const list = [];
    if (gemstonesData) {
      gemstonesData.forEach((stone) => {
        list.push({
          id: stone._id,
          name: `${stone.stoneId || stone.gemstoneType} - ${stone.weight}ct (${stone.gemstoneType})`,
          category: "Gemstone",
          cost: stone.totalCost || stone.costPrice || 0,
        });
      });
    }
    if (materialsData) {
      materialsData.forEach((mat) => {
        list.push({
          id: mat._id,
          name: `${mat.name || mat.materialCode} (${mat.category || "Material"})`,
          category: "Material",
          cost: mat.unitCost || mat.costPerGram || 0,
        });
      });
    }
    return list;
  }, [gemstonesData, materialsData]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventoryOptions;
    const q = searchQuery.toLowerCase();
    return inventoryOptions.filter((item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
  }, [inventoryOptions, searchQuery]);

  const handleAddComponentRow = () => {
    const newComponents = [...components, { name: "", quantity: 1, unitCost: 0, totalCost: 0 }];
    setValue("components", newComponents, { shouldValidate: true, shouldDirty: true });
  };

  const handleRemoveComponentRow = (index) => {
    const updated = components.filter((_, i) => i !== index);
    setValue("components", updated, { shouldValidate: true, shouldDirty: true });
    updateOverallCost(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...components];
    const item = { ...updated[index], [field]: value };
    const qty = Number(field === "quantity" ? value : item.quantity || 0);
    const cost = Number(field === "unitCost" ? value : item.unitCost || 0);
    item.totalCost = qty * cost;
    updated[index] = item;
    setValue("components", updated, { shouldValidate: true, shouldDirty: true });
    updateOverallCost(updated);
  };

  const handleSelectInventoryItem = (item) => {
    if (activeRowIndex === null) return;
    const updated = [...components];
    updated[activeRowIndex] = {
      ...updated[activeRowIndex],
      name: item.name,
      unitCost: item.cost,
      totalCost: (updated[activeRowIndex]?.quantity || 1) * item.cost,
    };
    setValue("components", updated, { shouldValidate: true, shouldDirty: true });
    updateOverallCost(updated);
    setShowSearchModal(false);
    setActiveRowIndex(null);
  };

  const updateOverallCost = (componentList) => {
    const sum = componentList.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);
    // Optionally update additionalCost or totalCostSummary
    setValue("additionalCost", sum, { shouldValidate: true, shouldDirty: true });
  };

  const grandTotal = useMemo(() => {
    return components.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);
  }, [components]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 min-w-[220px]">Component Name / Item</th>
              <th className="py-3 px-4 w-28 text-center">Qty</th>
              <th className="py-3 px-4 w-36 text-right">Unit Cost ($)</th>
              <th className="py-3 px-4 w-36 text-right">Total ($)</th>
              <th className="py-3 px-4 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {components.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium text-gray-500">No components added yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click below to add gemstones, gold, or parts to this item</p>
                </td>
              </tr>
            ) : (
              components.map((comp, idx) => {
                const rowTotal = (Number(comp.quantity || 0) * Number(comp.unitCost || 0)).toFixed(2);
                return (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={comp.name || ""}
                          onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                          placeholder="e.g. 0.50ct Diamond, 18K Gold Setting"
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          title="Search Inventory"
                          onClick={() => {
                            setActiveRowIndex(idx);
                            setShowSearchModal(true);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors"
                        >
                          <Search className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="1"
                        value={comp.quantity ?? 1}
                        onChange={(e) => handleFieldChange(idx, "quantity", e.target.value)}
                        className="w-full text-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-primary"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        step="any"
                        value={comp.unitCost ?? 0}
                        onChange={(e) => handleFieldChange(idx, "unitCost", e.target.value)}
                        className="w-full text-right rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-primary"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                      ${rowTotal}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponentRow(idx)}
                        className="p-1.5 text-gray-400 hover:text-danger rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {components.length > 0 && (
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200 text-gray-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right">Total Components Cost:</td>
                <td className="py-3 px-4 text-right text-primary text-base">${grandTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddComponentRow}
          icon={<Plus className="h-4 w-4" />}
        >
          Add Component Row
        </Button>
        <p className="text-xs text-gray-400">Total cost automatically syncs into Product Additional Cost</p>
      </div>

      {/* Inventory Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Select Inventory Component</h3>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search gemstones or raw materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredInventory.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-400">No matching items found in inventory.</p>
              ) : (
                filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectInventoryItem(item)}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {item.category === "Gemstone" ? <Gem className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{item.name}</p>
                        <p className="text-[11px] text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">${item.cost.toFixed(2)}</p>
                      <span className="text-[10px] text-gray-400">Unit cost</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
