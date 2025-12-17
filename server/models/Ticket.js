const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "instructor", "admin"],
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const TicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ assignedTo: 1, status: 1 });

// Virtual for unread message count
TicketSchema.virtual("unreadCount").get(function () {
  if (!this.messages) return 0;
  return this.messages.filter((msg) => !msg.isRead && msg.senderRole !== "admin").length;
});

// Method to mark messages as read
TicketSchema.methods.markAsRead = function (userId) {
  this.messages.forEach((msg) => {
    if (msg.senderId.toString() !== userId.toString() && !msg.isRead) {
      msg.isRead = true;
    }
  });
  return this.save();
};

module.exports = mongoose.model("Ticket", TicketSchema);
