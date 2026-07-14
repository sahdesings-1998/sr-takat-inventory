import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import apiClient from "@/services/apiClient";
import { useToast } from "@/contexts/ToastContext";

export default function FileUploader({
  label,
  value, // string URL
  onChange, // callback function (takes string URL)
  onPublicIdChange, // optional callback function (takes string public_id)
  accept = ".pdf,image/*",
  error,
  containerClassName,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const { showError, showSuccess } = useToast();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("File Too Large", "Maximum file size allowed is 10MB.");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload file directly to Cloudinary via backend
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.data?.url) {
        onChange(response.data.data.url);
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
    }
  };

  const handleClear = () => {
    onChange("");
    if (onPublicIdChange) onPublicIdChange("");
    setFileName("");
  };

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <span className="text-[13px] font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </span>
      )}

      <div className="relative">
        {value ? (
          <div className="flex items-center justify-between border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm">
            <div className="flex items-center gap-2 text-gray-600 truncate mr-4">
              <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
              <span className="truncate font-medium">{fileName || value.split("/").pop()}</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className={cn(
            "flex items-center gap-2 border border-gray-200 rounded-xl p-3 bg-white hover:bg-gray-50 border-dashed hover:border-primary/50 cursor-pointer transition-all duration-200 text-sm text-gray-600 font-semibold justify-center",
            isUploading && "pointer-events-none opacity-60"
          )}>
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span>Uploading file...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-gray-400" />
                <span>Choose file to upload</span>
              </div>
            )}
          </label>
        )}
      </div>

      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
}
