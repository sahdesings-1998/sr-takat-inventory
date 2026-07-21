import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useMemos } from "../hooks/useMemo";
import { useCustomers } from "@/modules/customers/hooks/useCustomers";
import { useProducts } from "@/modules/products/hooks/useProducts";
import { useGemstones } from "@/modules/inventory/hooks/useInventory";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function MemoList() {
  const [statusFilter, setStatusFilter] = useState("");
  const { memos, isLoading, isError, createMemo } = useMemos({ status: statusFilter });
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { gemstones } = useGemstones();
  const { showSuccess, showError } = useToast();

  // Client-side search
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 250);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([]);

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

  const [newItemType, setNewItemType] = useState("Product");
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemWeight, setNewItemWeight] = useState(0);

  const handleOpenAdd = () => {
    if (customers && customers.length > 0) {
      setCustomerId(customers[0]._id);
    } else {
      setCustomerId("");
    }
    setExpectedReturn("");
    setRemarks("");
    setItems([]);
    setIsOpen(true);
  };

  const handleAddItem = () => {
    if (!newItemId) return;
    setItems([
      ...items,
      {
        inventoryType: newItemType,
        inventoryId: newItemId,
        quantity: Number(newItemQty),
        carat: Number(newItemWeight),
      },
    ]);
    setNewItemId("");
    setNewItemQty(1);
    setNewItemWeight(0);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showError("Validation Error", "Please add at least one item to the memo");
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
      showSuccess("Memo Created", "Approval memo has been created successfully!");
      setIsOpen(false);
    } catch (err) {
      showError("Creation Failed", err?.response?.data?.message || "Failed to create approval memo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Closed":
      case "Fully Returned":
        return "success";
      case "With Client":
        return "warning";
      case "Overdue":
        return "danger";
      default:
        return "info";
    }
  };

  const customerOptions = customers.map((c) => ({ value: c._id, label: c.fullName }));

  // Client-side filter by memo no or customer name
  const filteredMemos = useMemo(() => {
    if (!search.trim()) return memos;
    const q = search.toLowerCase();
    return memos.filter(
      (m) =>
        m.memoNo?.toLowerCase().includes(q) ||
        m.customerId?.fullName?.toLowerCase().includes(q)
    );
  }, [memos, search]);

  let availableItems = [];
  if (newItemType === "Product") {
    availableItems = products
      .filter((p) => p.status === "In Stock")
      .map((p) => ({ value: p._id, label: `${p.productCode} - ${p.name} ($${p.sellingPrice})` }));
  } else if (newItemType === "Gemstone") {
    availableItems = gemstones
      .filter((g) => g.status === "In Stock")
      .map((g) => ({ value: g._id, label: `${g.stoneId} - ${g.gemstone} (${g.carat} ct)` }));
  }

  const getItemLabel = (item) => {
    if (item.inventoryType === "Product") {
      const match = products.find((p) => p._id === item.inventoryId);
      return match ? `${match.productCode} - ${match.name}` : "Product Component";
    } else {
      const match = gemstones.find((g) => g._id === item.inventoryId);
      return match ? `${match.stoneId} - ${match.gemstone}` : "Gemstone Component";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {isLoading && !memos?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Memos &amp; Consignments</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Track stock sent to clients and dealers on consignment. Memos are automatically flagged Overdue when the return date passes.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit">
            <Plus className="h-4 w-4" /> Create Memo
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <SearchInput
          placeholder="Search by memo no or customer name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="flex-1 w-full"
          id="memos-search"
        />
        <Select
          placeholder="All Memo Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="w-full sm:w-56"
          options={[
            { value: "With Client", label: "With Client" },
            { value: "Partially Returned", label: "Partially Returned" },
            { value: "Fully Returned", label: "Fully Returned" },
            { value: "Overdue", label: "Overdue" },
            { value: "Closed", label: "Closed" },
          ]}
        />
        {(search || statusFilter) && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {filteredMemos.length} result{filteredMemos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={["Memo No", "Customer", "Expected Return", "Status", "Actions"]}
        data={filteredMemos}
        isLoading={isLoading}
        emptyMessage="No approval memos issued."
        renderRow={(memo) => (
          <tr
            key={memo._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-primary text-xs sm:text-sm">{memo.memoNo}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">
              {memo.customerId?.fullName || "—"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
              {memo.expectedReturn ? new Date(memo.expectedReturn).toLocaleDateString() : "—"}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-xs sm:text-sm">
              <Badge variant={getStatusVariant(memo.status)}>{memo.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <Link to={`/memos/${memo._id}`} title="View Details">
                <TableActionButton
                  icon={Eye}
                  title="View Details"
                />
              </Link>
            </td>
          </tr>
        )}
        renderMobileCard={(memo, idx, { isExpanded, toggleExpand }) => (
          <div
            key={memo._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{memo.memoNo}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {memo.customerId?.fullName || "—"}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="text-gray-500">Return: {memo.expectedReturn ? new Date(memo.expectedReturn).toLocaleDateString() : "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusVariant(memo.status)}>{memo.status}</Badge>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Customer Details</span>
                  <span className="font-medium text-gray-900 truncate">{memo.customerId?.fullName || "—"}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/memos/${memo._id}`} title="View Details">
                    <TableActionButton
                      icon={Eye}
                      title="View Details"
                      showLabel
                      label="View Details"
                    />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Add Memo Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Approval Memo"
        className="max-w-2xl"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select Customer *"
              options={customerOptions}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
            <DatePicker
              label="Expected Return Date *"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              required
            />
          </div>

          <div className="border border-gray-100 p-4 rounded-xl flex flex-col gap-3">
            <h4 className="font-semibold text-sm text-gray-800">Add Memo Items</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <Select
                label="Item Type"
                value={newItemType}
                onChange={(e) => {
                  setNewItemType(e.target.value);
                  setNewItemId("");
                }}
                options={[
                  { value: "Product", label: "Product" },
                  { value: "Gemstone", label: "Gemstone" },
                ]}
              />
              <Select
                label="Select Item"
                value={newItemId}
                onChange={(e) => setNewItemId(e.target.value)}
                options={availableItems}
              />
              <Input
                label="Quantity"
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
                Add Item
              </Button>
            </div>

            {items.length > 0 && (
              <div className="mt-2">
                <DataTable
                  headers={["Item Details", "Qty", "Action"]}
                  data={items}
                  renderRow={(item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 text-xs">
                      <td className="px-4 py-2 font-medium">{getItemLabel(item)}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-danger hover:bg-danger/10 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )}
                />
              </div>
            )}
          </div>

          <Textarea label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>Create Memo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
