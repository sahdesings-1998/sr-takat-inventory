import lookupService from "../services/lookupService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getLookups = catchAsync(async (req, res) => {
  const { type } = req.query;
  const lookups = await lookupService.getLookups(type);
  sendSuccess(res, { message: "Lookups retrieved successfully", data: lookups });
});

export const createLookup = catchAsync(async (req, res) => {
  const { type, value, label } = req.body;
  const lookup = await lookupService.createLookup({ type, value, label });
  sendSuccess(res, { message: "Lookup created successfully", data: lookup }, 201);
});

export const deleteLookup = catchAsync(async (req, res) => {
  const { id } = req.params;
  await lookupService.deleteLookup(id);
  sendSuccess(res, { message: "Lookup deleted successfully", data: null });
});

export default {
  getLookups,
  createLookup,
  deleteLookup,
};
