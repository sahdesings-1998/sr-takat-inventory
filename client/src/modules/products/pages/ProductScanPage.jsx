import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  QrCode,
  Barcode,
  AlertTriangle,
  ArrowLeft,
  Package,
  RefreshCw,
  Search,
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
    <div className="page-container max-w-3xl mx-auto space-y-6 py-8">
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
          Open Scanner
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
        <Card>
          <CardBody className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Barcode className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">QR Code & Barcode System</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Use your device camera or USB barcode reader to scan any product label or sticker in real time.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsScannerOpen(true)}
              icon={<QrCode className="h-5 w-5" />}
              className="mt-2"
            >
              Start Camera / USB Scanner
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Global Scanner Modal */}
      <CodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
