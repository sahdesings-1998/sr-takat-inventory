import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import Supplier from "../models/Supplier.js";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import SupplierPayment from "../models/SupplierPayment.js";
import Gemstone from "../models/Gemstone.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Payment from "../models/Payment.js";
import JobCard from "../models/JobCard.js";
import Memo from "../models/Memo.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import AuditLog from "../models/AuditLog.js";

async function runSeed() {
  console.log("[Seeder] Connecting to MongoDB database...");
  await connectDB();

  // Find or create admin user
  let adminUser = await User.findOne({ email: "admin@example.com" });
  if (!adminUser) {
    let role = await Role.findOne({ name: "Admin" });
    if (!role) {
      role = await Role.create({ name: "Admin", description: "Full Administrator" });
    }
    adminUser = await User.create({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "$2a$10$wT2W12QzG4sJ51z4z2z2zO1234567890123456789012345678901",
      roleId: role._id,
      isVerified: true,
    });
  }

  console.log("[Seeder] Clearing previous sample operational data...");
  await Promise.all([
    Supplier.deleteMany({}),
    PurchaseInvoice.deleteMany({}),
    SupplierPayment.deleteMany({}),
    Gemstone.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Sale.deleteMany({}),
    SaleItem.deleteMany({}),
    Payment.deleteMany({}),
    JobCard.deleteMany({}),
    Memo.deleteMany({}),
    Income.deleteMany({}),
    Expense.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log("[Seeder] Step 1: Creating 4 Suppliers...");
  const supplier1 = await Supplier.create({
    companyName: "Royal Gems International",
    contactName: "Sanjeewa Fernando",
    email: "sanjeewa@royalgems.lk",
    phone: "+94 11 234 5678",
    address: "32 Galle Road, Colombo, Sri Lanka",
    paymentTerms: "Net 30",
    status: "active",
  });

  const supplier2 = await Supplier.create({
    companyName: "Swiss Horology Imports Ltd",
    contactName: "Jean-Luc Piccard",
    email: "orders@swisshorology.ch",
    phone: "+41 22 789 0123",
    address: "Rue du Rhone 42, Geneva, Switzerland",
    paymentTerms: "Net 15",
    status: "active",
  });

  const supplier3 = await Supplier.create({
    companyName: "Burma Gemstone Miners Co.",
    contactName: "Aung San Lin",
    email: "aungsan@burmagems.mm",
    phone: "+95 1 543 210",
    address: "No. 18 Mogok Road, Mandalay, Myanmar",
    paymentTerms: "Net 45",
    status: "active",
  });

  const supplier4 = await Supplier.create({
    companyName: "Antwerp Diamond Consortium",
    contactName: "Pieter Van Der Berg",
    email: "pieter@antwerpdiamonds.be",
    phone: "+32 3 225 1100",
    address: "Hoveniersstraat 12, Antwerp, Belgium",
    paymentTerms: "Net 30",
    status: "active",
  });

  console.log("[Seeder] Step 2: Creating 4 Purchase Invoices...");
  const purchaseInv1 = await PurchaseInvoice.create({
    invoiceNumber: "PINV-2026-101",
    supplierInvoiceNumber: "RGI-2026-8801",
    supplierId: supplier1._id,
    purchaseDate: new Date("2026-07-01"),
    invoiceDate: new Date("2026-07-01"),
    dueDate: new Date("2026-07-31"),
    status: "Confirmed",
    paymentStatus: "Partially Paid",
    items: [
      {
        inventoryType: "Gemstone",
        name: "5.20ct Royal Ceylon Blue Sapphire",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 4500,
        tax: 0,
        discount: 0,
        totalAmount: 4500,
      },
      {
        inventoryType: "Gemstone",
        name: "3.80ct Padparadscha Sapphire",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 3000,
        tax: 0,
        discount: 0,
        totalAmount: 3000,
      },
      {
        inventoryType: "Material",
        name: "18K Gold Alloy Grain",
        itemType: "Material",
        quantity: 100,
        unit: "g",
        purchasePrice: 50,
        tax: 0,
        discount: 0,
        totalAmount: 5000,
      },
    ],
    subtotal: 12500,
    finalTotal: 12500,
    paidAmount: 8500,
    outstandingBalance: 4000,
    notes: "Direct import of fine Ceylon sapphires and gold alloy",
    createdBy: adminUser._id,
  });

  const purchaseInv2 = await PurchaseInvoice.create({
    invoiceNumber: "PINV-2026-102",
    supplierInvoiceNumber: "SHI-9942",
    supplierId: supplier2._id,
    purchaseDate: new Date("2026-07-05"),
    invoiceDate: new Date("2026-07-05"),
    dueDate: new Date("2026-07-20"),
    status: "Confirmed",
    paymentStatus: "Paid",
    items: [
      {
        inventoryType: "Product",
        name: "Geneva Classic Tourbillon Automatic 42mm",
        itemType: "Watch",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 7500,
        tax: 0,
        discount: 0,
        totalAmount: 7500,
      },
      {
        inventoryType: "Product",
        name: "Heritage Chronograph Rose Gold",
        itemType: "Watch",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 6000,
        tax: 0,
        discount: 0,
        totalAmount: 6000,
      },
      {
        inventoryType: "Product",
        name: "Submariner Marine Master Steel",
        itemType: "Watch",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 4500,
        tax: 0,
        discount: 0,
        totalAmount: 4500,
      },
    ],
    subtotal: 18000,
    finalTotal: 18000,
    paidAmount: 18000,
    outstandingBalance: 0,
    notes: "Swiss luxury watch import shipment",
    createdBy: adminUser._id,
  });

  const purchaseInv3 = await PurchaseInvoice.create({
    invoiceNumber: "PINV-2026-103",
    supplierInvoiceNumber: "BGM-7711",
    supplierId: supplier3._id,
    purchaseDate: new Date("2026-07-10"),
    invoiceDate: new Date("2026-07-10"),
    dueDate: new Date("2026-08-25"),
    status: "Confirmed",
    paymentStatus: "Partially Paid",
    items: [
      {
        inventoryType: "Gemstone",
        name: "4.15ct Burma Pigeon Blood Ruby",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 8000,
        tax: 0,
        discount: 0,
        totalAmount: 8000,
      },
      {
        inventoryType: "Gemstone",
        name: "6.30ct Colombian Emerald Octagon",
        itemType: "Gemstone",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 6000,
        tax: 0,
        discount: 0,
        totalAmount: 6000,
      },
    ],
    subtotal: 14000,
    finalTotal: 14000,
    paidAmount: 7000,
    outstandingBalance: 7000,
    notes: "Unheated rubies and Colombian emerald stones",
    createdBy: adminUser._id,
  });

  const purchaseInv4 = await PurchaseInvoice.create({
    invoiceNumber: "PINV-2026-104",
    supplierInvoiceNumber: "ADC-5520",
    supplierId: supplier4._id,
    purchaseDate: new Date("2026-07-12"),
    invoiceDate: new Date("2026-07-12"),
    dueDate: new Date("2026-08-12"),
    status: "Confirmed",
    paymentStatus: "Paid",
    items: [
      {
        inventoryType: "Product",
        name: "Diamond Tennis Bracelet 18K Yellow Gold",
        itemType: "Jewellery",
        quantity: 1,
        unit: "pcs",
        purchasePrice: 5500,
        tax: 0,
        discount: 0,
        totalAmount: 5500,
      },
      {
        inventoryType: "Material",
        name: "Parcel of VVS Round Melee Diamonds (10.5ctw)",
        itemType: "Material",
        quantity: 1,
        unit: "lot",
        purchasePrice: 3700,
        tax: 0,
        discount: 0,
        totalAmount: 3700,
      },
    ],
    subtotal: 9200,
    finalTotal: 9200,
    paidAmount: 9200,
    outstandingBalance: 0,
    notes: "Antwerp diamond parcel and finished tennis bracelet",
    createdBy: adminUser._id,
  });

  console.log("[Seeder] Step 3: Recording Supplier Payments...");
  await SupplierPayment.create({
    paymentNo: "SPAY-2026-001",
    supplierId: supplier1._id,
    purchaseInvoiceId: purchaseInv1._id,
    amount: 8500,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date("2026-07-02"),
    notes: "Initial 68% payment for sapphire import",
    createdBy: adminUser._id,
  });

  await SupplierPayment.create({
    paymentNo: "SPAY-2026-002",
    supplierId: supplier2._id,
    purchaseInvoiceId: purchaseInv2._id,
    amount: 18000,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date("2026-07-06"),
    notes: "Full advance payment for Swiss horology order",
    createdBy: adminUser._id,
  });

  await SupplierPayment.create({
    paymentNo: "SPAY-2026-003",
    supplierId: supplier3._id,
    purchaseInvoiceId: purchaseInv3._id,
    amount: 7000,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date("2026-07-11"),
    notes: "50% deposit on ruby and emerald lot",
    createdBy: adminUser._id,
  });

  await SupplierPayment.create({
    paymentNo: "SPAY-2026-004",
    supplierId: supplier4._id,
    purchaseInvoiceId: purchaseInv4._id,
    amount: 9200,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date("2026-07-13"),
    notes: "Full payment upon delivery of diamond parcel",
    createdBy: adminUser._id,
  });

  console.log("[Seeder] Step 4: Creating 4 Gemstones...");
  const gemstone1 = await Gemstone.create({
    stoneId: "GEM-2026-0101",
    stockNo: "STK-GEM-0101",
    gemstone: "5.20ct Royal Ceylon Blue Sapphire",
    shape: "Oval",
    carat: 5.2,
    dimensions: "10.5x8.8x5.4 mm",
    color: "Vivid Royal Blue",
    clarity: "VVS1",
    origin: "Ceylon",
    treatment: "Heated",
    purchasePrice: 4500,
    costPerCarat: 4500 / 5.2,
    supplierId: supplier1._id,
    purchaseInvoiceId: purchaseInv1._id,
    createdBy: adminUser._id,
    location: "Safe-A Vault",
    status: "In Stock",
  });

  const gemstone2 = await Gemstone.create({
    stoneId: "GEM-2026-0102",
    stockNo: "STK-GEM-0102",
    gemstone: "3.80ct Padparadscha Sapphire",
    shape: "Cushion",
    carat: 3.8,
    dimensions: "8.9x7.6x4.8 mm",
    color: "Pinkish Orange",
    clarity: "Eye Clean",
    origin: "Ceylon",
    treatment: "None",
    purchasePrice: 3000,
    costPerCarat: 3000 / 3.8,
    supplierId: supplier1._id,
    purchaseInvoiceId: purchaseInv1._id,
    createdBy: adminUser._id,
    location: "Safe-A Vault",
    status: "In Stock",
  });

  const gemstone3 = await Gemstone.create({
    stoneId: "GEM-2026-0301",
    stockNo: "STK-GEM-0301",
    gemstone: "4.15ct Burma Pigeon Blood Ruby",
    shape: "Oval",
    carat: 4.15,
    dimensions: "9.8x8.1x5.0 mm",
    color: "Pigeon Blood Red",
    clarity: "Minor Inclusions",
    origin: "Burma",
    treatment: "None",
    purchasePrice: 8000,
    costPerCarat: 8000 / 4.15,
    supplierId: supplier3._id,
    purchaseInvoiceId: purchaseInv3._id,
    createdBy: adminUser._id,
    location: "Safe-B Vault",
    status: "On Memo",
  });

  const gemstone4 = await Gemstone.create({
    stoneId: "GEM-2026-0302",
    stockNo: "STK-GEM-0302",
    gemstone: "6.30ct Colombian Emerald",
    shape: "Octagon",
    carat: 6.3,
    dimensions: "12.1x9.8x6.2 mm",
    color: "Vivid Emerald Green",
    clarity: "Minor Oil",
    origin: "Colombia",
    treatment: "Minor Oil",
    purchasePrice: 6000,
    costPerCarat: 6000 / 6.3,
    supplierId: supplier3._id,
    purchaseInvoiceId: purchaseInv3._id,
    createdBy: adminUser._id,
    location: "Safe-B Vault",
    status: "In Stock",
  });

  console.log("[Seeder] Step 5: Creating 4 Products...");
  const product1 = await Product.create({
    productCode: "PROD-2026-0101",
    stockNo: "STK-RING-101",
    name: "Royal Ceylon Sapphire & Diamond Halo Ring",
    category: "Ring",
    metalType: "Gold 18K White",
    metalWeight: 6.2,
    size: "6.5",
    purchasePrice: 5200,
    costPrice: 5200,
    sellingPrice: 8500,
    charityAmount: 66,
    grossProfit: 3300,
    netProfit: 3234,
    status: "Sold",
    quantity: 0,
    stockQuantity: 0,
    availableQuantity: 0,
    soldQuantity: 1,
    supplier: supplier1.companyName,
    imageUrls: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80"],
  });

  const product2 = await Product.create({
    productCode: "PROD-2026-0201",
    stockNo: "STK-WTC-201",
    name: "Geneva Classic Tourbillon Automatic 42mm",
    category: "Watch",
    metalType: "Stainless Steel 316L",
    brand: "Geneva Horology",
    model: "Tourbillon Heritage",
    purchasePrice: 7500,
    costPrice: 7500,
    sellingPrice: 12500,
    charityAmount: 100,
    grossProfit: 5000,
    netProfit: 4900,
    status: "Sold",
    quantity: 0,
    stockQuantity: 0,
    availableQuantity: 0,
    soldQuantity: 1,
    supplier: supplier2.companyName,
    imageUrls: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"],
  });

  const product3 = await Product.create({
    productCode: "PROD-2026-0301",
    stockNo: "STK-EMR-301",
    name: "Vivid Emerald & Platinum Drop Earrings",
    category: "Earrings",
    metalType: "Platinum 950",
    metalWeight: 8.5,
    purchasePrice: 6800,
    costPrice: 6800,
    sellingPrice: 11500,
    charityAmount: 94,
    grossProfit: 4700,
    netProfit: 4606,
    status: "In Stock",
    quantity: 1,
    stockQuantity: 1,
    availableQuantity: 1,
    soldQuantity: 0,
    supplier: supplier3.companyName,
    imageUrls: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"],
  });

  const product4 = await Product.create({
    productCode: "PROD-2026-0401",
    stockNo: "STK-BRC-401",
    name: "Diamond Tennis Bracelet 18K Yellow Gold",
    category: "Bracelet",
    metalType: "Gold 18K Yellow",
    metalWeight: 14.8,
    purchasePrice: 5500,
    costPrice: 5500,
    sellingPrice: 9200,
    charityAmount: 74,
    grossProfit: 3700,
    netProfit: 3626,
    status: "In Stock",
    quantity: 1,
    stockQuantity: 1,
    availableQuantity: 1,
    soldQuantity: 0,
    supplier: supplier4.companyName,
    imageUrls: ["https://images.unsplash.com/photo-1611591475777-233cd7322084?w=800&auto=format&fit=crop&q=80"],
  });

  console.log("[Seeder] Step 6: Creating 4 Customers...");
  const customer1 = await Customer.create({
    fullName: "Eleanor Vance",
    companyName: "Prestige Fine Jewellery Co.",
    email: "eleanor@prestigejewels.com",
    phone: "+1 212 555 0192",
    address: "740 Fifth Avenue, New York, NY 10019",
  });

  const customer2 = await Customer.create({
    fullName: "Lord Marcus Sterling",
    companyName: "Sterling Private Holdings",
    email: "marcus@sterlingholdings.co.uk",
    phone: "+44 20 7946 0912",
    address: "14 Mayfair Square, London W1J 8AJ",
  });

  const customer3 = await Customer.create({
    fullName: "Charles Montgomery",
    companyName: "Emperor Diamond House",
    email: "charles@emperordiamonds.com",
    phone: "+33 1 42 68 55 00",
    address: "26 Place Vendome, 75001 Paris, France",
  });

  const customer4 = await Customer.create({
    fullName: "Sophia Laurent",
    companyName: "Victoria & Albert Artisans",
    email: "sophia@va-artisans.com",
    phone: "+1 310 555 0144",
    address: "9600 Wilshire Blvd, Beverly Hills, CA 90212",
  });

  console.log("[Seeder] Step 7: Creating 4 Sales Invoices...");
  const sale1 = await Sale.create({
    invoiceNo: "INV-2026-0101",
    customerId: customer1._id,
    subtotal: 8500,
    discount: 0,
    tax: 0,
    total: 8500,
    amountPaid: 5000,
    balanceDue: 3500,
    paymentStatus: "Partially Paid",
    dueDate: new Date("2026-08-15"),
    charityPercentage: 2,
    charityAmount: 66,
    grossProfit: 3300,
    netProfit: 3234,
    paymentMethod: "Bank Transfer",
    notes: "Sale of Royal Sapphire Halo Ring",
    createdBy: adminUser._id,
    createdAt: new Date("2026-07-15"),
  });

  await SaleItem.create({
    saleId: sale1._id,
    inventoryType: "Product",
    inventoryId: product1._id,
    quantity: 1,
    sellingPrice: 8500,
  });

  const sale2 = await Sale.create({
    invoiceNo: "INV-2026-0102",
    customerId: customer2._id,
    subtotal: 12500,
    discount: 0,
    tax: 0,
    total: 12500,
    amountPaid: 12500,
    balanceDue: 0,
    paymentStatus: "Paid",
    charityPercentage: 2,
    charityAmount: 100,
    grossProfit: 5000,
    netProfit: 4900,
    paymentMethod: "Bank Transfer",
    notes: "Full payment for Geneva Classic Tourbillon Automatic",
    createdBy: adminUser._id,
    createdAt: new Date("2026-07-18"),
  });

  await SaleItem.create({
    saleId: sale2._id,
    inventoryType: "Product",
    inventoryId: product2._id,
    quantity: 1,
    sellingPrice: 12500,
  });

  const sale3 = await Sale.create({
    invoiceNo: "INV-2026-0103",
    customerId: customer3._id,
    subtotal: 11500,
    discount: 0,
    tax: 0,
    total: 11500,
    amountPaid: 6500,
    balanceDue: 5000,
    paymentStatus: "Partially Paid",
    dueDate: new Date("2026-08-20"),
    charityPercentage: 2,
    charityAmount: 94,
    grossProfit: 4700,
    netProfit: 4606,
    paymentMethod: "Credit Card",
    notes: "Vivid Emerald Drop Earrings initial payment",
    createdBy: adminUser._id,
    createdAt: new Date("2026-07-20"),
  });

  await SaleItem.create({
    saleId: sale3._id,
    inventoryType: "Product",
    inventoryId: product3._id,
    quantity: 1,
    sellingPrice: 11500,
  });

  const sale4 = await Sale.create({
    invoiceNo: "INV-2026-0104",
    customerId: customer4._id,
    subtotal: 9200,
    discount: 0,
    tax: 0,
    total: 9200,
    amountPaid: 9200,
    balanceDue: 0,
    paymentStatus: "Paid",
    charityPercentage: 2,
    charityAmount: 74,
    grossProfit: 3700,
    netProfit: 3626,
    paymentMethod: "Cheque",
    notes: "Diamond Tennis Bracelet complete sale",
    createdBy: adminUser._id,
    createdAt: new Date("2026-07-22"),
  });

  await SaleItem.create({
    saleId: sale4._id,
    inventoryType: "Product",
    inventoryId: product4._id,
    quantity: 1,
    sellingPrice: 9200,
  });

  console.log("[Seeder] Step 8: Recording Customer Payments...");
  await Payment.create({
    paymentId: "PAY-2026-001",
    saleId: sale1._id,
    invoiceNo: sale1.invoiceNo,
    customerId: customer1._id,
    amount: 5000,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date("2026-07-16"),
    notes: "Partial payment via wire transfer",
    createdBy: adminUser._id,
  });

  await Payment.create({
    paymentId: "PAY-2026-002",
    saleId: sale2._id,
    invoiceNo: sale2.invoiceNo,
    customerId: customer2._id,
    amount: 12500,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date("2026-07-18"),
    notes: "Full payment received",
    createdBy: adminUser._id,
  });

  await Payment.create({
    paymentId: "PAY-2026-003",
    saleId: sale3._id,
    invoiceNo: sale3.invoiceNo,
    customerId: customer3._id,
    amount: 6500,
    paymentMethod: "Credit Card",
    paymentDate: new Date("2026-07-21"),
    notes: "Credit card deposit for emerald earrings",
    createdBy: adminUser._id,
  });

  await Payment.create({
    paymentId: "PAY-2026-004",
    saleId: sale4._id,
    invoiceNo: sale4.invoiceNo,
    customerId: customer4._id,
    amount: 9200,
    paymentMethod: "Cheque",
    paymentDate: new Date("2026-07-23"),
    notes: "Cheque cleared in full",
    createdBy: adminUser._id,
  });

  console.log("[Seeder] Step 9: Creating 2 Job Cards (Production)...");
  await JobCard.create({
    jobNo: "JOB-2026-0101",
    productType: "Ring",
    productId: product1._id,
    assignedTo: adminUser._id,
    expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "In Progress",
    productionStages: [
      { stageName: "Design", status: "Completed", notes: "Approved by master jeweler" },
      { stageName: "Materials Issued", status: "Completed", notes: "Gold issued" },
      { stageName: "Stone Setting", status: "In Progress", notes: "Micro-prong setting in progress" },
      { stageName: "QC", status: "Pending", notes: "Awaiting final hallmarking" },
    ],
    createdBy: adminUser._id,
  });

  await JobCard.create({
    jobNo: "JOB-2026-0201",
    productType: "Bracelet",
    productId: product4._id,
    assignedTo: adminUser._id,
    expectedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "Completed",
    productionStages: [
      { stageName: "Manufacturing", status: "Completed", notes: "All 52 links articulated" },
      { stageName: "Stone Setting", status: "Completed", notes: "Tested under 10x loupe" },
      { stageName: "Polishing", status: "Completed", notes: "Mirror finish verified" },
    ],
    createdBy: adminUser._id,
  });

  console.log("[Seeder] Step 10: Creating 2 Memos / Consignments...");
  const memo1 = await Memo.create({
    memoNo: "MEM-2026-001",
    customerId: customer3._id,
    customerName: customer3.fullName,
    value: 1,
    expectedReturn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "With Client",
    items: [
      {
        inventoryType: "Gemstone",
        inventoryId: gemstone3._id,
        quantity: 1,
        carat: 4.15,
        status: "On Memo",
      },
    ],
    remarks: "Consigned to Emperor Diamond House for Paris private client viewing",
    createdBy: adminUser._id,
  });

  await Memo.create({
    memoNo: "MEM-2026-002",
    customerId: customer2._id,
    customerName: customer2.fullName,
    value: 1,
    expectedReturn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
    status: "Overdue",
    items: [
      {
        inventoryType: "Product",
        inventoryId: product3._id,
        quantity: 1,
        carat: 0,
        status: "On Memo",
      },
    ],
    remarks: "Consigned to Lord Sterling for London exhibition selection",
    createdBy: adminUser._id,
  });

  console.log("[Seeder] Step 11: Creating Income & Expense Records...");
  await Income.create({
    date: new Date("2026-07-16"),
    category: "Services",
    description: "VIP Gemological Certification & Appraisal Service",
    amount: 850,
    paymentMethod: "Bank Transfer",
    notes: "Certificate issued for 5ct sapphire",
    createdBy: adminUser._id,
  });

  await Income.create({
    date: new Date("2026-07-22"),
    category: "Services",
    description: "Custom Bespoke Ring Design Consultation Fee",
    amount: 1200,
    paymentMethod: "Credit Card",
    notes: "Design fee for custom pendant order",
    createdBy: adminUser._id,
  });

  await Expense.create({
    date: new Date("2026-07-08"),
    category: "Materials",
    description: "Workshop Platinum & Gold Casting Supplies",
    amount: 1450,
    paymentMethod: "Bank Transfer",
    notes: "Crucibles, flux, and casting investment powder",
    createdBy: adminUser._id,
  });

  await Expense.create({
    date: new Date("2026-07-14"),
    category: "Maintenance",
    description: "Safe & High-Security Vault Monthly Maintenance",
    amount: 800,
    paymentMethod: "Bank Transfer",
    notes: "Annual Biometric Vault Audit",
    createdBy: adminUser._id,
  });

  console.log("[Seeder] Step 12: Creating Audit Log Entries...");
  await AuditLog.create({
    userId: adminUser._id,
    action: "create",
    entity: "PurchaseInvoice",
    entityId: purchaseInv1._id,
    ipAddress: "127.0.0.1",
    timestamp: new Date("2026-07-01T10:30:00Z"),
  });

  await AuditLog.create({
    userId: adminUser._id,
    action: "create",
    entity: "Sale",
    entityId: sale1._id,
    ipAddress: "127.0.0.1",
    timestamp: new Date("2026-07-15T14:20:00Z"),
  });

  await AuditLog.create({
    userId: adminUser._id,
    action: "create",
    entity: "Memo",
    entityId: memo1._id,
    ipAddress: "127.0.0.1",
    timestamp: new Date("2026-07-20T11:00:00Z"),
  });

  console.log("\n========================================================");
  console.log("[Seeder SUCCESS] All 4 realistic relational datasets seeded!");
  console.log("Summary:");
  console.log("  - 4 Suppliers created");
  console.log("  - 4 Purchase Invoices created ($53,700 total purchases)");
  console.log("  - 4 Supplier Payments recorded ($42,700 total paid, $11,000 outstanding)");
  console.log("  - 4 Gemstones created");
  console.log("  - 4 Products created ($41,700 total value)");
  console.log("  - 4 Customers created");
  console.log("  - 4 Sales Invoices created ($41,700 total sales)");
  console.log("  - 4 Customer Payments recorded ($33,200 paid, $8,500 outstanding)");
  console.log("  - 2 Job Cards created (1 In Progress, 1 Completed)");
  console.log("  - 2 Memos created (1 Active With Client, 1 Overdue)");
  console.log("  - 2 Income Records created ($2,050 total service income)");
  console.log("  - 2 Expense Records created ($2,250 total expenses)");
  console.log("========================================================\n");

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error("[Seeder ERROR] Failed to seed data:", err);
  process.exit(1);
});
