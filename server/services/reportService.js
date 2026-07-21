import Gemstone from "../models/Gemstone.js";
import Material from "../models/Material.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import Memo from "../models/Memo.js";
import JobCard from "../models/JobCard.js";
import InventoryMovement from "../models/InventoryMovement.js";
import Supplier from "../models/Supplier.js";
import Settings from "../models/Settings.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";

// Helper to build MongoDB query filters from parameters
function buildQueryFilter(queryParams = {}, dateField = "createdAt") {
  const filter = { isDeleted: { $ne: true } };

  const {
    dateRange,
    startDate,
    endDate,
    status,
    category,
    customerId,
    supplierId,
    workerId,
    paymentMethod,
  } = queryParams;

  // Date Range Filtering
  if (dateRange && dateRange !== "All" && dateRange !== "Custom") {
    const now = new Date();
    let start = new Date();
    if (dateRange === "Today") {
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === "ThisWeek") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === "ThisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === "ThisYear") {
      start = new Date(now.getFullYear(), 0, 1);
    }
    filter[dateField] = { $gte: start };
  } else if (startDate || endDate) {
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    filter[dateField] = dateQuery;
  }

  // Status Filter
  if (status && status !== "All") {
    filter.status = status;
  }

  // Category Filter
  if (category && category !== "All") {
    filter.category = category;
  }

  // Customer Filter
  if (customerId && customerId !== "All") {
    filter.customerId = customerId;
  }

  // Supplier Filter
  if (supplierId && supplierId !== "All") {
    filter.supplierId = supplierId;
  }

  // Worker / Artisan Filter
  if (workerId && workerId !== "All") {
    filter.assignedTo = workerId;
  }

  // Payment Method Filter
  if (paymentMethod && paymentMethod !== "All") {
    filter.paymentMethod = paymentMethod;
  }

  return filter;
}

async function getStockValuation(queryParams = {}) {
  const stoneFilter = buildQueryFilter(queryParams, "createdAt");
  const productFilter = buildQueryFilter(queryParams, "createdAt");
  const materialFilter = { status: "active" };

  stoneFilter.status = { $in: ["In Stock", "Reserved", "In Production", "On Memo"] };
  productFilter.status = { $in: ["In Stock", "Reserved", "On Memo"] };

  if (queryParams.category && queryParams.category !== "All") {
    if (queryParams.category === "Gemstone") {
      productFilter._id = null;
      materialFilter._id = null;
    } else {
      stoneFilter._id = null;
      productFilter.category = queryParams.category;
      materialFilter._id = null;
    }
  }

  const stones = await Gemstone.find(stoneFilter);
  const products = await Product.find(productFilter);
  const materials = await Material.find(materialFilter);

  const gemstoneValue = stones.reduce((acc, curr) => acc + (curr.purchasePrice || 0), 0);
  const productValue = products.reduce((acc, curr) => acc + (curr.costPrice || 0), 0);
  const materialValue = materials.reduce(
    (acc, curr) => acc + (curr.cost || 0) * (curr.quantity || 0),
    0
  );

  return {
    gemstoneValue,
    productValue,
    materialValue,
    totalValue: gemstoneValue + productValue + materialValue,
  };
}

async function getRevenuesSummary(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.status && queryParams.status !== "All") {
    filter.paymentStatus = queryParams.status;
    delete filter.status;
  }
  if (queryParams.paymentMethod && queryParams.paymentMethod !== "All") {
    filter.paymentMethod = queryParams.paymentMethod;
  }
  if (queryParams.search) {
    filter.invoiceNo = { $regex: queryParams.search, $options: "i" };
  }

  const sales = await Sale.find(filter);
  const settings = await Settings.getSettings();
  const charityPercentage = Number(settings?.charityPercentage ?? 20);

  const totalRevenue = sales.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalGrossProfit = sales.reduce((acc, curr) => acc + (curr.grossProfit || 0), 0);
  const totalCharity = totalGrossProfit * (charityPercentage / 100);
  const totalNetProfit = totalGrossProfit - totalCharity;

  return {
    totalRevenue,
    totalCharity,
    totalGrossProfit,
    totalNetProfit,
    invoiceCount: sales.length,
  };
}

async function getDashboardSummary(queryParams = {}) {
  const valuation = await getStockValuation(queryParams);
  const revenues = await getRevenuesSummary(queryParams);

  const activeStones = await Gemstone.find({
    status: { $in: ["In Stock", "Reserved", "In Production", "On Memo"] },
    isDeleted: { $ne: true },
  });
  const activeProducts = await Product.find({
    status: { $in: ["In Stock", "Reserved", "On Memo"] },
    isDeleted: { $ne: true },
  });

  const totalGemstonesCount = activeStones.reduce((acc, curr) => acc + (curr.pieces || 1), 0);
  const jewelleryStockCount = activeProducts.filter((p) => p.category !== "Watch").length;
  const watchStockCount = activeProducts.filter((p) => p.category === "Watch").length;

  const gemstonesSelling = activeStones.reduce((acc, curr) => acc + (curr.purchasePrice || 0) * 1.25, 0);
  const productsSelling = activeProducts.reduce((acc, curr) => acc + (curr.sellingPrice || 0), 0);
  const sellingValue = gemstonesSelling + productsSelling;

  const activeMemos = await Memo.find({
    status: { $in: ["With Client", "Partially Returned", "Overdue"] },
  })
    .populate("customerId")
    .populate("items.inventoryId");

  let memoOnTimeCount = 0;
  let memoOverdueCount = 0;
  const now = new Date();
  const overdueMemosList = [];

  for (const memo of activeMemos) {
    const isOverdue = now > new Date(memo.expectedReturn);
    let memoItemCount = 0;
    for (const item of memo.items || []) {
      if (item.status === "On Memo" && item.inventoryId) {
        memoItemCount += Number(item.quantity || 1);
      }
    }

    if (isOverdue) {
      memoOverdueCount += memoItemCount;
      overdueMemosList.push({
        _id: memo._id,
        memoNo: memo.memoNo,
        customerName: memo.customerId?.fullName || "Unknown",
        expectedReturn: memo.expectedReturn,
        value: memoItemCount,
      });
    } else {
      memoOnTimeCount += memoItemCount;
    }
  }

  const recentStones = await Gemstone.find({ status: "In Stock" }).sort({ createdAt: -1 }).limit(5);
  const recentProducts = await Product.find({ status: "In Stock" }).sort({ createdAt: -1 }).limit(5);

  const lowStockOrMissingCert = await Gemstone.find({
    status: "In Stock",
    $or: [{ certificateId: null }, { pieces: { $lte: 1 } }],
  }).limit(5);

  const recentSales = await Sale.find({ paymentStatus: "Paid" })
    .populate("customerId")
    .sort({ createdAt: -1 })
    .limit(5);

  const pendingProduction = await JobCard.find({
    status: { $in: ["Assigned", "In Progress", "On Hold"] },
  })
    .populate("productId")
    .sort({ expectedDate: 1 })
    .limit(5);

  return {
    kpis: {
      totalGemstones: totalGemstonesCount,
      jewelleryStock: jewelleryStockCount,
      watchStock: watchStockCount,
      inventoryCost: valuation.totalValue,
      sellingValue,
      memoOnTime: memoOnTimeCount,
      memoOverdue: memoOverdueCount,
      grossProfit: revenues.totalGrossProfit,
      charityAllocation: revenues.totalCharity,
      netProfit: revenues.totalNetProfit,
      totalRevenue: revenues.totalRevenue,
      invoiceCount: revenues.invoiceCount,
    },
    widgets: {
      recentStock: [
        ...recentStones.map((s) => ({
          _id: s._id,
          type: "Gemstone",
          code: s.stoneId,
          name: s.gemstone,
          cost: s.purchasePrice,
          createdAt: s.createdAt,
        })),
        ...recentProducts.map((p) => ({
          _id: p._id,
          type: "Product",
          code: p.productCode,
          name: p.name,
          cost: p.costPrice,
          createdAt: p.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
      lowStockOrMissingCert: lowStockOrMissingCert.map((stone) => ({
        ...stone.toObject ? stone.toObject() : stone,
        reason: stone.certificateId ? "Low stock" : "Missing certificate",
      })),
      overdueMemos: overdueMemosList,
      recentSales,
      pendingProduction,
    },
  };
}

async function getGemstoneStockReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (!filter.status) {
    filter.status = { $ne: "Sold" };
  }
  if (queryParams.search) {
    filter.$or = [
      { stoneId: { $regex: queryParams.search, $options: "i" } },
      { gemstone: { $regex: queryParams.search, $options: "i" } },
      { variety: { $regex: queryParams.search, $options: "i" } },
      { shape: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Gemstone.find(filter).populate("supplierId");
}

async function getJewelleryStockReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (!filter.status) {
    filter.status = { $ne: "Sold" };
  }
  if (queryParams.search) {
    filter.$or = [
      { productCode: { $regex: queryParams.search, $options: "i" } },
      { name: { $regex: queryParams.search, $options: "i" } },
      { stockNo: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Product.find(filter);
}

async function getMemoReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.search) {
    filter.$or = [{ memoNo: { $regex: queryParams.search, $options: "i" } }];
  }
  return Memo.find(filter).populate("customerId").populate("items.inventoryId");
}

async function getSalesReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.status && queryParams.status !== "All") {
    filter.paymentStatus = queryParams.status;
    delete filter.status;
  }
  if (queryParams.paymentMethod && queryParams.paymentMethod !== "All") {
    filter.paymentMethod = queryParams.paymentMethod;
  }
  if (queryParams.search) {
    filter.$or = [
      { invoiceNo: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Sale.find(filter).populate("customerId");
}

async function getProductCostReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.search) {
    filter.$or = [
      { productCode: { $regex: queryParams.search, $options: "i" } },
      { name: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Product.find(filter, "productCode name category costPrice sellingPrice grossProfit margin totalCost");
}

async function getStockMovementReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "movementDate");
  if (queryParams.search) {
    filter.$or = [
      { stoneId: { $regex: queryParams.search, $options: "i" } },
      { productCode: { $regex: queryParams.search, $options: "i" } },
      { action: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return InventoryMovement.find(filter).sort({ movementDate: -1 });
}

async function getSupplierPurchaseReport(queryParams = {}) {
  const stoneFilter = buildQueryFilter(queryParams, "createdAt");
  const stones = await Gemstone.find(stoneFilter).populate("supplierId");
  const suppliers = await Supplier.find({});

  const summary = suppliers.map((sup) => {
    const purchases = stones.filter((s) => s.supplierId?._id?.toString() === sup._id.toString());
    const totalSpent = purchases.reduce((sum, curr) => sum + (curr.purchasePrice || 0), 0);
    const totalCarats = purchases.reduce((sum, curr) => sum + (curr.carat || 0), 0);
    return {
      supplierName: sup.companyName,
      contact: sup.contactName,
      purchasesCount: purchases.length,
      totalCarats,
      totalSpent,
    };
  });

  let result = summary;
  if (queryParams.supplierId && queryParams.supplierId !== "All") {
    result = result.filter((r) => r.supplierName === queryParams.supplierId);
  }
  if (queryParams.search) {
    result = result.filter((r) =>
      r.supplierName.toLowerCase().includes(queryParams.search.toLowerCase())
    );
  }
  return result;
}

async function getIncomeReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "date");
  if (queryParams.status && queryParams.status !== "All") {
    filter.status = queryParams.status;
  }
  if (queryParams.search) {
    filter.$or = [
      { description: { $regex: queryParams.search, $options: "i" } },
      { reference: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Income.find(filter).populate("createdBy", "fullName");
}

async function getExpenseReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "date");
  if (queryParams.status && queryParams.status !== "All") {
    filter.status = queryParams.status;
  }
  if (queryParams.search) {
    filter.$or = [
      { description: { $regex: queryParams.search, $options: "i" } },
      { reference: { $regex: queryParams.search, $options: "i" } },
      { vendor: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Expense.find(filter).populate("createdBy", "fullName");
}

export default {
  getStockValuation,
  getRevenuesSummary,
  getDashboardSummary,
  getGemstoneStockReport,
  getJewelleryStockReport,
  getMemoReport,
  getSalesReport,
  getProductCostReport,
  getStockMovementReport,
  getSupplierPurchaseReport,
  getIncomeReport,
  getExpenseReport,
};
