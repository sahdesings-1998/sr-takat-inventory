import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, FileText, Award } from "lucide-react";
import { useCertificates } from "../hooks/useCertificates";
import { useGemstones } from "@/modules/inventory/hooks/useInventory";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useSettings } from "@/modules/settings/hooks/useSettings";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Card, { CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FileUploader from "@/components/ui/FileUploader";

export default function CertificateList() {
  const { certificates, isLoading, isError, createCertificate, deleteCertificate, isCreating } = useCertificates();
  const { gemstones } = useGemstones();
  const { products } = useProducts();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });
  const [form, setForm] = useState({
    certificateNo: "",
    lab: "GIA",
    issueDate: "",
    reportType: "Grading Report",
    entityType: "Gemstone",
    entityId: "",
    fileUrl: "",
    publicId: "",
  });

  const labsList = settings?.certificateLabs || ["GIA", "GRS", "SSEF", "GÜBELIN", "IGI", "OTHER"];

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to load certificates database.");
    }
  }, [isError, showError]);

  const handleOpenAdd = () => {
    setForm({
      certificateNo: "",
      lab: labsList[0] || "GIA",
      issueDate: new Date().toISOString().split("T")[0],
      reportType: "Grading Report",
      entityType: "Gemstone",
      entityId: "",
      fileUrl: "",
      publicId: "",
    });
    setIsOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.certificateNo || !form.lab || !form.entityId) {
      showError("Validation Error", "Please fill in all required fields.");
      return;
    }

    try {
      let finalFileUrl = form.fileUrl || "https://res.cloudinary.com/demo/image/upload/sample.pdf";
      
      const payload = {
        certificateNo: form.certificateNo,
        lab: form.lab,
        issueDate: form.issueDate,
        reportType: form.reportType,
        entityType: form.entityType,
        entityId: form.entityId,
        fileUrl: finalFileUrl,
        publicId: form.publicId || "",
      };

      await createCertificate(payload);
      showSuccess("Certificate Added", "Laboratory certificate added and linked successfully!");
      setIsOpen(false);
    } catch (err) {
      showError("Upload Failed", err?.response?.data?.message || "Failed to create certificate.");
    }
  };

  const handleDelete = (certId) => {
    setDeleteConfirm({ open: true, id: certId, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteCertificate(deleteConfirm.id);
      showSuccess("Certificate Deleted", "Certificate removed and unlinked successfully.");
      setDeleteConfirm({ open: false, id: null, isLoading: false });
    } catch (err) {
      showError("Delete Failed", err?.response?.data?.message || "Failed to delete certificate.");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const assetOptions = form.entityType === "Gemstone"
    ? gemstones.map((g) => ({ value: g._id, label: `${g.stoneId} - ${g.gemstone} (${g.carat} ct)` }))
    : products.map((p) => ({ value: p._id, label: `${p.productCode} - ${p.name}` }));

  // Set the first asset option automatically when entityType changes
  useEffect(() => {
    if (assetOptions.length > 0) {
      setForm((prev) => ({ ...prev, entityId: assetOptions[0].value }));
    } else {
      setForm((prev) => ({ ...prev, entityId: "" }));
    }
  }, [form.entityType, gemstones, products]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-[-0.02em]">Laboratory Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage laboratory grading and identification reports linked to inventory assets</p>
        </div>
        <Button onClick={handleOpenAdd} className="w-fit">
          <Plus className="h-4.5 w-4.5" /> Upload Certificate
        </Button>
      </div>

      <Card>
        <DataTable
          headers={["Certificate No", "Lab", "Report Type", "Issue Date", "Linked Asset", "Report File", "Actions"]}
          data={certificates}
          isLoading={isLoading}
          emptyMessage="No certificates registered in the system."
          renderRow={(cert) => (
            <tr key={cert._id} className="border-b border-gray-100 text-sm hover:bg-gray-50/50">
              <td className="px-6 py-4 font-semibold text-gray-950 flex items-center gap-2">
                <Award className="h-4 w-4 text-accent" /> {cert.certificateNo}
              </td>
              <td className="px-6 py-4 font-bold text-primary">{cert.lab}</td>
              <td className="px-6 py-4 text-gray-600">{cert.reportType}</td>
              <td className="px-6 py-4 text-gray-600">
                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "—"}
              </td>
              <td className="px-6 py-4">
                <Badge variant={cert.entityType === "Gemstone" ? "info" : "success"}>
                  {cert.entityType}
                </Badge>
                <span className="text-xs text-gray-500 ml-2">ID: {cert.entityId?.stoneId || cert.entityId?.productCode || cert.entityId || "—"}</span>
              </td>
              <td className="px-6 py-4">
                {cert.fileUrl ? (
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-semibold"
                  >
                    <FileText className="h-3.5 w-3.5" /> Open Report <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">No File</span>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleDelete(cert._id)}
                  className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete Certificate"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          )}
        />
      </Card>

      {/* Upload Certificate Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Upload Laboratory Certificate">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label="Certificate Number *"
            value={form.certificateNo}
            onChange={(e) => setForm({ ...form, certificateNo: e.target.value })}
            required
          />
          <Select
            label="Laboratory *"
            value={form.lab}
            onChange={(e) => setForm({ ...form, lab: e.target.value })}
            options={labsList.map((lab) => ({ value: lab, label: lab }))}
            required
          />
          <Input
            label="Report Type *"
            value={form.reportType}
            onChange={(e) => setForm({ ...form, reportType: e.target.value })}
            required
          />
          <Input
            label="Issue Date *"
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            required
          />
          <Select
            label="Entity Type *"
            value={form.entityType}
            onChange={(e) => setForm({ ...form, entityType: e.target.value })}
            options={[
              { value: "Gemstone", label: "Gemstone" },
              { value: "Product", label: "Jewellery/Watch Product" },
            ]}
            required
          />
          <Select
            label="Link to Specific Asset *"
            value={form.entityId}
            onChange={(e) => setForm({ ...form, entityId: e.target.value })}
            options={assetOptions}
            required
            disabled={assetOptions.length === 0}
          />
          
          <FileUploader
            label="Upload Certificate File (PDF or Image)"
            value={form.fileUrl}
            onChange={(url) => setForm({ ...form, fileUrl: url })}
            onPublicIdChange={(id) => setForm({ ...form, publicId: id })}
          />

          <div className="text-center text-xs text-gray-400 font-semibold my-1">— OR —</div>

          <Input
            label="Certificate File URL (or PDF Link)"
            placeholder="https://..."
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Upload & Link
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Certificate"
        message="This certificate will be removed and unlinked from the associated gemstone or product. The record is preserved for audit purposes."
        confirmLabel="Delete"
        isLoading={deleteConfirm.isLoading}
        variant="danger"
      />
    </div>
  );
}
