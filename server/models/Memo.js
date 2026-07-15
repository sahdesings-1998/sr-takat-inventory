import mongoose from "mongoose";

const { Schema } = mongoose;

const memoItemSchema = new Schema({
  inventoryType: {
    type: String,
    required: true,
    enum: ["Gemstone", "Product"],
  },
  inventoryId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "items.inventoryType",
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  carat: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["On Memo", "Returned", "Sold"],
    default: "On Memo",
  },
  returnedDate: {
    type: Date,
    default: null,
  },
});

const memoSchema = new Schema(
  {
    memoNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedReturn: {
      type: Date,
      required: true,
    },
    actualReturn: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["With Client", "Partially Returned", "Fully Returned", "Overdue", "Closed"],
      default: "With Client",
    },
    items: {
      type: [memoItemSchema],
      default: [],
      validate: [
        (val) => val.length > 0,
        "A memo must have at least one item",
      ],
    },
    remarks: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, collection: "memos" }
);

// Indexes
memoSchema.index({ status: 1 });
memoSchema.index({ customerId: 1 });
memoSchema.index({ status: 1, expectedReturn: 1 }); // compound

const Memo = mongoose.model("Memo", memoSchema);

export default Memo;
