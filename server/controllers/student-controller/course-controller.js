// server/controllers/student-controller/course-controller.js
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");
const { asyncHandler } = require("../../middleware/error-handler");
const { validatePagination } = require("../../middleware/validation");

// @desc    Get all published courses with filters
// @route   GET /student/course/get
// @access  Public
const getAllPublishedCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    level,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    minPrice,
    maxPrice,
  } = req.query;

  const skip = (page - 1) * limit;
  const query = { isPublished: true, status: "published" };

  // فیلترهای درست شده (اینجا مهم!)
  if (category) {
    const categories = category.split(",").map((c) => c.trim());
    query.category = { $in: categories };
  }

  if (level) {
    const levels = level.split(",").map((l) => l.trim());
    query.level = { $in: levels };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.pricing = {};
    if (minPrice !== undefined) query.pricing.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) query.pricing.$lte = parseFloat(maxPrice);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { subtitle: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const courses = await Course.find(query)
    .populate("instructorId", "userName userEmail profile")
    .select("-curriculum -students")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Course.countDocuments(query);

  const categories = await Course.distinct("category", { isPublished: true });
  const levels = await Course.distinct("level", { isPublished: true });

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
      filters: {
        categories,
        levels,
      },
    },
  });
});

// @desc    Get course details by ID
// @route   GET /student/course/get/details/:id
// @access  Public
const getCourseDetails = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.id,
    isPublished: true,
    status: "published",
  })
    .populate("instructorId", "userName userEmail profile")
    .select("-students");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // Check if user is enrolled (if authenticated)
  let isEnrolled = false;
  let userProgress = null;

  if (req.user) {
    const userId = req.user.userId || req.user._id;
    const studentCourse = await StudentCourses.findOne({
      userId,
      "courses.courseId": req.params.id,
    });

    if (studentCourse) {
      isEnrolled = true;
      // Get progress if enrolled
      const Progress = require("../../models/CourseProgress");
      userProgress = await Progress.findOne({
        userId,
        courseId: req.params.id,
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      course,
      enrollment: {
        isEnrolled,
        progress: userProgress,
      },
    },
  });
});

// @desc    Get featured courses
// @route   GET /student/course/featured
// @access  Public
const getFeaturedCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const courses = await Course.find({
    isPublished: true,
    status: "published",
    isFeatured: true,
  })
    .populate("instructorId", "userName userEmail profile")
    .select("-curriculum -students")
    .sort({ "rating.average": -1, totalEnrollments: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    data: { courses },
  });
});

// @desc    Get courses by category
// @route   GET /student/course/category/:category
// @access  Public
const getCoursesByCategory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const skip = (page - 1) * limit;

  const courses = await Course.find({
    category: req.params.category,
    isPublished: true,
    status: "published",
  })
    .populate("instructorId", "userName userEmail profile")
    .select("-curriculum -students")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Course.countDocuments({
    category: req.params.category,
    isPublished: true,
    status: "published",
  });

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

// @desc    Check if user can purchase course
// @route   GET /student/course/purchase-info/:courseId
// @access  Private
const getPurchaseInfo = asyncHandler(async (req, res) => {
  const { courseId, studentId } = req.params;
  const userId = req.user?.userId || req.user?._id;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing user identifier",
    });
  }

  if (studentId && String(studentId) !== String(userId)) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const studentCourse = await StudentCourses.findOne({
    userId,
    "courses.courseId": courseId,
  });

  const canPurchase = !studentCourse && course.isPublished;

  res.status(200).json({
    success: true,
    data: {
      canPurchase,
      isEnrolled: !!studentCourse,
      course: {
        _id: course._id,
        title: course.title,
        pricing: course.pricing,
        image: course.image,
      },
    },
  });
});

module.exports = {
  getAllPublishedCourses,
  getCourseDetails,
  getFeaturedCourses,
  getCoursesByCategory,
  getPurchaseInfo,
};
