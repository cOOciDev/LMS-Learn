const StudentCourses = require("../../models/StudentCourses");

const normalizeId = (id) => {
  if (!id) return id;
  if (typeof id === "object" && typeof id.toString === "function") {
    return id.toString();
  }
  return id;
};

const getCoursesByStudentId = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.userId || req.user?._id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User identifier missing",
      });
    }

    const studentBoughtCourses = await StudentCourses.findOne({ userId });

    res.status(200).json({
      success: true,
      data: studentBoughtCourses?.courses || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "خطای سرور. لطفاً دوباره تلاش کنید.",
    });
  }
};

module.exports = { getCoursesByStudentId };
