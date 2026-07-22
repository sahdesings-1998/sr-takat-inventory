import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Gem,
  Coins,
  Package,
} from "lucide-react";
import { useSupplier } from "../hooks/useSuppliers";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonDetailCard, Skeleton } from "@/components/ui/Skeleton";

export default function SupplierDetails() {
  const { id } = useParams();
  const { supplier, isLoading, isError, recordSupplierPayment, isRecordingPayment } = useSupplier(id);
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState("overview");

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch supplier details.");
    }
  }, [isError, showError]);

  if (isLoading)
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-4 w-28 rounded-md" />
        <SkeletonDetailCard rows={6} cols={2} />
        <SkeletonDetailCard rows={4} cols={1} title={false} />
      </div>
    );

  if (isError || !supplier)
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Supplier record not found or failed to load.
      </div>
    );

  const handleOpenPaymentModal = () => {
    setPaymentAmount(supplier.outstandingBalance ? supplier.outstandingBalance.toString() : "");
    setPaymentMethod("Bank Transfer");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setAttachments([]);
    setIsPaymentModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: reader.result,
            fileType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      showError("Validation Error", "Please enter a valid payment amount greater than 0.");
      return;
    }

    try {
      await recordSupplierPayment({
        amount: amt,
        paymentMethod,
        paymentDate,
        notes,
        attachments,
      });
      showSuccess("Payment Recorded", `Successfully recorded payment of $${amt.toLocaleString()} to ${supplier.companyName}`);
      setIsPaymentModalOpen(false);
    } catch (err) {
      showError("Payment Failed", err?.response?.data?.message || "Failed to record payment.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Partially Paid":
        return "warning";
      case "Unpaid":
        return "danger";
      default:
        return "neutral";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview & Payable Ledger", count: null },
    { id: "gemstones", label: "Gemstone Purchases", count: supplier.gemstonePurchases?.length || 0 },
    { id: "metals", label: "Metal Purchases", count: supplier.metalPurchases?.length || 0 },
    { id: "components", label: "Component Purchases", count: supplier.componentPurchases?.length || 0 },
    { id: "payments", label: "Payment History", count: supplier.paymentHistory?.length || 0 },
  ];

  return (
    <div className="page-container space-y-6">
      <div>
        <Link
          to="/suppliers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Suppliers List
        </Link>
      </div>

      {/* Supplier Profile Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-display">{supplier.companyName}</h1>
              <Badge variant={supplier.status === "active" ? "success" : "neutral"}>
                {supplier.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium flex items-center gap-3">
              <span>Contact: <strong className="text-gray-900">{supplier.contactName || "—"}</strong></span>
              <span>•</span>
              <span>Phone: <strong className="text-gray-900">{supplier.phone}</strong></span>
              <span>•</span>
              <span>Email: <strong className="text-gray-900">{supplier.email || "—"}</strong></span>
            </p>
          </div>

          <Button
            onClick={handleOpenPaymentModal}
            disabled={!supplier.outstandingBalance || supplier.outstandingBalance <= 0}
            className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            icon={<CreditCard className="h-4 w-4" />}
          >
            Record Payment
          </Button>
        </div>

        {/* Executive Payable Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Total Purchases</span>
            <span className="font-mono text-xl font-bold text-gray-900">${(supplier.totalPurchaseAmount || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Total Paid</span>
            <span className="font-mono text-xl font-bold text-emerald-700">${(supplier.totalPaidAmount || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Outstanding Balance</span>
            <span className="font-mono text-xl font-bold text-rose-700">${(supplier.outstandingBalance || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Payment Status</span>
            <div className="mt-1">
              <Badge variant={getStatusVariant(supplier.paymentStatus)}>
                {supplier.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Supplier Profile */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Supplier Information</h2>
            </CardHeader>
            <CardBody className="space-y-4 text-xs text-gray-700">
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Company Name</span>
                <span className="font-bold text-gray-900 text-sm">{supplier.companyName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Contact Person</span>
                <span className="font-medium text-gray-800">{supplier.contactName || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Supplier Category / Type</span>
                <span className="font-bold text-primary">{supplier.supplierType || "Gemstone Supplier"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Country</span>
                <span className="font-medium text-gray-800">{supplier.country || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Phone Number</span>
                <span className="font-medium text-gray-800">{supplier.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">WhatsApp</span>
                <span className="font-medium text-gray-800">{supplier.whatsApp || supplier.phone || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Email Address</span>
                <span className="font-medium text-gray-800 break-all">{supplier.email || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block text-[11px] uppercase">Office / Warehouse Address</span>
                <span className="font-medium text-gray-800">{supplier.address || "No address provided"}</span>
              </div>
              {supplier.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 font-semibold block text-[11px] uppercase mb-1">Notes</span>
                  <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200/60 text-xs whitespace-pre-wrap">
                    {supplier.notes}
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
                {t.count !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === t.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: Overview & Payable Ledger */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3 flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Purchases &amp; Payment Ledger Summary</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                      <span className="text-xs text-purple-900 font-bold block">Gemstone Purchases</span>
                      <span className="font-mono text-lg font-bold text-purple-700">${(supplier.gemstoneTotal || 0).toLocaleString()}</span>
                      <span className="text-[11px] text-gray-500 block mt-1">{supplier.gemstonePurchases?.length || 0} Gemstones</span>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                      <span className="text-xs text-amber-900 font-bold block">Metal Purchases</span>
                      <span className="font-mono text-lg font-bold text-amber-700">${(supplier.metalTotal || 0).toLocaleString()}</span>
                      <span className="text-[11px] text-gray-500 block mt-1">{supplier.metalPurchases?.length || 0} Metals (Gold/Silver/Platinum)</span>
                    </div>

                    <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                      <span className="text-xs text-sky-900 font-bold block">Component Purchases</span>
                      <span className="font-mono text-lg font-bold text-sky-700">${(supplier.componentTotal || 0).toLocaleString()}</span>
                      <span className="text-[11px] text-gray-500 block mt-1">{supplier.componentPurchases?.length || 0} Findings/Settings</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Payment History Preview */}
              <Card>
                <CardHeader className="py-3 flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Recent Supplier Payments</h3>
                  {supplier.outstandingBalance > 0 && (
                    <Button size="sm" onClick={handleOpenPaymentModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      + Record Payment
                    </Button>
                  )}
                </CardHeader>
                <DataTable
                  headers={["Payment No", "Amount Paid", "Payment Method", "Date", "Notes"]}
                  data={(supplier.paymentHistory || []).slice(0, 5)}
                  isLoading={false}
                  emptyMessage="No payments recorded for this supplier yet."
                  renderRow={(pmt) => (
                    <tr key={pmt._id} className="border-b border-gray-100 text-xs sm:text-sm">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{pmt.paymentNo}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">${pmt.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{pmt.paymentMethod}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(pmt.paymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{pmt.notes || "—"}</td>
                    </tr>
                  )}
                />
              </Card>
            </div>
          )}

          {/* TAB 2: Gemstone Purchases */}
          {activeTab === "gemstones" && (
            <Card>
              <CardHeader className="py-3 flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Gemstone Purchases ({supplier.gemstonePurchases?.length || 0})</h3>
                <span className="font-mono text-sm font-bold text-primary">Total: ${(supplier.gemstoneTotal || 0).toLocaleString()}</span>
              </CardHeader>
              <DataTable
                headers={["Stone ID", "Gemstone", "Variety / Origin", "Carat", "Pieces", "Unit Cost/Carat", "Total Purchase Price", "Status"]}
                data={supplier.gemstonePurchases || []}
                isLoading={false}
                emptyMessage="No gemstones purchased from this supplier."
                renderRow={(stone) => (
                  <tr key={stone._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{stone.stoneId}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{stone.gemstone}</td>
                    <td className="px-4 py-3 text-gray-600">{stone.variety || stone.origin || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{stone.carat} ct</td>
                    <td className="px-4 py-3 font-semibold">{stone.pieces || 1}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">${stone.costPerCarat?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">${(stone.purchasePrice * (stone.pieces || 1)).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={stone.status === "In Stock" ? "success" : "neutral"}>
                        {stone.status}
                      </Badge>
                    </td>
                  </tr>
                )}
              />
            </Card>
          )}

          {/* TAB 3: Metal Purchases */}
          {activeTab === "metals" && (
            <Card>
              <CardHeader className="py-3 flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Metal Purchases ({supplier.metalPurchases?.length || 0})</h3>
                <span className="font-mono text-sm font-bold text-amber-700">Total: ${(supplier.metalTotal || 0).toLocaleString()}</span>
              </CardHeader>
              <DataTable
                headers={["Material Code", "Metal Name", "Category", "Quantity", "Unit Cost", "Total Cost", "Location"]}
                data={supplier.metalPurchases || []}
                isLoading={false}
                emptyMessage="No metals purchased from this supplier."
                renderRow={(mat) => (
                  <tr key={mat._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{mat.materialCode}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{mat.materialName}</td>
                    <td className="px-4 py-3 font-semibold text-amber-800">{mat.category}</td>
                    <td className="px-4 py-3 font-semibold">{mat.quantity} {mat.unit}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">${mat.cost?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">${(mat.cost * mat.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{mat.location || "Vault"}</td>
                  </tr>
                )}
              />
            </Card>
          )}

          {/* TAB 4: Component Purchases */}
          {activeTab === "components" && (
            <Card>
              <CardHeader className="py-3 flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Component Purchases ({supplier.componentPurchases?.length || 0})</h3>
                <span className="font-mono text-sm font-bold text-sky-700">Total: ${(supplier.componentTotal || 0).toLocaleString()}</span>
              </CardHeader>
              <DataTable
                headers={["Material Code", "Component Name", "Category", "Quantity", "Unit Cost", "Total Cost", "Location"]}
                data={supplier.componentPurchases || []}
                isLoading={false}
                emptyMessage="No components purchased from this supplier."
                renderRow={(mat) => (
                  <tr key={mat._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{mat.materialCode}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{mat.materialName}</td>
                    <td className="px-4 py-3 font-semibold text-sky-800">{mat.category}</td>
                    <td className="px-4 py-3 font-semibold">{mat.quantity} {mat.unit}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">${mat.cost?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">${(mat.cost * mat.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{mat.location || "Vault"}</td>
                  </tr>
                )}
              />
            </Card>
          )}

          {/* TAB 5: Payment History */}
          {activeTab === "payments" && (
            <Card>
              <CardHeader className="py-3 flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Supplier Payment Ledger ({supplier.paymentHistory?.length || 0})</h3>
                {supplier.outstandingBalance > 0 && (
                  <Button size="sm" onClick={handleOpenPaymentModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    + Record Payment
                  </Button>
                )}
              </CardHeader>
              <DataTable
                headers={["Payment No", "Amount Paid", "Payment Method", "Date", "Proof Receipts", "Notes"]}
                data={supplier.paymentHistory || []}
                isLoading={false}
                emptyMessage="No supplier payment transactions recorded."
                renderRow={(pmt) => (
                  <tr key={pmt._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{pmt.paymentNo}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">${pmt.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{pmt.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(pmt.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {pmt.attachments && pmt.attachments.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pmt.attachments.map((att, attIdx) => (
                            <a
                              key={attIdx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{pmt.notes || "—"}</td>
                  </tr>
                )}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Record Supplier Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment to ${supplier.companyName}`}>
        <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4">
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-gray-700 space-y-1">
            <p>Outstanding Balance Payable: <strong className="font-mono text-rose-700 text-sm">${(supplier.outstandingBalance || 0).toLocaleString()}</strong></p>
            <p className="text-gray-500">Enter the payment amount cleared for this supplier.</p>
          </div>

          <Input
            label="Payment Amount ($) *"
            type="number"
            step="0.01"
            max={supplier.outstandingBalance || undefined}
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

          <Textarea
            label="Notes / Payment Voucher Remarks"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bank wire transfer confirmation #TRX-9821..."
            rows={2}
          />

          {/* Attach Receipts */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">Attach Bank Slips / Invoice Receipts</label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200">
                    <Paperclip className="h-3 w-3 text-primary" />
                    {att.name}
                    <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-rose-600 hover:text-rose-800 font-bold ml-1">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)} disabled={isRecordingPayment}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isRecordingPayment} disabled={isRecordingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Record Supplier Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
