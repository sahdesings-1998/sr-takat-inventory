import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShoppingCart, Clock, Undo2, Calendar, FileText, CheckCircle2, User } from "lucide-react";
import { useMemo } from "../hooks/useMemo";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonDetailCard, Skeleton } from "@/components/ui/Skeleton";

export default function MemoDetails() {
  const { id } = useParams();
  const { memo, isLoading, isError, returnMemoItem, convertMemoItem, extendMemo } = useMemo(id);
  const { showSuccess, showError } = useToast();

  const [saleOpen, setSaleOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [newExpectedReturn, setNewExpectedReturn] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [returnConfirm, setReturnConfirm] = useState({ open: false, itemId: null, isLoading: false });

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!newExpectedReturn) return;
    try {
      setIsExtending(true);
      await extendMemo({ expectedReturn: newExpectedReturn, reason: extendReason });
      setExtendOpen(false);
      showSuccess("Memo Extended", "Memo return date extended successfully!");
    } catch (err) {
      showError("Extend Failed", err?.response?.data?.message || "Failed to extend memo return date.");
    } finally {
      setIsExtending(false);
    }
  };

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch consignment memo details.");
    }
  }, [isError, showError]);

  if (isLoading)
    return (
      <div className="page-container space-y-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <SkeletonDetailCard rows={8} cols={2} />
        <SkeletonDetailCard rows={4} cols={1} title={false} />
      </div>
    );

  if (isError || !memo)
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch consignment memo details.
      </div>
    );

  const handleReturn = (itemId) => {
    setReturnConfirm({ open: true, itemId, isLoading: false });
  };

  const handleConfirmReturn = async () => {
    setReturnConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await returnMemoItem(returnConfirm.itemId);
      showSuccess("Returned", "Item has been successfully marked as returned to company stock.");
      setReturnConfirm({ open: false, itemId: null, isLoading: false });
    } catch (err) {
      showError("Return Failed", err?.response?.data?.message || "Failed to process return.");
      setReturnConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleOpenSale = (itemId) => {
    setSelectedItemId(itemId);
    setPaymentMethod("Cash");
    setSaleOpen(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsConverting(true);
      await convertMemoItem({
        itemId: selectedItemId,
        paymentMethod,
      });
      setSaleOpen(false);
      showSuccess("Sold", "Item successfully sold and purchase invoice generated!");
    } catch (err) {
      showError("Conversion Failed", err?.response?.data?.message || "Failed to process conversion to sale.");
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Sold":
      case "Closed":
        return "info";
      case "Returned":
      case "Fully Returned":
        return "success";
      case "Extended":
        return "neutral";
      case "Overdue":
        return "danger";
      default:
        return "warning";
    }
  };

  const totalMemoValue = memo.totalValue || (memo.items || []).reduce((sum, i) => sum + (i.totalValue || (i.value || 0) * (i.quantity || 1)), 0);

  const calculateDaysOut = () => {
    if (!memo.issueDate) return 0;
    const start = new Date(memo.issueDate);
    const end = memo.actualReturn ? new Date(memo.actualReturn) : new Date();
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-container space-y-6">
      <div>
        <Link
          to="/memos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Consignments List
        </Link>
      </div>

      {/* Memo Summary Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-display">Consignment Memo #{memo.memoNo}</h1>
              <Badge variant={getStatusVariant(memo.status)}>
                {memo.status || "With Client"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium flex items-center gap-1">
              Client: <Link to={`/customers/${memo.customerId?._id}`} className="font-bold text-primary hover:underline">{memo.customerId?.fullName || "N/A"}</Link>
              {memo.customerId?.companyName && ` (${memo.customerId.companyName})`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(memo.status === "With Client" || memo.status === "Extended" || memo.status === "Overdue" || memo.status === "Partially Returned") && (
              <Button
                variant="outline"
                onClick={() => {
                  setNewExpectedReturn(
                    memo.expectedReturn ? new Date(memo.expectedReturn).toISOString().split("T")[0] : ""
                  );
                  setExtendReason("");
                  setExtendOpen(true);
                }}
              >
                <Clock className="h-4 w-4 mr-1.5" /> Extend Return Date
              </Button>
            )}
          </div>
        </div>

        {/* Quick Details Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Consignment Value</span>
            <span className="font-mono text-lg font-bold text-gray-900">${totalMemoValue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Date Out</span>
            <span className="text-xs font-semibold text-gray-800">{new Date(memo.issueDate || memo.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Expected Return</span>
            <span className="text-xs font-semibold text-rose-700">{new Date(memo.expectedReturn).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[11px] uppercase">Days Out</span>
            <span className="text-xs font-semibold text-gray-800">{calculateDaysOut()} Days</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="py-3.5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900">Consigned Inventory Items ({memo.items?.length || 0})</h3>
        </CardHeader>
        <DataTable
          headers={["Item Type", "Code / Description", "Qty", "Unit Selling Value", "Total Value", "Status", "Actions"]}
          data={memo.items || []}
          renderRow={(item) => {
            const unitVal = item.value || 0;
            const totalVal = item.totalValue || unitVal * item.quantity;

            return (
              <tr key={item._id} className="border-b border-gray-100 text-xs sm:text-sm hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-900">{item.inventoryType}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">
                  {item.inventoryId
                    ? item.inventoryType === "Product"
                      ? `${item.inventoryId.productCode || item.inventoryId.sku} - ${item.inventoryId.name}`
                      : `${item.inventoryId.stoneId} - ${item.inventoryId.gemstone} (${item.carat || item.inventoryId.carat} ct)`
                    : "Linked Item Deleted"}
                </td>
                <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                <td className="px-4 py-3 font-mono font-bold text-gray-900">${unitVal.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono font-bold text-primary">${totalVal.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.status === "On Memo" && (
                    <div className="flex items-center gap-1.5">
                      <TableActionButton
                        icon={Undo2}
                        title="Return Item to Company Stock"
                        isLoading={returnConfirm.open && returnConfirm.itemId === item._id && returnConfirm.isLoading}
                        onClick={() => handleReturn(item._id)}
                      />
                      <TableActionButton
                        icon={ShoppingCart}
                        title="Convert to Official Sale"
                        onClick={() => handleOpenSale(item._id)}
                      />
                    </div>
                  )}
                  {item.status !== "On Memo" && <span className="text-xs text-gray-400">—</span>}
                </td>
              </tr>
            );
          }}
        />
      </Card>

      {/* History Log & Extensions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extension History Timeline */}
        <Card>
          <CardHeader className="py-3.5">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" /> Return Date Extension History ({memo.extensionHistory?.length || 0})
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {memo.extensionHistory && memo.extensionHistory.length > 0 ? (
              memo.extensionHistory.map((ext, idx) => (
                <div key={idx} className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs space-y-1">
                  <div className="flex justify-between items-center text-purple-950 font-bold">
                    <span>Extended to: {new Date(ext.newReturnDate).toLocaleDateString()}</span>
                    <span className="text-[11px] font-normal text-purple-700">{new Date(ext.extensionDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 font-medium">{ext.reason || "No extension reason provided"}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic py-2">No return date extensions requested for this consignment.</p>
            )}
          </CardBody>
        </Card>

        {/* Audit History Log */}
        <Card>
          <CardHeader className="py-3.5">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Complete Consignment Audit Log ({memo.historyLog?.length || 0})
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {memo.historyLog && memo.historyLog.length > 0 ? (
              memo.historyLog.map((log, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-gray-900">
                    <span>{log.action}</span>
                    <span className="text-[11px] font-normal text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 font-medium">{log.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic py-2">No audit log entries recorded.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Convert to Sale Modal */}
      <Modal isOpen={saleOpen} onClose={() => setSaleOpen(false)} title="Convert Consignment Item to Sale">
        <form onSubmit={handleSaleSubmit} className="flex flex-col gap-4">
          <Select
            label="Payment Method *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "Cash", label: "Cash" },
              { value: "Credit Card", label: "Credit Card" },
              { value: "Bank Transfer", label: "Bank Transfer" },
              { value: "Cheque", label: "Cheque" },
              { value: "Crypto", label: "Crypto" },
            ]}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setSaleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isConverting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Generate Invoice &amp; Complete Sale
            </Button>
          </div>
        </form>
      </Modal>

      {/* Extend Memo Modal */}
      <Modal isOpen={extendOpen} onClose={() => setExtendOpen(false)} title="Extend Return Date">
        <form onSubmit={handleExtendSubmit} className="flex flex-col gap-4">
          <Input
            label="New Expected Return Date *"
            type="date"
            value={newExpectedReturn}
            onChange={(e) => setNewExpectedReturn(e.target.value)}
            required
          />
          <Textarea
            label="Extension Reason"
            value={extendReason}
            onChange={(e) => setExtendReason(e.target.value)}
            placeholder="e.g. Client requested extra time for appraisal..."
            rows={2}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isExtending}>
              Confirm Extension
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={returnConfirm.open}
        onClose={() => setReturnConfirm({ open: false, itemId: null, isLoading: false })}
        onConfirm={handleConfirmReturn}
        title="Confirm Stock Return"
        message="Mark this consigned item as returned to company stock? This will restore the item's status to In Stock."
        confirmLabel="Confirm Return"
        isLoading={returnConfirm.isLoading}
      />
    </div>
  );
}
