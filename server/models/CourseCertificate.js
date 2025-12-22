const mongoose = require("mongoose");

const CourseCertificateSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    certificateCode: String,
    issuedAt: Date,
    feedback: String,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

CourseCertificateSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true }
);

module.exports = mongoose.model("CourseCertificate", CourseCertificateSchema);
