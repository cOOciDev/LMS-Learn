const express = require("express");
const {
  getPublishedLivePlans,
  getPublishedLivePlanById,
} = require("../../controllers/student-controller/live-class-plan-controller");

const router = express.Router();

router.get("/", getPublishedLivePlans);
router.get("/:id", getPublishedLivePlanById);

module.exports = router;
