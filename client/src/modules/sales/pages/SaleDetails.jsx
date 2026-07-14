import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useSale } from "../hooks/useSales";
import { useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

export default function SaleDetails() {
  const { id } = useParams();
  const { sale, items, isLoading, isError } = useSale(id);
  const { showError } = useToast();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch sales invoice details.");
    }
  }, [isError, showError]);

  if (isLoading) return <div className="text-gray-500 text-sm p-6">Loading invoice details...</div>;
  if (isError || !sale)
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch sales invoice details.
      </div>
    );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <Button onClick={handlePrint} variant="outline" className="w-fit">
          <Printer className="h-4 w-4" /> Print Invoice
        </Button>
      </div>

      {/* Invoice Sheet */}
      <div
        className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-8 print:border-none print:shadow-none"
        id="invoice-sheet"
      >
        {/* Invoice Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-display">SR TAKAT</h2>
            <p className="text-xs text-gray-500 font-medium">Fine Gemstones & Custom Jewelry</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-primary">RETAIL INVOICE</h3>
            <p className="text-sm text-gray-600 font-semibold">{sale.invoiceNo}</p>
          </div>
        </div>

        {/* Billed To / Date Grid */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Billed To
            </p>
            <p className="mt-1 font-bold text-gray-950">{sale.customerId?.fullName || "—"}</p>
            {sale.customerId?.address && (
              <p className="text-xs text-gray-500 mt-0.5">{sale.customerId.address}</p>
            )}
            {sale.customerId?.phone && (
              <p className="text-xs text-gray-500">{sale.customerId.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Invoice Details
            </p>
            <p className="mt-1 text-gray-600">
              Date:{" "}
              <span className="font-semibold text-gray-900">
                {new Date(sale.createdAt).toLocaleDateString()}
              </span>
            </p>
            <p className="text-gray-600">
              Payment: <Badge variant="success" className="ml-1">{sale.paymentStatus}</Badge>
            </p>
            <p className="text-gray-600">
              Method: <span className="font-semibold text-gray-900">{sale.paymentMethod}</span>
            </p>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="border-t border-gray-100 pt-6">
          <DataTable
            headers={["Item details", "Unit Price", "Qty", "Total"]}
            data={items}
            renderRow={(row, idx) => (
              <tr key={idx} className="border-b border-gray-100 text-sm">
                <td className="px-6 py-4 font-semibold text-gray-950">
                  {row.inventoryType === "Product"
                    ? row.inventoryId?.name || "Product Item"
                    : row.inventoryId?.gemstone || "Gemstone Item"}
                </td>
                <td className="px-6 py-4 text-gray-600">${row.sellingPrice.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-900 font-medium">{row.quantity}</td>
                <td className="px-6 py-4 text-gray-950 font-bold">
                  ${(row.sellingPrice * row.quantity).toLocaleString()}
                </td>
              </tr>
            )}
          />
        </div>

        {/* Invoice Summary Block */}
        <div className="flex justify-between items-start border-t border-gray-100 pt-6">
          <div className="max-w-md text-xs text-gray-500">
            {sale.notes && (
              <div className="mb-4">
                <span className="font-semibold text-gray-700 block mb-1">Invoice Notes:</span>
                <p>{sale.notes}</p>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-100/50 p-4 rounded-xl text-amber-800">
              <span className="font-bold text-amber-900 block mb-0.5">
                Charity Giving Program ({sale.charityPercentage}%)
              </span>
              A gross donation of{" "}
              <span className="font-bold">${sale.charityAmount.toLocaleString()}</span> from this
              transaction has been allocated to our charity fund.
            </div>
          </div>

          <div className="w-64 text-sm flex flex-col gap-2.5 text-right">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900">${sale.subtotal.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-danger">
                <span>Discount:</span>
                <span>-${sale.discount.toLocaleString()}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span className="font-semibold text-gray-900">+{sale.tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-primary border-t border-gray-100 pt-3">
              <span>Total Payable:</span>
              <span>${sale.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
