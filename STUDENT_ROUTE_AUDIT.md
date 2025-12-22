# Student Route Audit

| Client Endpoint | Server Route | Status | Notes |
| --- | --- | --- | --- |
| `GET /student/courses/get` | `/student/courses/get` (courseRoutes) | ? | Matches controller `getAllPublishedCourses`.
| `GET /student/courses/get/details/:id` | `/student/courses/get/details/:id` | ? | Controller returns `{ success, data: { course, enrollment } }`.
| `GET /student/courses/purchase-info/:courseId` | `/student/courses/purchase-info/:courseId` | ? | Auth-protected route; controller returns enrollment/purchase details.
| `GET /student/my-courses/get` | `/student/my-courses/get` | ? | Returns `data` array of purchased courses.
| `POST /student/orders/create` | `/student/orders/create` | ? | Creates free or paid order, populates `StudentCourses`.
| `POST /student/orders/capture` | `/student/orders/capture` | ?? | Added to match client capture flow; controller now confirms payment status.
| `GET /student/course-progress/get/:courseId` | `/student/course-progress/get/:courseId` | ? | Returns course progress document.
| `POST /student/course-progress/mark-lecture-viewed` | `/student/course-progress/mark-lecture-viewed` | ? | Updates progress.
| `POST /student/course-progress/reset-progress` | `/student/course-progress/reset-progress` | ? | Resets progress.

*Notes*: Redirected calls such as `/student/course` and `/student/order` are now aliases to the canonical plural routers so legacy clients continue to work without requiring changes.
