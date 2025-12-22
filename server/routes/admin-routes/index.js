const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAllCourses,
  getUserGrowthStats,
  getFinancialReports,
  getAllInstructors,
  getInstructorDetails,
  updateInstructor,
} = require("../../controllers/admin-controller/index");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const isAdmin = require("../../middleware/admin-middleware");
const { validatePagination } = require("../../middleware/validation");
const {
  getAdminCategories,
  createCategory,
  deleteCategory,
} = require("../../controllers/category-controller");
const {
  createRoadmap,
  getAdminRoadmaps,
} = require("../../controllers/roadmap-controller");
const {
  getAllTickets,
  getTicketById,
  addReply,
  updateTicketStatus,
  assignTicket,
  getTicketStats,
} = require("../../controllers/admin-controller/ticket-controller");
const {
  listExerciseSubmissions,
  reviewExerciseSubmission,
  listCertificateRequests,
  reviewCertificateRequest,
} = require("../../controllers/admin-controller/course-verification-controller");
const router = express.Router();

// All routes require admin authentication
router.use(authenticateMiddleware);
router.use(isAdmin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User management
router.get("/users", validatePagination, getAllUsers);
router.get("/users/growth/stats", getUserGrowthStats);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Course management
router.get("/courses", validatePagination, getAllCourses);

// Category management
router.get("/categories", getAdminCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);

// Roadmap management
router.get("/roadmaps", getAdminRoadmaps);
router.post("/roadmaps", createRoadmap);

// Financial reports
router.get("/financial/reports", getFinancialReports);

// Instructor management
router.get("/instructors", validatePagination, getAllInstructors);
router.get("/instructors/:id", getInstructorDetails);
router.put("/instructors/:id", updateInstructor);

// Ticket/Help Center management
router.get("/tickets", validatePagination, getAllTickets);
router.get("/tickets/stats", getTicketStats);
router.get("/tickets/:ticketId", getTicketById);
router.post("/tickets/:ticketId/reply", addReply);
router.patch("/tickets/:ticketId/status", updateTicketStatus);
router.patch("/tickets/:ticketId/assign", assignTicket);

// Course verification
router.get("/course-submissions", listExerciseSubmissions);
router.patch("/course-submissions/:submissionId", reviewExerciseSubmission);
router.get("/course-certificates", listCertificateRequests);
router.patch("/course-certificates/:requestId", reviewCertificateRequest);

module.exports = router;

