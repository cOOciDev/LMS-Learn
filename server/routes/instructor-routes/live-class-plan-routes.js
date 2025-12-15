const express = require("express");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const {
  createLiveClassPlan,
  getLiveClassPlans,
  getLiveClassPlanById,
  updateLiveClassPlan,
  publishLiveClassPlan,
  archiveLiveClassPlan,
} = require("../../controllers/instructor-controller/live-class-plan-controller");

const router = express.Router();

router.use(authenticateMiddleware);

router.route("/")
  .post(createLiveClassPlan)
  .get(getLiveClassPlans);

router.route("/:id")
  .get(getLiveClassPlanById)
  .put(updateLiveClassPlan)
  .delete(archiveLiveClassPlan);

router.patch("/:id/publish", publishLiveClassPlan);

module.exports = router;

