import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["info", "warning", "success", "danger", "overdue_memo", "low_stock", "certificate_missing"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["Gemstone", "Product", "Memo", "Sale", "JobCard", "None"],
      default: "None",
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      refPath: "referenceType",
      default: null,
    },
  },
  { timestamps: true, collection: "notifications" }
);

// Indexes
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
