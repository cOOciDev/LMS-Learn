// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, healthCheck } = require("./config/database");
const { errorHandler } = require("./middleware/error-handler");
const logger = require("./middleware/logger");
const authRoutes = require("./routes/auth-routes/index");
const adminRoutes = require("./routes/admin-routes/index");
const mediaRoutes = require("./routes/instructor-routes/media-routes");
const instructorCourseRoutes = require("./routes/instructor-routes/course-routes");
const studentViewCourseRoutes = require("./routes/student-routes/course-routes");
const studentViewOrderRoutes = require("./routes/student-routes/order-routes");
const studentCoursesRoutes = require("./routes/student-routes/student-courses-routes");
const studentCourseProgressRoutes = require("./routes/student-routes/course-progress-routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(logger);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbHealth = await healthCheck();
  res.status(dbHealth.healthy ? 200 : 503).json({
    status: dbHealth.healthy ? "healthy" : "unhealthy",
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// Initialize database connection
connectDB();

// Routes configuration
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/media", mediaRoutes);
app.use("/instructor/course", instructorCourseRoutes);
app.use("/student/course", studentViewCourseRoutes);
app.use("/student/order", studentViewOrderRoutes);
app.use("/student/courses-bought", studentCoursesRoutes);
app.use("/student/course-progress", studentCourseProgressRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Wait a bit for database connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
