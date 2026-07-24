import { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { Loader2, AlertCircle } from "lucide-react";

// Import styles required by @react-pdf-viewer
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

// Compatible PDF.js worker version matching installed pdfjs-dist@3.11.174
const WORKER_URL = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

export default function PdfViewer({
  fileUrl,
  scale = 1.0,
  pageNumber = 1,
  onDocumentLoad,
  onError,
}) {
  const [renderError, setRenderError] = useState(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // Disable default sidebar for clean modal layout
  });

  const handleDocumentLoad = (e) => {
    setRenderError(null);
    if (onDocumentLoad) {
      onDocumentLoad({ numPages: e.doc.numPages });
    }
  };

  const handleDocumentError = (err) => {
    console.error("[PdfViewer] Failed to render PDF document:", err);
    setRenderError(err?.message || "Failed to render PDF document.");
    if (onError) {
      onError(err);
    }
  };

  if (!fileUrl) return null;

  return (
    <div className="w-full h-full min-h-[450px] relative bg-slate-50 flex flex-col items-center justify-center overflow-hidden rounded-xl">
      {renderError ? (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Failed to render PDF document.</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              The PDF file may be corrupted, password-protected, or restricted by storage CORS policies.
            </p>
          </div>
        </div>
      ) : (
        <Worker workerUrl={WORKER_URL}>
          <div className="w-full h-[65vh] sm:h-[70vh] overflow-auto">
            <Viewer
              fileUrl={fileUrl}
              plugins={[defaultLayoutPluginInstance]}
              onDocumentLoad={handleDocumentLoad}
              renderError={handleDocumentError}
              renderLoader={(percentages) => (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-gray-500">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold">
                    Loading PDF document ({Math.round(percentages)}%)...
                  </p>
                </div>
              )}
            />
          </div>
        </Worker>
      )}
    </div>
  );
}
