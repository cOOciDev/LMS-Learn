// server/controllers/auth-controller/index.js
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { asyncHandler } = require("../../middleware/error-handler");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const parseCookies = (cookieHeader = "") => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.split("=");
    if (!key) return acc;
    acc[key.trim()] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};

const getRefreshTokenFromRequest = (req) => {
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }
  const header = req.headers?.cookie;
  if (!header) return null;
  const cookies = parseCookies(header);
  return cookies.refreshToken || null;
};
const { sendEitaaMessage } = require("../../helpers/eitaa");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// @desc    Register new user (Admin only)
// @route   POST /auth/register
// @access  Private/Admin
const registerUser = asyncHandler(async (req, res) => {
  const { userName, userEmail, password, role, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ userEmail }, { userName }],
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User name or email already exists",
    });
  }

  // Create user
  const user = await User.create({
    userName,
    userEmail,
    password,
    role: role || "user",
    profile,
  });

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: userResponse,
    },
  });
});

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { userEmail, password } = req.body;
  // console.log('Login attempt:', { userEmail, password });
  // console.log('Password type:', typeof password);
  // Check if user exists and get password
  const user = await User.findOne({ userEmail }).select("+password");
  // console.log(user);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Account is deactivated. Please contact administrator.",
    });
  }

  // console.log('Password entered:', password);
  // console.log('Stored hash:', user.password);

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  // console.log("is password Valid :", isPasswordValid);
  

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  
  // console.log('Password entered:', password);
  // console.log('Stored hash:', user.password);
  

  // Generate tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  user.lastLogin = new Date();
  await user.save();

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

  // Remove sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  delete userResponse.resetPasswordTokenHash;
  delete userResponse.resetPasswordExpires;

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      refreshToken,
      user: userResponse,
    },
  });
});

// @desc    Refresh access token
// @route   POST /auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = getRefreshTokenFromRequest(req);

  if (!refreshTokenValue) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshTokenValue,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: refreshTokenValue,
      refreshTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id);
    res.cookie("refreshToken", refreshTokenValue, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;

  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: "", refreshTokenExpires: "" },
  });

  res.clearCookie("refreshToken", {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 0,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    Get current user
// @route   GET /auth/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

// @desc    Update user profile
// @route   PUT /auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const { profile, userName } = req.body;

  const updateData = {};
  if (profile) updateData.profile = profile;
  if (userName) updateData.userName = userName;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
});

// @desc    Change password
// @route   PUT /auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  const user = await User.findById(userId).select("+password");

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc    Request password reset
// @route   POST /auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const genericMessage =
    "اگر حسابی با این مشخصات وجود داشته باشد، پیام بازیابی ارسال می‌شود.";
  const respondWithGenericMessage = () =>
    res.status(200).json({
      success: true,
      message: genericMessage,
    });

  const { userEmail } = req.body;
  if (!userEmail) {
    return respondWithGenericMessage();
  }

  const user = await User.findOne({ userEmail });

  if (!user || !user.eitaaChatId || !process.env.EITAA_TOKEN) {
    return respondWithGenericMessage();
  }

  const ttlMinutes = Number.parseInt(
    process.env.RESET_TOKEN_TTL_MIN || "15",
    10
  );
  const tokenTTL = Number.isNaN(ttlMinutes) ? 15 : ttlMinutes;

  const resetToken = user.generatePasswordResetToken(tokenTTL);
  await user.save({ validateBeforeSave: false });

  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  const message = `درخواست بازنشانی رمز عبور دریافت شد.\nبرای تنظیم مجدد رمز، روی لینک زیر کلیک کنید:\n${resetLink}`;

  try {
    await sendEitaaMessage(user.eitaaChatId, message);
  } catch (error) {
    console.error("Eitaa notification failed:", error?.message || error);
  }

  return respondWithGenericMessage();
});

// @desc    Reset password
// @route   PUT /auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Reset token and new password are required",
    });
  }

  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await User.findOne({
    resetPasswordTokenHash: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  user.password = newPassword;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
