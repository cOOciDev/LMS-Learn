const express = require("express");
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../../controllers/auth-controller/index");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const isAdmin = require("../../middleware/admin-middleware");
const {
  validateRegister,
  validateLogin,
} = require("../../middleware/validation");
const router = express.Router();

// Public routes
router.post("/register", isAdmin, validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);

// Protected routes
router.get("/check-auth", authenticateMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    data: {
      user,
    },
  });
});

router.get("/me", authenticateMiddleware, getCurrentUser);
router.put("/profile", authenticateMiddleware, updateProfile);
router.put("/change-password", authenticateMiddleware, changePassword);
router.post("/logout", authenticateMiddleware, logoutUser);

module.exports = router;
