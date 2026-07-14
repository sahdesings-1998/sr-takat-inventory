import mongoose from "mongoose";

const { Schema } = mongoose;

const incomeSchema = new Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Sales", "Services", "Investments", "Interest", "Other"],
      default: "Sales",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["Cash", "Check", "Bank Transfer", "Credit Card", "Digital Payment", "Other"],
      default: "Cash",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Cancelled"],
      default: "Completed",
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
incomeSchema.index({ date: -1 });
incomeSchema.index({ category: 1 });
incomeSchema.index({ isDeleted: 1 });
incomeSchema.index({ createdBy: 1 });

// Query middleware to exclude soft-deleted records by default
incomeSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

export default mongoose.model("Income", incomeSchema);
