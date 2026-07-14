import gemstoneService from "../services/gemstoneService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getGemstones = catchAsync(async (req, res) => {
  const stones = await gemstoneService.getAllGemstones(req.query);
  sendSuccess(res, { message: "Gemstones retrieved successfully", data: stones });
});

export const getGemstone = catchAsync(async (req, res) => {
  const { id } = req.params;
  const stone = await gemstoneService.getGemstoneById(id);
  sendSuccess(res, { message: "Gemstone retrieved successfully", data: stone });
});

export const createGemstone = catchAsync(async (req, res) => {
  const stone = await gemstoneService.createGemstone(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Gemstone registered successfully", data: stone });
});

export const updateGemstone = catchAsync(async (req, res) => {
  const { id } = req.params;
  const stone = await gemstoneService.updateGemstone(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Gemstone updated successfully", data: stone });
});

export const updateGemstoneStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  const stone = await gemstoneService.updateGemstoneStatus(
    id,
    status,
    req.user._id,
    remarks,
    req.ip
  );
  sendSuccess(res, { message: "Gemstone status updated successfully", data: stone });
});

export const deleteGemstone = catchAsync(async (req, res) => {
  const { id } = req.params;
  await gemstoneService.deleteGemstone(id, req.user._id, req.ip);
  sendSuccess(res, { message: "Gemstone deleted successfully" });
});

export default {
  getGemstones,
  getGemstone,
  createGemstone,
  updateGemstone,
  updateGemstoneStatus,
  deleteGemstone,
};
