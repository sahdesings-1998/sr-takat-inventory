import { useState, useMemo } from "react";
import { useLookups, useCreateLookup, useUpdateLookup, useDeleteLookup } from "@/hooks/useLookups";
import { useToast } from "@/contexts/ToastContext";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import TableActionButton from "@/components/ui/TableActionButton";
import SearchInput from "@/components/ui/SearchInput";
import { Plus, Edit2, Trash2, Database, Sparkles, Check, Tag } from "lucide-react";

const LOOKUP_CATEGORIES = [
  { type: "category", label: "Product Categories", description: "Gemstone, Jewellery, Watch, Accessories..." },
  { type: "brand", label: "Brands & Manufacturers", description: "Rolex, Cartier, Atelier, Patek Philippe..." },
  { type: "location", label: "Storage & Vault Locations", description: "Main Vault, Showroom Display, Workshop..." },
  { type: "material", label: "Material Categories & Types", description: "Gold, Silver, Platinum, Packaging..." },
  { type: "color", label: "Color & Shade Grades", description: "D-F Colorless, Pigeon Blood, Royal Blue..." },
  { type: "metalType", label: "Metal & Fabrication Types", description: "Yellow Gold, White Gold, Platinum 950..." },
  { type: "goldPurity", label: "Metal & Gold Purities", description: "24K (999), 18K (750), Sterling Silver..." },
  { type: "gemstoneType", label: "Gemstone Types & Species", description: "Emerald, Ruby, Sapphire, Diamond..." },
  { type: "shape", label: "Gemstone Shapes", description: "Round, Oval, Cushion, Emerald Cut..." },
  { type: "cut", label: "Gemstone Cut Grades", description: "Ideal, Excellent, Very Good, Fair..." },
  { type: "clarity", label: "Gemstone Clarity Grades", description: "FL/IF, VVS1, VS1, Eye Clean..." },
  { type: "origin", label: "Countries of Origin", description: "Colombia, Burma, Ceylon, Zambia..." },
  { type: "treatment", label: "Gemstone Treatments", description: "Natural, Heat Treated, Minor Oil..." },
  { type: "laboratory", label: "Grading & Auth Laboratories", description: "GIA, GRS, SSEF, Gübelin, IGI..." },
  { type: "watchMovement", label: "Watch Movements", description: "Automatic, Quartz, Manual Winding..." },
  { type: "caseMaterial", label: "Watch Case Materials", description: "Stainless Steel, Titanium, Rose Gold..." },
  { type: "strapMaterial", label: "Watch Straps & Bracelets", description: "Alligator Leather, Steel Bracelet..." },
  { type: "waterResistance", label: "Watch Water Resistance", description: "30m, 50m, 100m, 200m..." },
  { type: "customerType", label: "Customer Classifications", description: "Private Client, Dealer, VIP Client..." },
  { type: "supplierType", label: "Supplier / Vendor Types", description: "Gemstone Supplier, Metal Dealer..." },
  { type: "expenseCategory", label: "Expense Categories", description: "Rent, Shipping, Insurance, Salaries..." },
  { type: "incomeCategory", label: "Income Categories", description: "Sales, Services, Investments..." },
  { type: "paymentMethod", label: "Payment Methods", description: "Cash, Credit Card, Bank Transfer..." },
  { type: "unit", label: "Inventory Units", description: "grams, pieces, carats, kg, oz..." },
  { type: "settingType", label: "Jewelry Setting Types", description: "Prong, Bezel, Channel, Pave, Solitaire..." },
  { type: "reportType", label: "Certificate Report Types", description: "Grading Report, Origin Report..." },
];

export default function LookupManagerTab() {
  const [selectedType, setSelectedType] = useState("category");
  const [searchQuery, setSearchQuery] = useState("");

  const { options, isLoading, refetch } = useLookups(selectedType);
  const { createLookup, isCreating } = useCreateLookup();
  const { updateLookup, isUpdating } = useUpdateLookup();
  const { deleteLookup } = useDeleteLookup();

  const { showSuccess, showError } = useToast();

  // Add Option Form State
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Edit Option Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, label: "", isLoading: false });

  const activeCategory = useMemo(() => {
    return LOOKUP_CATEGORIES.find((c) => c.type === selectedType) || LOOKUP_CATEGORIES[0];
  }, [selectedType]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(q) ||
        (opt.label && opt.label.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const val = newValue.trim();
    if (!val) {
      showError("Validation Error", "Option value cannot be empty.");
      return;
    }

    try {
      await createLookup({
        type: selectedType,
        value: val,
        label: newLabel.trim() || val,
      });
      showSuccess("Option Added", `"${val}" added to ${activeCategory.label}.`);
      setNewValue("");
      setNewLabel("");
    } catch (err) {
      showError("Create Failed", err?.response?.data?.message || err?.message || "Failed to create option.");
    }
  };

  const handleOpenEdit = (opt) => {
    setEditingOption(opt);
    setEditValue(opt.value);
    setEditLabel(opt.label || opt.value);
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingOption) return;
    const val = editValue.trim();
    if (!val) {
      showError("Validation Error", "Option value cannot be empty.");
      return;
    }

    try {
      await updateLookup({
        id: editingOption._id,
        value: val,
        label: editLabel.trim() || val,
      });
      showSuccess("Option Updated", `Updated to "${val}".`);
      setEditModalOpen(false);
      setEditingOption(null);
    } catch (err) {
      showError("Update Failed", err?.response?.data?.message || "Failed to update option.");
    }
  };

  const handleDeleteClick = (opt) => {
    setDeleteConfirm({
      open: true,
      id: opt._id,
      label: opt.label || opt.value,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteLookup(deleteConfirm.id);
      showSuccess("Option Removed", `"${deleteConfirm.label}" removed successfully.`);
      setDeleteConfirm({ open: false, id: null, label: "", isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete option.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Category Sidebar Selector */}
      <div className="lg:col-span-4 space-y-4">
        <Card p={4}>
          <CardHeader className="border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Configurable Categories ({LOOKUP_CATEGORIES.length})
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
            {LOOKUP_CATEGORIES.map((cat) => {
              const isSelected = cat.type === selectedType;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(cat.type);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex flex-col gap-0.5 border ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                      : "bg-white border-transparent hover:bg-gray-50 text-gray-700 hover:border-gray-200"
                  }`}
                >
                  <span className="text-xs font-bold block">{cat.label}</span>
                  <span className="text-[11px] text-gray-500 font-normal truncate block">{cat.description}</span>
                </button>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8 space-y-6">
        {/* Header & Add Option Form */}
        <Card p={5}>
          <CardHeader className="border-b border-gray-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-gray-900">{activeCategory.label}</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{activeCategory.description}</p>
            </div>
            <Badge variant="info" className="self-start sm:self-auto text-xs px-2.5 py-1">
              Type Key: <code className="font-mono">{activeCategory.type}</code>
            </Badge>
          </CardHeader>

          <CardBody className="space-y-4">
            {/* Inline Add Option Form */}
            <form onSubmit={handleCreate} className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                + Add New Option Value
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Option Value *"
                  placeholder="e.g. Platinum 950"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                />
                <Input
                  label="Display Label (Optional)"
                  placeholder="e.g. Platinum 950 (Pt950)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" isLoading={isCreating} icon={<Plus className="h-4 w-4" />}>
                  Save Option
                </Button>
              </div>
            </form>

            {/* Options List Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs font-bold text-gray-700">
                Available Options ({filteredOptions.length})
              </span>
              <div className="w-full sm:w-64">
                <SearchInput
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                />
              </div>
            </div>

            {/* Options Table / List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">No options found</p>
                <p className="text-xs text-gray-400 mt-1">Use the form above to create the first option for this type.</p>
              </div>
            ) : (
              <div className="border border-gray-200/80 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
                {filteredOptions.map((opt) => (
                  <div
                    key={opt._id || opt.value}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 shrink-0 font-bold text-xs">
                        #
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-gray-900 block truncate">
                          {opt.label || opt.value}
                        </span>
                        {opt.label && opt.label !== opt.value && (
                          <span className="text-[11px] font-mono text-gray-400 block truncate">
                            Value: {opt.value}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.isSystem ? (
                        <Badge variant="neutral" className="text-[11px] px-2 py-0.5">
                          System Default
                        </Badge>
                      ) : (
                        <>
                          <TableActionButton
                            icon={Edit2}
                            title="Edit option label"
                            onClick={() => handleOpenEdit(opt)}
                          />
                          <TableActionButton
                            icon={Trash2}
                            variant="danger"
                            title="Delete option"
                            onClick={() => handleDeleteClick(opt)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Edit Option Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Option — ${activeCategory.label}`}
      >
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <Input
            label="Option Value *"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            required
          />
          <Input
            label="Display Label"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, label: "", isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Lookup Option"
        message={`Are you sure you want to remove "${deleteConfirm.label}" from ${activeCategory.label}?`}
        confirmLabel="Delete Option"
        cancelLabel="Cancel"
        isLoading={deleteConfirm.isLoading}
        variant="danger"
      />
    </div>
  );
}
