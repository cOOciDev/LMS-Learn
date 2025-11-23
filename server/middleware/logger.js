/**
 * Request logging middleware
 */

const logger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      timestamp: new Date().toISOString(),
    };

    // Color coding based on status
    if (res.statusCode >= 500) {
      console.error("❌", log);
    } else if (res.statusCode >= 400) {
      console.warn("⚠️ ", log);
    } else {
      console.log("✅", log);
    }
  });

  next();
};

module.exports = logger;

