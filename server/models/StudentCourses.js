const mongoose = require("mongoose");

const StudentCoursesSchema = new mongoose.Schema({
  userId: String,
  courses: [
    {
      courseId: String,
      title: String,
      instructorId: String,
      instructorName: String,
      dateOfPurchase: Date,
      courseImage: String,
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      ratedAt: Date,
      certificateIssuedAt: Date,
      certificateCode: String,
    },
  ],
});

module.exports = mongoose.model("StudentCourses", StudentCoursesSchema);
