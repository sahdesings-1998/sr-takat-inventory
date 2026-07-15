import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import apiClient from "@/services/apiClient";
import { useToast } from "@/contexts/ToastContext";
import Modal from "./Modal";

export default function ImageUploader({
  label,
  value = [], // Array of image URLs
  onChange,   // Callback function to update parent state (takes array of URLs)
  maxFiles = 5,
  error,
  containerClassName,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { showError, showSuccess } = useToast();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      showError("Limit Exceeded", `You can upload a maximum of ${maxFiles} images.`);
      return;
    }

    // Validate size and format
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showError("Invalid Format", `${file.name} is not a supported format. Only JPG, PNG, WEBP, and GIF are allowed.`);
        return;
      }
      if (file.size > maxSize) {
        showError("File Too Large", `${file.name} exceeds the 10MB size limit.`);
        return;
      }
    }

    setIsUploading(true);

    try {
      const uploadedUrls = [...value];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        if (response.data?.data?.url) {
          uploadedUrls.push(response.data.data.url);
        }
      }
      onChange(uploadedUrls);
      showSuccess("Upload Complete", "Image(s) uploaded successfully!");
    } catch (err) {
      console.error(err);
      showError("Upload Failed", err.response?.data?.message || "Failed to upload image(s).");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemove = (urlToRemove) => {
    const updated = value.filter((url) => url !== urlToRemove);
    onChange(updated);
  };

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <span className="text-[13px] font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </span>
      )}
      
      <div className="flex flex-col gap-3">
        {/* Upload Button/Zone */}
        {value.length < maxFiles && (
          <label className={cn(
            "flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-gray-50/50 transition-all duration-200 min-h-[100px]",
            isUploading && "pointer-events-none opacity-60"
          )}>
            <input
              type="file"
              multiple={maxFiles > 1}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Uploading image(s)...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-600 font-semibold">Choose file(s) or drag here</span>
                <span className="text-[10px] text-gray-400">JPG, PNG, WEBP, GIF (Max 10MB)</span>
              </div>
            )}
          </label>
        )}

        {/* Uploaded Thumbnails Grid */}
        {value.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {value.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <img
                  src={url}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() => setPreviewImage(url)}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-gray-600 rounded-full hover:bg-danger hover:text-white transition-all duration-150 shadow-sm cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger font-medium">{error}</p>}

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Image Preview"
      >
        <div className="flex items-center justify-center w-full max-h-[70vh] md:max-h-[60vh] overflow-auto">
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-gray-100"
          />
        </div>
      </Modal>
    </div>
  );
}
