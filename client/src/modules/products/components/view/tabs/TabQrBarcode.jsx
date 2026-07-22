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
  Layers,
  Save,
  X,
  ExternalLink,
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

  // Derived effective values
  const defaultBarcode = useMemo(() => {
    if (product?.barcode) return product.barcode;
    const cleanStock = (product?.stockNo || "10001").replace(/\D/g, "").padStart(9, "0");
    return `890${cleanStock}`;
  }, [product]);

  const defaultQrCode = useMemo(() => {
    if (product?.qrCode) return product.qrCode;
    return `QR-STK-${product?.stockNo || product?.productCode || "10001"}`;
  }, [product]);

  const [editBarcode, setEditBarcode] = useState(defaultBarcode);
  const [editQrCode, setEditQrCode] = useState(defaultQrCode);

  const barcodeValue = product?.barcode || defaultBarcode;
  const qrCodeValue = product?.qrCode || defaultQrCode;

  // Generate SVG strings
  const barcodeSVGString = useMemo(() => {
    return generateBarcodeSVGData(barcodeValue, { width: 340, height: 95, showText: true });
  }, [barcodeValue]);

  const qrCodeSVGString = useMemo(() => {
    return generateQRCodeSVGData(qrCodeValue, { size: qrSize, fgColor: "#1e1b4b" });
  }, [qrCodeValue, qrSize]);

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
    setEditBarcode(`890${cleanStock}`);
    setEditQrCode(`QR-STK-${product?.stockNo || product?.productCode || "10001"}`);
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
                  label="QR Code Payload / Text"
                  placeholder="e.g. QR-STK-10001"
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

          <CardBody className="space-y-0 flex-1 flex flex-col justify-between">
            {/* Visual Barcode Display */}
            <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-inner flex flex-col items-center justify-center min-h-[160px]">
              <div
                className="w-full max-w-[340px] h-[95px] flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: barcodeSVGString }}
              />
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

              {/* Downloads */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBarcodeSVG}
                  icon={<Download className="h-3.5 w-3.5" />}
                  className="flex-1"
                >
                  Download SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBarcodePNG}
                  icon={<Download className="h-3.5 w-3.5" />}
                  className="flex-1"
                >
                  Download PNG
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

          <CardBody className="space-y-0 flex-1 flex flex-col justify-between">
            {/* Visual QR Code Display */}
            <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-inner flex flex-col items-center justify-center min-h-[160px]">
              <div
                style={{ width: `${Math.min(qrSize, 240)}px`, height: `${Math.min(qrSize, 240)}px` }}
                className="flex items-center justify-center transition-all duration-300"
                dangerouslySetInnerHTML={{ __html: qrCodeSVGString }}
              />
            </div>

            {/* Code Details & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="min-w-0 pr-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">QR Payload</span>
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

              {/* Downloads */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQrSVG}
                  icon={<Download className="h-3.5 w-3.5" />}
                  className="flex-1"
                >
                  Download SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQrPNG}
                  icon={<Download className="h-3.5 w-3.5" />}
                  className="flex-1"
                >
                  Download PNG
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
            className="w-full max-w-md bg-white border-2 border-dashed border-gray-300 rounded-2xl p-5 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-900 block">SR-TAKAT</span>
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">Jewelry & Gemstones</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-700 block">{product?.category || "Item"}</span>
                {product?.sellingPrice > 0 && (
                  <span className="text-sm font-extrabold text-indigo-600 block">
                    ${product.sellingPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 leading-tight">{product?.name || "Unnamed Product"}</h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-500">
                {product?.stockNo && <span>Stock: <strong className="text-gray-800">{product.stockNo}</strong></span>}
                {product?.sku && <span>| SKU: <strong className="text-gray-800">{product.sku}</strong></span>}
              </div>
            </div>

            {/* Codes Layout */}
            <div className="grid grid-cols-3 gap-3 items-center pt-2 border-t border-gray-100">
              {/* Barcode column */}
              <div className="col-span-2 flex flex-col items-center">
                <div
                  className="w-full h-[65px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateBarcodeSVGData(barcodeValue, { width: 220, height: 65, showText: true }),
                  }}
                />
              </div>

              {/* QR Code column */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="w-[75px] h-[75px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateQRCodeSVGData(qrCodeValue, { size: 75, fgColor: "#1e1b4b" }),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 print:hidden">
            <Printer className="h-3.5 w-3.5" /> Click "Print Label / Tag" above to send this label directly to your label printer.
          </div>
        </CardBody>
      </Card>

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
