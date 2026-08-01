import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, FileDown, CreditCard, ChevronDown, ChevronUp, ExternalLink, Sparkles, UserPlus, PackagePlus } from "lucide-react";
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
import FilterPanel from "@/components/ui/FilterPanel";
import TableActionButton from "@/components/ui/TableActionButton";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";
import RecordPaymentModal from "../components/RecordPaymentModal";

export default function SalesList() {
  const navigate = useNavigate();
  const { sales, isLoading, isError, createSale } = useSales();
  const { customers, createCustomer } = useCustomers();
  const { products, createProduct, isCreating: isCreatingProduct } = useProducts();
  const { gemstones } = useGemstones();
  const { showSuccess, showError } = useToast();

  // Client-side search & Payment Status Filter
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 250);

  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Record Payment Modal State
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Quick Customer Creation inline toggle
  const [isCreatingNewCust, setIsCreatingNewCust] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  const [tax, setTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([]);
  const [newItemType, setNewItemType] = useState("Product");
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [isGstEnabled, setIsGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);

  // Partial Gemstone Sale States
  const [newItemCarat, setNewItemCarat] = useState("");
  const [newItemPricePerCarat, setNewItemPricePerCarat] = useState("");
  const [newItemTotalPrice, setNewItemTotalPrice] = useState("");
  const [isManualPriceOverride, setIsManualPriceOverride] = useState(false);
  const [caratValidationError, setCaratValidationError] = useState("");

  const selectedGemstone = useMemo(() => {
    if (newItemType !== "Gemstone" || !newItemId) return null;
    return (gemstones || []).find((g) => g._id === newItemId) || null;
  }, [newItemType, newItemId, gemstones]);

  // Validation Error States
  const [formErrors, setFormErrors] = useState({});

  // Quick Product Creation Modal State
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductData, setQuickProductData] = useState({
    stockNo: "",
    name: "",
    category: "Jewellery",
    sellingPrice: "",
    costPrice: "",
    quantity: 1,
  });

  const handleOpenQuickProduct = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setQuickProductData({
      stockNo: `STK-${randomSuffix}`,
      name: "",
      category: "Jewellery",
      sellingPrice: "",
      costPrice: "",
      quantity: 1,
    });
    setIsQuickProductModalOpen(true);
  };

  const handleSaveQuickProduct = async (e) => {
    e.preventDefault();
    if (!quickProductData.name.trim()) {
      showError("Validation Error", "Product title is required.");
      return;
    }
    if (!quickProductData.sellingPrice || Number(quickProductData.sellingPrice) <= 0) {
      showError("Validation Error", "Please enter a valid selling price.");
      return;
    }

    try {
      const created = await createProduct({
        stockNo: quickProductData.stockNo,
        name: quickProductData.name,
        category: quickProductData.category,
        sellingPrice: Number(quickProductData.sellingPrice),
        costPrice: Number(quickProductData.costPrice || 0),
        quantity: Number(quickProductData.quantity || 1),
        status: "Available",
      });

      showSuccess("Product Created", `"${quickProductData.name}" created and added to inventory!`);
      setIsQuickProductModalOpen(false);

      // Auto select newly created product
      const newProdId = created?.data?._id || created?._id;
      setNewItemType("Product");
      if (newProdId) {
        setNewItemId(newProdId);
        setNewItemPrice(Number(quickProductData.sellingPrice));
      }
    } catch (err) {
      showError("Creation Failed", err?.response?.data?.message || "Failed to create product.");
    }
  };

  const handleNavigateToAddProduct = () => {
    sessionStorage.setItem(
      "draftSaleState",
      JSON.stringify({
        customerId,
        paymentMethod,
        discountType,
        discountValue,
        isTaxEnabled,
        taxPercentage,
        isGstEnabled,
        gstPercentage,
        notes,
        items,
      })
    );
    navigate("/products/add");
  };

  useEffect(() => {
    const savedDraft = sessionStorage.getItem("draftSaleState");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.customerId) setCustomerId(parsed.customerId);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.discountType) setDiscountType(parsed.discountType);
        if (parsed.discountValue !== undefined) setDiscountValue(parsed.discountValue);
        if (parsed.isTaxEnabled !== undefined) setIsTaxEnabled(parsed.isTaxEnabled);
        if (parsed.taxPercentage !== undefined) setTaxPercentage(parsed.taxPercentage);
        if (parsed.isGstEnabled !== undefined) setIsGstEnabled(parsed.isGstEnabled);
        if (parsed.gstPercentage !== undefined) setGstPercentage(parsed.gstPercentage);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.items && Array.isArray(parsed.items)) setItems(parsed.items);
        setIsOpen(true);
        sessionStorage.removeItem("draftSaleState");
      } catch (err) {
        sessionStorage.removeItem("draftSaleState");
      }
    }
  }, []);

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

  const handleOpenAdd = () => {
    if (customers && customers.length > 0) {
      setCustomerId(customers[0]._id);
    } else {
      setCustomerId("");
    }
    setIsCreatingNewCust(false);
    setPaymentMethod("Cash");
    setDiscountType("fixed");
    setDiscountValue(0);
    setIsTaxEnabled(false);
    setTaxPercentage(0);
    setIsGstEnabled(false);
    setGstPercentage(0);
    setTax(0);
    setAmountPaid("");
    setNotes("");
    setItems([]);
    setFormErrors({});
    setIsOpen(true);
  };

  const handleCreateInlineCustomer = async () => {
    if (!newCustName.trim()) {
      showError("Validation Error", "Please fill in customer name.");
      setFormErrors((prev) => ({ ...prev, newCustName: "This field is required." }));
      return;
    }
    try {
      setIsSavingCustomer(true);
      const created = await createCustomer({
        fullName: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        companyName: newCustCompany,
      });
      showSuccess("Customer Created", `Customer "${newCustName}" created successfully!`);
      setCustomerId(created.data?._id || created._id);
      setIsCreatingNewCust(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustCompany("");
      setFormErrors((prev) => ({ ...prev, customerId: null }));
    } catch (err) {
      showError("Creation Failed", err?.response?.data?.message || "Failed to create customer.");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleItemTypeChange = (type) => {
    setNewItemType(type);
    setNewItemId("");
    setNewItemPrice(0);
    setNewItemQty(1);
    setNewItemCarat("");
    setNewItemPricePerCarat("");
    setNewItemTotalPrice("");
    setIsManualPriceOverride(false);
    setCaratValidationError("");
  };

  const handleItemChange = (id) => {
    setNewItemId(id);
    if (newItemType === "Product") {
      const match = products.find((p) => p._id === id);
      setNewItemPrice(match ? match.sellingPrice : 0);
    } else {
      const match = (gemstones || []).find((g) => g._id === id);
      if (match) {
        const availCarat = match.carat || 0;
        const defaultCostPerCarat = match.costPerCarat || ((match.originalCarat || match.carat) > 0 ? match.purchasePrice / (match.originalCarat || match.carat) : 0);
        const defaultPerCarat = match.sellingPrice ? match.sellingPrice : defaultCostPerCarat * 1.25;

        setNewItemCarat(availCarat);
        setNewItemPricePerCarat(Number(defaultPerCarat.toFixed(2)));
        setNewItemTotalPrice(Number((availCarat * defaultPerCarat).toFixed(2)));
        setIsManualPriceOverride(false);
        setCaratValidationError("");
      } else {
        setNewItemCarat("");
        setNewItemPricePerCarat("");
        setNewItemTotalPrice("");
      }
    }
  };

  const handleCaratChange = (valStr) => {
    setNewItemCarat(valStr);
    const caratVal = parseFloat(valStr);
    if (!valStr || isNaN(caratVal) || caratVal <= 0) {
      setCaratValidationError("Selling carat weight must be greater than 0.");
    } else if (selectedGemstone && caratVal > selectedGemstone.carat + 0.0001) {
      setCaratValidationError(`Cannot sell more than the available stock (${selectedGemstone.carat.toFixed(2)} ct).`);
    } else {
      setCaratValidationError("");
    }

    if (!isNaN(caratVal) && caratVal > 0) {
      const perCarat = parseFloat(newItemPricePerCarat) || 0;
      setNewItemTotalPrice(Number((caratVal * perCarat).toFixed(2)));
    }
  };

  const handlePricePerCaratChange = (valStr) => {
    setNewItemPricePerCarat(valStr);
    setIsManualPriceOverride(true);
    const perCaratVal = parseFloat(valStr) || 0;
    const caratVal = parseFloat(newItemCarat) || 0;
    setNewItemTotalPrice(Number((caratVal * perCaratVal).toFixed(2)));
  };

  const handleTotalPriceChange = (valStr) => {
    setNewItemTotalPrice(valStr);
    setIsManualPriceOverride(true);
    const totalVal = parseFloat(valStr) || 0;
    const caratVal = parseFloat(newItemCarat) || 0;
    if (caratVal > 0) {
      setNewItemPricePerCarat(Number((totalVal / caratVal).toFixed(2)));
    }
  };

  const handleResetPricing = () => {
    if (!selectedGemstone) return;
    const defaultCostPerCarat = selectedGemstone.costPerCarat || ((selectedGemstone.originalCarat || selectedGemstone.carat) > 0 ? selectedGemstone.purchasePrice / (selectedGemstone.originalCarat || selectedGemstone.carat) : 0);
    const defaultPerCarat = selectedGemstone.sellingPrice ? selectedGemstone.sellingPrice : defaultCostPerCarat * 1.25;
    const caratVal = parseFloat(newItemCarat) || selectedGemstone.carat;

    setNewItemPricePerCarat(Number(defaultPerCarat.toFixed(2)));
    setNewItemTotalPrice(Number((caratVal * defaultPerCarat).toFixed(2)));
    setIsManualPriceOverride(false);
  };

  const handleAddItem = () => {
    if (!newItemId) {
      showError("Validation Error", "Please select a product or gemstone to add.");
      setFormErrors((prev) => ({ ...prev, newItemId: "Please select an item." }));
      return;
    }

    const exists = items.some((it) => it.inventoryId === newItemId && it.inventoryType === newItemType);
    if (exists) {
      showError("Duplicate Item", "This item has already been added to the sales invoice.");
      return;
    }

    if (newItemType === "Product") {
      if (Number(newItemQty) <= 0) {
        showError("Validation Error", "Quantity must be greater than 0.");
        return;
      }
      setItems([
        ...items,
        {
          inventoryType: newItemType,
          inventoryId: newItemId,
          quantity: Number(newItemQty || 1),
          sellingPrice: Number(newItemPrice || 0),
        },
      ]);
    } else if (newItemType === "Gemstone") {
      const caratVal = parseFloat(newItemCarat);
      if (isNaN(caratVal) || caratVal <= 0) {
        showError("Validation Error", "Selling carat weight must be greater than 0.");
        setCaratValidationError("Selling carat weight must be greater than 0.");
        return;
      }
      if (selectedGemstone && caratVal > selectedGemstone.carat + 0.0001) {
        const msg = `Cannot sell more than the available stock (${selectedGemstone.carat.toFixed(2)} ct).`;
        showError("Validation Error", msg);
        setCaratValidationError(msg);
        return;
      }
      const totalVal = parseFloat(newItemTotalPrice);
      if (isNaN(totalVal) || totalVal <= 0) {
        showError("Validation Error", "Total selling price must be greater than 0.");
        return;
      }

      const defaultCostPerCarat = selectedGemstone ? (selectedGemstone.costPerCarat || ((selectedGemstone.originalCarat || selectedGemstone.carat) > 0 ? selectedGemstone.purchasePrice / (selectedGemstone.originalCarat || selectedGemstone.carat) : 0)) : 0;

      setItems([
        ...items,
        {
          inventoryType: "Gemstone",
          inventoryId: newItemId,
          quantity: 1,
          caratWeight: caratVal,
          pricePerCarat: parseFloat(newItemPricePerCarat) || 0,
          costPerCarat: defaultCostPerCarat,
          pricingType: isManualPriceOverride ? "manual" : "default",
          sellingPrice: totalVal,
        },
      ]);
    }

    setNewItemId("");
    setNewItemQty(1);
    setNewItemPrice(0);
    setNewItemCarat("");
    setNewItemPricePerCarat("");
    setNewItemTotalPrice("");
    setIsManualPriceOverride(false);
    setCaratValidationError("");
    setFormErrors((prev) => ({ ...prev, items: null, newItemId: null }));
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.inventoryType === "Gemstone") {
        return sum + Number(item.sellingPrice || 0);
      }
      return sum + Number(item.sellingPrice || 0) * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const computedDiscount = useMemo(() => {
    const val = Number(discountValue || 0);
    if (discountType === "percentage") {
      return (subtotal * Math.min(100, Math.max(0, val))) / 100;
    }
    return Math.min(subtotal, Math.max(0, val));
  }, [subtotal, discountType, discountValue]);

  const netSubtotal = useMemo(() => {
    return Math.max(0, subtotal - computedDiscount);
  }, [subtotal, computedDiscount]);

  const calculatedTaxAmount = useMemo(() => {
    if (!isTaxEnabled) return 0;
    return (netSubtotal * Number(taxPercentage || 0)) / 100;
  }, [isTaxEnabled, netSubtotal, taxPercentage]);

  const calculatedGstAmount = useMemo(() => {
    if (!isGstEnabled) return 0;
    return (netSubtotal * Number(gstPercentage || 0)) / 100;
  }, [isGstEnabled, netSubtotal, gstPercentage]);

  const totalTaxes = useMemo(() => {
    return calculatedTaxAmount + calculatedGstAmount + Number(tax || 0);
  }, [calculatedTaxAmount, calculatedGstAmount, tax]);

  const finalPrice = useMemo(() => {
    return Math.max(0, netSubtotal + totalTaxes);
  }, [netSubtotal, totalTaxes]);

  const paidAmountNum = Number(amountPaid !== "" ? amountPaid : finalPrice);
  const balanceDue = Math.max(0, finalPrice - paidAmountNum);

  const paymentStatusDerived = useMemo(() => {
    if (paidAmountNum >= finalPrice && finalPrice > 0) return "Paid";
    if (paidAmountNum > 0) return "Partially Paid";
    return "Unpaid";
  }, [paidAmountNum, finalPrice]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!customerId && !isCreatingNewCust) {
      errors.customerId = "Please select a customer for this sale.";
    }
    if (isCreatingNewCust && !newCustName.trim()) {
      errors.newCustName = "Customer name is required.";
    }
    if (items.length === 0) {
      errors.items = "Please add at least one product or gemstone to complete the sale.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showError("Validation Error", "Please fill in all required fields highlighted in red.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createSale({
        customerId,
        paymentMethod,
        discountType,
        discountValue: Number(discountValue || 0),
        discount: computedDiscount,
        isTaxEnabled,
        taxPercentage: Number(taxPercentage || 0),
        taxAmount: calculatedTaxAmount,
        isGstEnabled,
        gstPercentage: Number(gstPercentage || 0),
        gstAmount: calculatedGstAmount,
        tax: totalTaxes,
        amountPaid: paidAmountNum,
        paymentStatus: paymentStatusDerived,
        notes,
        items,
      });
      showSuccess("Sale Completed!", `Invoice generated successfully! Status: ${paymentStatusDerived}`);
      setIsOpen(false);
    } catch (err) {
      showError("Sale Failed", err?.response?.data?.message || "Failed to process sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerOptions = customers.map((c) => ({ value: c._id, label: `${c.fullName} ${c.companyName ? `(${c.companyName})` : ""}` }));

  let availableItems = [];
  if (newItemType === "Product") {
    availableItems = products
      .filter((p) => p.status === "In Stock" || p.status === "Available")
      .map((p) => ({ value: p._id, label: `${p.productCode} - ${p.name} ($${p.sellingPrice})` }));
  } else if (newItemType === "Gemstone") {
    availableItems = gemstones
      .filter((g) => g.status === "In Stock" || g.status === "Available")
      .map((g) => ({ value: g._id, label: `${g.stoneId} - ${g.gemstone} (${g.carat} ct) ($${g.sellingPrice || (g.purchasePrice || g.costPrice || 0) * 1.25})` }));
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

  const filteredSales = useMemo(() => {
    return (sales || []).filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchInv = (s.invoiceNo || "").toLowerCase().includes(q);
        const matchCust = (s.customerId?.fullName || "").toLowerCase().includes(q);
        const matchPay = (s.paymentMethod || "").toLowerCase().includes(q);
        if (!matchInv && !matchCust && !matchPay) return false;
      }

      if (paymentStatusFilter === "Outstanding") {
        const paid = Number(s.amountPaid ?? (s.paymentStatus === "Paid" ? s.total : 0));
        const due = Number(s.balanceDue ?? Math.max(0, s.total - paid));
        if (due <= 0.001) return false;
      } else if (paymentStatusFilter !== "All" && s.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      if (paymentMethodFilter && s.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      return true;
    });
  }, [sales, search, paymentStatusFilter, paymentMethodFilter]);

  const activeFilterCount = (search ? 1 : 0) + (paymentStatusFilter !== "All" ? 1 : 0) + (paymentMethodFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearchInput("");
    setPaymentStatusFilter("All");
    setPaymentMethodFilter("");
  };

  const paymentOptions = [
    { value: "", label: "All Payment Methods" },
    { value: "Cash", label: "Cash" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Cheque", label: "Cheque" },
    { value: "Crypto", label: "Crypto" },
  ];

  const handleOpenPayment = (sale) => {
    setSelectedSaleForPayment(sale);
    setIsRecordPaymentOpen(true);
  };

  return (
    <div className="page-container space-y-0">
      {isLoading && !sales?.length ? (
        <SkeletonPageHeader />
      ) : (
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales &amp; Invoicing</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Payment &amp; Outstanding Balance Tracking: Unpaid &rarr; Partially Paid &rarr; Record Payment &rarr; Paid
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="w-fit" icon={<Plus className="h-4 w-4" />}>
            New Sale / Create Invoice
          </Button>
        </div>
      )}

      {/* Main Search & Filters Card */}
      <FilterPanel
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
        title="Sales &amp; Payment Filters"
        chips={
          activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Active Filters:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                  Search: "{search}"
                  <button onClick={() => setSearchInput("")}>✕</button>
                </span>
              )}
              {paymentStatusFilter !== "All" && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                  Status: {paymentStatusFilter}
                  <button onClick={() => setPaymentStatusFilter("All")}>✕</button>
                </span>
              )}
              {paymentMethodFilter && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                  Method: {paymentMethodFilter}
                  <button onClick={() => setPaymentMethodFilter("")}>✕</button>
                </span>
              )}

              <button onClick={handleResetFilters} className="text-xs font-bold text-danger hover:underline ml-auto">
                Clear All
              </button>
            </div>
          )
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Filter 1: Search */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
              Search Sales Invoices
            </label>
            <SearchInput
              placeholder="Search invoice no, customer name, payment method..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput("")}
              className="w-full"
              id="sales-search"
            />
          </div>

          {/* Filter 2: Payment Status */}
          <Select
            label="Payment Status"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            options={[
              { value: "All", label: "All Sales Invoices" },
              { value: "Outstanding", label: "Outstanding Balances Only" },
              { value: "Partially Paid", label: "Partially Paid" },
              { value: "Unpaid", label: "Unpaid" },
              { value: "Paid", label: "Fully Paid" },
              { value: "Overdue", label: "Overdue" },
            ]}
            containerClassName="w-full"
          />

          {/* Filter 3: Payment Method */}
          <Select
            label="Payment Method"
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            options={paymentOptions}
            containerClassName="w-full"
          />
        </div>
      </FilterPanel>

      {/* Results Counter Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredSales.length}</strong> of{" "}
          <strong className="text-gray-900">{sales.length}</strong> invoices
        </span>
      </div>

      <DataTable
        headers={[
          "Invoice No",
          "Customer",
          "Total Price",
          "Paid Amount",
          "Balance Due",
          "Payment Status",
          "Date",
          "Actions",
        ]}
        data={filteredSales}
        isLoading={isLoading}
        emptyMessage="No sales invoices found."
        renderRow={(sale) => {
          const totalVal = Number(sale.total || 0);
          const paidVal = Number(sale.amountPaid ?? (sale.paymentStatus === "Paid" ? totalVal : 0));
          const dueVal = Number(sale.balanceDue ?? Math.max(0, totalVal - paidVal));

          return (
            <tr
              key={sale._id}
              className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs sm:text-sm"
            >
              <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-bold text-primary">{sale.invoiceNo}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate">{sale.customerId?.fullName || "—"}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-gray-900 font-bold">${totalVal.toLocaleString()}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-emerald-700 font-bold">${paidVal.toLocaleString()}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-rose-700 font-bold">${dueVal.toLocaleString()}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${sale.paymentStatus === "Paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : sale.paymentStatus === "Partially Paid"
                      ? "bg-amber-100 text-amber-800"
                      : sale.paymentStatus === "Overdue"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-gray-100 text-gray-800"
                  }`}>
                  {sale.paymentStatus || "Paid"}
                </span>
              </td>
              <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString()}</td>
              <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  {dueVal > 0 && (
                    <TableActionButton
                      icon={CreditCard}
                      title="Record Payment"
                      onClick={() => handleOpenPayment(sale)}
                    />
                  )}
                  <Link to={`/sales/${sale._id}`} title="View Invoice Details">
                    <TableActionButton icon={Eye} title="View Invoice" />
                  </Link>
                  <TableActionButton
                    icon={FileDown}
                    title="Download PDF Invoice"
                    isLoading={downloadingId === sale._id}
                    disabled={Boolean(downloadingId)}
                    onClick={async () => {
                      try {
                        setDownloadingId(sale._id);
                        await downloadInvoicePdf(sale._id, sale.invoiceNo);
                        showSuccess("PDF Downloaded", `Invoice ${sale.invoiceNo} downloaded.`);
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
          );
        }}
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
                  <span className="text-xs text-gray-500 font-medium truncate">• {sale.customerId?.fullName || "Client"}</span>
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
                  <span className="font-semibold text-gray-500">Payment Status</span>
                  <span className="font-bold text-gray-900">{sale.paymentStatus || "Paid"}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-gray-100/60 pb-2">
                  <span className="font-semibold text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-900">{sale.paymentMethod}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Link to={`/sales/${sale._id}`} title="View Invoice Details">
                    <TableActionButton icon={Eye} title="View Invoice" showLabel label="View" />
                  </Link>
                  <TableActionButton
                    icon={FileDown}
                    title="Download PDF Invoice"
                    showLabel
                    label="PDF"
                    isLoading={downloadingId === sale._id}
                    disabled={Boolean(downloadingId)}
                    onClick={async () => {
                      try {
                        setDownloadingId(sale._id);
                        await downloadInvoicePdf(sale._id, sale.invoiceNo);
                        showSuccess("PDF Downloaded", `Invoice ${sale.invoiceNo} downloaded.`);
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

      {/* Complete Sales Workflow Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Complete New Sale Workflow"
        className="max-w-3xl"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Step 1: Select or Create Customer */}
          <div className={`p-4 rounded-xl border transition-colors space-y-3 ${formErrors.customerId || formErrors.newCustName ? "bg-rose-50/50 border-rose-300" : "bg-gray-50/80 border-gray-200/80"
            }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">1</span>
                Select Customer
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingNewCust(!isCreatingNewCust)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {isCreatingNewCust ? "Select Existing Customer" : "+ Add New Customer"}
              </button>
            </div>

            {!isCreatingNewCust ? (
              <div>
                <Select
                  label="Choose Customer *"
                  isSearchable
                  options={customerOptions}
                  value={customerId}
                  onChange={(val) => {
                    const str = typeof val === "string" ? val : val?.target?.value || "";
                    setCustomerId(str);
                    setFormErrors((prev) => ({ ...prev, customerId: null }));
                  }}
                  placeholder="Search customer name, phone, or company..."
                  required
                />
                {formErrors.customerId && (
                  <p className="text-xs font-semibold text-rose-600 mt-1">{formErrors.customerId}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <Input
                    label="Full Name *"
                    value={newCustName}
                    onChange={(e) => {
                      setNewCustName(e.target.value);
                      setFormErrors((prev) => ({ ...prev, newCustName: null }));
                    }}
                    placeholder="e.g. Siraj Ahmed"
                  />
                  {formErrors.newCustName && (
                    <p className="text-xs font-semibold text-rose-600 mt-1">{formErrors.newCustName}</p>
                  )}
                </div>
                <Input
                  label="Phone"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+966 ..."
                />
                <Input
                  label="Email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="client@example.com"
                />
                <Input
                  label="Company Name"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  placeholder="Takat Gems Inc."
                />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="button" size="sm" onClick={handleCreateInlineCustomer} isLoading={isSavingCustomer}>
                    Save &amp; Select Customer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Add Products / Stones */}
          <div className={`p-4 rounded-xl border transition-colors space-y-3 ${formErrors.items ? "bg-rose-50/50 border-rose-300" : "bg-gray-50/80 border-gray-200/80"
            }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">2</span>
                Add Products &amp; Gemstones
              </h4>
              <button
                type="button"
                onClick={handleNavigateToAddProduct}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                title="Go to Add Product page"
              >
                <PackagePlus className="h-3.5 w-3.5" /> + Add Product
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Item Type"
                  value={newItemType}
                  onChange={(val) => {
                    const str = typeof val === "string" ? val : val?.target?.value || "Product";
                    handleItemTypeChange(str);
                  }}
                  options={[
                    { value: "Product", label: "Finished Product" },
                    { value: "Gemstone", label: "Gemstone" },
                  ]}
                />
                <div className="sm:col-span-2">
                  <Select
                    label="Select In-Stock Item *"
                    isSearchable
                    options={availableItems}
                    value={newItemId}
                    onChange={(val) => {
                      const str = typeof val === "string" ? val : val?.target?.value || "";
                      handleItemChange(str);
                    }}
                    placeholder="Search title, SKU, stone ID, or stock no..."
                  />
                </div>
              </div>

              {/* Gemstone Selected - Display Gemstone Summary & Partial Sale Controls */}
              {newItemType === "Gemstone" && selectedGemstone && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  {/* Gemstone Form Details Card */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-gray-500 block font-medium">Gemstone Name:</span>
                      <strong className="text-gray-900">{selectedGemstone.gemstone} {selectedGemstone.variety ? `(${selectedGemstone.variety})` : ""}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block font-medium">Lot / Stock No:</span>
                      <strong className="text-gray-900 font-mono">{selectedGemstone.stockNo || selectedGemstone.stoneId}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block font-medium">Certificate No:</span>
                      <strong className="text-gray-900 font-mono">
                        {selectedGemstone.certificateId?.certificateNumber || selectedGemstone.certificateId?.number || "N/A"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block font-medium">Available Carat Weight:</span>
                      <strong className="text-emerald-700 font-bold">{selectedGemstone.carat.toFixed(2)} ct</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block font-medium">Cost per Carat:</span>
                      <strong className="text-gray-900 font-mono">
                        ${(selectedGemstone.costPerCarat || ((selectedGemstone.originalCarat || selectedGemstone.carat) > 0 ? selectedGemstone.purchasePrice / (selectedGemstone.originalCarat || selectedGemstone.carat) : 0)).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block font-medium">Default Price/ct:</span>
                      <strong className="text-primary font-mono font-bold">
                        ${(selectedGemstone.sellingPrice || ((selectedGemstone.costPerCarat || (selectedGemstone.purchasePrice / (selectedGemstone.originalCarat || selectedGemstone.carat))) * 1.25)).toFixed(2)}
                      </strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 block font-medium">Total Available Stock Value:</span>
                      <strong className="text-gray-900 font-mono">
                        ${(selectedGemstone.carat * (selectedGemstone.costPerCarat || (selectedGemstone.purchasePrice / (selectedGemstone.originalCarat || selectedGemstone.carat)))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  {/* Partial Sales & Pricing Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    <div>
                      <Input
                        label="Selling Carat Weight (ct) *"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedGemstone.carat}
                        value={newItemCarat}
                        onChange={(e) => handleCaratChange(e.target.value)}
                        placeholder={`Max ${selectedGemstone.carat} ct`}
                      />
                      {caratValidationError && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1">{caratValidationError}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        label="Price per Carat ($) *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItemPricePerCarat}
                        onChange={(e) => handlePricePerCaratChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        label="Total Selling Price ($) *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItemTotalPrice}
                        onChange={(e) => handleTotalPriceChange(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Live Carat Preview & Pricing Audit Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                    <div className="flex items-center gap-4">
                      <span>
                        Available: <strong className="font-mono">{selectedGemstone.carat.toFixed(2)} ct</strong>
                      </span>
                      <span>
                        Selling: <strong className="font-mono text-primary">{(parseFloat(newItemCarat) || 0).toFixed(2)} ct</strong>
                      </span>
                      <span>
                        Remaining Preview:{" "}
                        <strong
                          className={`font-mono font-bold ${
                            selectedGemstone.carat - (parseFloat(newItemCarat) || 0) < 0
                              ? "text-rose-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {Math.max(0, selectedGemstone.carat - (parseFloat(newItemCarat) || 0)).toFixed(2)} ct
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isManualPriceOverride ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isManualPriceOverride ? "Manual Price Adjustment" : "Default Pricing"}
                      </span>
                      {isManualPriceOverride && (
                        <button
                          type="button"
                          onClick={handleResetPricing}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Selected - Display Product Qty & Auto Price */}
              {newItemType === "Product" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Quantity *"
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
                  <Input
                    label="Auto Unit Price ($)"
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} icon={<Plus className="h-3.5 w-3.5" />}>
                  Add to Sale Invoice
                </Button>
              </div>
            </div>

            {formErrors.items && (
              <p className="text-xs font-semibold text-rose-600 bg-white p-2 rounded border border-rose-200">{formErrors.items}</p>
            )}

            {items.length > 0 && (
              <DataTable
                headers={["Item Description", "Item Type", "Qty / Carat Weight", "Price Details", "Item Total", "Action"]}
                data={items}
                renderRow={(item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 text-xs hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-bold text-gray-900">{getItemLabel(item)}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-600">{item.inventoryType}</td>
                    <td className="px-4 py-2.5 font-semibold">
                      {item.inventoryType === "Gemstone" ? `${item.caratWeight} ct` : `${item.quantity} pc`}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {item.inventoryType === "Gemstone"
                        ? `$${Number(item.pricePerCarat).toFixed(2)}/ct ${item.pricingType === "manual" ? "(Manual)" : ""}`
                        : `$${Number(item.sellingPrice).toLocaleString()} / unit`}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-primary">
                      ${(item.inventoryType === "Gemstone" ? item.sellingPrice : item.sellingPrice * item.quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
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
            )}
          </div>

          {/* Step 3 & 4: Discount & Separate Tax / GST Calculation */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 space-y-4">
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">3</span>
              Optional Discount, Tax &amp; GST Calculations
            </h4>

            {/* Optional Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-gray-200">
              <Select
                label="Optional Discount Type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                options={[
                  { value: "fixed", label: "Fixed Amount ($)" },
                  { value: "percentage", label: "Percentage (%)" },
                ]}
              />
              <Input
                label={discountType === "percentage" ? "Discount Rate (%)" : "Discount Amount ($)"}
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Optional (Defaults to $0)"
              />
            </div>

            {/* Separate Tax & GST Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tax Toggle */}
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTaxEnabled}
                      onChange={(e) => setIsTaxEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    Enable Sales Tax
                  </label>
                  {isTaxEnabled && <span className="text-xs font-bold text-primary">${calculatedTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
                </div>
                {isTaxEnabled && (
                  <Input
                    label="Tax Rate (%)"
                    type="number"
                    step="0.01"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    placeholder="e.g. 7%"
                  />
                )}
              </div>

              {/* GST Toggle */}
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isGstEnabled}
                      onChange={(e) => setIsGstEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    Enable GST
                  </label>
                  {isGstEnabled && <span className="text-xs font-bold text-primary">${calculatedGstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
                </div>
                {isGstEnabled && (
                  <Input
                    label="GST Rate (%)"
                    type="number"
                    step="0.01"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value)}
                    placeholder="e.g. 18%"
                  />
                )}
              </div>
            </div>

            {/* Price Summary Breakdown */}
            <div className="p-4 bg-white rounded-lg border border-gray-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block font-semibold">Subtotal:</span>
                <span className="font-mono font-bold text-sm text-gray-900">${subtotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">Discount:</span>
                <span className="font-mono font-bold text-sm text-rose-600">-${computedDiscount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">Tax ({isTaxEnabled ? `${taxPercentage}%` : "0%"}):</span>
                <span className="font-mono font-bold text-sm text-gray-900">${calculatedTaxAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-semibold">GST ({isGstEnabled ? `${gstPercentage}%` : "0%"}):</span>
                <span className="font-mono font-bold text-sm text-gray-900">${calculatedGstAmount.toLocaleString()}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-primary/5 p-2 rounded border border-primary/20">
                <span className="text-primary-dark block font-bold">Final Total:</span>
                <span className="font-mono font-bold text-base text-primary">${finalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Step 5: Payment & Balance Tracking */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">4</span>
              Record Payment Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-gray-200 items-end">
              <Select
                label="Payment Method *"
                type="paymentMethod"
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(typeof val === "string" ? val : val?.target?.value || "")}
              />
              <Input
                label="Amount Paid ($) *"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={`Default: $${finalPrice}`}
              />
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Status</label>
                <div className="h-10 flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 font-bold text-xs">
                  <span className={paymentStatusDerived === "Paid" ? "text-emerald-700" : paymentStatusDerived === "Partially Paid" ? "text-amber-700" : "text-rose-700"}>
                    {paymentStatusDerived} (Balance Due: ${balanceDue.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Textarea label="Invoice Special Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter warranty terms, delivery details..." />

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Complete Sale &amp; Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Additional Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedSaleForPayment(null);
        }}
        sale={selectedSaleForPayment}
      />

      {/* Record Additional Payment Modal */}
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
