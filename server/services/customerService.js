import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Payment from "../models/Payment.js";
import Memo from "../models/Memo.js";
import ApiError from "../utils/ApiError.js";

async function getAllCustomers({ search, status } = {}) {
  const query = { isDeleted: false };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
    ];
  }
  return Customer.find(query).sort({ fullName: 1 });
}

async function getCustomerById(id) {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw new ApiError(404, "Customer not found");
  return customer;
}

async function createCustomer(data) {
  const existing = await Customer.findOne({ fullName: data.fullName, phone: data.phone, isDeleted: false });
  if (existing) throw new ApiError(409, "A customer with this name and phone number already exists");
  return Customer.create(data);
}

async function updateCustomer(id, data) {
  const customer = await getCustomerById(id);
  Object.assign(customer, data);
  return customer.save();
}

async function deleteCustomer(id, userId) {
  const customer = await getCustomerById(id);

  // Soft delete — mark as deleted, do not remove from DB
  await Customer.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  });

  return customer;
}

async function getCustomerHistory(id) {
  const customer = await getCustomerById(id);

  const sales = await Sale.find({ customerId: id }).sort({ createdAt: -1 });
  const memos = await Memo.find({ customerId: id }).sort({ createdAt: -1 });

  const saleIds = sales.map((s) => s._id);
  const saleItems = await SaleItem.find({ saleId: { $in: saleIds } }).populate("inventoryId");

  let totalPurchaseAmount = 0;
  let totalAmountPaid = 0;
  let totalOutstandingBalance = 0;

  sales.forEach((sale) => {
    totalPurchaseAmount += Number(sale.total || 0);
    const paid = Number(sale.amountPaid ?? (sale.paymentStatus === "Paid" ? sale.total : 0));
    const balance = Number(sale.balanceDue ?? Math.max(0, sale.total - paid));
    totalAmountPaid += paid;
    totalOutstandingBalance += balance;
  });

  const purchasedProducts = [];
  const purchasedGemstones = [];

  saleItems.forEach((item) => {
    const parentSale = sales.find((s) => s._id.toString() === item.saleId.toString());
    const invoiceNo = parentSale ? parentSale.invoiceNo : "N/A";
    const date = parentSale ? parentSale.createdAt : item.createdAt;

    if (item.inventoryType === "Product" && item.inventoryId) {
      purchasedProducts.push({
        _id: item._id,
        productId: item.inventoryId._id,
        code: item.inventoryId.productCode || item.inventoryId.sku,
        name: item.inventoryId.name,
        category: item.inventoryId.category,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        invoiceNo,
        date,
      });
    } else if (item.inventoryType === "Gemstone" && item.inventoryId) {
      purchasedGemstones.push({
        _id: item._id,
        stoneId: item.inventoryId.stoneId,
        gemstone: item.inventoryId.gemstone,
        carat: item.inventoryId.carat,
        cut: item.inventoryId.cut,
        color: item.inventoryId.color,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        invoiceNo,
        date,
      });
    }
  });

  const paymentHistory = await Payment.find({ customerId: id }).sort({ paymentDate: -1, createdAt: -1 }).populate("createdBy");

  const outstandingSales = sales.filter((s) => Number(s.balanceDue || 0) > 0.001);
  const partiallyPaidCount = sales.filter((s) => s.paymentStatus === "Partially Paid").length;
  const unpaidCount = sales.filter((s) => s.paymentStatus === "Unpaid").length;

  return {
    customer,
    totalBusiness: totalPurchaseAmount,
    totalPurchaseAmount,
    totalAmountPaid,
    totalOutstandingBalance,
    outstandingAmount: totalOutstandingBalance,
    partiallyPaidCount,
    unpaidCount,
    sales,
    memos,
    saleItems,
    purchasedProducts,
    purchasedGemstones,
    outstandingSales,
    paymentHistory,
  };
}

export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
};
