const CourseProgress = require("../../models/CourseProgress");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");
const ExerciseSubmission = require("../../models/ExerciseSubmission");
const CourseCertificate = require("../../models/CourseCertificate");

//mark current lecture as viewed
const markCurrentLectureAsViewed = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { courseId, lectureId } = req.body;

    if (!userId || !courseId || !lectureId) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        lecturesProgress: [
          {
            lectureId,
            viewed: true,
            dateViewed: new Date(),
          },
        ],
      });
      await progress.save();
    } else {
      const lectureProgress = progress.lecturesProgress.find(
        (item) => item.lectureId === lectureId
      );

      if (lectureProgress) {
        lectureProgress.viewed = true;
        lectureProgress.dateViewed = new Date();
      } else {
        progress.lecturesProgress.push({
          lectureId,
          viewed: true,
          dateViewed: new Date(),
        });
      }
      await progress.save();
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    //check all the lectures are viewed or not
    const allLecturesViewed =
      progress.lecturesProgress.length === course.curriculum.length &&
      progress.lecturesProgress.every((item) => item.viewed);

    if (allLecturesViewed) {
      progress.completed = true;
      progress.completionDate = new Date();

      await progress.save();
    }

    res.status(200).json({
      success: true,
      message: "Lecture marked as viewed",
      data: progress,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

//get current course progress
const getCurrentCourseProgress = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { courseId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing user identifier",
      });
    }

    const studentPurchasedCourses = await StudentCourses.findOne({ userId });

    const isCurrentCoursePurchasedByCurrentUserOrNot =
      studentPurchasedCourses?.courses?.some(
        (item) => item.courseId?.toString() === courseId?.toString()
      ) || false;

    if (!isCurrentCoursePurchasedByCurrentUserOrNot) {
      return res.status(200).json({
        success: true,
        data: {
          isPurchased: false,
        },
        message: "You need to purchase this course to access it.",
      });
    }

    const currentUserCourseProgress = await CourseProgress.findOne({
      userId,
      courseId,
    });

    const courseDetails = await Course.findById(courseId);
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const certificateDoc = await CourseCertificate.findOne({
      userId,
      courseId,
    });
    const exerciseRequirementsCount =
      courseDetails?.curriculum?.filter(
        (lecture) => lecture.exerciseRequired || lecture.exercisePrompt
      ).length || 0;

    if (
      !currentUserCourseProgress ||
      currentUserCourseProgress?.lecturesProgress?.length === 0
    ) {
      return res.status(200).json({
        success: true,
        message: "No progress found, you can start watching the course",
        data: {
          courseDetails,
          progress: [],
          isPurchased: true,
          certificate: certificateDoc
            ? {
                status: certificateDoc.status,
                issuedAt: certificateDoc.issuedAt,
                certificateCode: certificateDoc.certificateCode,
                feedback: certificateDoc.feedback,
              }
            : {
                status:
                  exerciseRequirementsCount > 0
                    ? "not_requested"
                    : "not_required",
              },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        courseDetails,
        progress: currentUserCourseProgress.lecturesProgress,
        completed: currentUserCourseProgress.completed,
        completionDate: currentUserCourseProgress.completionDate,
        isPurchased: true,
        certificate: certificateDoc
          ? {
              status: certificateDoc.status,
              issuedAt: certificateDoc.issuedAt,
              certificateCode: certificateDoc.certificateCode,
              feedback: certificateDoc.feedback,
            }
          : {
              status:
                exerciseRequirementsCount > 0
                  ? "not_requested"
                  : "not_required",
            },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

//reset course progress

const resetCurrentCourseProgress = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    const progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found!",
      });
    }

    progress.lecturesProgress = [];
    progress.completed = false;
    progress.completionDate = null;

    await progress.save();

    res.status(200).json({
      success: true,
      message: "Course progress has been reset",
      data: progress,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getCourseExercises = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { courseId } = req.params;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    const [course, submissions] = await Promise.all([
      Course.findById(courseId),
      ExerciseSubmission.find({ userId, courseId }).lean(),
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const submissionMap = submissions.reduce((acc, sub) => {
      acc[sub.lectureId] = sub;
      return acc;
    }, {});

    const lectures = course.curriculum.map((lecture) => ({
      lectureId: lecture._id.toString(),
      title: lecture.title,
      exercisePrompt: lecture.exercisePrompt || "",
      exerciseRequired: !!lecture.exerciseRequired,
      submission: submissionMap[lecture._id.toString()] || null,
    }));

    const requiredLectures = lectures.filter(
      (lecture) => lecture.exerciseRequired || lecture.exercisePrompt
    );

    const submittedCount = requiredLectures.filter(
      (lecture) => submissionMap[lecture.lectureId]
    ).length;

    res.status(200).json({
      success: true,
      data: {
        lectures,
        summary: {
          totalRequired: requiredLectures.length,
          submitted: submittedCount,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const submitCourseExercise = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { courseId, lectureId, answer, attachmentUrl } = req.body;

    if (!userId || !courseId || !lectureId || !answer) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lecture = course.curriculum.id(lectureId) ||
      course.curriculum.find(
        (item) => item._id.toString() === lectureId.toString()
      );

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    const studentBoughtCourses = await StudentCourses.findOne({ userId });
    const hasCourse =
      studentBoughtCourses?.courses?.some(
        (item) => item.courseId?.toString() === courseId.toString()
      ) || false;

    if (!hasCourse) {
      return res.status(403).json({
        success: false,
        message: "You must enroll in the course before submitting exercises",
      });
    }

    let submission = await ExerciseSubmission.findOne({
      userId,
      courseId,
      lectureId,
    });

    if (!submission) {
      submission = new ExerciseSubmission({
        userId,
        courseId,
        lectureId,
        answer,
        attachmentUrl,
      });
    } else {
      submission.answer = answer;
      submission.attachmentUrl = attachmentUrl;
      submission.status = "pending";
      submission.feedback = undefined;
      submission.submittedAt = new Date();
    }

    await submission.save();

    const requiredLectures = course.curriculum
      .filter((item) => item.exerciseRequired || item.exercisePrompt)
      .map((item) => item._id.toString());

    let certificate;
    if (requiredLectures.length > 0) {
      const submissions = await ExerciseSubmission.find({
        userId,
        courseId,
        lectureId: { $in: requiredLectures },
      }).lean();

      const allSubmitted =
        submissions.length === requiredLectures.length &&
        requiredLectures.every((id) =>
          submissions.find((sub) => sub.lectureId === id)
        );

      if (allSubmitted) {
        certificate = await CourseCertificate.findOne({ userId, courseId });
        if (!certificate) {
          certificate = await CourseCertificate.create({
            userId,
            courseId,
            status: "pending",
          });
        } else if (certificate.status === "rejected") {
          certificate.status = "pending";
          certificate.feedback = undefined;
          certificate.requestedAt = new Date();
          await certificate.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Exercise submitted for review",
      data: {
        submission,
        certificateStatus: certificate?.status,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getCertificateStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { courseId } = req.params;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const certificate = await CourseCertificate.findOne({
      userId,
      courseId,
    });

    const exercisesRequired =
      course.curriculum?.some(
        (lecture) => lecture.exerciseRequired || lecture.exercisePrompt
      ) || false;

    res.status(200).json({
      success: true,
      data: certificate
        ? {
            status: certificate.status,
            issuedAt: certificate.issuedAt,
            certificateCode: certificate.certificateCode,
            feedback: certificate.feedback,
          }
        : {
            status: exercisesRequired ? "not_requested" : "not_required",
          },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  markCurrentLectureAsViewed,
  getCurrentCourseProgress,
  resetCurrentCourseProgress,
  getCourseExercises,
  submitCourseExercise,
  getCertificateStatus,
};
