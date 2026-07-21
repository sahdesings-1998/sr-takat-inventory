/**
 * Product Type Dynamic Engine Configuration
 * Defines rules, visible sections, required fields, and specifications for each product category.
 */

export const CATEGORY_TYPES = {
  GEMSTONE: "Gemstone",
  JEWELLERY: "Jewellery",
  WATCH: "Watch",
  CUSTOM: "Custom Product",
  ACCESSORY: "Accessory",
};

// Map sub-categories or jewelry aliases to main engine category
export const getEngineCategory = (category) => {
  const cat = (category || "").trim();
  if (cat === "Gemstone") return CATEGORY_TYPES.GEMSTONE;
  if (cat === "Watch") return CATEGORY_TYPES.WATCH;
  if (cat === "Accessory") return CATEGORY_TYPES.ACCESSORY;
  if (cat === "Custom Product") return CATEGORY_TYPES.CUSTOM;
  // Rings, Necklaces, Earrings, Bracelets, Pendants, etc. all follow Jewellery rules
  if (["Jewellery", "Ring", "Necklace", "Earrings", "Bracelet", "Pendant"].includes(cat)) {
    return CATEGORY_TYPES.JEWELLERY;
  }
  return CATEGORY_TYPES.CUSTOM;
};

export const PRODUCT_TYPE_CONFIG = {
  [CATEGORY_TYPES.GEMSTONE]: {
    label: "Gemstone",
    description: "Loose or certified gemstones, diamonds, and precious stones",
    showGemstoneSpecs: true,
    showCertificate: true,
    showMetalSpecs: false,
    showComponents: false,
    showWatchDetails: false,
    showMaterialDetails: true,
    defaultUnit: "Carat",
    sections: ["gemstoneSpecs", "certificateInfo"],
  },
  [CATEGORY_TYPES.JEWELLERY]: {
    label: "Jewellery",
    description: "Rings, necklaces, earrings, bracelets, and custom jewellery items",
    showGemstoneSpecs: true,
    showCertificate: true,
    showMetalSpecs: true,
    showComponents: true,
    showWatchDetails: false,
    showMaterialDetails: true,
    defaultUnit: "Piece",
    sections: ["metalSpecs", "componentsTable", "gemstoneSpecs", "certificateInfo"],
  },
  [CATEGORY_TYPES.WATCH]: {
    label: "Watch",
    description: "Luxury timepieces, wristwatches, and chronograph products",
    showGemstoneSpecs: false,
    showCertificate: true,
    showMetalSpecs: false,
    showComponents: true,
    showWatchDetails: true,
    showMaterialDetails: true,
    defaultUnit: "Piece",
    sections: ["watchDetails", "componentsTable", "certificateInfo"],
  },
  [CATEGORY_TYPES.ACCESSORY]: {
    label: "Accessory",
    description: "Jewellery boxes, cleaning kits, straps, display cases, and accessories",
    showGemstoneSpecs: false,
    showCertificate: false,
    showMetalSpecs: false,
    showComponents: false,
    showWatchDetails: false,
    showMaterialDetails: true,
    defaultUnit: "Piece",
    sections: ["materialDetails"],
  },
  [CATEGORY_TYPES.CUSTOM]: {
    label: "Custom Product",
    description: "Bespoke creations, multi-component sets, or custom manufactured items",
    showGemstoneSpecs: true,
    showCertificate: true,
    showMetalSpecs: true,
    showComponents: true,
    showWatchDetails: false,
    showMaterialDetails: true,
    defaultUnit: "Piece",
    sections: ["metalSpecs", "gemstoneSpecs", "componentsTable", "certificateInfo"],
  },
};

export const GEMSTONE_TYPES = [
  "Emerald",
  "Ruby",
  "Sapphire",
  "Diamond",
  "Tanzanite",
  "Alexandrite",
  "Spinel",
  "Tourmaline",
  "Aquamarine",
  "Garnet",
  "Peridot",
  "Opal",
  "Pearl",
  "Jade",
  "Topaz",
  "Quartz",
  "Other",
];

export const GEMSTONE_SHAPES = [
  "Round",
  "Oval",
  "Cushion",
  "Emerald Cut",
  "Pear",
  "Marquise",
  "Princess",
  "Radiant",
  "Heart",
  "Asscher",
  "Briolette",
  "Cabochon",
  "Rough",
  "Other",
];

export const GEMSTONE_CUTS = ["Ideal", "Excellent", "Very Good", "Good", "Fair", "Cabochon", "Uncut"];

export const METAL_TYPES = [
  "Yellow Gold",
  "White Gold",
  "Rose Gold",
  "Platinum",
  "Silver 925",
  "Titanium",
  "Stainless Steel",
  "Two-Tone Gold",
  "Other",
];

export const GOLD_PURITIES = ["24K (999)", "22K (916)", "18K (750)", "14K (585)", "10K (417)", "Sterling Silver (925)", "N/A"];

export const WATCH_MOVEMENTS = ["Automatic", "Manual Winding", "Quartz", "Co-Axial Automatic", "Solar", "Smart/Electronic"];

export const CERTIFICATE_LABS = ["GIA", "GRS", "IGI", "HRD", "SSEF", "GUBELIN", "AGS", "In-House", "Other"];
