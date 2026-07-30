import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Hammer, RefreshCw } from "lucide-react";
import { useJobCard } from "../hooks/useProduction";
import { useMaterials } from "@/modules/inventory/hooks/useInventory";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Textarea from "@/components/ui/Textarea";
import { SkeletonDetailCard, Skeleton } from "@/components/ui/Skeleton";

export default function JobCardDetails() {
  const { id } = useParams();
  const { jobCard, isLoading, isError, updateStage, issueMaterial, recordUsage, returnMaterial } =
    useJobCard(id);
  const { materials } = useMaterials();
  const { showSuccess, showError } = useToast();

  const [stageOpen, setStageOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [isSubmittingStage, setIsSubmittingStage] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const [selectedStageName, setSelectedStageName] = useState("Design");
  const [stageStatus, setStageStatus] = useState("Pending");
  const [stageNotes, setStageNotes] = useState("");

  const [selectedMatId, setSelectedMatId] = useState("");
  const [issueQty, setIssueQty] = useState("");

  const [usageMatId, setUsageMatId] = useState("");
  const [usageQty, setUsageQty] = useState("");

  const [returnMatId, setReturnMatId] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [returnToStockQty, setReturnToStockQty] = useState("");
  const [wastageLossQty, setWastageLossQty] = useState("");
  const [returnWastage, setReturnWastage] = useState("returnedToStock");

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch job card details.");
    }
  }, [isError, showError]);

  if (isLoading) return (
    <div className="page-container space-y-5">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28 rounded-md" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-52 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <SkeletonDetailCard rows={6} cols={2} />
      <SkeletonDetailCard rows={6} cols={1} title={false} />
    </div>
  );

  if (isError || !jobCard)
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch job card details.
      </div>
    );

  const handleOpenStage = (stageName) => {
    setSelectedStageName(stageName);
    const existing = jobCard.productionStages?.find((s) => s.stageName === stageName);
    setStageStatus(existing?.status || "Pending");
    setStageNotes(existing?.notes || "");
    setStageOpen(true);
  };

  const handleStageSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingStage(true);
      await updateStage({
        stageName: selectedStageName,
        status: stageStatus,
        notes: stageNotes,
      });
      showSuccess("Stage Status Updated", `Stage "${selectedStageName}" set to ${stageStatus}`);
      setStageOpen(false);
    } catch (err) {
      showError("Update Failed", "Failed to update stage status.");
    } finally {
      setIsSubmittingStage(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingIssue(true);
      await issueMaterial({
        materialId: selectedMatId,
        quantity: Number(issueQty),
      });
      showSuccess("Material Issued", "Material has been issued to the job card successfully!");
      setIssueOpen(false);
      setIssueQty("");
      setSelectedMatId("");
    } catch (err) {
      showError("Issue Failed", err?.response?.data?.message || "Failed to issue material.");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingUsage(true);
      await recordUsage({
        materialId: usageMatId,
        quantity: Number(usageQty),
      });
      showSuccess("Material Usage Recorded", "Final used quantity saved for manufacturing reconciliation.");
      setUsageOpen(false);
      setUsageQty("");
      setUsageMatId("");
    } catch (err) {
      showError("Usage Record Failed", err?.response?.data?.message || "Failed to record used material.");
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingReturn(true);
      const totalQty = Number(returnQty || 0);
      const stockQty = Number(returnToStockQty || (returnWastage === "returnedToStock" ? totalQty : 0));
      const wasteQty = Number(wastageLossQty || (returnWastage !== "returnedToStock" ? totalQty : 0));

      await returnMaterial({
        materialId: returnMatId,
        quantity: totalQty,
        returnedToStockQuantity: stockQty,
        wastageQuantity: wasteQty,
        wastageType: returnWastage,
      });
      showSuccess("Material Reconciled", "Returned material to stock and wastage details logged.");
      setReturnOpen(false);
      setReturnQty("");
      setReturnToStockQty("");
      setWastageLossQty("");
    } catch (err) {
      showError("Reconciliation Failed", err?.response?.data?.message || "Failed to process material return.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const STAGES = [
    "Design",
    "Materials Issued",
    "Manufacturing",
    "Stone Setting",
    "Polishing",
    "QC",
    "Completed",
  ];

  const getStageBadgeVariant = (stageName) => {
    const stage = jobCard.productionStages?.find((s) => s.stageName === stageName);
    if (!stage) return "neutral";
    if (stage.status === "Completed") return "success";
    if (stage.status === "In Progress") return "warning";
    return "info";
  };

  const getStageStatus = (stageName) => {
    const stage = jobCard.productionStages?.find((s) => s.stageName === stageName);
    return stage?.status || "Pending";
  };

  const materialOptions = materials.map((m) => ({
    value: m._id,
    label: `${m.materialCode} - ${m.materialName} (Stock: ${m.quantity} ${m.unit})`,
  }));

  // Reconciled Material Ledger Mapping
  const materialLedger = {};
  (jobCard.materialsIssued || []).forEach((item) => {
    const matId = item.materialId?._id || item.materialId;
    if (!matId) return;
    if (!materialLedger[matId]) {
      materialLedger[matId] = {
        mat: item.materialId,
        issued: 0,
        used: 0,
        returnedToStock: 0,
        wastage: 0,
      };
    }
    materialLedger[matId].issued += Number(item.quantity || 0);
  });

  (jobCard.materialsUsed || []).forEach((item) => {
    const matId = item.materialId?._id || item.materialId;
    if (!matId) return;
    if (!materialLedger[matId]) {
      materialLedger[matId] = {
        mat: item.materialId,
        issued: 0,
        used: 0,
        returnedToStock: 0,
        wastage: 0,
      };
    }
    materialLedger[matId].used += Number(item.quantity || 0);
  });

  (jobCard.materialsReturned || []).forEach((item) => {
    const matId = item.materialId?._id || item.materialId;
    if (!matId) return;
    if (!materialLedger[matId]) {
      materialLedger[matId] = {
        mat: item.materialId,
        issued: 0,
        used: 0,
        returnedToStock: 0,
        wastage: 0,
      };
    }
    materialLedger[matId].returnedToStock += Number(item.returnedToStockQuantity ?? (item.wastageType === "returnedToStock" ? item.quantity : 0));
    materialLedger[matId].wastage += Number(item.wastageQuantity ?? (item.wastageType !== "returnedToStock" ? item.quantity : 0));
  });

  const ledgerRows = Object.values(materialLedger);

  return (
    <div className="page-container space-y-5">
      <div>
        <Link
          to="/production"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Production Jobs
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">Job Card #{jobCard.jobNo}</h1>
            <Badge variant={jobCard.status === "Completed" ? "success" : "warning"}>
              {jobCard.status}
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-500">Product:</span>{" "}
              <span className="font-bold text-gray-900">{jobCard.productId?.name || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-500">Type:</span>{" "}
              <span className="font-bold text-gray-900">{jobCard.productType || jobCard.productId?.category || "Jewellery"}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-500">Start Date:</span>{" "}
              <span className="font-bold text-gray-900">{jobCard.startDate ? new Date(jobCard.startDate).toLocaleDateString() : "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-500">Expected Date:</span>{" "}
              <span className="font-bold text-gray-900">{jobCard.expectedDate ? new Date(jobCard.expectedDate).toLocaleDateString() : "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIssueOpen(true)} className="text-xs sm:text-sm">
            <Hammer className="h-4 w-4 mr-1" /> Issue Materials
          </Button>
          <Button variant="outline" onClick={() => setUsageOpen(true)} className="text-xs sm:text-sm">
            Record Final Used
          </Button>
          <Button variant="outline" onClick={() => setReturnOpen(true)} className="text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 mr-1" /> Reconcile / Return
          </Button>
        </div>
      </div>

      {/* Production Stage Tracking Timeline (7 Stages) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base font-display">
            Jewelry Manufacturing Stage Progress
          </h3>
          <span className="text-xs text-gray-500">Click any stage to update notes or status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {STAGES.map((stg) => (
            <button
              key={stg}
              onClick={() => handleOpenStage(stg)}
              className="p-3.5 rounded-xl border border-gray-200/80 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-center cursor-pointer shadow-2xs"
            >
              <span className="text-xs font-bold text-gray-800">{stg}</span>
              <Badge variant={getStageBadgeVariant(stg)}>{getStageStatus(stg)}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Material Flow & Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden space-y-3">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Material Tracking &amp; Automated Reconciliation</h3>
            <p className="text-xs text-gray-500 mt-0.5">Formula: Issued Qty − Final Used Qty = Remaining Qty &rarr; Disposition (Returned to Stock vs Wastage/Loss)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIssueOpen(true)}>+ Issue Material</Button>
          </div>
        </div>

        <DataTable
          headers={["Material Code & Name", "Issued Qty", "Final Used Qty", "Remaining Qty", "Returned to Stock", "Wastage / Loss"]}
          data={ledgerRows}
          emptyMessage="No material issued to this production job yet."
          renderRow={(row, idx) => {
            const matName = row.mat ? `${row.mat.materialCode} - ${row.mat.materialName}` : "Material";
            const unit = row.mat?.unit || "units";
            const remaining = Math.max(0, row.issued - row.used);

            return (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5 text-xs sm:text-sm font-bold text-gray-900">{matName}</td>
                <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-primary">{row.issued} {unit}</td>
                <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800">{row.used} {unit}</td>
                <td className="px-4 py-3.5 text-xs sm:text-sm font-bold text-amber-600">{remaining} {unit}</td>
                <td className="px-4 py-3.5 text-xs sm:text-sm text-green-600 font-semibold">{row.returnedToStock} {unit}</td>
                <td className="px-4 py-3.5 text-xs sm:text-sm text-rose-600 font-semibold">{row.wastage} {unit}</td>
              </tr>
            );
          }}
        />
      </div>

      {/* Update Stage Modal */}
      <Modal
        isOpen={stageOpen}
        onClose={() => setStageOpen(false)}
        title={`Update Stage: ${selectedStageName}`}
      >
        <form onSubmit={handleStageSubmit} className="flex flex-col gap-4">
          <Select
            label="Stage Status"
            value={stageStatus}
            onChange={(e) => setStageStatus(e.target.value)}
            options={[
              { value: "Pending", label: "Pending" },
              { value: "In Progress", label: "In Progress" },
              { value: "Completed", label: "Completed" },
            ]}
          />
          <Textarea
            label="Stage Production Notes"
            value={stageNotes}
            onChange={(e) => setStageNotes(e.target.value)}
            placeholder="Log craftsmanship updates, setting details, polishing notes..."
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setStageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingStage}>Save Stage Status</Button>
          </div>
        </form>
      </Modal>

      {/* Issue Material Modal */}
      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Material from Inventory">
        <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Material *"
            isSearchable
            value={selectedMatId}
            onChange={(val) => setSelectedMatId(typeof val === "string" ? val : val?.target?.value || "")}
            options={materialOptions}
            placeholder="Search material title or code..."
            required
          />
          <Input
            label="Quantity to Issue *"
            type="number"
            step="0.01"
            value={issueQty}
            onChange={(e) => setIssueQty(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingIssue}>Issue Stock</Button>
          </div>
        </form>
      </Modal>

      {/* Record Final Used Modal */}
      <Modal isOpen={usageOpen} onClose={() => setUsageOpen(false)} title="Record Final Used Quantity">
        <form onSubmit={handleUsageSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Material *"
            isSearchable
            value={usageMatId}
            onChange={(val) => setUsageMatId(typeof val === "string" ? val : val?.target?.value || "")}
            options={materialOptions}
            placeholder="Search material title or code..."
            required
          />
          <Input
            label="Final Quantity Used in Manufacturing *"
            type="number"
            step="0.01"
            value={usageQty}
            onChange={(e) => setUsageQty(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setUsageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingUsage}>Record Usage</Button>
          </div>
        </form>
      </Modal>

      {/* Reconcile Remaining / Return Modal */}
      <Modal isOpen={returnOpen} onClose={() => setReturnOpen(false)} title="Reconcile Remaining Material & Wastage">
        <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Material *"
            isSearchable
            value={returnMatId}
            onChange={(val) => setReturnMatId(typeof val === "string" ? val : val?.target?.value || "")}
            options={materialOptions}
            placeholder="Search material title or code..."
            required
          />
          <Input
            label="Total Remaining Quantity to Reconcile *"
            type="number"
            step="0.01"
            value={returnQty}
            onChange={(e) => setReturnQty(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantity Returned to Stock"
              type="number"
              step="0.01"
              value={returnToStockQty}
              onChange={(e) => setReturnToStockQty(e.target.value)}
              placeholder="Adds back to inventory"
            />
            <Input
              label="Quantity Lost / Wasted"
              type="number"
              step="0.01"
              value={wastageLossQty}
              onChange={(e) => setWastageLossQty(e.target.value)}
              placeholder="Recorded as loss"
            />
          </div>
          <Select
            label="Wastage Classification *"
            value={returnWastage}
            onChange={(val) => setReturnWastage(typeof val === "string" ? val : val?.target?.value || "")}
            options={[
              { value: "returnedToStock", label: "Returned to Stock (Reusable stock)" },
              { value: "scrapRecovery", label: "Scrap Recovery (Gold refinement)" },
              { value: "writeOff", label: "Write-off / Scrap Loss (Melt loss)" },
              { value: "damaged", label: "Damaged Material" },
            ]}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingReturn}>Process Reconciliation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
