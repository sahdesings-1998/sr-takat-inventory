import mongoose from "mongoose";

const { Schema } = mongoose;

const certificateSchema = new Schema(
  {
    certificateNo: {
      type: String,
      required: [true, "Certificate number is required"],
      unique: true,
      trim: true,
    },
    lab: {
      type: String,
      required: [true, "Laboratory name is required"],
      trim: true,
    },
    issueDate: {
      type: Date,
      default: null,
    },
    reportType: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      required: [true, "Certificate file URL is required"],
    },
    publicId: {
      type: String,
      default: null,
    },
    resourceType: {
      type: String,
      default: null,
    },
    format: {
      type: String,
      default: null,
    },
    originalFilename: {
      type: String,
      default: null,
    },
    bytes: {
      type: Number,
      default: null,
    },
    uploadTimestamp: {
      type: Date,
      default: null,
    },
    entityType: {
      type: String,
      enum: ["Gemstone", "Product"],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
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
  { timestamps: true, collection: "certificates" }
);

// Indexes
certificateSchema.index({ entityType: 1, entityId: 1 });

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
