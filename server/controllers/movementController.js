import movementService from "../services/movementService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getMovements = catchAsync(async (req, res) => {
  const movements = await movementService.getMovements(req.query);
  sendSuccess(res, { message: "Inventory movements retrieved successfully", data: movements });
});

export default {
  getMovements,
};
