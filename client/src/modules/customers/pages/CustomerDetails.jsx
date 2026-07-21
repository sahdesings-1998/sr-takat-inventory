import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, AlertCircle } from "lucide-react";
import { useCustomer } from "../hooks/useCustomers";
import { useToast } from "@/contexts/ToastContext";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { SkeletonDetailCard, Skeleton } from "@/components/ui/Skeleton";

export default function CustomerDetails() {
  const { id } = useParams();
  const { customer, history, isLoading, isError } = useCustomer(id);
  const { showError } = useToast();

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to load customer information.");
    }
  }, [isError, showError]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Back link + header skeleton */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-52 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-[20px]" />
          <Skeleton className="h-24 rounded-[20px]" />
        </div>
        {/* Detail card */}
        <SkeletonDetailCard rows={8} cols={2} />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to load customer information.
      </div>
    );
  }

  const { totalBusiness = 0, outstandingAmount = 0, sales = [], memos = [] } = history || {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">{customer.fullName}</h1>
            <p className="text-sm text-gray-500">{customer.companyName || "No Company Specified"}</p>
          </div>
          <Badge variant={customer.status === "active" ? "success" : "neutral"}>
            {customer.status}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex items-center p-6 gap-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Business</p>
            <p className="text-2xl font-bold text-gray-900">
              $
              {totalBusiness.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </Card>

        <Card className="flex items-center p-6 gap-4">
          <div className="rounded-xl bg-danger/10 p-3 text-danger">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Outstanding Invoices</p>
            <p className="text-2xl font-bold text-gray-900">
              $
              {outstandingAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{customer.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{customer.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{customer.address || "No Address Provided"}</span>
            </div>
            {customer.notes && (
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-700 mb-1">Notes</p>
                <p className="text-gray-500 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Transaction History (Purchases & Memos) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Sales Invoices ({sales.length})</h2>
            </CardHeader>
            <DataTable
              headers={["Invoice No", "Date", "Total", "Payment Status"]}
              data={sales}
              isLoading={false}
              emptyMessage="No purchases recorded"
              renderRow={(sale) => (
                <tr
                  key={sale._id}
                  className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary text-xs sm:text-sm">{sale.invoiceNo}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 font-semibold whitespace-nowrap text-xs sm:text-sm">
                    ${sale.total.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6">
                    <Badge
                      variant={
                        sale.paymentStatus === "Paid"
                          ? "success"
                          : sale.paymentStatus === "Partially Paid"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {sale.paymentStatus}
                    </Badge>
                  </td>
                </tr>
              )}
            />
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 text-primary">Memos Released ({memos.length})</h2>
            </CardHeader>
            <DataTable
              headers={["Memo No", "Issue Date", "Return Date", "Status"]}
              data={memos}
              isLoading={false}
              emptyMessage="No memos recorded"
              renderRow={(memo) => (
                <tr
                  key={memo._id}
                  className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary text-xs sm:text-sm">{memo.memoNo}</td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                    {new Date(memo.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                    {new Date(memo.expectedReturn).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-4 sm:px-4 md:px-6">
                    <Badge
                      variant={
                        memo.status === "With Client"
                          ? "warning"
                          : memo.status === "Overdue"
                            ? "danger"
                            : "success"
                      }
                    >
                      {memo.status}
                    </Badge>
                  </td>
                </tr>
              )}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
