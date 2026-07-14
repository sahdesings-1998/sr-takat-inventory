import mongoose from "mongoose";

const { Schema } = mongoose;

const saleItemSchema = new Schema(
  {
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    inventoryType: {
      type: String,
      required: true,
      enum: ["Gemstone", "Product"],
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "inventoryType",
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true, collection: "saleItems" }
);

// Indexes
saleItemSchema.index({ saleId: 1 });
saleItemSchema.index({ inventoryType: 1, inventoryId: 1 });

const SaleItem = mongoose.model("SaleItem", saleItemSchema);

export default SaleItem;
