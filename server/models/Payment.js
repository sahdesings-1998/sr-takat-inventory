import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Bank Transfer", "Cheque", "Crypto", "Other"],
      default: "Cash",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        fileType: { type: String, trim: true },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
