import { useState, useEffect } from "react";
import { Download, ZoomIn, ZoomOut, X, FileText, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import apiClient from "@/services/apiClient";
import PdfViewer from "./PdfViewer";

/**
 * Inspects magic bytes of arrayBuffer to check if file is PDF (%PDF)
 */
async function checkPdfMagicBytes(blob) {
  try {
    const buffer = await blob.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // %PDF is 0x25 0x50 0x44 0x46
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  } catch {
    return false;
  }
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  uploadDate,
  fileSize = "N/A",
}) {
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [blobUrl, setBlobUrl] = useState(null);
  const [isPdfFile, setIsPdfFile] = useState(false);
  const [isImageFile, setIsImageFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activeBlobUrl = null;

    if (!isOpen || !fileUrl) {
      setBlobUrl(null);
      setIsPdfFile(false);
      setIsImageFile(false);
      setError(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1);
      return;
    }

    const processFile = async () => {
      setLoading(true);
      setError(null);

      try {
        let blob = null;
        let finalUrl = fileUrl;

        // Data URLs or existing Blob URLs
        if (fileUrl.startsWith("data:") || fileUrl.startsWith("blob:")) {
          setBlobUrl(fileUrl);
          const isPdfData = fileUrl.includes("application/pdf");
          const isImageData = fileUrl.includes("image/");
          setIsPdfFile(isPdfData);
          setIsImageFile(isImageData || (!isPdfData && Boolean(fileName?.match(/\.(png|jpe?g|webp|gif)$/i))));
          setLoading(false);
          return;
        }

        // Relative paths or local API uploads
        const isRelative = fileUrl.startsWith("/") || fileUrl.includes("/api/v1/") || fileUrl.includes("/uploads/");

        if (isRelative) {
          const res = await apiClient.get(fileUrl, { responseType: "blob" });
          blob = res.data;
        } else {
          // Cloudinary or external URL: attempt direct fetch first, fallback to backend proxy
          try {
            const resp = await fetch(fileUrl);
            if (resp.ok) {
              blob = await resp.blob();
            }
          } catch (e) {
            console.warn("[DocumentPreviewModal] Direct fetch failed, trying backend proxy...", e);
          }

          if (!blob) {
            try {
              const proxyPath = `/upload/proxy?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName || "document")}`;
              const res = await apiClient.get(proxyPath, { responseType: "blob" });
              if (res.data && res.data.size > 0) {
                blob = res.data;
              }
            } catch (err) {
              console.warn("[DocumentPreviewModal] Proxy fetch failed:", err);
            }
          }
        }

        if (blob) {
          activeBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(activeBlobUrl);

          const isMagicPdf = await checkPdfMagicBytes(blob);
          const mime = blob.type || "";
          const isPdfMime = mime.includes("pdf") || isMagicPdf || fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("/raw/upload/");
          const isImgMime = mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileUrl) || fileUrl.includes("/image/upload/");

          setIsPdfFile(isPdfMime);
          setIsImageFile(!isPdfMime && isImgMime);
        } else {
          setBlobUrl(finalUrl);
          const isPdfPath = fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("/raw/upload/");
          const isImgPath = /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileUrl) || fileUrl.includes("/image/upload/");
          setIsPdfFile(isPdfPath);
          setIsImageFile(!isPdfPath && isImgPath);
        }
      } catch (err) {
        console.error("[DocumentPreviewModal] Error loading file blob:", err);
        // Fallback to direct fileUrl
        setBlobUrl(fileUrl);
        const isPdfPath = fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("/raw/upload/");
        const isImgPath = /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileUrl) || fileUrl.includes("/image/upload/");
        setIsPdfFile(isPdfPath);
        setIsImageFile(!isPdfPath && isImgPath);
      } finally {
        setLoading(false);
      }
    };

    processFile();

    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [fileUrl, isOpen]);

  if (!fileUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  const prevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber((p) => Math.min(p + 1, numPages || 1));

  const downloadFile = async () => {
    try {
      let downloadUrl = blobUrl;

      // If we don't have a valid blob object URL, fetch via backend proxy to guarantee binary integrity
      if (!downloadUrl || !downloadUrl.startsWith("blob:")) {
        const proxyUrl = `/upload/proxy?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName || "document")}&download=true`;
        const res = await apiClient.get(proxyUrl, { responseType: "blob" });
        downloadUrl = URL.createObjectURL(res.data);
      }

      const cleanName = fileName || (isPdfFile ? "document.pdf" : "download");
      const nameWithExt = isPdfFile && !cleanName.toLowerCase().endsWith(".pdf") ? `${cleanName}.pdf` : cleanName;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = nameWithExt;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[DocumentPreviewModal] Download error, falling back to direct link:", err);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.download = fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-col gap-1 min-w-0 pr-6">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate" title={fileName}>
            {fileName || "Document Preview"}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-semibold">
            <span>Type: {fileType || (isPdfFile ? "PDF Document" : isImageFile ? "Image" : "Document")}</span>
            {uploadDate && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>Uploaded: {new Date(uploadDate).toLocaleDateString()}</span>
              </>
            )}
            {fileSize && fileSize !== "N/A" && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>Size: {fileSize}</span>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Controls Toolbar */}
        <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex-wrap">
          <div className="flex items-center gap-3">
            {isImageFile && !loading && !error && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4 text-gray-600" />
                </Button>
                <span className="text-xs text-gray-600 font-bold min-w-[36px] text-center select-none">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            )}

            {isPdfFile && numPages && numPages > 1 && (
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevPage}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8 p-0"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </Button>
                <span className="text-xs text-gray-600 font-bold select-none px-1">
                  Page {pageNumber} / {numPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                  className="h-8 w-8 p-0"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={downloadFile} size="sm" className="h-9" disabled={loading}>
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>
            <Button variant="outline" onClick={onClose} size="sm" className="h-9">
              Close
            </Button>
          </div>
        </div>

        {/* Document Preview Display Area */}
        <div className="relative border border-gray-200 rounded-xl bg-gray-100/40 overflow-hidden min-h-[400px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Loading document preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{error}</p>
                <p className="text-xs text-gray-500 mt-1">Please verify the file exists or try direct download.</p>
              </div>
              <Button size="sm" onClick={downloadFile} className="mt-2">
                <Download className="h-4 w-4 mr-1.5" /> Try Downloading Direct
              </Button>
            </div>
          ) : isPdfFile && (blobUrl || fileUrl) ? (
            <div className="w-full h-full p-2">
              <PdfViewer
                fileUrl={blobUrl || fileUrl}
                pageNumber={pageNumber}
                scale={scale}
                onDocumentLoad={({ numPages }) => setNumPages(numPages)}
                onError={() => setError("Failed to render PDF document.")}
              />
            </div>
          ) : isImageFile && (blobUrl || fileUrl) ? (
            <div className="w-full h-[60vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={blobUrl || fileUrl}
                alt="Document preview"
                className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200 shadow-sm"
                style={{ transform: `scale(${scale})` }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Preview not supported</p>
                <p className="text-xs text-gray-500 mt-1">This file type cannot be previewed in the browser window.</p>
              </div>
              <Button size="sm" onClick={downloadFile} className="mt-2">
                <Download className="h-4 w-4 mr-1.5" /> Download Original File
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
