import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Gemstone from "../models/Gemstone.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Settings from "../models/Settings.js";
import Payment from "../models/Payment.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllSales({ customerId, paymentStatus } = {}) {
  const query = {};
  if (customerId) query.customerId = customerId;
  if (paymentStatus && paymentStatus !== "All") query.paymentStatus = paymentStatus;
  return Sale.find(query).sort({ createdAt: -1 }).populate("customerId").populate("createdBy");
}

async function getSaleById(id) {
  const sale = await Sale.findById(id).populate("customerId").populate("createdBy");
  if (!sale) throw new ApiError(404, "Sale not found");

  const items = await SaleItem.find({ saleId: id }).populate("inventoryId");
  const paymentHistory = await Payment.find({ saleId: id }).sort({ createdAt: -1 }).populate("createdBy");

  return {
    sale,
    items,
    paymentHistory,
  };
}

async function createDirectSale(data, userId, ipAddress = "") {
  const invoiceNo = await generateId(Sale, "invoiceNo", "invoice", 5);

  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage ?? 2.0;

  let calculatedSubtotal = 0;
  let totalCostPrice = 0;

  const itemsToCreate = [];

  for (const item of data.items) {
    let costPrice = 0;
    let sellingPrice = Number(item.sellingPrice || 0);
    const qty = Number(item.quantity || 1);

    if (item.inventoryType === "Product") {
      const p = await Product.findById(item.inventoryId);
      if (!p) throw new ApiError(404, `Product not found: ${item.inventoryId}`);
      const currentQty = p.quantity ?? p.stockQuantity ?? 1;
      if (currentQty <= 0 || p.status === "Sold") {
        throw new ApiError(400, `Product ${p.productCode || p.name} is out of stock`);
      }
      if (currentQty < qty) {
        throw new ApiError(400, `Product ${p.productCode || p.name} only has ${currentQty} units available, requested ${qty}`);
      }

      costPrice = p.costPrice || 0;
      if (!sellingPrice) sellingPrice = p.sellingPrice || 0;

      const origQty = p.originalQuantity || (currentQty + (p.soldQuantity || 0)) || currentQty;
      const newSoldQty = (p.soldQuantity || 0) + qty;
      const remainingQty = Math.max(0, currentQty - qty);

      p.originalQuantity = origQty;
      p.soldQuantity = newSoldQty;
      p.quantity = remainingQty;
      p.stockQuantity = remainingQty;
      p.availableQuantity = remainingQty;

      if (remainingQty === 0) {
        p.status = "Sold";
        p.sellingStatus = "Sold";
      } else {
        p.status = "In Stock";
        p.sellingStatus = "In Stock";
      }

      p.lastSellingPrice = sellingPrice;
      p.lastSoldDate = new Date();
      if (data.customerId) {
        const cust = await Customer.findById(data.customerId);
        if (cust) p.customer = cust.name;
      }

      p.history = [
        ...(p.history || []),
        {
          date: new Date(),
          action: `Sold ${qty} unit(s) via Invoice #${invoiceNo} (Remaining: ${remainingQty})`,
          user: userId?.toString() || "System",
        },
      ];

      await p.save();
    } else if (item.inventoryType === "Gemstone") {
      const g = await Gemstone.findById(item.inventoryId);
      if (!g) throw new ApiError(404, `Gemstone not found: ${item.inventoryId}`);
      if (g.status === "Sold") throw new ApiError(400, `Gemstone ${g.stoneId} is already sold`);

      costPrice = g.costPrice || g.purchasePrice || 0;
      if (!sellingPrice) sellingPrice = g.sellingPrice || costPrice * 1.25;

      g.status = "Sold";
      await g.save();
    }

    calculatedSubtotal += sellingPrice * qty;
    totalCostPrice += costPrice * qty;

    itemsToCreate.push({
      inventoryType: item.inventoryType,
      inventoryId: item.inventoryId,
      quantity: qty,
      sellingPrice,
      discount: Number(item.discount || 0),
    });
  }

  // Calculate Discount (Fixed vs Percentage)
  const discountType = data.discountType === "percentage" ? "percentage" : "fixed";
  const discountVal = Number(data.discountValue ?? data.discount ?? 0);
  let computedDiscount = 0;

  if (discountType === "percentage") {
    computedDiscount = (calculatedSubtotal * Math.min(100, Math.max(0, discountVal))) / 100;
  } else {
    computedDiscount = Math.min(calculatedSubtotal, Math.max(0, discountVal));
  }

  const netSubtotal = Math.max(0, calculatedSubtotal - computedDiscount);

  // Separate Tax & GST Calculations
  const isTaxEnabled = Boolean(data.isTaxEnabled);
  const taxPct = isTaxEnabled ? Number(data.taxPercentage || 0) : 0;
  const taxAmt = isTaxEnabled ? (netSubtotal * taxPct) / 100 : 0;

  const isGstEnabled = Boolean(data.isGstEnabled);
  const gstPct = isGstEnabled ? Number(data.gstPercentage || 0) : 0;
  const gstAmt = isGstEnabled ? (netSubtotal * gstPct) / 100 : 0;

  const totalTax = taxAmt + gstAmt + Number(data.tax || 0);
  const total = Math.max(0, netSubtotal + totalTax);

  // Payment Status & Balance Due
  const amountPaid = Number(data.amountPaid ?? (data.paymentStatus === "Paid" ? total : 0));
  const balanceDue = Math.max(0, total - amountPaid);

  let derivedPaymentStatus = "Unpaid";
  if (amountPaid >= total && total > 0) {
    derivedPaymentStatus = "Paid";
  } else if (amountPaid > 0) {
    derivedPaymentStatus = "Partially Paid";
  }

  // Profit Calculations
  const grossProfit = Math.max(0, total - totalCostPrice);
  const charityAmount = grossProfit * (charityPct / 100);
  const netProfit = Math.max(0, grossProfit - charityAmount);

  const sale = await Sale.create({
    invoiceNo,
    customerId: data.customerId,
    subtotal: calculatedSubtotal,
    discountType,
    discountValue: discountVal,
    discount: computedDiscount,
    isTaxEnabled,
    taxPercentage: taxPct,
    taxAmount: taxAmt,
    isGstEnabled,
    gstPercentage: gstPct,
    gstAmount: gstAmt,
    tax: totalTax,
    total,
    amountPaid,
    balanceDue,
    paymentStatus: derivedPaymentStatus,
    paymentMethod: data.paymentMethod || "Cash",
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    charityPercentage: charityPct,
    charityAmount,
    grossProfit,
    netProfit,
    notes: data.notes || "",
    createdBy: userId,
  });

  // Create initial Payment transaction if initial amountPaid > 0
  if (amountPaid > 0) {
    const paymentId = await generateId(Payment, "paymentId", "pay", 5);
    await Payment.create({
      paymentId,
      saleId: sale._id,
      invoiceNo,
      customerId: data.customerId,
      amount: amountPaid,
      paymentMethod: data.paymentMethod || "Cash",
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      notes: data.notes ? `Initial Payment: ${data.notes}` : "Initial Payment on Sale Creation",
      createdBy: userId,
    });
  }

  // Update Customer Outstanding Balance if balance due > 0
  if (balanceDue > 0 && data.customerId) {
    const customer = await Customer.findById(data.customerId);
    if (customer) {
      customer.outstandingBalance = (customer.outstandingBalance || 0) + balanceDue;
      await customer.save();
    }
  }

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
      remarks: `Sales invoice ${sale.invoiceNo} completed`,
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

async function recordPayment(saleId, paymentData, userId, ipAddress = "") {
  const sale = await Sale.findById(saleId);
  if (!sale) throw new ApiError(404, "Sale not found");

  const paymentAmount = Number(paymentData.amount || 0);
  if (paymentAmount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }
  if (paymentAmount > sale.balanceDue + 0.001) {
    throw new ApiError(400, `Payment amount ($${paymentAmount}) cannot exceed remaining balance due ($${sale.balanceDue})`);
  }

  const paymentId = await generateId(Payment, "paymentId", "pay", 5);

  const paymentRecord = await Payment.create({
    paymentId,
    saleId: sale._id,
    invoiceNo: sale.invoiceNo,
    customerId: sale.customerId,
    amount: paymentAmount,
    paymentMethod: paymentData.paymentMethod || "Cash",
    paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
    notes: paymentData.notes || "",
    attachments: paymentData.attachments || [],
    createdBy: userId,
  });

  // Update Sale balances
  const newAmountPaid = sale.amountPaid + paymentAmount;
  const newBalanceDue = Math.max(0, sale.total - newAmountPaid);

  let newStatus = "Unpaid";
  if (newBalanceDue <= 0.001) {
    newStatus = "Paid";
  } else if (sale.dueDate && new Date(sale.dueDate) < new Date()) {
    newStatus = "Overdue";
  } else if (newAmountPaid > 0) {
    newStatus = "Partially Paid";
  }

  sale.amountPaid = newAmountPaid;
  sale.balanceDue = newBalanceDue;
  sale.paymentStatus = newStatus;
  await sale.save();

  // Recalculate Customer Outstanding Balance across all customer sales
  if (sale.customerId) {
    const customerSales = await Sale.find({ customerId: sale.customerId });
    const totalCustomerBalance = customerSales.reduce((sum, s) => sum + (s.balanceDue || 0), 0);
    await Customer.findByIdAndUpdate(sale.customerId, { outstandingBalance: totalCustomerBalance });
  }

  await auditLogService.logAction({
    userId,
    entity: "Payment",
    entityId: paymentRecord._id,
    action: "create",
    newValue: paymentRecord.toObject(),
    ipAddress,
  });

  return getSaleById(sale._id);
}

export default {
  getAllSales,
  getSaleById,
  createDirectSale,
  recordPayment,
};
