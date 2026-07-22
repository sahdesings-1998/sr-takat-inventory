import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  AlertCircle,
  CreditCard,
  Paperclip,
  TrendingUp,
  CheckCircle2,
  FileText,
  Gem,
  Package,
  Eye,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useCustomer } from "../hooks/useCustomers";
import { useToast } from "@/contexts/ToastContext";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonDetailCard, Skeleton } from "@/components/ui/Skeleton";
import RecordPaymentModal from "@/modules/sales/components/RecordPaymentModal";

export default function CustomerDetails() {
  const { id } = useParams();
  const { customer, history, isLoading, isError } = useCustomer(id);
  const { showError } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to load customer information.");
    }
  }, [isError, showError]);

  const {
    totalPurchaseAmount = 0,
    totalAmountPaid = 0,
    totalOutstandingBalance = 0,
    sales = [],
    memos = [],
    purchasedProducts = [],
    purchasedGemstones = [],
    outstandingSales = [],
    paymentHistory = [],
  } = history || {};

  // Financial calculations
  const paymentSettlementRatio = useMemo(() => {
    if (totalPurchaseAmount <= 0) return 100;
    return Math.min(100, Math.round((totalAmountPaid / totalPurchaseAmount) * 100));
  }, [totalAmountPaid, totalPurchaseAmount]);

  const handleOpenPayment = (sale) => {
    setSelectedSaleForPayment(sale);
    setIsRecordPaymentOpen(true);
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <SkeletonDetailCard rows={8} cols={2} />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="text-center p-12 bg-white border border-gray-200/80 rounded-2xl text-sm font-semibold text-gray-500 shadow-sm max-w-lg mx-auto my-10 space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <p className="text-base font-bold text-gray-900">Failed to load customer information.</p>
        <Link to="/customers" className="inline-block text-xs font-bold text-primary hover:underline">
          &larr; Return to Customers Directory
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", count: outstandingSales.length > 0 ? `${outstandingSales.length} Due` : null, highlight: outstandingSales.length > 0 },
    { id: "invoices", label: "Sales Invoices", count: sales.length },
    { id: "payments", label: "Payment History", count: paymentHistory.length },
    { id: "inventory", label: "Purchased Items", count: purchasedProducts.length + purchasedGemstones.length },
    { id: "memos", label: "Memos", count: memos.length },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Top Header Navigation & Profile Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <Link
            to="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Customers Directory
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={customer.status === "active" ? "success" : "neutral"}>
              {customer.status?.toUpperCase() || "ACTIVE"}
            </Badge>
            {totalOutstandingBalance > 0 && (
              <Badge variant="danger" className="animate-pulse">
                ${totalOutstandingBalance.toLocaleString()} Due
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display flex items-center gap-2">
              {customer.fullName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
              {customer.companyName ? customer.companyName : "Individual Retail Customer"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {outstandingSales.length > 0 && (
              <Button
                onClick={() => handleOpenPayment(outstandingSales[0])}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 shadow-sm"
              >
                <CreditCard className="h-4 w-4 mr-1.5" /> Record Payment
              </Button>
            )}
          </div>
        </div>

        {/* Quick Contact Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-600 font-medium">
          {customer.phone && (
            <div className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60 max-w-xs truncate">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="truncate max-w-xs">{customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Executive Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Business */}
        <Card className="p-5 border-l-4 border-l-primary bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Business</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-display text-gray-900">
              ${totalPurchaseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-medium text-gray-500 mt-1">
              Across {sales.length} total sales invoices
            </p>
          </div>
        </Card>

        {/* Total Amount Paid */}
        <Card className="p-5 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cash Paid</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-display text-emerald-700">
              ${totalAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-medium text-emerald-800/80 mt-1">
              {paymentHistory.length} logged payment transactions
            </p>
          </div>
        </Card>

        {/* Outstanding Balance */}
        <Card className={`p-5 border-l-4 ${totalOutstandingBalance > 0 ? "border-l-rose-500 bg-rose-50/30" : "border-l-gray-300"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className={`p-2 rounded-xl ${totalOutstandingBalance > 0 ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-500"}`}>
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-bold font-display ${totalOutstandingBalance > 0 ? "text-rose-700" : "text-gray-900"}`}>
              ${totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-medium text-gray-500 mt-1">
              {outstandingSales.length > 0 ? `${outstandingSales.length} invoice(s) pending payment` : "All invoices settled"}
            </p>
          </div>
        </Card>

        {/* Financial Fulfillment Rate */}
        <Card className="p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Fulfillment</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-2xl font-bold font-display text-gray-900">{paymentSettlementRatio}%</p>
              <span className="text-xs font-semibold text-gray-500">Paid Ratio</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${paymentSettlementRatio}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Customer Details & Financial Profile */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer Profile</h2>
            </CardHeader>
            <CardBody className="space-y-4 text-xs text-gray-700">
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Full Name</span>
                <span className="font-bold text-gray-900 text-sm">{customer.fullName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Company</span>
                <span className="font-medium text-gray-800">{customer.companyName || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Customer Type</span>
                <span className="font-bold text-primary">{customer.customerType || "Private Client"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Country</span>
                <span className="font-medium text-gray-800">{customer.country || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Phone Contact</span>
                <span className="font-medium text-gray-800">{customer.phone || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">WhatsApp</span>
                <span className="font-medium text-gray-800">{customer.whatsApp || customer.phone || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Email Address</span>
                <span className="font-medium text-gray-800 break-all">{customer.email || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Billing / Delivery Address</span>
                <span className="font-medium text-gray-800">{customer.address || "No address provided"}</span>
              </div>
              {customer.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[11px] uppercase mb-1">Notes</span>
                  <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200/60 text-xs whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Tabbed Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Controls Bar */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                }`}
              >
                <span>{t.label}</span>
                {t.count !== null && t.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === t.id
                        ? "bg-white/20 text-white"
                        : t.highlight
                        ? "bg-rose-100 text-rose-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: Overview & Outstanding Balances */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Outstanding Balances Banner */}
              {outstandingSales.length > 0 ? (
                <Card className="border-2 border-amber-300 bg-amber-50/30">
                  <CardHeader className="bg-amber-100/60 border-b border-amber-200 flex justify-between items-center py-3">
                    <h2 className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-700" />
                      Active Outstanding Balances ({outstandingSales.length})
                    </h2>
                    <span className="text-xs font-extrabold text-amber-900">
                      Total Due: ${totalOutstandingBalance.toLocaleString()}
                    </span>
                  </CardHeader>
                  <DataTable
                    headers={["Invoice No", "Total Price", "Paid", "Balance Due", "Status", "Action"]}
                    data={outstandingSales}
                    isLoading={false}
                    renderRow={(sale) => {
                      const paid = Number(sale.amountPaid ?? (sale.paymentStatus === "Paid" ? sale.total : 0));
                      const due = Number(sale.balanceDue ?? Math.max(0, sale.total - paid));

                      return (
                        <tr key={sale._id} className="border-b border-amber-100 text-xs sm:text-sm hover:bg-white/80">
                          <td className="px-4 py-3 font-mono font-bold text-primary">{sale.invoiceNo}</td>
                          <td className="px-4 py-3 font-mono text-gray-900 font-bold">${sale.total.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-700 font-bold">${paid.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-rose-700 font-bold font-display">${due.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant={sale.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
                              {sale.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <TableActionButton
                              icon={CreditCard}
                              title="Record Payment"
                              onClick={() => handleOpenPayment(sale)}
                            />
                          </td>
                        </tr>
                      );
                    }}
                  />
                </Card>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 font-medium">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>All customer invoices are fully settled. No outstanding balances pending.</span>
                </div>
              )}

              {/* Recent Sales Invoices Preview */}
              <Card>
                <CardHeader className="flex justify-between items-center py-3">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Recent Sales Invoices
                  </h3>
                  <button
                    onClick={() => setActiveTab("invoices")}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    View All ({sales.length}) <ChevronRight className="h-3 w-3" />
                  </button>
                </CardHeader>
                <DataTable
                  headers={["Invoice No", "Date", "Final Price", "Paid", "Balance Due", "Status", "Action"]}
                  data={sales.slice(0, 5)}
                  isLoading={false}
                  emptyMessage="No sales invoices found for this customer."
                  renderRow={(sale) => {
                    const paid = Number(sale.amountPaid ?? (sale.paymentStatus === "Paid" ? sale.total : 0));
                    const due = Number(sale.balanceDue ?? Math.max(0, sale.total - paid));

                    return (
                      <tr key={sale._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{sale.invoiceNo}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-mono text-gray-900 font-bold">${sale.total.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-emerald-700 font-bold">${paid.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-rose-700 font-bold">${due.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant={sale.paymentStatus === "Paid" ? "success" : sale.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
                            {sale.paymentStatus || "Paid"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {due > 0 && (
                              <TableActionButton
                                icon={CreditCard}
                                title="Record Payment"
                                onClick={() => handleOpenPayment(sale)}
                              />
                            )}
                            <Link to={`/sales/${sale._id}`}>
                              <TableActionButton icon={Eye} title="View Invoice" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  }}
                />
              </Card>
            </div>
          )}

          {/* TAB 2: Sales Invoices */}
          {activeTab === "invoices" && (
            <Card>
              <CardHeader className="py-3">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">All Sales Invoices ({sales.length})</h3>
              </CardHeader>
              <DataTable
                headers={["Invoice No", "Date", "Total Price", "Amount Paid", "Balance Due", "Status", "Actions"]}
                data={sales}
                isLoading={false}
                emptyMessage="No sales invoices found."
                renderRow={(sale) => {
                  const paid = Number(sale.amountPaid ?? (sale.paymentStatus === "Paid" ? sale.total : 0));
                  const due = Number(sale.balanceDue ?? Math.max(0, sale.total - paid));

                  return (
                    <tr key={sale._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                      <td className="px-4 py-3.5 font-mono font-bold text-primary">{sale.invoiceNo}</td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5 font-mono text-gray-900 font-bold">${sale.total.toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono text-emerald-700 font-bold">${paid.toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono text-rose-700 font-bold">${due.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={sale.paymentStatus === "Paid" ? "success" : sale.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
                          {sale.paymentStatus || "Paid"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {due > 0 && (
                            <TableActionButton
                              icon={CreditCard}
                              title="Record Payment"
                              onClick={() => handleOpenPayment(sale)}
                            />
                          )}
                          <Link to={`/sales/${sale._id}`}>
                            <TableActionButton icon={Eye} title="View Invoice" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              />
            </Card>
          )}

          {/* TAB 3: Payment History Ledger */}
          {activeTab === "payments" && (
            <Card>
              <CardHeader className="py-3">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Complete Payment History Ledger ({paymentHistory.length})</h3>
              </CardHeader>
              <DataTable
                headers={["Payment ID", "Invoice No", "Date", "Amount Paid", "Method", "Notes / Ref", "Attachment"]}
                data={paymentHistory}
                isLoading={false}
                emptyMessage="No payment transactions logged for this customer."
                renderRow={(pay) => (
                  <tr key={pay._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{pay.paymentId}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{pay.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">${pay.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{pay.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{pay.notes || "—"}</td>
                    <td className="px-4 py-3">
                      {pay.attachments && pay.attachments.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {pay.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded border border-primary/20"
                              title={att.name}
                            >
                              <Paperclip className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[80px]">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )}
              />
            </Card>
          )}

          {/* TAB 4: Purchased Inventory (Products & Gemstones) */}
          {activeTab === "inventory" && (
            <div className="space-y-5">
              {/* Finished Jewellery Products */}
              <Card>
                <CardHeader className="py-3 flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Purchased Jewellery Products ({purchasedProducts.length})
                  </h3>
                </CardHeader>
                <DataTable
                  headers={["Product Code & Name", "Category", "Qty", "Price Paid", "Invoice", "Date"]}
                  data={purchasedProducts}
                  isLoading={false}
                  emptyMessage="No finished products purchased yet."
                  renderRow={(prod, idx) => (
                    <tr key={idx} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-900">{prod.code} - {prod.name}</td>
                      <td className="px-4 py-3 text-gray-600">{prod.category || "Jewellery"}</td>
                      <td className="px-4 py-3 font-semibold">{prod.quantity}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">${prod.sellingPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">{prod.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(prod.date).toLocaleDateString()}</td>
                    </tr>
                  )}
                />
              </Card>

              {/* Purchased Gemstones */}
              <Card>
                <CardHeader className="py-3 flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Gem className="h-4 w-4 text-emerald-600" /> Purchased Gemstones ({purchasedGemstones.length})
                  </h3>
                </CardHeader>
                <DataTable
                  headers={["Stone ID & Gemstone", "Carat / Specs", "Qty", "Price Paid", "Invoice", "Date"]}
                  data={purchasedGemstones}
                  isLoading={false}
                  emptyMessage="No gemstones purchased yet."
                  renderRow={(stone, idx) => (
                    <tr key={idx} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-900">{stone.stoneId} - {stone.gemstone}</td>
                      <td className="px-4 py-3 text-gray-600">{stone.carat} ct • {stone.cut || stone.color || "Fine"}</td>
                      <td className="px-4 py-3 font-semibold">{stone.quantity}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">${stone.sellingPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">{stone.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(stone.date).toLocaleDateString()}</td>
                    </tr>
                  )}
                />
              </Card>
            </div>
          )}

          {/* TAB 5: Memos */}
          {activeTab === "memos" && (
            <Card>
              <CardHeader className="py-3 flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Consignment Memos History ({memos.length})</h3>
              </CardHeader>
              <DataTable
                headers={["Memo No", "Total Stock Value", "Date Out", "Expected Return", "Status", "Action"]}
                data={memos}
                isLoading={false}
                emptyMessage="No memo or consignment records found for this customer."
                renderRow={(memo) => {
                  const val = memo.totalValue || (memo.items || []).reduce((sum, i) => sum + (i.totalValue || (i.value || 0) * (i.quantity || 1)), 0);

                  return (
                    <tr key={memo._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{memo.memoNo}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">${val.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(memo.issueDate || memo.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-rose-700">{new Date(memo.expectedReturn).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={memo.status === "Fully Returned" || memo.status === "Closed" ? "success" : memo.status === "Overdue" ? "danger" : "warning"}>
                          {memo.status || "With Client"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/memos/${memo._id}`}>
                          <TableActionButton icon={Eye} title="View Consignment Details" />
                        </Link>
                      </td>
                    </tr>
                  );
                }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedSaleForPayment(null);
        }}
        sale={selectedSaleForPayment}
      />
    </div>
  );
}
