// server/server.js
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { env, getCorsOrigins, validateEnv } = require("./config/env");
const { connectDB, healthCheck } = require("./config/database");
const { errorHandler } = require("./middleware/error-handler");
const logger = require("./middleware/logger");
const authRoutes = require("./routes/auth-routes/index");
const adminRoutes = require("./routes/admin-routes/index");
const mediaRoutes = require("./routes/instructor-routes/media-routes");
const instructorCourseRoutes = require("./routes/instructor-routes/course-routes");
const instructorLiveClassPlanRoutes = require("./routes/instructor-routes/live-class-plan-routes");
// const studentViewCourseRoutes = require("./routes/student-routes/course-routes");
// const studentLiveClassPlanRoutes = require("./routes/student-routes/live-class-plan-routes");
// const studentViewOrderRoutes = require("./routes/student-routes/order-routes");
// const studentCoursesRoutes = require("./routes/student-routes/student-courses-routes");
// const studentCourseProgressRoutes = require("./routes/student-routes/course-progress-routes");
// const studentTicketRoutes = require("./routes/student-routes/ticket-routes");
const studentRoutes = require("./routes/student-routes/index");
const roadmapRoutes = require("./routes/roadmap-routes");
const categoryRoutes = require("./routes/category-routes");
const notificationRoutes = require("./routes/notification-routes");
const noStore = require("./middleware/no-store");

validateEnv();

const app = express();
app.disable("x-powered-by");
app.disable("etag");
const PORT = env.PORT || process.env.PORT || 5000;
const corsOrigins = getCorsOrigins();
const isProduction = env.NODE_ENV === "production";

if (env.TRUST_PROXY || isProduction) {
  app.set("trust proxy", 1);
}

// Middleware
app.use(logger);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

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
app.use(
  ["/auth", "/admin", "/student", "/instructor", "/notifications", "/categories", "/roadmaps"],
  generalLimiter
);
app.use("/auth", authLimiter, noStore, authRoutes);
app.use("/admin", noStore, adminRoutes);
app.use("/media", mediaRoutes);
app.use("/instructor/course", noStore, instructorCourseRoutes);
app.use("/instructor/live-class-plans", noStore, instructorLiveClassPlanRoutes);
app.use("/student", noStore, studentRoutes);
app.use("/notifications", noStore, notificationRoutes);
// app.use("/student/course", studentViewCourseRoutes);
// app.use("/student/live-class-plans", studentLiveClassPlanRoutes);
// app.use("/student/order", studentViewOrderRoutes);
// app.use("/student/courses-bought", studentCoursesRoutes);
// app.use("/student/course-progress", studentCourseProgressRoutes);
// app.use("/student/tickets", studentTicketRoutes);
app.use("/roadmaps", roadmapRoutes);
app.use("/categories", categoryRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Wait a bit for database connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV || "development"}`);
      console.log(`   Client URL(s): ${corsOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
