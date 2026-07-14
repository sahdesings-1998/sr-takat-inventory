import Gemstone from "../models/Gemstone.js";
import Material from "../models/Material.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import Memo from "../models/Memo.js";
import JobCard from "../models/JobCard.js";
import InventoryMovement from "../models/InventoryMovement.js";
import Supplier from "../models/Supplier.js";

async function getStockValuation() {
  const stones = await Gemstone.find({
    status: { $in: ["In Stock", "Reserved", "In Production", "On Memo"] },
  });
  const products = await Product.find({ status: { $in: ["In Stock", "Reserved", "On Memo"] } });
  const materials = await Material.find({ status: "active" });

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

async function getRevenuesSummary() {
  const sales = await Sale.find({});

  const totalRevenue = sales.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalCharity = sales.reduce((acc, curr) => acc + (curr.charityAmount || 0), 0);
  const totalGrossProfit = sales.reduce((acc, curr) => acc + (curr.grossProfit || 0), 0);
  const totalNetProfit = sales.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);

  return {
    totalRevenue,
    totalCharity,
    totalGrossProfit,
    totalNetProfit,
    invoiceCount: sales.length,
  };
}

async function getDashboardSummary() {
  const valuation = await getStockValuation();
  const revenues = await getRevenuesSummary();

  const activeStones = await Gemstone.find({
    status: { $in: ["In Stock", "Reserved", "In Production", "On Memo"] },
  });
  const activeProducts = await Product.find({
    status: { $in: ["In Stock", "Reserved", "On Memo"] },
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

  let onTimeValue = 0;
  let overdueValue = 0;
  const now = new Date();
  const overdueMemosList = [];

  for (const memo of activeMemos) {
    const isOverdue = now > new Date(memo.expectedReturn);
    let memoValue = 0;
    for (const item of memo.items) {
      if (item.status === "On Memo" && item.inventoryId) {
        if (item.inventoryType === "Gemstone") {
          memoValue += (item.inventoryId.purchasePrice || 0) * 1.25 * item.quantity;
        } else if (item.inventoryType === "Product") {
          memoValue += (item.inventoryId.sellingPrice || 0) * item.quantity;
        }
      }
    }

    if (isOverdue) {
      overdueValue += memoValue;
      overdueMemosList.push({
        _id: memo._id,
        memoNo: memo.memoNo,
        customerName: memo.customerId?.fullName || "Unknown",
        expectedReturn: memo.expectedReturn,
        value: memoValue,
      });
    } else {
      onTimeValue += memoValue;
    }
  }

  // Widget feeds
  const recentStones = await Gemstone.find({ status: "In Stock" }).sort({ createdAt: -1 }).limit(5);
  const recentProducts = await Product.find({ status: "In Stock" }).sort({ createdAt: -1 }).limit(5);
  
  const missingCertificateStones = await Gemstone.find({
    status: "In Stock",
    certificateId: null,
  }).limit(5);

  const recentSales = await Sale.find({}).populate("customerId").sort({ createdAt: -1 }).limit(5);
  
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
      memoOnTime: onTimeValue,
      memoOverdue: overdueValue,
      grossProfit: revenues.totalGrossProfit,
      charityAllocation: revenues.totalCharity,
      netProfit: revenues.totalNetProfit,
      totalRevenue: revenues.totalRevenue,
      invoiceCount: revenues.invoiceCount,
    },
    widgets: {
      recentStock: [
        ...recentStones.map((s) => ({ type: "Gemstone", code: s.stoneId, name: s.gemstone, cost: s.purchasePrice })),
        ...recentProducts.map((p) => ({ type: "Product", code: p.productCode, name: p.name, cost: p.costPrice })),
      ].slice(0, 5),
      lowStockOrMissingCert: missingCertificateStones,
      overdueMemos: overdueMemosList,
      recentSales,
      pendingProduction,
    },
  };
}

async function getGemstoneStockReport() {
  return Gemstone.find({ status: { $ne: "Sold" } }).populate("supplierId");
}

async function getJewelleryStockReport() {
  return Product.find({ status: { $ne: "Sold" } });
}

async function getMemoReport() {
  return Memo.find({}).populate("customerId").populate("items.inventoryId");
}

async function getSalesReport() {
  return Sale.find({}).populate("customerId");
}

async function getProductCostReport() {
  return Product.find({}, "productCode name category costPrice sellingPrice grossProfit");
}

async function getStockMovementReport() {
  return InventoryMovement.find({}).sort({ movementDate: -1 });
}

async function getSupplierPurchaseReport() {
  const stones = await Gemstone.find({}).populate("supplierId");
  const suppliers = await Supplier.find({});
  
  const summary = suppliers.map((sup) => {
    const purchases = stones.filter((s) => s.supplierId?._id?.toString() === sup._id.toString());
    const totalSpent = purchases.reduce((sum, curr) => sum + (curr.purchasePrice || 0), 0);
    return {
      supplierName: sup.companyName,
      contact: sup.contactName,
      purchasesCount: purchases.length,
      totalSpent,
    };
  });

  return summary;
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
};
