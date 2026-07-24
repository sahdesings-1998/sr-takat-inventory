import mongoose from "mongoose";
import Product from "../models/Product.js";
import ProductComponent from "../models/ProductComponent.js";
import Gemstone from "../models/Gemstone.js";
import GemstoneLot from "../models/GemstoneLot.js";
import Settings from "../models/Settings.js";
import SaleItem from "../models/SaleItem.js";
import generateId from "../utils/generateId.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

function buildProfitMetrics(data, productDoc = null) {
  const settings = Settings.getSettings ? Settings.getSettings() : Promise.resolve({ charityPercentage: 2.0 });
  return settings.then?.(async (settingsData) => {
    const charityPct = settingsData.charityPercentage || 2.0;
    const selling = Number(data.sellingPrice ?? productDoc?.sellingPrice ?? 0);
    const cost = Number(data.costPrice ?? productDoc?.costPrice ?? 0);
    const grossProfit = Math.max(0, selling - cost);
    const charityAmount = grossProfit * (charityPct / 100);
    const netProfit = Math.max(0, grossProfit - charityAmount);
    return { grossProfit, charityAmount, netProfit };
  });
}

async function getAllProducts({ category, status, subCategory, brand, search } = {}) {
  const query = { isDeleted: { $ne: true } };
  if (category) query.category = category;
  if (status) query.status = status;
  if (subCategory) query.subCategory = subCategory;
  if (brand) query.brand = brand;
  if (search) {
    query.$or = [
      { productCode: { $regex: search, $options: "i" } },
      { stockNo: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { subCategory: { $regex: search, $options: "i" } },
      { material: { $regex: search, $options: "i" } },
    ];
  }
  return Product.find(query).sort({ createdAt: -1 });
}

async function getProductById(id) {
  const product = await Product.findOne({ _id: id, isDeleted: { $ne: true } }).populate("certificateIds");
  if (!product) throw new ApiError(404, "Product not found");

  const components = await ProductComponent.find({ productId: id }).populate("sourceId");

  const salesItems = await SaleItem.find({ inventoryType: "Product", inventoryId: id })
    .populate({
      path: "saleId",
      populate: { path: "customerId", select: "name email phone" },
    })
    .sort({ createdAt: -1 });

  const salesHistory = salesItems.map((item) => ({
    _id: item._id,
    saleId: item.saleId?._id,
    invoiceNo: item.saleId?.invoiceNo || "N/A",
    createdAt: item.saleId?.createdAt || item.createdAt,
    customerName: item.saleId?.customerId?.name || "Direct Customer",
    quantity: item.quantity || 1,
    sellingPrice: item.sellingPrice || 0,
    totalPrice: (item.sellingPrice || 0) * (item.quantity || 1),
    paymentStatus: item.saleId?.paymentStatus || "Paid",
  }));

  return {
    product,
    components,
    salesHistory,
  };
}

async function generateUniqueBarcode(stockNoSeed = "") {
  const cleanStock = (stockNoSeed || "").replace(/\D/g, "");
  let candidate = cleanStock ? `890${cleanStock.padStart(9, "0")}` : `890${Math.floor(100000000 + Math.random() * 900000000)}`;

  let exists = await Product.findOne({ barcode: candidate, isDeleted: { $ne: true } });
  let attempts = 0;
  while (exists && attempts < 10) {
    candidate = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    exists = await Product.findOne({ barcode: candidate, isDeleted: { $ne: true } });
    attempts++;
  }
  return candidate;
}

async function generateUniqueQrCode(productCodeSeed = "", stockNoSeed = "") {
  let candidate = `QR-STK-${stockNoSeed || productCodeSeed || Math.floor(10000 + Math.random() * 90000)}`;
  let exists = await Product.findOne({ qrCode: candidate, isDeleted: { $ne: true } });
  let attempts = 0;
  while (exists && attempts < 10) {
    candidate = `QR-STK-${Math.floor(100000 + Math.random() * 900000)}`;
    exists = await Product.findOne({ qrCode: candidate, isDeleted: { $ne: true } });
    attempts++;
  }
  return candidate;
}

async function lookupProductByCode(codeRaw) {
  if (!codeRaw || typeof codeRaw !== "string" || !codeRaw.trim()) {
    throw new ApiError(400, "Scanned code cannot be empty");
  }

  const code = codeRaw.trim();

  // Construct query to match barcode, qrCode, productCode, stockNo, sku, or _id
  const query = {
    $or: [
      { qrCode: code },
      { barcode: code },
      { productCode: code },
      { stockNo: code },
      { sku: code },
    ],
  };

  if (mongoose.Types.ObjectId.isValid(code)) {
    query.$or.push({ _id: code });
  }

  // Find matching product record (including soft-deleted)
  const productDoc = await Product.findOne(query);

  if (!productDoc) {
    throw new ApiError(404, `No product found matching code: "${code}"`);
  }

  if (productDoc.isDeleted) {
    throw new ApiError(
      410,
      `Product "${productDoc.name || productDoc.stockNo || "Item"}" has been deleted/archived and is no longer available.`
    );
  }

  return await getProductById(productDoc._id);
}

async function createProduct(data, userId, ipAddress = "") {
  const productCode = await generateId(Product, "productCode", "product", 5);

  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage || 2.0;
  const selling = Number(data.sellingPrice || 0);
  const cost = Number(data.costPrice || 0);
  const grossProfit = Math.max(0, selling - cost);
  const charityAmount = grossProfit * (charityPct / 100);
  const netProfit = Math.max(0, grossProfit - charityAmount);

  const qty = Number(data.quantity ?? data.stockQuantity ?? 1);
  const origQty = Number(data.originalQuantity ?? qty);
  const soldQty = Number(data.soldQuantity || 0);
  const remQty = Math.max(0, origQty - soldQty);

  // Auto-generate or validate unique barcode & qrCode
  let barcode = (data.barcode || "").trim();
  if (!barcode) {
    barcode = await generateUniqueBarcode(data.stockNo);
  } else {
    const existing = await Product.findOne({ barcode, isDeleted: { $ne: true } });
    if (existing) {
      throw new ApiError(400, `Barcode "${barcode}" is already assigned to product "${existing.name || existing.stockNo}".`);
    }
  }

  let qrCode = (data.qrCode || "").trim();
  if (!qrCode) {
    qrCode = await generateUniqueQrCode(productCode, data.stockNo);
  } else {
    const existing = await Product.findOne({ qrCode, isDeleted: { $ne: true } });
    if (existing) {
      throw new ApiError(400, `QR Code "${qrCode}" is already assigned to product "${existing.name || existing.stockNo}".`);
    }
  }

  const product = await Product.create({
    ...data,
    productCode,
    barcode,
    qrCode,
    originalQuantity: origQty,
    soldQuantity: soldQty,
    quantity: remQty,
    stockQuantity: remQty,
    availableQuantity: remQty,
    grossProfit,
    charityAmount,
    netProfit,
    tags: Array.isArray(data.tags) ? data.tags : [],
    components: Array.isArray(data.components) ? data.components : [],
    history: [
      {
        date: new Date(),
        action: "Product created",
        user: userId?.toString() || "System",
      },
    ],
  });

  await auditLogService.logAction({
    userId,
    entity: "Product",
    entityId: product._id,
    action: "create",
    newValue: product.toObject(),
    ipAddress,
  });

  return product;
}

async function updateProduct(id, data, userId, ipAddress = "") {
  const { product: productDoc } = await getProductById(id);
  const oldVal = productDoc.toObject();

  if (data.barcode !== undefined) {
    const barcodeTrimmed = (data.barcode || "").trim();
    if (barcodeTrimmed && barcodeTrimmed !== productDoc.barcode) {
      const existing = await Product.findOne({ barcode: barcodeTrimmed, _id: { $ne: id }, isDeleted: { $ne: true } });
      if (existing) {
        throw new ApiError(400, `Barcode "${barcodeTrimmed}" is already assigned to product "${existing.name || existing.stockNo}".`);
      }
    }
    data.barcode = barcodeTrimmed;
  }

  if (data.qrCode !== undefined) {
    const qrCodeTrimmed = (data.qrCode || "").trim();
    if (qrCodeTrimmed && qrCodeTrimmed !== productDoc.qrCode) {
      const existing = await Product.findOne({ qrCode: qrCodeTrimmed, _id: { $ne: id }, isDeleted: { $ne: true } });
      if (existing) {
        throw new ApiError(400, `QR Code "${qrCodeTrimmed}" is already assigned to product "${existing.name || existing.stockNo}".`);
      }
    }
    data.qrCode = qrCodeTrimmed;
  }

  if (data.sellingPrice !== undefined || data.costPrice !== undefined) {
    const settings = await Settings.getSettings();
    const charityPct = settings.charityPercentage || 2.0;

    const selling = Number(
      data.sellingPrice !== undefined ? data.sellingPrice : productDoc.sellingPrice
    );
    const cost = Number(data.costPrice !== undefined ? data.costPrice : productDoc.costPrice);
    const grossProfit = Math.max(0, selling - cost);
    const charityAmount = grossProfit * (charityPct / 100);
    const netProfit = Math.max(0, grossProfit - charityAmount);

    data.grossProfit = grossProfit;
    data.charityAmount = charityAmount;
    data.netProfit = netProfit;
  }

  if (data.tags === undefined) {
    data.tags = productDoc.tags || [];
  }
  if (data.components === undefined) {
    data.components = productDoc.components || [];
  }
  if (Array.isArray(data.tags)) {
    data.tags = data.tags.filter(Boolean);
  }

  const historyEntry = {
    date: new Date(),
    action: "Product updated",
    user: userId?.toString() || "System",
  };
  data.history = [...(productDoc.history || []), historyEntry];

  Object.assign(productDoc, data);
  await productDoc.save();

  await auditLogService.logAction({
    userId,
    entity: "Product",
    entityId: productDoc._id,
    action: "update",
    oldValue: oldVal,
    newValue: productDoc.toObject(),
    ipAddress,
  });

  return productDoc;
}

async function addProductComponent(productId, componentData, userId) {
  if (componentData.sourceType === "Gemstone") {
    const stone = await Gemstone.findById(componentData.sourceId);
    if (!stone) throw new ApiError(404, "Gemstone not found");
    if (stone.status !== "In Stock") {
      throw new ApiError(400, `Gemstone ${stone.stoneId} is not available (Status: ${stone.status})`);
    }
    stone.status = "In Production";
    await stone.save();
  } else if (componentData.sourceType === "GemstoneLot") {
    const lot = await GemstoneLot.findById(componentData.sourceId);
    if (!lot) throw new ApiError(404, "Gemstone lot not found");
    const weight = Number(componentData.weight || 0);
    if (lot.remainingCarat < weight) {
      throw new ApiError(400, `Insufficient weight in lot. Only ${lot.remainingCarat} ct remaining.`);
    }
    lot.remainingCarat -= weight;
    if (lot.remainingCarat <= 0) {
      lot.status = "Depleted";
    } else {
      lot.status = "Active";
    }
    await lot.save();
  }

  const component = await ProductComponent.create({
    productId,
    ...componentData,
  });
  return component;
}

async function deleteProductComponent(productId, componentId, userId) {
  const component = await ProductComponent.findOne({ _id: componentId, productId });
  if (!component) throw new ApiError(404, "Component not found");

  if (component.sourceType === "Gemstone") {
    await Gemstone.findByIdAndUpdate(component.sourceId, { status: "In Stock" });
  } else if (component.sourceType === "GemstoneLot") {
    const lot = await GemstoneLot.findById(component.sourceId);
    if (lot) {
      lot.remainingCarat += Number(component.weight || 0);
      if (lot.status === "Depleted") {
        lot.status = "Active";
      }
      await lot.save();
    }
  }

  await ProductComponent.findByIdAndDelete(componentId);
  return { success: true };
}

async function softDeleteProduct(id, userId, ipAddress = "") {
  const product = await Product.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!product) throw new ApiError(404, "Product not found or already deleted");

  const oldVal = product.toObject();

  product.isDeleted = true;
  product.deletedAt = new Date();
  product.deletedBy = userId || null;
  product.history = [
    ...(product.history || []),
    {
      date: new Date(),
      action: "Product soft-deleted",
      user: userId?.toString() || "System",
    },
  ];

  await product.save();

  await auditLogService.logAction({
    userId,
    entity: "Product",
    entityId: product._id,
    action: "delete",
    oldValue: oldVal,
    newValue: product.toObject(),
    ipAddress,
  });

  return product;
}

export default {
  getAllProducts,
  getProductById,
  lookupProductByCode,
  createProduct,
  updateProduct,
  softDeleteProduct,
  addProductComponent,
  deleteProductComponent,
};
