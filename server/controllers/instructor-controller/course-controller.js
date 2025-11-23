const Course = require("../../models/Course");
const mongoose = require("mongoose");
const { asyncHandler } = require("../../middleware/error-handler");
const { validateCourse, validatePagination } = require("../../middleware/validation");

// @desc    Create new course
// @route   POST /instructor/course/add
// @access  Private/Instructor
const addNewCourse = asyncHandler(async (req, res) => {
  const courseData = {
    ...req.body,
    instructorId: req.user.userId || req.user._id,
    instructorName: req.user.userName,
  };

  const course = await Course.create(courseData);

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

// @desc    Get all courses for instructor
// @route   GET /instructor/course/get
// @access  Private/Instructor
const getAllCourses = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (page - 1) * limit;

  const query = { instructorId };

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const courses = await Course.find(query)
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

// @desc    Get course by ID
// @route   GET /instructor/course/get/details/:id
// @access  Private/Instructor
const getCourseById = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const course = await Course.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  res.status(200).json({
    success: true,
    data: { course },
  });
});

// @desc    Update course
// @route   PUT /instructor/course/update/:id
// @access  Private/Instructor
const updateCourse = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const course = await Course.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // Update course data
  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      course[key] = req.body[key];
    }
  });

  await course.save();

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: { course },
  });
});

// @desc    Delete course
// @route   DELETE /instructor/course/delete/:id
// @access  Private/Instructor
const deleteCourse = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const course = await Course.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});

// @desc    Publish/Unpublish course
// @route   PATCH /instructor/course/publish/:id
// @access  Private/Instructor
const togglePublishCourse = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const course = await Course.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // Validate course before publishing
  if (req.body.isPublished && (!course.curriculum || course.curriculum.length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Course must have at least one lecture before publishing",
    });
  }

  course.isPublished = req.body.isPublished !== undefined ? req.body.isPublished : !course.isPublished;
  course.status = course.isPublished ? "published" : "draft";
  await course.save();

  res.status(200).json({
    success: true,
    message: `Course ${course.isPublished ? "published" : "unpublished"} successfully`,
    data: { course },
  });
});

// @desc    Get instructor dashboard stats
// @route   GET /instructor/course/stats
// @access  Private/Instructor
const getInstructorStats = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;

  const [
    totalCourses,
    publishedCourses,
    totalStudents,
    totalRevenue,
    recentCourses,
  ] = await Promise.all([
    Course.countDocuments({ instructorId }),
    Course.countDocuments({ instructorId, isPublished: true }),
    Course.aggregate([
      { $match: { instructorId: mongoose.Types.ObjectId(instructorId) } },
      { $project: { studentCount: { $size: "$students" } } },
      { $group: { _id: null, total: { $sum: "$studentCount" } } },
    ]),
    Course.aggregate([
      { $match: { instructorId: mongoose.Types.ObjectId(instructorId) } },
      { $group: { _id: null, total: { $sum: "$totalRevenue" } } },
    ]),
    Course.find({ instructorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title isPublished totalEnrollments createdAt"),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalStudents: totalStudents[0]?.total || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentCourses,
    },
  });
});

module.exports = {
  addNewCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  getInstructorStats,
};
