import costingService from "../services/costingService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getCosting = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const costing = await costingService.getCosting(productId);
  sendSuccess(res, { message: "Costing details retrieved successfully", data: costing });
});

export const saveCosting = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const costing = await costingService.saveCosting(productId, req.body, req.user._id);
  sendSuccess(res, { message: "Costing saved successfully", data: costing });
});

export const approveCosting = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await costingService.approveCosting(productId, req.user._id);
  sendSuccess(res, { message: "Costing approved successfully", data: result });
});

export default {
  getCosting,
  saveCosting,
  approveCosting,
};
