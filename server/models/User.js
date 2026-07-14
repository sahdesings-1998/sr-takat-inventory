import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Password reset flow (not part of core schema in Section 5, additive for forgot/reset-password)
    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  { timestamps: true, collection: "users" }
);

userSchema.index({ roleId: 1 });
userSchema.index({ status: 1 });

// Hash password before saving, only if modified
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(12);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcryptjs.compare(candidate, this.password);
};

// Never leak password / reset fields even if accidentally selected
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  // Provide a derived `isVerified` flag for frontend compatibility.
  // In this project, `status: 'active'` indicates a verified/active account.
  obj.isVerified = obj.status === "active";
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
