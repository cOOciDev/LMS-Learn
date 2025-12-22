const mongoose = require("mongoose");

const ExerciseSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lectureId: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    attachmentUrl: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    feedback: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

ExerciseSubmissionSchema.index(
  { userId: 1, courseId: 1, lectureId: 1 },
  { unique: true }
);

module.exports = mongoose.model("ExerciseSubmission", ExerciseSubmissionSchema);
