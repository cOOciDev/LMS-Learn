require("dotenv").config();
const { connectDB, closeDB } = require("../config/database");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function initDatabase() {
  try {
    // Connect to MongoDB using professional connection
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ userEmail: "admin@lms.com" });
    if (existingAdmin) {
      console.log("Admin user already exists. Skipping admin creation.");
    } else {
      // Create admin user
      const adminPassword = await bcrypt.hash("admin123", 12);
      const admin = new User({
        userName: "admin",
        userEmail: "admin@lms.com",
        password: adminPassword,
        role: "admin",
      });
      await admin.save();
      console.log("Admin user created successfully!");
      console.log("Email: admin@lms.com");
      console.log("Password: admin123");
    }

    // Check if test user already exists
    const existingUser = await User.findOne({ userEmail: "user@test.com" });
    if (existingUser) {
      console.log("Test user already exists. Skipping test user creation.");
    } else {
      // Create test user
      const userPassword = await bcrypt.hash("user123", 12);
      const testUser = new User({
        userName: "testuser",
        userEmail: "user@test.com",
        password: userPassword,
        role: "user",
      });
      await testUser.save();
      console.log("Test user created successfully!");
      console.log("Email: user@test.com");
      console.log("Password: user123");
    }

    // Check if test instructor already exists
    const existingInstructor = await User.findOne({
      userEmail: "instructor@test.com",
    });
    if (existingInstructor) {
      console.log("Test instructor already exists. Skipping instructor creation.");
    } else {
      // Create test instructor
      const instructorPassword = await bcrypt.hash("instructor123", 12);
      const testInstructor = new User({
        userName: "testinstructor",
        userEmail: "instructor@test.com",
        password: instructorPassword,
        role: "instructor",
      });
      await testInstructor.save();
      console.log("Test instructor created successfully!");
      console.log("Email: instructor@test.com");
      console.log("Password: instructor123");
    }

    console.log("\nDatabase initialization completed!");
    console.log("\nTest Accounts:");
    console.log("==============");
    console.log("Admin:");
    console.log("  Email: admin@lms.com");
    console.log("  Password: admin123");
    console.log("\nUser:");
    console.log("  Email: user@test.com");
    console.log("  Password: user123");
    console.log("\nInstructor:");
    console.log("  Email: instructor@test.com");
    console.log("  Password: instructor123");
    console.log("==============\n");

    await closeDB();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    await closeDB();
    process.exit(1);
  }
}

initDatabase();

