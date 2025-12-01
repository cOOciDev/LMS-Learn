const mongoose = require("mongoose");

const RoadmapStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    courseTitle: String,
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const RoadmapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    categorySlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    steps: {
      type: [RoadmapStepSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Roadmap", RoadmapSchema);
