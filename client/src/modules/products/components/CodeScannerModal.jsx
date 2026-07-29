import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Barcode,
  Camera,
  Upload,
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
  FileImage,
  ImageIcon,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import productsApi from "../api/productsApi";

// Helper to format decoded code type into human-friendly label
function parseCodeFormat(formatObj, decodedText = "") {
  const name = formatObj?.formatName || (typeof formatObj === "string" ? formatObj : "");
  const formatStr = String(name).toUpperCase();

  if (formatStr.includes("QR")) return "QR Code";
  if (formatStr.includes("128")) return "Barcode (Code 128)";
  if (formatStr.includes("39")) return "Barcode (Code 39)";
  if (formatStr.includes("EAN_13") || formatStr.includes("EAN13")) return "Barcode (EAN-13)";
  if (formatStr.includes("EAN_8") || formatStr.includes("EAN8")) return "Barcode (EAN-8)";
  if (formatStr.includes("UPC_A") || formatStr.includes("UPCA")) return "Barcode (UPC-A)";
  if (formatStr.includes("UPC_E") || formatStr.includes("UPCE")) return "Barcode (UPC-E)";
  if (formatStr.includes("ITF")) return "Barcode (ITF)";
  if (formatStr.includes("CODABAR")) return "Barcode (Codabar)";
  if (formatStr.includes("AZTEC")) return "Aztec Code";
  if (formatStr.includes("DATA_MATRIX")) return "Data Matrix";
  if (formatStr.includes("PDF_417")) return "PDF417";

  if (formatStr) return `Barcode (${formatStr})`;

  if (
    decodedText.startsWith("http://") ||
    decodedText.startsWith("https://") ||
    decodedText.includes("/products/scan/")
  ) {
    return "QR Code";
  }

  return "Barcode / QR Code";
}

// Convert Canvas to Blob helper
function canvasToBlob(canvas, mimeType = "image/png") {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType));
}

// Multi-pass image scanner handling high-res, normalized scale, and rotated images
async function scanImageWithFallbacks(file, html5QrcodeInstance) {
  console.log(`[ImageScan] Starting multi-pass scan for file: "${file.name}" (${file.size} bytes, type: ${file.type})`);

  // Pass 1: Direct scan on raw file
  try {
    const res = await html5QrcodeInstance.scanFileV2(file, false);
    if (res && res.decodedText) {
      console.log("[ImageScan] Pass 1 (direct raw file) succeeded:", res.decodedText);
      return res;
    }
  } catch (err1) {
    console.log("[ImageScan] Pass 1 did not detect code, starting normalized scale & rotation pass...");
  }

  // Load image element from file
  const img = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image file into Image object"));
      image.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

  // Calculate normalized max dimension (1200px)
  const MAX_DIM = 1200;
  let scale = 1;
  if (img.width > MAX_DIM || img.height > MAX_DIM) {
    scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height);
  }

  const targetWidth = Math.round(img.width * scale);
  const targetHeight = Math.round(img.height * scale);
  console.log(`[ImageScan] Image original dimensions: ${img.width}x${img.height}, normalized target: ${targetWidth}x${targetHeight}`);

  // Rotations to test: 0°, 90°, 180°, 270°
  const angles = [0, 90, 180, 270];

  for (const angle of angles) {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (angle === 90 || angle === 270) {
        canvas.width = targetHeight;
        canvas.height = targetWidth;
      } else {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

      const blob = await canvasToBlob(canvas, "image/png");
      if (blob) {
        const rotatedFile = new File([blob], `scan_angle_${angle}.png`, { type: "image/png" });
        const res = await html5QrcodeInstance.scanFileV2(rotatedFile, false);
        if (res && res.decodedText) {
          console.log(`[ImageScan] Code detected successfully on Pass angle ${angle}°! Decoded: "${res.decodedText}"`);
          return res;
        }
      }
    } catch (e) {
      // Continue to next angle
    }
  }

  throw new Error("No readable QR code or barcode found after multi-angle analysis.");
}

// Clean scanned payload (extract raw code string if full URL)
function cleanScannedCode(rawCode) {
  if (rawCode === undefined || rawCode === null) return "";
  let clean = String(rawCode).trim();
  if (clean.includes("/products/scan/")) {
    const parts = clean.split("/products/scan/");
    clean = parts[parts.length - 1].split("?")[0].split("#")[0].trim();
  }
  return clean;
}

export default function CodeScannerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "upload" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Upload image state
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [scanResult, setScanResult] = useState({
    success: false,
    product: null,
    error: null,
    scannedCode: "",
    codeType: "",
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const html5QrcodeRef = useRef(null);
  const manualInputRef = useRef(null);

  // Play audio chime on successful scan/lookup
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

  // Query backend database for scanned code
  const handleLookupCode = async (codeToLookup, detectedCodeType = "") => {
    if (codeToLookup === undefined || codeToLookup === null) return;
    const rawStr = String(codeToLookup);
    const cleanCode = cleanScannedCode(rawStr);
    if (!cleanCode) return;

    console.log(`[ClientLookup] Original codeToLookup: "${codeToLookup}" (type: ${typeof codeToLookup}) | Clean string: "${cleanCode}" | Format: "${detectedCodeType}"`);

    setIsSearching(true);
    setScanResult({
      success: false,
      product: null,
      error: null,
      scannedCode: cleanCode,
      codeType: detectedCodeType || "QR / Barcode",
    });

    try {
      const res = await productsApi.scanCode(cleanCode);
      const productDoc = res.data?.product || res.data;
      if (productDoc) {
        playBeep();
        console.log("[ClientLookup] SUCCESS: Product retrieved from server:", productDoc);
        setScanResult({
          success: true,
          product: productDoc,
          error: null,
          scannedCode: cleanCode,
          codeType: detectedCodeType || "QR / Barcode",
        });
      } else {
        console.warn("[ClientLookup] MISMATCH: Server returned empty product record for:", cleanCode);
        setScanResult({
          success: false,
          product: null,
          error: `No product details found in database matching code: "${cleanCode}"`,
          scannedCode: cleanCode,
          codeType: detectedCodeType || "QR / Barcode",
        });
      }
    } catch (err) {
      console.error("[ClientLookup] SERVER ERROR:", err);
      const errMsg =
        err?.response?.data?.message ||
        `No active product found matching code: "${cleanCode}"`;
      setScanResult({
        success: false,
        product: null,
        error: errMsg,
        scannedCode: cleanCode,
        codeType: detectedCodeType || "QR / Barcode",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Start Live Camera Stream with html5-qrcode
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrcodeRef.current) {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        html5QrcodeRef.current = new Html5Qrcode("reader-canvas-container", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
          ],
          verbose: false,
        });
      }
      setIsScanning(true);
      await html5QrcodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText, resultObj) => {
          console.log("[Scanner] Live Scanned:", decodedText, resultObj);
          const detectedType = parseCodeFormat(resultObj?.result?.format, decodedText);
          handleLookupCode(decodedText, detectedType);
        },
        () => {
          // ignore transient frame decode errors
        }
      );
    } catch (err) {
      console.error("[CameraStart] Failed:", err);
      setCameraError("Camera access denied or unavailable. Please upload an image or use manual code entry.");
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

  // Decode uploaded image using html5-qrcode with multi-pass fallback
  const processImageFile = async (file) => {
    if (!file) return;

    // File validation: check image type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.split(".").pop().toLowerCase();
    const validExts = ["jpg", "jpeg", "png", "webp"];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setUploadError("Invalid file format. Please upload an image file in JPG, JPEG, PNG, or WebP format.");
      setSelectedFile(null);
      setImagePreviewUrl(null);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    setIsDecodingImage(true);
    setScanResult({ success: false, product: null, error: null, scannedCode: "", codeType: "" });

    let fileScanner = null;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      fileScanner = new Html5Qrcode("reader-file-hidden-canvas", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
        verbose: false,
      });

      const result = await scanImageWithFallbacks(file, fileScanner);
      const decodedText = String(result.decodedText);
      const detectedType = parseCodeFormat(result.result?.format, decodedText);

      console.log("[ImageScan] Decoded successfully:", decodedText, detectedType);
      await handleLookupCode(decodedText, detectedType);
    } catch (err) {
      console.warn("[ImageScan] Failed to decode image code:", err);
      setUploadError(
        "No QR code or barcode detected in the uploaded image. Please make sure the image is sharp, well-lit, and contains a valid QR code or supported barcode (Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, Codabar)."
      );
    } finally {
      setIsDecodingImage(false);
      if (fileScanner) {
        try {
          await fileScanner.clear();
        } catch (e) {
          // ignore clear errors
        }
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const resetImageState = () => {
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setUploadError(null);
    setScanResult({ success: false, product: null, error: null, scannedCode: "", codeType: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Toggle tab & lifecycle hooks
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

  // Clean up on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleLookupCode(manualCode, "Manual / USB Input");
    }
  };

  const handleNavigateToProduct = (productId) => {
    stopCamera();
    onClose();
    navigate(`/products/${productId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      {/* Hidden container for image decoding canvas */}
      <div id="reader-file-hidden-canvas" className="hidden" />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
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
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
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
        <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1 mx-4 mt-4 rounded-xl shrink-0">
          <button
            onClick={() => {
              setScanResult({ success: false, product: null, error: null, scannedCode: "", codeType: "" });
              setActiveTab("camera");
            }}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "camera"
                ? "bg-white text-indigo-700 shadow-xs border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Camera className="h-3.5 w-3.5 shrink-0" /> Live Camera
          </button>
          <button
            onClick={() => {
              setScanResult({ success: false, product: null, error: null, scannedCode: "", codeType: "" });
              setActiveTab("upload");
            }}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "upload"
                ? "bg-white text-indigo-700 shadow-xs border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Upload className="h-3.5 w-3.5 shrink-0" /> Upload Image
          </button>
          <button
            onClick={() => {
              setScanResult({ success: false, product: null, error: null, scannedCode: "", codeType: "" });
              setActiveTab("manual");
            }}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "manual"
                ? "bg-white text-indigo-700 shadow-xs border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Barcode className="h-3.5 w-3.5 shrink-0" /> Manual / USB
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
                    <div className="flex gap-3 mt-1.5">
                      <button
                        onClick={() => setActiveTab("upload")}
                        className="text-indigo-600 font-bold underline hover:text-indigo-800"
                      >
                        Upload Image File
                      </button>
                      <button
                        onClick={() => setActiveTab("manual")}
                        className="text-indigo-600 font-bold underline hover:text-indigo-800"
                      >
                        Manual Code Entry
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-medium text-center">
                  Position the product QR code or Barcode inside the frame to scan automatically.
                </p>
              )}
            </div>
          )}

          {/* UPLOAD IMAGE TAB */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="modal-image-upload-input"
              />

              {!imagePreviewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-50/80 shadow-md scale-[1.01]"
                      : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-xs">
                    <Upload className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Drop QR / Barcode image here, or{" "}
                      <span className="text-indigo-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Supports JPG, JPEG, PNG, WebP image formats
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-gray-400 font-medium">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">QR Code</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">Code 128</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">Code 39</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">EAN-13</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">UPC-A</span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900/5 p-4 flex flex-col items-center justify-center gap-3">
                  <div className="relative max-h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded QR Code or Barcode"
                      className="max-h-44 object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full text-xs text-gray-600 font-medium px-1">
                    <span className="truncate max-w-[220px]">
                      {selectedFile ? selectedFile.name : "Uploaded Image"}
                    </span>
                    <button
                      onClick={resetImageState}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <X className="h-3.5 w-3.5" /> Remove / Select Other
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Error Alert */}
              {uploadError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 animate-shake">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    Unreadable or Invalid Image
                  </div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">
                    {uploadError}
                  </p>
                </div>
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

          {/* LOADING / DECODING INDICATOR */}
          {(isDecodingImage || isSearching) && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-600">
              <RefreshCw className="h-7 w-7 animate-spin" />
              <p className="text-xs font-bold text-gray-700">
                {isDecodingImage ? "Decoding QR Code / Barcode from image..." : "Retrieving product record from database..."}
              </p>
            </div>
          )}

          {/* RESULT CARD - MATCH FOUND */}
          {scanResult.success && scanResult.product && (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Match Found
                  </span>
                  {scanResult.codeType && (
                    <Badge variant="indigo" size="sm">
                      {scanResult.codeType}
                    </Badge>
                  )}
                </div>
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
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500 font-medium shrink-0">
          <span>Supported: QR Code, Code 128, Code 39, EAN, UPC, ITF, Codabar</span>
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

