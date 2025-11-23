const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAllCourses,
} = require("../../controllers/admin-controller/index");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const isAdmin = require("../../middleware/admin-middleware");
const { validatePagination } = require("../../middleware/validation");
const router = express.Router();

// All routes require admin authentication
router.use(authenticateMiddleware);
router.use(isAdmin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User management
router.get("/users", validatePagination, getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Course management
router.get("/courses", validatePagination, getAllCourses);

module.exports = router;

