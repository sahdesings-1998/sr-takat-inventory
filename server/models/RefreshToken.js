import mongoose from "mongoose";

const { Schema } = mongoose;

// Stores a hash of each refresh token issued, never the raw token.
// Enables rotation: on each /auth/refresh-token call, the presented token is
// verified against its hash, marked revoked, and replaced by a new one.
const refreshTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdByIp: {
      type: String,
      default: "",
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "refreshTokens" }
);

refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual("isExpired").get(function isExpired() {
  return Date.now() >= this.expiresAt.getTime();
});

refreshTokenSchema.virtual("isActive").get(function isActive() {
  return !this.revokedAt && !this.isExpired;
});

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
