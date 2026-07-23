import Product from "../models/Product.js";
import ProductComponent from "../models/ProductComponent.js";
import Settings from "../models/Settings.js";
import ApiError from "../utils/ApiError.js";
import { calculateCostingDetails } from "../utils/costingCalculator.js";

async function getCosting(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const components = await ProductComponent.find({ productId }).populate("sourceId");

  let recipeMaterialCost = 0;
  components.forEach((comp) => {
    if (comp.sourceType === "Material") {
      recipeMaterialCost += (comp.sourceId?.cost || 0) * comp.quantity;
    } else if (comp.sourceType === "Gemstone") {
      recipeMaterialCost += comp.sourceId?.purchasePrice || 0;
    } else if (comp.sourceType === "GemstoneLot") {
      const costPerCarat =
        comp.sourceId?.totalCarat > 0 ? comp.sourceId.purchaseCost / comp.sourceId.totalCarat : 0;
      recipeMaterialCost += costPerCarat * comp.weight;
    }
  });

  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage || 20.0;

  const calculationResult = calculateCostingDetails({
    costBreakdown: product.costBreakdown || {},
    sellingPrice: product.sellingPrice || 0,
    recipeMaterialCost,
    charityPercentage: charityPct,
  });

  return {
    productId,
    productCode: product.productCode,
    name: product.name,
    category: product.category,
    recipeMaterialCost,
    costBreakdown: product.costBreakdown || calculationResult.normalized,
    charityPercentage: charityPct,
    sellingPrice: product.sellingPrice,
    costPrice: calculationResult.totalCost,
    materialCost: calculationResult.materialCost,
    productionCost: calculationResult.productionCost,
    otherCost: calculationResult.otherCost,
    grossProfit: calculationResult.grossProfit,
    margin: calculationResult.profitMargin,
    charityAmount: calculationResult.charityAmount,
    commissionAmount: calculationResult.commissionAmount,
    netProfit: calculationResult.netProfit,
    isApproved: product.status === "In Stock" || product.status === "Reserved",
  };
}

async function saveCosting(productId, { sellingPrice, costBreakdown }, userId) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const components = await ProductComponent.find({ productId }).populate("sourceId");

  let recipeMaterialCost = 0;
  components.forEach((comp) => {
    if (comp.sourceType === "Material") {
      recipeMaterialCost += (comp.sourceId?.cost || 0) * comp.quantity;
    } else if (comp.sourceType === "Gemstone") {
      recipeMaterialCost += comp.sourceId?.purchasePrice || 0;
    } else if (comp.sourceType === "GemstoneLot") {
      const costPerCarat =
        comp.sourceId?.totalCarat > 0 ? comp.sourceId.purchaseCost / comp.sourceId.totalCarat : 0;
      recipeMaterialCost += costPerCarat * comp.weight;
    }
  });

  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage || 20.0;
  const finalSellingPrice = Number(sellingPrice ?? product.sellingPrice ?? 0);

  const calc = calculateCostingDetails({
    costBreakdown: costBreakdown || product.costBreakdown || {},
    sellingPrice: finalSellingPrice,
    recipeMaterialCost,
    charityPercentage: charityPct,
  });

  product.sellingPrice = finalSellingPrice;
  product.costPrice = calc.totalCost;
  product.materialCost = calc.materialCost;
  product.manufacturingCost = calc.productionCost;
  product.otherCosts = calc.otherCost;
  product.grossProfit = calc.grossProfit;
  product.charityAmount = calc.charityAmount;
  product.netProfit = calc.netProfit;
  product.costBreakdown = costBreakdown || calc.normalized;

  await product.save();
  return getCosting(productId);
}

async function approveCosting(productId, userId) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  
  product.status = "In Stock";
  await product.save();
  return { approved: true, productId };
}

export default {
  getCosting,
  saveCosting,
  approveCosting,
};

