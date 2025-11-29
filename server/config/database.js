// server/config/database.js
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true, // Retry write operations
  w: 'majority', // Write concern
};

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

/**
 * Connect to MongoDB with professional error handling and reconnection logic
 */
async function connectDB() {
  // Return if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB: Using existing database connection");
    return;
  }

  // Close existing connection if any
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  try {
    connectionAttempts++;
    console.log(`MongoDB: Attempting to connect (Attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})...`);

    await mongoose.connect(MONGO_URI, connectionOptions);

    isConnected = true;
    connectionAttempts = 0;

    console.log("✅ MongoDB: Successfully connected to database");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    // Set up connection event listeners
    setupConnectionListeners();
  } catch (error) {
    isConnected = false;
    console.error("❌ MongoDB: Connection error:", error.message);

    if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      console.log(`   Retrying connection in 3 seconds...`);
      setTimeout(() => connectDB(), 3000);
    } else {
      console.error("❌ MongoDB: Max reconnection attempts reached. Please check your database connection.");
      process.exit(1);
    }
  }
}

/**
 * Setup MongoDB connection event listeners
 */
function setupConnectionListeners() {
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB: Connection established");
    isConnected = true;
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB: Connection error:", err.message);
    isConnected = false;
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB: Connection disconnected");
    isConnected = false;
  });

  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB: Reconnected to database");
    isConnected = true;
  });

  // Handle application termination
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB: Connection closed due to application termination");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await mongoose.connection.close();
    console.log("MongoDB: Connection closed due to application termination");
    process.exit(0);
  });
}

/**
 * Gracefully close MongoDB connection
 */
async function closeDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      isConnected = false;
      console.log("✅ MongoDB: Connection closed gracefully");
    }
  } catch (error) {
    console.error("❌ MongoDB: Error closing connection:", error.message);
    throw error;
  }
}

/**
 * Get connection status
 */
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  
  return {
    isConnected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    readyStateText: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.connection.models),
  };
}

/**
 * Health check for database
 */
async function healthCheck() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return { healthy: true, status: 'connected' };
    }
    return { healthy: false, status: 'disconnected' };
  } catch (error) {
    return { healthy: false, status: 'error', error: error.message };
  }
}

module.exports = {
  connectDB,
  closeDB,
  getConnectionStatus,
  healthCheck,
  mongoose,
};

