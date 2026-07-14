import mongoose from "mongoose";

const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
      enum: {
        values: ["Admin", "Manager", "Workshop-Staff"],
        message: "{VALUE} is not a supported role",
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // e.g. "inventory.view", "inventory.create", "sales.create", "memo.release", "costing.approve"
    permissions: {
      type: [String],
      default: [],
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
  },
  { timestamps: true, collection: "roles" }
);

const Role = mongoose.model("Role", roleSchema);

export default Role;
