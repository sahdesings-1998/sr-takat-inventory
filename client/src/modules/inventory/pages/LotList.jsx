import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { useLots } from "../hooks/useInventory";
import { useSuppliers } from "@/modules/suppliers/hooks/useSuppliers";
import { lotSchema } from "../validation/inventorySchema";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function LotList() {
  const { lots, isLoading, isError, createLot, updateLot, issueFromLot } = useLots();
  const { suppliers } = useSuppliers();
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [issueCarats, setIssueCarats] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch gemstone lots.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      gemstone: "",
      totalCarat: 0,
      estimatedPieces: 0,
      purchaseCost: 0,
      supplierId: "",
      location: "Vault",
      status: "In Stock",
    },
  });

  const handleOpenAdd = () => {
    setEditingLot(null);
    reset({
      gemstone: "",
      totalCarat: 0,
      estimatedPieces: 0,
      purchaseCost: 0,
      supplierId: "",
      location: "Vault",
      status: "In Stock",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (lot) => {
    setEditingLot(lot);
    reset({
      gemstone: lot.gemstone,
      totalCarat: lot.totalCarat,
      estimatedPieces: lot.estimatedPieces,
      purchaseCost: lot.purchaseCost,
      supplierId: lot.supplierId?._id || lot.supplierId || "",
      location: lot.location || "Vault",
      status: lot.status || "In Stock",
    });
    setIsOpen(true);
  };

  const handleOpenIssue = (lot) => {
    setSelectedLot(lot);
    setIssueCarats("");
    setIssueOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingLot) {
        await updateLot({ id: editingLot._id, data });
        showSuccess("Lot Updated", "Gemstone lot details updated successfully!");
      } else {
        await createLot(data);
        showSuccess("Lot Created", "New gemstone lot created successfully!");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsIssuing(true);
      await issueFromLot({
        id: selectedLot._id,
        carat: Number(issueCarats),
      });
      showSuccess("Issued successfully", `Issued ${issueCarats} carats from lot ${selectedLot.lotId}`);
      setIssueOpen(false);
    } catch (err) {
      showError("Issue Failed", err?.response?.data?.message || "Failed to issue from lot.");
    } finally {
      setIsIssuing(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Active":
        return "warning";
      case "Depleted":
        return "neutral";
      default:
        return "danger";
    }
  };

  const supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.companyName }));

  const headers = [
    "Lot ID",
    "Gemstone",
    "Total Carat",
    "Remaining",
    "Est. Pieces",
    "Cost",
    "Location",
    "Status",
    "Actions",
  ];

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !lots?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Gemstone Lots &amp; Parcels</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">Melee and parcel stones grouped by lot. Stock is deducted by carat weight only — piece count is informational.</p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit">
            <Plus className="h-4 w-4" /> Add Lot
          </Button>
        </div>
      )}

      <DataTable
        headers={headers}
        data={lots}
        isLoading={isLoading}
        emptyMessage="No lots found. Add gemstone lots or parcels to begin tracking."
        renderRow={(lot) => (
          <tr
            key={lot._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary truncate text-xs sm:text-sm">{lot.lotId}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">{lot.gemstone}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">{lot.totalCarat} ct</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">{lot.remainingCarat} ct</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">{lot.estimatedPieces}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">${lot.purchaseCost.toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{lot.location}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6">
              <Badge variant={getStatusVariant(lot.status)}>{lot.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                {lot.status !== "Depleted" && (
                  <TableActionButton
                    icon={ArrowDown}
                    title="Issue Carat"
                    onClick={() => handleOpenIssue(lot)}
                  />
                )}
                <TableActionButton
                  icon={Edit2}
                  title="Edit"
                  onClick={() => handleOpenEdit(lot)}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(lot, idx, { isExpanded, toggleExpand }) => (
          <div
            key={lot._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{lot.lotNo}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {lot.gemstone}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-mono font-bold text-gray-900">Total: {lot.totalCarat} ct</span>
                  <span className="text-gray-400 font-medium">•</span>
                  <span className="font-mono font-bold text-emerald-600">Rem: {lot.remainingCarat} ct</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusVariant(lot.status)}>{lot.status}</Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Est. Pieces</span>
                  <span className="font-mono font-medium text-gray-900">{lot.totalPieces ? `${lot.totalPieces} pcs` : "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Cost Price</span>
                  <span className="font-mono font-medium text-gray-900">${lot.costPrice ? lot.costPrice.toLocaleString() : "—"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">{lot.location || "—"}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  {lot.status !== "Depleted" && (
                    <TableActionButton
                      icon={ArrowDown}
                      title="Issue Carat"
                      showLabel
                      label="Issue"
                      onClick={() => handleOpenIssue(lot)}
                    />
                  )}
                  <TableActionButton
                    icon={Edit2}
                    title="Edit"
                    showLabel
                    label="Edit"
                    onClick={() => handleOpenEdit(lot)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingLot ? "Edit Lot" : "Add Lot"}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>

          <Input
            label="Gemstone Type *"
            error={errors.gemstone?.message}
            {...register("gemstone")}
          />
          <Input
            label="Total Carat weight *"
            type="number"
            step="0.001"
            error={errors.totalCarat?.message}
            {...register("totalCarat")}
          />
          <Input
            label="Estimated Pieces"
            type="number"
            error={errors.estimatedPieces?.message}
            {...register("estimatedPieces")}
          />
          <Input
            label="Purchase Cost *"
            type="number"
            step="0.01"
            error={errors.purchaseCost?.message}
            {...register("purchaseCost")}
          />
          <Select
            label="Supplier *"
            error={errors.supplierId?.message}
            options={supplierOptions}
            {...register("supplierId")}
          />
          <Input label="Location" error={errors.location?.message} {...register("location")} />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "In Stock", label: "In Stock" },
              { value: "Active", label: "Active" },
              { value: "Depleted", label: "Depleted" },
              { value: "Missing", label: "Missing" },
            ]}
            {...register("status")}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingLot ? "Save Changes" : "Add Lot"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue modal */}
      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Carats from Lot">
        <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Issue carat weight from this lot to production. Stock reduces by carat weight only — piece count is informational and is not used in stock calculations.<br />
            Available:{" "}
            <span className="font-semibold text-gray-900">{selectedLot?.remainingCarat} ct</span>
          </p>
          <Input
            label="Carat weight to issue *"
            type="number"
            step="0.001"
            value={issueCarats}
            onChange={(e) => setIssueCarats(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isIssuing}
              disabled={
                !issueCarats || Number(issueCarats) > (selectedLot?.remainingCarat || 0)
              }
            >
              Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
