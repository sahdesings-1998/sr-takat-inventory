import Product from "../models/Product.js";
import ProductComponent from "../models/ProductComponent.js";
import Gemstone from "../models/Gemstone.js";
import GemstoneLot from "../models/GemstoneLot.js";
import Settings from "../models/Settings.js";
import generateId from "../utils/generateId.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllProducts({ category, status, search } = {}) {
  const query = {};
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
  const product = await Product.findById(id).populate("certificateIds");
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

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  addProductComponent,
  deleteProductComponent,
};
