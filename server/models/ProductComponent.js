import mongoose from "mongoose";

const { Schema } = mongoose;

const productComponentSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: ["Gemstone", "GemstoneLot", "Material"],
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "sourceType",
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    weight: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true, collection: "productComponents" }
);

// Indexes
productComponentSchema.index({ productId: 1 });
productComponentSchema.index({ sourceType: 1, sourceId: 1 });

const ProductComponent = mongoose.model("ProductComponent", productComponentSchema);

export default ProductComponent;
