const authenticate = require("./auth-middleware");

const isAdmin = (req, res, next) => {
  // Create a custom next function to check admin role after authentication
  const checkAdmin = () => {
    // Check if user is admin
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
  };

  // First authenticate the user, then check admin role
  authenticate(req, res, checkAdmin);
};

module.exports = isAdmin;

