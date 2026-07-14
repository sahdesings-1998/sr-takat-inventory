import supplierService from "../services/supplierService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getSuppliers = catchAsync(async (req, res) => {
  const { search, status } = req.query;
  const suppliers = await supplierService.getAllSuppliers({ search, status });
  sendSuccess(res, { message: "Suppliers retrieved successfully", data: suppliers });
});

export const getSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const supplier = await supplierService.getSupplierById(id);
  sendSuccess(res, { message: "Supplier retrieved successfully", data: supplier });
});

export const createSupplier = catchAsync(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  sendSuccess(res, { statusCode: 201, message: "Supplier created successfully", data: supplier });
});

export const updateSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const supplier = await supplierService.updateSupplier(id, req.body);
  sendSuccess(res, { message: "Supplier updated successfully", data: supplier });
});

export const deleteSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  await supplierService.deleteSupplier(id, req.user._id);
  sendSuccess(res, { message: "Supplier deleted successfully" });
});

export default {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
