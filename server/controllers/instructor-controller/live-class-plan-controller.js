const LiveClassPlan = require("../../models/LiveClassPlan");
const Course = require("../../models/Course");
const { asyncHandler } = require("../../middleware/error-handler");

const buildError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const toMinutes = (time) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
};

const validatePayload = (payload) => {
  const requiredFields = [
    "title",
    "timezone",
    "startDate",
    "endDate",
    "weekdays",
    "dailyStartTime",
    "dailyEndTime",
  ];

  requiredFields.forEach((field) => {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      payload[field] === ""
    ) {
      buildError(`${field} is required`);
    }
  });

  if (!Array.isArray(payload.weekdays) || payload.weekdays.length === 0) {
    buildError("At least one weekday must be selected");
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    buildError("Invalid start or end date");
  }
  if (startDate >= endDate) {
    buildError("End date must be after start date");
  }

  const startMinutes = toMinutes(payload.dailyStartTime);
  const endMinutes = toMinutes(payload.dailyEndTime);
  if (startMinutes === null || endMinutes === null) {
    buildError("Daily start and end time must be valid HH:mm values");
  }
  if (endMinutes <= startMinutes) {
    buildError("Daily end time must be after start time");
  }
};

const ensureCourseOwnership = async (courseId, instructorId) => {
  if (!courseId) return;
  const course = await Course.findOne({
    _id: courseId,
    instructorId,
  }).select("_id");

  if (!course) {
    buildError("Course not found or unauthorized", 404);
  }
};

const createLiveClassPlan = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const payload = req.body;

  validatePayload(payload);
  await ensureCourseOwnership(payload.courseId, instructorId);

  const plan = await LiveClassPlan.create({
    ...payload,
    courseId: payload.courseId || null,
    instructorId,
    status: "draft",
  });

  res.status(201).json({
    success: true,
    data: plan,
  });
});

const getLiveClassPlans = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const plans = await LiveClassPlan.find({ instructorId }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    data: plans,
  });
});

const getLiveClassPlanById = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const plan = await LiveClassPlan.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Live class plan not found",
    });
  }

  res.json({
    success: true,
    data: plan,
  });
});

const updateLiveClassPlan = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const plan = await LiveClassPlan.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Live class plan not found",
    });
  }

  if (plan.status === "archived") {
    return res.status(400).json({
      success: false,
      message: "Archived plans cannot be updated",
    });
  }

  const mergedPayload = { ...plan.toObject(), ...req.body };
  validatePayload(mergedPayload);
  await ensureCourseOwnership(req.body.courseId, instructorId);

  Object.assign(plan, req.body);
  if (!req.body.courseId) {
    plan.courseId = null;
  }
  await plan.save();

  res.json({
    success: true,
    data: plan,
  });
});

const publishLiveClassPlan = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const plan = await LiveClassPlan.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Live class plan not found",
    });
  }

  if (plan.status === "archived") {
    return res.status(400).json({
      success: false,
      message: "Archived plans cannot be published",
    });
  }

  if (plan.status === "published") {
    return res.status(400).json({
      success: false,
      message: "Plan is already published",
    });
  }

  plan.status = "published";
  await plan.save();

  res.json({
    success: true,
    data: plan,
  });
});

const archiveLiveClassPlan = asyncHandler(async (req, res) => {
  const instructorId = req.user.userId || req.user._id;
  const plan = await LiveClassPlan.findOne({
    _id: req.params.id,
    instructorId,
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Live class plan not found",
    });
  }

  if (plan.status === "archived") {
    return res.status(400).json({
      success: false,
      message: "Plan is already archived",
    });
  }

  plan.status = "archived";
  await plan.save();

  res.json({
    success: true,
    message: "Plan archived successfully",
  });
});

module.exports = {
  createLiveClassPlan,
  getLiveClassPlans,
  getLiveClassPlanById,
  updateLiveClassPlan,
  publishLiveClassPlan,
  archiveLiveClassPlan,
};

