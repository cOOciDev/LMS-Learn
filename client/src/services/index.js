import axiosInstance from "@/api/axiosInstance";

export async function registerService(formData) {
  const { data } = await axiosInstance.post("/auth/register", formData);

  return data;
}

export async function loginService(formData) {
  try {
    const { data } = await axiosInstance.post("/auth/login", formData);
    return data;
  } catch (error) {
    // Return error in a consistent format
    throw error; // Let the auth context handle it
  }
}

export async function checkAuthService() {
  const { data } = await axiosInstance.get("/auth/check-auth");

  return data;
}

export async function mediaUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}

export async function mediaDeleteService(id) {
  const { data } = await axiosInstance.delete(`/media/delete/${id}`);

  return data;
}

export async function fetchInstructorCourseListService() {
  const { data } = await axiosInstance.get(`/instructor/course/get`);

  return data;
}

export async function addNewCourseService(formData) {
  const { data } = await axiosInstance.post(`/instructor/course/add`, formData);

  return data;
}

export async function fetchInstructorCourseDetailsService(id) {
  const { data } = await axiosInstance.get(
    `/instructor/course/get/details/${id}`
  );

  return data;
}

export async function updateCourseByIdService(id, formData) {
  const { data } = await axiosInstance.put(
    `/instructor/course/update/${id}`,
    formData
  );

  return data;
}

export async function mediaBulkUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/bulk-upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}

export async function fetchStudentViewCourseListService(query) {
  let queryString = "";

  if (query) {
    if (typeof query === "string") {
      queryString = query;
    } else if (typeof query.toString === "function") {
      queryString = query.toString();
    }
  }

  const endpoint = queryString
    ? `/student/course/get?${queryString}`
    : `/student/course/get`;

  const { data } = await axiosInstance.get(endpoint);

  return data;
}

export async function fetchStudentViewCourseDetailsService(courseId) {
  const { data } = await axiosInstance.get(
    `/student/course/get/details/${courseId}`
  );

  return data;
}

export async function checkCoursePurchaseInfoService(courseId, studentId) {
  const { data } = await axiosInstance.get(
    `/student/course/purchase-info/${courseId}/${studentId}`
  );

  return data;
}

export async function createPaymentService(formData) {
  const { data } = await axiosInstance.post(`/student/order/create`, formData);

  return data;
}

export async function captureAndFinalizePaymentService(
  paymentId,
  payerId,
  orderId
) {
  const { data } = await axiosInstance.post(`/student/order/capture`, {
    paymentId,
    payerId,
    orderId,
  });

  return data;
}

export async function fetchStudentBoughtCoursesService(studentId) {
  const { data } = await axiosInstance.get(
    `/student/courses-bought/get/${studentId}`
  );

  return data;
}

export async function getCurrentCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.get(
    `/student/course-progress/get/${userId}/${courseId}`
  );

  return data;
}

export async function markLectureAsViewedService(userId, courseId, lectureId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/mark-lecture-viewed`,
    {
      userId,
      courseId,
      lectureId,
    }
  );

  return data;
}

export async function resetCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/reset-progress`,
    {
      userId,
      courseId,
    }
  );

  return data;
}

// Admin Services
export async function getAdminDashboardStatsService() {
  const { data } = await axiosInstance.get("/admin/dashboard/stats");
  return data;
}

export async function getAllUsersService(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const { data } = await axiosInstance.get(`/admin/users?${queryParams}`);
  return data;
}

export async function getUserByIdService(userId) {
  const { data } = await axiosInstance.get(`/admin/users/${userId}`);
  return data;
}

export async function updateUserService(userId, userData) {
  const { data } = await axiosInstance.put(`/admin/users/${userId}`, userData);
  return data;
}

export async function deleteUserService(userId) {
  const { data } = await axiosInstance.delete(`/admin/users/${userId}`);
  return data;
}

export async function getUserGrowthStatsService() {
  const { data } = await axiosInstance.get("/admin/users/growth/stats");
  return data;
}

export async function getAllCoursesAdminService(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const { data } = await axiosInstance.get(`/admin/courses?${queryParams}`);
  return data;
}

export async function getFinancialReportsService() {
  const { data } = await axiosInstance.get("/admin/financial/reports");
  return data;
}

export async function submitCourseRatingService(payload) {
  const { data } = await axiosInstance.post("/student/course/rate", payload);
  return data;
}

// Instructor management services
export async function getAllInstructorsService(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const { data } = await axiosInstance.get(
    `/admin/instructors?${queryParams}`
  );
  return data;
}

export async function getInstructorDetailsService(instructorId) {
  const { data } = await axiosInstance.get(`/admin/instructors/${instructorId}`);
  return data;
}

export async function updateInstructorService(instructorId, payload) {
  const { data } = await axiosInstance.put(
    `/admin/instructors/${instructorId}`,
    payload
  );
  return data;
}
