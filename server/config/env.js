require("dotenv").config();

const parseList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLIENT_URLS: parseList(process.env.CLIENT_URLS),
  TRUST_PROXY: process.env.TRUST_PROXY === "true",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 1000),
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
};

const getCorsOrigins = () => {
  if (env.CLIENT_URLS.length > 0) {
    return env.CLIENT_URLS;
  }

  return [env.CLIENT_URL];
};

const validateEnv = () => {
  const requiredInProduction = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "CLIENT_URL"];
  const missing = requiredInProduction.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    return { valid: true, missing: [] };
  }

  const message = `Missing required environment variables: ${missing.join(", ")}`;

  if (env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`ƒsÿ‹,? ${message}`);
  return { valid: false, missing };
};

module.exports = {
  env,
  getCorsOrigins,
  validateEnv,
};
