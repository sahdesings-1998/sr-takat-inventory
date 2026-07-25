import mongoose from "mongoose";

const { Schema } = mongoose;

const lookupSchema = new Schema(
  {
    type: {
      type: String,
      required: [true, "Lookup type is required"],
      trim: true,
      index: true,
    },
    value: {
      type: String,
      required: [true, "Lookup value is required"],
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    normalizedValue: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "lookups" }
);

// Pre-validate hook to ensure normalizedValue and label are populated
lookupSchema.pre("validate", function (next) {
  if (this.value) {
    this.value = this.value.trim();
    this.normalizedValue = this.value.toLowerCase();
    if (!this.label) {
      this.label = this.value;
    }
  }
  next();
});

// Unique index to prevent case-insensitive duplicates per lookup type
lookupSchema.index({ type: 1, normalizedValue: 1 }, { unique: true });

const Lookup = mongoose.model("Lookup", lookupSchema);

export default Lookup;
