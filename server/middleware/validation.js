/**
 * Validation middleware for request data
 */

const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRegister = (req, res, next) => {
  const { userName, userEmail, password, role } = req.body;
  const errors = [];

  if (!userName || userName.trim().length < 3) {
    errors.push("User name must be at least 3 characters");
  }

  if (!userEmail || !validateEmail(userEmail)) {
    errors.push("Valid email is required");
  }

  if (!validatePassword(password)) {
    errors.push("Password must be at least 6 characters");
  }

  if (role && !["user", "instructor", "admin"].includes(role)) {
    errors.push("Invalid role");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { userEmail, password } = req.body;
  const errors = [];

  if (!userEmail || !validateEmail(userEmail)) {
    errors.push("Valid email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validateCourse = (req, res, next) => {
  const {
    title,
    category,
    level,
    primaryLanguage,
    description,
    pricing,
  } = req.body;
  const errors = [];

  if (!title) {
    errors.push("Course title must be at least 5 characters");
  }

  if (!category) {
    errors.push("Category is required");
  }

  if (!level || !["beginner", "intermediate", "advanced"].includes(level)) {
    errors.push("Valid level is required (beginner, intermediate, advanced)");
  }

  if (!primaryLanguage) {
    errors.push("Primary language is required");
  }

  if (!description) {
    errors.push("Description must be at least 20 characters");
  }

  if (pricing === undefined || pricing < 0) {
    errors.push("Valid pricing is required (must be >= 0)");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: "Page must be greater than 0",
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 100",
    });
  }

  req.pagination = { page, limit, skip };
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCourse,
  validatePagination,
  validateEmail,
  validatePassword,
};

