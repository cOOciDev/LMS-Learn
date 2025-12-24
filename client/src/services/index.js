// client/src/services/index.js
import axiosInstance from "@/api/axiosInstance";

const withCacheBuster = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
};

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

export async function logoutService() {
  const { data } = await axiosInstance.post("/auth/logout");
  return data;
}

export async function mediaUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / Math.max(progressEvent.total, 1)
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

export async function mediaLocalUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/local-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: (progressEvent) => {
      if (typeof onProgressCallback === "function") {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / Math.max(progressEvent.total, 1)
        );
        onProgressCallback(percentCompleted);
      }
    },
  });

  return data;
}

export async function mediaLocalBulkUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/local-bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: (progressEvent) => {
      if (typeof onProgressCallback === "function") {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / Math.max(progressEvent.total, 1)
        );
        onProgressCallback(percentCompleted);
      }
    },
  });

  return data;
}

export async function mediaLocalDeleteService(fileKey) {
  const { data } = await axiosInstance.delete(
    `/media/local-delete?path=${encodeURIComponent(fileKey)}`
  );
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

export async function createLiveClassPlanService(payload) {
  const { data } = await axiosInstance.post(
    "/instructor/live-class-plans",
    payload
  );

  return data;
}

export async function fetchInstructorLiveClassPlansService() {
  const { data } = await axiosInstance.get("/instructor/live-class-plans");
  return data;
}

export async function publishLiveClassPlanService(planId) {
  const { data } = await axiosInstance.patch(
    `/instructor/live-class-plans/${planId}/publish`
  );
  return data;
}

export async function archiveLiveClassPlanService(planId) {
  const { data } = await axiosInstance.delete(
    `/instructor/live-class-plans/${planId}`
  );
  return data;
}

export async function startInstructorLiveClassService(planId) {
  const { data } = await axiosInstance.post(
    `/instructor/live-classes/${planId}/start`
  );

  return data;
}

export async function fetchInstructorLiveClassByIdService(planId) {
  const { data } = await axiosInstance.get(
    `/instructor/live-classes/${planId}`
  );

  return data;
}

export async function fetchStudentLiveClassPlansService(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query
    ? `/student/live-class-plans?${query}`
    : "/student/live-class-plans";
  const { data } = await axiosInstance.get(endpoint);
  return data;
}

export async function fetchStudentLiveClassPlanByIdService(planId) {
  const { data } = await axiosInstance.get(`/student/live-class-plans/${planId}`);
  return data;
}

export async function mediaBulkUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: (progressEvent) => {
      if (typeof onProgressCallback === "function") {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / Math.max(progressEvent.total, 1)
        );
        onProgressCallback(percentCompleted);
      }
    },
  });

  return data;
}

// client/src/services/index.js — فقط این تابع رو عوض کن
export async function fetchStudentViewCourseListService(queryParams = {}) {
  const queryString = new URLSearchParams(queryParams).toString();
  const endpoint = queryString
    ? `/student/courses/get?${queryString}`
    : "/student/courses/get";

  const { data } = await axiosInstance.get(endpoint);
  return data;
}


export async function fetchStudentViewCourseDetailsService(courseId) {
  const { data } = await axiosInstance.get(
    `/student/courses/get/details/${courseId}`
  );

  return data;
}

export async function checkCoursePurchaseInfoService(courseId) {
  const { data } = await axiosInstance.get(
    withCacheBuster(`/student/courses/purchase-info/${courseId}`)
  );

  return data;
}

export async function createPaymentService(formData) {
  const { data } = await axiosInstance.post(`/student/orders/create`, formData);

  return data;
}

export async function captureAndFinalizePaymentService(
  paymentId,
  payerId,
  orderId
) {
  const { data } = await axiosInstance.post(`/student/orders/capture`, {
    paymentId,
    payerId,
    orderId,
  });

  return data;
}

export async function fetchStudentBoughtCoursesService() {
  const { data } = await axiosInstance.get(
    withCacheBuster(`/student/my-courses/get`)
  );

  return data;
}

export async function getCurrentCourseProgressService(courseId) {
  const { data } = await axiosInstance.get(
    withCacheBuster(`/student/course-progress/get/${courseId}`)
  );

  return data;
}

export async function markLectureAsViewedService(courseId, lectureId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/mark-lecture-viewed`,
    {
      courseId,
      lectureId,
    }
  );

  return data;
}

export async function resetCourseProgressService(courseId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/reset-progress`,
    {
      courseId,
    }
  );

  return data;
}

export async function getCourseExercisesService(courseId) {
  const { data } = await axiosInstance.get(
    withCacheBuster(`/student/course-progress/exercises/${courseId}`)
  );
  return data;
}

export async function submitCourseExerciseService(payload) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/exercises/submit`,
    payload
  );
  return data;
}

export async function getCourseCertificateStatusService(courseId) {
  const { data } = await axiosInstance.get(
    withCacheBuster(`/student/course-progress/certificate/${courseId}`)
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

// Admin message services
export async function getAdminMessagesService(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `/admin/messages?${queryParams}` : "/admin/messages";
  const { data } = await axiosInstance.get(url);
  return data;
}

export async function createAdminMessageService(payload) {
  const { data } = await axiosInstance.post("/admin/messages", payload);
  return data;
}

// Notification services
export async function getNotificationsService(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `/notifications?${queryParams}` : "/notifications";
  const { data } = await axiosInstance.get(url);
  return data;
}

export async function markNotificationReadService(notificationId) {
  const { data } = await axiosInstance.patch(
    `/notifications/${notificationId}/read`
  );
  return data;
}

export async function markAllNotificationsReadService() {
  const { data } = await axiosInstance.patch("/notifications/read-all");
  return data;
}

export async function getUnreadNotificationCountService() {
  const { data } = await axiosInstance.get("/notifications/unread-count");
  return data;
}

// Category services
export async function getPublicCategoriesService() {
  const { data } = await axiosInstance.get("/categories");
  return data;
}

export async function getAdminCategoriesService() {
  const { data } = await axiosInstance.get("/admin/categories");
  return data;
}

export async function createCategoryService(payload) {
  const { data } = await axiosInstance.post("/admin/categories", payload);
  return data;
}

// Ticket services - Student
export async function createTicketService(formData) {
  const { data } = await axiosInstance.post("/student/tickets/create", formData);
  return data;
}

export async function getUserTicketsService(status) {
  const url = status ? `/student/tickets?status=${status}` : "/student/tickets";
  const { data } = await axiosInstance.get(url);
  return data;
}

export async function getTicketByIdService(ticketId) {
  const { data } = await axiosInstance.get(`/student/tickets/${ticketId}`);
  return data;
}

export async function addMessageToTicketService(ticketId, message) {
  const { data } = await axiosInstance.post(`/student/tickets/${ticketId}/message`, {
    message,
  });
  return data;
}

export async function closeTicketService(ticketId) {
  const { data } = await axiosInstance.patch(`/student/tickets/${ticketId}/close`);
  return data;
}

// Ticket services - Admin
export async function getAllTicketsService(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `/admin/tickets?${queryParams}` : "/admin/tickets";
  const { data } = await axiosInstance.get(url);
  return data;
}

export async function getTicketStatsService() {
  const { data } = await axiosInstance.get("/admin/tickets/stats");
  return data;
}

export async function getAdminTicketByIdService(ticketId) {
  const { data } = await axiosInstance.get(`/admin/tickets/${ticketId}`);
  return data;
}

export async function addAdminReplyService(ticketId, message) {
  const { data } = await axiosInstance.post(`/admin/tickets/${ticketId}/reply`, {
    message,
  });
  return data;
}

export async function updateTicketStatusService(ticketId, status, priority) {
  const { data } = await axiosInstance.patch(`/admin/tickets/${ticketId}/status`, {
    status,
    priority,
  });
  return data;
}

export async function assignTicketService(ticketId, adminId) {
  const { data } = await axiosInstance.patch(`/admin/tickets/${ticketId}/assign`, {
    adminId,
  });
  return data;
}

export async function deleteCategoryService(categoryId) {
  const { data } = await axiosInstance.delete(
    `/admin/categories/${categoryId}`
  );
  return data;
}

// Roadmap services
export async function getAdminRoadmapsService() {
  const { data } = await axiosInstance.get("/admin/roadmaps");
  return data;
}

export async function createRoadmapService(payload) {
  const { data } = await axiosInstance.post("/admin/roadmaps", payload);
  return data;
}

export async function getRoadmapByCategoryService(categorySlug) {
  const { data } = await axiosInstance.get(`/roadmaps/${categorySlug}`);
  return data;
}
