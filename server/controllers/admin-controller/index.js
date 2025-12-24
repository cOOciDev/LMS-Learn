const User = require("../../models/User");
const Course = require("../../models/Course");
const Order = require("../../models/Order");
const { asyncHandler } = require("../../middleware/error-handler");
const { validatePagination } = require("../../middleware/validation");

// @desc    Get all users with pagination and filters
// @route   GET /admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, isActive, excludeRole, excludeRoles } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (role) {
    query.role = role;
  } else {
    const excluded = []
      .concat(excludeRoles ? String(excludeRoles).split(",") : [])
      .concat(excludeRole ? [excludeRole] : [])
      .map((item) => String(item).trim())
      .filter(Boolean);
    if (excluded.length > 0) {
      query.role = { $nin: excluded };
    }
  }
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: "i" } },
      { userEmail: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select(
      "-password -refreshToken -resetPasswordTokenHash -resetPasswordExpires"
    )
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
    "-password -refreshToken -resetPasswordTokenHash -resetPasswordExpires"
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
  ).select(
    "-password -refreshToken -resetPasswordTokenHash -resetPasswordExpires"
  );

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

// @desc    Get user growth statistics
// @route   GET /admin/users/growth/stats
// @access  Private/Admin
const getUserGrowthStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [total, active, thisMonth, lastMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      active,
      thisMonth,
      lastMonth,
      growth: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0,
    },
  });
});

// @desc    Get financial reports summary
// @route   GET /admin/financial/reports
// @access  Private/Admin
const getFinancialReports = asyncHandler(async (req, res) => {
  const paidMatchStage = { paymentStatus: "paid" };

  const [revenueSummary, monthlyRevenue, topCourses, topInstructors] = await Promise.all([
    Order.aggregate([
      { $match: paidMatchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $toDouble: "$coursePricing" } },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: paidMatchStage },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
          revenue: { $sum: { $toDouble: "$coursePricing" } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.aggregate([
      { $match: paidMatchStage },
      {
        $group: {
          _id: "$courseId",
          title: { $first: "$courseTitle" },
          revenue: { $sum: { $toDouble: "$coursePricing" } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: paidMatchStage },
      {
        $group: {
          _id: "$instructorId",
          instructorName: { $first: "$instructorName" },
          revenue: { $sum: { $toDouble: "$coursePricing" } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const summary = revenueSummary[0] || { totalRevenue: 0, totalOrders: 0 };
  const avgOrderValue =
    summary.totalOrders > 0
      ? Number(summary.totalRevenue / summary.totalOrders).toFixed(2)
      : 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalRevenue: summary.totalRevenue || 0,
        totalOrders: summary.totalOrders || 0,
        avgOrderValue,
      },
      monthlyRevenue,
      topCourses,
      topInstructors,
    },
  });
});

// @desc    Get all instructors with stats
// @route   GET /admin/instructors
// @access  Private/Admin
const getAllInstructors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  const skip = (page - 1) * limit;

  const matchQuery = { role: "instructor" };
  if (search) {
    matchQuery.$or = [
      { userName: { $regex: search, $options: "i" } },
      { userEmail: { $regex: search, $options: "i" } },
    ];
  }
  if (isActive !== undefined) {
    matchQuery.isActive = isActive === "true";
  }

  const [instructors, total, totalInstructors, activeInstructors, courseStats] =
    await Promise.all([
      User.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "instructorId",
            as: "courses",
          },
        },
        {
          $addFields: {
            ratingAverage: {
              $cond: [
                { $gt: [{ $size: "$courses" }, 0] },
                {
                  $avg: {
                    $map: {
                      input: "$courses",
                      as: "course",
                      in: "$$course.rating.average",
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            totalCourses: { $size: "$courses" },
            publishedCourses: {
              $size: {
                $filter: {
                  input: "$courses",
                  as: "course",
                  cond: { $eq: ["$$course.isPublished", true] },
                },
              },
            },
            totalStudents: { $sum: "$courses.totalEnrollments" },
          },
        },
        {
          $project: {
            password: 0,
            refreshToken: 0,
            courses: 0,
            resetPasswordTokenHash: 0,
            resetPasswordExpires: 0,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]),
      User.countDocuments(matchQuery),
      User.countDocuments({ role: "instructor" }),
      User.countDocuments({ role: "instructor", isActive: true }),
      Course.aggregate([
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            publishedCourses: {
              $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
            },
            totalStudents: { $sum: "$totalEnrollments" },
          },
        },
      ]),
    ]);

  const aggregatedCourseStats = courseStats[0] || {
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
  };

  res.status(200).json({
    success: true,
    data: {
      instructors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalInstructors,
        activeInstructors,
        totalCourses: aggregatedCourseStats.totalCourses,
        publishedCourses: aggregatedCourseStats.publishedCourses,
        totalStudents: aggregatedCourseStats.totalStudents,
      },
    },
  });
});

// @desc    Get instructor details with courses
// @route   GET /admin/instructors/:id
// @access  Private/Admin
const getInstructorDetails = asyncHandler(async (req, res) => {
  const instructor = await User.findOne({
    _id: req.params.id,
    role: "instructor",
  }).select(
    "-password -refreshToken -resetPasswordTokenHash -resetPasswordExpires"
  );

  if (!instructor) {
    return res.status(404).json({
      success: false,
      message: "Instructor not found",
    });
  }

  const courses = await Course.find({ instructorId: instructor._id })
    .sort({ createdAt: -1 })
    .select(
      "title status isPublished totalEnrollments createdAt level category pricing"
    );

  res.status(200).json({
    success: true,
    data: {
      instructor,
      courses,
    },
  });
});

// @desc    Update instructor (status/profile)
// @route   PUT /admin/instructors/:id
// @access  Private/Admin
const updateInstructor = asyncHandler(async (req, res) => {
  const { isActive, profile } = req.body;

  const instructor = await User.findOne({
    _id: req.params.id,
    role: "instructor",
  });

  if (!instructor) {
    return res.status(404).json({
      success: false,
      message: "Instructor not found",
    });
  }

  if (isActive !== undefined) {
    instructor.isActive = isActive;
  }
  if (profile) {
    instructor.profile = profile;
  }

  await instructor.save();

  res.status(200).json({
    success: true,
    message: "Instructor updated successfully",
    data: {
      instructor: {
        _id: instructor._id,
        userName: instructor.userName,
        userEmail: instructor.userEmail,
        isActive: instructor.isActive,
        profile: instructor.profile,
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
  getUserGrowthStats,
  getFinancialReports,
  getAllInstructors,
  getInstructorDetails,
  updateInstructor,
};

