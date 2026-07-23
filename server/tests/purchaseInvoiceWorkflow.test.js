import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import Material from "../models/Material.js";
import InventoryMovement from "../models/InventoryMovement.js";
import SupplierPayment from "../models/SupplierPayment.js";
import purchaseInvoiceService from "../services/purchaseInvoiceService.js";
import supplierService from "../services/supplierService.js";
import { generateInvoicePDFBuffer } from "../services/pdfService.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

async function runTest() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sr-takat";
  console.log("Connecting to MongoDB:", mongoUri);

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  try {
    // 1. Create a test Supplier
    const testCompanyName = `Test Supplier ${Date.now()}`;
    const supplier = await Supplier.create({
      companyName: testCompanyName,
      contactName: "John Doe",
      phone: "+1 555-0199",
      email: "supplier@example.com",
      supplierType: "Metal Dealer",
    });
    console.log("✔ Created test Supplier:", supplier.companyName, `(${supplier._id})`);

    // Dummy user ID
    const dummyUserId = new mongoose.Types.ObjectId();

    // 2. Create a Purchase Invoice (Draft) with 25 units of Gold
    const invoiceData = {
      supplierId: supplier._id,
      supplierInvoiceNumber: "BILL-2026-001",
      items: [
        {
          name: "24K Fine Gold Grain",
          inventoryType: "Material",
          itemType: "Gold",
          quantity: 25,
          unit: "grams",
          purchasePrice: 75.5,
          tax: 0,
          discount: 0,
        },
      ],
      notes: "Test purchase of 25g fine gold grain",
    };

    const createdInvoice = await purchaseInvoiceService.createPurchaseInvoice(invoiceData, dummyUserId);
    console.log("✔ Created Purchase Invoice in Draft status:", createdInvoice.invoiceNumber, `Total: $${createdInvoice.finalTotal}`);

    // Check stock BEFORE confirmation (should be 0)
    const materialBefore = await Material.findOne({ supplierId: supplier._id });
    console.log("Stock before confirmation:", materialBefore ? materialBefore.quantity : 0);

    // 3. Confirm Purchase Invoice -> triggers Stock Inward
    const confirmedInvoice = await purchaseInvoiceService.confirmPurchaseInvoice(createdInvoice._id, dummyUserId);
    console.log("✔ Confirmed Purchase Invoice:", confirmedInvoice.invoiceNumber, `Status: ${confirmedInvoice.status}`);

    // Verify Stock Inward: Current Stock + 25 = 25
    const materialAfter = await Material.findById(confirmedInvoice.items[0].inventoryId);
    console.log("✔ Updated Stock after confirmation:", materialAfter.quantity, "grams (Expected: 25)");

    if (materialAfter.quantity !== 25) {
      throw new Error(`Stock mismatch! Expected 25, got ${materialAfter.quantity}`);
    }

    // Verify InventoryMovement record
    const movement = await InventoryMovement.findOne({ purchaseInvoiceId: confirmedInvoice._id });
    console.log("✔ Stock Inward Movement logged:", movement.action, `Qty: ${movement.quantity}`, `Stock: ${movement.previousStock} -> ${movement.updatedStock}`);

    // 4. Record Payment against Purchase Invoice
    const paymentRes = await purchaseInvoiceService.recordInvoicePayment(
      confirmedInvoice._id,
      {
        amount: 500,
        paymentMethod: "Bank Transfer",
        notes: "Partial payment of $500",
      },
      dummyUserId
    );
    console.log("✔ Payment recorded. Paid: $" + paymentRes.paidAmount, `Outstanding: $${paymentRes.outstandingBalance}`, `Payment Status: ${paymentRes.paymentStatus}`);

    // Verify Supplier Totals
    const supplierTotals = await supplierService.getSupplierById(supplier._id);
    console.log("✔ Supplier totals updated: Total Purchases: $" + supplierTotals.totalPurchaseAmount, `Total Paid: $${supplierTotals.totalPaidAmount}`, `Outstanding: $${supplierTotals.outstandingBalance}`);

    // 5. Test PDF Buffer generation
    const pdfBuffer = await generateInvoicePDFBuffer(confirmedInvoice, "purchase_invoice");
    console.log("✔ Purchase Invoice PDF buffer generated successfully (" + pdfBuffer.length + " bytes)");

    // 6. Test Purchase Invoice Cancellation -> Reverse Stock Inward
    const cancelledInvoice = await purchaseInvoiceService.cancelPurchaseInvoice(
      confirmedInvoice._id,
      "Testing stock reversal on cancellation",
      dummyUserId
    );
    console.log("✔ Cancelled Purchase Invoice:", cancelledInvoice.invoiceNumber, `Status: ${cancelledInvoice.status}`);

    // Verify Stock Reversal: 25 - 25 = 0
    const materialReversed = await Material.findById(confirmedInvoice.items[0].inventoryId);
    console.log("✔ Updated Stock after cancellation:", materialReversed.quantity, "grams (Expected: 0)");

    if (materialReversed.quantity !== 0) {
      throw new Error(`Stock reversal mismatch! Expected 0, got ${materialReversed.quantity}`);
    }

    // Verify Stock Reversal Movement
    const reversalMovement = await InventoryMovement.findOne({ purchaseInvoiceId: confirmedInvoice._id, action: "Stock Reversal" });
    console.log("✔ Stock Reversal Movement logged:", reversalMovement.action, `Qty: ${reversalMovement.quantity}`, `Stock: ${reversalMovement.previousStock} -> ${reversalMovement.updatedStock}`);

    // Clean up test data
    await Supplier.findByIdAndDelete(supplier._id);
    await PurchaseInvoice.findByIdAndDelete(createdInvoice._id);
    await Material.findByIdAndDelete(materialAfter._id);
    await InventoryMovement.deleteMany({ purchaseInvoiceId: createdInvoice._id });
    await SupplierPayment.deleteMany({ supplierId: supplier._id });

    console.log("\n==================================================");
    console.log("ALL PURCHASING & STOCK INWARD TESTS PASSED PERFECTLY!");
    console.log("==================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
