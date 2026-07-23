import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit,
  CreditCard,
  Download,
  Printer,
  XCircle,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Truck,
  DollarSign,
  Package,
} from "lucide-react";
import { usePurchaseInvoices, usePurchaseInvoice } from "../hooks/usePurchaseInvoices";
import { useSuppliers } from "../hooks/useSuppliers";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonDetailCard, Skeleton } from "@/components/ui/Skeleton";
import purchaseInvoiceApi from "../api/purchaseInvoiceApi";

export default function PurchaseInvoiceList({ hideHeader = false }) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  const { invoices, isLoading } = usePurchaseInvoices({
    supplierId: selectedSupplier || undefined,
    status: statusFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    search: search || undefined,
  });

  const { suppliers } = useSuppliers();

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Summary Metrics
  const totalPurchaseValue = invoices
    .filter((inv) => inv.status === "Confirmed")
    .reduce((sum, inv) => sum + (inv.finalTotal || 0), 0);

  const totalPaidValue = invoices
    .filter((inv) => inv.status === "Confirmed")
    .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  const totalOutstanding = Math.max(0, totalPurchaseValue - totalPaidValue);

  const handleOpenCancelModal = (inv) => {
    setSelectedInvoiceId(inv._id);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedInvoiceId) return;
    setIsCancelling(true);
    try {
      await purchaseInvoiceApi.cancel(selectedInvoiceId, { reason: cancelReason });
      showSuccess("Invoice Cancelled", "Purchase invoice has been cancelled and stock reversed.");
      setCancelModalOpen(false);
      window.location.reload();
    } catch (err) {
      showError("Cancellation Failed", err?.response?.data?.message || "Failed to cancel invoice.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenPaymentModal = (inv) => {
    setActivePaymentInvoice(inv);
    setPaymentAmount(inv.outstandingBalance ? inv.outstandingBalance.toString() : "");
    setPaymentMethod("Bank Transfer");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      showError("Invalid Amount", "Please enter a payment amount greater than 0.");
      return;
    }

    setIsRecordingPayment(true);
    try {
      await purchaseInvoiceApi.recordPayment(activePaymentInvoice._id, {
        amount: amt,
        paymentMethod,
        paymentDate,
        notes: paymentNotes,
      });
      showSuccess("Payment Recorded", `Successfully recorded $${amt.toLocaleString()} payment.`);
      setPaymentModalOpen(false);
      window.location.reload();
    } catch (err) {
      showError("Payment Failed", err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleDownloadPDF = async (inv) => {
    try {
      const blob = await purchaseInvoiceApi.getPDFBuffer(inv._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Purchase_Invoice_${inv.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showError("PDF Download Failed", "Could not generate purchase invoice PDF.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Confirmed":
        return "success";
      case "Draft":
        return "neutral";
      case "Cancelled":
        return "danger";
      default:
        return "neutral";
    }
  };

  const getPaymentVariant = (pStatus) => {
    switch (pStatus) {
      case "Paid":
        return "success";
      case "Partially Paid":
        return "warning";
      case "Unpaid":
        return "danger";
      case "Overdue":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Top Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Purchase Invoices</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Manage supplier purchases, stock inward records, and payment tracking.
            </p>
          </div>

          <Button
            onClick={() => navigate("/purchase-invoices/new")}
            className="w-fit bg-primary hover:bg-primary/90 text-white font-bold"
            icon={<Plus className="h-4 w-4" />}
          >
            Create Purchase Invoice
          </Button>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 block font-semibold text-[11px] uppercase">Confirmed Purchases</span>
              <span className="font-mono text-xl font-bold text-gray-900">${totalPurchaseValue.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 block font-semibold text-[11px] uppercase">Total Paid</span>
              <span className="font-mono text-xl font-bold text-emerald-700">${totalPaidValue.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 block font-semibold text-[11px] uppercase">Outstanding Balance</span>
              <span className="font-mono text-xl font-bold text-rose-700">${totalOutstanding.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 block font-semibold text-[11px] uppercase">Total Invoices</span>
              <span className="font-mono text-xl font-bold text-gray-900">{invoices.length}</span>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search invoice # or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-gray-400" />}
          />

          <Select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            options={[
              { value: "", label: "All Suppliers" },
              ...suppliers.map((s) => ({ value: s._id, label: s.companyName })),
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Invoice Statuses" },
              { value: "Draft", label: "Draft" },
              { value: "Confirmed", label: "Confirmed" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
          />

          <Select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Payment Statuses" },
              { value: "Unpaid", label: "Unpaid" },
              { value: "Partially Paid", label: "Partially Paid" },
              { value: "Paid", label: "Paid" },
              { value: "Overdue", label: "Overdue" },
            ]}
          />
        </div>
      </Card>

      {/* Purchase Invoices Table */}
      <Card>
        <DataTable
          headers={[
            "Invoice #",
            "Supplier",
            "Supplier Bill #",
            "Purchase Date",
            "Items",
            "Final Total",
            "Paid Amount",
            "Outstanding",
            "Status",
            "Payment",
            "Actions",
          ]}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No purchase invoices found matching your filters."
          renderRow={(inv) => (
            <tr key={inv._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-mono font-bold text-primary">
                <Link to={`/purchase-invoices/${inv._id}`} className="hover:underline">
                  {inv.invoiceNumber}
                </Link>
              </td>

              <td className="px-4 py-3 font-bold text-gray-900">
                {inv.supplierId?.companyName || "—"}
              </td>

              <td className="px-4 py-3 font-mono text-gray-600">
                {inv.supplierInvoiceNumber || "—"}
              </td>

              <td className="px-4 py-3 text-gray-500">
                {new Date(inv.purchaseDate).toLocaleDateString()}
              </td>

              <td className="px-4 py-3 font-semibold text-gray-700">
                {inv.items?.length || 0} items
              </td>

              <td className="px-4 py-3 font-mono font-bold text-gray-900">
                ${(inv.finalTotal || 0).toLocaleString()}
              </td>

              <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                ${(inv.paidAmount || 0).toLocaleString()}
              </td>

              <td className="px-4 py-3 font-mono font-bold text-rose-700">
                ${(inv.outstandingBalance || 0).toLocaleString()}
              </td>

              <td className="px-4 py-3">
                <Badge variant={getStatusVariant(inv.status)}>{inv.status}</Badge>
              </td>

              <td className="px-4 py-3">
                <Badge variant={getPaymentVariant(inv.paymentStatus)}>{inv.paymentStatus}</Badge>
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <TableActionButton
                    title="View Purchase Invoice"
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/purchase-invoices/${inv._id}`)}
                  />

                  {inv.status === "Confirmed" && inv.outstandingBalance > 0 && (
                    <TableActionButton
                      title="Record Payment"
                      icon={<CreditCard className="h-3.5 w-3.5 text-emerald-600" />}
                      onClick={() => handleOpenPaymentModal(inv)}
                    />
                  )}

                  <TableActionButton
                    title="Download PDF"
                    icon={<Download className="h-3.5 w-3.5 text-sky-600" />}
                    onClick={() => handleDownloadPDF(inv)}
                  />

                  {inv.status === "Confirmed" && (
                    <TableActionButton
                      title="Cancel Invoice & Reverse Stock"
                      icon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
                      onClick={() => handleOpenCancelModal(inv)}
                    />
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment for ${activePaymentInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4">
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-gray-700 space-y-1">
            <p>Invoice Total: <strong className="font-mono text-gray-900">${activePaymentInvoice?.finalTotal?.toLocaleString()}</strong></p>
            <p>Outstanding Balance: <strong className="font-mono text-rose-700 text-sm">${activePaymentInvoice?.outstandingBalance?.toLocaleString()}</strong></p>
          </div>

          <Input
            label="Payment Amount ($) *"
            type="number"
            step="0.01"
            max={activePaymentInvoice?.outstandingBalance || undefined}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Method *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: "Bank Transfer", label: "Bank Transfer" },
                { value: "Cash", label: "Cash" },
                { value: "Cheque", label: "Cheque" },
                { value: "Credit Card", label: "Credit Card" },
                { value: "Crypto", label: "Crypto" },
                { value: "Other", label: "Other" },
              ]}
            />

            <Input
              label="Payment Date *"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Payment Notes"
            placeholder="e.g. Wire transfer reference #TRX-99..."
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" type="button" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isRecordingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Custom Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Purchase Invoice & Reverse Stock"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-600" /> Warning: Stock Inward Reversal
            </p>
            <p>
              Cancelling this confirmed purchase invoice will automatically reverse all stock inward transactions and deduct the purchased quantities from current inventory.
            </p>
          </div>

          <Input
            label="Reason for Cancellation"
            placeholder="e.g. Returned goods to supplier / billing error..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Back
            </Button>
            <Button
              onClick={handleConfirmCancel}
              isLoading={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
