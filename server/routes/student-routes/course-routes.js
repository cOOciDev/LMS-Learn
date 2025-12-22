const express = require("express");
const {
  getAllPublishedCourses,
  getCourseDetails,
  getFeaturedCourses,
  getCoursesByCategory,
  getPurchaseInfo,
} = require("../../controllers/student-controller/course-controller");
const { rateCourse } = require("../../controllers/student-controller/course-rating-controller");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const { validatePagination } = require("../../middleware/validation");
const router = express.Router();

// Public routes
router.get("/get", validatePagination, getAllPublishedCourses);
router.get("/get/details/:id", getCourseDetails);
router.get("/featured", getFeaturedCourses);
router.get("/category/:category", validatePagination, getCoursesByCategory);

// Protected routes
router.get(
  "/purchase-info/:courseId",
  authenticateMiddleware,
  getPurchaseInfo
);
router.post("/rate", authenticateMiddleware, rateCourse);

module.exports = router;
