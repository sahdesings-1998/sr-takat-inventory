import Product from "../models/Product.js";
import ProductComponent from "../models/ProductComponent.js";
import Settings from "../models/Settings.js";
import ApiError from "../utils/ApiError.js";

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

  return {
    productId,
    recipeMaterialCost,
    costBreakdown: product.costBreakdown || {
      materials: { gemstones: 0, diamonds: 0, gold: 0, watchComponents: 0, strap: 0, other: 0 },
      production: { cad: 0, casting: 0, stoneSetting: 0, polishing: 0, assembly: 0, qc: 0 },
      other: { certificate: 0, shipping: 0, insurance: 0, packaging: 0, marketing: 0, commission: 0 },
      percentageItems: []
    },
    charityPercentage: settings.charityPercentage || 2.0,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    grossProfit: product.grossProfit,
    charityAmount: product.charityAmount,
    netProfit: product.netProfit,
    isApproved: product.status === "In Stock" || product.status === "Reserved",
  };
}

async function saveCosting(productId, { sellingPrice, costBreakdown }, userId) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const components = await ProductComponent.find({ productId }).populate("sourceId");

  // 1. Calculate dynamically updated recipe cost
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

  // 2. Sum up material breakdown costs
  const cb = costBreakdown || {
    materials: { gemstones: 0, diamonds: 0, gold: 0, watchComponents: 0, strap: 0, other: 0 },
    production: { cad: 0, casting: 0, stoneSetting: 0, polishing: 0, assembly: 0, qc: 0 },
    other: { certificate: 0, shipping: 0, insurance: 0, packaging: 0, marketing: 0, commission: 0 },
    percentageItems: []
  };

  const matSum =
    (cb.materials?.gemstones || 0) +
    (cb.materials?.diamonds || 0) +
    (cb.materials?.gold || 0) +
    (cb.materials?.watchComponents || 0) +
    (cb.materials?.strap || 0) +
    (cb.materials?.other || 0);

  const materialCost = recipeMaterialCost + matSum;

  // 3. Sum up production breakdown costs
  const productionCost =
    (cb.production?.cad || 0) +
    (cb.production?.casting || 0) +
    (cb.production?.stoneSetting || 0) +
    (cb.production?.polishing || 0) +
    (cb.production?.assembly || 0) +
    (cb.production?.qc || 0);

  // 4. Sum up other breakdown costs
  const otherCost =
    (cb.other?.certificate || 0) +
    (cb.other?.shipping || 0) +
    (cb.other?.insurance || 0) +
    (cb.other?.packaging || 0) +
    (cb.other?.marketing || 0) +
    (cb.other?.commission || 0);

  const baseCost = materialCost + productionCost + otherCost;

  // 5. Calculate cost-increasing percentage-based items
  let percentageCostIncreases = 0;
  const items = cb.percentageItems || [];
  
  items.forEach((item) => {
    if (item.basis === "Material Cost") {
      item.amount = materialCost * (item.percentage / 100);
      percentageCostIncreases += item.amount;
    } else if (item.basis === "Production Cost") {
      item.amount = productionCost * (item.percentage / 100);
      percentageCostIncreases += item.amount;
    } else if (item.basis === "Total Cost") {
      item.amount = baseCost * (item.percentage / 100);
      percentageCostIncreases += item.amount;
    }
  });

  const finalCostPrice = baseCost + percentageCostIncreases;
  const finalSellingPrice = Number(sellingPrice || 0);

  // 6. Calculate Gross Profit
  const grossProfit = Math.max(0, finalSellingPrice - finalCostPrice);

  // 7. Calculate post-selling adjustments (on Selling Price or Gross Profit)
  let postSellingAdjustments = 0;
  items.forEach((item) => {
    if (item.basis === "Selling Price") {
      item.amount = finalSellingPrice * (item.percentage / 100);
      postSellingAdjustments += item.amount;
    } else if (item.basis === "Gross Profit") {
      item.amount = grossProfit * (item.percentage / 100);
      postSellingAdjustments += item.amount;
    }
  });

  // 8. Charity (20% of Gross Profit by default)
  const settings = await Settings.getSettings();
  const charityPct = settings.charityPercentage || 2.0;
  const charityAmount = grossProfit * (charityPct / 100);

  // 9. Net Profit (gross profit minus charity allocation and post selling price adjustments)
  const netProfit = Math.max(0, grossProfit - charityAmount - postSellingAdjustments);

  product.sellingPrice = finalSellingPrice;
  product.costPrice = finalCostPrice;
  product.grossProfit = grossProfit;
  product.charityAmount = charityAmount;
  product.netProfit = netProfit;
  product.costBreakdown = cb;

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
