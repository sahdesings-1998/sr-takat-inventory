import mongoose from "mongoose";

const { Schema } = mongoose;

const purchaseItemSchema = new Schema(
  {
    inventoryType: {
      type: String,
      required: true,
      enum: ["Gemstone", "GemstoneLot", "Material", "Product"],
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      refPath: "items.inventoryType",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    itemType: {
      type: String,
      trim: true,
      default: "Material",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.0001, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: "pcs",
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const purchaseInvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplierInvoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Draft", "Confirmed", "Cancelled"],
      default: "Draft",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid", "Overdue"],
      default: "Unpaid",
    },
    items: {
      type: [purchaseItemSchema],
      default: [],
      validate: [
        function (val) {
          return val.length > 0;
        },
        "Purchase invoice must contain at least one item",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
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
      required: true,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
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
  { timestamps: true, collection: "purchase_invoices" }
);

// Indexes
purchaseInvoiceSchema.index({ supplierId: 1 });
purchaseInvoiceSchema.index({ status: 1 });
purchaseInvoiceSchema.index({ paymentStatus: 1 });
purchaseInvoiceSchema.index({ purchaseDate: -1 });

const PurchaseInvoice = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);

export default PurchaseInvoice;
