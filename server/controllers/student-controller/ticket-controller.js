const Ticket = require("../../models/Ticket");
const User = require("../../models/User");

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user._id;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    const user = await User.findById(userId).select("userName userEmail");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const ticket = new Ticket({
      userId,
      userName: user.userName,
      userEmail: user.userEmail,
      subject,
      messages: [
        {
          senderId: userId,
          senderName: user.userName,
          senderRole: req.user.role,
          message,
          isRead: false,
        },
      ],
      status: "open",
      lastMessageAt: new Date(),
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating ticket",
      error: error.message,
    });
  }
};

// Get all tickets for a user
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .sort({ lastMessageAt: -1 })
      .select("-messages")
      .lean();

    // Add unread count
    const ticketsWithUnread = await Promise.all(
      tickets.map(async (ticket) => {
        const fullTicket = await Ticket.findById(ticket._id);
        return {
          ...ticket,
          unreadCount: fullTicket.messages.filter(
            (msg) => !msg.isRead && msg.senderRole !== "user"
          ).length,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: ticketsWithUnread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tickets",
      error: error.message,
    });
  }
};

// Get single ticket with messages
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id; 
    // console.log(ticketId);
    // console.log(userId);
    // console.log(ticketId);
    // console.log(req.user);
    // console.log(req.params);
    // console.log(req.query);
    // console.log(req.body);
    // console.log(req.headers);
    // console.log(req.method);
    // console.log(req.path);

    if (!req.user || !userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }
    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Mark admin messages as read when user views
    await ticket.markAsRead(userId);

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

// Add message to ticket
exports.addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot add message to closed ticket",
      });
    }

    const user = await User.findById(userId).select("userName");

    ticket.messages.push({
      senderId: userId,
      senderName: user.userName,
      senderRole: req.user.role,
      message: message.trim(),
      isRead: false,
    });

    ticket.lastMessageAt = new Date();
    
    // Reopen ticket if it was resolved
    if (ticket.status === "resolved") {
      ticket.status = "open";
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Message added successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding message",
      error: error.message,
    });
  }
};

// Close ticket
exports.closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = "closed";
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket closed successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error closing ticket",
      error: error.message,
    });
  }
};
