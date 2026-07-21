import { ShoppingBag, UserCircle, Package } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
  "On Consignment": "warning",
  "On Memo": "info",
  Reserved: "warning",
};

export default function TabSales({ product }) {
  const hasSalesData = [
    product?.sellingStatus,
    product?.customer,
    product?.salesperson,
    product?.lastSellingPrice,
    product?.salesPaymentStatus,
    product?.consignmentStatus,
  ].some(hasValue);

  if (!hasSalesData) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No Sales Record</p>
            <p className="text-xs text-gray-400 max-w-xs">
              This product has not been sold yet. Sales information will appear here once a transaction is recorded.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const statusVariant = SELLING_STATUS_VARIANT[product?.sellingStatus] || "neutral";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 pl-3 border-l-[3px] border-emerald-400/60 text-emerald-600">
            <ShoppingBag className="h-4 w-4" />
            <h3 className="font-semibold text-gray-900 text-sm">Sales Information</h3>
          </div>
          {product?.sellingStatus && (
            <Badge variant={statusVariant}>{product.sellingStatus}</Badge>
          )}
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Selling Status" value={product?.sellingStatus} />
            <Field label="Last Selling Price" value={product?.lastSellingPrice} />
            <Field label="Last Sold Date" value={product?.lastSoldDate?.slice(0, 10)} />
            <Field label="Sales Payment Status" value={product?.salesPaymentStatus} />
            <Field label="Consignment Status" value={product?.consignmentStatus} />
          </div>
        </CardBody>
      </Card>

      {(hasValue(product?.customer) || hasValue(product?.salesperson)) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 pl-3 border-l-[3px] border-sky-400/60 text-sky-600">
              <UserCircle className="h-4 w-4" />
              <h3 className="font-semibold text-gray-900 text-sm">Customer & Salesperson</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Customer" value={product?.customer} />
              <Field label="Salesperson" value={product?.salesperson} />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
