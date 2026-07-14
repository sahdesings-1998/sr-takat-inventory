import mongoose from "mongoose";

const { Schema } = mongoose;

const currencySchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      default: "",
    },
    exchangeRate: {
      type: Number,
      required: true,
      default: 1.0,
    },
    isBase: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true, collection: "currencies" }
);

const Currency = mongoose.model("Currency", currencySchema);

export default Currency;
