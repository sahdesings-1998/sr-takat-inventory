import Product from "../models/Product.js";
import ProductComponent from "../models/ProductComponent.js";
import Gemstone from "../models/Gemstone.js";
import GemstoneLot from "../models/GemstoneLot.js";
import Settings from "../models/Settings.js";
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

async function getAllProducts({ category, status, search } = {}) {
  const query = { isDeleted: { $ne: true } };
  if (category) query.category = category;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { productCode: { $regex: search, $options: "i" } },
      { stockNo: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  return Product.find(query).sort({ createdAt: -1 });
}

async function getProductById(id) {
  const product = await Product.findOne({ _id: id, isDeleted: { $ne: true } }).populate("certificateIds");
  if (!product) throw new ApiError(404, "Product not found");

  const components = await ProductComponent.find({ productId: id }).populate("sourceId");

  return {
    product,
    components,
  };
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

  const product = await Product.create({
    ...data,
    productCode,
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
  createProduct,
  updateProduct,
  softDeleteProduct,
  addProductComponent,
  deleteProductComponent,
};
