import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Undo2,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Package,
  Calendar,
  Sparkles,
  PackagePlus,
  UserPlus,
} from "lucide-react";
import { useMemos } from "../hooks/useMemo";
import { useCustomers } from "@/modules/customers/hooks/useCustomers";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useGemstones } from "@/modules/inventory/hooks/useInventory";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import FilterPanel from "@/components/ui/FilterPanel";
import TableActionButton from "@/components/ui/TableActionButton";
import Card from "@/components/ui/Card";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function MemoList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const { memos, metrics, isLoading, isError, createMemo, extendMemo, returnMemoItem, convertMemoItem } = useMemos({
    status: statusFilter,
  });
  const { customers, createCustomer } = useCustomers();
  const { products } = useProducts();
  const { gemstones } = useGemstones();
  const { showSuccess, showError } = useToast();

  // Client-side search
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 250);

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extend Modal State
  const [extendMemoTarget, setExtendMemoTarget] = useState(null);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendDate, setExtendDate] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [isExtending, setIsExtending] = useState(false);

  // Convert to Sale Modal State
  const [convertTarget, setConvertTarget] = useState(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isConverting, setIsConverting] = useState(false);

  // Custom Return Confirm Dialog State
  const [returnConfirm, setReturnConfirm] = useState({ open: false, memo: null, item: null, isLoading: false });

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([]);

  // New Item Row Inputs
  const [newItemType, setNewItemType] = useState("Product");
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemValue, setNewItemValue] = useState(0);

  useEffect(() => {
    if (customers && customers.length > 0 && !customerId) {
      setCustomerId(customers[0]._id);
    }
  }, [customers, customerId]);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch approval memos.");
    }
  }, [isError, showError]);

  const handleOpenAdd = () => {
    if (customers && customers.length > 0) {
      setCustomerId(customers[0]._id);
    } else {
      setCustomerId("");
    }
    const defaultReturnDate = new Date();
    defaultReturnDate.setDate(defaultReturnDate.getDate() + 14);
    setExpectedReturn(defaultReturnDate.toISOString().split("T")[0]);
    setRemarks("");
    setItems([]);
    setIsOpen(true);
  };

  const handleItemTypeChange = (type) => {
    setNewItemType(type);
    setNewItemId("");
    setNewItemValue(0);
  };

  const handleItemSelect = (id) => {
    setNewItemId(id);
    if (newItemType === "Product") {
      const match = products.find((p) => p._id === id);
      setNewItemValue(match ? match.sellingPrice : 0);
    } else {
      const match = gemstones.find((g) => g._id === id);
      setNewItemValue(match ? Number(match.sellingPrice || (match.purchasePrice || match.costPrice || 0) * 1.25) : 0);
    }
  };

  const handleAddItem = () => {
    if (!newItemId) {
      showError("Validation Error", "Please select a product or gemstone to add.");
      return;
    }
    const exists = items.some((it) => it.inventoryId === newItemId && it.inventoryType === newItemType);
    if (exists) {
      showError("Duplicate Item", "This item has already been added to the memo.");
      return;
    }

    setItems([
      ...items,
      {
        inventoryType: newItemType,
        inventoryId: newItemId,
        quantity: Number(newItemQty || 1),
        value: Number(newItemValue || 0),
      },
    ]);
    setNewItemId("");
    setNewItemQty(1);
    setNewItemValue(0);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showError("Validation Error", "Please add at least one item to the memo.");
      return;
    }
    if (!expectedReturn) {
      showError("Validation Error", "Please select an expected return date.");
      return;
    }
    try {
      setIsSubmitting(true);
      await createMemo({
        customerId,
        expectedReturn,
        remarks,
        items,
      });
      showSuccess("Memo Created", "Consignment memo created successfully!");
      setIsOpen(false);
    } catch (err) {
      showError("Creation Failed", err?.response?.data?.message || "Failed to create consignment memo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extend Submit Handler
  const handleOpenExtend = (memo) => {
    setExtendMemoTarget(memo);
    const currDate = memo.expectedReturn ? new Date(memo.expectedReturn) : new Date();
    currDate.setDate(currDate.getDate() + 7);
    setExtendDate(currDate.toISOString().split("T")[0]);
    setExtendReason("Client requested extra time for inspection");
    setIsExtendOpen(true);
  };

  const handleSubmitExtend = async (e) => {
    e.preventDefault();
    if (!extendDate) return;
    try {
      setIsExtending(true);
      await extendMemo({
        id: extendMemoTarget._id,
        expectedReturn: extendDate,
        reason: extendReason,
      });
      showSuccess("Memo Extended", `Memo ${extendMemoTarget.memoNo} return date extended to ${new Date(extendDate).toLocaleDateString()}.`);
      setIsExtendOpen(false);
    } catch (err) {
      showError("Extension Failed", err?.response?.data?.message || "Failed to extend memo date.");
    } finally {
      setIsExtending(false);
    }
  };

  // Convert to Sale Handler
  const handleOpenConvert = (memo) => {
    setConvertTarget(memo);
    setPaymentMethod("Cash");
    setIsConvertOpen(true);
  };

  const handleSubmitConvert = async (e) => {
    e.preventDefault();
    if (!convertTarget || !convertTarget.items?.length) return;
    try {
      setIsConverting(true);
      // Convert first active on memo item
      const activeItem = convertTarget.items.find((i) => i.status === "On Memo") || convertTarget.items[0];
      await convertMemoItem({
        memoId: convertTarget._id,
        itemId: activeItem._id,
        paymentMethod,
      });
      showSuccess("Converted to Sale", `Memo ${convertTarget.memoNo} converted to official Sale & Invoice successfully!`);
      setIsConvertOpen(false);
    } catch (err) {
      showError("Conversion Failed", err?.response?.data?.message || "Failed to convert memo to sale.");
    } finally {
      setIsConverting(false);
    }
  };

  // Open Custom Return Modal
  const handleOpenReturnModal = (memo) => {
    const activeItem = memo.items.find((i) => i.status === "On Memo") || memo.items[0];
    if (!activeItem) return;
    setReturnConfirm({
      open: true,
      memo,
      item: activeItem,
      isLoading: false,
    });
  };

  // Confirm Custom Return Action
  const handleConfirmReturnAction = async () => {
    if (!returnConfirm.memo || !returnConfirm.item) return;
    try {
      setReturnConfirm((prev) => ({ ...prev, isLoading: true }));
      await returnMemoItem({
        memoId: returnConfirm.memo._id,
        itemId: returnConfirm.item._id,
      });
      showSuccess("Item Returned", `Item from Memo ${returnConfirm.memo.memoNo} returned to company stock successfully.`);
      setReturnConfirm({ open: false, memo: null, item: null, isLoading: false });
    } catch (err) {
      showError("Return Failed", err?.response?.data?.message || "Failed to return item from memo.");
      setReturnConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Sold":
      case "Closed":
        return "info";
      case "Fully Returned":
        return "success";
      case "Extended":
        return "neutral";
      case "With Client":
        return "warning";
      case "Overdue":
        return "danger";
      default:
        return "neutral";
    }
  };

  const availableItems = useMemo(() => {
    if (newItemType === "Product") {
      return (products || [])
        .filter((p) => p.status === "In Stock" || p.status === "Available")
        .map((p) => ({ value: p._id, label: `${p.productCode} - ${p.name} ($${p.sellingPrice})` }));
    } else {
      return (gemstones || [])
        .filter((g) => g.status === "In Stock" || g.status === "Available")
        .map((g) => ({
          value: g._id,
          label: `${g.stoneId} - ${g.gemstone} (${g.carat} ct) ($${g.sellingPrice || (g.purchasePrice || g.costPrice || 0) * 1.25})`,
        }));
    }
  }, [newItemType, products, gemstones]);

  const getItemLabel = (item) => {
    if (item.inventoryType === "Product") {
      const match = (products || []).find((p) => p._id === (item.inventoryId?._id || item.inventoryId));
      return match ? `${match.productCode} - ${match.name}` : "Jewellery Product";
    } else {
      const match = (gemstones || []).find((g) => g._id === (item.inventoryId?._id || item.inventoryId));
      return match ? `${match.stoneId} - ${match.gemstone}` : "Gemstone";
    }
  };

  const getItemSummary = (memo) => {
    if (!memo.items || memo.items.length === 0) return "No items";
    const first = memo.items[0];
    const firstLabel = getItemLabel(first);
    if (memo.items.length === 1) return firstLabel;
    return `${firstLabel} + ${memo.items.length - 1} more item(s)`;
  };

  const calculateDaysOut = (issueDate) => {
    if (!issueDate) return 0;
    const start = new Date(issueDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateMemoValue = (memo) => {
    if (memo.totalValue) return memo.totalValue;
    return (memo.items || []).reduce((sum, item) => sum + (item.totalValue || (item.value || 0) * (item.quantity || 1)), 0);
  };

  const filteredMemos = useMemo(() => {
    return (memos || []).filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNo = (m.memoNo || "").toLowerCase().includes(q);
        const matchCust = (m.customerId?.fullName || "").toLowerCase().includes(q);
        if (!matchNo && !matchCust) return false;
      }
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [memos, search, statusFilter]);

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
  };

  return (
    <div className="page-container space-y-6">
      {isLoading && !memos?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">Memos &amp; Consignments</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Track high-value stock temporarily issued to clients and dealers without transferring ownership.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            Create Memo
          </Button>
        </div>
      )}

      {/* High-Value Stock Outside Company Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock Outside Company Value */}
        <Card className="p-5 border-l-4 border-l-rose-500 bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Outside Company</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-display text-rose-700">
              ${(metrics.totalStockOutsideCompany || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-medium text-rose-800/80 mt-1">
              Active consignment value with clients
            </p>
          </div>
        </Card>

        {/* Active Memos */}
        <Card className="p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Memos</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-display text-gray-900">
              {metrics.activeMemosCount || 0} Active
            </p>
            <p className="text-[11px] font-medium text-gray-500 mt-1">
              Currently out on approval
            </p>
          </div>
        </Card>

        {/* Overdue / Extended Memos */}
        <Card className="p-5 border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overdue &amp; Extended</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-display text-purple-700">
              {metrics.overdueMemosCount || 0} Overdue / {metrics.extendedMemosCount || 0} Ext.
            </p>
            <p className="text-[11px] font-medium text-purple-800/80 mt-1">
              Requires return or date extension
            </p>
          </div>
        </Card>

        {/* Items Sold / Converted */}
        <Card className="p-5 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Converted Sales</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-display text-emerald-700">
              {metrics.itemsSoldFromMemoCount || 0} Items Sold
            </p>
            <p className="text-[11px] font-medium text-emerald-800/80 mt-1">
              Converted directly into sales invoices
            </p>
          </div>
        </Card>
      </div>

      {/* Main Search & Filters Card with Collapsible Accordion */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Filter Consignments"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchInput
            label="Search Consignments"
            placeholder="Search memo number or client name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClear={() => setSearchInput("")}
            className="w-full"
          />

          <Select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Consignment Statuses" },
              { value: "Active", label: "Active Dues Only" },
              { value: "With Client", label: "With Client" },
              { value: "Extended", label: "Extended Date" },
              { value: "Overdue", label: "Overdue Follow-up" },
              { value: "Fully Returned", label: "Fully Returned" },
              { value: "Sold", label: "Converted to Sale" },
            ]}
          />
        </div>
      </FilterPanel>

      {/* Table & Mobile View */}
      <DataTable
        headers={[
          "Memo No",
          "Client",
          "Items Description",
          "Total Value",
          "Date Out",
          "Expected Return",
          "Days Out",
          "Status",
          "Actions",
        ]}
        data={filteredMemos}
        isLoading={isLoading}
        emptyMessage="No memo or consignment records found."
        renderRow={(memo) => {
          const val = calculateMemoValue(memo);
          const daysOut = calculateDaysOut(memo.issueDate);

          return (
            <tr key={memo._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm">
              <td className="px-4 py-3.5 font-mono font-bold text-primary">{memo.memoNo}</td>
              <td className="px-4 py-3.5 font-bold text-gray-900">{memo.customerId?.fullName || "Walk-in Client"}</td>
              <td className="px-4 py-3.5 text-gray-700 font-medium max-w-xs truncate">{getItemSummary(memo)}</td>
              <td className="px-4 py-3.5 font-mono text-gray-900 font-bold">${val.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{new Date(memo.issueDate || memo.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3.5 text-gray-900 font-medium whitespace-nowrap">{new Date(memo.expectedReturn).toLocaleDateString()}</td>
              <td className="px-4 py-3.5 font-mono font-semibold text-gray-700">{daysOut} days</td>
              <td className="px-4 py-3.5">
                <Badge variant={getStatusVariant(memo.status)}>
                  {memo.status || "With Client"}
                </Badge>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  {(memo.status === "With Client" || memo.status === "Extended" || memo.status === "Overdue" || memo.status === "Partially Returned") && (
                    <>
                      <TableActionButton
                        icon={Undo2}
                        title="Record Return to Stock"
                        onClick={() => handleOpenReturnModal(memo)}
                      />
                      <TableActionButton
                        icon={ShoppingCart}
                        title="Mark as Sold / Convert to Sale"
                        onClick={() => handleOpenConvert(memo)}
                      />
                      <TableActionButton
                        icon={Clock}
                        title="Extend Return Date"
                        onClick={() => handleOpenExtend(memo)}
                      />
                    </>
                  )}
                  <Link to={`/memos/${memo._id}`} title="View Consignment Details">
                    <TableActionButton icon={Eye} title="View Details" />
                  </Link>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Create Memo Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Consignment / Memo" className="max-w-2xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Client / Customer *"
            isSearchable
            type="customer"
            value={customerId}
            onChange={(val) => setCustomerId(typeof val === "string" ? val : val?.target?.value || "")}
            options={customers.map((c) => ({ value: c._id, label: `${c.fullName} ${c.companyName ? `(${c.companyName})` : ""}` }))}
            placeholder="Search customer name or company..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Expected Return Date *"
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              required
            />
            <Textarea
              label="Notes / Consignment Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. For client inspection, trade show exhibition..."
              rows={1}
            />
          </div>

          {/* Add Item Box */}
          <div className="space-y-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Add Inventory Items</h4>
              <button
                type="button"
                onClick={() => navigate("/products/add")}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PackagePlus className="h-3.5 w-3.5" /> + Add Product
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <Select
                label="Item Type"
                value={newItemType}
                onChange={(val) => handleItemTypeChange(typeof val === "string" ? val : val?.target?.value || "Product")}
                options={[
                  { value: "Product", label: "Finished Product" },
                  { value: "Gemstone", label: "Gemstone" },
                ]}
              />
              <Select
                label="Select Available Item"
                isSearchable
                value={newItemId}
                onChange={(val) => handleItemSelect(typeof val === "string" ? val : val?.target?.value || "")}
                options={availableItems}
                placeholder="Search title or stock no..."
              />
              <Input
                label="Selling Value ($)"
                type="number"
                step="0.01"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleAddItem}>
                + Add Item
              </Button>
            </div>

            {items.length > 0 && (
              <div className="mt-2 space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                    <span className="font-bold text-gray-900">{getItemLabel(it)} (Qty: {it.quantity})</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary">${(it.value * it.quantity).toLocaleString()}</span>
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-600 hover:bg-rose-50 p-1 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || items.length === 0}>
              Create Consignment Memo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Extend Date Modal */}
      {extendMemoTarget && (
        <Modal isOpen={isExtendOpen} onClose={() => setIsExtendOpen(false)} title={`Extend Return Date — ${extendMemoTarget.memoNo}`} className="max-w-md">
          <form onSubmit={handleSubmitExtend} className="flex flex-col gap-4">
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span>Client: <strong className="text-gray-900">{extendMemoTarget.customerId?.fullName}</strong></span>
              <br />
              <span>Current Return Date: <strong className="text-rose-700">{new Date(extendMemoTarget.expectedReturn).toLocaleDateString()}</strong></span>
            </div>

            <Input
              label="New Expected Return Date *"
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              required
            />

            <Textarea
              label="Extension Reason"
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              placeholder="e.g. Client requested 7 extra days for valuation..."
              rows={2}
            />

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsExtendOpen(false)} disabled={isExtending}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isExtending} disabled={isExtending}>
                Confirm Extension
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Convert to Sale Modal */}
      {convertTarget && (
        <Modal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} title={`Convert Memo to Sale — ${convertTarget.memoNo}`} className="max-w-md">
          <form onSubmit={handleSubmitConvert} className="flex flex-col gap-4">
            <div className="text-xs text-gray-600 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-900 block mb-1">Convert Consignment to Official Sale</span>
              <span>Client: <strong className="text-gray-900">{convertTarget.customerId?.fullName}</strong></span>
              <br />
              <span>Consignment Stock Value: <strong className="font-mono text-emerald-700">${calculateMemoValue(convertTarget).toLocaleString()}</strong></span>
            </div>

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
              <Button type="button" variant="outline" onClick={() => setIsConvertOpen(false)} disabled={isConverting}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isConverting} disabled={isConverting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Generate Invoice &amp; Complete Sale
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Custom Application Return Confirmation Popup */}
      <ConfirmDialog
        isOpen={returnConfirm.open}
        onClose={() => setReturnConfirm({ open: false, memo: null, item: null, isLoading: false })}
        onConfirm={handleConfirmReturnAction}
        title={`Confirm Stock Return — ${returnConfirm.memo?.memoNo}`}
        message={
          returnConfirm.memo ? (
            <div className="space-y-2 text-xs text-gray-700">
              <p>Are you sure you want to record the return of this consigned item back to company stock?</p>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                <p>Client: <strong className="text-gray-900">{returnConfirm.memo.customerId?.fullName}</strong></p>
                <p>Item: <strong className="text-gray-900">{getItemLabel(returnConfirm.item)}</strong></p>
                <p>Consignment Value: <strong className="font-mono text-primary">${(returnConfirm.item?.value * returnConfirm.item?.quantity).toLocaleString()}</strong></p>
              </div>
            </div>
          ) : ""
        }
        confirmLabel="Record Return to Stock"
        isLoading={returnConfirm.isLoading}
      />
    </div>
  );
}
