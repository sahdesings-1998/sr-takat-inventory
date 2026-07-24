import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Barcode,
  Camera,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import productsApi from "../api/productsApi";

export default function CodeScannerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    product: null,
    error: null,
    scannedCode: "",
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const html5QrcodeRef = useRef(null);
  const manualInputRef = useRef(null);

  // Play audio chime on scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  };

  // Helper to query backend for code
  const handleLookupCode = async (codeToLookup) => {
    if (!codeToLookup || !codeToLookup.trim()) return;
    const cleanCode = codeToLookup.trim();
    setIsSearching(true);
    setScanResult({ success: false, product: null, error: null, scannedCode: cleanCode });

    try {
      const res = await productsApi.scanCode(cleanCode);
      const productDoc = res.data?.product || res.data;
      if (productDoc) {
        playBeep();
        setScanResult({
          success: true,
          product: productDoc,
          error: null,
          scannedCode: cleanCode,
        });
      } else {
        setScanResult({
          success: false,
          product: null,
          error: `No product details found for code: "${cleanCode}"`,
          scannedCode: cleanCode,
        });
      }
    } catch (err) {
      console.error("[ScannerLookup] Error:", err);
      const errMsg =
        err?.response?.data?.message ||
        `No active product found matching code: "${cleanCode}"`;
      setScanResult({
        success: false,
        product: null,
        error: errMsg,
        scannedCode: cleanCode,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode("reader-canvas-container");
      }
      setIsScanning(true);
      await html5QrcodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          console.log("[Scanner] Scanned:", decodedText);
          handleLookupCode(decodedText);
        },
        (errorMessage) => {
          // ignore transient frame decode errors
        }
      );
    } catch (err) {
      console.error("[CameraStart] Failed:", err);
      setCameraError("Camera access denied or unavailable. Please use Manual / Hardware input.");
      setIsScanning(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop scanner:", err);
      }
    }
    setIsScanning(false);
  };

  // Toggle tab / lifecycle hooks
  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === "manual") {
      setTimeout(() => manualInputRef.current?.focus(), 200);
    }
  }, [isOpen, activeTab]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleLookupCode(manualCode);
    }
  };

  const handleNavigateToProduct = (productId) => {
    onClose();
    navigate(`/products/${productId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Scan Product Code</h3>
              <p className="text-xs text-gray-300 font-medium">QR Code & Barcode Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title={soundEnabled ? "Mute audio" : "Enable scan sound"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1 mx-4 mt-4 rounded-xl">
          <button
            onClick={() => {
              setScanResult({ success: false, product: null, error: null, scannedCode: "" });
              setActiveTab("camera");
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "camera"
                ? "bg-white text-indigo-700 shadow-xs border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Camera className="h-4 w-4" /> Live Camera Stream
          </button>
          <button
            onClick={() => {
              setScanResult({ success: false, product: null, error: null, scannedCode: "" });
              setActiveTab("manual");
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "manual"
                ? "bg-white text-indigo-700 shadow-xs border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Barcode className="h-4 w-4" /> Manual / USB Scanner
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* CAMERA TAB */}
          {activeTab === "camera" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-[300px] h-[300px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500/30 flex items-center justify-center shadow-inner">
                <div id="reader-canvas-container" className="w-full h-full" />

                {/* Overlay Target Frame */}
                {isScanning && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[200px] h-[200px] border-2 border-indigo-400 rounded-xl relative shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br" />
                      {/* Laser beam animation */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#818cf8]" />
                    </div>
                  </div>
                )}
              </div>

              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab("manual")}
                      className="text-indigo-600 font-bold underline mt-1 block hover:text-indigo-800"
                    >
                      Switch to USB / Manual Input
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-medium text-center">
                  Position the product QR code or Barcode inside the frame to scan automatically.
                </p>
              )}
            </div>
          )}

          {/* MANUAL / HARDWARE INPUT TAB */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-indigo-600" /> USB Hardware Scanner & Code Search
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  USB hardware barcode scanners automatically type the code into this field. You can also type or paste any Barcode, QR payload, SKU, Stock #, or Product ID.
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  ref={manualInputRef}
                  label="Product Code / Barcode Number"
                  placeholder="e.g. 890000090001, QR-STK-10001, STK-10001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  leftIcon={<Barcode className="h-4 w-4 text-gray-400" />}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSearching}
                  disabled={!manualCode.trim()}
                  icon={<Search className="h-4 w-4" />}
                >
                  Lookup Product
                </Button>
              </div>
            </form>
          )}

          {/* SEARCHING INDICATOR */}
          {isSearching && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-600">
              <RefreshCw className="h-7 w-7 animate-spin" />
              <p className="text-xs font-bold text-gray-700">Retrieving product record...</p>
            </div>
          )}

          {/* RESULT CARD - MATCH FOUND */}
          {scanResult.success && scanResult.product && (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Match Found
                </span>
                <Badge variant="success">{scanResult.product.status || "Active"}</Badge>
              </div>

              <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                {scanResult.product.imageUrls && scanResult.product.imageUrls[0] ? (
                  <img
                    src={scanResult.product.imageUrls[0]}
                    alt={scanResult.product.name}
                    className="h-16 w-16 object-cover rounded-lg border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                    <Package className="h-8 w-8" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm truncate">
                    {scanResult.product.name || "Product Item"}
                  </h4>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5 font-medium">
                    <p>
                      Stock #: <strong className="text-gray-900">{scanResult.product.stockNo}</strong> | SKU:{" "}
                      <strong className="text-gray-900">{scanResult.product.sku || "N/A"}</strong>
                    </p>
                    <p>
                      Price:{" "}
                      <strong className="text-indigo-600 font-bold">
                        ${(scanResult.product.sellingPrice || 0).toLocaleString()}
                      </strong>{" "}
                      | Stock Qty: <strong className="text-gray-900">{scanResult.product.quantity ?? scanResult.product.stockQuantity ?? 1}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => handleNavigateToProduct(scanResult.product._id)}
                icon={<ArrowRight className="h-4 w-4" />}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Open Complete Product Details
              </Button>
            </div>
          )}

          {/* RESULT CARD - ERROR / NOT FOUND / DELETED */}
          {scanResult.error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-shake">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                Scan Lookup Error
              </div>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                {scanResult.error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>Supported: QR Code, Code 128, EAN, SKU, Stock #</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-gray-600 hover:text-gray-900 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
