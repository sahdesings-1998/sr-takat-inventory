import Lookup from "../models/Lookup.js";
import ApiError from "../utils/ApiError.js";

const DEFAULT_LOOKUPS = {
  category: [
    "Gemstone",
    "Jewellery",
    "Watch",
    "Custom Product",
    "Accessory",
    "Ring",
    "Necklace",
    "Earrings",
    "Bracelet",
    "Pendant",
    "Brooch",
    "Other",
  ],
  brand: [
    "SR Takat Atelier",
    "Rolex",
    "Patek Philippe",
    "Audemars Piguet",
    "Cartier",
    "Bvlgari",
    "Chopard",
    "Tiffany & Co.",
    "Boucheron",
    "Van Cleef & Arpels",
    "Other",
  ],
  location: [
    "Main Vault",
    "Showroom Display",
    "Safe A",
    "Safe B",
    "Workshop",
    "Consignment - Geneva",
    "Consignment - NY",
    "Consignment - HK",
    "Other",
  ],
  material: [
    "Gold",
    "Silver",
    "Platinum",
    "Setting",
    "Findings",
    "Packaging",
    "Leather Strap",
    "Steel Bracelet",
    "Other",
  ],
  color: [
    "D-F (Colorless)",
    "G-H (Near Colorless)",
    "Fancy Yellow",
    "Vivid Red (Pigeon Blood)",
    "Royal Blue",
    "Muzo Green",
    "Pink",
    "Padparadscha",
    "Champagne",
    "Black",
    "Other",
  ],
  metalType: [
    "Yellow Gold",
    "White Gold",
    "Rose Gold",
    "Platinum",
    "Silver 925",
    "Titanium",
    "Stainless Steel",
    "Two-Tone Gold",
    "Other",
  ],
  profession: [
    "Jeweler",
    "Collector",
    "Dealer",
    "Gemologist",
    "Auction House",
    "Retailer",
    "Designer",
    "Wholesaler",
    "VIP Client",
    "Other",
  ],
  goldPurity: [
    "24K (999)",
    "22K (916)",
    "18K (750)",
    "14K (585)",
    "10K (417)",
    "Sterling Silver (925)",
    "N/A",
  ],
  gemstoneType: [
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
  ],
  shape: [
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
  ],
  cut: [
    "Ideal",
    "Excellent",
    "Very Good",
    "Good",
    "Fair",
    "Cabochon",
    "Uncut",
  ],
  origin: [
    "Colombia",
    "Burma (Myanmar)",
    "Sri Lanka (Ceylon)",
    "Madagascar",
    "Zambia",
    "Mozambique",
    "Brazil",
    "Kashmir",
    "Tanzania",
    "Other",
  ],
  treatment: [
    "None / Natural",
    "Heat Treated",
    "Minor Oil",
    "Moderate Oil",
    "Significant Oil",
    "Irradiated",
    "Diffusion",
    "Other",
  ],
  laboratory: [
    "GIA",
    "GRS",
    "SSEF",
    "Gubelin",
    "IGI",
    "HRD",
    "AGS",
    "In-House",
    "Other",
  ],
  watchMovement: [
    "Automatic",
    "Manual Winding",
    "Quartz",
    "Co-Axial Automatic",
    "Solar",
    "Smart/Electronic",
    "Other",
  ],
  customerType: [
    "Private Client",
    "Dealer",
    "Wholesaler",
    "VIP",
    "Other",
  ],
  supplierType: [
    "Gemstone Supplier",
    "Metal Dealer",
    "Component Supplier",
    "Artisan / Workshop",
    "Other",
  ],
  expenseCategory: [
    "Rent",
    "Utilities",
    "Salaries",
    "Marketing",
    "Travel",
    "Shipping",
    "Insurance",
    "Equipment",
    "Maintenance",
    "Tax",
    "Office Supplies",
    "Other",
  ],
  incomeCategory: [
    "Sales",
    "Services",
    "Investments",
    "Interest",
    "Consignment Fee",
    "Other",
  ],
  clarity: [
    "FL / IF (Flawless)",
    "VVS1",
    "VVS2",
    "VS1",
    "VS2",
    "SI1",
    "SI2",
    "I1 / Included",
    "Eye Clean",
    "Slightly Included",
    "Other",
  ],
  paymentMethod: [
    "Cash",
    "Credit Card",
    "Bank Transfer",
    "Cheque",
    "Crypto",
    "Wire Transfer",
    "Store Credit",
    "Other",
  ],
  unit: [
    "grams",
    "pieces",
    "carats",
    "kg",
    "oz",
    "meters",
    "set",
    "box",
  ],
  settingType: [
    "Prong / Claw",
    "Bezel",
    "Channel",
    "Pave",
    "Solitaire",
    "Halo",
    "Tension",
    "Flush / Gypsy",
    "Cluster",
    "Bar Setting",
    "Other",
  ],
  caseMaterial: [
    "Stainless Steel",
    "Titanium",
    "Rose Gold 18K",
    "Yellow Gold 18K",
    "White Gold 18K",
    "Platinum 950",
    "Carbon Fiber",
    "Ceramic",
    "Two-Tone",
    "Other",
  ],
  strapMaterial: [
    "Alligator Leather",
    "Calf Leather Strap",
    "Steel Bracelet",
    "Rubber Strap",
    "NATO Strap",
    "Gold Bracelet",
    "Mesh Bracelet",
    "Other",
  ],
  waterResistance: [
    "30m / 3 ATM",
    "50m / 5 ATM",
    "100m / 10 ATM",
    "200m / 20 ATM",
    "300m / 30 ATM+",
    "N/A",
  ],
  reportType: [
    "Grading Report",
    "Identification Report",
    "Origin Report",
    "Certificate of Authenticity",
    "Valuation Report",
    "Other",
  ],
};

/**
 * Seed default lookups for a given type if none exist in DB.
 */
async function seedDefaultLookups(type) {
  const defaults = DEFAULT_LOOKUPS[type];
  if (!defaults || !defaults.length) return [];

  const existingCount = await Lookup.countDocuments({ type });
  if (existingCount === 0) {
    const docs = defaults.map((val) => ({
      type,
      value: val,
      label: val,
      normalizedValue: val.trim().toLowerCase(),
      isSystem: true,
    }));
    try {
      await Lookup.insertMany(docs, { ordered: false });
    } catch (err) {
      // Ignore bulk duplicate errors if any race condition occurs
    }
  }
}

export async function getLookups(type) {
  const query = {};
  if (type) {
    query.type = type.trim();
    await seedDefaultLookups(query.type);
  }

  const lookups = await Lookup.find(query).sort({ label: 1 }).lean();
  return lookups;
}

export async function createLookup({ type, value, label }) {
  if (!type || typeof type !== "string" || !type.trim()) {
    throw new ApiError(400, "Lookup type is required");
  }
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "Lookup value cannot be empty");
  }

  const trimmedType = type.trim();
  const trimmedValue = value.trim();
  const normalizedValue = trimmedValue.toLowerCase();

  // Check case-insensitive duplicate
  let existing = await Lookup.findOne({
    type: trimmedType,
    normalizedValue,
  });

  if (existing) {
    return existing;
  }

  try {
    const newLookup = await Lookup.create({
      type: trimmedType,
      value: trimmedValue,
      label: label ? label.trim() : trimmedValue,
      normalizedValue,
      isSystem: false,
    });
    return newLookup;
  } catch (err) {
    if (err.code === 11000) {
      existing = await Lookup.findOne({
        type: trimmedType,
        normalizedValue,
      });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function updateLookup(id, { value, label }) {
  const lookup = await Lookup.findById(id);
  if (!lookup) {
    throw new ApiError(404, "Lookup option not found");
  }

  if (value && typeof value === "string" && value.trim()) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLowerCase();

    // Check collision with another item in same type
    const collision = await Lookup.findOne({
      _id: { $ne: id },
      type: lookup.type,
      normalizedValue,
    });

    if (collision) {
      throw new ApiError(400, `An option with value "${trimmedValue}" already exists in ${lookup.type}`);
    }

    lookup.value = trimmedValue;
    lookup.normalizedValue = normalizedValue;
    lookup.label = label ? label.trim() : trimmedValue;
  } else if (label && typeof label === "string" && label.trim()) {
    lookup.label = label.trim();
  }

  await lookup.save();
  return lookup;
}

export async function deleteLookup(id) {
  const lookup = await Lookup.findByIdAndDelete(id);
  if (!lookup) {
    throw new ApiError(404, "Lookup option not found");
  }
  return lookup;
}

export default {
  getLookups,
  createLookup,
  updateLookup,
  deleteLookup,
};
