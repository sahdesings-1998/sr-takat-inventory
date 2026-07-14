import lotService from "../services/lotService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getLots = catchAsync(async (req, res) => {
  const lots = await lotService.getAllLots(req.query);
  sendSuccess(res, { message: "Gemstone lots retrieved successfully", data: lots });
});

export const getLot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const lot = await lotService.getLotById(id);
  sendSuccess(res, { message: "Gemstone lot retrieved successfully", data: lot });
});

export const createLot = catchAsync(async (req, res) => {
  const lot = await lotService.createLot(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Gemstone lot registered successfully", data: lot });
});

export const updateLot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const lot = await lotService.updateLot(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Gemstone lot updated successfully", data: lot });
});

export const issueFromLot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { carat } = req.body;
  const lot = await lotService.issueFromLot(id, carat, req.user._id, req.ip);
  sendSuccess(res, { message: "Carat weight successfully issued from lot", data: lot });
});

export default {
  getLots,
  getLot,
  createLot,
  updateLot,
  issueFromLot,
};
