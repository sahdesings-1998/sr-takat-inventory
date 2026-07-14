import InventoryMovement from "../models/InventoryMovement.js";

async function logMovement({
  inventoryType,
  inventoryId,
  action,
  fromLocation = "",
  toLocation = "",
  quantity = 1,
  weight = 0,
  referenceType = "None",
  referenceId = null,
  userId,
  remarks = "",
}) {
  return InventoryMovement.create({
    inventoryType,
    inventoryId,
    action,
    fromLocation,
    toLocation,
    quantity,
    weight,
    referenceType,
    referenceId,
    userId,
    remarks,
    movementDate: new Date(),
  });
}

async function getMovements(filters = {}) {
  const query = {};
  if (filters.inventoryType) query.inventoryType = filters.inventoryType;
  if (filters.inventoryId) query.inventoryId = filters.inventoryId;
  return InventoryMovement.find(query).sort({ movementDate: -1 }).populate("userId");
}

export default {
  logMovement,
  getMovements,
};
