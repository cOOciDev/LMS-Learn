const LiveClassPlan = require("../../models/LiveClassPlan");
const { asyncHandler } = require("../../middleware/error-handler");

const getPublishedLivePlans = asyncHandler(async (req, res) => {
  const { limit, courseId } = req.query;
  const query = { status: "published" };

  if (courseId) {
    query.courseId = courseId;
  }

  let livePlansQuery = LiveClassPlan.find(query).sort({ startDate: 1 });

  if (limit) {
    const parsedLimit = Number(limit);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      livePlansQuery = livePlansQuery.limit(parsedLimit);
    }
  }

  const plans = await livePlansQuery;

  res.json({
    success: true,
    data: plans,
  });
});

const getPublishedLivePlanById = asyncHandler(async (req, res) => {
  const plan = await LiveClassPlan.findOne({
    _id: req.params.id,
    status: "published",
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

module.exports = { getPublishedLivePlans, getPublishedLivePlanById };
