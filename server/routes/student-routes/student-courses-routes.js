const express = require("express");
const authenticate = require("../../middleware/auth-middleware");
const {
  getCoursesByStudentId,
} = require("../../controllers/student-controller/student-courses-controller");

const router = express.Router();

router.get("/get", authenticate, getCoursesByStudentId);

module.exports = router;
