const express = require("express");
const authenticate = require("../../middleware/auth-middleware");
const {
  getCurrentCourseProgress,
  markCurrentLectureAsViewed,
  resetCurrentCourseProgress,
  getCourseExercises,
  submitCourseExercise,
  getCertificateStatus,
} = require("../../controllers/student-controller/course-progress-controller");

const router = express.Router();

router.get("/get/:courseId", authenticate, getCurrentCourseProgress);
router.post("/mark-lecture-viewed", authenticate, markCurrentLectureAsViewed);
router.post("/reset-progress", authenticate, resetCurrentCourseProgress);
router.get("/exercises/:courseId", authenticate, getCourseExercises);
router.post("/exercises/submit", authenticate, submitCourseExercise);
router.get("/certificate/:courseId", authenticate, getCertificateStatus);
module.exports = router;
