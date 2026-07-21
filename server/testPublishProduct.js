import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import productService from "./services/productService.js";
import User from "./models/User.js";

async function testPublish() {
  await connectDB();

  // Find any existing admin/user in DB
  const user = await User.findOne();
  if (!user) {
    console.error("No user found in DB. Run seed first.");
    process.exit(1);
  }

  console.log(`Found user: ${user.fullName} (${user._id})`);

  const testProductData = {
    stockNo: `STK-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    category: "Jewellery",
    name: "Test 18K Yellow Gold Diamond Solitaire Ring",
    subCategory: "Ring",
    brand: "SR TAKAT",
    description: "Automated test publish product verification.",
    shortDescription: "Test product publishing functionality",
    status: "Available",
    purchasePrice: 5000,
    additionalCost: 300,
    totalCost: 5300,
    costPrice: 5300,
    sellingPrice: 9500,
    minimumSellingPrice: 8500,
    wholesalePrice: 7500,
    currency: "USD",
    discountAllowed: true,
    profit: 4200,
    margin: 44.21,
    metalType: "Yellow Gold",
    goldPurity: "18K (750)",
    weight: "8.5g",
    warehouse: "Main Vault - HK",
    quantity: 1,
    supplier: "General Vendor",
    components: [
      { name: "18K Gold Setting", quantity: 1, unitCost: 1500 },
      { name: "1.00ct Round Diamond", quantity: 1, unitCost: 3500 }
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop"
    ]
  };

  console.log("Publishing test product via productService.createProduct...");
  const published = await productService.createProduct(testProductData, user._id, "127.0.0.1");

  console.log(`Publish SUCCESSFUL!`);
  console.log(`Published Product Code: ${published.productCode}`);
  console.log(`Stock No: ${published.stockNo}`);
  console.log(`ID: ${published._id}`);

  process.exit(0);
}

testPublish().catch((err) => {
  console.error("Publish test failed:", err);
  process.exit(1);
});
