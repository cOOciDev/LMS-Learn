const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["user", "instructor", "admin"],
      required: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: [true, "Message body is required"],
      trim: true,
      maxlength: 5000,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
