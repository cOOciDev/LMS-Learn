const express = require("express");
const authenticate = require("../middleware/auth-middleware");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} = require("../controllers/notification-controller");

const router = express.Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:notificationId/read", markNotificationRead);

module.exports = router;
