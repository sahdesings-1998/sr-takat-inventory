import mongoose from "mongoose";

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    charityPercentage: {
      type: Number,
      default: 2.0, // default 2%
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: "USD",
    },
    prefixes: {
      gemstone: { type: String, default: "GEM" },
      lot: { type: String, default: "LOT" },
      product: { type: String, default: "PRD" },
      invoice: { type: String, default: "INV" },
      memo: { type: String, default: "MEM" },
      jobCard: { type: String, default: "JOB" },
    },
    certificateLabs: {
      type: [String],
      default: ["GIA", "GRS", "SSEF", "Gubelin", "IGI"],
    },
    exchangeRate: {
      type: Number,
      default: 1.0,
    },
    companyInfo: {
      name: { type: String, default: "SR TAKAT" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
    },
  },
  { timestamps: true, collection: "settings" }
);

// Statics to get or create the single settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
