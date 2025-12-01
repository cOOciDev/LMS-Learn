const Roadmap = require("../../models/Roadmap");
const Course = require("../../models/Course");
const { asyncHandler } = require("../../middleware/error-handler");

// @desc    Create roadmap
// @route   POST /admin/roadmaps
// @access  Private/Admin
const createRoadmap = asyncHandler(async (req, res) => {
  const { title, categorySlug, steps } = req.body;

  if (!title || !categorySlug) {
    return res.status(400).json({
      success: false,
      message: "Title and category are required",
    });
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one step is required",
    });
  }

  const stepsWithCourseData = await Promise.all(
    steps.map(async (step, index) => {
      let courseTitle = step.courseTitle;
      if (step.courseId) {
        const course = await Course.findById(step.courseId).select("title");
        courseTitle = course?.title || courseTitle;
      }
      return {
        title: step.title,
        description: step.description,
        courseId: step.courseId || null,
        courseTitle: courseTitle || "",
        order: step.order ?? index,
      };
    })
  );

  const roadmap = await Roadmap.findOneAndUpdate(
    { categorySlug },
    {
      title,
      categorySlug,
      steps: stepsWithCourseData,
      createdBy: req.user?._id,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: "Roadmap saved successfully",
    data: roadmap,
  });
});

// @desc    List roadmaps for admin
// @route   GET /admin/roadmaps
// @access  Private/Admin
const getAdminRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find()
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  res.status(200).json({
    success: true,
    data: roadmaps,
  });
});

// @desc    Get roadmap by category slug
// @route   GET /roadmaps/:slug
// @access  Public
const getRoadmapByCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const roadmap = await Roadmap.findOne({ categorySlug: slug }).lean();

  if (!roadmap) {
    return res.status(404).json({
      success: false,
      message: "Roadmap not found for this category",
    });
  }

  res.status(200).json({
    success: true,
    data: roadmap,
  });
});

module.exports = {
  createRoadmap,
  getAdminRoadmaps,
  getRoadmapByCategory,
};
