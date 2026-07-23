import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  ArrowRightLeft,
  Clock,
  RotateCcw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Gem,
  HeartHandshake,
  Calculator,
} from "lucide-react";
import {
  useInventoryValuation,
  useGemstoneStockReport,
  useJewelleryStockReport,
  useSalesReport,
  useProfitReport,
  useCharityReport,
  useProductCostReport,
  useMemoReport,
  useSupplierPurchaseReport,
  useIncomeReport,
  useExpenseReport,
  useStockMovementReport,
} from "../hooks/useReports";
import { useCustomers } from "@/modules/customers/hooks/useCustomers";
import { useSuppliers } from "@/modules/suppliers/hooks/useSuppliers";
import { useUsers } from "@/modules/settings/hooks/useUsers";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import FilterPanel from "@/components/ui/FilterPanel";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ExcelJS from "exceljs";

const REPORT_TABS = [
  { id: "sales", label: "Sales Report", icon: DollarSign },
  { id: "profit", label: "Profit Report", icon: TrendingUp },
  { id: "charity", label: "Charity Report", icon: HeartHandshake },
  { id: "inventory-valuation", label: "Stock Valuation", icon: TrendingUp },
  { id: "gemstone-stock", label: "Gemstone Stock", icon: Package },
  { id: "jewellery-stock", label: "Jewellery Stock", icon: Package },
  { id: "product-cost", label: "Product Cost Breakdown", icon: Calculator },
  { id: "memo", label: "Consignment (Memos)", icon: ArrowRightLeft },
  { id: "purchases", label: "Supplier Purchases", icon: ShoppingBag },
  { id: "income", label: "Income Ledger", icon: TrendingUp },
  { id: "expenses", label: "Expense Ledger", icon: TrendingUp },
  { id: "stock-movement", label: "Stock Movement Log", icon: Clock },
];

function StatCard({ title, value, subtitle, icon: Icon, iconBg, trend, trendUp, featured, onClick }) {
  if (featured) {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0d3545] to-primary p-5 shadow-[0_8px_30px_rgba(10,73,88,0.22)] flex flex-col justify-between min-h-[145px] ${onClick ? "cursor-pointer" : ""}`}
      >
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-accent/10" />

        <div className="flex items-start justify-between gap-4 relative">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60 mb-1 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-[-0.03em]">{value}</p>
            <p className="mt-1 text-[11px] sm:text-[12px] text-white/60 font-medium leading-tight">{subtitle}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/15 shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[24px] bg-white border border-gray-100/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 flex flex-col justify-between min-h-[145px] ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1 truncate">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-bold font-mono text-gray-900 tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] sm:text-[12px] text-gray-600 font-medium leading-snug">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] shrink-0 ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState("sales");

  // Filters State
  const [filters, setFilters] = useState({
    dateRange: "ThisMonth",
    startDate: "",
    endDate: "",
    status: "All",
    category: "All",
    customerId: "All",
    supplierId: "All",
    workerId: "All",
    paymentMethod: "All",
    search: "",
  });

  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mobile Accordion state
  const [expandedRows, setExpandedRows] = useState({});

  // External Entities lists
  const { customers = [] } = useCustomers();
  const { suppliers = [] } = useSuppliers();
  const { data: usersData } = useUsers();
  const users = usersData?.data || [];

  // Reset page and sorting on tab or filter change
  useEffect(() => {
    setCurrentPage(1);
    setSortConfig({ key: "", direction: "" });
    setExpandedRows({});
  }, [activeTab, filters]);

  // Clean params mapping for query hooks
  const activeParams = useMemo(() => {
    const params = {
      dateRange: filters.dateRange,
      status: filters.status,
      category: filters.category,
      customerId: filters.customerId,
      supplierId: filters.supplierId,
      workerId: filters.workerId,
      paymentMethod: filters.paymentMethod,
      search: filters.search,
    };
    if (filters.dateRange === "Custom") {
      params.startDate = filters.startDate;
      params.endDate = filters.endDate;
    }
    return params;
  }, [filters]);

  // Load report data dynamically based on active tab
  const salesQuery = useSalesReport(activeParams);
  const profitQuery = useProfitReport(activeParams);
  const charityQuery = useCharityReport(activeParams);
  const productCostQuery = useProductCostReport(activeParams);
  const purchasesQuery = useSupplierPurchaseReport(activeParams);
  const valuationQuery = useInventoryValuation(activeParams);
  const gemstoneQuery = useGemstoneStockReport(activeParams);
  const jewelleryQuery = useJewelleryStockReport(activeParams);
  const memoQuery = useMemoReport(activeParams);
  const incomeQuery = useIncomeReport(activeParams);
  const expenseQuery = useExpenseReport(activeParams);
  const movementQuery = useStockMovementReport(activeParams);

  const activeQuery = useMemo(() => {
    switch (activeTab) {
      case "sales": return salesQuery;
      case "profit": return profitQuery;
      case "charity": return charityQuery;
      case "product-cost": return productCostQuery;
      case "purchases": return purchasesQuery;
      case "inventory-valuation": return valuationQuery;
      case "gemstone-stock": return gemstoneQuery;
      case "jewellery-stock": return jewelleryQuery;
      case "memo": return memoQuery;
      case "income": return incomeQuery;
      case "expenses": return expenseQuery;
      case "stock-movement": return movementQuery;
      default: return salesQuery;
    }
  }, [
    activeTab,
    salesQuery,
    profitQuery,
    charityQuery,
    productCostQuery,
    purchasesQuery,
    valuationQuery,
    gemstoneQuery,
    jewelleryQuery,
    memoQuery,
    incomeQuery,
    expenseQuery,
    movementQuery,
  ]);


  const reportData = activeQuery.data || [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const handleResetFilters = () => {
    setFilters({
      dateRange: "ThisMonth",
      startDate: "",
      endDate: "",
      status: "All",
      category: "All",
      customerId: "All",
      supplierId: "All",
      workerId: "All",
      paymentMethod: "All",
      search: "",
    });
    showSuccess("Filters Reset", "Filters have been reset to default values.");
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isFilterVisible = (filterName) => {
    switch (filterName) {
      case "dateRange":
        return ["sales", "profit", "charity", "product-cost", "purchases", "memo", "income", "expenses", "stock-movement"].includes(activeTab);
      case "status":
        return ["sales", "profit", "charity", "gemstone-stock", "jewellery-stock", "memo", "income", "expenses"].includes(activeTab);
      case "category":
        return ["inventory-valuation", "jewellery-stock", "product-cost", "expenses"].includes(activeTab);
      case "customer":
        return ["sales", "profit", "charity", "memo"].includes(activeTab);
      case "supplier":
        return ["purchases", "gemstone-stock"].includes(activeTab);
      case "paymentMethod":
        return ["sales", "profit", "income", "expenses"].includes(activeTab);
      case "search":
        return true;
      default:
        return false;
    }
  };

  const getStatusOptions = () => {
    switch (activeTab) {
      case "sales":
      case "profit":
      case "charity":
        return [
          { value: "All", label: "All Payment Statuses" },
          { value: "Paid", label: "Paid" },
          { value: "Partially Paid", label: "Partially Paid" },
          { value: "Unpaid", label: "Unpaid" },
        ];
      case "gemstone-stock":
        return [
          { value: "All", label: "All Statuses" },
          { value: "In Stock", label: "In Stock" },
          { value: "Reserved", label: "Reserved" },
          { value: "In Production", label: "In Production" },
          { value: "On Memo", label: "On Memo" },
        ];
      case "jewellery-stock":
        return [
          { value: "All", label: "All Statuses" },
          { value: "In Stock", label: "In Stock" },
          { value: "Reserved", label: "Reserved" },
          { value: "On Memo", label: "On Memo" },
        ];
      case "memo":
        return [
          { value: "All", label: "All Statuses" },
          { value: "With Client", label: "With Client" },
          { value: "Partially Returned", label: "Partially Returned" },
          { value: "Returned", label: "Returned" },
          { value: "Overdue", label: "Overdue" },
        ];
      case "income":
      case "expenses":
        return [
          { value: "All", label: "All Statuses" },
          { value: "Completed", label: "Completed" },
          { value: "Pending", label: "Pending" },
          { value: "Cancelled", label: "Cancelled" },
        ];
      default:
        return [];
    }
  };

  const getCategoryOptions = () => {
    switch (activeTab) {
      case "inventory-valuation":
        return [
          { value: "All", label: "All Categories" },
          { value: "Gemstone", label: "Gemstones" },
          { value: "Jewellery", label: "Jewellery" },
          { value: "Watch", label: "Watches" },
          { value: "Material", label: "Raw Materials" },
        ];
      case "jewellery-stock":
      case "product-cost":
        return [
          { value: "All", label: "All Categories" },
          { value: "Jewellery", label: "Jewellery" },
          { value: "Watch", label: "Watches" },
          { value: "Custom Product", label: "Custom Products" },
          { value: "Ring", label: "Rings" },
          { value: "Necklace", label: "Necklaces" },
          { value: "Earrings", label: "Earrings" },
        ];
      case "expenses":
        return [
          { value: "All", label: "All Categories" },
          { value: "Materials", label: "Materials" },
          { value: "Labor", label: "Labor" },
          { value: "Utilities", label: "Utilities" },
          { value: "Rent", label: "Rent" },
          { value: "Equipment", label: "Equipment" },
          { value: "Marketing", label: "Marketing" },
          { value: "Transportation", label: "Transportation" },
          { value: "Office Supplies", label: "Office Supplies" },
          { value: "Maintenance", label: "Maintenance" },
          { value: "Insurance", label: "Insurance" },
          { value: "Professional Fees", label: "Professional Fees" },
          { value: "Other", label: "Other" },
        ];
      default:
        return [];
    }
  };

  // Helper formats
  const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);
  const formatDate = (val) => (val ? new Date(val).toLocaleDateString() : "—");

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    if (isLoading || isError || !reportData) return {};
    switch (activeTab) {
      case "sales": {
        const totalRev = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.total || 0), 0) : 0;
        const totalGross = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.grossProfit || 0), 0) : 0;
        const totalNet = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.netProfit || 0), 0) : 0;
        const totalCharity = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.charityAmount || 0), 0) : 0;
        return {
          "Total Revenue": formatCurrency(totalRev),
          "Gross Profit": formatCurrency(totalGross),
          "Net Profit": formatCurrency(totalNet),
          "Charity Allocation": formatCurrency(totalCharity),
        };
      }
      case "profit": {
        const totalRev = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.totalRevenue || 0), 0) : 0;
        const totalCogs = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.cogs || 0), 0) : 0;
        const totalGross = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.grossProfit || 0), 0) : 0;
        const totalNet = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.netProfit || 0), 0) : 0;
        const avgGrossMargin = totalRev > 0 ? ((totalGross / totalRev) * 100).toFixed(1) + "%" : "0%";
        return {
          "Total Revenue": formatCurrency(totalRev),
          "Total COGS": formatCurrency(totalCogs),
          "Gross Profit": formatCurrency(totalGross),
          "Net Profit": formatCurrency(totalNet),
          "Gross Margin": avgGrossMargin,
        };
      }
      case "charity": {
        const totalCharity = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.charityAmount || 0), 0) : 0;
        const totalGross = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.grossProfit || 0), 0) : 0;
        return {
          "Total Charity Allocated": formatCurrency(totalCharity),
          "Allocation Rate": "20%",
          "Gross Profit Base": formatCurrency(totalGross),
          "Contributing Sales": Array.isArray(reportData) ? reportData.length : 0,
        };
      }
      case "product-cost": {
        const totalCost = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.costPrice || r.totalCost || 0), 0) : 0;
        const totalSelling = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.sellingPrice || 0), 0) : 0;
        const avgMargin = totalSelling > 0 ? (((totalSelling - totalCost) / totalSelling) * 100).toFixed(1) + "%" : "0%";
        return {
          "Total Inventory Cost": formatCurrency(totalCost),
          "Total Retail Value": formatCurrency(totalSelling),
          "Est. Gross Profit": formatCurrency(totalSelling - totalCost),
          "Avg Profit Margin": avgMargin,
        };
      }
      case "purchases": {
        const totalSpent = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.totalSpent || 0), 0) : 0;
        const totalCarats = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.totalCarats || 0), 0) : 0;
        return {
          "Total Spent": formatCurrency(totalSpent),
          "Total Carats purchased": (totalCarats || 0).toFixed(2),
          "Suppliers Count": Array.isArray(reportData) ? reportData.length : 0,
        };
      }
      case "inventory-valuation": {
        const val = reportData;
        return {
          "Total Valuation": formatCurrency(val.totalValue),
          "Gemstones Value": formatCurrency(val.gemstoneValue),
          "Products Value": formatCurrency(val.productValue),
          "Raw Materials Value": formatCurrency(val.materialValue),
        };
      }
      case "gemstone-stock": {
        const totalCost = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.purchasePrice || 0), 0) : 0;
        const totalCarats = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.carat || 0), 0) : 0;
        const totalPieces = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.pieces || 0), 0) : 0;
        return {
          "Total Cost Value": formatCurrency(totalCost),
          "Total Carats": totalCarats.toFixed(2),
          "Total Pieces": totalPieces,
          "Avg Cost per Carat": totalCarats > 0 ? formatCurrency(totalCost / totalCarats) : "$0.00",
        };
      }
      case "jewellery-stock": {
        const totalCost = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.costPrice || 0), 0) : 0;
        const totalSelling = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.sellingPrice || 0), 0) : 0;
        return {
          "Stock Cost Value": formatCurrency(totalCost),
          "Retail Selling Value": formatCurrency(totalSelling),
          "Est. Gross Profit Margin": formatCurrency(totalSelling - totalCost),
          "Total Stock Count": Array.isArray(reportData) ? reportData.length : 0,
        };
      }
      case "memo": {
        const totalValue = Array.isArray(reportData) ? reportData.reduce((sum, r) => {
          const memoVal = r.items?.reduce((valSum, item) => valSum + (item.price || 0) * (item.quantity || 1), 0) || 0;
          return sum + memoVal;
        }, 0) : 0;
        const overdueCount = Array.isArray(reportData) ? reportData.filter((r) => r.status === "Overdue" || (new Date() > new Date(r.expectedReturn) && r.status === "With Client")).length : 0;
        return {
          "Consigned Value": formatCurrency(totalValue),
          "Active Consignments": Array.isArray(reportData) ? reportData.length : 0,
          "Overdue Consignments": overdueCount,
        };
      }
      case "income": {
        const totalAmt = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.amount || 0), 0) : 0;
        const completedAmt = Array.isArray(reportData) ? reportData.filter((r) => r.status === "Completed").reduce((sum, r) => sum + (r.amount || 0), 0) : 0;
        return {
          "Total Ledger Income": formatCurrency(totalAmt),
          "Realized (Completed)": formatCurrency(completedAmt),
          "Ledger Transactions": Array.isArray(reportData) ? reportData.length : 0,
        };
      }
      case "expenses": {
        const totalAmt = Array.isArray(reportData) ? reportData.reduce((sum, r) => sum + (r.amount || 0), 0) : 0;
        const laborCosts = Array.isArray(reportData) ? reportData.filter((r) => r.category === "Labor").reduce((sum, r) => sum + (r.amount || 0), 0) : 0;
        const materialsCost = Array.isArray(reportData) ? reportData.filter((r) => r.category === "Materials").reduce((sum, r) => sum + (r.amount || 0), 0) : 0;
        return {
          "Total Expense Costs": formatCurrency(totalAmt),
          "Labor Costs": formatCurrency(laborCosts),
          "Materials Purchasing": formatCurrency(materialsCost),
        };
      }
      case "stock-movement": {
        return {
          "Logged Movements": Array.isArray(reportData) ? reportData.length : 0,
        };
      }
      default: return {};
    }
  }, [isLoading, isError, reportData, activeTab]);

  const getMetricIcon = (label) => {
    const l = label.toLowerCase();
    if (l.includes("revenue") || l.includes("spent") || l.includes("income")) return DollarSign;
    if (l.includes("profit") || l.includes("valuation") || l.includes("value")) return TrendingUp;
    if (l.includes("charity") || l.includes("rate")) return Percent;
    if (l.includes("count") || l.includes("pieces") || l.includes("items") || l.includes("consignments")) return Package;
    if (l.includes("carat")) return Gem;
    return DollarSign;
  };

  const getMetricIconBg = (label) => {
    const l = label.toLowerCase();
    if (l.includes("profit") || l.includes("realized") || l.includes("valuation")) return "bg-success/10 text-success";
    if (l.includes("charity") || l.includes("expense") || l.includes("overdue") || l.includes("cogs")) return "bg-danger/10 text-danger";
    return "bg-primary/10 text-primary";
  };

  // Headers mapping
  const tableHeaders = useMemo(() => {
    switch (activeTab) {
      case "sales":
        return [
          { key: "invoiceNo", label: "Invoice No" },
          { key: "customer", label: "Customer" },
          { key: "date", label: "Date" },
          { key: "paymentStatus", label: "Payment Status" },
          { key: "paymentMethod", label: "Payment Method" },
          { key: "total", label: "Total Revenue" },
          { key: "grossProfit", label: "Gross Profit" },
          { key: "netProfit", label: "Net Profit" },
          { key: "charityAmount", label: "Charity" },
        ];
      case "profit":
        return [
          { key: "invoiceNo", label: "Invoice No" },
          { key: "customer", label: "Customer" },
          { key: "date", label: "Date" },
          { key: "paymentStatus", label: "Status" },
          { key: "totalRevenue", label: "Total Revenue" },
          { key: "cogs", label: "COGS" },
          { key: "grossProfit", label: "Gross Profit" },
          { key: "charityAmount", label: "Charity (20%)" },
          { key: "netProfit", label: "Net Profit" },
          { key: "netMargin", label: "Net Margin %" },
        ];
      case "charity":
        return [
          { key: "invoiceNo", label: "Invoice No" },
          { key: "customer", label: "Customer" },
          { key: "date", label: "Date" },
          { key: "paymentStatus", label: "Status" },
          { key: "total", label: "Invoice Total" },
          { key: "grossProfit", label: "Gross Profit Base" },
          { key: "charityPercentage", label: "Allocation Rate" },
          { key: "charityAmount", label: "Charity Amount" },
        ];
      case "purchases":
        return [
          { key: "supplierName", label: "Supplier Name" },
          { key: "contact", label: "Contact Person" },
          { key: "purchasesCount", label: "Purchases Count" },
          { key: "totalCarats", label: "Total Carats" },
          { key: "totalSpent", label: "Total Spent" },
        ];
      case "inventory-valuation":
        return [
          { key: "category", label: "Asset Type" },
          { key: "value", label: "Current Stock Valuation" },
        ];
      case "gemstone-stock":
        return [
          { key: "stoneId", label: "Stone ID" },
          { key: "gemstone", label: "Gemstone" },
          { key: "variety", label: "Variety" },
          { key: "supplierId", label: "Supplier" },
          { key: "shape", label: "Shape" },
          { key: "carat", label: "Weight (Cts)" },
          { key: "pieces", label: "Pieces" },
          { key: "status", label: "Status" },
          { key: "purchasePrice", label: "Cost Price" },
        ];
      case "jewellery-stock":
        return [
          { key: "productCode", label: "Stock No / Code" },
          { key: "name", label: "Product Name" },
          { key: "category", label: "Category" },
          { key: "status", label: "Status" },
          { key: "costPrice", label: "Cost Price" },
          { key: "sellingPrice", label: "Retail Price" },
          { key: "margin", label: "Est. Margin" },
        ];
      case "product-cost":
        return [
          { key: "productCode", label: "Stock No / Code" },
          { key: "name", label: "Product Name" },
          { key: "category", label: "Category" },
          { key: "materialCost", label: "Material Cost" },
          { key: "manufacturingCost", label: "Labor Cost" },
          { key: "otherCosts", label: "Other Cost" },
          { key: "costPrice", label: "Total Cost" },
          { key: "sellingPrice", label: "Retail Price" },
          { key: "grossProfit", label: "Est. Profit" },
          { key: "margin", label: "Margin %" },
        ];
      case "memo":
        return [
          { key: "memoNo", label: "Memo No" },
          { key: "customer", label: "Client" },
          { key: "issueDate", label: "Issue Date" },
          { key: "expectedReturn", label: "Expected Return" },
          { key: "itemCount", label: "Total Items" },
          { key: "totalValue", label: "Total Value" },
          { key: "status", label: "Status" },
        ];
      case "income":
        return [
          { key: "date", label: "Date" },
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
          { key: "paymentMethod", label: "Payment Method" },
          { key: "reference", label: "Reference" },
          { key: "status", label: "Status" },
          { key: "amount", label: "Amount" },
        ];
      case "expenses":
        return [
          { key: "date", label: "Date" },
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
          { key: "vendor", label: "Vendor" },
          { key: "paymentMethod", label: "Payment Method" },
          { key: "reference", label: "Reference" },
          { key: "status", label: "Status" },
          { key: "amount", label: "Amount" },
        ];
      case "stock-movement":
        return [
          { key: "movementDate", label: "Log Timestamp" },
          { key: "type", label: "Type" },
          { key: "itemCode", label: "Item Code" },
          { key: "quantity", label: "Quantity" },
          { key: "action", label: "Action Log" },
          { key: "user", label: "Artisan / Operator" },
        ];
      default: return [];
    }
  }, [activeTab]);

  // Formatted Array Data for rendering and sorting
  const formattedDataList = useMemo(() => {
    if (!reportData || isLoading || isError) return [];

    // Custom Valuation structure mapping
    if (activeTab === "inventory-valuation") {
      return [
        { id: "1", category: "Gemstone Stock Assets", value: reportData.gemstoneValue || 0 },
        { id: "2", category: "Products Inventory", value: reportData.productValue || 0 },
        { id: "3", category: "Raw Materials Stock", value: reportData.materialValue || 0 },
      ];
    }

    if (!Array.isArray(reportData)) return [];

    return reportData.map((item, idx) => {
      const row = { ...item, original: item, indexId: item._id || String(idx) };
      if (activeTab === "sales") {
        row.customerName = item.customerId?.fullName || item.customerName || "—";
        row.dateStr = formatDate(item.createdAt);
      } else if (activeTab === "profit" || activeTab === "charity") {
        row.customerName = item.customerId?.fullName || item.customerName || "—";
        row.dateStr = formatDate(item.createdAt);
      } else if (activeTab === "gemstone-stock") {
        row.supplierName = item.supplierId?.companyName || "—";
      } else if (activeTab === "jewellery-stock") {
        row.margin = (row.sellingPrice || 0) - (row.costPrice || 0);
      } else if (activeTab === "product-cost") {
        row.materialCost = item.materialCost || item.costBreakdown?.materials?.gold || 0;
        row.manufacturingCost = item.manufacturingCost || item.costBreakdown?.production?.polishing || 0;
        row.otherCosts = item.otherCosts || 0;
        row.costPrice = item.costPrice || item.totalCost || 0;
        row.sellingPrice = item.sellingPrice || 0;
        row.grossProfit = (row.sellingPrice || 0) - (row.costPrice || 0);
        row.margin = row.sellingPrice > 0 ? (((row.sellingPrice - row.costPrice) / row.sellingPrice) * 100).toFixed(1) : 0;
      } else if (activeTab === "memo") {
        row.customerName = item.customerId?.fullName || "—";
        row.issueDateStr = formatDate(item.createdAt);
        row.expectedReturnStr = formatDate(item.expectedReturn);
        row.itemCount = item.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
        row.totalValue = item.items?.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0) || 0;
      } else if (activeTab === "income" || activeTab === "expenses") {
        row.dateStr = formatDate(item.date);
        row.createdBy = item.createdBy?.fullName || "—";
      } else if (activeTab === "stock-movement") {
        row.dateStr = new Date(item.movementDate).toLocaleString();
        row.user = item.user || "System";
      }
      return row;
    });
  }, [reportData, activeTab, isLoading, isError]);


  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return formattedDataList;
    const sorted = [...formattedDataList];
    sorted.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "customer" && activeTab === "sales") {
        valA = a.customerName;
        valB = b.customerName;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === "string") {
        return sortConfig.direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
    });
    return sorted;
  }, [formattedDataList, sortConfig, activeTab]);

  // Pagination bounds
  const paginatedData = useMemo(() => {
    if (activeTab === "inventory-valuation") return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, activeTab]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Mobile rendering helper blocks
  const getMobileTitle = (row) => {
    switch (activeTab) {
      case "sales": return `Invoice: ${row.invoiceNo}`;
      case "profit": return `Profit: ${row.invoiceNo}`;
      case "charity": return `Charity: ${row.invoiceNo}`;
      case "purchases": return row.supplierName;
      case "inventory-valuation": return row.category;
      case "gemstone-stock": return `Stone: ${row.stoneId}`;
      case "jewellery-stock": return row.name || row.productCode;
      case "product-cost": return `Cost: ${row.productCode}`;
      case "memo": return `Memo: ${row.memoNo}`;
      case "income": return row.description;
      case "expenses": return row.description;
      case "stock-movement": return `${row.type} - ${row.itemCode}`;
      default: return "Record";
    }
  };

  const getMobileSubtitle = (row) => {
    switch (activeTab) {
      case "sales": return `${row.customerName} | ${row.dateStr}`;
      case "profit": return `${row.customerName} | Net: ${formatCurrency(row.netProfit)}`;
      case "charity": return `${row.customerName} | Allocation: ${formatCurrency(row.charityAmount)}`;
      case "purchases": return `Contact: ${row.contact || "—"}`;
      case "inventory-valuation": return "Valuation Details";
      case "gemstone-stock": return `${row.gemstone} (${row.variety})`;
      case "jewellery-stock": return `Code: ${row.productCode} | Cat: ${row.category}`;
      case "product-cost": return `${row.name} | Total Cost: ${formatCurrency(row.costPrice)}`;
      case "memo": return `${row.customerName} | Issued: ${row.issueDateStr}`;
      case "income": return `${row.category} | ${row.dateStr}`;
      case "expenses": return `${row.category} | ${row.dateStr}`;
      case "stock-movement": return `${row.dateStr} by ${row.user}`;
      default: return "";
    }
  };

  const getMobileBadge = (row) => {
    switch (activeTab) {
      case "sales":
      case "profit":
      case "charity":
        return (
          <Badge variant={row.paymentStatus === "Paid" ? "success" : row.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
            {row.paymentStatus}
          </Badge>
        );
      case "gemstone-stock":
      case "jewellery-stock":
        return <Badge variant={row.status === "In Stock" ? "success" : "warning"}>{row.status}</Badge>;
      case "memo":
        return (
          <Badge variant={row.status === "Returned" ? "success" : row.status === "Overdue" ? "danger" : "warning"}>
            {row.status}
          </Badge>
        );
      case "income":
      case "expenses":
        return (
          <Badge variant={row.status === "Completed" ? "success" : row.status === "Pending" ? "warning" : "danger"}>
            {row.status}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getMobileExpandedDetails = (row) => {
    const itemStyle = "flex justify-between py-1 border-b border-gray-100 last:border-b-0";
    const labelStyle = "text-gray-400 font-medium";
    const valStyle = "text-gray-900 font-semibold font-mono";

    switch (activeTab) {
      case "sales":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Payment Method:</span><span className={valStyle}>{row.paymentMethod}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Subtotal:</span><span className={valStyle}>{formatCurrency(row.subtotal)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Discount:</span><span className={valStyle}>{formatCurrency(row.discount)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Tax:</span><span className={valStyle}>{formatCurrency(row.tax)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Total:</span><span className={valStyle}>{formatCurrency(row.total)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Gross Profit:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency(row.grossProfit)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Charity (20%):</span><span className={valStyle + " text-rose-500"}>{formatCurrency(row.charityAmount)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Net Profit:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency(row.netProfit)}</span></div>
          </>
        );
      case "profit":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Total Revenue:</span><span className={valStyle}>{formatCurrency(row.totalRevenue)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>COGS:</span><span className={valStyle}>{formatCurrency(row.cogs)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Gross Profit:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency(row.grossProfit)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Charity Allocation (20%):</span><span className={valStyle + " text-rose-500"}>{formatCurrency(row.charityAmount)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Net Profit:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency(row.netProfit)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Net Margin %:</span><span className={valStyle}>{row.netMargin}%</span></div>
          </>
        );
      case "charity":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Gross Profit Base:</span><span className={valStyle}>{formatCurrency(row.grossProfit)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Allocation Rate:</span><span className={valStyle}>{row.charityPercentage || 20}%</span></div>
            <div className={itemStyle}><span className={labelStyle}>Charity Amount:</span><span className={valStyle + " text-rose-500"}>{formatCurrency(row.charityAmount)}</span></div>
          </>
        );
      case "product-cost":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Material Cost:</span><span className={valStyle}>{formatCurrency(row.materialCost)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Labor/Manufacturing:</span><span className={valStyle}>{formatCurrency(row.manufacturingCost)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Other Cost:</span><span className={valStyle}>{formatCurrency(row.otherCosts)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Total Cost:</span><span className={valStyle}>{formatCurrency(row.costPrice)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Retail Price:</span><span className={valStyle}>{formatCurrency(row.sellingPrice)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Est. Profit:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency(row.grossProfit)}</span></div>
          </>
        );
      case "purchases":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Purchases Count:</span><span className={valStyle}>{row.purchasesCount}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Total Weight (Carats):</span><span className={valStyle}>{(row.totalCarats || 0).toFixed(2)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Total Spent:</span><span className={valStyle}>{formatCurrency(row.totalSpent)}</span></div>
          </>
        );
      case "inventory-valuation":
        return (
          <div className={itemStyle}><span className={labelStyle}>Valuation:</span><span className={valStyle}>{formatCurrency(row.value)}</span></div>
        );
      case "gemstone-stock":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Supplier:</span><span className={valStyle}>{row.supplierName}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Shape:</span><span className={valStyle}>{row.shape}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Weight (Carats):</span><span className={valStyle}>{(row.carat || 0).toFixed(2)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Pieces:</span><span className={valStyle}>{row.pieces}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Cost Price:</span><span className={valStyle}>{formatCurrency(row.purchasePrice)}</span></div>
          </>
        );
      case "jewellery-stock":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Cost Price:</span><span className={valStyle}>{formatCurrency(row.costPrice)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Retail Price:</span><span className={valStyle}>{formatCurrency(row.sellingPrice)}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Margin:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency((row.sellingPrice || 0) - (row.costPrice || 0))}</span></div>
          </>
        );
      case "memo":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Expected Return:</span><span className={valStyle}>{row.expectedReturnStr}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Total Items:</span><span className={valStyle}>{row.itemCount}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Total Value:</span><span className={valStyle}>{formatCurrency(row.totalValue)}</span></div>
          </>
        );
      case "income":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Payment Method:</span><span className={valStyle}>{row.paymentMethod}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Reference:</span><span className={valStyle}>{row.reference || "—"}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Created By:</span><span className={valStyle}>{row.createdBy}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Amount:</span><span className={valStyle + " text-emerald-600"}>{formatCurrency(row.amount)}</span></div>
          </>
        );
      case "expenses":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Vendor:</span><span className={valStyle}>{row.vendor || "—"}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Payment Method:</span><span className={valStyle}>{row.paymentMethod}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Reference:</span><span className={valStyle}>{row.reference || "—"}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Created By:</span><span className={valStyle}>{row.createdBy}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Amount:</span><span className={valStyle + " text-rose-600"}>{formatCurrency(row.amount)}</span></div>
          </>
        );
      case "stock-movement":
        return (
          <>
            <div className={itemStyle}><span className={labelStyle}>Quantity:</span><span className={valStyle}>{row.quantity}</span></div>
            <div className={itemStyle}><span className={labelStyle}>Action Log:</span><span className={valStyle}>{row.action}</span></div>
          </>
        );
      default:
        return null;
    }
  };

  // Excel Generator Logic
  const handleExportToExcel = async () => {
    if (!sortedData || sortedData.length === 0) {
      showError("Export Failed", "There is no filtered data available to export.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Filtered Report");

      const fontName = "Arial";

      worksheet.addRow([]);
      const companyRow = worksheet.addRow(["SR TAKAT INVENTORY MANAGEMENT"]);
      companyRow.font = { name: fontName, size: 16, bold: true, color: { argb: "1E293B" } };

      const activeTabLabel = REPORT_TABS.find((t) => t.id === activeTab)?.label || "Report";
      const subtitleRow = worksheet.addRow([`${activeTabLabel} - Real-time Export`]);
      subtitleRow.font = { name: fontName, size: 12, italic: true, color: { argb: "475569" } };

      const filterText = Object.entries(filters)
        .filter(([_, v]) => v && v !== "All")
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ") || "None";
      const generatedRow = worksheet.addRow([`Generated: ${new Date().toLocaleString()} | Filters Applied: ${filterText}`]);
      generatedRow.font = { name: fontName, size: 9, color: { argb: "64748B" } };

      worksheet.addRow([]);

      let headersList = [];
      let keysList = [];
      let formatMap = {};
      let alignmentMap = {};

      switch (activeTab) {
        case "sales":
          headersList = ["Invoice No", "Customer", "Date", "Payment Status", "Payment Method", "Subtotal", "Discount", "Tax", "Total Revenue", "Gross Profit", "Charity", "Net Profit"];
          keysList = ["invoiceNo", "customerName", "dateStr", "paymentStatus", "paymentMethod", "subtotal", "discount", "tax", "total", "grossProfit", "charityAmount", "netProfit"];
          formatMap = { subtotal: "currency", discount: "currency", tax: "currency", total: "currency", grossProfit: "currency", charityAmount: "currency", netProfit: "currency" };
          alignmentMap = { invoiceNo: "center", dateStr: "center", paymentStatus: "center", paymentMethod: "center" };
          break;
        case "profit":
          headersList = ["Invoice No", "Customer", "Date", "Status", "Payment Method", "Total Revenue", "COGS", "Gross Profit", "Charity Allocation (20%)", "Net Profit", "Net Margin %"];
          keysList = ["invoiceNo", "customerName", "dateStr", "paymentStatus", "paymentMethod", "totalRevenue", "cogs", "grossProfit", "charityAmount", "netProfit", "netMargin"];
          formatMap = { totalRevenue: "currency", cogs: "currency", grossProfit: "currency", charityAmount: "currency", netProfit: "currency", netMargin: "decimal" };
          alignmentMap = { invoiceNo: "center", dateStr: "center", paymentStatus: "center", paymentMethod: "center" };
          break;
        case "charity":
          headersList = ["Invoice No", "Customer", "Date", "Status", "Invoice Total", "Gross Profit Base", "Charity Rate %", "Charity Amount"];
          keysList = ["invoiceNo", "customerName", "dateStr", "paymentStatus", "total", "grossProfit", "charityPercentage", "charityAmount"];
          formatMap = { total: "currency", grossProfit: "currency", charityPercentage: "decimal", charityAmount: "currency" };
          alignmentMap = { invoiceNo: "center", dateStr: "center", paymentStatus: "center" };
          break;
        case "product-cost":
          headersList = ["Stock No / Code", "Product Name", "Category", "Material Cost", "Labor Cost", "Other Cost", "Total Cost Price", "Retail Price", "Est. Profit", "Margin %"];
          keysList = ["productCode", "name", "category", "materialCost", "manufacturingCost", "otherCosts", "costPrice", "sellingPrice", "grossProfit", "margin"];
          formatMap = { materialCost: "currency", manufacturingCost: "currency", otherCosts: "currency", costPrice: "currency", sellingPrice: "currency", grossProfit: "currency", margin: "decimal" };
          alignmentMap = { productCode: "center", category: "center" };
          break;
        case "purchases":
          headersList = ["Supplier Name", "Contact Person", "Purchases Count", "Total Carats", "Total Spent"];
          keysList = ["supplierName", "contact", "purchasesCount", "totalCarats", "totalSpent"];
          formatMap = { purchasesCount: "number", totalCarats: "decimal", totalSpent: "currency" };
          alignmentMap = { purchasesCount: "right", totalCarats: "right", totalSpent: "right" };
          break;
        case "inventory-valuation":
          headersList = ["Asset Type", "Valuation"];
          keysList = ["category", "value"];
          formatMap = { value: "currency" };
          alignmentMap = { value: "right" };
          break;
        case "gemstone-stock":
          headersList = ["Stone ID", "Gemstone", "Variety", "Supplier", "Shape", "Weight (Cts)", "Pieces", "Status", "Purchase Cost"];
          keysList = ["stoneId", "gemstone", "variety", "supplierName", "shape", "carat", "pieces", "status", "purchasePrice"];
          formatMap = { carat: "decimal", pieces: "number", purchasePrice: "currency" };
          alignmentMap = { stoneId: "center", carat: "right", pieces: "right", status: "center", purchasePrice: "right" };
          break;
        case "jewellery-stock":
          headersList = ["Stock No / Code", "Product Name", "Category", "Status", "Cost Price", "Retail Price", "Potential Margin"];
          keysList = ["productCode", "name", "category", "status", "costPrice", "sellingPrice", "margin"];
          formatMap = { costPrice: "currency", sellingPrice: "currency", margin: "currency" };
          alignmentMap = { productCode: "center", status: "center", costPrice: "right", sellingPrice: "right", margin: "right" };
          break;
        case "memo":
          headersList = ["Memo No", "Client", "Issue Date", "Expected Return", "Total Items", "Total Value", "Status"];
          keysList = ["memoNo", "customerName", "issueDateStr", "expectedReturnStr", "itemCount", "totalValue", "status"];
          formatMap = { itemCount: "number", totalValue: "currency" };
          alignmentMap = { memoNo: "center", issueDateStr: "center", expectedReturnStr: "center", itemCount: "right", totalValue: "right", status: "center" };
          break;
        case "income":
          headersList = ["Date", "Category", "Description", "Payment Method", "Reference", "Status", "Amount"];
          keysList = ["dateStr", "category", "description", "paymentMethod", "reference", "status", "amount"];
          formatMap = { amount: "currency" };
          alignmentMap = { dateStr: "center", status: "center", amount: "right" };
          break;
        case "expenses":
          headersList = ["Date", "Category", "Description", "Vendor", "Payment Method", "Reference", "Status", "Amount"];
          keysList = ["dateStr", "category", "description", "vendor", "paymentMethod", "reference", "status", "amount"];
          formatMap = { amount: "currency" };
          alignmentMap = { dateStr: "center", status: "center", amount: "right" };
          break;
        case "stock-movement":
          headersList = ["Log Timestamp", "Type", "Item Code", "Quantity", "Action Log", "User / Artisan"];
          keysList = ["dateStr", "type", "itemCode", "quantity", "action", "user"];
          formatMap = { quantity: "number" };
          alignmentMap = { dateStr: "center", itemCode: "center", quantity: "right" };
          break;
      }

      const headerRow = worksheet.addRow(headersList);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { name: fontName, size: 10, bold: true, color: { argb: "FFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "94A3B8" } },
          bottom: { style: "thin", color: { argb: "94A3B8" } },
          left: { style: "thin", color: { argb: "94A3B8" } },
          right: { style: "thin", color: { argb: "94A3B8" } },
        };
      });

      sortedData.forEach((row, rowIdx) => {
        const rowVals = keysList.map((k) => {
          if (k === "margin" && activeTab === "jewellery-stock") {
            return (row.sellingPrice || 0) - (row.costPrice || 0);
          }
          return row[k] ?? "";
        });
        const excelRow = worksheet.addRow(rowVals);
        excelRow.height = 20;

        excelRow.eachCell((cell, colIdx) => {
          const colKey = keysList[colIdx - 1];
          const formatType = formatMap[colKey];
          const align = alignmentMap[colKey];

          cell.font = { name: fontName, size: 10 };

          cell.border = {
            top: { style: "thin", color: { argb: "E2E8F0" } },
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
            left: { style: "thin", color: { argb: "E2E8F0" } },
            right: { style: "thin", color: { argb: "E2E8F0" } },
          };

          if (rowIdx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFC" } };
          }

          if (formatType === "currency") {
            cell.numFormat = "$#,##0.00";
            cell.value = Number(cell.value) || 0;
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else if (formatType === "decimal") {
            cell.numFormat = "#,##0.00";
            cell.value = Number(cell.value) || 0;
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else if (formatType === "number") {
            cell.numFormat = "#,##0";
            cell.value = Number(cell.value) || 0;
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else if (align) {
            cell.alignment = { horizontal: align, vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
        });
      });

      if (activeTab !== "stock-movement") {
        const totalLabelRowVals = Array(headersList.length).fill("");
        totalLabelRowVals[0] = "TOTAL SUMMARY";

        keysList.forEach((k, colIdx) => {
          if (formatMap[k]) {
            const sum = sortedData.reduce((acc, curr) => {
              if (k === "margin" && activeTab === "jewellery-stock") {
                return acc + ((curr.sellingPrice || 0) - (curr.costPrice || 0));
              }
              return acc + (Number(curr[k]) || 0);
            }, 0);
            totalLabelRowVals[colIdx] = sum;
          }
        });

        const totalRow = worksheet.addRow(totalLabelRowVals);
        totalRow.height = 22;
        totalRow.eachCell((cell, colIdx) => {
          const colKey = keysList[colIdx - 1];
          const formatType = formatMap[colKey];

          cell.font = { name: fontName, size: 10, bold: true, color: { argb: "0F172A" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };

          cell.border = {
            top: { style: "thin", color: { argb: "94A3B8" } },
            bottom: { style: "double", color: { argb: "94A3B8" } },
            left: { style: "thin", color: { argb: "94A3B8" } },
            right: { style: "thin", color: { argb: "94A3B8" } },
          };

          if (formatType === "currency") {
            cell.numFormat = "$#,##0.00";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else if (formatType === "decimal") {
            cell.numFormat = "#,##0.00";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else if (formatType === "number") {
            cell.numFormat = "#,##0";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: colIdx === 1 ? "left" : "center", vertical: "middle" };
          }
        });
      }

      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 0;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.max(maxLength + 4, 12);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SR_Takat_${activeTabLabel}_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess("Export Successful", "Report exported to Excel successfully.");
    } catch (err) {
      console.error("[export] Excel generation failed:", err);
      showError("Export Failed", `Excel generation failed: ${err.message}`);
    }
  };


  return (
    <div className="page-container space-y-0">
      {/* Title Header Block */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Report Management System
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Generate and export real-time sales, inventory valuation, purchases, memos, ledgers, and movement logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetFilters} className="text-xs sm:text-sm">
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset Filters
          </Button>
          <Button onClick={handleExportToExcel} className="text-xs sm:text-sm gap-2" disabled={isLoading || isError || sortedData.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Export to Excel
          </Button>
        </div>
      </div>

      {/* Main Categories Tab Row (Styled like Product Catalog) */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${isActive
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Advanced Unified Filters Toolbar Panel with Mobile Accordion */}
      <FilterPanel
        activeFilterCount={
          (filters.dateRange !== "All" ? 1 : 0) +
          (filters.status !== "All" ? 1 : 0) +
          (filters.category !== "All" ? 1 : 0) +
          (filters.customer !== "All" ? 1 : 0) +
          (filters.supplier !== "All" ? 1 : 0) +
          (filters.searchTerm ? 1 : 0)
        }
        onReset={handleResetFilters}
        title="Report Filters"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isFilterVisible("dateRange") && (
            <Select
              label="Date Range"
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              options={[
                { value: "All", label: "All Time" },
                { value: "Today", label: "Today" },
                { value: "ThisWeek", label: "This Week" },
                { value: "ThisMonth", label: "This Month" },
                { value: "ThisYear", label: "This Year" },
                { value: "Custom", label: "Custom Range" },
              ]}
            />
          )}

          {filters.dateRange === "Custom" && isFilterVisible("dateRange") && (
            <>
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </>
          )}

          {isFilterVisible("status") && (
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={getStatusOptions()}
            />
          )}

          {isFilterVisible("category") && (
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={getCategoryOptions()}
            />
          )}

          {isFilterVisible("customer") && (
            <Select
              label="Customer Client"
              value={filters.customerId}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
              options={[
                { value: "All", label: "All Customers" },
                ...customers.map((c) => ({ value: c._id, label: c.fullName })),
              ]}
            />
          )}

          {isFilterVisible("supplier") && (
            <Select
              label="Supplier / Vendor"
              value={filters.supplierId}
              onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
              options={[
                { value: "All", label: "All Suppliers" },
                ...suppliers.map((s) => ({ value: s.companyName, label: s.companyName })),
              ]}
            />
          )}

          {isFilterVisible("paymentMethod") && (
            <Select
              label="Payment Method"
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              options={[
                { value: "All", label: "All Methods" },
                { value: "Cash", label: "Cash" },
                { value: "Bank Transfer", label: "Bank Transfer" },
                { value: "Credit Card", label: "Credit Card" },
                { value: "Cheque", label: "Cheque" },
                { value: "Other", label: "Other" },
              ]}
            />
          )}

          {isFilterVisible("search") && (
            <div className="flex-1">
              <Input
                label="Search Keyword"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search codes, IDs, etc..."
              />
            </div>
          )}
        </div>
      </FilterPanel>

      {/* KPI Cards Ribbon Row (Styled like Dashboard summary cards) */}
      {!isLoading && !isError && Object.keys(metrics).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics).map(([key, val], idx) => {
            const isFeatured = idx === 0;
            const icon = getMetricIcon(key);
            const iconBg = getMetricIconBg(key);
            return (
              <StatCard
                key={key}
                title={key}
                value={val}
                icon={icon}
                iconBg={iconBg}
                featured={isFeatured}
              />
            );
          })}
        </div>
      )}

      {/* Datatable results and subtotals section */}
      <div className="w-full">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white rounded-[20px] border border-gray-150 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
            <div className="h-8 w-8 text-primary animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-sm font-semibold text-gray-500">Retrieving real-time reports data...</p>
          </div>
        ) : isError ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-danger bg-white rounded-[20px] border border-gray-155 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
            <AlertCircle className="h-10 w-10 text-danger animate-pulse" />
            <p className="text-sm font-semibold">Failed to retrieve filtered records. Please review backend connections.</p>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-[20px] border border-gray-150 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
            <p className="text-sm font-semibold">No records match the applied report filters.</p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP & TABLET VIEW (≥ 768px md:block) ────────────────────────── */}
            <div className="hidden md:block w-full overflow-x-auto rounded-[20px] border border-gray-100/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <table className="w-full min-w-0 table-auto border-collapse text-left text-xs sm:text-sm text-gray-900">
                <thead className="border-b border-gray-100 bg-gray-50/60">
                  <tr>
                    {tableHeaders.map((head) => (
                      <th
                        key={head.key}
                        className="px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap min-w-0 select-none cursor-pointer hover:bg-gray-100/80 transition-colors"
                        onClick={() => handleSort(head.key)}
                      >
                        <div className="flex items-center gap-1.5">
                          {head.label}
                          {sortConfig.key === head.key && (
                            <span className="text-primary text-[10px]">
                              {sortConfig.direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((row) => (
                    <tr key={row.indexId} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                      {activeTab === "sales" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.invoiceNo}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.customerName}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-500 font-mono text-xs">{row.dateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.paymentStatus === "Paid" ? "success" : row.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
                              {row.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs font-semibold text-gray-500">{row.paymentMethod}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-medium">{formatCurrency(row.subtotal)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(row.discount)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(row.tax)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold text-gray-950">{formatCurrency(row.total)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-semibold">{formatCurrency(row.grossProfit)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-rose-500">{formatCurrency(row.charityAmount)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-bold">{formatCurrency(row.netProfit)}</td>
                        </>
                      )}
                      {activeTab === "profit" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.invoiceNo}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.customerName}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-500 font-mono text-xs">{row.dateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.paymentStatus === "Paid" ? "success" : row.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
                              {row.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold text-gray-950">{formatCurrency(row.totalRevenue)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(row.cogs)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-semibold">{formatCurrency(row.grossProfit)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-rose-500">{formatCurrency(row.charityAmount)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-bold">{formatCurrency(row.netProfit)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-primary font-semibold">{row.netMargin}%</td>
                        </>
                      )}
                      {activeTab === "charity" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.invoiceNo}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.customerName}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-500 font-mono text-xs">{row.dateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.paymentStatus === "Paid" ? "success" : row.paymentStatus === "Partially Paid" ? "warning" : "danger"}>
                              {row.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-medium">{formatCurrency(row.total)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-semibold">{formatCurrency(row.grossProfit)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-center font-semibold text-primary">{row.charityPercentage || 20}%</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-rose-500 font-bold">{formatCurrency(row.charityAmount)}</td>
                        </>
                      )}
                      {activeTab === "purchases" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900">{row.supplierName}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">{row.contact || "—"}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{row.purchasesCount}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{(row.totalCarats || 0).toFixed(2)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(row.totalSpent)}</td>
                        </>
                      )}
                      {activeTab === "inventory-valuation" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-gray-900">{row.category}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(row.value)}</td>
                        </>
                      )}
                      {activeTab === "gemstone-stock" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.stoneId}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.gemstone}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs text-gray-500">{row.variety}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.supplierName}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.shape}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold">{(row.carat || 0).toFixed(2)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{row.pieces}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.status === "In Stock" ? "success" : "warning"}>{row.status}</Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold">{formatCurrency(row.purchasePrice)}</td>
                        </>
                      )}
                      {activeTab === "jewellery-stock" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.productCode}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.name}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.category}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.status === "In Stock" ? "success" : "warning"}>{row.status}</Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-medium">{formatCurrency(row.costPrice)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(row.sellingPrice)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold text-emerald-600">{formatCurrency((row.sellingPrice || 0) - (row.costPrice || 0))}</td>
                        </>
                      )}
                      {activeTab === "product-cost" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.productCode}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.name}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.category}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-600">{formatCurrency(row.materialCost)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-600">{formatCurrency(row.manufacturingCost)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(row.otherCosts)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold text-gray-900">{formatCurrency(row.costPrice)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold text-gray-950">{formatCurrency(row.sellingPrice)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-emerald-600">{formatCurrency(row.grossProfit)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold text-primary">{row.margin}%</td>
                        </>
                      )}
                      {activeTab === "memo" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-semibold text-gray-900">{row.memoNo}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-medium">{row.customerName}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs">{row.issueDateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs">{row.expectedReturnStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{row.itemCount}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(row.totalValue)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.status === "Returned" ? "success" : row.status === "Overdue" ? "danger" : "warning"}>
                              {row.status}
                            </Badge>
                          </td>
                        </>
                      )}
                      {activeTab === "income" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs text-gray-500">{row.dateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold">{row.category}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.description}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs text-gray-500">{row.paymentMethod}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs text-gray-500">{row.reference || "—"}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.status === "Completed" ? "success" : row.status === "Pending" ? "warning" : "danger"}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-emerald-600">{formatCurrency(row.amount)}</td>
                        </>
                      )}
                      {activeTab === "expenses" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs text-gray-500">{row.dateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold">{row.category}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.description}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.vendor || "—"}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs text-gray-500">{row.paymentMethod}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs text-gray-500">{row.reference || "—"}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6">
                            <Badge variant={row.status === "Completed" ? "success" : row.status === "Pending" ? "warning" : "danger"}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-rose-600">{formatCurrency(row.amount)}</td>
                        </>
                      )}
                      {activeTab === "stock-movement" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-xs text-gray-500">{row.dateStr}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold">{row.type}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono font-medium">{row.itemCode}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{row.quantity}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs">{row.action}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 text-xs font-semibold text-gray-600">{row.user}</td>
                        </>
                      )}
                    </tr>
                  ))}

                  {/* Subtotals Highlighted Row */}
                  {activeTab !== "stock-movement" && (
                    <tr className="bg-slate-50/70 font-bold border-t border-gray-150">
                      <td className="px-3 py-4 sm:px-4 md:px-6 uppercase tracking-wider font-semibold text-gray-900">
                        TOTAL SUMMARY
                      </td>
                      {activeTab === "sales" && (
                        <>
                          <td colSpan={4}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-950">{formatCurrency(sortedData.reduce((s, r) => s + (r.subtotal || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(sortedData.reduce((s, r) => s + (r.discount || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(sortedData.reduce((s, r) => s + (r.tax || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-950">{formatCurrency(sortedData.reduce((s, r) => s + (r.total || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600">{formatCurrency(sortedData.reduce((s, r) => s + (r.grossProfit || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-rose-500">{formatCurrency(sortedData.reduce((s, r) => s + (r.charityAmount || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-bold">{formatCurrency(sortedData.reduce((s, r) => s + (r.netProfit || 0), 0))}</td>
                        </>
                      )}
                      {activeTab === "profit" && (
                        <>
                          <td colSpan={3}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-950">{formatCurrency(sortedData.reduce((s, r) => s + (r.totalRevenue || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-gray-500">{formatCurrency(sortedData.reduce((s, r) => s + (r.cogs || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600">{formatCurrency(sortedData.reduce((s, r) => s + (r.grossProfit || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-rose-500">{formatCurrency(sortedData.reduce((s, r) => s + (r.charityAmount || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600 font-bold">{formatCurrency(sortedData.reduce((s, r) => s + (r.netProfit || 0), 0))}</td>
                          <td></td>
                        </>
                      )}
                      {activeTab === "charity" && (
                        <>
                          <td colSpan={3}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-medium">{formatCurrency(sortedData.reduce((s, r) => s + (r.total || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-emerald-600">{formatCurrency(sortedData.reduce((s, r) => s + (r.grossProfit || 0), 0))}</td>
                          <td></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right text-rose-500 font-bold">{formatCurrency(sortedData.reduce((s, r) => s + (r.charityAmount || 0), 0))}</td>
                        </>
                      )}
                      {activeTab === "purchases" && (
                        <>
                          <td></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{sortedData.reduce((s, r) => s + (r.purchasesCount || 0), 0)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{sortedData.reduce((s, r) => s + (r.totalCarats || 0), 0).toFixed(2)}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(sortedData.reduce((s, r) => s + (r.totalSpent || 0), 0))}</td>
                        </>
                      )}
                      {activeTab === "inventory-valuation" && (
                        <>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(sortedData.reduce((s, r) => s + (r.value || 0), 0))}</td>
                        </>
                      )}
                      {activeTab === "gemstone-stock" && (
                        <>
                          <td colSpan={4}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">
                            {sortedData.reduce((s, r) => s + (r.carat || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">
                            {sortedData.reduce((s, r) => s + (r.pieces || 0), 0)}
                          </td>
                          <td></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold">
                            {formatCurrency(sortedData.reduce((s, r) => s + (r.purchasePrice || 0), 0))}
                          </td>
                        </>
                      )}
                      {activeTab === "jewellery-stock" && (
                        <>
                          <td colSpan={3}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-medium">
                            {formatCurrency(sortedData.reduce((s, r) => s + (r.costPrice || 0), 0))}
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">
                            {formatCurrency(sortedData.reduce((s, r) => s + (r.sellingPrice || 0), 0))}
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-emerald-600">
                            {formatCurrency(sortedData.reduce((s, r) => s + ((r.sellingPrice || 0) - (r.costPrice || 0)), 0))}
                          </td>
                        </>
                      )}
                      {activeTab === "product-cost" && (
                        <>
                          <td colSpan={2}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{formatCurrency(sortedData.reduce((s, r) => s + (r.materialCost || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{formatCurrency(sortedData.reduce((s, r) => s + (r.manufacturingCost || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">{formatCurrency(sortedData.reduce((s, r) => s + (r.otherCosts || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-semibold">{formatCurrency(sortedData.reduce((s, r) => s + (r.costPrice || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">{formatCurrency(sortedData.reduce((s, r) => s + (r.sellingPrice || 0), 0))}</td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-emerald-600">{formatCurrency(sortedData.reduce((s, r) => s + (r.grossProfit || 0), 0))}</td>
                          <td></td>
                        </>
                      )}

                      {activeTab === "memo" && (
                        <>
                          <td colSpan={3}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right">
                            {sortedData.reduce((s, r) => s + (r.itemCount || 0), 0)}
                          </td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-gray-950">
                            {formatCurrency(sortedData.reduce((s, r) => s + (r.totalValue || 0), 0))}
                          </td>
                          <td></td>
                        </>
                      )}
                      {activeTab === "income" && (
                        <>
                          <td colSpan={5}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-emerald-600">
                            {formatCurrency(sortedData.reduce((s, r) => s + (r.amount || 0), 0))}
                          </td>
                        </>
                      )}
                      {activeTab === "expenses" && (
                        <>
                          <td colSpan={6}></td>
                          <td className="px-3 py-4 sm:px-4 md:px-6 font-mono text-right font-bold text-rose-600">
                            {formatCurrency(sortedData.reduce((s, r) => s + (r.amount || 0), 0))}
                          </td>
                        </>
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE ACCORDION CARD VIEW (< 768px md:hidden) ───────────────────── */}
            <div className="md:hidden flex flex-col gap-3 w-full">
              {paginatedData.map((row) => {
                const itemId = row.indexId;
                const isExpanded = Boolean(expandedRows[itemId]);
                return (
                  <div
                    key={itemId}
                    className="rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden transition-all duration-200"
                  >
                    {/* Header Row (Tap to expand/collapse) */}
                    <button
                      type="button"
                      onClick={() => toggleRow(itemId)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left bg-white hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {getMobileTitle(row)}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {getMobileSubtitle(row)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getMobileBadge(row)}
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-gray-50/20 text-xs sm:text-sm flex flex-col gap-2">
                        {getMobileExpandedDetails(row)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Dynamic Pagination Controls Footer */}
        {activeTab !== "inventory-valuation" && !isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white mt-4 rounded-b-[20px]">
            <span className="text-xs text-gray-400 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
