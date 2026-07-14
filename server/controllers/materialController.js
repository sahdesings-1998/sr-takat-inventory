import materialService from "../services/materialService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getMaterials = catchAsync(async (req, res) => {
  const materials = await materialService.getAllMaterials(req.query);
  sendSuccess(res, { message: "Materials retrieved successfully", data: materials });
});

export const getMaterial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const material = await materialService.getMaterialById(id);
  sendSuccess(res, { message: "Material retrieved successfully", data: material });
});

export const createMaterial = catchAsync(async (req, res) => {
  const material = await materialService.createMaterial(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Material registered successfully", data: material });
});

export const updateMaterial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const material = await materialService.updateMaterial(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Material updated successfully", data: material });
});

export const adjustMaterialStock = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { quantityChange, remarks } = req.body;
  const material = await materialService.adjustMaterialStock(
    id,
    Number(quantityChange),
    req.user._id,
    remarks,
    req.ip
  );
  sendSuccess(res, { message: "Material stock adjusted successfully", data: material });
});

export default {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  adjustMaterialStock,
};
