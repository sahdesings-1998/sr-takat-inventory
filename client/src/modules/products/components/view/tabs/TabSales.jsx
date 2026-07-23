import { ShoppingBag, UserCircle, Package, Calendar, ArrowRight, FileText } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import TableActionButton from "@/components/ui/TableActionButton";
import { Link } from "react-router-dom";

function hasValue(val) {
  return val !== null && val !== undefined && val !== "" && val !== 0;
}

function Field({ label, value }) {
  if (!hasValue(value)) return null;
  const display = typeof value === "number" ? `$${value.toLocaleString()}` : String(value);
  return (
    <div className="group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800">{display}</span>
    </div>
  );
}

const SELLING_STATUS_VARIANT = {
  Sold: "danger",
  Available: "success",
  "In Stock": "success",
  "On Consignment": "warning",
  "On Memo": "info",
  Reserved: "warning",
};

export default function TabSales({ product, salesHistory = [] }) {
  const remQty = Number(product?.quantity ?? 0);
  const soldQty = Number(product?.soldQuantity ?? 0);
  const origQty = Number(product?.originalQuantity || (remQty + soldQty) || remQty);

  const statusVariant = SELLING_STATUS_VARIANT[product?.status || product?.sellingStatus] || "neutral";

  return (
    <div className="space-y-5">
      {/* 1. Stock Quantity & Sales Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-emerald-500/60 text-emerald-600">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Product Stock & Sales Quantity Breakdown</h3>
          </div>
          <Badge variant={remQty > 0 ? "success" : "danger"}>
            {remQty > 0 ? `${remQty} Units Available` : "Sold Out"}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Original Stock Quantity</span>
              <span className="text-2xl font-extrabold text-sky-950 font-mono">{origQty} <span className="text-xs text-sky-700 font-normal">pcs</span></span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Quantity Sold</span>
              <span className="text-2xl font-extrabold text-amber-950 font-mono">{soldQty} <span className="text-xs text-amber-700 font-normal">pcs</span></span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Remaining Stock Quantity</span>
              <span className="text-2xl font-extrabold text-emerald-950 font-mono">{remQty} <span className="text-xs text-emerald-700 font-normal">pcs</span></span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs font-medium text-gray-700">
            <span className="font-bold text-gray-900">Remaining Stock Formula:</span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">{origQty} Original</span>
              <span>−</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{soldQty} Sold</span>
              <span>=</span>
              <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded font-extrabold">{remQty} Remaining</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Detailed Linked Sales History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-amber-500/60 text-amber-600">
            <ShoppingBag className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Product Sales History ({salesHistory.length})</h3>
          </div>
        </CardHeader>
        <CardBody className="p-0 sm:p-0">
          {salesHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">No Recorded Sales Yet</p>
              <p className="text-xs text-gray-400 max-w-xs">
                When this product is sold in a sales invoice, the transaction history and quantity deduction will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Quantity Sold</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{item.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.customerName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-700 text-right">{item.quantity} pcs</td>
                      <td className="px-4 py-3 font-mono text-gray-700 text-right">${(item.sellingPrice || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-right">${(item.totalPrice || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.paymentStatus === "Paid" ? "success" : item.paymentStatus === "Partially Paid" ? "warning" : "neutral"}>
                          {item.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 3. General Sales Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-sky-400/60 text-sky-600">
            <UserCircle className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Last Sales Transaction Attributes</h3>
          </div>
          {product?.status && (
            <Badge variant={statusVariant}>{product.status}</Badge>
          )}
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Selling Status" value={product?.sellingStatus || product?.status} />
            <Field label="Last Selling Price" value={product?.lastSellingPrice} />
            <Field label="Last Sold Date" value={product?.lastSoldDate?.slice(0, 10)} />
            <Field label="Customer" value={product?.customer} />
            <Field label="Salesperson" value={product?.salesperson} />
            <Field label="Sales Payment Status" value={product?.salesPaymentStatus} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
