const StudentCourses = require("../../models/StudentCourses");
const Course = require("../../models/Course");
const CourseProgress = require("../../models/CourseProgress");
const { asyncHandler } = require("../../middleware/error-handler");

// @desc    Rate a course after completion
// @route   POST /student/course/rate
// @access  Private
const rateCourse = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?._id;
  const { courseId, rating, review } = req.body;

  if (!courseId || !rating) {
    return res.status(400).json({
      success: false,
      message: "Course ID and rating are required",
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  const studentCourses = await StudentCourses.findOne({ userId });
  if (!studentCourses) {
    return res.status(403).json({
      success: false,
      message: "You must purchase this course before rating it",
    });
  }

  const courseEntry = studentCourses.courses.find(
    (item) => item.courseId?.toString() === courseId?.toString()
  );

  if (!courseEntry) {
    return res.status(403).json({
      success: false,
      message: "You must purchase this course before rating it",
    });
  }

  const progress = await CourseProgress.findOne({ userId, courseId });
  if (!progress || !progress.completed) {
    return res.status(400).json({
      success: false,
      message: "Complete the course before leaving a rating",
    });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const previousRating = courseEntry.rating;

  if (previousRating) {
    const total = course.rating.average * course.rating.count;
    const newAverage =
      course.rating.count > 0
        ? (total - previousRating + rating) / course.rating.count
        : rating;
    course.rating.average = Number(newAverage.toFixed(2));
  } else {
    const total = course.rating.average * course.rating.count + rating;
    const count = course.rating.count + 1;
    course.rating.average = Number((total / count).toFixed(2));
    course.rating.count = count;
  }

  courseEntry.rating = rating;
  courseEntry.review = review;
  courseEntry.ratedAt = new Date();

  await Promise.all([studentCourses.save(), course.save()]);

  res.status(200).json({
    success: true,
    message: "Thank you for rating this course",
    data: {
      rating: courseEntry.rating,
      review: courseEntry.review,
    },
  });
});

module.exports = { rateCourse };
