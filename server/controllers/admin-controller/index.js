const User = require("../../models/User");
const Course = require("../../models/Course");
const Order = require("../../models/Order");
const { asyncHandler } = require("../../middleware/error-handler");
const { validatePagination } = require("../../middleware/validation");

// @desc    Get all users with pagination and filters
// @route   GET /admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, isActive } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: "i" } },
      { userEmail: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password -refreshToken -passwordResetToken")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get user by ID
// @route   GET /admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -refreshToken -passwordResetToken"
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// @desc    Update user
// @route   PUT /admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive, profile } = req.body;

  const updateData = {};
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (profile) updateData.profile = profile;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -passwordResetToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: { user },
  });
});

// @desc    Delete user
// @route   DELETE /admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Soft delete - set isActive to false
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
  });
});

// @desc    Get dashboard statistics
// @route   GET /admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalInstructors,
    totalStudents,
    totalCourses,
    publishedCourses,
    totalOrders,
    totalRevenue,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "instructor" }),
    User.countDocuments({ role: "user" }),
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Order.countDocuments({ paymentStatus: "completed" }),
    Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$coursePricing" } } } },
    ]),
    User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const revenue = totalRevenue[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        users: {
          total: totalUsers,
          instructors: totalInstructors,
          students: totalStudents,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: totalCourses - publishedCourses,
        },
        revenue: {
          total: revenue,
          orders: totalOrders,
        },
      },
      recentUsers,
    },
  });
});

// @desc    Get all courses with filters
// @route   GET /admin/courses
// @access  Private/Admin
const getAllCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search, category } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const courses = await Course.find(query)
    .populate("instructorId", "userName userEmail")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Course.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getAllCourses,
};

