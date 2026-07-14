import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Gemstone from "../models/Gemstone.js";
import Material from "../models/Material.js";
import Product from "../models/Product.js";
import JobCard from "../models/JobCard.js";
import Memo from "../models/Memo.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import AuditLog from "../models/AuditLog.js";

async function seed() {
  await connectDB();

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

  // Clear existing operational data
  await Customer.deleteMany({});
  await Supplier.deleteMany({});
  await Gemstone.deleteMany({});
  await Material.deleteMany({});
  await Product.deleteMany({});
  await JobCard.deleteMany({});
  await Memo.deleteMany({});
  await Sale.deleteMany({});
  await SaleItem.deleteMany({});
  await AuditLog.deleteMany({});

  console.log("Cleared old operational data.");

  // 1. Customers
  const customer1 = await Customer.create({
    fullName: "Abishek Sharma",
    email: "abishek@example.com",
    phone: "+91 98765 43210",
    address: "12, Park Street, Kolkata, India",
    companyName: "Sharma Jewellers Ltd",
  });
  const customer2 = await Customer.create({
    fullName: "Priya Patel",
    email: "priya@example.com",
    phone: "+91 99988 77766",
    address: "Block B-402, Satellite, Ahmedabad, India",
  });
  console.log("Seeded Customers.");

  // 2. Suppliers
  const supplier1 = await Supplier.create({
    companyName: "Alrosa Gem Distributors",
    contactName: "Dmitry Ivanov",
    email: "dmitry@alrosa-gems.com",
    phone: "+7 912 345-67-89",
    address: "Moscow, Russia",
    paymentTerms: "Net 30",
  });
  const supplier2 = await Supplier.create({
    companyName: "Chennai Gold Refinery Ltd",
    contactName: "K. Ranganathan",
    email: "contact@chennaigoldref.in",
    phone: "+91 44 2468 1357",
    address: "T. Nagar, Chennai, India",
  });
  console.log("Seeded Suppliers.");

  // 3. Materials
  const materialGold = await Material.create({
    materialCode: "MET-AU-24K",
    materialName: "Gold 24K Fine",
    category: "Gold",
    quantity: 250.5,
    unit: "g",
    cost: 72.5,
  });
  const materialSilver = await Material.create({
    materialCode: "MET-AG-925",
    materialName: "Sterling Silver 925",
    category: "Silver",
    quantity: 1500,
    unit: "g",
    cost: 0.95,
  });
  console.log("Seeded Materials.");

  // 4. Gemstones
  const gemstone1 = await Gemstone.create({
    stoneId: "GEM-2026-0001",
    stockNo: "STK-GEM-0001",
    gemstone: "Natural Blue Sapphire",
    shape: "Oval",
    carat: 4.85,
    dimensions: "10.2x8.5x5.1 mm",
    color: "Royal Blue",
    clarity: "Eye Clean",
    origin: "Ceylon",
    treatment: "Heated",
    purchasePrice: 2400,
    costPerCarat: 2400 / 4.85,
    supplierId: supplier1._id,
    createdBy: adminUser._id,
    location: "Safe-A",
    status: "In Stock",
  });

  const gemstone2 = await Gemstone.create({
    stoneId: "GEM-2026-0002",
    stockNo: "STK-GEM-0002",
    gemstone: "Unheated Pigeon Blood Ruby",
    shape: "Cushion",
    carat: 3.2,
    dimensions: "8.4x7.2x4.5 mm",
    color: "Pigeon Blood Red",
    clarity: "Slight Inclusions",
    origin: "Burma",
    treatment: "None",
    purchasePrice: 5800,
    costPerCarat: 5800 / 3.2,
    supplierId: supplier1._id,
    createdBy: adminUser._id,
    location: "Safe-A",
    status: "In Stock",
  });

  const gemstone3 = await Gemstone.create({
    stoneId: "GEM-2026-0003",
    stockNo: "STK-GEM-0003",
    gemstone: "Emerald Octagon Step Cut",
    shape: "Octagon",
    carat: 5.12,
    dimensions: "11.5x9.1x6.0 mm",
    color: "Vivid Green",
    clarity: "Minor Inclusions",
    origin: "Colombia",
    treatment: "Insignificant Oil",
    purchasePrice: 9500,
    costPerCarat: 9500 / 5.12,
    supplierId: supplier2._id,
    createdBy: adminUser._id,
    location: "Safe-B",
    status: "On Memo",
  });

  console.log("Seeded Gemstones.");

  // 5. Products
  const product1 = await Product.create({
    productCode: "PROD-2026-0001",
    stockNo: "STK-1001",
    name: "Classic Sapphire Halo Ring",
    category: "Ring",
    metalType: "Gold 18K White",
    metalWeight: 5.4,
    size: "6.5",
    purchasePrice: 2800,
    costPrice: 3200,
    sellingPrice: 4800,
    charityPercentage: 2,
    charityAmount: 96,
    grossProfit: 1600,
    netProfit: 1504,
    status: "In Stock",
  });

  const product2 = await Product.create({
    productCode: "PROD-2026-0002",
    stockNo: "STK-1002",
    name: "Royal Cushion Ruby Pendant",
    category: "Pendant",
    metalType: "Platinum 950",
    metalWeight: 7.2,
    purchasePrice: 6500,
    costPrice: 7200,
    sellingPrice: 11000,
    charityPercentage: 2,
    charityAmount: 220,
    grossProfit: 3800,
    netProfit: 3580,
    status: "In Stock",
  });

  console.log("Seeded Products.");

  // 6. Job Cards
  const jobCard = await JobCard.create({
    jobNo: "JOB-2026-0001",
    productId: product1._id,
    assignedTo: adminUser._id,
    expectedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: "In Progress",
    productionStages: [
      { stageName: "Design", status: "Completed", notes: "CAD model finalized" },
      { stageName: "Materials Issued", status: "Completed", notes: "Gold issued" },
      { stageName: "Manufacturing", status: "In Progress", notes: "Melting white gold" },
    ],
    materialsIssued: [
      { materialId: materialGold._id, quantity: 15, issuedAt: new Date(), issuedBy: adminUser._id },
    ],
  });
  console.log("Seeded Job Cards.");

  // 7. Memos
  const memo = await Memo.create({
    memoNo: "MEM-2026-0001",
    customerId: customer1._id,
    expectedReturn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "With Client",
    items: [
      {
        inventoryType: "Gemstone",
        inventoryId: gemstone3._id,
        quantity: 1,
        status: "On Memo",
      },
    ],
    remarks: "Consigned to client for review.",
    createdBy: adminUser._id,
  });
  console.log("Seeded Memos.");

  // 8. Sales
  const sale1 = await Sale.create({
    invoiceNo: "INV-2026-0001",
    customerId: customer1._id,
    subtotal: 4800,
    discount: 200,
    tax: 0,
    total: 4600,
    charityPercentage: 2,
    charityAmount: 92,
    grossProfit: 1400,
    netProfit: 1308,
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    createdBy: adminUser._id,
  });

  const saleItem1 = await SaleItem.create({
    saleId: sale1._id,
    inventoryType: "Product",
    inventoryId: product1._id,
    quantity: 1,
    sellingPrice: 4800,
  });

  console.log("Seeded Sales Invoices.");

  // 9. Audit Logs
  const users = await User.find({});
  adminUser = users.find((u) => u.email.includes("admin")) || users[0] || null;

  await AuditLog.create({
    userId: adminUser?._id || null,
    action: "create",
    entity: "Product",
    entityId: product1._id.toString(),
    ipAddress: "127.0.0.1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });

  await AuditLog.create({
    userId: adminUser?._id || null,
    action: "update",
    entity: "JobCard",
    entityId: jobCard._id.toString(),
    ipAddress: "127.0.0.1",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  });

  console.log("Seeded Audit Logs.");

  await mongoose.disconnect();
  console.log("Operational database seeding completed successfully!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
