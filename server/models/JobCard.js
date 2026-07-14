import mongoose from "mongoose";

const { Schema } = mongoose;

const productionStageSchema = new Schema({
  stageName: {
    type: String,
    required: true,
    enum: ["Design", "Materials Issued", "Manufacturing", "Stone Setting", "Polishing", "QC", "Completed"],
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  notes: {
    type: String,
    default: "",
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const materialIssuedSchema = new Schema({
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "Material",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  issuedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

const materialReturnedSchema = new Schema({
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "Material",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  wastageType: {
    type: String,
    required: true,
    enum: ["returnedToStock", "scrapRecovery", "writeOff"],
  },
  returnedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  returnedAt: {
    type: Date,
    default: Date.now,
  },
});

const jobCardSchema = new Schema(
  {
    jobNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned artisan/staff is required"],
    },
    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Completed", "On Hold", "Cancelled"],
      default: "Assigned",
    },
    startDate: {
      type: Date,
      default: null,
    },
    expectedDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    productionStages: {
      type: [productionStageSchema],
      default: [],
    },
    materialsIssued: {
      type: [materialIssuedSchema],
      default: [],
    },
    materialsReturned: {
      type: [materialReturnedSchema],
      default: [],
    },
  },
  { timestamps: true, collection: "jobCards" }
);

// Indexes
jobCardSchema.index({ jobNo: 1 }, { unique: true });
jobCardSchema.index({ status: 1 });
jobCardSchema.index({ assignedTo: 1 });
jobCardSchema.index({ productId: 1 });

const JobCard = mongoose.model("JobCard", jobCardSchema);

export default JobCard;
