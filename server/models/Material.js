import mongoose from "mongoose";

const { Schema } = mongoose;

const materialSchema = new Schema(
  {
    materialCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Material category is required"],
      enum: ["Gold", "Silver", "Platinum", "Setting", "Findings", "Packaging", "Other"],
      default: "Other",
    },
    materialName: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      default: "grams",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
      default: 0,
    },
    cost: {
      type: Number,
      required: [true, "Unit cost is required"],
      min: 0,
      default: 0,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      default: "Workshop Vault",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true, collection: "materials" }
);

// Indexes
materialSchema.index({ materialCode: 1 }, { unique: true });
materialSchema.index({ category: 1 });
materialSchema.index({ status: 1 });

const Material = mongoose.model("Material", materialSchema);

export default Material;
