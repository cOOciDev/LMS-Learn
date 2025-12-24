const Notification = require("../models/Notification");
const User = require("../models/User");

const buildRecipientsByRole = async (targetRole) => {
  if (targetRole === "all") {
    return User.find({ role: { $in: ["user", "instructor"] } }).select("_id role userName");
  }
  return User.find({ role: targetRole }).select("_id role userName");
};

exports.createAdminMessage = async (req, res) => {
  try {
    const { subject, body, targetRole, recipientEmail, recipientEmails } =
      req.body;
    const adminId = req.user._id;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Subject and body are required",
      });
    }

    let recipients = [];
    if (recipientEmail || (Array.isArray(recipientEmails) && recipientEmails.length)) {
      const emails = []
        .concat(recipientEmail ? [recipientEmail] : [])
        .concat(Array.isArray(recipientEmails) ? recipientEmails : [])
        .map((email) => String(email).trim().toLowerCase())
        .filter(Boolean);
      const uniqueEmails = [...new Set(emails)];
      recipients = await User.find({ userEmail: { $in: uniqueEmails } }).select(
        "_id role userName"
      );
      if (recipients.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recipient not found",
        });
      }
    } else {
      if (!targetRole) {
        return res.status(400).json({
          success: false,
          message: "Target role is required",
        });
      }
      if (!["user", "instructor", "all"].includes(targetRole)) {
        return res.status(400).json({
          success: false,
          message: "Invalid target role",
        });
      }
      recipients = await buildRecipientsByRole(targetRole);
    }

    if (recipients.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No recipients found",
        data: { count: 0 },
      });
    }

    const senderName = req.user.userName || "Admin";
    const notifications = recipients.map((recipient) => ({
      senderId: adminId,
      senderName,
      recipientUserId: recipient._id,
      recipientRole: recipient.role,
      subject: subject.trim(),
      body: body.trim(),
      isRead: false,
      readAt: null,
    }));

    await Notification.insertMany(notifications);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { count: notifications.length },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

exports.getAdminMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = { senderId: req.user._id };

    const [messages, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate("recipientUserId", "userName userEmail role")
        .lean(),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const query = { recipientUserId: req.user._id };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientUserId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientUserId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientUserId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching notification count",
      error: error.message,
    });
  }
};
