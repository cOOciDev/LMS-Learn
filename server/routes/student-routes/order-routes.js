const express = require("express");
const authenticate = require("../../middleware/auth-middleware");
const {
  createOrder,
  captureOrder,
} = require("../../controllers/student-controller/order-controller");

const router = express.Router();

router.use(authenticate);

router.post("/create", createOrder);
router.post("/capture", captureOrder);

module.exports = router;
