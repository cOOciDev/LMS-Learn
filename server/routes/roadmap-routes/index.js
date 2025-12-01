const express = require("express");
const { getRoadmapByCategory } = require("../../controllers/roadmap-controller");

const router = express.Router();

router.get("/:slug", getRoadmapByCategory);

module.exports = router;
