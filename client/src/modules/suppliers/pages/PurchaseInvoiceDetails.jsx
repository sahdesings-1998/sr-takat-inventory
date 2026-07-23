import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  CreditCard,
  Printer,
  Download,
  Share2,
  Paperclip,
  Truck,
  FileText,
  AlertCircle,
  Building2,
  Calendar,
  Package,
} from "lucide-react";
import { usePurchaseInvoice } from "../hooks/usePurchaseInvoices";
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

export default function PurchaseInvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoice, isLoading, isError, confirmInvoice, isConfirming, cancelInvoice, isCancelling, recordPayment, isRecordingPayment } = usePurchaseInvoice(id);
  const { showSuccess, showError } = useToast();

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch purchase invoice details.");
    }
  }, [isError, showError]);

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-4 w-32 rounded-md" />
        <SkeletonDetailCard rows={6} cols={2} />
        <SkeletonDetailCard rows={4} cols={1} title={false} />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="page-container space-y-4">
        <Link
          to="/suppliers?tab=purchase-invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Purchase Invoices
        </Link>
        <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
          Purchase invoice record not found.
        </div>
      </div>
    );
  }

  const supplier = invoice.supplierId || {};

  const handleConfirmPurchase = async () => {
    try {
      await confirmInvoice();
      showSuccess("Purchase Confirmed", "Purchase invoice confirmed and stock inward added to inventory!");
    } catch (err) {
      showError("Confirmation Failed", err?.response?.data?.message || "Failed to confirm purchase invoice.");
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelInvoice({ reason: cancelReason });
      showSuccess("Invoice Cancelled", "Purchase invoice cancelled and stock reversed successfully.");
      setCancelModalOpen(false);
    } catch (err) {
      showError("Cancellation Failed", err?.response?.data?.message || "Failed to cancel invoice.");
    }
  };

  const handleOpenPaymentModal = () => {
    setPaymentAmount(invoice.outstandingBalance ? invoice.outstandingBalance.toString() : "");
    setPaymentMethod("Bank Transfer");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      showError("Invalid Amount", "Please enter a valid payment amount greater than 0.");
      return;
    }

    try {
      await recordPayment({
        amount: amt,
        paymentMethod,
        paymentDate,
        notes: paymentNotes,
      });
      showSuccess("Payment Recorded", `Successfully recorded $${amt.toLocaleString()} payment.`);
      setPaymentModalOpen(false);
    } catch (err) {
      showError("Payment Failed", err?.response?.data?.message || "Failed to record payment.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await purchaseInvoiceApi.getPDFBuffer(invoice._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Purchase_Invoice_${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showError("PDF Error", "Failed to download invoice PDF.");
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await purchaseInvoiceApi.getPDFBuffer(invoice._id);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    } catch (err) {
      showError("Print Error", "Failed to print purchase invoice.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Purchase Invoice ${invoice.invoiceNumber}`,
        text: `Purchase Invoice ${invoice.invoiceNumber} for ${supplier.companyName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess("Link Copied", "Purchase invoice link copied to clipboard.");
    }
  };

  const getStatusVariant = (st) => {
    switch (st) {
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
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/suppliers?tab=purchase-invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Purchase Invoices
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-display font-mono">{invoice.invoiceNumber}</h1>
              <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
              <Badge variant={getPaymentVariant(invoice.paymentStatus)}>{invoice.paymentStatus}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium flex items-center gap-3 flex-wrap">
              <span>Supplier: <strong className="text-gray-900">{supplier.companyName || "N/A"}</strong></span>
              <span>•</span>
              <span>Supplier Bill #: <strong className="font-mono text-gray-900">{invoice.supplierInvoiceNumber || "N/A"}</strong></span>
              <span>•</span>
              <span>Purchase Date: <strong className="text-gray-900">{new Date(invoice.purchaseDate).toLocaleDateString()}</strong></span>
            </p>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {invoice.status === "Draft" && (
              <Button
                onClick={handleConfirmPurchase}
                isLoading={isConfirming}
                disabled={isConfirming}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                Confirm Purchase &amp; Inward Stock
              </Button>
            )}

            {invoice.status === "Confirmed" && invoice.outstandingBalance > 0 && (
              <Button
                onClick={handleOpenPaymentModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                icon={<CreditCard className="h-4 w-4" />}
              >
                Record Payment
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
              Print
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadPDF} icon={<Download className="h-4 w-4" />}>
              Download PDF
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare} icon={<Share2 className="h-4 w-4" />}>
              Share
            </Button>

            {invoice.status === "Confirmed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                icon={<XCircle className="h-4 w-4" />}
              >
                Cancel Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Financial Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Final Total</span>
            <span className="font-mono text-xl font-bold text-gray-900">${(invoice.finalTotal || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Total Paid</span>
            <span className="font-mono text-xl font-bold text-emerald-700">${(invoice.paidAmount || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Outstanding Balance</span>
            <span className="font-mono text-xl font-bold text-rose-700">${(invoice.outstandingBalance || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Items Count</span>
            <span className="font-mono text-xl font-bold text-gray-900">{invoice.items?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* 2 Column Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier & Invoice Info */}
        <div className="space-y-6">
          <Card p={5}>
            <CardHeader className="border-b border-gray-100 pb-3 mb-3">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Supplier Information</h2>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Company Name</span>
                <Link to={`/suppliers/${supplier._id}`} className="font-bold text-primary hover:underline text-sm">
                  {supplier.companyName || "N/A"}
                </Link>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Contact Person</span>
                <span className="font-medium text-gray-800">{supplier.contactName || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Phone</span>
                <span className="font-medium text-gray-800">{supplier.phone || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Email</span>
                <span className="font-medium text-gray-800 break-all">{supplier.email || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Address</span>
                <span className="font-medium text-gray-800">{supplier.address || "—"}</span>
              </div>
            </CardBody>
          </Card>

          <Card p={5}>
            <CardHeader className="border-b border-gray-100 pb-3 mb-3">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Invoice Metadata</h2>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">System Invoice #</span>
                <span className="font-mono font-bold text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Supplier Bill #</span>
                <span className="font-mono font-bold text-gray-800">{invoice.supplierInvoiceNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Invoice Date</span>
                <span className="font-medium text-gray-800">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] uppercase font-semibold">Purchase Date</span>
                <span className="font-medium text-gray-800">{new Date(invoice.purchaseDate).toLocaleDateString()}</span>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-gray-400 block text-[11px] uppercase font-semibold">Payment Due Date</span>
                  <span className="font-medium text-gray-800">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 block text-[11px] uppercase font-semibold mb-1">Notes</span>
                  <p className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}

              {/* Attachments List */}
              {invoice.attachments && invoice.attachments.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <span className="text-gray-400 block text-[11px] uppercase font-semibold mb-1">Supplier Original Invoice Attachment</span>
                  <div className="flex flex-col gap-1.5">
                    {invoice.attachments.map((att, attIdx) => (
                      <a
                        key={attIdx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20 hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {att.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Item Breakdown & Movements & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itemized Table */}
          <Card>
            <CardHeader className="py-3 flex justify-between items-center">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Purchased Items Breakdown</h3>
              <span className="font-mono text-sm font-bold text-primary">Final Total: ${(invoice.finalTotal || 0).toLocaleString()}</span>
            </CardHeader>
            <DataTable
              headers={["#", "Item Description", "Type", "Qty", "Unit", "Unit Cost", "Tax", "Discount", "Total"]}
              data={invoice.items || []}
              isLoading={false}
              emptyMessage="No items in this purchase invoice."
              renderRow={(item, idx) => (
                <tr key={idx} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.itemType || item.inventoryType}</td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">${(item.purchasePrice || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">${(item.tax || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">${(item.discount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">${(item.totalAmount || 0).toLocaleString()}</td>
                </tr>
              )}
            />
          </Card>

          {/* Linked Stock Inward Movements */}
          {invoice.stockMovements && invoice.stockMovements.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Stock Inward / Reversal Audit Log</h3>
              </CardHeader>
              <DataTable
                headers={["Action", "Type", "Quantity", "Unit Cost", "Prev Stock", "Updated Stock", "Date", "Remarks"]}
                data={invoice.stockMovements}
                isLoading={false}
                emptyMessage="No stock movements logged for this invoice."
                renderRow={(mv) => (
                  <tr key={mv._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <Badge variant={mv.action === "Stock Inward" ? "success" : "danger"}>{mv.action}</Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">{mv.inventoryType}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">{mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity} {mv.unit}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">${(mv.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{mv.previousStock}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{mv.updatedStock}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(mv.movementDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{mv.remarks || "—"}</td>
                  </tr>
                )}
              />
            </Card>
          )}

          {/* Payments History */}
          <Card>
            <CardHeader className="py-3 flex justify-between items-center">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Payment History for Invoice</h3>
              {invoice.status === "Confirmed" && invoice.outstandingBalance > 0 && (
                <Button size="sm" onClick={handleOpenPaymentModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  + Record Payment
                </Button>
              )}
            </CardHeader>
            <DataTable
              headers={["Payment No", "Amount Paid", "Method", "Payment Date", "Notes"]}
              data={invoice.payments || []}
              isLoading={false}
              emptyMessage="No payments recorded against this invoice yet."
              renderRow={(pmt) => (
                <tr key={pmt._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{pmt.paymentNo}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">${pmt.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{pmt.paymentMethod}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(pmt.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{pmt.notes || "—"}</td>
                </tr>
              )}
            />
          </Card>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment for ${invoice.invoiceNumber}`}
      >
        <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4">
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-gray-700 space-y-1">
            <p>Invoice Total: <strong className="font-mono text-gray-900">${invoice.finalTotal?.toLocaleString()}</strong></p>
            <p>Outstanding Balance: <strong className="font-mono text-rose-700 text-sm">${invoice.outstandingBalance?.toLocaleString()}</strong></p>
          </div>

          <Input
            label="Payment Amount ($) *"
            type="number"
            step="0.01"
            max={invoice.outstandingBalance || undefined}
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
            label="Notes"
            placeholder="e.g. Wire transfer confirmation #..."
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

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Purchase Invoice & Reverse Stock"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-600" /> Confirm Stock Reversal
            </p>
            <p>
              Cancelling this invoice will automatically deduct the purchased items from inventory stock and record a stock reversal audit entry.
            </p>
          </div>

          <Input
            label="Reason for Cancellation"
            placeholder="e.g. Returned goods to supplier..."
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
