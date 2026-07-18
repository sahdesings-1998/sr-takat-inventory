import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import Role from "../models/Role.js";
import User from "../models/User.js";

async function seed() {
  await connectDB();

  // Clear existing products
  await Product.deleteMany({});
  console.log("Cleared existing products.");

  let adminUser = await User.findOne({ email: "admin@example.com" });
  if (!adminUser) {
    const role = await Role.findOne({ name: "Admin" });
    adminUser = await User.create({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "password123",
      roleId: role ? role._id : undefined,
    });
  }

  const userId = adminUser._id.toString();

  // Product 1: Fully Populated
  const productA = await Product.create({
    productCode: "PROD-2026-0001",
    stockNo: "STK-RING-001",
    category: "Ring",
    name: "Imperial Sapphire Diamond Halo Ring",
    sku: "SKU-R-SAP-001",
    barcode: "BAR-100293",
    qrCode: "QR-100293",
    subCategory: "Engagement Rings",
    productCollection: "Royal Heritage Collection",
    brand: "Takat Fine Jewellery",
    model: "RH-R-01",
    description: "An exquisite platinum ring featuring a magnificent 4.85 ct Ceylon blue sapphire surrounded by a brilliant halo of micro-pave diamonds.",
    shortDescription: "Platinum Ceylon Blue Sapphire Ring with Diamond Halo.",
    sellingPrice: 15500,
    costPrice: 9800,
    purchasePrice: 8500,
    additionalCost: 1300,
    totalCost: 9800,
    minimumSellingPrice: 14000,
    wholesalePrice: 12500,
    retailPrice: 16000,
    currency: "USD",
    discountAllowed: true,
    profit: 5700,
    margin: (5700 / 15500) * 100,
    weight: "8.4 grams",
    dimensions: "10.2x8.5x5.1 mm",
    material: "Platinum",
    metalType: "Platinum 950",
    goldPurity: "95% Pure Platinum",
    countryOfOrigin: "Sri Lanka",
    manufacturedBy: "Takat Workshop Jaipur",
    manufacturedDate: "2026-05-10",
    gemstoneType: "Natural Blue Sapphire",
    variety: "Ceylon",
    origin: "Sri Lanka (Ceylon)",
    shape: "Oval",
    cut: "Brilliant / Step Cut",
    colour: "Royal Blue",
    clarity: "Eye Clean",
    treatment: "Heated Only",
    heatStatus: "Indicated",
    oilLevel: "None",
    transparency: "Transparent",
    qualityGrade: "Excellent / AAA",
    naturalSynthetic: "Natural",
    pieces: 1,
    totalCarat: 4.85,
    averageCarat: 4.85,
    costPerCarat: 1752.57,
    sellingPricePerCarat: 3195.88,
    certificateAvailable: true,
    laboratory: "GIA",
    certificateNumber: "GIA-6284901928",
    certificateDate: "2026-04-15",
    certificateCost: 150,
    certificatePdf: "https://example.com/certificates/gia-6284901928.pdf",
    certificateImages: "https://example.com/certificates/gia-6284901928-img.jpg",
    certificateNotes: "Verifies Sri Lankan origin and no indications of diffusion treatment.",
    materialCost: 8500,
    manufacturingCost: 800,
    packagingCost: 150,
    shippingCost: 200,
    insuranceCost: 150,
    otherCosts: 0,
    totalCostSummary: 9800,
    warehouse: "Main Vault",
    location: "Safe A, Shelf 3",
    shelf: "Tray 4",
    quantity: 1,
    availableQuantity: 1,
    reservedQuantity: 0,
    minimumStock: 1,
    maximumStock: 2,
    reorderLevel: 1,
    supplier: "Alrosa Gem Distributors",
    supplierReference: "AL-SAP-92",
    purchaseDate: "2026-03-01",
    purchaseInvoice: "https://example.com/invoices/purchase-invoice-829.pdf",
    paymentStatus: "Paid",
    outstandingAmount: 0,
    supplierNotes: "Direct import from Ceylon gem mines dealer.",
    sellingStatus: "Available",
    lastSellingPrice: 0,
    customer: "",
    salesperson: "",
    lastSoldDate: "",
    salesPaymentStatus: "",
    consignmentStatus: "In Stock",
    documents: "https://example.com/docs/ring-warranty.pdf",
    warranty: "Lifetime manufacture warranty",
    cadFiles: "https://example.com/cad/ring-royal-sapphire.step",
    videos: "https://example.com/videos/sapphire-ring-spin.mp4",
    internalNotes: "High-value item. Keep in central safe.",
    customerNotes: "Includes GIA certificate copy.",
    specialInstructions: "Handle with white gloves only.",
    tags: ["sapphire", "platinum", "ring", "gia", "royal-blue"],
    components: [
      { name: "Ceylon Sapphire Oval 4.85ct", quantity: 1, unitCost: 6500 },
      { name: "Brilliant Diamonds 0.05ct", quantity: 24, unitCost: 83.33 },
    ],
    history: [
      { date: new Date("2026-05-10"), action: "Product created", user: userId },
      { date: new Date("2026-05-12"), action: "Costing approved", user: userId },
    ],
    grossProfit: 5700,
    charityAmount: 114,
    netProfit: 5586,
    status: "Available",
    imageUrls: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"],
    costBreakdown: {
      materials: { gemstones: 6500, diamonds: 2000, gold: 0, watchComponents: 0, strap: 0, other: 0 },
      production: { cad: 200, casting: 300, stoneSetting: 200, polishing: 100, assembly: 0, qc: 0 },
      other: { certificate: 150, shipping: 200, insurance: 150, packaging: 150, marketing: 0, commission: 0 },
    },
  });
  console.log("Seeded Product A (Fully Populated).");

  // Product 2: Basic Populated
  const productB = await Product.create({
    productCode: "PROD-2026-0002",
    stockNo: "STK-JEW-002",
    category: "Necklace",
    name: "Minimalist Gold Chain Necklace",
    sellingPrice: 1200,
    costPrice: 500,
    grossProfit: 700,
    charityAmount: 14,
    netProfit: 686,
    status: "Draft",
    brand: "GoldEssence",
    description: "Simple and elegant 18K yellow gold necklace chain, perfect for daily wear.",
    quantity: 5,
    availableQuantity: 5,
    warehouse: "Jaipur Showroom",
    location: "Cabinet B",
    history: [
      { date: new Date(), action: "Product created", user: userId }
    ]
  });
  console.log("Seeded Product B (Basic Populated).");

  // Product 3: Minimal Populated
  const productC = await Product.create({
    productCode: "PROD-2026-0003",
    stockNo: "STK-MIN-003",
    category: "Gemstone",
    name: "Rough Diamond Specimen",
    status: "Available",
    history: [
      { date: new Date(), action: "Product created", user: userId }
    ]
  });
  console.log("Seeded Product C (Minimal Populated).");

  // Product 4: Intentionally Sparse
  const productD = await Product.create({
    productCode: "PROD-2026-0004",
    stockNo: "STK-WATCH-004",
    category: "Watch",
    status: "Draft",
    history: [
      { date: new Date(), action: "Product created", user: userId }
    ]
  });
  console.log("Seeded Product D (Intentionally Sparse).");

  await mongoose.disconnect();
  console.log("Sample product database seeding completed successfully!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
