import Material from "../models/Material.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllMaterials({ category, status, search } = {}) {
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { materialCode: { $regex: search, $options: "i" } },
      { materialName: { $regex: search, $options: "i" } },
    ];
  }
  return Material.find(query).sort({ materialName: 1 });
}

async function getMaterialById(id) {
  const material = await Material.findById(id);
  if (!material) throw new ApiError(404, "Material not found");
  return material;
}

async function createMaterial(data, userId, ipAddress = "") {
  const existing = await Material.findOne({ materialCode: data.materialCode });
  if (existing) throw new ApiError(409, "A material with this code already exists");

  const material = await Material.create(data);

  await movementService.logMovement({
    inventoryType: "Material",
    inventoryId: material._id,
    action: "Purchase",
    toLocation: material.location,
    quantity: material.quantity,
    weight: 0,
    userId,
    remarks: "Initial material stock entry",
  });

  await auditLogService.logAction({
    userId,
    entity: "Material",
    entityId: material._id,
    action: "create",
    newValue: material.toObject(),
    ipAddress,
  });

  return getMaterialById(material._id);
}

async function updateMaterial(id, data, userId, ipAddress = "") {
  const material = await getMaterialById(id);
  const oldVal = material.toObject();

  Object.assign(material, data);
  await material.save();

  await auditLogService.logAction({
    userId,
    entity: "Material",
    entityId: material._id,
    action: "update",
    oldValue: oldVal,
    newValue: material.toObject(),
    ipAddress,
  });

  return getMaterialById(material._id);
}

async function adjustMaterialStock(id, quantityChange, userId, remarks = "", ipAddress = "") {
  const material = await getMaterialById(id);
  const oldVal = material.toObject();

  if (material.quantity + quantityChange < 0) {
    throw new ApiError(400, `Insufficient stock. Current: ${material.quantity}, Adjustment: ${quantityChange}`);
  }

  material.quantity += quantityChange;
  await material.save();

  await movementService.logMovement({
    inventoryType: "Material",
    inventoryId: material._id,
    action: "Adjustment",
    quantity: quantityChange,
    weight: 0,
    userId,
    remarks: remarks || `Manual stock adjustment: ${quantityChange}`,
  });

  await auditLogService.logAction({
    userId,
    entity: "Material",
    entityId: material._id,
    action: "update",
    oldValue: oldVal,
    newValue: material.toObject(),
    ipAddress,
  });

  return getMaterialById(material._id);
}

export default {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  adjustMaterialStock,
};
