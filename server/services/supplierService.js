import Supplier from "../models/Supplier.js";
import Gemstone from "../models/Gemstone.js";
import Material from "../models/Material.js";
import SupplierPayment from "../models/SupplierPayment.js";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import InventoryMovement from "../models/InventoryMovement.js";
import generateId from "../utils/generateId.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function computeSupplierTotals(supplierId) {
  // Confirmed Purchase Invoices
  const purchaseInvoices = await PurchaseInvoice.find({ supplierId, isDeleted: false }).sort({ purchaseDate: -1 });

  const confirmedInvoices = purchaseInvoices.filter((inv) => inv.status === "Confirmed");
  const invoicePurchaseTotal = confirmedInvoices.reduce((sum, inv) => sum + Number(inv.finalTotal || 0), 0);

  let totalItemsPurchased = 0;
  confirmedInvoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      totalItemsPurchased += Number(item.quantity || 0);
    });
  });

  // Legacy direct Gemstones/Metals/Components assigned to supplier
  const gemstones = await Gemstone.find({ supplierId, isDeleted: false });
  const gemstoneTotal = gemstones.reduce((sum, g) => sum + Number(g.purchasePrice || 0) * Number(g.pieces || 1), 0);

  const metals = await Material.find({
    supplierId,
    category: { $in: ["Gold", "Silver", "Platinum"] },
  });
  const metalTotal = metals.reduce((sum, m) => sum + Number(m.cost || 0) * Number(m.quantity || 1), 0);

  const components = await Material.find({
    supplierId,
    category: { $in: ["Setting", "Findings", "Packaging", "Other"] },
  });
  const componentTotal = components.reduce((sum, c) => sum + Number(c.cost || 0) * Number(c.quantity || 1), 0);

  // If purchase invoices exist, use invoice purchase total; add legacy unlinked items if any
  const legacyTotal = gemstoneTotal + metalTotal + componentTotal;
  const totalPurchaseAmount = invoicePurchaseTotal > 0 ? invoicePurchaseTotal : legacyTotal;

  // Payments
  const payments = await SupplierPayment.find({ supplierId }).sort({ paymentDate: -1 });
  const totalPaidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const outstandingBalance = Math.max(0, totalPurchaseAmount - totalPaidAmount);

  let paymentStatus = "No Purchases";
  if (totalPurchaseAmount > 0) {
    if (outstandingBalance <= 0.01) {
      paymentStatus = "Paid";
    } else if (totalPaidAmount > 0) {
      paymentStatus = "Partially Paid";
    } else {
      paymentStatus = "Unpaid";
    }
  }

  const unpaidInvoicesCount = purchaseInvoices.filter((inv) => inv.status === "Confirmed" && inv.paymentStatus === "Unpaid").length;
  const partiallyPaidInvoicesCount = purchaseInvoices.filter((inv) => inv.status === "Confirmed" && inv.paymentStatus === "Partially Paid").length;

  const stockMovements = await InventoryMovement.find({ supplierId }).sort({ movementDate: -1 }).limit(50);

  return {
    gemstones,
    gemstoneTotal,
    metals,
    metalTotal,
    components,
    componentTotal,
    purchaseInvoices,
    totalPurchasesCount: confirmedInvoices.length,
    totalItemsPurchased,
    unpaidInvoicesCount,
    partiallyPaidInvoicesCount,
    totalPurchaseAmount,
    totalPaidAmount,
    outstandingBalance,
    paymentStatus,
    paymentHistory: payments,
    stockMovements,
  };
}

async function getAllSuppliers({ search, status } = {}) {
  const query = { isDeleted: false };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { contactName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const suppliers = await Supplier.find(query).sort({ companyName: 1 });

  const enrichedSuppliers = await Promise.all(
    suppliers.map(async (s) => {
      const totals = await computeSupplierTotals(s._id);
      return {
        ...s.toObject(),
        totalPurchases: totals.totalPurchaseAmount,
        totalPaid: totals.totalPaidAmount,
        outstandingBalance: totals.outstandingBalance,
        paymentStatus: totals.paymentStatus,
        purchaseCount: totals.totalPurchasesCount,
      };
    })
  );

  return enrichedSuppliers;
}

async function getSupplierById(id) {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw new ApiError(404, "Supplier not found");

  const totals = await computeSupplierTotals(supplier._id);

  return {
    ...supplier.toObject(),
    gemstonePurchases: totals.gemstones,
    gemstoneTotal: totals.gemstoneTotal,
    metalPurchases: totals.metals,
    metalTotal: totals.metalTotal,
    componentPurchases: totals.components,
    componentTotal: totals.componentTotal,
    purchaseInvoices: totals.purchaseInvoices,
    totalPurchasesCount: totals.totalPurchasesCount,
    totalItemsPurchased: totals.totalItemsPurchased,
    unpaidInvoicesCount: totals.unpaidInvoicesCount,
    partiallyPaidInvoicesCount: totals.partiallyPaidInvoicesCount,
    totalPurchaseAmount: totals.totalPurchaseAmount,
    totalPaidAmount: totals.totalPaidAmount,
    outstandingBalance: totals.outstandingBalance,
    paymentStatus: totals.paymentStatus,
    paymentHistory: totals.paymentHistory,
    stockMovements: totals.stockMovements,
  };
}

async function createSupplier(data) {
  const existing = await Supplier.findOne({ companyName: data.companyName, isDeleted: false });
  if (existing) throw new ApiError(409, "A supplier with this company name already exists");
  return Supplier.create(data);
}

async function updateSupplier(id, data) {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw new ApiError(404, "Supplier not found");
  Object.assign(supplier, data);
  return supplier.save();
}

async function deleteSupplier(id, userId) {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw new ApiError(404, "Supplier not found");

  await Supplier.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  });

  return supplier;
}

async function recordSupplierPayment(supplierId, paymentData, userId, ipAddress = "") {
  const supplier = await Supplier.findOne({ _id: supplierId, isDeleted: false });
  if (!supplier) throw new ApiError(404, "Supplier not found");

  const amount = Number(paymentData.amount);
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  const paymentNo = await generateId(SupplierPayment, "paymentNo", "spay", 5);

  const payment = await SupplierPayment.create({
    paymentNo,
    supplierId,
    purchaseInvoiceId: paymentData.purchaseInvoiceId || null,
    amount,
    paymentMethod: paymentData.paymentMethod || "Bank Transfer",
    paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
    notes: paymentData.notes || "",
    attachments: paymentData.attachments || [],
    createdBy: userId,
  });

  // If payment is linked to a specific Purchase Invoice, update invoice balance as well
  if (paymentData.purchaseInvoiceId) {
    const inv = await PurchaseInvoice.findById(paymentData.purchaseInvoiceId);
    if (inv) {
      inv.paidAmount = (inv.paidAmount || 0) + amount;
      inv.outstandingBalance = Math.max(0, inv.finalTotal - inv.paidAmount);
      if (inv.outstandingBalance <= 0.01) {
        inv.paymentStatus = "Paid";
      } else if (inv.paidAmount > 0) {
        inv.paymentStatus = "Partially Paid";
      }
      await inv.save();
    }
  }

  await auditLogService.logAction({
    userId,
    entity: "SupplierPayment",
    entityId: payment._id,
    action: "create",
    newValue: payment.toObject(),
    ipAddress,
  });

  return getSupplierById(supplierId);
}

export default {
  computeSupplierTotals,
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  recordSupplierPayment,
};
