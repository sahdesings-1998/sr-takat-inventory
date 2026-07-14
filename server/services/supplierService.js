import Supplier from "../models/Supplier.js";
import ApiError from "../utils/ApiError.js";

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
  return Supplier.find(query).sort({ companyName: 1 });
}

async function getSupplierById(id) {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw new ApiError(404, "Supplier not found");
  return supplier;
}

async function createSupplier(data) {
  const existing = await Supplier.findOne({ companyName: data.companyName, isDeleted: false });
  if (existing) throw new ApiError(409, "A supplier with this company name already exists");
  return Supplier.create(data);
}

async function updateSupplier(id, data) {
  const supplier = await getSupplierById(id);
  Object.assign(supplier, data);
  return supplier.save();
}

async function deleteSupplier(id, userId) {
  const supplier = await getSupplierById(id);

  // Soft delete — mark as deleted, do not remove from DB
  await Supplier.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  });

  return supplier;
}

export default {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
