const Ticket = require("../../models/Ticket");
const User = require("../../models/User");

// Get all tickets (admin view)
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const tickets = await Ticket.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-messages")
      .lean();

    const total = await Ticket.countDocuments(query);

    // Add unread count for each ticket
    const ticketsWithUnread = await Promise.all(
      tickets.map(async (ticket) => {
        const fullTicket = await Ticket.findById(ticket._id);
        return {
          ...ticket,
          unreadCount: fullTicket.messages.filter(
            (msg) => !msg.isRead && msg.senderRole !== "admin"
          ).length,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: ticketsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tickets",
      error: error.message,
    });
  }
};

// Get single ticket with messages (admin view)
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const adminId = req.user._id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Mark user messages as read when admin views
    await ticket.markAsRead(adminId);

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ticket",
      error: error.message,
    });
  }
};

// Add admin reply to ticket
exports.addReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const adminId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const admin = await User.findById(adminId).select("userName");

    ticket.messages.push({
      senderId: adminId,
      senderName: admin.userName,
      senderRole: "admin",
      message: message.trim(),
      isRead: false,
    });

    ticket.lastMessageAt = new Date();
    
    // Update status if needed
    if (ticket.status === "open") {
      ticket.status = "in-progress";
    }

    // Assign to admin if not assigned
    if (!ticket.assignedTo) {
      ticket.assignedTo = adminId;
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding reply",
      error: error.message,
    });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority } = req.body;
    const adminId = req.user._id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (status) {
      if (!["open", "in-progress", "resolved", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }
      ticket.status = status;

      if (status === "resolved") {
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = adminId;
      }
    }

    if (priority) {
      if (!["low", "medium", "high", "urgent"].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }
      ticket.priority = priority;
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating ticket",
      error: error.message,
    });
  }
};

// Assign ticket to admin
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { adminId } = req.body;
    const currentAdminId = req.user._id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (adminId) {
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(400).json({
          success: false,
          message: "Invalid admin ID",
        });
      }
      ticket.assignedTo = adminId;
    } else {
      ticket.assignedTo = currentAdminId;
    }

    if (ticket.status === "open") {
      ticket.status = "in-progress";
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error assigning ticket",
      error: error.message,
    });
  }
};

// Get ticket statistics
exports.getTicketStats = async (req, res) => {
  try {
    const stats = {
      total: await Ticket.countDocuments(),
      open: await Ticket.countDocuments({ status: "open" }),
      inProgress: await Ticket.countDocuments({ status: "in-progress" }),
      resolved: await Ticket.countDocuments({ status: "resolved" }),
      closed: await Ticket.countDocuments({ status: "closed" }),
      urgent: await Ticket.countDocuments({ priority: "urgent" }),
      high: await Ticket.countDocuments({ priority: "high" }),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ticket statistics",
      error: error.message,
    });
  }
};
