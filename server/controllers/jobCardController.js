import jobCardService from "../services/jobCardService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getJobCards = catchAsync(async (req, res) => {
  const jobs = await jobCardService.getAllJobCards(req.query);
  sendSuccess(res, { message: "Job cards retrieved successfully", data: jobs });
});

export const getJobCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const job = await jobCardService.getJobCardById(id);
  sendSuccess(res, { message: "Job card retrieved successfully", data: job });
});

export const createJobCard = catchAsync(async (req, res) => {
  const job = await jobCardService.createJobCard(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Job card created successfully", data: job });
});

export const updateJobCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const job = await jobCardService.updateJobCard(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Job card updated successfully", data: job });
});

export const updateJobCardStage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const job = await jobCardService.updateStage(id, req.body, req.user._id);
  sendSuccess(res, { message: "Job card stage transition updated", data: job });
});

export const issueMaterials = catchAsync(async (req, res) => {
  const { id } = req.params;
  const job = await jobCardService.issueMaterials(id, req.body, req.user._id);
  sendSuccess(res, { message: "Materials issued to job card", data: job });
});

export const returnMaterials = catchAsync(async (req, res) => {
  const { id } = req.params;
  const job = await jobCardService.returnMaterials(id, req.body, req.user._id);
  sendSuccess(res, { message: "Materials returned from job card", data: job });
});

export default {
  getJobCards,
  getJobCard,
  createJobCard,
  updateJobCard,
  updateJobCardStage,
  issueMaterials,
  returnMaterials,
};
