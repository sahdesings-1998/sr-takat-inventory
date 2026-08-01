import Memo from "../models/Memo.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Settings from "../models/Settings.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function updateOverdueMemos() {
  const now = new Date();
  await Memo.updateMany(
    {
      status: { $in: ["With Client", "Extended", "Partially Returned"] },
      expectedReturn: { $lt: now },
    },
    { $set: { status: "Overdue" } }
  );
}

async function getMemoMetrics() {
  const allMemos = await Memo.find({});
  let totalStockOutsideCompany = 0;
  let activeMemosCount = 0;
  let overdueMemosCount = 0;
  let extendedMemosCount = 0;
  let itemsSoldFromMemoCount = 0;
  let itemsReturnedCount = 0;

  const now = new Date();

  allMemos.forEach((memo) => {
    const isOverdue = memo.expectedReturn && new Date(memo.expectedReturn) < now && (memo.status === "With Client" || memo.status === "Extended");

    if (memo.status === "With Client" || memo.status === "Extended" || memo.status === "Partially Returned" || memo.status === "Overdue") {
      activeMemosCount += 1;
      if (isOverdue || memo.status === "Overdue") {
        overdueMemosCount += 1;
      }
      if (memo.status === "Extended") {
        extendedMemosCount += 1;
      }
    }

    memo.items.forEach((item) => {
      if (item.status === "On Memo") {
        totalStockOutsideCompany += Number(item.totalValue || (item.value * item.quantity) || 0);
      } else if (item.status === "Sold") {
        itemsSoldFromMemoCount += 1;
      } else if (item.status === "Returned") {
        itemsReturnedCount += 1;
      }
    });
  });

  return {
    totalStockOutsideCompany,
    activeMemosCount,
    overdueMemosCount,
    extendedMemosCount,
    itemsSoldFromMemoCount,
    itemsReturnedCount,
    totalMemosCount: allMemos.length,
  };
}

async function getAllMemos({ status, customerId } = {}) {
  await updateOverdueMemos();
  const query = {};
  if (status) {
    if (status === "Active") {
      query.status = { $in: ["With Client", "Extended", "Partially Returned", "Overdue"] };
    } else {
      query.status = status;
    }
  }
  if (customerId) query.customerId = customerId;

  const memos = await Memo.find(query)
    .sort({ createdAt: -1 })
    .populate("customerId")
    .populate("createdBy")
    .populate("items.inventoryId");

  const metrics = await getMemoMetrics();

  return {
    memos,
    metrics,
  };
}

async function getMemoById(id) {
  await updateOverdueMemos();
  const memo = await Memo.findById(id)
    .populate("customerId")
    .populate("createdBy")
    .populate("convertedSaleId")
    .populate("items.inventoryId");
  if (!memo) throw new ApiError(404, "Memo not found");
  return memo;
}

async function createMemo(data, userId, ipAddress = "") {
  const memoNo = await generateId(Memo, "memoNo", "memo", 5);

  const items = [];
  let overallMemoValue = 0;

  for (const item of data.items) {
    let unitValue = Number(item.value || 0);
    let caratWeight = Number(item.carat || 0);

    if (item.inventoryType === "Gemstone") {
      const stone = await Product.findOne({ _id: item.inventoryId, category: "Gemstone" });
      if (!stone || (stone.status !== "In Stock" && stone.status !== "Available")) {
        throw new ApiError(
          400,
          `Gemstone ${stone?.stoneId || stone?.productCode || item.inventoryId} is not available in stock (Status: ${stone?.status})`
        );
      }
      stone.status = "On Memo";
      await stone.save();
      if (!unitValue) {
        unitValue = Number(stone.sellingPrice || (stone.purchasePrice || stone.costPrice || 0) * 1.25);
      }
      if (!caratWeight) {
        caratWeight = Number(stone.carat || 0);
      }
    } else if (item.inventoryType === "Product") {
      const prod = await Product.findById(item.inventoryId);
      if (!prod || (prod.status !== "In Stock" && prod.status !== "Available")) {
        throw new ApiError(
          400,
          `Product ${prod?.productCode || item.inventoryId} is not available in stock (Status: ${prod?.status})`
        );
      }
      prod.status = "On Memo";
      await prod.save();
      if (!unitValue) {
        unitValue = Number(prod.sellingPrice || 0);
      }
    }

    const qty = Number(item.quantity || 1);
    const itemTotalValue = unitValue * qty;
    overallMemoValue += itemTotalValue;

    items.push({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      quantity: qty,
      carat: caratWeight,
      value: unitValue,
      totalValue: itemTotalValue,
      status: "On Memo",
    });
  }

  const memo = await Memo.create({
    memoNo,
    customerId: data.customerId,
    issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
    expectedReturn: new Date(data.expectedReturn),
    totalValue: overallMemoValue,
    status: "With Client",
    remarks: data.remarks || data.notes || "",
    items,
    historyLog: [
      {
        date: new Date(),
        action: "Memo Created",
        details: `Issued ${items.length} item(s) on memo ${memoNo} valued at $${overallMemoValue.toLocaleString()}`,
        performedBy: userId,
      },
    ],
    createdBy: userId,
  });

  for (const item of memo.items) {
    await movementService.logMovement({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      action: "Release on Memo",
      toLocation: "Customer Approval",
      quantity: item.quantity,
      weight: item.carat,
      referenceType: "Memo",
      referenceId: memo._id,
      userId,
      remarks: `Issued on Memo: ${memo.memoNo}`,
    });
  }

  await auditLogService.logAction({
    userId,
    entity: "Memo",
    entityId: memo._id,
    action: "create",
    newValue: memo.toObject(),
    ipAddress,
  });

  return getMemoById(memo._id);
}

async function returnMemoItem(memoId, itemId, userId, ipAddress = "") {
  const memo = await Memo.findById(memoId);
  if (!memo) throw new ApiError(404, "Memo not found");
  const oldVal = memo.toObject();

  const itemIndex = memo.items.findIndex((i) => i._id.toString() === itemId);
  if (itemIndex === -1) throw new ApiError(404, "Memo item not found");
  if (memo.items[itemIndex].status !== "On Memo") {
    throw new ApiError(400, "Item is already returned or sold");
  }

  const item = memo.items[itemIndex];
  item.status = "Returned";
  item.returnedDate = new Date();

  if (item.inventoryType === "Gemstone") {
    await Product.findByIdAndUpdate(item.inventoryId, { status: "Available" });
  } else if (item.inventoryType === "Product") {
    await Product.findByIdAndUpdate(item.inventoryId, { status: "Available" });
  }

  const allOnMemo = memo.items.filter((i) => i.status === "On Memo").length;
  if (allOnMemo === 0) {
    memo.status = "Fully Returned";
    memo.actualReturn = new Date();
  } else {
    memo.status = "Partially Returned";
  }

  memo.historyLog.push({
    date: new Date(),
    action: "Item Returned",
    details: `Returned item (${item.inventoryType}) back to company stock`,
    performedBy: userId,
  });

  await memo.save();

  await movementService.logMovement({
    inventoryType: item.inventoryType,
    inventoryId: item.inventoryId,
    action: "Return from Memo",
    toLocation: "Vault",
    quantity: item.quantity,
    weight: item.carat,
    referenceType: "Memo",
    referenceId: memo._id,
    userId,
    remarks: `Returned from Memo: ${memo.memoNo}`,
  });

  await auditLogService.logAction({
    userId,
    entity: "Memo",
    entityId: memo._id,
    action: "update",
    oldValue: oldVal,
    newValue: memo.toObject(),
    ipAddress,
  });

  return getMemoById(memoId);
}

async function convertMemoToSale(memoId, itemId, paymentMethod = "Cash", userId, ipAddress = "") {
  const memo = await Memo.findById(memoId);
  if (!memo) throw new ApiError(404, "Memo not found");
  const oldVal = memo.toObject();

  const itemIndex = memo.items.findIndex((i) => i._id.toString() === itemId);
  if (itemIndex === -1) throw new ApiError(404, "Memo item not found");
  if (memo.items[itemIndex].status !== "On Memo") {
    throw new ApiError(400, "Item is already returned or sold");
  }

  const item = memo.items[itemIndex];
  item.status = "Sold";

  const invoiceNo = await generateId(Sale, "invoiceNo", "invoice", 5);
  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage || 2.0;

  let costPrice = 0;
  let sellingPrice = Number(item.value || 0);

  if (item.inventoryType === "Gemstone") {
    const stone = await Product.findById(item.inventoryId);
    costPrice = stone?.costPrice || stone?.purchasePrice || 0;
    if (!sellingPrice) sellingPrice = stone?.sellingPrice || costPrice * 1.25;
    if (stone) {
      stone.status = "Sold";
      await stone.save();
    }
  } else if (item.inventoryType === "Product") {
    const prod = await Product.findById(item.inventoryId);
    costPrice = prod.costPrice || 0;
    if (!sellingPrice) sellingPrice = prod.sellingPrice;
    prod.status = "Sold";
    await prod.save();
  }

  const totalSaleAmount = sellingPrice * item.quantity;
  const totalCostAmount = costPrice * item.quantity;
  const grossProfit = Math.max(0, totalSaleAmount - totalCostAmount);
  const charityAmount = grossProfit * (charityPct / 100);
  const netProfit = Math.max(0, grossProfit - charityAmount);

  const sale = await Sale.create({
    invoiceNo,
    customerId: memo.customerId,
    subtotal: totalSaleAmount,
    total: totalSaleAmount,
    amountPaid: totalSaleAmount,
    balanceDue: 0,
    paymentStatus: "Paid",
    paymentMethod,
    charityPercentage: charityPct,
    charityAmount,
    grossProfit,
    netProfit,
    notes: `Converted from Consignment / Memo ${memo.memoNo}`,
    createdBy: userId,
  });

  await SaleItem.create({
    saleId: sale._id,
    inventoryType: item.inventoryType,
    inventoryId: item.inventoryId,
    quantity: item.quantity,
    sellingPrice,
  });

  memo.convertedSaleId = sale._id;
  const allOnMemo = memo.items.filter((i) => i.status === "On Memo").length;
  if (allOnMemo === 0) {
    memo.status = "Sold";
    memo.actualReturn = new Date();
  }

  memo.historyLog.push({
    date: new Date(),
    action: "Converted to Sale",
    details: `Item converted to Sale invoice ${sale.invoiceNo} ($${totalSaleAmount.toLocaleString()})`,
    performedBy: userId,
  });

  await memo.save();

  await movementService.logMovement({
    inventoryType: item.inventoryType,
    inventoryId: item.inventoryId,
    action: "Sale",
    toLocation: "Sold",
    quantity: item.quantity,
    weight: item.carat,
    referenceType: "Sale",
    referenceId: sale._id,
    userId,
    remarks: `Converted from Memo: ${memo.memoNo} to Sale: ${sale.invoiceNo}`,
  });

  await auditLogService.logAction({
    userId,
    entity: "Memo",
    entityId: memo._id,
    action: "update",
    oldValue: oldVal,
    newValue: memo.toObject(),
    ipAddress,
  });

  return getMemoById(memoId);
}

async function extendMemo(id, newExpectedDate, reason = "", userId, ipAddress = "") {
  const memo = await Memo.findById(id);
  if (!memo) throw new ApiError(404, "Memo not found");

  const oldVal = memo.toObject();
  const previousReturnDate = memo.expectedReturn;
  const newReturn = new Date(newExpectedDate);

  memo.expectedReturn = newReturn;
  memo.status = "Extended";

  memo.extensionHistory.push({
    extensionDate: new Date(),
    previousReturnDate,
    newReturnDate: newReturn,
    reason: reason || "Return date extended",
    createdBy: userId,
  });

  memo.historyLog.push({
    date: new Date(),
    action: "Memo Extended",
    details: `Return date extended to ${newReturn.toLocaleDateString()}. Reason: ${reason || "Client request"}`,
    performedBy: userId,
  });

  await memo.save();

  await auditLogService.logAction({
    userId,
    entity: "Memo",
    entityId: memo._id,
    action: "update",
    oldValue: oldVal,
    newValue: memo.toObject(),
    ipAddress,
  });

  return getMemoById(id);
}

export default {
  getAllMemos,
  getMemoById,
  getMemoMetrics,
  createMemo,
  returnMemoItem,
  convertMemoToSale,
  extendMemo,
};
