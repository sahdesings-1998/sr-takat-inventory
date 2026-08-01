import PurchaseInvoice from "../models/PurchaseInvoice.js";
import Supplier from "../models/Supplier.js";
import SupplierPayment from "../models/SupplierPayment.js";
import InventoryMovement from "../models/InventoryMovement.js";
import Material from "../models/Material.js";
import GemstoneLot from "../models/GemstoneLot.js";
import Product from "../models/Product.js";
import generateId from "../utils/generateId.js";
import auditLogService from "./auditLogService.js";
import supplierService from "./supplierService.js";
import ApiError from "../utils/ApiError.js";

async function getAllPurchaseInvoices({ supplierId, status, paymentStatus, search, startDate, endDate } = {}) {
  const query = { isDeleted: false };

  if (supplierId) query.supplierId = supplierId;
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) query.purchaseDate.$lte = new Date(endDate);
  }

  let invoices = await PurchaseInvoice.find(query)
    .populate("supplierId", "companyName contactName phone email supplierType country")
    .populate("createdBy", "fullName")
    .sort({ purchaseDate: -1, createdAt: -1 });

  if (search) {
    const s = search.toLowerCase();
    invoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(s) ||
        inv.supplierInvoiceNumber?.toLowerCase().includes(s) ||
        inv.supplierId?.companyName?.toLowerCase().includes(s) ||
        inv.supplierId?.contactName?.toLowerCase().includes(s)
    );
  }

  return invoices;
}

async function getPurchaseInvoiceById(id) {
  const invoice = await PurchaseInvoice.findOne({ _id: id, isDeleted: false })
    .populate("supplierId")
    .populate("createdBy", "fullName email")
    .populate("confirmedBy", "fullName")
    .populate("cancelledBy", "fullName");

  if (!invoice) throw new ApiError(404, "Purchase invoice not found");

  const payments = await SupplierPayment.find({ purchaseInvoiceId: id }).sort({ paymentDate: -1 });
  const movements = await InventoryMovement.find({ purchaseInvoiceId: id }).sort({ movementDate: -1 });

  return {
    ...invoice.toObject(),
    payments,
    stockMovements: movements,
  };
}

async function createPurchaseInvoice(data, userId) {
  const supplier = await Supplier.findOne({ _id: data.supplierId, isDeleted: false });
  if (!supplier) throw new ApiError(404, "Selected supplier not found");

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new ApiError(400, "Purchase invoice must contain at least one item");
  }

  const invoiceNumber = data.invoiceNumber || (await generateId(PurchaseInvoice, "invoiceNumber", "PINV", 5));

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const processedItems = data.items.map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.purchasePrice);
    const tax = Number(item.tax || 0);
    const discount = Number(item.discount || 0);

    if (!qty || qty <= 0) throw new ApiError(400, `Invalid quantity for item "${item.name}"`);
    if (price < 0) throw new ApiError(400, `Invalid purchase price for item "${item.name}"`);

    const itemSubtotal = qty * price;
    const itemTotal = Math.max(0, itemSubtotal - discount + tax);

    subtotal += itemSubtotal;
    discountTotal += discount;
    taxTotal += tax;

    return {
      inventoryType: item.inventoryType || "Material",
      inventoryId: item.inventoryId || null,
      name: item.name,
      itemType: item.itemType || "Material",
      quantity: qty,
      unit: item.unit || "pcs",
      purchasePrice: price,
      tax,
      discount,
      totalAmount: itemTotal,
    };
  });

  const finalTotal = Math.max(0, subtotal - discountTotal + taxTotal);

  const invoice = await PurchaseInvoice.create({
    invoiceNumber,
    supplierInvoiceNumber: data.supplierInvoiceNumber || "",
    supplierId: data.supplierId,
    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    status: "Draft",
    paymentStatus: "Unpaid",
    items: processedItems,
    subtotal,
    discountTotal,
    taxTotal,
    finalTotal,
    paidAmount: 0,
    outstandingBalance: finalTotal,
    notes: data.notes || "",
    attachments: data.attachments || [],
    createdBy: userId,
  });

  if (data.confirmImmediately || data.status === "Confirmed") {
    return confirmPurchaseInvoice(invoice._id, userId);
  }

  return getPurchaseInvoiceById(invoice._id);
}

async function updatePurchaseInvoice(id, data, userId) {
  const invoice = await PurchaseInvoice.findOne({ _id: id, isDeleted: false });
  if (!invoice) throw new ApiError(404, "Purchase invoice not found");

  if (invoice.status !== "Draft") {
    throw new ApiError(400, "Only draft purchase invoices can be updated");
  }

  if (data.supplierInvoiceNumber !== undefined) invoice.supplierInvoiceNumber = data.supplierInvoiceNumber;
  if (data.invoiceDate) invoice.invoiceDate = new Date(data.invoiceDate);
  if (data.purchaseDate) invoice.purchaseDate = new Date(data.purchaseDate);
  if (data.dueDate !== undefined) invoice.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.notes !== undefined) invoice.notes = data.notes;
  if (data.attachments) invoice.attachments = data.attachments;

  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const processedItems = data.items.map((item) => {
      const qty = Number(item.quantity);
      const price = Number(item.purchasePrice);
      const tax = Number(item.tax || 0);
      const discount = Number(item.discount || 0);

      if (!qty || qty <= 0) throw new ApiError(400, `Invalid quantity for item "${item.name}"`);
      if (price < 0) throw new ApiError(400, `Invalid purchase price for item "${item.name}"`);

      const itemSubtotal = qty * price;
      const itemTotal = Math.max(0, itemSubtotal - discount + tax);

      subtotal += itemSubtotal;
      discountTotal += discount;
      taxTotal += tax;

      return {
        inventoryType: item.inventoryType || "Material",
        inventoryId: item.inventoryId || null,
        name: item.name,
        itemType: item.itemType || "Material",
        quantity: qty,
        unit: item.unit || "pcs",
        purchasePrice: price,
        tax,
        discount,
        totalAmount: itemTotal,
      };
    });

    invoice.items = processedItems;
    invoice.subtotal = subtotal;
    invoice.discountTotal = discountTotal;
    invoice.taxTotal = taxTotal;
    invoice.finalTotal = Math.max(0, subtotal - discountTotal + taxTotal);
    invoice.outstandingBalance = Math.max(0, invoice.finalTotal - (invoice.paidAmount || 0));
  }

  await invoice.save();
  return getPurchaseInvoiceById(invoice._id);
}

async function confirmPurchaseInvoice(id, userId, ipAddress = "") {
  const invoice = await PurchaseInvoice.findOne({ _id: id, isDeleted: false });
  if (!invoice) throw new ApiError(404, "Purchase invoice not found");

  if (invoice.status === "Confirmed") {
    throw new ApiError(400, "Purchase invoice is already confirmed");
  }
  if (invoice.status === "Cancelled") {
    throw new ApiError(400, "Cannot confirm a cancelled purchase invoice");
  }

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    let previousStock = 0;
    let updatedStock = 0;
    let inventoryDoc = null;

    if (item.inventoryId) {
      if (item.inventoryType === "Material") {
        inventoryDoc = await Material.findById(item.inventoryId);
        if (inventoryDoc) {
          previousStock = Number(inventoryDoc.quantity || 0);
          updatedStock = previousStock + Number(item.quantity);
          inventoryDoc.quantity = updatedStock;
          if (item.purchasePrice > 0) inventoryDoc.cost = Number(item.purchasePrice);
          inventoryDoc.supplierId = invoice.supplierId;
          await inventoryDoc.save();
        }
      } else if (item.inventoryType === "Gemstone") {
        inventoryDoc = await Product.findById(item.inventoryId);
        if (inventoryDoc) {
          previousStock = Number(inventoryDoc.quantity || inventoryDoc.pieces || 1);
          updatedStock = previousStock + Number(item.quantity);
          inventoryDoc.quantity = updatedStock;
          inventoryDoc.pieces = updatedStock;
          await inventoryDoc.save();
        }
      } else if (item.inventoryType === "GemstoneLot") {
        inventoryDoc = await GemstoneLot.findById(item.inventoryId);
        if (inventoryDoc) {
          previousStock = Number(inventoryDoc.remainingCarat || 0);
          updatedStock = previousStock + Number(item.quantity);
          inventoryDoc.remainingCarat = updatedStock;
          inventoryDoc.totalCarat = Number(inventoryDoc.totalCarat || 0) + Number(item.quantity);
          await inventoryDoc.save();
        }
      } else if (item.inventoryType === "Product") {
        inventoryDoc = await Product.findById(item.inventoryId);
        if (inventoryDoc) {
          previousStock = Number(inventoryDoc.quantity || inventoryDoc.availableQuantity || 0);
          updatedStock = previousStock + Number(item.quantity);
          inventoryDoc.quantity = updatedStock;
          inventoryDoc.availableQuantity = updatedStock;
          inventoryDoc.stockQuantity = updatedStock;
          await inventoryDoc.save();
        }
      }
    }

    // Auto-create inventory item if not explicitly linked
    if (!inventoryDoc) {
      if (item.inventoryType === "Material") {
        const materialCode = await generateId(Material, "materialCode", "MAT", 4);
        inventoryDoc = await Material.create({
          materialCode,
          category: item.itemType || "Other",
          materialName: item.name,
          unit: item.unit || "grams",
          quantity: item.quantity,
          cost: item.purchasePrice,
          supplierId: invoice.supplierId,
          location: "Workshop Vault",
        });
      } else if (item.inventoryType === "Gemstone") {
        const stoneId = await generateId(Gemstone, "stoneId", "GEM", 4);
        inventoryDoc = await Gemstone.create({
          stoneId,
          stockNo: stoneId,
          gemstone: item.name,
          carat: item.quantity,
          pieces: item.quantity,
          purchasePrice: item.purchasePrice,
          costPerCarat: item.purchasePrice,
          supplierId: invoice.supplierId,
          location: "Vault",
          status: "In Stock",
          createdBy: userId,
        });
      } else if (item.inventoryType === "GemstoneLot") {
        const lotId = await generateId(GemstoneLot, "lotId", "LOT", 4);
        inventoryDoc = await GemstoneLot.create({
          lotId,
          gemstone: item.name,
          totalCarat: item.quantity,
          remainingCarat: item.quantity,
          purchaseCost: item.purchasePrice,
          supplierId: invoice.supplierId,
          location: "Vault",
          status: "In Stock",
        });
      } else if (item.inventoryType === "Product") {
        const productCode = await generateId(Product, "productCode", "PRD", 4);
        inventoryDoc = await Product.create({
          productCode,
          stockNo: productCode,
          name: item.name,
          quantity: item.quantity,
          availableQuantity: item.quantity,
          stockQuantity: item.quantity,
          costPrice: item.purchasePrice,
          purchasePrice: item.purchasePrice,
          supplier: (await Supplier.findById(invoice.supplierId))?.companyName || "",
          status: "Available",
        });
      }

      previousStock = 0;
      updatedStock = item.quantity;
      item.inventoryId = inventoryDoc._id;
    }

    // Log Stock Movement (Stock Inward)
    await InventoryMovement.create({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      action: "Stock Inward",
      quantity: item.quantity,
      unit: item.unit || "pcs",
      cost: item.purchasePrice,
      previousStock,
      updatedStock,
      fromLocation: "Supplier Purchase",
      toLocation: inventoryDoc?.location || "Vault",
      supplierId: invoice.supplierId,
      purchaseInvoiceId: invoice._id,
      referenceType: "PurchaseInvoice",
      referenceId: invoice._id,
      userId,
      remarks: `Stock Inward via Purchase Invoice #${invoice.invoiceNumber}`,
      movementDate: invoice.purchaseDate || new Date(),
    });
  }

  invoice.status = "Confirmed";
  invoice.confirmedAt = new Date();
  invoice.confirmedBy = userId;
  await invoice.save();

  await auditLogService.logAction({
    userId,
    entity: "PurchaseInvoice",
    entityId: invoice._id,
    action: "update",
    newValue: invoice.toObject(),
    ipAddress,
  });

  return getPurchaseInvoiceById(invoice._id);
}

async function cancelPurchaseInvoice(id, reason, userId, ipAddress = "") {
  const invoice = await PurchaseInvoice.findOne({ _id: id, isDeleted: false });
  if (!invoice) throw new ApiError(404, "Purchase invoice not found");

  if (invoice.status !== "Confirmed") {
    throw new ApiError(400, "Only confirmed purchase invoices can be cancelled");
  }

  // Reverse stock inward for each line item
  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    let previousStock = 0;
    let updatedStock = 0;

    if (item.inventoryId) {
      if (item.inventoryType === "Material") {
        const mat = await Material.findById(item.inventoryId);
        if (mat) {
          previousStock = Number(mat.quantity || 0);
          updatedStock = Math.max(0, previousStock - Number(item.quantity));
          mat.quantity = updatedStock;
          await mat.save();
        }
      } else if (item.inventoryType === "Gemstone") {
        const gem = await Product.findById(item.inventoryId);
        if (gem) {
          previousStock = Number(gem.quantity || gem.pieces || 1);
          updatedStock = Math.max(0, previousStock - Number(item.quantity));
          gem.quantity = updatedStock;
          gem.pieces = updatedStock;
          await gem.save();
        }
      } else if (item.inventoryType === "GemstoneLot") {
        const lot = await GemstoneLot.findById(item.inventoryId);
        if (lot) {
          previousStock = Number(lot.remainingCarat || 0);
          updatedStock = Math.max(0, previousStock - Number(item.quantity));
          lot.remainingCarat = updatedStock;
          await lot.save();
        }
      } else if (item.inventoryType === "Product") {
        const prd = await Product.findById(item.inventoryId);
        if (prd) {
          previousStock = Number(prd.quantity || prd.availableQuantity || 0);
          updatedStock = Math.max(0, previousStock - Number(item.quantity));
          prd.quantity = updatedStock;
          prd.availableQuantity = updatedStock;
          prd.stockQuantity = updatedStock;
          await prd.save();
        }
      }

      // Log Stock Reversal Movement
      await InventoryMovement.create({
        inventoryType: item.inventoryType,
        inventoryId: item.inventoryId,
        action: "Stock Reversal",
        quantity: -item.quantity,
        unit: item.unit || "pcs",
        cost: item.purchasePrice,
        previousStock,
        updatedStock,
        supplierId: invoice.supplierId,
        purchaseInvoiceId: invoice._id,
        referenceType: "PurchaseInvoice",
        referenceId: invoice._id,
        userId,
        remarks: `Stock Reversal: Purchase Invoice #${invoice.invoiceNumber} cancelled (${reason || "No reason specified"})`,
        movementDate: new Date(),
      });
    }
  }

  invoice.status = "Cancelled";
  invoice.cancelledAt = new Date();
  invoice.cancelledBy = userId;
  invoice.cancellationReason = reason || "";
  await invoice.save();

  await auditLogService.logAction({
    userId,
    entity: "PurchaseInvoice",
    entityId: invoice._id,
    action: "update",
    newValue: invoice.toObject(),
    ipAddress,
  });

  return getPurchaseInvoiceById(invoice._id);
}

async function recordInvoicePayment(id, paymentData, userId, ipAddress = "") {
  const invoice = await PurchaseInvoice.findOne({ _id: id, isDeleted: false });
  if (!invoice) throw new ApiError(404, "Purchase invoice not found");

  if (invoice.status === "Cancelled") {
    throw new ApiError(400, "Cannot record payment on a cancelled purchase invoice");
  }

  const amount = Number(paymentData.amount);
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  const paymentNo = await generateId(SupplierPayment, "paymentNo", "spay", 5);

  const payment = await SupplierPayment.create({
    paymentNo,
    supplierId: invoice.supplierId,
    purchaseInvoiceId: invoice._id,
    amount,
    paymentMethod: paymentData.paymentMethod || "Bank Transfer",
    paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
    notes: paymentData.notes || `Payment for Invoice #${invoice.invoiceNumber}`,
    attachments: paymentData.attachments || [],
    createdBy: userId,
  });

  invoice.paidAmount = (invoice.paidAmount || 0) + amount;
  invoice.outstandingBalance = Math.max(0, invoice.finalTotal - invoice.paidAmount);

  if (invoice.outstandingBalance <= 0.01) {
    invoice.paymentStatus = "Paid";
  } else if (invoice.paidAmount > 0) {
    invoice.paymentStatus = "Partially Paid";
  } else {
    invoice.paymentStatus = "Unpaid";
  }

  await invoice.save();

  await auditLogService.logAction({
    userId,
    entity: "SupplierPayment",
    entityId: payment._id,
    action: "create",
    newValue: payment.toObject(),
    ipAddress,
  });

  return getPurchaseInvoiceById(invoice._id);
}

async function deletePurchaseInvoice(id, userId) {
  const invoice = await PurchaseInvoice.findOne({ _id: id, isDeleted: false });
  if (!invoice) throw new ApiError(404, "Purchase invoice not found");

  if (invoice.status === "Confirmed") {
    throw new ApiError(400, "Confirmed purchase invoices cannot be deleted. Please cancel the invoice first to reverse stock.");
  }

  invoice.isDeleted = true;
  invoice.deletedAt = new Date();
  invoice.deletedBy = userId;
  await invoice.save();

  return invoice;
}

export default {
  getAllPurchaseInvoices,
  getPurchaseInvoiceById,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  confirmPurchaseInvoice,
  cancelPurchaseInvoice,
  recordInvoicePayment,
  deletePurchaseInvoice,
};
