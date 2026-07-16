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

export default function JobCardDetails() {
  const { id } = useParams();
  const { jobCard, isLoading, isError, updateStage, issueMaterial, returnMaterial } =
    useJobCard(id);
  const { materials } = useMaterials();
  const { showSuccess, showError } = useToast();

  const [stageOpen, setStageOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [selectedStageName, setSelectedStageName] = useState("Design");
  const [stageStatus, setStageStatus] = useState("Pending");
  const [stageNotes, setStageNotes] = useState("");

  const [selectedMatId, setSelectedMatId] = useState("");
  const [issueQty, setIssueQty] = useState("");

  const [returnMatId, setReturnMatId] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [returnWastage, setReturnWastage] = useState("returnedToStock");

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch job card details.");
    }
  }, [isError, showError]);

  if (isLoading) return <div className="text-gray-500 text-sm p-6">Loading job details...</div>;
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
      await updateStage({
        stageName: selectedStageName,
        status: stageStatus,
        notes: stageNotes,
      });
      showSuccess("Stage Status Updated", `Stage "${selectedStageName}" set to ${stageStatus}`);
      setStageOpen(false);
    } catch (err) {
      showError("Update Failed", "Failed to update stage status.");
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      await issueMaterial({
        materialId: selectedMatId,
        quantity: Number(issueQty),
      });
      showSuccess("Material Issued", "Material has been issued to the job card successfully!");
      setIssueOpen(false);
    } catch (err) {
      showError("Issue Failed", err?.response?.data?.message || "Failed to issue material.");
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      await returnMaterial({
        materialId: returnMatId,
        quantity: Number(returnQty),
        wastageType: returnWastage,
      });
      showSuccess("Material Logged", "Returned material/scrap details saved.");
      setReturnOpen(false);
    } catch (err) {
      showError("Return Failed", err?.response?.data?.message || "Failed to return material.");
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/production"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Job Cards
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-display">Job Card #{jobCard.jobNo}</h1>
            <Badge variant={jobCard.status === "Completed" ? "success" : "warning"}>
              {jobCard.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Product:{" "}
            <span className="font-semibold text-gray-900">{jobCard.productId?.name || "—"}</span> |
            Due Date:{" "}
            <span className="font-semibold text-gray-900">
              {new Date(jobCard.targetDueDate).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIssueOpen(true)}>
            <Hammer className="h-4 w-4" /> Issue Materials
          </Button>
          <Button variant="outline" onClick={() => setReturnOpen(true)}>
            <RefreshCw className="h-4 w-4" /> Return & Wastage
          </Button>
        </div>
      </div>

      {/* Production Stage Tracking Timeline */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <h3 className="font-semibold text-gray-900 font-display">
          Manufacturing Lifecycle Timeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-2">
          {STAGES.map((stg) => (
            <button
              key={stg}
              onClick={() => handleOpenStage(stg)}
              className="p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-center cursor-pointer shadow-sm hover:shadow"
            >
              <span className="text-xs font-semibold text-gray-800">{stg}</span>
              <Badge variant={getStageBadgeVariant(stg)}>{getStageStatus(stg)}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Materials Ledger splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials Issued */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Materials Issued to Artisan</h3>
          </div>
          <DataTable
            headers={["Material", "Issued Qty", "Issued Date"]}
            data={jobCard.materialsIssued || []}
            emptyMessage="No metals/settings issued yet."
            renderRow={(row, idx) => (
              <tr key={idx} className="border-b border-gray-100 text-xs sm:text-sm">
                <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 break-words min-w-0 text-xs sm:text-sm">
                  {row.materialId
                    ? `${row.materialId.materialCode} - ${row.materialId.materialName}`
                    : "—"}
                </td>
                <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 whitespace-nowrap text-xs sm:text-sm">{row.quantity}</td>
                <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                  {row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            )}
          />
        </div>

        {/* Materials Returned */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Materials Returned / Wastage Logs</h3>
          </div>
          <DataTable
            headers={["Material", "Qty", "Wastage Classification", "Returned Date"]}
            data={jobCard.materialsReturned || []}
            emptyMessage="No metal/scrap returned yet."
            renderRow={(row, idx) => (
              <tr key={idx} className="border-b border-gray-100 text-xs sm:text-sm">
                <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900 break-words min-w-0 text-xs sm:text-sm">
                  {row.materialId
                    ? `${row.materialId.materialCode} - ${row.materialId.materialName}`
                    : "—"}
                </td>
                <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 whitespace-nowrap text-xs sm:text-sm">{row.quantity}</td>
                <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm">
                  <Badge variant={row.wastageType === "writeOff" ? "danger" : row.wastageType === "scrapRecovery" ? "warning" : "success"}>
                    {row.wastageType}
                  </Badge>
                </td>
                <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                  {row.returnedAt ? new Date(row.returnedAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            )}
          />
        </div>
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
            label="Stage Notes / Remarks"
            value={stageNotes}
            onChange={(e) => setStageNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setStageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Status</Button>
          </div>
        </form>
      </Modal>

      {/* Issue Material Modal */}
      <Modal isOpen={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Material to Job Card">
        <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Material *"
            value={selectedMatId}
            onChange={(e) => setSelectedMatId(e.target.value)}
            options={materialOptions}
            required
          />
          <Input
            label="Quantity to Issue *"
            type="number"
            value={issueQty}
            onChange={(e) => setIssueQty(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Issue Stock</Button>
          </div>
        </form>
      </Modal>

      {/* Return Material Modal */}
      <Modal isOpen={returnOpen} onClose={() => setReturnOpen(false)} title="Log Returned Material & Scrap">
        <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Material *"
            value={returnMatId}
            onChange={(e) => setReturnMatId(e.target.value)}
            options={materialOptions}
            required
          />
          <Input
            label="Quantity *"
            type="number"
            value={returnQty}
            onChange={(e) => setReturnQty(e.target.value)}
            required
          />
          <Select
            label="Wastage Classification *"
            value={returnWastage}
            onChange={(e) => setReturnWastage(e.target.value)}
            options={[
              { value: "returnedToStock", label: "Returned to Stock (Reusable)" },
              { value: "scrapRecovery", label: "Scrap Recovery (Refine gold)" },
              { value: "writeOff", label: "Write-off / Scrap Loss (Melt wastage)" },
            ]}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Return</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
