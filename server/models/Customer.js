import mongoose from "mongoose";

const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
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
    address: {
      type: String,
      trim: true,
      default: "",
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    whatsApp: {
      type: String,
      trim: true,
      default: "",
    },
    customerType: {
      type: String,
      enum: ["Private Client", "Dealer", "Wholesaler", "VIP"],
      default: "Private Client",
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
  { timestamps: true, collection: "customers" }
);

// Search indexes
customerSchema.index({ fullName: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
