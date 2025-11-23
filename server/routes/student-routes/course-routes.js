const express = require("express");
const {
  getAllPublishedCourses,
  getCourseDetails,
  getFeaturedCourses,
  getCoursesByCategory,
  getPurchaseInfo,
} = require("../../controllers/student-controller/course-controller");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const { validatePagination } = require("../../middleware/validation");
const router = express.Router();

// Public routes
router.get("/get", validatePagination, getAllPublishedCourses);
router.get("/get/details/:id", getCourseDetails);
router.get("/featured", getFeaturedCourses);
router.get("/category/:category", validatePagination, getCoursesByCategory);

// Protected routes
router.get("/purchase-info/:courseId/:studentId", authenticateMiddleware, getPurchaseInfo);

module.exports = router;
