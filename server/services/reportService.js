import Material from "../models/Material.js";
import Product from "../models/Product.js";
import Gemstone from "../models/Gemstone.js";
import Sale from "../models/Sale.js";
import Memo from "../models/Memo.js";
import JobCard from "../models/JobCard.js";
import InventoryMovement from "../models/InventoryMovement.js";
import Supplier from "../models/Supplier.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import Certificate from "../models/Certificate.js";
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
  const filter = buildQueryFilter(queryParams, "createdAt");
  const materialFilter = { status: "active" };

  filter.status = { $in: ["In Stock", "Available", "Reserved", "In Production", "On Memo"] };

  const gemFilter = { ...filter, category: { $in: ["Gemstone", "Gemstones"] } };
  const prodFilter = { ...filter, category: { $nin: ["Gemstone", "Gemstones"] } };

  if (queryParams.category && queryParams.category !== "All") {
    if (queryParams.category === "Gemstone" || queryParams.category === "Gemstones") {
      prodFilter._id = null;
      materialFilter._id = null;
    } else {
      gemFilter._id = null;
      prodFilter.category = queryParams.category;
      materialFilter._id = null;
    }
  }

  const stones = gemFilter._id === null ? [] : await Product.find(gemFilter);
  const products = prodFilter._id === null ? [] : await Product.find(prodFilter);
  const materials = materialFilter._id === null ? [] : await Material.find(materialFilter);

  const gemstoneValue = stones.reduce((acc, curr) => {
    const costPerCarat = curr.costPerCarat || ((curr.originalCarat || curr.carat || curr.totalCarat) > 0 ? (curr.purchasePrice || curr.costPrice) / (curr.originalCarat || curr.carat || curr.totalCarat) : 0);
    const weight = curr.carat || curr.totalCarat || 0;
    return acc + (weight > 0 ? weight * costPerCarat : (curr.costPrice || curr.purchasePrice || 0));
  }, 0);

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

  const activeStones = await Product.find({
    category: { $in: ["Gemstone", "Gemstones"] },
    status: { $in: ["In Stock", "Available", "Reserved", "In Production", "On Memo"] },
    isDeleted: { $ne: true },
  });
  const activeProducts = await Product.find({
    category: { $nin: ["Gemstone", "Gemstones"] },
    status: { $in: ["In Stock", "Available", "Reserved", "On Memo"] },
    isDeleted: { $ne: true },
  });

  const totalGemstonesCount = activeStones.reduce((acc, curr) => acc + (curr.quantity || curr.pieces || 1), 0);
  const jewelleryStockCount = activeProducts.filter((p) => p.category !== "Watch").length;
  const watchStockCount = activeProducts.filter((p) => p.category === "Watch").length;

  const gemstonesSelling = activeStones.reduce((acc, curr) => acc + (curr.sellingPrice || (curr.purchasePrice || curr.costPrice || 0) * 1.25), 0);
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

  const recentStones = await Product.find({ category: { $in: ["Gemstone", "Gemstones"] }, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5);
  const recentProducts = await Product.find({ category: { $nin: ["Gemstone", "Gemstones"] }, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5);

  const lowStockOrMissingCert = await Product.find({
    category: { $in: ["Gemstone", "Gemstones"] },
    isDeleted: { $ne: true },
    $or: [{ certificateId: null }, { certificateNumber: "" }, { quantity: { $lte: 1 } }, { carat: { $lte: 1 } }],
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
      gemstoneValue: valuation.gemstoneValue,
      productValue: valuation.productValue,
      materialValue: valuation.materialValue,
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
          code: s.stoneId || s.productCode,
          name: s.gemstone || s.name,
          cost: s.costPrice || s.purchasePrice,
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
        gemstone: stone.gemstone || stone.name,
        stoneId: stone.stoneId || stone.productCode,
        reason: (stone.certificateId || stone.certificateNumber) ? "Low stock" : "Missing certificate",
      })),
      overdueMemos: overdueMemosList,
      recentSales,
      pendingProduction,
    },
  };
}

async function getGemstoneStockReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  filter.category = "Gemstone";
  if (!filter.status) {
    filter.status = { $nin: ["Sold", "Sold Out"] };
  }
  if (queryParams.search) {
    filter.$or = [
      { stoneId: { $regex: queryParams.search, $options: "i" } },
      { productCode: { $regex: queryParams.search, $options: "i" } },
      { name: { $regex: queryParams.search, $options: "i" } },
      { gemstone: { $regex: queryParams.search, $options: "i" } },
      { gemstoneType: { $regex: queryParams.search, $options: "i" } },
      { variety: { $regex: queryParams.search, $options: "i" } },
      { shape: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Product.find(filter).populate("supplierId").populate("certificateId");
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

async function getProfitReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.status && queryParams.status !== "All") {
    filter.paymentStatus = queryParams.status;
    delete filter.status;
  }
  if (queryParams.paymentMethod && queryParams.paymentMethod !== "All") {
    filter.paymentMethod = queryParams.paymentMethod;
  }
  if (queryParams.search) {
    filter.$or = [{ invoiceNo: { $regex: queryParams.search, $options: "i" } }];
  }

  const sales = await Sale.find(filter).populate("customerId");
  const settings = await Settings.getSettings();
  const charityPercentage = Number(settings?.charityPercentage ?? 20);

  return sales.map((sale) => {
    const totalRevenue = sale.total || 0;
    const grossProfit = sale.grossProfit || 0;
    const cogs = Math.max(0, totalRevenue - grossProfit);
    const charityAmount = sale.charityAmount || grossProfit * (charityPercentage / 100);
    const netProfit = sale.netProfit || grossProfit - charityAmount;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      _id: sale._id,
      invoiceNo: sale.invoiceNo,
      customerId: sale.customerId,
      customerName: sale.customerId?.fullName || "—",
      createdAt: sale.createdAt,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
      totalRevenue,
      cogs,
      grossProfit,
      charityAmount,
      netProfit,
      grossMargin: Number(grossMargin.toFixed(2)),
      netMargin: Number(netMargin.toFixed(2)),
    };
  });
}

async function getCharityReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.status && queryParams.status !== "All") {
    filter.paymentStatus = queryParams.status;
    delete filter.status;
  }
  if (queryParams.search) {
    filter.$or = [{ invoiceNo: { $regex: queryParams.search, $options: "i" } }];
  }

  const sales = await Sale.find(filter).populate("customerId");
  const settings = await Settings.getSettings();
  const charityPercentage = Number(settings?.charityPercentage ?? 20);

  return sales.map((sale) => {
    const grossProfit = sale.grossProfit || 0;
    const charityAmount = sale.charityAmount || grossProfit * (charityPercentage / 100);

    return {
      _id: sale._id,
      invoiceNo: sale.invoiceNo,
      customerId: sale.customerId,
      customerName: sale.customerId?.fullName || "—",
      createdAt: sale.createdAt,
      paymentStatus: sale.paymentStatus,
      grossProfit,
      charityPercentage,
      charityAmount,
      total: sale.total || 0,
    };
  });
}

async function getProductCostReport(queryParams = {}) {
  const filter = buildQueryFilter(queryParams, "createdAt");
  if (queryParams.search) {
    filter.$or = [
      { productCode: { $regex: queryParams.search, $options: "i" } },
      { name: { $regex: queryParams.search, $options: "i" } },
    ];
  }
  return Product.find(
    filter,
    "productCode name category costPrice sellingPrice grossProfit margin totalCost materialCost manufacturingCost packagingCost shippingCost otherCosts costBreakdown components"
  );
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

  const movements = await InventoryMovement.find(filter)
    .populate("userId", "fullName username")
    .populate("inventoryId")
    .sort({ movementDate: -1 });

  return movements.map((mov) => {
    const obj = mov.toObject ? mov.toObject() : mov;
    const inv = obj.inventoryId || {};
    const itemCode =
      obj.itemCode ||
      inv.stoneId ||
      inv.productCode ||
      inv.materialCode ||
      inv.materialName ||
      "N/A";
    const user = obj.userId?.fullName || obj.userId?.username || "System";

    return {
      ...obj,
      itemCode,
      user,
      type: obj.inventoryType || "Item",
    };
  });
}

async function getSupplierPurchaseReport(queryParams = {}) {
  const stoneFilter = buildQueryFilter(queryParams, "createdAt");
  stoneFilter.category = "Gemstone";
  const stones = await Product.find(stoneFilter).populate("supplierId");
  const materials = await Material.find({ status: "active" }).populate("supplierId");
  const suppliers = await Supplier.find({});

  const summary = suppliers.map((sup) => {
    const gemPurchases = stones.filter((s) => s.supplierId?._id?.toString() === sup._id.toString());
    const matPurchases = materials.filter((m) => m.supplierId?._id?.toString() === sup._id.toString());

    const gemSpent = gemPurchases.reduce((sum, curr) => sum + (curr.purchasePrice || 0), 0);
    const matSpent = matPurchases.reduce((sum, curr) => sum + (curr.cost || 0) * (curr.quantity || 1), 0);
    const totalSpent = gemSpent + matSpent;

    const totalCarats = gemPurchases.reduce((sum, curr) => sum + (curr.carat || 0), 0);
    const purchasesCount = gemPurchases.length + matPurchases.length;

    return {
      supplierName: sup.companyName,
      contact: sup.contactName,
      purchasesCount,
      totalCarats,
      totalSpent,
      gemstonePurchasesCount: gemPurchases.length,
      materialPurchasesCount: matPurchases.length,
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
  getProfitReport,
  getCharityReport,
  getProductCostReport,
  getStockMovementReport,
  getSupplierPurchaseReport,
  getIncomeReport,
  getExpenseReport,
};

