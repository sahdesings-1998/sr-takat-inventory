import Gemstone from "../models/Gemstone.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllGemstones({ status, location, supplierId, gemstone, search } = {}) {
  const query = { isDeleted: false };
  if (status) query.status = status;
  if (location) query.location = location;
  if (supplierId) query.supplierId = supplierId;
  if (gemstone) query.gemstone = gemstone;
  if (search) {
    query.$or = [
      { stoneId: { $regex: search, $options: "i" } },
      { stockNo: { $regex: search, $options: "i" } },
      { variety: { $regex: search, $options: "i" } },
      { origin: { $regex: search, $options: "i" } },
    ];
  }
  return Gemstone.find(query)
    .sort({ createdAt: -1 })
    .populate("supplierId")
    .populate("certificateId")
    .populate("createdBy");
}

async function getGemstoneById(id) {
  const stone = await Gemstone.findOne({ _id: id, isDeleted: false })
    .populate("supplierId")
    .populate("certificateId")
    .populate("createdBy");
  if (!stone) throw new ApiError(404, "Gemstone not found");
  return stone;
}

async function createGemstone(data, userId, ipAddress = "") {
  if (data.certificateId === "") {
    data.certificateId = null;
  }
  const stoneId = await generateId(Gemstone, "stoneId", "gemstone", 5);

  const costPerCarat = data.carat > 0 ? data.purchasePrice / data.carat : 0;

  const gemstone = await Gemstone.create({
    ...data,
    stoneId,
    costPerCarat,
    createdBy: userId,
  });

  await movementService.logMovement({
    inventoryType: "Gemstone",
    inventoryId: gemstone._id,
    action: "Purchase",
    toLocation: gemstone.location,
    quantity: gemstone.pieces,
    weight: gemstone.carat,
    referenceType: "Supplier",
    referenceId: gemstone.supplierId,
    userId,
    remarks: "Initial purchase stock entry",
  });

  await auditLogService.logAction({
    userId,
    entity: "Gemstone",
    entityId: gemstone._id,
    action: "create",
    newValue: gemstone.toObject(),
    ipAddress,
  });

  return getGemstoneById(gemstone._id);
}

async function updateGemstone(id, data, userId, ipAddress = "") {
  if (data.certificateId === "") {
    data.certificateId = null;
  }
  const gemstone = await getGemstoneById(id);
  const oldVal = gemstone.toObject();

  const prevLocation = gemstone.location;

  if (data.purchasePrice !== undefined || data.carat !== undefined) {
    const price = data.purchasePrice !== undefined ? data.purchasePrice : gemstone.purchasePrice;
    const carat = data.carat !== undefined ? data.carat : gemstone.carat;
    data.costPerCarat = carat > 0 ? price / carat : 0;
  }

  Object.assign(gemstone, data);
  await gemstone.save();

  if (data.location && data.location !== prevLocation) {
    await movementService.logMovement({
      inventoryType: "Gemstone",
      inventoryId: gemstone._id,
      action: "Location Transfer",
      fromLocation: prevLocation,
      toLocation: gemstone.location,
      quantity: gemstone.pieces,
      weight: gemstone.carat,
      userId,
      remarks: "Location manually updated",
    });
  }

  await auditLogService.logAction({
    userId,
    entity: "Gemstone",
    entityId: gemstone._id,
    action: "update",
    oldValue: oldVal,
    newValue: gemstone.toObject(),
    ipAddress,
  });

  return getGemstoneById(gemstone._id);
}

async function updateGemstoneStatus(id, status, userId, remarks = "", ipAddress = "") {
  const gemstone = await getGemstoneById(id);
  const oldVal = gemstone.toObject();
  const prevStatus = gemstone.status;

  gemstone.status = status;
  await gemstone.save();

  await movementService.logMovement({
    inventoryType: "Gemstone",
    inventoryId: gemstone._id,
    action: "Adjustment",
    userId,
    remarks: remarks || `Status adjusted from ${prevStatus} to ${status}`,
  });

  await auditLogService.logAction({
    userId,
    entity: "Gemstone",
    entityId: gemstone._id,
    action: "update",
    oldValue: oldVal,
    newValue: gemstone.toObject(),
    ipAddress,
  });

  return getGemstoneById(gemstone._id);
}

async function deleteGemstone(id, userId, ipAddress = "") {
  const gemstone = await getGemstoneById(id);
  const oldVal = gemstone.toObject();

  // Soft delete — mark as deleted, do not remove from DB
  await Gemstone.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  });

  await auditLogService.logAction({
    userId,
    entity: "Gemstone",
    entityId: gemstone._id,
    action: "delete",
    oldValue: oldVal,
    ipAddress,
  });

  return gemstone;
}

export default {
  getAllGemstones,
  getGemstoneById,
  createGemstone,
  updateGemstone,
  updateGemstoneStatus,
  deleteGemstone,
};
