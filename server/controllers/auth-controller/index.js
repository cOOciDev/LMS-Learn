// server/controllers/auth-controller/index.js
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../../middleware/error-handler");

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

  // Check if user exists and get password
  const user = await User.findOne({ userEmail }).select("+password");

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

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Generate tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  user.lastLogin = new Date();
  await user.save();

  // Remove sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  delete userResponse.passwordResetToken;

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
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken,
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
  const { userEmail } = req.body;

  const user = await User.findOne({ userEmail });

  if (!user) {
    // Don't reveal if user exists for security
    return res.status(200).json({
      success: true,
      message: "If email exists, password reset link has been sent",
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In production, send email with reset token
  // For now, return token (remove in production)
  res.status(200).json({
    success: true,
    message: "Password reset token generated",
    data: {
      resetToken, // Remove this in production, send via email instead
    },
  });
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

  const crypto = require("crypto");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
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
