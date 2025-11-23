const express = require("express");
const {
  addNewCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  getInstructorStats,
} = require("../../controllers/instructor-controller/course-controller");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const { validateCourse, validatePagination } = require("../../middleware/validation");
const router = express.Router();

// All routes require authentication
router.use(authenticateMiddleware);

// Stats
router.get("/stats", getInstructorStats);

// Course CRUD
router.post("/add", validateCourse, addNewCourse);
router.get("/get", validatePagination, getAllCourses);
router.get("/get/details/:id", getCourseById);
router.put("/update/:id", updateCourse);
router.delete("/delete/:id", deleteCourse);
router.patch("/publish/:id", togglePublishCourse);

module.exports = router;
