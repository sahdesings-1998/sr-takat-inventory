import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Gemstone from "../models/Gemstone.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllSales({ customerId, paymentStatus } = {}) {
  const query = {};
  if (customerId) query.customerId = customerId;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  return Sale.find(query).sort({ createdAt: -1 }).populate("customerId").populate("createdBy");
}

async function getSaleById(id) {
  const sale = await Sale.findById(id).populate("customerId").populate("createdBy");
  if (!sale) throw new ApiError(404, "Sale not found");

  const items = await SaleItem.find({ saleId: id }).populate("inventoryId");
  return {
    sale,
    items,
  };
}

async function createDirectSale(data, userId, ipAddress = "") {
  const invoiceNo = await generateId(Sale, "invoiceNo", "invoice", 5);

  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage || 2.0;

  let calculatedSubtotal = 0;
  let calculatedGrossProfit = 0;

  const itemsToCreate = [];

  for (const item of data.items) {
    let costPrice = 0;
    let sellingPrice = Number(item.sellingPrice);

    if (item.inventoryType === "Gemstone") {
      const stone = await Gemstone.findById(item.inventoryId);
      if (!stone || stone.status !== "In Stock") {
        throw new ApiError(400, `Gemstone ${item.inventoryId} is not in stock`);
      }
      stone.status = "Sold";
      await stone.save();
      costPrice = stone.purchasePrice;
    } else if (item.inventoryType === "Product") {
      const prod = await Product.findById(item.inventoryId);
      if (!prod || prod.status !== "In Stock") {
        throw new ApiError(400, `Product ${item.inventoryId} is not in stock`);
      }
      prod.status = "Sold";
      await prod.save();
      costPrice = prod.costPrice;
    }

    calculatedSubtotal += sellingPrice * (item.quantity || 1);
    const itemProfit = Math.max(0, sellingPrice - costPrice) * (item.quantity || 1);
    calculatedGrossProfit += itemProfit;

    itemsToCreate.push({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      quantity: item.quantity || 1,
      sellingPrice,
      discount: item.discount || 0,
    });
  }

  const discount = Number(data.discount || 0);
  const tax = Number(data.tax || 0);
  const total = Math.max(0, calculatedSubtotal - discount + tax);

  const finalGross = Math.max(0, calculatedGrossProfit - discount);
  const charityAmount = finalGross * (charityPct / 100);
  const netProfit = Math.max(0, finalGross - charityAmount);

  const sale = await Sale.create({
    invoiceNo,
    customerId: data.customerId,
    subtotal: calculatedSubtotal,
    discount,
    tax,
    total,
    paymentStatus: data.paymentStatus || "Paid",
    paymentMethod: data.paymentMethod || "Cash",
    charityPercentage: charityPct,
    charityAmount,
    grossProfit: finalGross,
    netProfit,
    notes: data.notes || "",
    createdBy: userId,
  });

  for (const itemData of itemsToCreate) {
    await SaleItem.create({
      saleId: sale._id,
      ...itemData,
    });

    await movementService.logMovement({
      inventoryType: itemData.inventoryType,
      inventoryId: itemData.inventoryId,
      action: "Sale",
      toLocation: "Sold",
      quantity: itemData.quantity,
      referenceType: "Sale",
      referenceId: sale._id,
      userId,
      remarks: `Direct purchase invoice: ${sale.invoiceNo}`,
    });
  }

  await auditLogService.logAction({
    userId,
    entity: "Sale",
    entityId: sale._id,
    action: "create",
    newValue: sale.toObject(),
    ipAddress,
  });

  return getSaleById(sale._id);
}

export default {
  getAllSales,
  getSaleById,
  createDirectSale,
};
