import memoService from "../services/memoService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getMemos = catchAsync(async (req, res) => {
  const result = await memoService.getAllMemos(req.query);
  sendSuccess(res, { message: "Memos retrieved successfully", data: result });
});

export const getMemo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const memo = await memoService.getMemoById(id);
  sendSuccess(res, { message: "Memo retrieved successfully", data: memo });
});

export const createMemo = catchAsync(async (req, res) => {
  const memo = await memoService.createMemo(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Memo created successfully", data: memo });
});

export const returnMemoItem = catchAsync(async (req, res) => {
  const { id, itemId } = req.params;
  const memo = await memoService.returnMemoItem(id, itemId, req.user._id, req.ip);
  sendSuccess(res, { message: "Memo item returned successfully", data: memo });
});

export const convertMemoToSale = catchAsync(async (req, res) => {
  const { id, itemId } = req.params;
  const { paymentMethod } = req.body;
  const memo = await memoService.convertMemoToSale(id, itemId, paymentMethod, req.user._id, req.ip);
  sendSuccess(res, { message: "Memo item converted to sold successfully", data: memo });
});

export const extendMemo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { expectedReturn, reason } = req.body;
  const memo = await memoService.extendMemo(id, expectedReturn, reason, req.user._id, req.ip);
  sendSuccess(res, { message: "Memo return date extended successfully", data: memo });
});

export default {
  getMemos,
  getMemo,
  createMemo,
  returnMemoItem,
  convertMemoToSale,
  extendMemo,
};
