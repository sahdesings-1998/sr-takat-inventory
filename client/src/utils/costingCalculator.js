export const MATERIAL_FIELDS = [
  { key: "gemstones", label: "Gemstone Cost" },
  { key: "diamonds", label: "Diamond Cost" },
  { key: "gold", label: "Gold Cost" },
  { key: "watchComponents", label: "Watch Components" },
  { key: "strap", label: "Strap Cost" },
  { key: "other", label: "Other Materials" },
];

export const PRODUCTION_FIELDS = [
  { key: "cad", label: "CAD Design" },
  { key: "casting", label: "Casting" },
  { key: "stoneSetting", label: "Stone Setting" },
  { key: "polishing", label: "Polishing" },
  { key: "assembly", label: "Assembly" },
  { key: "qc", label: "Quality Control (QC)" },
];

export const OTHER_FIELDS = [
  { key: "certificate", label: "Certificate Fee" },
  { key: "shipping", label: "Shipping & Courier" },
  { key: "insurance", label: "Insurance" },
  { key: "packaging", label: "Packaging" },
  { key: "marketing", label: "Marketing" },
  { key: "commission", label: "Commission" },
];

export const BASIS_OPTIONS = [
  { value: "Material Cost", label: "Material Cost" },
  { value: "Production Cost", label: "Production Cost" },
  { value: "Total Cost", label: "Total Cost" },
  { value: "Selling Price", label: "Selling Price" },
  { value: "Gross Profit", label: "Gross Profit" },
];

export function normalizeItem(itemVal, defaultBasis = "Material Cost") {
  if (typeof itemVal === "number") {
    return { type: "fixed", value: Number(itemVal) || 0, basis: defaultBasis, amount: Number(itemVal) || 0 };
  }
  if (itemVal && typeof itemVal === "object") {
    return {
      type: itemVal.type === "percentage" ? "percentage" : "fixed",
      value: Number(itemVal.value) || 0,
      basis: itemVal.basis || defaultBasis,
      amount: Number(itemVal.amount) || 0,
    };
  }
  return { type: "fixed", value: 0, basis: defaultBasis, amount: 0 };
}

export function calculateCostingDetails({
  costBreakdown = {},
  sellingPrice = 0,
  recipeMaterialCost = 0,
  charityPercentage = 20.0,
} = {}) {
  const sp = Number(sellingPrice) || 0;
  const recipeMat = Number(recipeMaterialCost) || 0;
  const charityPct = Number(charityPercentage) || 20.0;

  const materials = costBreakdown.materials || {};
  const production = costBreakdown.production || {};
  const other = costBreakdown.other || {};

  const normalized = {
    materials: {},
    production: {},
    other: {},
  };

  MATERIAL_FIELDS.forEach(({ key }) => {
    normalized.materials[key] = normalizeItem(materials[key], "Material Cost");
  });
  PRODUCTION_FIELDS.forEach(({ key }) => {
    normalized.production[key] = normalizeItem(production[key], "Production Cost");
  });
  OTHER_FIELDS.forEach(({ key }) => {
    normalized.other[key] = normalizeItem(other[key], key === "commission" ? "Gross Profit" : "Total Cost");
  });

  // Step 1: Fixed Sums
  let matFixed = recipeMat;
  MATERIAL_FIELDS.forEach(({ key }) => {
    const item = normalized.materials[key];
    if (item.type === "fixed") matFixed += item.value;
  });

  let prodFixed = 0;
  PRODUCTION_FIELDS.forEach(({ key }) => {
    const item = normalized.production[key];
    if (item.type === "fixed") prodFixed += item.value;
  });

  let otherFixed = 0;
  OTHER_FIELDS.forEach(({ key }) => {
    const item = normalized.other[key];
    if (item.type === "fixed") otherFixed += item.value;
  });

  // Step 2: Material & Production Costs
  let materialCost = matFixed;
  MATERIAL_FIELDS.forEach(({ key }) => {
    const item = normalized.materials[key];
    if (item.type === "percentage") {
      if (item.basis === "Material Cost") {
        item.amount = (matFixed * item.value) / 100;
      } else {
        item.amount = 0;
      }
      materialCost += item.amount;
    } else {
      item.amount = item.value;
    }
  });

  let productionCost = prodFixed;
  PRODUCTION_FIELDS.forEach(({ key }) => {
    const item = normalized.production[key];
    if (item.type === "percentage") {
      if (item.basis === "Material Cost") {
        item.amount = (materialCost * item.value) / 100;
      } else if (item.basis === "Production Cost") {
        item.amount = (prodFixed * item.value) / 100;
      } else {
        item.amount = 0;
      }
      productionCost += item.amount;
    } else {
      item.amount = item.value;
    }
  });

  // Re-evaluate any Material Cost percentage items based on Production Cost
  MATERIAL_FIELDS.forEach(({ key }) => {
    const item = normalized.materials[key];
    if (item.type === "percentage" && item.basis === "Production Cost") {
      item.amount = (productionCost * item.value) / 100;
      materialCost += item.amount;
    }
  });

  // Step 3: Base Total Cost before Other percentage items
  const baseTotalCost = materialCost + productionCost + otherFixed;

  // Step 4: Other Costs Percentage items
  let otherCost = otherFixed;
  OTHER_FIELDS.forEach(({ key }) => {
    const item = normalized.other[key];
    if (item.type === "percentage") {
      if (item.basis === "Material Cost") {
        item.amount = (materialCost * item.value) / 100;
      } else if (item.basis === "Production Cost") {
        item.amount = (productionCost * item.value) / 100;
      } else if (item.basis === "Total Cost") {
        item.amount = (baseTotalCost * item.value) / 100;
      } else if (item.basis === "Selling Price") {
        item.amount = (sp * item.value) / 100;
      } else {
        item.amount = 0;
      }
      otherCost += item.amount;
    } else {
      item.amount = item.value;
    }
  });

  // Step 5: Total Cost & Initial Gross Profit
  const totalCost = materialCost + productionCost + otherCost;
  const rawGrossProfit = Math.max(0, sp - totalCost);

  // Step 6: Percentage items based on Gross Profit (e.g. Commission)
  OTHER_FIELDS.forEach(({ key }) => {
    const item = normalized.other[key];
    if (item.type === "percentage" && item.basis === "Gross Profit") {
      item.amount = (rawGrossProfit * item.value) / 100;
    }
  });
  MATERIAL_FIELDS.forEach(({ key }) => {
    const item = normalized.materials[key];
    if (item.type === "percentage" && item.basis === "Gross Profit") {
      item.amount = (rawGrossProfit * item.value) / 100;
    }
  });
  PRODUCTION_FIELDS.forEach(({ key }) => {
    const item = normalized.production[key];
    if (item.type === "percentage" && item.basis === "Gross Profit") {
      item.amount = (rawGrossProfit * item.value) / 100;
    }
  });

  // Re-sum Other Cost with Gross Profit-based items
  let finalOtherCost = otherFixed;
  OTHER_FIELDS.forEach(({ key }) => {
    const item = normalized.other[key];
    if (item.type === "percentage") {
      finalOtherCost += item.amount;
    }
  });

  const finalTotalCost = materialCost + productionCost + finalOtherCost;
  const grossProfit = Math.max(0, sp - finalTotalCost);
  const profitMargin = sp > 0 ? (grossProfit / sp) * 100 : 0;
  const charityAmount = grossProfit * (charityPct / 100);

  const commissionAmount = normalized.other.commission?.amount || 0;
  const netProfit = Math.max(0, grossProfit - charityAmount);

  return {
    normalized,
    materialCost,
    productionCost,
    otherCost: finalOtherCost,
    totalCost: finalTotalCost,
    sellingPrice: sp,
    grossProfit,
    profitMargin,
    charityAmount,
    commissionAmount,
    netProfit,
  };
}
