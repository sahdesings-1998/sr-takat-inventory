import mongoose from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productCode: {
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
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: ["Ring", "Necklace", "Earrings", "Bracelet", "Pendant", "Watch", "Other"],
      default: "Other",
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: 0,
      default: 0,
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: 0,
      default: 0,
    },
    grossProfit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    charityAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    netProfit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    qrCode: {
      type: String,
      default: "",
    },
    barcode: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["In Stock", "Reserved", "On Memo", "Sold", "Missing", "Damaged"],
      default: "In Stock",
    },
    certificateIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Certificate",
      },
    ],
    imageUrls: {
      type: [String],
      default: [],
    },
    costBreakdown: {
      materials: {
        gemstones: { type: Number, default: 0 },
        diamonds: { type: Number, default: 0 },
        gold: { type: Number, default: 0 },
        watchComponents: { type: Number, default: 0 },
        strap: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      },
      production: {
        cad: { type: Number, default: 0 },
        casting: { type: Number, default: 0 },
        stoneSetting: { type: Number, default: 0 },
        polishing: { type: Number, default: 0 },
        assembly: { type: Number, default: 0 },
        qc: { type: Number, default: 0 }
      },
      other: {
        certificate: { type: Number, default: 0 },
        shipping: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        packaging: { type: Number, default: 0 },
        marketing: { type: Number, default: 0 },
        commission: { type: Number, default: 0 }
      },
      percentageItems: [
        {
          name: { type: String, required: true },
          percentage: { type: Number, required: true },
          basis: { type: String, enum: ["Material Cost", "Production Cost", "Total Cost", "Selling Price", "Gross Profit"], required: true },
          amount: { type: Number, default: 0 }
        }
      ]
    },
  },
  { timestamps: true, collection: "products" }
);

// Indexes
productSchema.index({ productCode: 1 }, { unique: true });
productSchema.index({ stockNo: 1 });
productSchema.index({ status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1, category: 1 }); // compound

const Product = mongoose.model("Product", productSchema);

export default Product;
