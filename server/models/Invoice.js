import mongoose from "mongoose";

const { Schema } = mongoose;

const lineItemSchema = new Schema({
  description: { type: String, default: "" },
  qtyGivenPcs: { type: Number, default: 0 },
  qtyGivenCts: { type: Number, default: 0 },
  returnPcs: { type: Number, default: 0 },
  returnCts: { type: Number, default: 0 },
  keptPcs: { type: Number, default: 0 },
  keptCts: { type: Number, default: 0 },
  pricePerCts: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  remark: { type: String, default: "" },
});

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    to: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    attention: {
      type: String,
      default: "",
    },
    tel: {
      type: String,
      default: "",
    },
    lineItems: {
      type: [lineItemSchema],
      default: [],
    },
    totalParcels: {
      type: Schema.Types.Mixed,
      default: "",
    },
    memoClearingDate: {
      type: Schema.Types.Mixed,
      default: "",
    },
    termsOfPayment: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, collection: "invoices" }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
