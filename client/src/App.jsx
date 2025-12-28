// Updated App.jsx with AboutPage route added
import { Route, Routes } from "react-router-dom";
import AuthPage from "./pages/auth";
import RouteGuard from "./components/route-guard";
import { useContext } from "react";
import { AuthContext } from "./context/auth-context";
import InstructorDashboardPage from "./pages/instructor";
import InstructorCommonLayout from "./components/instructor-view/common-layout";
import InstructorLiveClassesPage from "./pages/instructor/live-classes";
import LiveClassHostPage from "./pages/instructor/live-class-host";
import StudentViewCommonLayout from "./components/student-view/common-layout";
import StudentHomePage from "./pages/student/home";
import NotFoundPage from "./pages/not-found";
import AddNewCoursePage from "./pages/instructor/add-new-course";
import StudentViewCoursesPage from "./pages/student/courses";
import StudentViewCourseDetailsPage from "./pages/student/course-details";
import PaypalPaymentReturnPage from "./pages/student/payment-return";
import StudentCoursesPage from "./pages/student/student-courses";
import RoadmapPage from "./pages/student/roadmap";
import StudentViewCourseProgressPage from "./pages/student/course-progress";
import LivePlanDetailsPage from "./pages/student/live-plan-details";
import AdminRegisterUserPage from "./pages/admin/register-user";
import AdminCommonLayout from "./components/admin-view/common-layout";
import AdminDashboard from "./pages/admin/dashboard";
import AdminUserManagement from "./pages/admin/users";
import AdminCoursesPage from "./pages/admin/courses";
import AdminFinancialReportsPage from "./pages/admin/financial-reports";
import AdminMessagesPage from "./pages/admin/messages";
import AdminSettingsPage from "./pages/admin/settings";
import AdminInstructorManagement from "./pages/admin/instructors";
import AdminCategoryManagement from "./pages/admin/categories";
import AdminRoadmapsPage from "./pages/admin/roadmaps";
import AdminHelpCenterPage from "./pages/admin/help-center";
import StudentCategoryRoadmapPage from "./pages/student/roadmap-category";
import AboutPage from "./pages/student/about";
import StudentTicketsPage from "./pages/student/tickets";
import DownloadPage from "./pages/download";
import InstructorTicketsPage from "./pages/instructor/tickets";
import NotificationsPage from "./pages/notifications";

function App() {
  const { auth } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <RouteGuard
            element={<AuthPage />}
            authenticated={auth?.authenticate}
            user={auth?.user}
          />
        }
      />

      {/* Instructor */}
      <Route
        path="/instructor"
        element={
          <RouteGuard
            element={<InstructorCommonLayout />}
            authenticated={auth?.authenticate}
            user={auth?.user}
          />
        }
      >
        <Route index element={<InstructorDashboardPage />} />
        <Route path="create-new-course" element={<AddNewCoursePage />} />
        <Route path="edit-course/:courseId" element={<AddNewCoursePage />} />
        <Route path="live-classes" element={<InstructorLiveClassesPage />} />
        <Route path="live-classes/:id/host" element={<LiveClassHostPage />} />
        <Route path="tickets" element={<InstructorTicketsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="download" element={<DownloadPage />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RouteGuard
            element={<AdminCommonLayout />}
            authenticated={auth?.authenticate}
            user={auth?.user}
          />
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="register-user" element={<AdminRegisterUserPage />} />
        <Route path="instructors" element={<AdminInstructorManagement />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="categories" element={<AdminCategoryManagement />} />
        <Route path="roadmaps" element={<AdminRoadmapsPage />} />
        <Route path="financial" element={<AdminFinancialReportsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="help-center" element={<AdminHelpCenterPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Student */}
      <Route
        path="/"
        element={
          <RouteGuard
            element={<StudentViewCommonLayout />}
            authenticated={auth?.authenticate}
            user={auth?.user}
          />
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="home" element={<StudentHomePage />} />
        <Route path="courses" element={<StudentViewCoursesPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="roadmap/category/:slug" element={<StudentCategoryRoadmapPage />} />
        <Route path="course/details" element={<StudentViewCourseDetailsPage />} />
        <Route path="course/details/:id" element={<StudentViewCourseDetailsPage />} />
        <Route path="payment-return" element={<PaypalPaymentReturnPage />} />
        <Route path="student-courses" element={<StudentCoursesPage />} />
        <Route path="course-progress/:id" element={<StudentViewCourseProgressPage />} />
        <Route path="live-plan/:planId" element={<LivePlanDetailsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="tickets" element={<StudentTicketsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
