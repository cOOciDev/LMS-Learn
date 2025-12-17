const express = require("express");
const router = express.Router();
const authenticate  = require("../../middleware/auth-middleware");
const {
  createTicket,
  getUserTickets,
  getTicketById,
  addMessage,
  closeTicket,
} = require("../../controllers/student-controller/ticket-controller");

// All routes require authentication
router.use(authenticate);

// Create a new ticket
router.post("/create", createTicket);

// Get all tickets for the authenticated user
router.get("/", getUserTickets);

// Get single ticket with messages
router.get("/:ticketId", getTicketById);

// Add message to ticket
router.post("/:ticketId/message", addMessage);

// Close ticket
router.patch("/:ticketId/close", closeTicket);

module.exports = router;
