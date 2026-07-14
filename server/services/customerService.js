import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
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
  await getCustomerById(id);

  const sales = await Sale.find({ customerId: id }).sort({ createdAt: -1 });
  const memos = await Memo.find({ customerId: id }).sort({ createdAt: -1 });

  let totalBusiness = 0;
  let outstandingAmount = 0;

  sales.forEach((sale) => {
    totalBusiness += sale.total;
    if (sale.paymentStatus === "Unpaid") {
      outstandingAmount += sale.total;
    } else if (sale.paymentStatus === "Partially Paid") {
      // Assume 50% unpaid for partially paid status as fallback
      outstandingAmount += sale.total * 0.5;
    }
  });

  return {
    totalBusiness,
    outstandingAmount,
    sales,
    memos,
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
