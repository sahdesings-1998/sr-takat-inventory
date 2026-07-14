import customerService from "../services/customerService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getCustomers = catchAsync(async (req, res) => {
  const { search, status } = req.query;
  const customers = await customerService.getAllCustomers({ search, status });
  sendSuccess(res, { message: "Customers retrieved successfully", data: customers });
});

export const getCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.getCustomerById(id);
  sendSuccess(res, { message: "Customer retrieved successfully", data: customer });
});

export const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  sendSuccess(res, { statusCode: 201, message: "Customer created successfully", data: customer });
});

export const updateCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.updateCustomer(id, req.body);
  sendSuccess(res, { message: "Customer updated successfully", data: customer });
});

export const deleteCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  await customerService.deleteCustomer(id, req.user._id);
  sendSuccess(res, { message: "Customer deleted successfully" });
});

export const getCustomerHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const history = await customerService.getCustomerHistory(id);
  sendSuccess(res, { message: "Customer transaction history retrieved", data: history });
});

export default {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
};
