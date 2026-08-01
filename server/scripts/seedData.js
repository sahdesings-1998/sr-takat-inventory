import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Material from "../models/Material.js";
import Product from "../models/Product.js";
import JobCard from "../models/JobCard.js";
import Memo from "../models/Memo.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import InventoryMovement from "../models/InventoryMovement.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import SupplierPayment from "../models/SupplierPayment.js";
import AuditLog from "../models/AuditLog.js";
import Settings from "../models/Settings.js";

// ── Helpers ──────────────────────────────────────────────────────────────────
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

async function seed() {
  await connectDB();

  // ── Ensure admin user exists ─────────────────────────────────────────────
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

  // ── Ensure Settings exist ────────────────────────────────────────────────
  await Settings.getSettings();

  // ── Clear existing operational data ──────────────────────────────────────
  await Customer.deleteMany({});
  await Supplier.deleteMany({});
  await Material.deleteMany({});
  await Product.deleteMany({});
  await JobCard.deleteMany({});
  await Memo.deleteMany({});
  await Sale.deleteMany({});
  await SaleItem.deleteMany({});
  await PurchaseInvoice.deleteMany({});
  await InventoryMovement.deleteMany({});
  await Income.deleteMany({});
  await Expense.deleteMany({});
  await Payment.deleteMany({});
  await SupplierPayment.deleteMany({});
  await AuditLog.deleteMany({});
  console.log("✓ Cleared old operational data.");

  // ════════════════════════════════════════════════════════════════════════════
  // 1. CUSTOMERS (3)
  // ════════════════════════════════════════════════════════════════════════════
  const customer1 = await Customer.create({
    fullName: "Abishek Sharma",
    email: "abishek@sharmajewellers.in",
    phone: "+91 98765 43210",
    whatsApp: "+91 98765 43210",
    address: "12, Park Street, Kolkata, West Bengal 700016, India",
    companyName: "Sharma Jewellers Ltd",
    customerType: "Wholesale Buyer",
    country: "India",
    status: "active",
    notes: "Long-standing wholesale partner since 2019. Prefers sapphires and rubies.",
  });
  const customer2 = await Customer.create({
    fullName: "Priya Patel",
    email: "priya.patel@gmail.com",
    phone: "+91 99988 77766",
    whatsApp: "+91 99988 77766",
    address: "Block B-402, Satellite, Ahmedabad, Gujarat 380015, India",
    companyName: "",
    customerType: "Private Client",
    country: "India",
    status: "active",
    notes: "Private collector. Interested in emeralds and fine bracelets.",
  });
  const customer3 = await Customer.create({
    fullName: "James Worthington",
    email: "james@worthingtonjewels.co.uk",
    phone: "+44 20 7946 0958",
    whatsApp: "+44 7700 900461",
    address: "47 Hatton Garden, London EC1N 8YE, United Kingdom",
    companyName: "Worthington Fine Jewels",
    customerType: "VIP Client",
    country: "United Kingdom",
    status: "active",
    notes: "VIP international buyer. Preference for rare, unheated gemstones. Net-30 terms approved.",
  });
  console.log("✓ Seeded 3 Customers.");

  // ════════════════════════════════════════════════════════════════════════════
  // 2. SUPPLIERS (3)
  // ════════════════════════════════════════════════════════════════════════════
  const supplier1 = await Supplier.create({
    companyName: "Alrosa Gem Distributors",
    contactName: "Dmitry Ivanov",
    email: "dmitry@alrosa-gems.com",
    phone: "+7 912 345-67-89",
    whatsApp: "+7 912 345-67-89",
    address: "Leninskiy Prospect 4, Moscow 119049, Russia",
    supplierType: "Gemstone Supplier",
    country: "Russia",
    status: "active",
    notes: "Premium sapphire and ruby dealer. Reliable 2-week lead time.",
  });
  const supplier2 = await Supplier.create({
    companyName: "Chennai Gold Refinery Ltd",
    contactName: "K. Ranganathan",
    email: "contact@chennaigoldref.in",
    phone: "+91 44 2468 1357",
    whatsApp: "+91 44 2468 1357",
    address: "22 T. Nagar Main Road, Chennai, Tamil Nadu 600017, India",
    supplierType: "Metal Supplier",
    country: "India",
    status: "active",
    notes: "Certified gold, silver, and platinum supplier. BIS hallmark certified.",
  });
  const supplier3 = await Supplier.create({
    companyName: "Royal Gems Ceylon",
    contactName: "Nuwan Perera",
    email: "nuwan@royalgemscey.com",
    phone: "+94 11 234 5678",
    whatsApp: "+94 77 123 4567",
    address: "25 Sea Street, Pettah, Colombo 11, Sri Lanka",
    supplierType: "Gemstone Supplier",
    country: "Sri Lanka",
    status: "active",
    notes: "Specialist in Ceylon sapphires, padparadscha, and Colombian emeralds.",
  });
  console.log("✓ Seeded 3 Suppliers.");

  // ════════════════════════════════════════════════════════════════════════════
  // 3. MATERIALS (3)
  // ════════════════════════════════════════════════════════════════════════════
  const materialGold = await Material.create({
    materialCode: "MET-AU-24K",
    materialName: "Gold 24K Fine",
    category: "Gold",
    quantity: 250.5,
    unit: "g",
    cost: 72.5,
    supplierId: supplier2._id,
    location: "Workshop Vault",
    status: "active",
  });
  const materialSilver = await Material.create({
    materialCode: "MET-AG-925",
    materialName: "Sterling Silver 925",
    category: "Silver",
    quantity: 1500,
    unit: "g",
    cost: 0.95,
    supplierId: supplier2._id,
    location: "Workshop Vault",
    status: "active",
  });
  const materialPlatinum = await Material.create({
    materialCode: "MET-PT-950",
    materialName: "Platinum 950 Wire",
    category: "Platinum",
    quantity: 85,
    unit: "g",
    cost: 32.10,
    supplierId: supplier2._id,
    location: "Workshop Vault",
    status: "active",
  });
  console.log("✓ Seeded 3 Materials.");

  // ════════════════════════════════════════════════════════════════════════════
  // 4. GEMSTONE PRODUCTS (4) — category: "Gemstone"
  // ════════════════════════════════════════════════════════════════════════════
  const gem1 = await Product.create({
    productCode: "GEM-2026-0001",
    stoneId: "GEM-2026-0001",
    stockNo: "STK-GEM-0001",
    sku: "GEM-SAP-001",
    name: "Natural Royal Blue Ceylon Sapphire",
    category: "Gemstone",
    gemstone: "Natural Blue Sapphire",
    gemstoneType: "Sapphire",
    variety: "Royal Blue",
    shape: "Oval",
    cut: "Brilliant/Step",
    colour: "Royal Blue",
    clarity: "Eye Clean",
    origin: "Ceylon",
    treatment: "Heated",
    heatStatus: "Heated",
    transparency: "Transparent",
    qualityGrade: "AAA",
    naturalSynthetic: "Natural",
    carat: 4.85,
    totalCarat: 4.85,
    originalCarat: 4.85,
    pieces: 1,
    costPerCarat: 2400 / 4.85,
    sellingPricePerCarat: 3800 / 4.85,
    dimensions: "10.2x8.5x5.1 mm",
    weight: "0.97 g",
    purchasePrice: 2400,
    costPrice: 2400,
    sellingPrice: 3800,
    supplierId: supplier1._id,
    supplier: supplier1.companyName,
    certificateAvailable: true,
    laboratory: "GRS",
    certificateNumber: "GRS-2026-101",
    location: "Vault Safe-A",
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    status: "In Stock",
    purchaseDate: daysAgo(45).toISOString(),
  });

  const gem2 = await Product.create({
    productCode: "GEM-2026-0002",
    stoneId: "GEM-2026-0002",
    stockNo: "STK-GEM-0002",
    sku: "GEM-RUB-002",
    name: "Unheated Burmese Pigeon Blood Ruby",
    category: "Gemstone",
    gemstone: "Unheated Pigeon Blood Ruby",
    gemstoneType: "Ruby",
    variety: "Pigeon Blood",
    shape: "Cushion",
    cut: "Mixed",
    colour: "Pigeon Blood Red",
    clarity: "Slight Inclusions",
    origin: "Burma",
    treatment: "None",
    heatStatus: "Unheated",
    transparency: "Transparent",
    qualityGrade: "AAA",
    naturalSynthetic: "Natural",
    carat: 3.20,
    totalCarat: 3.20,
    originalCarat: 3.20,
    pieces: 1,
    costPerCarat: 5800 / 3.2,
    sellingPricePerCarat: 8500 / 3.2,
    dimensions: "8.4x7.2x4.5 mm",
    weight: "0.64 g",
    purchasePrice: 5800,
    costPrice: 5800,
    sellingPrice: 8500,
    supplierId: supplier1._id,
    supplier: supplier1.companyName,
    certificateAvailable: true,
    laboratory: "GIA",
    certificateNumber: "GIA-642910",
    location: "Vault Safe-A",
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    status: "In Stock",
    purchaseDate: daysAgo(40).toISOString(),
  });

  const gem3 = await Product.create({
    productCode: "GEM-2026-0003",
    stoneId: "GEM-2026-0003",
    stockNo: "STK-GEM-0003",
    sku: "GEM-EMR-003",
    name: "Vivid Green Colombian Emerald",
    category: "Gemstone",
    gemstone: "Emerald Octagon Step Cut",
    gemstoneType: "Emerald",
    variety: "Vivid Green",
    shape: "Octagon",
    cut: "Step",
    colour: "Vivid Green",
    clarity: "Minor Inclusions",
    origin: "Colombia",
    treatment: "Insignificant Oil",
    oilLevel: "Insignificant",
    transparency: "Transparent",
    qualityGrade: "AA",
    naturalSynthetic: "Natural",
    carat: 5.12,
    totalCarat: 5.12,
    originalCarat: 5.12,
    pieces: 1,
    costPerCarat: 9500 / 5.12,
    sellingPricePerCarat: 14500 / 5.12,
    dimensions: "11.5x9.1x6.0 mm",
    weight: "1.05 g",
    purchasePrice: 9500,
    costPrice: 9500,
    sellingPrice: 14500,
    supplierId: supplier3._id,
    supplier: supplier3.companyName,
    certificateAvailable: true,
    laboratory: "SSEF",
    certificateNumber: "SSEF-2026-88",
    location: "Vault Safe-B",
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    status: "In Stock",
    purchaseDate: daysAgo(30).toISOString(),
  });

  const gem4 = await Product.create({
    productCode: "GEM-2026-0004",
    stoneId: "GEM-2026-0004",
    stockNo: "STK-GEM-0004",
    sku: "GEM-PAD-004",
    name: "Natural Padparadscha Sapphire",
    category: "Gemstone",
    gemstone: "Padparadscha Sapphire Oval",
    gemstoneType: "Sapphire",
    variety: "Padparadscha",
    shape: "Oval",
    cut: "Brilliant/Step",
    colour: "Pinkish Orange",
    clarity: "Eye Clean",
    origin: "Ceylon",
    treatment: "None",
    heatStatus: "Unheated",
    transparency: "Transparent",
    qualityGrade: "AAA",
    naturalSynthetic: "Natural",
    carat: 2.95,
    totalCarat: 2.95,
    originalCarat: 2.95,
    pieces: 1,
    costPerCarat: 7200 / 2.95,
    sellingPricePerCarat: 11000 / 2.95,
    dimensions: "9.1x7.0x4.2 mm",
    weight: "0.59 g",
    purchasePrice: 7200,
    costPrice: 7200,
    sellingPrice: 11000,
    supplierId: supplier3._id,
    supplier: supplier3.companyName,
    certificateAvailable: false,
    certificateNumber: "",
    location: "Vault Safe-B",
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    status: "In Stock",
    purchaseDate: daysAgo(25).toISOString(),
  });
  console.log("✓ Seeded 4 Gemstone Products.");

  // ════════════════════════════════════════════════════════════════════════════
  // 5. NON-GEMSTONE PRODUCTS (8 — 2 per category)
  // ════════════════════════════════════════════════════════════════════════════

  // ── Rings (2) ──
  const prodRing1 = await Product.create({
    productCode: "PROD-2026-0001",
    stockNo: "STK-1001",
    sku: "RNG-SAP-001",
    name: "Classic Sapphire Halo Ring",
    category: "Ring",
    metalType: "Gold 18K White",
    goldPurity: "18K",
    weight: "5.4 g",
    dimensions: "Ring Size 6.5",
    description: "Exquisite 18K white gold halo ring set with a 1.2ct centre sapphire surrounded by 0.45ct pavé diamonds.",
    material: "White Gold",
    purchasePrice: 2800,
    costPrice: 3200,
    sellingPrice: 4800,
    minimumSellingPrice: 4200,
    wholesalePrice: 4400,
    retailPrice: 4800,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 32,
    grossProfit: 1600,
    netProfit: 1568,
    location: "Display Case A",
    status: "In Stock",
    purchaseDate: daysAgo(60).toISOString(),
  });

  const prodRing2 = await Product.create({
    productCode: "PROD-2026-0002",
    stockNo: "STK-1002",
    sku: "RNG-DIA-002",
    name: "Platinum Diamond Solitaire",
    category: "Ring",
    metalType: "Platinum 950",
    goldPurity: "",
    weight: "6.2 g",
    dimensions: "Ring Size 7",
    description: "Timeless platinum solitaire featuring a 1.5ct GIA-certified round brilliant diamond, D color, VVS1 clarity.",
    material: "Platinum",
    purchasePrice: 5000,
    costPrice: 5600,
    sellingPrice: 8400,
    minimumSellingPrice: 7500,
    wholesalePrice: 7800,
    retailPrice: 8400,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 56,
    grossProfit: 2800,
    netProfit: 2744,
    location: "Display Case A",
    status: "In Stock",
    purchaseDate: daysAgo(55).toISOString(),
  });

  // ── Necklaces (2) ──
  const prodNeck1 = await Product.create({
    productCode: "PROD-2026-0003",
    stockNo: "STK-1003",
    sku: "NCK-EMR-003",
    name: "Emerald Drop Pendant Necklace",
    category: "Necklace",
    metalType: "Gold 18K Yellow",
    goldPurity: "18K",
    weight: "12.8 g",
    dimensions: "Chain 18 inches, Pendant 22x12 mm",
    description: "Elegant 18K yellow gold necklace with 1.8ct pear-shaped emerald pendant and diamond bail.",
    material: "Yellow Gold",
    purchasePrice: 3600,
    costPrice: 4100,
    sellingPrice: 6200,
    minimumSellingPrice: 5500,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 42,
    grossProfit: 2100,
    netProfit: 2058,
    location: "Display Case B",
    status: "In Stock",
    purchaseDate: daysAgo(50).toISOString(),
  });

  const prodNeck2 = await Product.create({
    productCode: "PROD-2026-0004",
    stockNo: "STK-1004",
    sku: "NCK-RUB-004",
    name: "Ruby Tennis Necklace",
    category: "Necklace",
    metalType: "Gold 18K White",
    goldPurity: "18K",
    weight: "28.5 g",
    dimensions: "Length 16 inches",
    description: "Stunning 18K white gold tennis necklace with 12.5ct total weight natural rubies alternating with 3.8ct diamonds.",
    material: "White Gold",
    purchasePrice: 11500,
    costPrice: 12800,
    sellingPrice: 19500,
    minimumSellingPrice: 17000,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 134,
    grossProfit: 6700,
    netProfit: 6566,
    location: "Display Case B",
    status: "In Stock",
    purchaseDate: daysAgo(35).toISOString(),
  });

  // ── Watches (2) ──
  const prodWatch1 = await Product.create({
    productCode: "PROD-2026-0005",
    stockNo: "STK-1005",
    sku: "WCH-CHR-005",
    name: "Heritage Chronograph Rose Gold",
    category: "Watch",
    metalType: "Gold 18K Rose",
    goldPurity: "18K",
    weight: "142 g",
    dimensions: "42mm case, 22mm lug width",
    description: "Swiss-made automatic chronograph in 18K rose gold case with sapphire crystal and alligator strap.",
    material: "Rose Gold",
    brand: "SR Takat Horlogerie",
    purchasePrice: 7800,
    costPrice: 8500,
    sellingPrice: 14200,
    minimumSellingPrice: 12500,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 114,
    grossProfit: 5700,
    netProfit: 5586,
    location: "Watch Display",
    status: "In Stock",
    purchaseDate: daysAgo(28).toISOString(),
  });

  const prodWatch2 = await Product.create({
    productCode: "PROD-2026-0006",
    stockNo: "STK-1006",
    sku: "WCH-MON-006",
    name: "Classic Moonphase Platinum",
    category: "Watch",
    metalType: "Platinum 950",
    weight: "168 g",
    dimensions: "40mm case, 20mm lug width",
    description: "Ultra-thin platinum dress watch with moonphase complication, guilloché dial, and hand-sewn leather strap.",
    material: "Platinum",
    brand: "SR Takat Horlogerie",
    purchasePrice: 10200,
    costPrice: 11200,
    sellingPrice: 18500,
    minimumSellingPrice: 16000,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 146,
    grossProfit: 7300,
    netProfit: 7154,
    location: "Watch Display",
    status: "In Stock",
    purchaseDate: daysAgo(20).toISOString(),
  });

  // ── Bracelet (1) ──
  const prodBracelet = await Product.create({
    productCode: "PROD-2026-0007",
    stockNo: "STK-1007",
    sku: "BRC-DIA-007",
    name: "Diamond Rivière Bracelet",
    category: "Bracelet",
    metalType: "Gold 18K White",
    goldPurity: "18K",
    weight: "18.2 g",
    dimensions: "Length 7 inches",
    description: "Classic 18K white gold rivière bracelet with 8.5ct total weight round brilliant diamonds, F-G color, VS clarity.",
    material: "White Gold",
    purchasePrice: 6200,
    costPrice: 6800,
    sellingPrice: 10500,
    minimumSellingPrice: 9200,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 74,
    grossProfit: 3700,
    netProfit: 3626,
    location: "Display Case C",
    status: "In Stock",
    purchaseDate: daysAgo(22).toISOString(),
  });

  // ── Pendant (1) ──
  const prodPendant = await Product.create({
    productCode: "PROD-2026-0008",
    stockNo: "STK-1008",
    sku: "PND-RUB-008",
    name: "Royal Cushion Ruby Pendant",
    category: "Pendant",
    metalType: "Platinum 950",
    weight: "7.2 g",
    dimensions: "Pendant 20x15 mm",
    description: "Platinum pendant with 2.8ct cushion-cut Burmese ruby surrounded by pavé diamonds, on a 16-inch platinum chain.",
    material: "Platinum",
    purchasePrice: 6500,
    costPrice: 7200,
    sellingPrice: 11000,
    minimumSellingPrice: 9800,
    quantity: 1,
    stockQuantity: 1,
    originalQuantity: 1,
    availableQuantity: 1,
    minimumStock: 1,
    charityAmount: 76,
    grossProfit: 3800,
    netProfit: 3724,
    location: "Display Case C",
    status: "In Stock",
    purchaseDate: daysAgo(18).toISOString(),
  });
  console.log("✓ Seeded 8 Non-Gemstone Products (2 Rings, 2 Necklaces, 2 Watches, 1 Bracelet, 1 Pendant).");

  // ════════════════════════════════════════════════════════════════════════════
  // 6. PURCHASE INVOICES (3) — linked to suppliers with items
  // ════════════════════════════════════════════════════════════════════════════
  const pi1 = await PurchaseInvoice.create({
    invoiceNumber: "PI-2026-0001",
    supplierInvoiceNumber: "ALROSA-INV-4421",
    supplierId: supplier1._id,
    invoiceDate: daysAgo(45),
    purchaseDate: daysAgo(45),
    dueDate: daysAgo(15),
    status: "Confirmed",
    paymentStatus: "Paid",
    items: [
      {
        inventoryType: "Gemstone",
        inventoryId: gem1._id,
        name: "Natural Royal Blue Ceylon Sapphire 4.85ct",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 2400,
        totalAmount: 2400,
      },
      {
        inventoryType: "Gemstone",
        inventoryId: gem2._id,
        name: "Unheated Burmese Pigeon Blood Ruby 3.20ct",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 5800,
        totalAmount: 5800,
      },
    ],
    subtotal: 8200,
    finalTotal: 8200,
    paidAmount: 8200,
    outstandingBalance: 0,
    confirmedAt: daysAgo(44),
    confirmedBy: adminUser._id,
    createdBy: adminUser._id,
    notes: "Gemstone purchase from Alrosa – Sapphire and Ruby lot.",
  });

  const pi2 = await PurchaseInvoice.create({
    invoiceNumber: "PI-2026-0002",
    supplierInvoiceNumber: "RGC-INV-2206",
    supplierId: supplier3._id,
    invoiceDate: daysAgo(30),
    purchaseDate: daysAgo(30),
    dueDate: daysAgo(0),
    status: "Confirmed",
    paymentStatus: "Paid",
    items: [
      {
        inventoryType: "Gemstone",
        inventoryId: gem3._id,
        name: "Vivid Green Colombian Emerald 5.12ct",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 9500,
        totalAmount: 9500,
      },
      {
        inventoryType: "Gemstone",
        inventoryId: gem4._id,
        name: "Natural Padparadscha Sapphire 2.95ct",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 7200,
        totalAmount: 7200,
      },
    ],
    subtotal: 16700,
    finalTotal: 16700,
    paidAmount: 16700,
    outstandingBalance: 0,
    confirmedAt: daysAgo(29),
    confirmedBy: adminUser._id,
    createdBy: adminUser._id,
    notes: "Emerald and Padparadscha purchase from Royal Gems Ceylon.",
  });

  const metalTotal = (72.5 * 250.5) + (0.95 * 1500) + (32.10 * 85);
  const pi3 = await PurchaseInvoice.create({
    invoiceNumber: "PI-2026-0003",
    supplierInvoiceNumber: "CGR-INV-8847",
    supplierId: supplier2._id,
    invoiceDate: daysAgo(20),
    purchaseDate: daysAgo(20),
    dueDate: daysFromNow(10),
    status: "Confirmed",
    paymentStatus: "Partially Paid",
    items: [
      {
        inventoryType: "Material",
        inventoryId: materialGold._id,
        name: "Gold 24K Fine",
        itemType: "Material",
        quantity: 250.5,
        unit: "g",
        purchasePrice: 72.5,
        totalAmount: 72.5 * 250.5,
      },
      {
        inventoryType: "Material",
        inventoryId: materialSilver._id,
        name: "Sterling Silver 925",
        itemType: "Material",
        quantity: 1500,
        unit: "g",
        purchasePrice: 0.95,
        totalAmount: 0.95 * 1500,
      },
      {
        inventoryType: "Material",
        inventoryId: materialPlatinum._id,
        name: "Platinum 950 Wire",
        itemType: "Material",
        quantity: 85,
        unit: "g",
        purchasePrice: 32.10,
        totalAmount: 32.10 * 85,
      },
    ],
    subtotal: metalTotal,
    finalTotal: metalTotal,
    paidAmount: 15000,
    outstandingBalance: metalTotal - 15000,
    confirmedAt: daysAgo(19),
    confirmedBy: adminUser._id,
    createdBy: adminUser._id,
    notes: "Bulk metal purchase – Gold, Silver, and Platinum from Chennai Gold Refinery.",
  });
  console.log("✓ Seeded 3 Purchase Invoices.");

  // ════════════════════════════════════════════════════════════════════════════
  // 7. SUPPLIER PAYMENTS (3)
  // ════════════════════════════════════════════════════════════════════════════
  await SupplierPayment.create({
    paymentNo: "SP-2026-0001",
    supplierId: supplier1._id,
    purchaseInvoiceId: pi1._id,
    amount: 8200,
    paymentMethod: "Bank Transfer",
    paymentDate: daysAgo(42),
    notes: "Full payment for PI-2026-0001.",
    createdBy: adminUser._id,
  });
  await SupplierPayment.create({
    paymentNo: "SP-2026-0002",
    supplierId: supplier3._id,
    purchaseInvoiceId: pi2._id,
    amount: 16700,
    paymentMethod: "Bank Transfer",
    paymentDate: daysAgo(27),
    notes: "Full payment for PI-2026-0002.",
    createdBy: adminUser._id,
  });
  await SupplierPayment.create({
    paymentNo: "SP-2026-0003",
    supplierId: supplier2._id,
    purchaseInvoiceId: pi3._id,
    amount: 15000,
    paymentMethod: "Bank Transfer",
    paymentDate: daysAgo(18),
    notes: "Partial payment for PI-2026-0003. Balance pending.",
    createdBy: adminUser._id,
  });
  console.log("✓ Seeded 3 Supplier Payments.");

  // ════════════════════════════════════════════════════════════════════════════
  // 8. SALES (3) — with SaleItems + stock deductions
  // ════════════════════════════════════════════════════════════════════════════

  // Sale 1: Sapphire Ring to Sharma Jewellers
  const sale1GrossProfit = 4600 - 3200; // 1400
  const sale1Charity = sale1GrossProfit * 0.02;
  const sale1 = await Sale.create({
    invoiceNo: "INV-2026-0001",
    customerId: customer1._id,
    subtotal: 4800,
    discountType: "fixed",
    discountValue: 200,
    discount: 200,
    total: 4600,
    amountPaid: 4600,
    balanceDue: 0,
    charityPercentage: 2,
    charityAmount: sale1Charity,
    grossProfit: sale1GrossProfit,
    netProfit: sale1GrossProfit - sale1Charity,
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    createdBy: adminUser._id,
  });
  await SaleItem.create({
    saleId: sale1._id,
    inventoryType: "Product",
    inventoryId: prodRing1._id,
    quantity: 1,
    sellingPrice: 4800,
    discount: 200,
  });
  // Mark ring as sold
  prodRing1.status = "Sold";
  prodRing1.quantity = 0;
  prodRing1.stockQuantity = 0;
  prodRing1.availableQuantity = 0;
  prodRing1.soldQuantity = 1;
  await prodRing1.save();

  // Sale 2: Ruby Pendant + Partial Emerald (2.5ct) to Worthington
  const emeraldPartialCarat = 2.5;
  const emeraldCostPerCarat = gem3.costPerCarat;
  const emeraldSellPerCarat = gem3.sellingPricePerCarat;
  const emeraldPartialCost = emeraldPartialCarat * emeraldCostPerCarat;
  const emeraldPartialSell = emeraldPartialCarat * emeraldSellPerCarat;
  const sale2Subtotal = 11000 + emeraldPartialSell;
  const sale2Discount = 400;
  const sale2Total = sale2Subtotal - sale2Discount;
  const sale2COGS = 7200 + emeraldPartialCost;
  const sale2GrossProfit = sale2Total - sale2COGS;
  const sale2Charity = sale2GrossProfit * 0.02;
  const sale2 = await Sale.create({
    invoiceNo: "INV-2026-0002",
    customerId: customer3._id,
    subtotal: sale2Subtotal,
    discountType: "fixed",
    discountValue: sale2Discount,
    discount: sale2Discount,
    total: sale2Total,
    amountPaid: sale2Total,
    balanceDue: 0,
    charityPercentage: 2,
    charityAmount: sale2Charity,
    grossProfit: sale2GrossProfit,
    netProfit: sale2GrossProfit - sale2Charity,
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    createdBy: adminUser._id,
  });
  await SaleItem.create({
    saleId: sale2._id,
    inventoryType: "Product",
    inventoryId: prodPendant._id,
    quantity: 1,
    sellingPrice: 11000,
    discount: 200,
  });
  await SaleItem.create({
    saleId: sale2._id,
    inventoryType: "Gemstone",
    inventoryId: gem3._id,
    quantity: 1,
    caratWeight: emeraldPartialCarat,
    pricePerCarat: emeraldSellPerCarat,
    costPerCarat: emeraldCostPerCarat,
    pricingType: "default",
    sellingPrice: emeraldPartialSell,
  });
  // Update pendant
  prodPendant.status = "Sold";
  prodPendant.quantity = 0;
  prodPendant.stockQuantity = 0;
  prodPendant.availableQuantity = 0;
  prodPendant.soldQuantity = 1;
  await prodPendant.save();
  // Update emerald partial carat
  gem3.carat = +(gem3.originalCarat - emeraldPartialCarat).toFixed(2); // 2.62
  gem3.totalCarat = gem3.carat;
  gem3.soldCarat = +(gem3.soldCarat + emeraldPartialCarat).toFixed(2);
  gem3.costPrice = gem3.carat * emeraldCostPerCarat;
  gem3.sellingPrice = gem3.carat * emeraldSellPerCarat;
  gem3.history = [
    {
      date: new Date(),
      action: "Partial Sale",
      user: adminUser.fullName,
      caratSold: emeraldPartialCarat,
      remainingCarat: gem3.carat,
      saleId: sale2._id,
    },
  ];
  await gem3.save();

  // Sale 3: Diamond Bracelet to Priya – Partially Paid
  const sale3GrossProfit = 10200 - 6800; // 3400
  const sale3Charity = sale3GrossProfit * 0.02;
  const sale3 = await Sale.create({
    invoiceNo: "INV-2026-0003",
    customerId: customer2._id,
    subtotal: 10500,
    discountType: "fixed",
    discountValue: 300,
    discount: 300,
    total: 10200,
    amountPaid: 6000,
    balanceDue: 4200,
    charityPercentage: 2,
    charityAmount: sale3Charity,
    grossProfit: sale3GrossProfit,
    netProfit: sale3GrossProfit - sale3Charity,
    paymentMethod: "Bank Transfer",
    paymentStatus: "Partially Paid",
    dueDate: daysFromNow(15),
    createdBy: adminUser._id,
  });
  await SaleItem.create({
    saleId: sale3._id,
    inventoryType: "Product",
    inventoryId: prodBracelet._id,
    quantity: 1,
    sellingPrice: 10500,
    discount: 300,
  });
  prodBracelet.status = "Sold";
  prodBracelet.quantity = 0;
  prodBracelet.stockQuantity = 0;
  prodBracelet.availableQuantity = 0;
  prodBracelet.soldQuantity = 1;
  await prodBracelet.save();

  // Sale payments
  await Payment.create({
    paymentId: "PAY-2026-0001",
    saleId: sale1._id,
    invoiceNo: "INV-2026-0001",
    customerId: customer1._id,
    amount: 4600,
    paymentMethod: "Bank Transfer",
    paymentDate: daysAgo(10),
    createdBy: adminUser._id,
  });
  await Payment.create({
    paymentId: "PAY-2026-0002",
    saleId: sale2._id,
    invoiceNo: "INV-2026-0002",
    customerId: customer3._id,
    amount: sale2Total,
    paymentMethod: "Credit Card",
    paymentDate: daysAgo(5),
    createdBy: adminUser._id,
  });
  await Payment.create({
    paymentId: "PAY-2026-0003",
    saleId: sale3._id,
    invoiceNo: "INV-2026-0003",
    customerId: customer2._id,
    amount: 6000,
    paymentMethod: "Bank Transfer",
    paymentDate: daysAgo(3),
    notes: "Partial payment. Balance of $4,200 due in 15 days.",
    createdBy: adminUser._id,
  });
  console.log("✓ Seeded 3 Sales with SaleItems and Payments (stock updated).");

  // ════════════════════════════════════════════════════════════════════════════
  // 9. MEMOS (2)
  // ════════════════════════════════════════════════════════════════════════════
  // Memo 1: Active – Emerald remainder to Sharma (on time)
  const memo1 = await Memo.create({
    memoNo: "MEM-2026-0001",
    customerId: customer1._id,
    issueDate: daysAgo(2),
    expectedReturn: daysFromNow(5),
    status: "With Client",
    items: [
      {
        inventoryType: "Gemstone",
        inventoryId: gem3._id,
        quantity: 1,
        carat: gem3.carat,
        value: gem3.sellingPrice,
        totalValue: gem3.sellingPrice,
        status: "On Memo",
      },
    ],
    totalValue: gem3.sellingPrice,
    remarks: "Colombian Emerald (remaining 2.62ct) consigned for client review.",
    createdBy: adminUser._id,
  });
  gem3.status = "On Memo";
  gem3.consignmentStatus = "On Memo";
  await gem3.save();

  // Memo 2: Overdue – Padparadscha to Worthington
  const memo2 = await Memo.create({
    memoNo: "MEM-2026-0002",
    customerId: customer3._id,
    issueDate: daysAgo(10),
    expectedReturn: daysAgo(3),
    status: "With Client",
    items: [
      {
        inventoryType: "Gemstone",
        inventoryId: gem4._id,
        quantity: 1,
        carat: gem4.carat,
        value: gem4.sellingPrice,
        totalValue: gem4.sellingPrice,
        status: "On Memo",
      },
    ],
    totalValue: gem4.sellingPrice,
    remarks: "Padparadscha Sapphire 2.95ct sent for approval. OVERDUE – follow up required.",
    createdBy: adminUser._id,
  });
  gem4.status = "On Memo";
  gem4.consignmentStatus = "On Memo";
  await gem4.save();

  console.log("✓ Seeded 2 Memos (1 active, 1 overdue). Gemstone statuses updated.");

  // ════════════════════════════════════════════════════════════════════════════
  // 10. JOB CARDS (2)
  // ════════════════════════════════════════════════════════════════════════════
  const jobCard1 = await JobCard.create({
    jobNo: "JOB-2026-0001",
    productType: "Ring",
    productId: prodRing1._id,
    assignedTo: adminUser._id,
    startDate: daysAgo(58),
    expectedDate: daysAgo(48),
    completedDate: daysAgo(49),
    status: "Completed",
    notes: "Classic Sapphire Halo Ring – production completed ahead of schedule.",
    productionStages: [
      { stageName: "Design", status: "Completed", notes: "CAD model finalized and approved", updatedAt: daysAgo(58) },
      { stageName: "Materials Issued", status: "Completed", notes: "5.4g 18K white gold and sapphire issued", updatedAt: daysAgo(57) },
      { stageName: "Manufacturing", status: "Completed", notes: "Ring cast and refined", updatedAt: daysAgo(55) },
      { stageName: "Stone Setting", status: "Completed", notes: "Centre sapphire and halo diamonds set", updatedAt: daysAgo(53) },
      { stageName: "Polishing", status: "Completed", notes: "Final polish and rhodium plating", updatedAt: daysAgo(51) },
      { stageName: "QC", status: "Completed", notes: "Passed quality control inspection", updatedAt: daysAgo(50) },
      { stageName: "Completed", status: "Completed", notes: "Delivered to inventory", updatedAt: daysAgo(49) },
    ],
    materialsIssued: [
      { materialId: materialGold._id, quantity: 8, issuedBy: adminUser._id, issuedAt: daysAgo(57) },
    ],
  });

  const jobCard2 = await JobCard.create({
    jobNo: "JOB-2026-0002",
    productType: "Ring",
    productId: prodRing2._id,
    assignedTo: adminUser._id,
    startDate: daysAgo(12),
    expectedDate: daysFromNow(8),
    status: "In Progress",
    notes: "Platinum Diamond Solitaire – currently in manufacturing stage.",
    productionStages: [
      { stageName: "Design", status: "Completed", notes: "Custom CAD design approved by client", updatedAt: daysAgo(12) },
      { stageName: "Materials Issued", status: "Completed", notes: "6.2g Platinum 950 and 1.5ct diamond issued", updatedAt: daysAgo(10) },
      { stageName: "Manufacturing", status: "In Progress", notes: "Platinum casting in progress", updatedAt: daysAgo(5) },
    ],
    materialsIssued: [
      { materialId: materialPlatinum._id, quantity: 10, issuedBy: adminUser._id, issuedAt: daysAgo(10) },
    ],
  });
  // Update Ring 2 status
  prodRing2.status = "In Production";
  await prodRing2.save();

  console.log("✓ Seeded 2 Job Cards (1 completed, 1 in progress).");

  // ════════════════════════════════════════════════════════════════════════════
  // 11. INVENTORY MOVEMENTS
  // ════════════════════════════════════════════════════════════════════════════
  const movements = [
    // Purchases (stock inward)
    { inventoryType: "Gemstone", inventoryId: gem1._id, action: "Purchase", quantity: 1, unit: "pcs", cost: 2400, previousStock: 0, updatedStock: 1, weight: 4.85, supplierId: supplier1._id, purchaseInvoiceId: pi1._id, referenceType: "PurchaseInvoice", referenceId: pi1._id, userId: adminUser._id, remarks: "Sapphire purchased – PI-2026-0001", movementDate: daysAgo(45) },
    { inventoryType: "Gemstone", inventoryId: gem2._id, action: "Purchase", quantity: 1, unit: "pcs", cost: 5800, previousStock: 0, updatedStock: 1, weight: 3.2, supplierId: supplier1._id, purchaseInvoiceId: pi1._id, referenceType: "PurchaseInvoice", referenceId: pi1._id, userId: adminUser._id, remarks: "Ruby purchased – PI-2026-0001", movementDate: daysAgo(45) },
    { inventoryType: "Gemstone", inventoryId: gem3._id, action: "Purchase", quantity: 1, unit: "pcs", cost: 9500, previousStock: 0, updatedStock: 1, weight: 5.12, supplierId: supplier3._id, purchaseInvoiceId: pi2._id, referenceType: "PurchaseInvoice", referenceId: pi2._id, userId: adminUser._id, remarks: "Emerald purchased – PI-2026-0002", movementDate: daysAgo(30) },
    { inventoryType: "Gemstone", inventoryId: gem4._id, action: "Purchase", quantity: 1, unit: "pcs", cost: 7200, previousStock: 0, updatedStock: 1, weight: 2.95, supplierId: supplier3._id, purchaseInvoiceId: pi2._id, referenceType: "PurchaseInvoice", referenceId: pi2._id, userId: adminUser._id, remarks: "Padparadscha purchased – PI-2026-0002", movementDate: daysAgo(30) },
    { inventoryType: "Material", inventoryId: materialGold._id, action: "Purchase", quantity: 250.5, unit: "g", cost: 72.5 * 250.5, previousStock: 0, updatedStock: 250.5, supplierId: supplier2._id, purchaseInvoiceId: pi3._id, referenceType: "PurchaseInvoice", referenceId: pi3._id, userId: adminUser._id, remarks: "Gold 24K bulk – PI-2026-0003", movementDate: daysAgo(20) },
    { inventoryType: "Material", inventoryId: materialSilver._id, action: "Purchase", quantity: 1500, unit: "g", cost: 0.95 * 1500, previousStock: 0, updatedStock: 1500, supplierId: supplier2._id, purchaseInvoiceId: pi3._id, referenceType: "PurchaseInvoice", referenceId: pi3._id, userId: adminUser._id, remarks: "Silver 925 bulk – PI-2026-0003", movementDate: daysAgo(20) },
    { inventoryType: "Material", inventoryId: materialPlatinum._id, action: "Purchase", quantity: 85, unit: "g", cost: 32.10 * 85, previousStock: 0, updatedStock: 85, supplierId: supplier2._id, purchaseInvoiceId: pi3._id, referenceType: "PurchaseInvoice", referenceId: pi3._id, userId: adminUser._id, remarks: "Platinum 950 – PI-2026-0003", movementDate: daysAgo(20) },
    // Sales
    { inventoryType: "Product", inventoryId: prodRing1._id, action: "Sale", quantity: 1, unit: "pcs", cost: 4600, previousStock: 1, updatedStock: 0, referenceType: "Sale", referenceId: sale1._id, userId: adminUser._id, remarks: "Sold Sapphire Halo Ring – INV-2026-0001", movementDate: daysAgo(10) },
    { inventoryType: "Product", inventoryId: prodPendant._id, action: "Sale", quantity: 1, unit: "pcs", cost: 11000, previousStock: 1, updatedStock: 0, referenceType: "Sale", referenceId: sale2._id, userId: adminUser._id, remarks: "Sold Ruby Pendant – INV-2026-0002", movementDate: daysAgo(5) },
    { inventoryType: "Gemstone", inventoryId: gem3._id, action: "Sale", quantity: 1, unit: "ct", cost: emeraldPartialSell, previousStock: 5.12, updatedStock: 2.62, weight: emeraldPartialCarat, referenceType: "Sale", referenceId: sale2._id, userId: adminUser._id, remarks: "Partial sale 2.5ct Emerald – INV-2026-0002", movementDate: daysAgo(5) },
    { inventoryType: "Product", inventoryId: prodBracelet._id, action: "Sale", quantity: 1, unit: "pcs", cost: 10200, previousStock: 1, updatedStock: 0, referenceType: "Sale", referenceId: sale3._id, userId: adminUser._id, remarks: "Sold Diamond Bracelet – INV-2026-0003", movementDate: daysAgo(3) },
    // Memos
    { inventoryType: "Gemstone", inventoryId: gem3._id, action: "Release on Memo", quantity: 1, unit: "pcs", previousStock: 1, updatedStock: 1, weight: gem3.carat, referenceType: "Memo", referenceId: memo1._id, userId: adminUser._id, remarks: "Emerald sent on memo – MEM-2026-0001", movementDate: daysAgo(2) },
    { inventoryType: "Gemstone", inventoryId: gem4._id, action: "Release on Memo", quantity: 1, unit: "pcs", previousStock: 1, updatedStock: 1, weight: 2.95, referenceType: "Memo", referenceId: memo2._id, userId: adminUser._id, remarks: "Padparadscha sent on memo – MEM-2026-0002", movementDate: daysAgo(10) },
    // Production material issuance
    { inventoryType: "Material", inventoryId: materialGold._id, action: "Issue to Production", quantity: 8, unit: "g", cost: 72.5 * 8, previousStock: 250.5, updatedStock: 242.5, referenceType: "JobCard", referenceId: jobCard1._id, userId: adminUser._id, remarks: "Gold issued for JOB-2026-0001", movementDate: daysAgo(57) },
    { inventoryType: "Material", inventoryId: materialPlatinum._id, action: "Issue to Production", quantity: 10, unit: "g", cost: 32.10 * 10, previousStock: 85, updatedStock: 75, referenceType: "JobCard", referenceId: jobCard2._id, userId: adminUser._id, remarks: "Platinum issued for JOB-2026-0002", movementDate: daysAgo(10) },
  ];
  await InventoryMovement.insertMany(movements);

  // Deduct materials from stock
  materialGold.quantity = 242.5; // 250.5 - 8
  await materialGold.save();
  materialPlatinum.quantity = 75; // 85 - 10
  await materialPlatinum.save();

  console.log("✓ Seeded 15 Inventory Movements (purchases, sales, memos, production).");

  // ════════════════════════════════════════════════════════════════════════════
  // 12. INCOME & EXPENSES (for Financial Forecast)
  // ════════════════════════════════════════════════════════════════════════════
  // Incomes
  await Income.create({
    date: daysAgo(10),
    category: "Sales",
    description: "Revenue from Sapphire Halo Ring sale to Sharma Jewellers",
    amount: 4600,
    paymentMethod: "Bank Transfer",
    status: "Completed",
    reference: "INV-2026-0001",
    createdBy: adminUser._id,
  });
  await Income.create({
    date: daysAgo(5),
    category: "Sales",
    description: "Revenue from Ruby Pendant and Emerald sale to Worthington Fine Jewels",
    amount: sale2Total,
    paymentMethod: "Credit Card",
    status: "Completed",
    reference: "INV-2026-0002",
    createdBy: adminUser._id,
  });
  await Income.create({
    date: daysFromNow(15),
    category: "Services",
    description: "Custom jewellery design consultation fee – upcoming",
    amount: 1500,
    paymentMethod: "Bank Transfer",
    status: "Pending",
    reference: "SVC-2026-001",
    createdBy: adminUser._id,
  });

  // Expenses
  await Expense.create({
    date: daysAgo(20),
    category: "Materials",
    description: "Bulk metal purchase – Gold, Silver, Platinum from Chennai Gold Refinery",
    amount: metalTotal,
    paymentMethod: "Bank Transfer",
    status: "Completed",
    reference: "PI-2026-0003",
    vendor: "Chennai Gold Refinery Ltd",
    createdBy: adminUser._id,
  });
  await Expense.create({
    date: daysAgo(5),
    category: "Rent",
    description: "Workshop and showroom rent – July 2026",
    amount: 3500,
    paymentMethod: "Bank Transfer",
    status: "Completed",
    reference: "RENT-2026-07",
    vendor: "Hatton Garden Property Management",
    createdBy: adminUser._id,
  });
  await Expense.create({
    date: daysFromNow(10),
    category: "Insurance",
    description: "Quarterly inventory insurance premium – Q3 2026",
    amount: 4800,
    paymentMethod: "Bank Transfer",
    status: "Pending",
    reference: "INS-2026-Q3",
    vendor: "Lloyds Jewellers Insurance",
    createdBy: adminUser._id,
  });

  console.log("✓ Seeded 3 Incomes and 3 Expenses (completed + pending for forecast).");

  // ════════════════════════════════════════════════════════════════════════════
  // 13. AUDIT LOGS
  // ════════════════════════════════════════════════════════════════════════════
  const auditEntries = [
    { userId: adminUser._id, entity: "Product", entityId: gem1._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(45) },
    { userId: adminUser._id, entity: "Product", entityId: gem2._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(45) },
    { userId: adminUser._id, entity: "Product", entityId: gem3._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(30) },
    { userId: adminUser._id, entity: "Product", entityId: gem4._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(25) },
    { userId: adminUser._id, entity: "PurchaseInvoice", entityId: pi1._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(45) },
    { userId: adminUser._id, entity: "PurchaseInvoice", entityId: pi2._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(30) },
    { userId: adminUser._id, entity: "PurchaseInvoice", entityId: pi3._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(20) },
    { userId: adminUser._id, entity: "Sale", entityId: sale1._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(10) },
    { userId: adminUser._id, entity: "Sale", entityId: sale2._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(5) },
    { userId: adminUser._id, entity: "Sale", entityId: sale3._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(3) },
    { userId: adminUser._id, entity: "Product", entityId: gem3._id, action: "update", ipAddress: "127.0.0.1", timestamp: daysAgo(5), newValue: { carat: gem3.carat, soldCarat: gem3.soldCarat } },
    { userId: adminUser._id, entity: "Memo", entityId: memo1._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(2) },
    { userId: adminUser._id, entity: "Memo", entityId: memo2._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(10) },
    { userId: adminUser._id, entity: "JobCard", entityId: jobCard1._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(58) },
    { userId: adminUser._id, entity: "JobCard", entityId: jobCard1._id, action: "update", ipAddress: "127.0.0.1", timestamp: daysAgo(49), newValue: { status: "Completed" } },
    { userId: adminUser._id, entity: "JobCard", entityId: jobCard2._id, action: "create", ipAddress: "127.0.0.1", timestamp: daysAgo(12) },
  ];
  await AuditLog.insertMany(auditEntries);
  console.log("✓ Seeded 16 Audit Logs.");

  // ════════════════════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════════════════════
  await mongoose.disconnect();
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  Database seeding completed successfully!");
  console.log("══════════════════════════════════════════════════════");
  console.log("  Summary:");
  console.log("    • 3 Customers");
  console.log("    • 3 Suppliers");
  console.log("    • 3 Materials (Gold, Silver, Platinum)");
  console.log("    • 4 Gemstone Products");
  console.log("    • 8 Non-Gemstone Products (Ring, Necklace, Watch, Bracelet, Pendant)");
  console.log("    • 3 Purchase Invoices with Supplier Payments");
  console.log("    • 3 Sales with SaleItems and Customer Payments");
  console.log("    • 2 Memos (1 active, 1 overdue)");
  console.log("    • 2 Job Cards (1 completed, 1 in progress)");
  console.log("    • 15 Inventory Movements");
  console.log("    • 3 Income records + 3 Expense records");
  console.log("    • 16 Audit Logs");
  console.log("══════════════════════════════════════════════════════\n");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
