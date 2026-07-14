import authService from "../services/authService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS =
  Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000;

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    // Cookies must be Secure and SameSite=None for cross-site usage in production
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
    path: "/",
  };
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
}

function clearAuthCookies(res) {
  // Clear cookies using the same attributes so the browser removes them correctly
  res.clearCookie("accessToken", cookieOptions(0));
  res.clearCookie("refreshToken", cookieOptions(0));
}

/* POST /api/v1/auth/register */
export const register = catchAsync(async (req, res) => {
  const { fullName, email, password, phone, roleName } = req.body;

  const user = await authService.register({ fullName, email, password, phone, roleName });

  sendSuccess(res, {
    statusCode: 201,
    message: "Account created successfully. Please log in.",
    data: { user: user.toSafeObject() },
  });
});

/* POST /api/v1/auth/login */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;

  const { user, accessToken, refreshToken } = await authService.login({ email, password }, ip);

  setAuthCookies(res, { accessToken, refreshToken });

  sendSuccess(res, {
    message: "Logged in successfully",
    data: { user: user.toSafeObject(), accessToken },
  });
});

/* POST /api/v1/auth/logout */
export const logout = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  await authService.revokeRefreshToken(rawToken);
  clearAuthCookies(res);

  sendSuccess(res, { message: "Logged out successfully" });
});

/* POST /api/v1/auth/refresh-token */
export const refreshToken = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  const ip = req.ip;

  if (!rawToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "No refresh token provided");
  }

  try {
    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = await authService.rotateRefreshToken(rawToken, ip);

    setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

    sendSuccess(res, {
      message: "Token refreshed",
      data: { user: user.toSafeObject(), accessToken },
    });
  } catch (error) {
    clearAuthCookies(res);
    console.error("[auth] refresh failed", {
      message: error.message,
      ip,
    });
    throw error;
  }
});

/* GET /api/v1/auth/me */
export const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, { message: "Current user", data: { user: req.user.toSafeObject() } });
});

/* POST /api/v1/auth/forgot-password */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const { rawToken } = await authService.forgotPassword(email);

  if (rawToken) {
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawToken}`;
    // No email provider is wired up yet — log the link so it can be used
    // during development/testing. Replace with a real mailer in production.
    // eslint-disable-next-line no-console
    console.log(`[SR TAKAT] Password reset link for ${email}: ${resetUrl}`);
  }

  const responseData =
    !isProduction && rawToken ? { devResetToken: rawToken } : undefined;

  sendSuccess(res, {
    message: "If an account with that email exists, a password reset link has been sent.",
    data: responseData,
  });
});

/* POST /api/v1/auth/reset-password */
export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);

  sendSuccess(res, { message: "Password has been reset. Please log in with your new password." });
});

export default {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
};
