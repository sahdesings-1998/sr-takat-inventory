import { useState, useMemo } from "react";
import {
  QrCode,
  Barcode,
  Copy,
  Download,
  Printer,
  Edit3,
  Check,
  RefreshCw,
  Sparkles,
  Tag,
  Save,
  X,
  Eye,
  Maximize2,
  Package,
} from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import {
  generateBarcodeSVGData,
  generateQRCodeSVGData,
  downloadSVGFile,
  downloadSVGAsPNG,
} from "@/modules/products/utils/codeGenerators";

export default function TabQrBarcode({ product, updateProduct, isUpdating }) {
  const { showSuccess, showError } = useToast();

  const [copiedField, setCopiedField] = useState(null);
  const [isEditingCodes, setIsEditingCodes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qrSize, setQrSize] = useState(220); // 160, 220, 280

  // Preview Modals
  const [viewBarcodeModalOpen, setViewBarcodeModalOpen] = useState(false);
  const [viewQrModalOpen, setViewQrModalOpen] = useState(false);

  // Derived effective values
  const defaultBarcode = useMemo(() => {
    if (product?.barcode) return product.barcode;
    const cleanStock = (product?.stockNo || "10001").replace(/\D/g, "").padStart(9, "0");
    return `890${cleanStock}`;
  }, [product]);

  const defaultQrCode = useMemo(() => {
    if (product?.qrCode) return product.qrCode;
    // Format full scan URL or unique QR payload
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanCode = product?.stockNo || product?.productCode || product?._id || "10001";
    return `${origin}/products/scan/${cleanCode}`;
  }, [product]);

  const [editBarcode, setEditBarcode] = useState(defaultBarcode);
  const [editQrCode, setEditQrCode] = useState(defaultQrCode);

  const barcodeValue = product?.barcode || defaultBarcode;
  const qrCodeValue = product?.qrCode || defaultQrCode;

  // Generate SVG strings
  const barcodeSVGString = useMemo(() => {
    return generateBarcodeSVGData(barcodeValue, { width: 340, height: 95, showText: true });
  }, [barcodeValue]);

  const barcodeSVGStringLarge = useMemo(() => {
    return generateBarcodeSVGData(barcodeValue, { width: 500, height: 160, showText: true });
  }, [barcodeValue]);

  const qrCodeSVGString = useMemo(() => {
    return generateQRCodeSVGData(qrCodeValue, { size: qrSize, fgColor: "#1e1b4b" });
  }, [qrCodeValue, qrSize]);

  const qrCodeSVGStringLarge = useMemo(() => {
    return generateQRCodeSVGData(qrCodeValue, { size: 360, fgColor: "#1e1b4b" });
  }, [qrCodeValue]);

  // Copy helper
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showSuccess("Copied", `${fieldName} copied to clipboard.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Download handlers
  const handleDownloadBarcodeSVG = () => {
    const filename = `barcode_${product?.stockNo || "product"}.svg`;
    downloadSVGFile(barcodeSVGString, filename);
    showSuccess("Downloaded", `Downloaded ${filename}`);
  };

  const handleDownloadBarcodePNG = () => {
    const filename = `barcode_${product?.stockNo || "product"}.png`;
    downloadSVGAsPNG(barcodeSVGString, filename, 680, 190);
    showSuccess("Downloaded", `Downloaded ${filename}`);
  };

  const handleDownloadQrSVG = () => {
    const filename = `qrcode_${product?.stockNo || "product"}.svg`;
    downloadSVGFile(qrCodeSVGString, filename);
    showSuccess("Downloaded", `Downloaded ${filename}`);
  };

  const handleDownloadQrPNG = () => {
    const filename = `qrcode_${product?.stockNo || "product"}.png`;
    downloadSVGAsPNG(qrCodeSVGString, filename, 600, 600);
    showSuccess("Downloaded", `Downloaded ${filename}`);
  };

  // Print helper
  const handlePrintLabel = () => {
    window.print();
  };

  // Quick Save Codes
  const handleSaveCodes = async (e) => {
    e.preventDefault();
    if (!updateProduct) {
      showError("Error", "Product update function not available.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct({
        barcode: editBarcode.trim(),
        qrCode: editQrCode.trim(),
      });
      showSuccess("Codes Updated", "Barcode and QR Code values updated successfully.");
      setIsEditingCodes(false);
    } catch (err) {
      console.error("[CodesUpdate] Failed to save code values:", err);
      showError("Update Failed", err?.response?.data?.message || "Failed to update code values.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateDefaults = () => {
    const cleanStock = (product?.stockNo || "10001").replace(/\D/g, "").padStart(9, "0");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanCode = product?.stockNo || product?.productCode || product?._id || "10001";

    setEditBarcode(`890${cleanStock}`);
    setEditQrCode(`${origin}/products/scan/${cleanCode}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l-[3px] border-indigo-500 text-indigo-600">
                <QrCode className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">QR Code & Barcode Tracking</h3>
                  <p className="text-xs text-gray-500">
                    High-resolution vector barcodes, QR code matrices, and printable inventory tags.
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 print:hidden shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintLabel}
                icon={<Printer className="h-4 w-4" />}
                className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                Print Label / Tag
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditBarcode(barcodeValue);
                  setEditQrCode(qrCodeValue);
                  setIsEditingCodes(!isEditingCodes);
                }}
                icon={isEditingCodes ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              >
                {isEditingCodes ? "Cancel Edit" : "Edit Code Values"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Edit Codes Form Drawer */}
        {isEditingCodes && (
          <CardBody className="bg-indigo-50/40 border-t border-indigo-100 p-5">
            <form onSubmit={handleSaveCodes} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Custom Code Configuration
                </p>
                <button
                  type="button"
                  onClick={handleRegenerateDefaults}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Auto-Generate System Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Barcode Number / Code128"
                  placeholder="e.g. 890000090001"
                  value={editBarcode}
                  onChange={(e) => setEditBarcode(e.target.value)}
                  leftIcon={<Barcode className="h-4 w-4 text-gray-400" />}
                />

                <Input
                  label="QR Code Payload / Target URL"
                  placeholder="e.g. https://domain.com/products/scan/10001"
                  value={editQrCode}
                  onChange={(e) => setEditQrCode(e.target.value)}
                  leftIcon={<QrCode className="h-4 w-4 text-gray-400" />}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingCodes(false)}
                  disabled={isSaving || isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving || isUpdating}
                  icon={<Save className="h-3.5 w-3.5" />}
                >
                  Save Code Values
                </Button>
              </div>
            </form>
          </CardBody>
        )}
      </Card>

      {/* Main Grid: Barcode & QR Code Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        {/* BARCODE CARD */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                <Barcode className="h-4 w-4 text-indigo-600" />
                Product Barcode (Code 128)
              </div>
              <Badge variant="primary">Code 128</Badge>
            </div>
          </CardHeader>

          <CardBody className="space-y-5 flex-1 flex flex-col justify-between">
            {/* Visual Barcode Display */}
            <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-inner flex flex-col items-center justify-center min-h-[160px] relative group cursor-pointer"
                 onClick={() => setViewBarcodeModalOpen(true)}>
              <div
                className="w-full max-w-[340px] h-[95px] flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: barcodeSVGString }}
              />
              <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-white text-gray-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-600" /> Zoom View
                </span>
              </div>
            </div>

            {/* Code Details & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Barcode Value</span>
                  <span className="block text-sm font-mono font-bold text-gray-900 mt-0.5">{barcodeValue}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(barcodeValue, "Barcode")}
                  icon={copiedField === "Barcode" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                >
                  {copiedField === "Barcode" ? "Copied" : "Copy"}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewBarcodeModalOpen(true)}
                  icon={<Eye className="h-3.5 w-3.5" />}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBarcodeSVG}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBarcodePNG}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  PNG
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* QR CODE CARD */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                <QrCode className="h-4 w-4 text-indigo-600" />
                Product QR Code
              </div>

              {/* QR Size Selector */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                {[
                  { label: "S", size: 160 },
                  { label: "M", size: 220 },
                  { label: "L", size: 280 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setQrSize(item.size)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${qrSize === item.size
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardBody className="space-y-5 flex-1 flex flex-col justify-between">
            {/* Visual QR Code Display */}
            <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-inner flex flex-col items-center justify-center min-h-[160px] relative group cursor-pointer"
                 onClick={() => setViewQrModalOpen(true)}>
              <div
                style={{ width: `${Math.min(qrSize, 240)}px`, height: `${Math.min(qrSize, 240)}px` }}
                className="flex items-center justify-center transition-all duration-300"
                dangerouslySetInnerHTML={{ __html: qrCodeSVGString }}
              />
              <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-white text-gray-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-600" /> Zoom View
                </span>
              </div>
            </div>

            {/* Code Details & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="min-w-0 pr-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">QR Payload / URL</span>
                  <span className="block text-sm font-mono font-bold text-gray-900 truncate mt-0.5">{qrCodeValue}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(qrCodeValue, "QR Code Payload")}
                  icon={copiedField === "QR Code Payload" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                >
                  {copiedField === "QR Code Payload" ? "Copied" : "Copy"}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewQrModalOpen(true)}
                  icon={<Eye className="h-3.5 w-3.5" />}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQrSVG}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQrPNG}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  PNG
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* PRODUCT STICKER / TAG PREVIEW (Visible on screen and optimized for PRINT) */}
      <Card className="overflow-hidden">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <Tag className="h-4 w-4 text-amber-500" />
              Printable Product Tag / Sticker Preview
            </div>
            <Badge variant="warning">Print Ready</Badge>
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-gray-50/50 flex flex-col items-center justify-center">
          {/* Printable Tag Box */}
          <div
            id="product-printable-tag"
            className="w-full max-w-lg bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-sm font-black uppercase tracking-widest text-indigo-900 block">SR-TAKAT</span>
                <span className="text-[10px] font-semibold text-gray-500 block uppercase">Jewellery & Gemstone Inventory</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-700 block">{product?.category || "Product"}</span>
                {product?.sellingPrice > 0 && (
                  <span className="text-base font-extrabold text-indigo-600 block">
                    ${product.sellingPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Product Image & Main Specs */}
            <div className="flex items-start gap-4">
              {product?.imageUrls && product.imageUrls[0] ? (
                <img
                  src={product.imageUrls[0]}
                  alt={product.name}
                  className="h-20 w-20 object-cover rounded-xl border border-gray-200 shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 shrink-0">
                  <Package className="h-10 w-10" />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-bold text-gray-900 leading-tight">{product?.name || "Unnamed Product"}</h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-medium text-gray-600">
                  <div>Stock #: <strong className="text-gray-900">{product?.stockNo || "N/A"}</strong></div>
                  <div>SKU: <strong className="text-gray-900">{product?.sku || "N/A"}</strong></div>
                  {product?.material && <div>Material: <strong className="text-gray-900">{product.material}</strong></div>}
                  {product?.metalType && <div>Metal: <strong className="text-gray-900">{product.metalType}</strong></div>}
                  {product?.gemstoneType && <div>Gem: <strong className="text-gray-900">{product.gemstoneType}</strong></div>}
                  {product?.totalCarat > 0 && <div>Carat: <strong className="text-gray-900">{product.totalCarat} ct</strong></div>}
                  <div>Stock Qty: <strong className="text-gray-900">{product?.quantity ?? product?.stockQuantity ?? 1}</strong></div>
                  <div>Status: <strong className="text-emerald-700">{product?.status || "Available"}</strong></div>
                </div>
              </div>
            </div>

            {/* Codes Layout */}
            <div className="grid grid-cols-3 gap-3 items-center pt-3 border-t border-gray-200">
              {/* Barcode column */}
              <div className="col-span-2 flex flex-col items-center">
                <div
                  className="w-full h-[70px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateBarcodeSVGData(barcodeValue, { width: 240, height: 70, showText: true }),
                  }}
                />
              </div>

              {/* QR Code column */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="w-[80px] h-[80px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateQRCodeSVGData(qrCodeValue, { size: 80, fgColor: "#1e1b4b" }),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 print:hidden">
            <Printer className="h-3.5 w-3.5" /> Click "Print Label / Tag" above to print standard 4x2 inch tags or custom stickers.
          </div>
        </CardBody>
      </Card>

      {/* VIEW BARCODE MODAL */}
      {viewBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in"
             onClick={() => setViewBarcodeModalOpen(false)}>
          <div className="relative bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-gray-100"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
                <Barcode className="h-5 w-5 text-indigo-600" /> Product Barcode View
              </div>
              <button
                onClick={() => setViewBarcodeModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-800 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center">
              <div
                className="w-full max-w-[440px] h-[140px] flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: barcodeSVGStringLarge }}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono font-bold text-gray-900">
              <span>Code 128: {barcodeValue}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(barcodeValue, "Barcode")}
                icon={copiedField === "Barcode" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
              >
                {copiedField === "Barcode" ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadBarcodeSVG}
                icon={<Download className="h-4 w-4" />}
                className="flex-1"
              >
                Download SVG
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadBarcodePNG}
                icon={<Download className="h-4 w-4" />}
                className="flex-1"
              >
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW QR CODE MODAL */}
      {viewQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in"
             onClick={() => setViewQrModalOpen(false)}>
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-gray-100"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
                <QrCode className="h-5 w-5 text-indigo-600" /> Product QR Code View
              </div>
              <button
                onClick={() => setViewQrModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-800 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center">
              <div
                className="w-[280px] h-[280px] flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrCodeSVGStringLarge }}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono font-bold text-gray-900 truncate">
              Payload: {qrCodeValue}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadQrSVG}
                icon={<Download className="h-4 w-4" />}
                className="flex-1"
              >
                Download SVG
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadQrPNG}
                icon={<Download className="h-4 w-4" />}
                className="flex-1"
              >
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Print Mode */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #product-printable-tag, #product-printable-tag * {
            visibility: visible;
          }
          #product-printable-tag {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
