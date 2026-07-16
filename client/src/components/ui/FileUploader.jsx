import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Image as ImageIcon, Loader2, Trash2, Upload, Video, X } from "lucide-react";
import { cn } from "@/utils/cn";
import apiClient from "@/services/apiClient";
import { useToast } from "@/contexts/ToastContext";
import Modal from "./Modal";

export default function FileUploader({
  label,
  value = "",
  onChange,
  onPublicIdChange,
  accept = ".pdf,image/*",
  error,
  containerClassName,
  buttonLabel = "Attach File",
  helperText = "Browse or drag and drop a file here",
  preview = true,
  maxSizeMB = 10,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const { showError, showSuccess } = useToast();

  const currentValue = useMemo(() => (value ? [value] : []), [value]);

  const getDisplayName = (fileValue) => {
    if (!fileValue) return "";
    try {
      const url = new URL(fileValue);
      return decodeURIComponent(url.pathname.split("/").pop() || fileValue);
    } catch {
      return fileValue;
    }
  };

  const isImageValue = (fileValue) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileValue || "");
  const isVideoValue = (fileValue) => /\.(mp4|mov|webm|avi)$/i.test(fileValue || "");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      showError("File Too Large", `Maximum file size allowed is ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.data?.url) {
        onChange?.(response.data.data.url);
        if (onPublicIdChange && response.data.data.publicId) {
          onPublicIdChange(response.data.data.publicId);
        }
        showSuccess("Upload Complete", "File uploaded successfully!");
      }
    } catch (err) {
      console.error(err);
      showError("Upload Failed", err.response?.data?.message || "Failed to upload file.");
      setFileName("");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const input = document.createElement("input");
      input.type = "file";
      input.files = dataTransfer.files;
      handleFileChange({ target: input });
    }
  };

  const handleClear = () => {
    onChange?.("");
    if (onPublicIdChange) onPublicIdChange("");
    setFileName("");
  };

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <span className="text-[13px] font-semibold text-gray-700 tracking-[-0.01em]">{label}</span>
      )}

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-gray-200 bg-gray-50/70 p-3 sm:p-4 text-center transition-all duration-200 hover:border-primary/50 hover:bg-white",
          isDragging && "border-primary/60 bg-primary/5 shadow-sm",
          isUploading && "pointer-events-none opacity-70"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm flex-wrap justify-center">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-primary flex-shrink-0" />}
          <span className="text-sm font-semibold text-gray-700 break-words">{buttonLabel}</span>
        </div>

        <p className="mt-3 text-sm text-gray-600 break-words">{helperText}</p>
        
        <p className="mt-1 w-full max-w-full px-2 text-[11px] text-left text-gray-400 whitespace-normal break-words">
          <span className="font-medium">Accepted formats:</span>{" "}
          <span className="break-words">{accept === "*/*" ? "Any file" : accept.split(",").join(", ")}</span>
        </p>

      </label>

      {currentValue.length > 0 && (
        <div className="rounded-[14px] border border-gray-200 bg-white p-3 shadow-sm">
          {preview && currentValue.some(isImageValue) && (
            <div className="mb-3 flex items-center gap-3 rounded-[12px] border border-gray-100 bg-gray-50 p-2 min-w-0">
              <img
                src={currentValue[0]}
                alt="Uploaded preview"
                className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                onClick={() => setPreviewImage(currentValue[0])}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">Preview available</p>
                <p className="truncate text-xs text-gray-500" title={getDisplayName(currentValue[0])}>{getDisplayName(currentValue[0])}</p>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-2 rounded-[12px] border border-gray-100 bg-gray-50 px-3 py-2 flex-wrap">
            <div className="flex min-w-0 items-center gap-2 flex-1">
              {currentValue.some(isImageValue) ? (
                <ImageIcon className="h-4 w-4 text-primary flex-shrink-0" />
              ) : currentValue.some(isVideoValue) ? (
                <Video className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-700" title={fileName || getDisplayName(currentValue[currentValue.length - 1])}>{fileName || getDisplayName(currentValue[currentValue.length - 1])}</p>
                <p className="text-xs text-gray-500">{isUploading ? "Uploading..." : "Uploaded"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-danger"
                aria-label="Remove uploaded file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      <Modal isOpen={Boolean(previewImage)} onClose={() => setPreviewImage(null)} title="Preview">
        <div className="flex items-center justify-center overflow-auto">
          <img src={previewImage} alt="Preview" className="max-h-[70vh] max-w-full rounded-xl border border-gray-100 object-contain shadow-sm" />
        </div>
      </Modal>
    </div>
  );
}
