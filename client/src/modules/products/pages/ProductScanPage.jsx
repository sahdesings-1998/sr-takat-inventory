import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  QrCode,
  Barcode,
  Upload,
  AlertTriangle,
  ArrowLeft,
  Package,
  RefreshCw,
  Search,
  Camera,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Card, { CardBody } from "@/components/ui/Card";
import productsApi from "../api/productsApi";
import CodeScannerModal from "../components/CodeScannerModal";

export default function ProductScanPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(!!code);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(!code);

  useEffect(() => {
    if (!code) {
      setIsScannerOpen(true);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    productsApi
      .scanCode(code)
      .then((res) => {
        if (!isMounted) return;
        const product = res.data?.product || res.data;
        if (product && product._id) {
          showSuccess("Product Found", `Identified "${product.name || product.stockNo}"`);
          navigate(`/products/${product._id}`, { replace: true });
        } else {
          setErrorMsg(`Could not resolve product details for code: "${code}"`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("[ProductScanPage] Lookup Error:", err);
        const msg =
          err?.response?.data?.message ||
          `Invalid or unknown QR code / barcode: "${code}"`;
        setErrorMsg(msg);
        showError("Scan Failed", msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [code, navigate, showError, showSuccess]);

  return (
    <div className="page-container max-w-4xl mx-auto space-y-6 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products Catalog
        </Link>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsScannerOpen(true)}
          icon={<QrCode className="h-4 w-4" />}
        >
          Open Scanner Hub
        </Button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <Card>
          <CardBody className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Scanning Code...</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Searching product catalog for code: <strong className="text-gray-800">{code}</strong>
              </p>
            </div>
          </CardBody>
        </Card>
      ) : errorMsg ? (
        <Card className="border-rose-200 bg-rose-50/30">
          <CardBody className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-gray-900">Scanned Product Not Available</h3>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">{errorMsg}</p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/products")}
                icon={<Package className="h-4 w-4" />}
              >
                Go to Products List
              </Button>

              <Button
                variant="primary"
                onClick={() => setIsScannerOpen(true)}
                icon={<Search className="h-4 w-4" />}
              >
                Try Another Code
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
                <Sparkles className="h-3.5 w-3.5" /> Comprehensive Code Scanner
              </div>
              <h2 className="text-2xl font-bold tracking-tight">QR Code & Barcode Scanner</h2>
              <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                Scan product labels using your device camera, upload an image file (JPG, PNG, WebP) containing a QR code or barcode, or connect a hardware USB scanner.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsScannerOpen(true)}
              icon={<QrCode className="h-5 w-5" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
            >
              Start Scanner Modal
            </Button>
          </div>

          {/* Quick Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Camera Option */}
            <Card
              className="hover:border-indigo-300 transition-all cursor-pointer group"
              onClick={() => setIsScannerOpen(true)}
            >
              <CardBody className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Camera className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Live Camera Stream</h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                    Scan labels live using your web camera or mobile device camera.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:underline pt-1">
                  Start Camera &rarr;
                </span>
              </CardBody>
            </Card>

            {/* Upload Option */}
            <Card
              className="hover:border-indigo-300 transition-all cursor-pointer group"
              onClick={() => setIsScannerOpen(true)}
            >
              <CardBody className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Upload Code Image</h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                    Upload image files (JPG, PNG, WebP) with QR or Barcodes (Code 128, EAN, UPC, etc.).
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:underline pt-1">
                  Upload Image &rarr;
                </span>
              </CardBody>
            </Card>

            {/* Manual / USB Option */}
            <Card
              className="hover:border-indigo-300 transition-all cursor-pointer group"
              onClick={() => setIsScannerOpen(true)}
            >
              <CardBody className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Barcode className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Manual / Hardware Input</h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                    Use USB barcode handheld guns or type SKU, Stock #, or Product ID.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:underline pt-1">
                  Type / USB Scan &rarr;
                </span>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Global Scanner Modal */}
      <CodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

