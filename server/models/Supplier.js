import mongoose from "mongoose";

const { Schema } = mongoose;

const supplierSchema = new Schema(
  {
    companyName: {
      type: String,
      required: [true, "Supplier company name is required"],
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Phone number is required"],
    },
    whatsApp: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    supplierType: {
      type: String,
      trim: true,
      default: "Gemstone Supplier",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    notes: {
      type: String,
      default: "",
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
  { timestamps: true, collection: "suppliers" }
);

// Indexes
supplierSchema.index({ companyName: 1 });
supplierSchema.index({ phone: 1 });
supplierSchema.index({ status: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
