import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import productService from "./services/productService.js";
import Product from "./models/Product.js";

async function seed() {
  await connectDB();

  console.log("Connected to database. Inserting 2 sample products via productService...");

  const sampleProducts = [
    {
      stockNo: "STK-90001",
      category: "Jewellery",
      name: "Royal Colombian Emerald & Diamond Platinum Ring",
      sku: "STK-JEW-STK-90001",
      barcode: "890000090001",
      qrCode: "QR-STK-90001",
      subCategory: "Solitaire Ring",
      brand: "SR Takat Atelier",
      model: "R-ROYAL-2026",
      productCollection: "Royal Heritage 2026",
      description: "Exquisite 4.52ct natural Colombian emerald ring crafted in pure platinum with F VVS1 side diamonds.",
      shortDescription: "4.52ct Colombian Emerald Platinum Ring",
      status: "Available",
      purchasePrice: 15000,
      additionalCost: 1200,
      totalCost: 16200,
      costPrice: 16200,
      sellingPrice: 28500,
      minimumSellingPrice: 25000,
      wholesalePrice: 22000,
      retailPrice: 28500,
      currency: "USD",
      discountAllowed: true,
      profit: 12300,
      margin: 43.15,
      weight: "14.8g",
      dimensions: "18mm x 14mm x 6mm",
      metalType: "Platinum",
      goldPurity: "N/A",
      gemstoneType: "Emerald",
      variety: "Colombian",
      origin: "Muzo, Colombia",
      shape: "Emerald Cut",
      cut: "Excellent",
      colour: "Vivid Green",
      clarity: "Minor Oil",
      totalCarat: 4.52,
      pieces: 1,
      certificateAvailable: true,
      laboratory: "GRS",
      certificateNumber: "GRS-2026-9041",
      certificateCost: 450,
      warehouse: "Main Vault - HK",
      location: "Vault A, Safe 2",
      shelf: "Shelf A-1",
      quantity: 1,
      minimumStock: 1,
      maximumStock: 5,
      reorderLevel: 1,
      supplier: "Emerald World Mining Co.",
      supplierReference: "SUP-EM-882",
      purchaseDate: "2026-06-15",
      paymentStatus: "Paid",
      outstandingAmount: 0,
      internalNotes: "Verified natural emerald with GRS cert.",
      tags: ["emerald", "platinum", "solitaire", "colombia"],
      components: [
        { name: "4.52ct Colombian Emerald", quantity: 1, unitCost: 12000 },
        { name: "Platinum 950 Mounting", quantity: 1, unitCost: 3000 },
        { name: "0.50ct Diamond Side Stones", quantity: 2, unitCost: 600 }
      ],
      imageUrls: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop"
      ]
    },
    {
      stockNo: "STK-90002",
      category: "Watch",
      name: "Chronometer Heritage Automatic Watch",
      sku: "STK-WAT-STK-90002",
      barcode: "890000090002",
      qrCode: "QR-STK-90002",
      subCategory: "Luxury Watch",
      brand: "Geneva Craft",
      model: "Chronos Heritage 2026",
      productCollection: "Master Complications",
      description: "Self-winding automatic movement chronometer, 18K rose gold case with sapphire crystal exhibition caseback.",
      shortDescription: "18K Rose Gold Automatic Chronometer Watch",
      status: "Available",
      purchasePrice: 22000,
      additionalCost: 1500,
      totalCost: 23500,
      costPrice: 23500,
      sellingPrice: 39000,
      minimumSellingPrice: 35000,
      wholesalePrice: 31000,
      retailPrice: 39000,
      currency: "USD",
      discountAllowed: true,
      profit: 15500,
      margin: 39.74,
      material: "18K Rose Gold",
      dimensions: "41mm x 11.5mm",
      countryOfOrigin: "Switzerland",
      manufacturedBy: "Geneva Atelier",
      certificateAvailable: true,
      laboratory: "In-House",
      certificateNumber: "CHRONO-CH-2026",
      warehouse: "Dubai Showroom",
      location: "Display Case 4",
      shelf: "Shelf B-2",
      quantity: 1,
      minimumStock: 1,
      maximumStock: 3,
      reorderLevel: 1,
      supplier: "Swiss Precision Timepieces",
      supplierReference: "SUP-WAT-991",
      purchaseDate: "2026-07-01",
      paymentStatus: "Paid",
      outstandingAmount: 0,
      internalNotes: "Includes box, COSC cert, and warranty card.",
      tags: ["watch", "automatic", "rosegold", "swiss"],
      components: [
        { name: "Swiss Automatic Movement Caliber 700", quantity: 1, unitCost: 15000 },
        { name: "18K Rose Gold Case & Bezel", quantity: 1, unitCost: 7000 },
        { name: "Alligator Leather Strap & Clasp", quantity: 1, unitCost: 1500 }
      ],
      imageUrls: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop"
      ]
    }
  ];

  for (const prodData of sampleProducts) {
    const existing = await Product.findOne({ stockNo: prodData.stockNo });
    if (existing) {
      console.log(`Product ${prodData.stockNo} already exists.`);
    } else {
      const created = await productService.createProduct(prodData, "SystemSeed");
      console.log(`Successfully created product: ${created.productCode} (${created.stockNo}) - ${created.name}`);
    }
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
