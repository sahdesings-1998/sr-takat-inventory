import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ExternalLink, FileText, Award, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { useCertificates } from "../hooks/useCertificates";
import { useGemstones } from "@/modules/inventory/hooks/useInventory";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useSettings } from "@/modules/settings/hooks/useSettings";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Card, { CardBody } from "@/components/ui/Card";
import TableActionButton from "@/components/ui/TableActionButton";
import Badge from "@/components/ui/Badge";
import FileUploader from "@/components/ui/FileUploader";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";


import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import { useDebounce } from "@/hooks/useDebounce";

export default function CertificateList() {
  const { certificates, isLoading, isError, createCertificate, deleteCertificate, isCreating } = useCertificates();
  const { gemstones } = useGemstones();
  const { products } = useProducts();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [labFilter, setLabFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, isLoading: false });
  const [previewDoc, setPreviewDoc] = useState({
    isOpen: false,
    fileUrl: "",
    fileName: "",
    fileType: "",
    uploadDate: "",
  });

  const [form, setForm] = useState({
    certificateNo: "",
    lab: "GIA",
    issueDate: "",
    reportType: "Grading Report",
    entityType: "Gemstone",
    entityId: "",
    file: null,
  });

  const labsList = settings?.certificateLabs || ["GIA", "GRS", "SSEF", "GÜBELIN", "IGI", "OTHER"];

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to load certificates database.");
    }
  }, [isError, showError]);

  const handleOpenPreview = (cert) => {
    const ext = cert.format || cert.fileUrl?.split("?")[0]?.split(".").pop()?.toLowerCase();
    const typeLabel = ext === "pdf" ? "PDF Document" : ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? "Image" : "Document";

    // Format size label
    let sizeLabel = "N/A";
    if (cert.bytes) {
      sizeLabel = cert.bytes > 1024 * 1024
        ? `${(cert.bytes / 1024 / 1024).toFixed(2)} MB`
        : `${(cert.bytes / 1024).toFixed(1)} KB`;
    }

    setPreviewDoc({
      isOpen: true,
      fileUrl: `/certificates/${cert._id}/file`,
      fileName: cert.originalFilename || `Certificate_${cert.certificateNo}.${ext || 'pdf'}`,
      fileType: typeLabel,
      uploadDate: cert.uploadTimestamp || cert.createdAt || cert.issueDate,
      fileSize: sizeLabel,
    });
  };


  const handleOpenAdd = () => {
    const defaultEntityType = "Gemstone";
    const defaultOptions = defaultEntityType === "Gemstone" ? gemstones : products;
    const defaultEntityId = defaultOptions.length > 0 ? defaultOptions[0]._id : "";

    setForm({
      certificateNo: "",
      lab: labsList[0] || "GIA",
      issueDate: new Date().toISOString().split("T")[0],
      reportType: "Grading Report",
      entityType: defaultEntityType,
      entityId: defaultEntityId,
      file: null,
    });
    setIsOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.certificateNo || !form.lab || !form.entityId || !form.file) {
      showError("Validation Error", "Please fill in all required fields, including the certificate file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("certificateNo", form.certificateNo);
      formData.append("lab", form.lab);
      formData.append("issueDate", form.issueDate);
      formData.append("reportType", form.reportType);
      formData.append("entityType", form.entityType);
      formData.append("entityId", form.entityId);
      formData.append("file", form.file);

      await createCertificate(formData);
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
    const currentOptions = form.entityType === "Gemstone" ? gemstones : products;
    if (currentOptions.length > 0) {
      const exists = currentOptions.some((opt) => opt._id === form.entityId);
      if (!exists) {
        setForm((prev) => ({ ...prev, entityId: currentOptions[0]._id }));
      }
    } else {
      setForm((prev) => ({ ...prev, entityId: "" }));
    }
  }, [form.entityType, gemstones, products, form.entityId]);

  // Dynamic lab options
  const labOptions = useMemo(() => {
    const labsSet = new Set(["GIA", "IGI", "GRS", "SSEF", "GUBELIN", "AIGS", "Lotus"]);
    (certificates || []).forEach((c) => {
      if (c.lab) labsSet.add(c.lab);
    });
    return [{ value: "", label: "All Laboratories" }].concat(
      Array.from(labsSet).sort().map((l) => ({ value: l, label: l }))
    );
  }, [certificates]);

  const entityTypeOptions = [
    { value: "", label: "All Asset Types" },
    { value: "Gemstone", label: "Gemstone" },
    { value: "Product", label: "Product" },
  ];

  // Client-side filtering
  const filteredCertificates = useMemo(() => {
    return (certificates || []).filter((cert) => {
      if (search) {
        const q = search.toLowerCase();
        const matchNo = (cert.certificateNo || "").toLowerCase().includes(q);
        const matchLab = (cert.lab || "").toLowerCase().includes(q);
        const matchReport = (cert.reportType || "").toLowerCase().includes(q);
        if (!matchNo && !matchLab && !matchReport) return false;
      }
      if (labFilter && cert.lab !== labFilter) return false;
      if (entityTypeFilter && cert.entityType !== entityTypeFilter) return false;
      return true;
    });
  }, [certificates, search, labFilter, entityTypeFilter]);

  const activeFilterCount = (search ? 1 : 0) + (labFilter ? 1 : 0) + (entityTypeFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setLabFilter("");
    setEntityTypeFilter("");
  };

  return (
    <div className="page-container space-y-0">
      {isLoading && !certificates?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laboratory Certificates</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage laboratory grading and identification reports linked to inventory assets
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Upload Certificate
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card with Mobile Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Certificate Filters"
        chips={
          activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Active Filters:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                  Search: "{search}"
                  <button onClick={() => setSearchInput("")}>✕</button>
                </span>
              )}
              {labFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Lab: {labFilter}
                  <button onClick={() => setLabFilter("")}>✕</button>
                </span>
              )}
              {entityTypeFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Type: {entityTypeFilter}
                  <button onClick={() => setEntityTypeFilter("")}>✕</button>
                </span>
              )}

              <button onClick={handleResetFilters} className="text-xs font-bold text-danger hover:underline ml-auto">
                Clear All
              </button>
            </div>
          )
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Filter 1: Search (Always First) */}
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
              Search Certificates
            </label>
            <SearchInput
              placeholder="Search cert no, lab, report type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="certs-search"
            />
          </div>

          {/* Filter 2: Laboratory */}
          <Select
            label="Laboratory"
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            options={labOptions}
            containerClassName="w-full"
          />

          {/* Filter 3: Linked Asset Type */}
          <Select
            label="Asset Type"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            options={entityTypeOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredCertificates.length}</strong> of{" "}
          <strong className="text-gray-900">{certificates.length}</strong> certificates
        </span>
        {activeFilterCount > 0 && <span className="text-primary font-semibold">Filtered results active</span>}
      </div>

      <Card>
        <DataTable
          headers={["Certificate No", "Lab", "Report Type", "Issue Date", "Linked Asset", "Report File", "Actions"]}
          data={filteredCertificates}
          isLoading={isLoading}
          emptyMessage="No certificates registered in the system."
          renderRow={(cert) => (
            <tr key={cert._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
              <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-950 flex items-center gap-2">
                <Award className="h-4 w-4 text-accent flex-shrink-0" /> {cert.certificateNo}
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6 font-bold text-primary">{cert.lab}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600">{cert.reportType}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap">
                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6">
                <Badge variant={cert.entityType === "Gemstone" ? "info" : "success"}>
                  {cert.entityType}
                </Badge>
                <span className="text-xs text-gray-500 ml-2 block break-all">ID: {cert.entityId?.stoneId || cert.entityId?.productCode || cert.entityId || "—"}</span>
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6">
                {cert.fileUrl ? (
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(cert)}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-semibold cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" /> Open Report <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No File</span>
                )}
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6">
                <TableActionButton
                  icon={Trash2}
                  title="Delete Certificate"
                  variant="danger"
                  isLoading={deleteConfirm.open && deleteConfirm.id === cert._id && deleteConfirm.isLoading}
                  onClick={() => handleDelete(cert._id)}
                />
              </td>
            </tr>
          )}
          renderMobileCard={(cert, idx, { isExpanded, toggleExpand }) => (
            <div
              key={cert._id}
              className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
            >
              <button
                type="button"
                onClick={toggleExpand}
                className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm truncate">{cert.certificateNo}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="font-bold text-primary">{cert.lab}</span>
                    <span>•</span>
                    <span>{cert.reportType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={cert.entityType === "Gemstone" ? "info" : "success"}>
                    {cert.entityType}
                  </Badge>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                  <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                    <span className="font-semibold text-gray-500">Issue Date</span>
                    <span className="font-medium text-gray-900">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                    <span className="font-semibold text-gray-500">Linked Asset ID</span>
                    <span className="font-mono font-medium text-gray-900">{cert.entityId?.stoneId || cert.entityId?.productCode || cert.entityId || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                    <span className="font-semibold text-gray-500">Report Document</span>
                    <span>
                      {cert.fileUrl ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(cert)}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-semibold cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" /> Open Report <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-gray-450">No File</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <TableActionButton
                      icon={Trash2}
                      title="Delete Certificate"
                      variant="danger"
                      showLabel
                      label="Delete"
                      isLoading={deleteConfirm.open && deleteConfirm.id === cert._id && deleteConfirm.isLoading}
                      onClick={() => handleDelete(cert._id)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        />
      </Card>

      {/* Upload Certificate Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Upload Laboratory Certificate">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label="Certificate Number"
            value={form.certificateNo}
            onChange={(e) => setForm({ ...form, certificateNo: e.target.value })}
            required
          />
          <Select
            label="Laboratory"
            value={form.lab}
            onChange={(e) => setForm({ ...form, lab: e.target.value })}
            options={labsList.map((lab) => ({ value: lab, label: lab }))}
            required
          />
          <Input
            label="Report Type"
            value={form.reportType}
            onChange={(e) => setForm({ ...form, reportType: e.target.value })}
            required
          />
          <DatePicker
            label="Issue Date"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            required
          />
          <Select
            label="Entity Type"
            value={form.entityType}
            onChange={(e) => setForm({ ...form, entityType: e.target.value })}
            options={[
              { value: "Gemstone", label: "Gemstone" },
              { value: "Product", label: "Jewellery/Watch Product" },
            ]}
            required
          />
          <Select
            label="Link to Specific Asset"
            value={form.entityId}
            onChange={(e) => setForm({ ...form, entityId: e.target.value })}
            options={assetOptions}
            required
            disabled={assetOptions.length === 0}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 select-none">
              Certificate File (PDF, JPG, JPEG, or PNG) *
            </span>
            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-white transition-all duration-200">
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    setForm({ ...form, file: selectedFile });
                  }
                }}
              />
              <Upload className="h-5 w-5 text-primary mb-1.5" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                {form.file ? form.file.name : "Select certificate file"}
              </span>
              <span className="text-[11px] text-gray-400 mt-1">
                {form.file ? `${(form.file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, JPG, JPEG, or PNG (Max 10MB)"}
              </span>
            </label>
          </div>

          {form.file && (
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
              <span className="truncate font-semibold text-gray-700 max-w-[200px]" title={form.file.name}>
                {form.file.name}
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, file: null })}
                className="text-gray-500 hover:text-danger p-1 rounded-full transition-colors cursor-pointer"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

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

      <DocumentPreviewModal
        isOpen={previewDoc.isOpen}
        onClose={() => setPreviewDoc((p) => ({ ...p, isOpen: false }))}
        fileUrl={previewDoc.fileUrl}
        fileName={previewDoc.fileName}
        fileType={previewDoc.fileType}
        uploadDate={previewDoc.uploadDate}
        fileSize={previewDoc.fileSize}
      />
    </div>
  );
}
