const Category = require("../../models/Category");
const Course = require("../../models/Course");
const { asyncHandler } = require("../../middleware/error-handler");

const DEFAULT_CATEGORIES = [
  {
    name: "Web Development",
    slug: "web-development",
    description: "Frontend frameworks, responsive design, and full-stack skills.",
    translations: { fa: "توسعه وب" },
  },
  {
    name: "Backend Development",
    slug: "backend-development",
    description: "Server-side frameworks, APIs, and database mastery.",
    translations: { fa: "توسعه بک‌اند" },
  },
  {
    name: "Data Science",
    slug: "data-science",
    description: "Data analysis, visualization, and statistics.",
    translations: { fa: "علم داده" },
  },
  {
    name: "Machine Learning",
    slug: "machine-learning",
    description: "ML models, deep learning, and practical AI workflows.",
    translations: { fa: "یادگیری ماشینی" },
  },
  {
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description: "AI fundamentals, agents, and intelligent systems.",
    translations: { fa: "هوش مصنوعی" },
  },
  {
    name: "Cloud Computing",
    slug: "cloud-computing",
    description: "AWS, Azure, GCP, and cloud-native architectures.",
    translations: { fa: "رایانش ابری" },
  },
  {
    name: "Cyber Security",
    slug: "cyber-security",
    description: "Security principles, threat detection, and ethical hacking.",
    translations: { fa: "امنیت سایبری" },
  },
  {
    name: "Mobile Development",
    slug: "mobile-development",
    description: "Native and cross-platform mobile application development.",
    translations: { fa: "توسعه موبایل" },
  },
  {
    name: "Game Development",
    slug: "game-development",
    description: "Game engines, design patterns, and interactive storytelling.",
    translations: { fa: "توسعه بازی" },
  },
  {
    name: "Software Engineering",
    slug: "software-engineering",
    description: "Architecture, testing, and delivery best practices.",
    translations: { fa: "مهندسی نرم‌افزار" },
  },
];

const generateSlug = (value = "") => {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const ensureDefaultCategories = async () => {
  const existing = await Category.find({}, "slug").lean();
  const existingSlugs = new Set(existing.map((category) => category.slug));

  const categoriesToInsert = DEFAULT_CATEGORIES.filter(
    (category) => !existingSlugs.has(category.slug)
  );

  if (categoriesToInsert.length > 0) {
    await Category.insertMany(categoriesToInsert);
  }
};

// @desc    Get categories for admin panel
// @route   GET /admin/categories
// @access  Private/Admin
const getAdminCategories = asyncHandler(async (req, res) => {
  await ensureDefaultCategories();
  const [categories, courseCounts] = await Promise.all([
    Category.find().sort({ createdAt: -1 }).lean(),
    Course.aggregate([
      {
        $group: {
          _id: "$category",
          totalCourses: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countsMap = courseCounts.reduce((acc, item) => {
    if (item?._id) {
      acc[item._id] = item.totalCourses;
    }
    return acc;
  }, {});

  const enrichedCategories = categories.map((category) => ({
    ...category,
    courseCount: countsMap[category.slug] || 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      categories: enrichedCategories,
    },
  });
});

// @desc    Create a new category
// @route   POST /admin/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, nameFa, slug: slugInput } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  const slug = slugInput ? generateSlug(slugInput) : generateSlug(name);
  if (!slug) {
    return res.status(400).json({
      success: false,
      message: "Unable to generate slug for category",
    });
  }

  const translations = {};
  if (req.body.translations && typeof req.body.translations === "object") {
    if (req.body.translations.fa) {
      translations.fa = req.body.translations.fa.trim();
    }
  } else if (nameFa) {
    translations.fa = nameFa.trim();
  }

  const category = await Category.create({
    name: name.trim(),
    slug,
    description: description?.trim(),
    translations,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: {
      category,
    },
  });
});

// @desc    Delete a category
// @route   DELETE /admin/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  const assignedCourses = await Course.countDocuments({
    category: category.slug,
  });

  if (assignedCourses > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete category that has courses assigned to it",
    });
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

// @desc    Public categories list
// @route   GET /categories
// @access  Public
const getPublicCategories = asyncHandler(async (req, res) => {
  await ensureDefaultCategories();
  const categories = await Category.find({ isActive: true })
    .sort({ createdAt: 1 })
    .select("name slug description translations isActive createdAt updatedAt")
    .lean();

  res.status(200).json({
    success: true,
    data: {
      categories,
    },
  });
});

module.exports = {
  getAdminCategories,
  createCategory,
  deleteCategory,
  getPublicCategories,
};
