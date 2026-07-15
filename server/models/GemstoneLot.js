import mongoose from "mongoose";

const { Schema } = mongoose;

const gemstoneLotSchema = new Schema(
  {
    lotId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gemstone: {
      type: String,
      required: [true, "Gemstone type/variety is required"],
      trim: true,
    },
    totalCarat: {
      type: Number,
      required: [true, "Total carat is required"],
      min: 0,
    },
    remainingCarat: {
      type: Number,
      required: [true, "Remaining carat is required"],
      min: 0,
    },
    estimatedPieces: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchaseCost: {
      type: Number,
      required: [true, "Purchase cost is required"],
      min: 0,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      default: "Vault",
    },
    status: {
      type: String,
      enum: ["In Stock", "Active", "Depleted", "Missing"],
      default: "In Stock",
    },
  },
  { timestamps: true, collection: "gemstoneLots" }
);

// Indexes
gemstoneLotSchema.index({ status: 1 });
gemstoneLotSchema.index({ supplierId: 1 });
gemstoneLotSchema.index({ location: 1 });

const GemstoneLot = mongoose.model("GemstoneLot", gemstoneLotSchema);

export default GemstoneLot;
