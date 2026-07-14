import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";

/**
 * Verifies the access token (from the httpOnly `accessToken` cookie, or an
 * `Authorization: Bearer <token>` header as a fallback for non-browser
 * clients), then attaches the authenticated user (with role populated) to
 * req.user. Responds 401 on any failure.
 */
const auth = catchAsync(async (req, res, next) => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authenticated. Please log in.");
  }

  let payload;
  try {
    payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(payload.sub).populate("roleId");

  if (!user) throw new ApiError(401, "User belonging to this token no longer exists");
  if (user.status !== "active") throw new ApiError(403, "This account is not active");

  req.user = user;
  next();
});

export default auth;
