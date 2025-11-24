const stripe = require("../../helpers/stripe");
const Order = require("../../models/Order");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

async function upsertStudentCourse(userId, coursePayload) {
  const studentCourses = await StudentCourses.findOne({ userId });
  if (studentCourses) {
    const alreadyAdded = studentCourses.courses?.some(
      (course) => course.courseId?.toString() === coursePayload.courseId?.toString()
    );
    if (!alreadyAdded) {
      studentCourses.courses.push(coursePayload);
      await studentCourses.save();
    }
  } else {
    const newStudentCourses = new StudentCourses({
      userId,
      courses: [coursePayload],
    });
    await newStudentCourses.save();
  }
}

async function enrollStudentInCourse(course, { userId, userName, userEmail, amount, purchaseDate }) {
  if (!course) return;
  const alreadyEnrolled = course.students?.some(
    (student) => student.studentId?.toString() === userId?.toString()
  );

  if (!alreadyEnrolled) {
    course.students.push({
      studentId: userId,
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
    const {
      userId,
      userName,
      userEmail,
      orderDate,
      courseId,
    } = req.body;

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

module.exports = { createOrder };
