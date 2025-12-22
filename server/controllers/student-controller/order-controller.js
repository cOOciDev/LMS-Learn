const stripe = require("../../helpers/stripe");
const Order = require("../../models/Order");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

const normalizeId = (value) => {
  if (!value) return value;
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString();
  }
  return value;
};

async function upsertStudentCourse(userId, coursePayload) {
  const normalizedUserId = normalizeId(userId);
  const normalizedCourseId = normalizeId(coursePayload.courseId);

  const studentCourses = await StudentCourses.findOne({ userId: normalizedUserId });
  const preparedCoursePayload = {
    ...coursePayload,
    courseId: normalizedCourseId,
  };

  if (studentCourses) {
    const alreadyAdded = studentCourses.courses?.some(
      (course) => normalizeId(course.courseId) === normalizedCourseId
    );
    if (!alreadyAdded) {
      studentCourses.courses.push(preparedCoursePayload);
      await studentCourses.save();
    }
  } else {
    const newStudentCourses = new StudentCourses({
      userId: normalizedUserId,
      courses: [preparedCoursePayload],
    });
    await newStudentCourses.save();
  }
}

async function enrollStudentInCourse(course, { userId, userName, userEmail, amount, purchaseDate }) {
  if (!course) return;
  const normalizedUserId = normalizeId(userId);
  const alreadyEnrolled = course.students?.some(
    (student) => normalizeId(student.studentId) === normalizedUserId
  );

  if (!alreadyEnrolled) {
    course.students.push({
      studentId: normalizedUserId,
      studentName: userName,
      studentEmail: userEmail,
      paidAmount: amount,
      enrolledAt: purchaseDate,
    });
    course.totalEnrollments = course.students.length;
  }

  course.totalRevenue = (course.totalRevenue || 0) + amount;
  await course.save();
}

const createOrder = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.userId || req.user?._id);
    const userName = req.user?.userName || "Student";
    const userEmail = req.user?.userEmail || "";
    const { courseId, orderDate } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const coursePricing = Number(course.pricing) || 0;
    const instructorId = course.instructorId;
    const instructorName = course.instructorName;
    const courseTitle = course.title;
    const courseImage = course.image;
    const purchaseDate = orderDate || new Date();
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

    // Handle free courses without Stripe checkout
    if (coursePricing <= 0) {
      const order = new Order({
        userId,
        userName,
        userEmail,
        orderStatus: "confirmed",
        paymentMethod: "free",
        paymentStatus: "paid",
        orderDate: purchaseDate,
        instructorId,
        instructorName,
        courseImage,
        courseTitle,
        courseId,
        coursePricing: 0,
      });

      await order.save();

      await upsertStudentCourse(userId, {
        courseId,
        title: courseTitle,
        instructorId,
        instructorName,
        dateOfPurchase: purchaseDate,
        courseImage,
      });

      await enrollStudentInCourse(course, {
        userId,
        userName,
        userEmail,
        amount: 0,
        purchaseDate,
      });

      return res.status(201).json({
        success: true,
        message: "Course unlocked successfully",
        data: {
          orderId: order._id,
          freeEnrollment: true,
        },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: courseTitle,
              images: [courseImage],
            },
            unit_amount: Math.round(coursePricing * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${CLIENT_URL}/payment-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/course/details/${courseId}`,
    });

    // Immediately create an order and set status to 'paid'
    const order = new Order({
      userId,
      userName,
      userEmail,
      orderStatus: "confirmed",
      paymentMethod: "card",
      paymentStatus: "paid",
      orderDate: purchaseDate,
      paymentId: session.id,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    });

    await order.save();

    await upsertStudentCourse(userId, {
      courseId,
      title: courseTitle,
      instructorId,
      instructorName,
      dateOfPurchase: purchaseDate,
      courseImage,
    });

    await enrollStudentInCourse(course, {
      userId,
      userName,
      userEmail,
      amount: coursePricing,
      purchaseDate,
    });

    // Return session details
    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        orderId: order._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error while creating order!",
    });
  }
};

const captureOrder = async (req, res) => {
  try {
    const { orderId, paymentId, payerId } = req.body;
    const userId = normalizeId(req.user?.userId || req.user?._id);
    const userName = req.user?.userName || "Student";
    const userEmail = req.user?.userEmail || "";

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: "Missing capture identifiers",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!userId || String(order.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    order.paymentStatus = "paid";
    order.paymentMethod = order.paymentMethod || "card";
    order.paymentResult = {
      paymentId,
      payerId,
      capturedAt: new Date(),
    };

    await order.save();

    await upsertStudentCourse(userId, {
      courseId: order.courseId,
      title: order.courseTitle,
      instructorId: order.instructorId,
      instructorName: order.instructorName,
      dateOfPurchase: order.orderDate,
      courseImage: order.courseImage,
    });
    const course = await Course.findById(order.courseId);
    await enrollStudentInCourse(course, {
      userId,
      userName,
      userEmail,
      amount: order.coursePricing || 0,
      purchaseDate: order.orderDate || new Date(),
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error while capturing order!",
    });
  }
};

module.exports = {
  createOrder,
  captureOrder,
};
