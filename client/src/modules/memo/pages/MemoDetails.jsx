import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShoppingCart } from "lucide-react";
import { useMemo } from "../hooks/useMemo";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

export default function MemoDetails() {
  const { id } = useParams();
  const { memo, isLoading, isError, returnMemoItem, convertMemoItem, extendMemo } = useMemo(id);
  const { showSuccess, showError } = useToast();

  const [saleOpen, setSaleOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [newExpectedReturn, setNewExpectedReturn] = useState("");
  const [returnConfirm, setReturnConfirm] = useState({ open: false, itemId: null, isLoading: false });

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    try {
      await extendMemo(newExpectedReturn);
      setExtendOpen(false);
      showSuccess("Extended", "Memo return date extended successfully!");
    } catch (err) {
      showError("Extend Failed", err?.response?.data?.message || "Failed to extend memo return date.");
    }
  };

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch approval memo details.");
    }
  }, [isError, showError]);

  if (isLoading) return <div className="text-gray-500 text-sm p-6">Loading memo details...</div>;
  if (isError || !memo)
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch approval memo details.
      </div>
    );

  const handleReturn = (itemId) => {
    setReturnConfirm({ open: true, itemId, isLoading: false });
  };

  const handleConfirmReturn = async () => {
    setReturnConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await returnMemoItem(returnConfirm.itemId);
      showSuccess("Returned", "Item has been successfully marked as returned to stock.");
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
      await convertMemoItem({
        itemId: selectedItemId,
        paymentMethod,
      });
      setSaleOpen(false);
      showSuccess("Sold", "Item successfully sold and purchase invoice generated!");
    } catch (err) {
      showError("Conversion Failed", err?.response?.data?.message || "Failed to process conversion to sale.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Sold":
        return "success";
      case "Returned":
        return "neutral";
      default:
        return "warning";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/memos"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Memos
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-display">Memo #{memo.memoNo}</h1>
            <Badge
              variant={
                memo.status === "Closed" || memo.status === "Fully Returned" ? "success" : "warning"
              }
            >
              {memo.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Customer: <span className="font-semibold text-gray-900">{memo.customerId?.fullName || "—"}</span> | Expected Return:{" "}
            <span className="font-semibold text-gray-900">
              {new Date(memo.expectedReturn).toLocaleDateString()}
            </span>
          </p>
        </div>
        {(memo.status === "With Client" || memo.status === "Partially Returned" || memo.status === "Overdue") && (
          <Button
            variant="outline"
            onClick={() => {
              setNewExpectedReturn(
                memo.expectedReturn ? new Date(memo.expectedReturn).toISOString().split("T")[0] : ""
              );
              setExtendOpen(true);
            }}
          >
            Extend Return Date
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Consigned Memo Items</h3>
        </div>
        <DataTable
          headers={["Type", "Item Details", "Qty", "Status", "Actions"]}
          data={memo.items || []}
          renderRow={(item) => (
            <tr key={item._id} className="border-b border-gray-100 text-sm">
              <td className="px-6 py-4 font-semibold text-gray-900">{item.inventoryType}</td>
              <td className="px-6 py-4 text-gray-600">
                {item.inventoryId
                  ? item.inventoryType === "Product"
                    ? `${item.inventoryId.productCode} - ${item.inventoryId.name}`
                    : `${item.inventoryId.stoneId} - ${item.inventoryId.gemstone}`
                  : "Linked Item Deleted"}
              </td>
              <td className="px-6 py-4 text-gray-900">{item.quantity}</td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
              </td>
              <td className="px-6 py-4">
                {item.status === "On Memo" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReturn(item._id)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Return Item to Stock"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenSale(item._id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Convert to Sale"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {item.status !== "On Memo" && <span className="text-xs text-gray-400">—</span>}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Convert to Sale Modal */}
      <Modal isOpen={saleOpen} onClose={() => setSaleOpen(false)} title="Convert Memo Item to Sale">
        <form onSubmit={handleSaleSubmit} className="flex flex-col gap-4">
          <Select
            label="Payment Method *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "Cash", label: "Cash" },
              { value: "Bank Transfer", label: "Bank Transfer" },
              { value: "Credit Card", label: "Credit Card" },
              { value: "Cheque", label: "Cheque" },
              { value: "Other", label: "Other" },
            ]}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setSaleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Extend Memo Modal */}
      <Modal isOpen={extendOpen} onClose={() => setExtendOpen(false)} title="Extend Memo Return Date">
        <form onSubmit={handleExtendSubmit} className="flex flex-col gap-4">
          <Input
            label="New Expected Return Date *"
            type="date"
            value={newExpectedReturn}
            onChange={(e) => setNewExpectedReturn(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Extend Return Date</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={returnConfirm.open}
        onClose={() => setReturnConfirm({ open: false, itemId: null, isLoading: false })}
        onConfirm={handleConfirmReturn}
        title="Confirm Return"
        message="Mark this item as returned to warehouse stock? This will update the memo status and restore the item to inventory."
        confirmLabel="Confirm Return"
        isLoading={returnConfirm.isLoading}
        variant="default"
      />
    </div>
  );
}
