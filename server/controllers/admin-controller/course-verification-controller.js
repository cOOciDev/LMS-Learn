const ExerciseSubmission = require("../../models/ExerciseSubmission");
const CourseCertificate = require("../../models/CourseCertificate");
const StudentCourses = require("../../models/StudentCourses");

const listExerciseSubmissions = async (req, res) => {
  try {
    const { status, courseId, userId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (courseId) query.courseId = courseId;
    if (userId) query.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [submissions, total] = await Promise.all([
      ExerciseSubmission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("courseId", "title")
        .populate("userId", "userName userEmail")
        .lean(),
      ExerciseSubmission.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exercise submissions",
    });
  }
};

const reviewExerciseSubmission = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const { submissionId } = req.params;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const submission = await ExerciseSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    submission.status = status;
    submission.feedback = feedback;
    submission.reviewedAt = new Date();
    await submission.save();

    res.status(200).json({
      success: true,
      data: submission,
      message: "Submission updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update submission",
    });
  }
};

const listCertificateRequests = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      CourseCertificate.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("courseId", "title")
        .populate("userId", "userName userEmail")
        .lean(),
      CourseCertificate.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificate requests",
    });
  }
};

const generateCertificateCode = (userId, courseId) =>
  `CERT-${String(userId).slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${String(courseId).slice(-4).toUpperCase()}`;

const reviewCertificateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, feedback } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const certificate = await CourseCertificate.findById(requestId);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate request not found",
      });
    }

    certificate.status = status;
    certificate.feedback = feedback;
    certificate.reviewedAt = new Date();

    if (status === "approved") {
      certificate.issuedAt = new Date();
      certificate.certificateCode =
        certificate.certificateCode ||
        generateCertificateCode(certificate.userId, certificate.courseId);

      await StudentCourses.updateOne(
        { userId: certificate.userId, "courses.courseId": certificate.courseId },
        {
          $set: {
            "courses.$.certificateIssuedAt": certificate.issuedAt,
            "courses.$.certificateCode": certificate.certificateCode,
          },
        }
      );
    }

    await certificate.save();

    res.status(200).json({
      success: true,
      data: certificate,
      message:
        status === "approved"
          ? "Certificate issued"
          : "Certificate request rejected",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update certificate request",
    });
  }
};

module.exports = {
  listExerciseSubmissions,
  reviewExerciseSubmission,
  listCertificateRequests,
  reviewCertificateRequest,
};
