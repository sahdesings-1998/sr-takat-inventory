import { Truck, AlertCircle } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function hasValue(val) {
  return val !== null && val !== undefined && val !== "" && val !== 0;
}

function Field({ label, value, fullWidth }) {
  if (!hasValue(value)) return null;
  return (
    <div className={`group p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 ${fullWidth ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="block mt-1 text-sm font-semibold text-gray-800 break-words">{typeof value === "number" ? value.toLocaleString() : String(value)}</span>
    </div>
  );
}

const PAYMENT_VARIANT = {
  Paid: "success",
  Partial: "warning",
  Unpaid: "danger",
  Pending: "warning",
};

export default function TabSupplier({ product }) {
  const hasOutstanding = product?.outstandingAmount > 0;
  const paymentVariant = PAYMENT_VARIANT[product?.paymentStatus] || "neutral";

  return (
    <div className="space-y-5">
      {/* Outstanding Alert */}
      {hasOutstanding && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Outstanding Balance</p>
            <p className="text-xs text-amber-600">
              ${product.outstandingAmount?.toLocaleString()} remaining unpaid to supplier.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-purple-400/60 text-purple-600">
            <Truck className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Supplier & Acquisition Details</h3>
          </div>
          {product?.paymentStatus && (
            <Badge variant={paymentVariant}>{product.paymentStatus}</Badge>
          )}
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Supplier / Vendor" value={product?.supplier} />
            <Field label="Supplier Reference" value={product?.supplierReference} />
            <Field label="Purchase Date" value={product?.purchaseDate?.slice(0, 10)} />
            <Field label="Purchase Invoice #" value={product?.purchaseInvoice} />
            <Field label="Payment Status" value={product?.paymentStatus} />
            {hasOutstanding && (
              <Field label="Outstanding Amount" value={`$${product?.outstandingAmount?.toLocaleString()}`} />
            )}
            {product?.supplierNotes && (
              <Field label="Supplier Notes" value={product?.supplierNotes} fullWidth />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
