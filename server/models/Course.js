const mongoose = require("mongoose");

const LectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    public_id: String,
    freePreview: {
      type: Boolean,
      default: false,
    },
    duration: Number, // Duration in seconds
    order: {
      type: Number,
      default: 0,
    },
    description: String,
  },
  { _id: true }
);

const CourseSchema = new mongoose.Schema(
  {
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor ID is required"],
      index: true,
    },
    instructorName: {
      type: String,
      required: [true, "Instructor name is required"],
    },
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      index: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: [true, "Level is required"],
      index: true,
    },
    primaryLanguage: {
      type: String,
      required: [true, "Primary language is required"],
    },
    subtitle: {
      type: String,
      maxlength: [500, "Subtitle cannot exceed 500 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    image: {
      type: String,
      required: [true, "Course image is required"],
    },
    welcomeMessage: String,
    pricing: {
      type: Number,
      required: [true, "Pricing is required"],
      min: [0, "Pricing cannot be negative"],
      default: 0,
    },
    objectives: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    students: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        studentName: String,
        studentEmail: String,
        paidAmount: Number,
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    curriculum: [LectureSchema],
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    totalEnrollments: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
CourseSchema.index({ instructorId: 1, status: 1 });
CourseSchema.index({ category: 1, level: 1, isPublished: 1 });
CourseSchema.index({ createdAt: -1 });
CourseSchema.index({ "rating.average": -1 });

// Virtual for total lectures
CourseSchema.virtual("totalLectures").get(function () {
  return this.curriculum?.length || 0;
});

// Virtual for total duration
CourseSchema.virtual("totalDuration").get(function () {
  return this.curriculum?.reduce((total, lecture) => total + (lecture.duration || 0), 0) || 0;
});

// Method to calculate completion percentage
CourseSchema.methods.calculateCompletion = function (lecturesProgress) {
  if (!this.curriculum || this.curriculum.length === 0) return 0;
  const viewedCount = lecturesProgress?.filter((lp) => lp.viewed).length || 0;
  return Math.round((viewedCount / this.curriculum.length) * 100);
};

module.exports = mongoose.model("Course", CourseSchema);
