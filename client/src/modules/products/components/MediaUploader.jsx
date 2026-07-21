import { useState } from "react";
import { Upload, X, Loader2, Star, ArrowLeft, ArrowRight, Image as ImageIcon, Eye } from "lucide-react";
import { cn } from "@/utils/cn";
import apiClient from "@/services/apiClient";
import { useToast } from "@/contexts/ToastContext";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";

export default function MediaUploader({ value = [], onChange, maxFiles = 10, label = "Product Media & Gallery" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { showError, showSuccess } = useToast();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      showError("Limit Exceeded", `Maximum ${maxFiles} images allowed per product.`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls = [...value];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data?.data?.url) {
          uploadedUrls.push(response.data.data.url);
        }
      }
      onChange(uploadedUrls);
      showSuccess("Upload Complete", "Media uploaded to Cloudinary successfully!");
    } catch (err) {
      showError("Upload Failed", err.response?.data?.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = (index) => {
    const updated = value.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const updated = [...value];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    onChange(updated);
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= value.length) return;
    const updated = [...value];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary shrink-0" />
            {label}
          </h4>
          <p className="text-xs text-gray-500">First image is automatically set as the Main Product Cover</p>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
          {value.length} / {maxFiles} Images
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      {value.length < maxFiles && (
        <label className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-primary hover:bg-gray-50/50 transition-all duration-200",
          isUploading && "pointer-events-none opacity-60"
        )}>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <span className="text-xs font-semibold text-gray-700">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-800">Click to upload or drag and drop</span>
              <span className="text-xs text-gray-400">PNG, JPG, WEBP, GIF (Max 10MB per file)</span>
            </div>
          )}
        </label>
      )}

      {/* Thumbnails Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {value.map((url, idx) => (
            <div
              key={idx}
              className={cn(
                "relative group rounded-xl overflow-hidden border bg-white shadow-2xs transition-all",
                idx === 0 ? "border-amber-400 ring-2 ring-amber-400/20" : "border-gray-200"
              )}
            >
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Primary Cover Badge */}
                {idx === 0 ? (
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    <Star className="h-3 w-3 fill-current" /> Main Image
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-amber-500 hover:text-white text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all shadow-xs"
                  >
                    Set Main
                  </button>
                )}

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(url)}
                    className="p-1.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
                    title="Preview Image"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      className="p-1.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
                      title="Move Left"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {idx < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      className="p-1.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
                      title="Move Right"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                    title="Delete Image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentPreviewModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        fileUrl={previewImage}
        fileName="Product Image Preview"
        fileType="Image"
      />
    </div>
  );
}
