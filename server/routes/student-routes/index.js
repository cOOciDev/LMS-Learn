const express = require("express");
const router = express.Router();

// student routes
const courseRoutes = require("./course-routes");
const liveClassPlanRoutes = require("./live-class-plan-routes");
const orderRoutes = require("./order-routes");
const studentCoursesRoutes = require("./student-courses-routes");
const courseProgressRoutes = require("./course-progress-routes");
const ticketRoutes = require("./ticket-routes");

// mount routes (canonical + aliases)
router.use("/courses", courseRoutes);
router.use("/course", courseRoutes); // alias for legacy calls
router.use("/live-class-plans", liveClassPlanRoutes);
router.use("/orders", orderRoutes);
router.use("/order", orderRoutes); // alias for legacy calls
router.use("/my-courses", studentCoursesRoutes);
router.use("/courses-bought", studentCoursesRoutes); // alias for older paths
router.use("/course-progress", courseProgressRoutes);
router.use("/tickets", ticketRoutes);

module.exports = router;
