import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer, FileDown, CreditCard, Paperclip, Loader2 } from "lucide-react";
import { useSale, downloadInvoicePdf } from "../hooks/useSales";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import logo from "@/assets/logo.png";
import RecordPaymentModal from "../components/RecordPaymentModal";

import { Skeleton } from "@/components/ui/Skeleton";

export default function SaleDetails() {
  const { id } = useParams();
  const { sale, items, paymentHistory = [], isLoading, isError } = useSale(id);
  const { showSuccess, showError } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch sales invoice details.");
    }
  }, [isError, showError]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Top Toolbar Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Invoice Sheet Skeleton */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-200/80 shadow-md">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-gray-300">
            {/* Company Info */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            {/* Center Logo */}
            <div className="flex flex-col items-center justify-center gap-3">
              <Skeleton className="h-16 w-32 rounded-md" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            {/* Invoice Meta */}
            <div className="flex flex-col items-end gap-2.5">
              <Skeleton className="h-6 w-36 rounded" />
              <Skeleton className="h-6 w-36 rounded" />
              <Skeleton className="h-6 w-36 rounded" />
            </div>
          </div>

          {/* Legal / Payment Sub-bar */}
          <div className="my-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <Skeleton className="h-3 w-96 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Table */}
          <div className="my-4 space-y-2">
            <div className="grid grid-cols-5 gap-4 py-2 border-y border-black font-bold">
              <Skeleton className="h-4 w-8 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-4 w-8 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-5 gap-4 py-2 border-b border-gray-100">
                <Skeleton className="h-4 w-6 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
                <Skeleton className="h-4 w-6 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-lg w-full" />
            </div>
            <div className="space-y-2.5 flex flex-col items-end">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-6 w-48 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch sales invoice details.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadInvoicePdf(sale._id, sale.invoiceNo);
      showSuccess("PDF Downloaded", `Invoice ${sale.invoiceNo} PDF downloaded successfully.`);
    } catch (err) {
      showError("PDF Generation Failed", err?.response?.data?.message || "Failed to generate PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formattedDate = sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="flex justify-between items-center print:hidden">
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sales List
        </Link>
        <div className="flex items-center gap-3">
          {(sale?.balanceDue ?? 0) > 0 && (
            <Button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-fit"
            >
              <CreditCard className="h-4 w-4 mr-1.5" /> Record Payment
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline" className="w-fit">
            <Printer className="h-4 w-4 mr-1.5" /> Print Invoice
          </Button>
          <Button onClick={handleGeneratePdf} isLoading={isGeneratingPdf} className="w-fit">
            <FileDown className="h-4 w-4 mr-1.5" /> Generate PDF
          </Button>
        </div>
      </div>

      {/* Main Invoice Sheet Document */}
      <div
        id="invoice-sheet"
        className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-200/80 shadow-md font-serif text-gray-900 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
      >
        {/* Print Styles Injection */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-sheet, #invoice-sheet * {
              visibility: visible;
            }
            #invoice-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
              box-shadow: none;
              border: none;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          }
        `}</style>

        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-gray-300">
          {/* Left Column: Company Details */}
          <div className="text-xs leading-relaxed space-y-0.5">
            <h1 className="text-base font-bold tracking-tight text-black uppercase font-serif">
              TAKAT GEMS SR CO., LTD.
            </h1>
            <p>919/336, 26th Floor</p>
            <p>JTC, Silom Rd, Bangrak</p>
            <p>Bangkok 10500, Thailand</p>
            <p className="pt-1">T: +662 126 6759</p>
            <p>M: +852 5538 0785 (Rehman Ahmed Takat)</p>
            <p>M: +91 9587867863 (Ruman Ahmed Takat)</p>
            <p>E: info@takatsr.com</p>
          </div>

          {/* Center Column: Logo & Heading */}
          <div className="flex flex-col items-center justify-center text-center my-2 md:my-0">
            <div className="flex items-center justify-center mb-1">
              <img
                src={logo}
                alt="SR-TAKAT Logo"
                className="max-h-28 max-w-[400px] w-auto h-auto object-contain"
              />
            </div>
            {/* <span className="font-bold text-sm tracking-wider uppercase font-serif">TAKAT-SR</span>
            <span className="text-[10px] italic text-gray-700">by Siraj Takat</span>
            <span className="text-[9px] text-gray-600 font-sans tracking-wide mt-0.5">Est. 1955</span> */}
            <h2 className="text-lg font-bold tracking-widest text-black underline mt-2 font-serif uppercase">
              INVOICE
            </h2>
          </div>

          {/* Right Column: Invoice Metadata Fields */}
          <div className="text-xs space-y-1.5 md:text-right flex flex-col justify-end">
            <div className="flex justify-between md:justify-end gap-2 items-center">
              <span className="font-bold">INVOICE NO:</span>
              <span className="font-mono font-bold text-sm bg-gray-50 border-b border-black px-2 py-0.5 min-w-[140px] text-left">
                {sale.invoiceNo}
              </span>
            </div>
            <div className="flex justify-between md:justify-end gap-2 items-center">
              <span className="font-bold">DATE:</span>
              <span className="font-mono bg-gray-50 border-b border-black px-2 py-0.5 min-w-[140px] text-left">
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-between md:justify-end gap-2 items-center">
              <span className="font-bold">TO:</span>
              <span className="font-mono bg-gray-50 border-b border-black px-2 py-0.5 min-w-[140px] text-left font-semibold">
                {sale.customerId?.fullName || "—"}
              </span>
            </div>
            <div className="flex justify-between md:justify-end gap-2 items-center">
              <span className="font-bold">ADDRESS:</span>
              <span className="font-mono bg-gray-50 border-b border-black px-2 py-0.5 min-w-[140px] text-left truncate">
                {sale.customerId?.address || "—"}
              </span>
            </div>
            <div className="flex justify-between md:justify-end gap-2 items-center">
              <span className="font-bold">TEL / PHONE:</span>
              <span className="font-mono bg-gray-50 border-b border-black px-2 py-0.5 min-w-[140px] text-left">
                {sale.customerId?.phone || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Sub-bar */}
        <div className="my-3 text-[10px] text-justify leading-tight text-gray-800 border-b border-gray-200 pb-2">
          All sales are final. Goods sold remain the property of TAKAT GEMS SR CO., LTD. until full
          payment is received. Payment method:{" "}
          <strong className="font-semibold text-black">{sale.paymentMethod}</strong> | Status:{" "}
          <Badge variant={sale.paymentStatus === "Paid" ? "success" : "warning"} className="ml-1 text-[10px] font-sans">
            {sale.paymentStatus}
          </Badge>
        </div>

        {/* Line Items Table */}
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 text-black border-b border-black">
                <th className="border border-black py-1.5 px-2 text-center w-10 font-bold">NO.</th>
                <th className="border border-black py-1.5 px-3 text-left font-bold">ITEM DESCRIPTION</th>
                <th className="border border-black py-1.5 px-2 text-center w-16 font-bold">QTY</th>
                <th className="border border-black py-1.5 px-3 text-right w-28 font-bold">UNIT PRICE ($)</th>
                <th className="border border-black py-1.5 px-3 text-right w-28 font-bold">TOTAL ($)</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, idx) => {
                  const desc =
                    item.inventoryType === "Product"
                      ? `${item.inventoryId?.productCode ? `[${item.inventoryId.productCode}] ` : ""}${item.inventoryId?.name || "Product Item"}`
                      : `${item.inventoryId?.stoneId ? `[${item.inventoryId.stoneId}] ` : ""}${item.inventoryId?.gemstone || "Gemstone Item"}${item.inventoryId?.carat ? ` (${item.inventoryId.carat} ct)` : ""}`;

                  const lineTotal = item.sellingPrice * item.quantity;

                  return (
                    <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50/50">
                      <td className="border border-black py-2 px-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black py-2 px-3 font-semibold text-black">{desc}</td>
                      <td className="border border-black py-2 px-2 text-center font-mono">{item.quantity}</td>
                      <td className="border border-black py-2 px-3 text-right font-mono">
                        ${item.sellingPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-mono font-semibold">
                        ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 italic">
                    No items in this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary & Totals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 pt-2">
          {/* Notes & Charity Column */}
          <div className="space-y-3 text-xs">
            {sale.notes && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="font-bold underline block mb-1">Invoice Notes:</span>
                <p className="text-gray-700 leading-relaxed font-sans">{sale.notes}</p>
              </div>
            )}
            {/* {sale.charityAmount > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-lg text-amber-950 font-sans text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">
                  Charity Program ({sale.charityPercentage}%)
                </span>
                A gross donation of{" "}
                <span className="font-bold">${sale.charityAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> from this
                transaction is allocated to our charity fund.
              </div>
            )} */}
          </div>

          {/* Totals Box Column */}
          <div className="flex justify-end">
            <table className="w-full max-w-xs text-xs border border-black border-collapse font-sans">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-3 font-semibold text-gray-700">SUBTOTAL:</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                    ${sale.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                {sale.discount > 0 && (
                  <tr className="border-b border-gray-300 text-red-600">
                    <td className="py-2 px-3 font-semibold">DISCOUNT:</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      -${sale.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {sale.tax > 0 && (
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold text-gray-700">TAX / VAT:</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                      +${sale.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold border-t-2 border-b-2 border-black text-sm">
                  <td className="py-2.5 px-3 text-black">FINAL PRICE US$:</td>
                  <td className="py-2.5 px-3 text-right font-mono text-black">
                    ${sale.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-gray-300 text-green-700">
                  <td className="py-2 px-3 font-semibold">AMOUNT PAID:</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    ${(sale.amountPaid ?? sale.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-gray-300 text-amber-700 font-bold">
                  <td className="py-2 px-3 font-semibold">BALANCE DUE:</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    ${(sale.balanceDue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                {/* {sale.grossProfit > 0 && (
                  <tr className="border-b border-gray-300 text-indigo-700">
                    <td className="py-2 px-3 font-semibold">EST. PROFIT:</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      ${sale.grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {sale.charityAmount > 0 && (
                  <tr className="border-b border-gray-300 text-amber-800">
                    <td className="py-2 px-3 font-semibold">CHARITY DONATION ({sale.charityPercentage}%):</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      ${sale.charityAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )} */}
              </tbody>
            </table>
          </div>
        </div>

        {/* Treatment Disclaimer Footer */}
        <div className="mt-8 pt-3 border-t border-gray-300 text-[9px] text-justify text-gray-700 leading-tight">
          ALL OUR COLORED GEMSTONES ARE GUARANTEED AUTHENTIC FINE GEMSTONES. In general, some enhancement
          methods used in colored gemstones include heating, oiling, or resin treatment. We operate with full
          transparency. Thank you for doing business with TAKAT GEMS SR CO., LTD.
          <br />
          <strong className="text-black font-semibold mt-0.5 inline-block">
            Received goods in good order and condition.
          </strong>
        </div>

        {/* Signature Row */}
        {/* <div className="grid grid-cols-2 gap-12 mt-12 pt-4">
          <div className="text-left">
            <div className="border-b border-black h-8 mb-1"></div>
            <p className="text-xs font-bold text-black">Authorized Signature (Issuer):</p>
          </div>
          <div className="text-left">
            <div className="border-b border-black h-8 mb-1"></div>
            <p className="text-xs font-bold text-black">Customer Signature (Receiver):</p>
          </div>
        </div> */}
      </div>

      {/* Payment History Ledger Section (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm print:hidden space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Payment Transaction History ({paymentHistory.length})</h3>
            <p className="text-xs text-gray-500">Every payment transaction for invoice {sale.invoiceNo} is recorded separately.</p>
          </div>
          {(sale?.balanceDue ?? 0) > 0 && (
            <Button size="sm" onClick={() => setIsPaymentModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              + Record Payment
            </Button>
          )}
        </div>

        <DataTable
          headers={["Payment ID", "Date", "Amount Paid", "Payment Method", "Notes / Ref", "Attachment", "Logged By"]}
          data={paymentHistory}
          isLoading={false}
          emptyMessage="No payment transactions logged yet."
          renderRow={(pay) => (
            <tr key={pay._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
              <td className="px-4 py-3 font-mono font-bold text-primary">{pay.paymentId}</td>
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
              <td className="px-4 py-3 text-gray-500">{pay.createdBy?.fullName || "System Admin"}</td>
            </tr>
          )}
        />
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        sale={sale}
      />
    </div>
  );
}
