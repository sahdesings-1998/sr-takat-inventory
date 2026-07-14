import GemstoneLot from "../models/GemstoneLot.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllLots({ gemstone, status } = {}) {
  const query = {};
  if (gemstone) query.gemstone = gemstone;
  if (status) query.status = status;
  return GemstoneLot.find(query).sort({ createdAt: -1 }).populate("supplierId");
}

async function getLotById(id) {
  const lot = await GemstoneLot.findById(id).populate("supplierId");
  if (!lot) throw new ApiError(404, "Gemstone lot not found");
  return lot;
}

async function createLot(data, userId, ipAddress = "") {
  const lotId = await generateId(GemstoneLot, "lotId", "lot", 5);

  const lot = await GemstoneLot.create({
    ...data,
    lotId,
    remainingCarat: data.totalCarat,
  });

  await movementService.logMovement({
    inventoryType: "GemstoneLot",
    inventoryId: lot._id,
    action: "Purchase",
    toLocation: lot.location,
    quantity: lot.estimatedPieces,
    weight: lot.totalCarat,
    referenceType: "Supplier",
    referenceId: lot.supplierId,
    userId,
    remarks: "Initial lot stock entry",
  });

  await auditLogService.logAction({
    userId,
    entity: "GemstoneLot",
    entityId: lot._id,
    action: "create",
    newValue: lot.toObject(),
    ipAddress,
  });

  return getLotById(lot._id);
}

async function updateLot(id, data, userId, ipAddress = "") {
  const lot = await getLotById(id);
  const oldVal = lot.toObject();

  const prevLocation = lot.location;

  Object.assign(lot, data);
  await lot.save();

  if (data.location && data.location !== prevLocation) {
    await movementService.logMovement({
      inventoryType: "GemstoneLot",
      inventoryId: lot._id,
      action: "Location Transfer",
      fromLocation: prevLocation,
      toLocation: lot.location,
      quantity: lot.estimatedPieces,
      weight: lot.remainingCarat,
      userId,
      remarks: "Lot location manually updated",
    });
  }

  await auditLogService.logAction({
    userId,
    entity: "GemstoneLot",
    entityId: lot._id,
    action: "update",
    oldValue: oldVal,
    newValue: lot.toObject(),
    ipAddress,
  });

  return getLotById(lot._id);
}

async function issueFromLot(id, carat, userId, ipAddress = "") {
  const lot = await getLotById(id);
  const oldVal = lot.toObject();

  if (lot.remainingCarat < carat) {
    throw new ApiError(400, `Insufficient weight in lot. Only ${lot.remainingCarat} carats remaining.`);
  }

  lot.remainingCarat -= carat;
  if (lot.remainingCarat === 0) {
    lot.status = "Depleted";
  } else {
    lot.status = "Active";
  }
  await lot.save();

  await movementService.logMovement({
    inventoryType: "GemstoneLot",
    inventoryId: lot._id,
    action: "Issue to Production",
    quantity: 0,
    weight: carat,
    userId,
    remarks: `Issued ${carat} carats to production`,
  });

  await auditLogService.logAction({
    userId,
    entity: "GemstoneLot",
    entityId: lot._id,
    action: "update",
    oldValue: oldVal,
    newValue: lot.toObject(),
    ipAddress,
  });

  return getLotById(lot._id);
}

export default {
  getAllLots,
  getLotById,
  createLot,
  updateLot,
  issueFromLot,
};
