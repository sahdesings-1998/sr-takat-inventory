import { useState, useEffect } from "react";
import { Download, ZoomIn, ZoomOut, X, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import apiClient from "@/services/apiClient";

// Import react-pdf and configure local worker
import { Document, Page, pdfjs } from "react-pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
  const [pdfScale, setPdfScale] = useState(1.0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedMime, setDetectedMime] = useState("");

  useEffect(() => {
    let currentBlobUrl = null;

    if (!isOpen || !fileUrl) {
      setBlobUrl(null);
      setDetectedMime("");
      setError(null);
      setNumPages(null);
      setPageNumber(1);
      setPdfScale(1.0);
      setScale(1);
      return;
    }

    const requiresAuth = fileUrl.startsWith("/") || fileUrl.includes("/api/v1/");

    if (requiresAuth) {
      setLoading(true);
      setError(null);
      setDetectedMime("");
      apiClient
        .get(fileUrl, { responseType: "blob" })
        .then((res) => {
          const mime = res.data?.type || "";
          setDetectedMime(mime);

          currentBlobUrl = URL.createObjectURL(res.data);
          setBlobUrl(currentBlobUrl);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load authenticated preview:", err);
          setError("Failed to load PDF document.");
          setLoading(false);
        });
    } else {
      setBlobUrl(fileUrl);
      const ext = fileUrl.split("?")[0].split(".").pop()?.toLowerCase();
      if (ext === "pdf") setDetectedMime("application/pdf");
      else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) setDetectedMime(`image/${ext}`);
    }

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [fileUrl, isOpen]);

  if (!fileUrl) return null;

  const isPdf = detectedMime === "application/pdf" || (!detectedMime && (fileUrl.toLowerCase().endsWith(".pdf") || fileUrl.toLowerCase().includes("/raw/upload/")));
  const isImage = detectedMime.startsWith("image/") || (!detectedMime && (/\.(png|jpe?g|gif|webp|bmp)$/i.test(fileUrl) || fileUrl.includes("/image/upload/")));

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  const zoomInPdf = () => setPdfScale((s) => Math.min(s + 0.25, 3));
  const zoomOutPdf = () => setPdfScale((s) => Math.max(s - 0.25, 0.5));

  const prevPage = () => setPageNumber((p) => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber((p) => Math.min(p + 1, numPages || 1));

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const downloadFile = () => {
    const urlToUse = blobUrl || fileUrl;
    if (!urlToUse) return;

    const link = document.createElement("a");
    link.href = urlToUse;
    link.target = "_blank";
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <span>Type: {fileType || (isPdf ? "PDF Document" : isImage ? "Image" : "Document")}</span>
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
        <div className="flex items-center justify-between gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex-wrap">
          <div className="flex items-center gap-3">
            {(isImage || isPdf) && !loading && !error && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-150 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPdf ? zoomOutPdf : handleZoomOut}
                  className="h-8 w-8 p-0"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4 text-gray-600" />
                </Button>
                <span className="text-xs text-gray-600 font-bold min-w-[36px] text-center select-none">
                  {Math.round((isPdf ? pdfScale : scale) * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPdf ? zoomInPdf : handleZoomIn}
                  className="h-8 w-8 p-0"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            )}

            {isPdf && numPages && numPages > 1 && (
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-150 shadow-sm">
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

        {/* Document Display Area */}
        <div className="relative border border-gray-150 rounded-xl bg-gray-100/30 overflow-hidden min-h-[300px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Loading document preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{error}</p>
                <p className="text-xs text-gray-400 mt-0.5">Please check if the file is corrupted or contact support.</p>
              </div>
              <Button size="sm" onClick={downloadFile} className="mt-2">
                <Download className="h-4 w-4 mr-1.5" /> Try Downloading Direct
              </Button>
            </div>
          ) : isPdf && blobUrl ? (
            <div className="w-full h-[60vh] overflow-auto flex flex-col items-center p-4">
              <Document
                file={blobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-gray-600">Loading pages...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                      <X className="h-5 w-5 text-red-500" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">Failed to render PDF document.</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={pdfScale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-md rounded-lg max-w-full bg-white"
                />
              </Document>
            </div>
          ) : isImage && blobUrl ? (
            <div className="w-full h-[60vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={blobUrl}
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
                <p className="text-sm font-semibold text-gray-700">Preview not available</p>
                <p className="text-xs text-gray-400 mt-0.5">This file type cannot be previewed in the browser.</p>
              </div>
              <Button size="sm" onClick={downloadFile} className="mt-2">
                <Download className="h-4 w-4 mr-1.5" /> Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
