import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Trash2, FileDown, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useSales, downloadInvoicePdf } from "../hooks/useSales";
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
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function SalesList() {
  const { sales, isLoading, isError, createSale } = useSales();
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { gemstones } = useGemstones();
  const { showSuccess, showError } = useToast();

  // Client-side search
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 250);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (customers && customers.length > 0 && !customerId) {
      setCustomerId(customers[0]._id);
    }
  }, [customers, customerId]);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch sales invoices.");
    }
  }, [isError, showError]);

  const [items, setItems] = useState([]);

  const [newItemType, setNewItemType] = useState("Product");
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  const handleOpenAdd = () => {
    if (customers && customers.length > 0) {
      setCustomerId(customers[0]._id);
    } else {
      setCustomerId("");
    }
    setPaymentMethod("Cash");
    setDiscount(0);
    setTax(0);
    setNotes("");
    setItems([]);
    setIsOpen(true);
  };

  const handleItemTypeChange = (type) => {
    setNewItemType(type);
    setNewItemId("");
    setNewItemPrice(0);
  };

  const handleItemChange = (id) => {
    setNewItemId(id);
    if (newItemType === "Product") {
      const match = products.find((p) => p._id === id);
      setNewItemPrice(match ? match.sellingPrice : 0);
    } else {
      const match = gemstones.find((g) => g._id === id);
      setNewItemPrice(match ? match.purchasePrice * 1.25 : 0);
    }
  };

  const handleAddItem = () => {
    if (!newItemId) return;
    setItems([
      ...items,
      {
        inventoryType: newItemType,
        inventoryId: newItemId,
        quantity: Number(newItemQty),
        sellingPrice: Number(newItemPrice),
      },
    ]);
    setNewItemId("");
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showError("Checkout Error", "Please add at least one item to purchase order invoice.");
      return;
    }
    try {
      setIsSubmitting(true);
      await createSale({
        customerId,
        paymentMethod,
        discount: Number(discount),
        tax: Number(tax),
        notes,
        items,
      });
      showSuccess("Invoice Created", "Direct sales checkout completed and invoice generated!");
      setIsOpen(false);
    } catch (err) {
      showError("Checkout Failed", err?.response?.data?.message || "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerOptions = customers.map((c) => ({ value: c._id, label: c.fullName }));

  // Client-side filter by invoice number or customer name
  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter(
      (s) =>
        s.invoiceNo?.toLowerCase().includes(q) ||
        s.customerId?.fullName?.toLowerCase().includes(q) ||
        s.paymentMethod?.toLowerCase().includes(q)
    );
  }, [sales, search]);

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
      {isLoading && !sales?.length ? (
        <SkeletonPageHeader />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">Sales &amp; Invoicing</h1>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Select customer, add items, apply discounts, complete the sale, and automatically update inventory, profit, and charity.
              </p>
            </div>
            <Button onClick={handleOpenAdd} className="w-fit">
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <SearchInput
              placeholder="Search by invoice no, customer name, or payment method..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              containerClassName="max-w-lg w-full"
              id="sales-search"
            />
            {search && (
              <span className="text-xs text-gray-400 font-medium shrink-0">
                {filteredSales.length} result{filteredSales.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </>
      )}

      <DataTable
        headers={[
          "Invoice No",
          "Customer",
          "Subtotal",
          "Total Price",
          "Charity Contribution",
          "Method",
          "Date",
          "Actions",
        ]}
        data={filteredSales}
        isLoading={isLoading}
        emptyMessage="No sales invoices registered."
        renderRow={(sale) => (
          <tr
            key={sale._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
          >
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-primary text-xs sm:text-sm">{sale.invoiceNo}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">{sale.customerId?.fullName || "—"}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-gray-600 text-xs sm:text-sm">${sale.subtotal.toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-gray-900 font-bold text-xs sm:text-sm">${sale.total.toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-amber-600 font-semibold text-xs sm:text-sm">
              ${(sale.charityAmount || 0).toLocaleString()}
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm">{sale.paymentMethod}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap text-xs sm:text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Link to={`/sales/${sale._id}`} title="View Invoice Details">
                  <TableActionButton
                    icon={Eye}
                    title="View Invoice Details"
                  />
                </Link>
                <TableActionButton
                  icon={FileDown}
                  title="Generate & Download PDF Invoice"
                  isLoading={downloadingId === sale._id}
                  disabled={Boolean(downloadingId)}
                  onClick={async () => {
                    try {
                      setDownloadingId(sale._id);
                      await downloadInvoicePdf(sale._id, sale.invoiceNo);
                      showSuccess("PDF Downloaded", `Invoice ${sale.invoiceNo} PDF downloaded.`);
                    } catch (err) {
                      showError("PDF Failed", "Failed to generate invoice PDF.");
                    } finally {
                      setDownloadingId(null);
                    }
                  }}
                />
              </div>
            </td>
          </tr>
        )}
        renderMobileCard={(sale, idx, { isExpanded, toggleExpand }) => (
          <div
            key={sale._id}
            className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden"
          >
            <button
              type="button"
              onClick={toggleExpand}
              className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-sm">{sale.invoiceNo}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">• {sale.customerId?.fullName || "Walk-in Client"}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-mono font-bold text-gray-900">${sale.total.toLocaleString()}</span>
                  <span className="text-gray-400 font-medium">{new Date(sale.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex flex-col gap-2.5 text-xs text-gray-700">
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Subtotal</span>
                  <span className="font-mono font-medium text-gray-900">${sale.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Charity Contribution</span>
                  <span className="font-mono font-semibold text-amber-600">${(sale.charityAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-900">{sale.paymentMethod}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/sales/${sale._id}`} title="View Invoice Details">
                    <TableActionButton
                      icon={Eye}
                      title="View Invoice Details"
                      showLabel
                      label="View"
                    />
                  </Link>
                  <TableActionButton
                    icon={FileDown}
                    title="Generate & Download PDF Invoice"
                    showLabel
                    label="Download PDF"
                    isLoading={downloadingId === sale._id}
                    disabled={Boolean(downloadingId)}
                    onClick={async () => {
                      try {
                        setDownloadingId(sale._id);
                        await downloadInvoicePdf(sale._id, sale.invoiceNo);
                        showSuccess("PDF Downloaded", `Invoice ${sale.invoiceNo} PDF downloaded.`);
                      } catch (err) {
                        showError("PDF Failed", "Failed to generate invoice PDF.");
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Direct Sale Checkout Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="New Sales Checkout Invoice"
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
            <Input
              label="Discount ($)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            <Input
              label="Tax ($)"
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </div>

          <div className="border border-gray-100 p-4 rounded-xl flex flex-col gap-3">
            <h4 className="font-semibold text-sm text-gray-800">Add Sale Items</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <Select
                label="Item Type"
                value={newItemType}
                onChange={(e) => handleItemTypeChange(e.target.value)}
                options={[
                  { value: "Product", label: "Product" },
                  { value: "Gemstone", label: "Gemstone" },
                ]}
              />
              <Select
                label="Select Item"
                value={newItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                options={availableItems}
              />
              <Input
                label="Qty"
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
              />
              <Input
                label="Price ($)"
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
                Add Item
              </Button>
            </div>

            {items.length > 0 && (
              <div className="mt-2">
                <DataTable
                  headers={["Item Details", "Price", "Qty", "Action"]}
                  data={items}
                  renderRow={(item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 text-xs">
                      <td className="px-4 py-2 font-medium">{getItemLabel(item)}</td>
                      <td className="px-4 py-2">${item.sellingPrice}</td>
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

          <Textarea label="Special Invoice Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>Print & Checkout Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
