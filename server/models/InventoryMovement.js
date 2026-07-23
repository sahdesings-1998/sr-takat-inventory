import mongoose from "mongoose";

const { Schema } = mongoose;

const inventoryMovementSchema = new Schema(
  {
    inventoryType: {
      type: String,
      required: true,
      enum: ["Gemstone", "GemstoneLot", "Material", "Product"],
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "inventoryType",
    },
    action: {
      type: String,
      required: true,
      enum: [
        "Purchase",
        "Stock Inward",
        "Stock Reversal",
        "Issue to Production",
        "Return from Production",
        "Release on Memo",
        "Return from Memo",
        "Sale",
        "Adjustment",
        "Location Transfer",
        "Damaged",
        "Missing",
      ],
    },
    fromLocation: {
      type: String,
      trim: true,
      default: "",
    },
    toLocation: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    cost: {
      type: Number,
      default: 0,
    },
    previousStock: {
      type: Number,
      default: 0,
    },
    updatedStock: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    purchaseInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseInvoice",
      default: null,
    },
    referenceType: {
      type: String,
      enum: ["JobCard", "Memo", "Sale", "User", "Supplier", "PurchaseInvoice", "None"],
      default: "None",
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      refPath: "referenceType",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    movementDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true, collection: "inventoryMovements" }
);

// Indexes
inventoryMovementSchema.index({ inventoryType: 1, inventoryId: 1 });
inventoryMovementSchema.index({ movementDate: -1 });
inventoryMovementSchema.index({ inventoryId: 1, movementDate: -1 }); // compound

const InventoryMovement = mongoose.model("InventoryMovement", inventoryMovementSchema);

export default InventoryMovement;
