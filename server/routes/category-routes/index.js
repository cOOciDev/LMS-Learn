const express = require("express");
const {
  getPublicCategories,
} = require("../../controllers/category-controller");

const router = express.Router();

router.get("/", getPublicCategories);

module.exports = router;
