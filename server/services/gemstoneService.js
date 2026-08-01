import Product from "../models/Product.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllGemstones({ status, location, supplierId, gemstone, search } = {}) {
  const query = { category: { $in: ["Gemstone", "Gemstones"] }, isDeleted: false };
  if (status) query.status = status;
  if (location) query.location = location;
  if (supplierId) query.supplierId = supplierId;
  if (gemstone) query.gemstone = gemstone;
  if (search) {
    query.$or = [
      { stoneId: { $regex: search, $options: "i" } },
      { productCode: { $regex: search, $options: "i" } },
      { stockNo: { $regex: search, $options: "i" } },
      { gemstone: { $regex: search, $options: "i" } },
      { gemstoneType: { $regex: search, $options: "i" } },
      { variety: { $regex: search, $options: "i" } },
      { origin: { $regex: search, $options: "i" } },
    ];
  }
  return Product.find(query)
    .sort({ createdAt: -1 })
    .populate("supplierId")
    .populate("certificateId");
}

async function getGemstoneById(id) {
  const stone = await Product.findOne({ _id: id, category: { $in: ["Gemstone", "Gemstones"] }, isDeleted: false })
    .populate("supplierId")
    .populate("certificateId");
  if (!stone) throw new ApiError(404, "Gemstone Product not found");
  return stone;
}

async function createGemstone(data, userId, ipAddress = "") {
  if (data.certificateId === "") {
    data.certificateId = null;
  }
  const stoneId = data.stoneId || (await generateId(Product, "stoneId", "gemstone", 5));
  const productCode = data.productCode || stoneId;
  const carat = Number(data.carat || data.totalCarat || 0);

  const costPerCarat = carat > 0 ? (data.purchasePrice || data.costPrice || 0) / carat : 0;

  const gemstoneProduct = await Product.create({
    ...data,
    category: "Gemstone",
    stoneId,
    productCode,
    name: data.name || `${data.gemstone || data.gemstoneType || "Gemstone"} (${carat} ct)`,
    carat,
    totalCarat: carat,
    originalCarat: data.originalCarat ?? carat,
    costPerCarat,
    quantity: data.quantity ?? 1,
    availableQuantity: data.quantity ?? 1,
    status: data.status || "Available",
  });

  await movementService.logMovement({
    inventoryType: "Product",
    inventoryId: gemstoneProduct._id,
    action: "Purchase",
    toLocation: gemstoneProduct.location || "Vault",
    quantity: gemstoneProduct.quantity || 1,
    weight: gemstoneProduct.carat,
    referenceType: "Supplier",
    referenceId: gemstoneProduct.supplierId,
    userId,
    remarks: "Initial gemstone product purchase entry",
  });

  await auditLogService.logAction({
    userId,
    entity: "Product",
    entityId: gemstoneProduct._id,
    action: "create",
    newValue: gemstoneProduct.toObject(),
    ipAddress,
  });

  return getGemstoneById(gemstoneProduct._id);
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
      inventoryType: "Product",
      inventoryId: gemstone._id,
      action: "Location Transfer",
      fromLocation: prevLocation,
      toLocation: gemstone.location,
      quantity: gemstone.quantity,
      weight: gemstone.carat,
      userId,
      remarks: "Location manually updated",
    });
  }

  await auditLogService.logAction({
    userId,
    entity: "Product",
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
    inventoryType: "Product",
    inventoryId: gemstone._id,
    action: "Adjustment",
    userId,
    remarks: remarks || `Status adjusted from ${prevStatus} to ${status}`,
  });

  await auditLogService.logAction({
    userId,
    entity: "Product",
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

  await Product.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  });

  await auditLogService.logAction({
    userId,
    entity: "Product",
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
