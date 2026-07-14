import Memo from "../models/Memo.js";
import Gemstone from "../models/Gemstone.js";
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
      status: { $in: ["With Client", "Partially Returned"] },
      expectedReturn: { $lt: now }
    },
    { $set: { status: "Overdue" } }
  );
}

async function getAllMemos({ status, customerId } = {}) {
  await updateOverdueMemos();
  const query = {};
  if (status) query.status = status;
  if (customerId) query.customerId = customerId;
  return Memo.find(query).sort({ createdAt: -1 }).populate("customerId").populate("createdBy");
}

async function getMemoById(id) {
  await updateOverdueMemos();
  const memo = await Memo.findById(id)
    .populate("customerId")
    .populate("createdBy")
    .populate("items.inventoryId");
  if (!memo) throw new ApiError(404, "Memo not found");
  return memo;
}

async function createMemo(data, userId, ipAddress = "") {
  const memoNo = await generateId(Memo, "memoNo", "memo", 5);

  const items = [];
  for (const item of data.items) {
    if (item.inventoryType === "Gemstone") {
      const stone = await Gemstone.findById(item.inventoryId);
      if (!stone || stone.status !== "In Stock") {
        throw new ApiError(
          400,
          `Gemstone ${item.inventoryId} is not available (Status: ${stone?.status})`
        );
      }
      stone.status = "On Memo";
      await stone.save();
    } else if (item.inventoryType === "Product") {
      const prod = await Product.findById(item.inventoryId);
      if (!prod || prod.status !== "In Stock") {
        throw new ApiError(
          400,
          `Product ${item.inventoryId} is not available (Status: ${prod?.status})`
        );
      }
      prod.status = "On Memo";
      await prod.save();
    }

    items.push({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      quantity: item.quantity || 1,
      carat: item.carat || 0,
      status: "On Memo",
    });
  }

  const memo = await Memo.create({
    memoNo,
    customerId: data.customerId,
    expectedReturn: data.expectedReturn,
    remarks: data.remarks || "",
    items,
    createdBy: userId,
  });

  for (const item of memo.items) {
    await movementService.logMovement({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      action: "On Memo",
      toLocation: "Customer Approval",
      quantity: item.quantity,
      weight: item.carat,
      referenceType: "Customer",
      referenceId: memo.customerId,
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
    await Gemstone.findByIdAndUpdate(item.inventoryId, { status: "In Stock" });
  } else if (item.inventoryType === "Product") {
    await Product.findByIdAndUpdate(item.inventoryId, { status: "In Stock" });
  }

  const allOnMemo = memo.items.filter((i) => i.status === "On Memo").length;
  if (allOnMemo === 0) {
    memo.status = "Fully Returned";
    memo.actualReturn = new Date();
  } else {
    memo.status = "Partially Returned";
  }

  await memo.save();

  await movementService.logMovement({
    inventoryType: item.inventoryType,
    inventoryId: item.inventoryId,
    action: "Return from Memo",
    toLocation: "Vault",
    quantity: item.quantity,
    weight: item.carat,
    referenceType: "Customer",
    referenceId: memo.customerId,
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
  let sellingPrice = 0;

  if (item.inventoryType === "Gemstone") {
    const stone = await Gemstone.findById(item.inventoryId);
    costPrice = stone.purchasePrice;
    sellingPrice = stone.purchasePrice * 1.25;
    stone.status = "Sold";
    await stone.save();
  } else if (item.inventoryType === "Product") {
    const prod = await Product.findById(item.inventoryId);
    costPrice = prod.costPrice;
    sellingPrice = prod.sellingPrice;
    prod.status = "Sold";
    await prod.save();
  }

  const grossProfit = Math.max(0, sellingPrice - costPrice);
  const charityAmount = grossProfit * (charityPct / 100);
  const netProfit = Math.max(0, grossProfit - charityAmount);

  const sale = await Sale.create({
    invoiceNo,
    customerId: memo.customerId,
    subtotal: sellingPrice,
    total: sellingPrice,
    paymentStatus: "Paid",
    paymentMethod,
    charityPercentage: charityPct,
    charityAmount,
    grossProfit,
    netProfit,
    createdBy: userId,
  });

  await SaleItem.create({
    saleId: sale._id,
    inventoryType: item.inventoryType,
    inventoryId: item.inventoryId,
    quantity: item.quantity,
    sellingPrice,
  });

  const allOnMemo = memo.items.filter((i) => i.status === "On Memo").length;
  if (allOnMemo === 0) {
    memo.status = "Closed";
    memo.actualReturn = new Date();
  }

  await memo.save();

  await movementService.logMovement({
    inventoryType: item.inventoryType,
    inventoryId: item.inventoryId,
    action: "Sale",
    toLocation: "Sold",
    quantity: item.quantity,
    weight: item.carat,
    referenceType: "Customer",
    referenceId: memo.customerId,
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

async function extendMemo(id, newExpectedDate, userId, ipAddress = "") {
  const memo = await Memo.findById(id);
  if (!memo) throw new ApiError(404, "Memo not found");

  if (memo.status !== "With Client" && memo.status !== "Partially Returned" && memo.status !== "Overdue") {
    throw new ApiError(400, "Only active or overdue memos can be extended");
  }

  const oldVal = memo.toObject();
  memo.expectedReturn = new Date(newExpectedDate);

  const now = new Date();
  if (memo.expectedReturn > now) {
    const allOnMemo = memo.items.filter((i) => i.status === "On Memo").length;
    const allReturned = memo.items.filter((i) => i.status === "Returned" || i.status === "Sold").length;
    if (allReturned > 0) {
      memo.status = "Partially Returned";
    } else {
      memo.status = "With Client";
    }
  }

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
  createMemo,
  returnMemoItem,
  convertMemoToSale,
  extendMemo,
};
