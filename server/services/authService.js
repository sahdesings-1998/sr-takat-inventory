import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
import RefreshToken from "../models/RefreshToken.js";
import ApiError from "../utils/ApiError.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7);

/* ------------------------------------------------------------------ */
/* Token signing / verification                                       */
/* ------------------------------------------------------------------ */

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a new refresh token (opaque random string), persists its hash,
 * and returns the raw token to be set as an httpOnly cookie.
 */
async function issueRefreshToken(userId, ip = "") {
  const rawToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    createdByIp: ip,
  });

  return { rawToken, expiresAt };
}

/**
 * Validates a presented refresh token, rotates it (revokes the old one,
 * issues a new one), and returns fresh access + refresh tokens.
 * Throws ApiError(401) on invalid/expired/reused tokens.
 */
async function rotateRefreshToken(rawToken, ip = "") {
  if (!rawToken) throw new ApiError(401, "Refresh token missing");

  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) throw new ApiError(401, "Invalid refresh token");

  if (!existing.isActive) {
    // Reuse of a revoked/expired token — treat as compromised, revoke all
    // active tokens for that user as a precaution.
    await RefreshToken.updateMany(
      { user: existing.user, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw new ApiError(401, "Refresh token expired or already used");
  }

  const user = await User.findById(existing.user).populate("roleId");
  if (!user || user.status !== "active") {
    throw new ApiError(401, "User no longer active");
  }

  const { rawToken: newRawToken, expiresAt } = await issueRefreshToken(user._id, ip);

  existing.revokedAt = new Date();
  existing.replacedByTokenHash = hashToken(newRawToken);
  await existing.save();

  const accessToken = signAccessToken(user);

  return { user, accessToken, refreshToken: newRawToken, refreshTokenExpiresAt: expiresAt };
}

async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

/* ------------------------------------------------------------------ */
/* Auth flows                                                          */
/* ------------------------------------------------------------------ */

async function register({ fullName, email, password, phone, roleName }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  // Default new self-registered accounts to the least-privileged role
  // unless a valid roleName was explicitly supplied.
  const role =
    (roleName && (await Role.findOne({ name: roleName }))) ||
    (await Role.findOne({ name: "Workshop-Staff" }));

  if (!role) {
    throw new ApiError(
      500,
      "No roles exist yet. Seed the roles collection (Admin/Manager/Workshop-Staff) before registering users."
    );
  }

  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    roleId: role._id,
  });

  return User.findById(user._id).populate("roleId");
}

async function login({ email, password }, ip = "") {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+password")
    .populate("roleId");

  if (!user) throw new ApiError(401, "Invalid email or password");
  if (user.status !== "active") throw new ApiError(403, "This account is not active");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = signAccessToken(user);
  const { rawToken: refreshToken, expiresAt } = await issueRefreshToken(user._id, ip);

  return { user, accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always behave the same whether or not the user exists, to avoid
  // leaking which emails are registered.
  if (!user) return { rawToken: null };

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = hashToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  return { rawToken, user };
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordTokenHash +resetPasswordExpires");

  if (!user) throw new ApiError(400, "Password reset link is invalid or has expired");

  user.password = newPassword;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  // Invalidate all existing refresh tokens for this user on password change.
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return user;
}

export default {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  register,
  login,
  forgotPassword,
  resetPassword,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
};
