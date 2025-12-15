const mongoose = require("mongoose");

const LiveClassPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Live plan title is required"],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      required: [true, "Timezone is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    weekdays: {
      type: [Number],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one weekday must be selected",
      },
    },
    dailyStartTime: {
      type: String,
      required: [true, "Daily start time is required"],
    },
    dailyEndTime: {
      type: String,
      required: [true, "Daily end time is required"],
    },
    minAttendanceMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

LiveClassPlanSchema.index({ instructorId: 1, status: 1 });

module.exports = mongoose.model("LiveClassPlan", LiveClassPlanSchema);

