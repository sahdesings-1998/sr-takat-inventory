import mongoose from "mongoose";

const { Schema } = mongoose;

const supplierPaymentSchema = new Schema(
  {
    paymentNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
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
      default: "Bank Transfer",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
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
  { timestamps: true, collection: "supplier_payments" }
);

supplierPaymentSchema.index({ supplierId: 1 });
supplierPaymentSchema.index({ paymentDate: -1 });

const SupplierPayment = mongoose.model("SupplierPayment", supplierPaymentSchema);

export default SupplierPayment;
