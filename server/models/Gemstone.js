import mongoose from "mongoose";

const { Schema } = mongoose;

const gemstoneSchema = new Schema(
  {
    stoneId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stockNo: {
      type: String,
      required: true,
      trim: true,
    },
    gemstone: {
      type: String,
      required: [true, "Gemstone type is required"],
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
      default: "",
    },
    origin: {
      type: String,
      trim: true,
      default: "",
    },
    shape: {
      type: String,
      trim: true,
      default: "",
    },
    carat: {
      type: Number,
      required: [true, "Carat weight is required"],
      min: 0,
    },
    pieces: {
      type: Number,
      default: 1,
      min: 0,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    clarity: {
      type: String,
      trim: true,
      default: "",
    },
    treatment: {
      type: String,
      trim: true,
      default: "None",
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: 0,
    },
    costPerCarat: {
      type: Number,
      required: [true, "Cost per carat is required"],
      min: 0,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: "Certificate",
      default: null,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      default: "Vault",
    },
    status: {
      type: String,
      enum: ["In Stock", "Reserved", "In Production", "On Memo", "Sold", "Damaged", "Missing"],
      default: "In Stock",
    },
    notes: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, collection: "gemstones" }
);

// Indexes
gemstoneSchema.index({ stoneId: 1 }, { unique: true });
gemstoneSchema.index({ stockNo: 1 });
gemstoneSchema.index({ status: 1 });
gemstoneSchema.index({ supplierId: 1 });
gemstoneSchema.index({ location: 1 });
gemstoneSchema.index({ gemstone: 1 });
gemstoneSchema.index({ origin: 1 });
gemstoneSchema.index({ status: 1, location: 1 }); // compound

const Gemstone = mongoose.model("Gemstone", gemstoneSchema);

export default Gemstone;
