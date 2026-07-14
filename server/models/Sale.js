import mongoose from "mongoose";

const { Schema } = mongoose;

const saleSchema = new Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    charityPercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    charityAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    grossProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    netProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Credit Card", "Cheque", "Other"],
      default: "Cash",
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, collection: "sales" }
);

// Indexes
saleSchema.index({ invoiceNo: 1 }, { unique: true });
saleSchema.index({ customerId: 1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ customerId: 1, createdAt: 1 }); // compound

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
