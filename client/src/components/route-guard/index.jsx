import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();

  // If not authenticated and trying to access protected route, redirect to auth
  if (!authenticated && !location.pathname.includes("/auth")) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated and on auth page, redirect based on role
  if (authenticated && location.pathname.includes("/auth")) {
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user?.role === "instructor") {
      return <Navigate to="/instructor" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  // Admin routes - only admins can access
  if (location.pathname.includes("/admin") && user?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  // Instructor routes - only instructors can access
  if (
    location.pathname.includes("/instructor") &&
    user?.role !== "instructor"
  ) {
    return <Navigate to="/home" replace />;
  }

  // Redirect admins to their dashboard when accessing student routes
  if (
    user?.role === "admin" &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/auth")
  ) {
    return <Navigate to="/admin" replace />;
  }

  // Students can access student routes (home, courses, etc.)
  // Instructors and admins can also access student routes (they can view courses)
  // So we don't block them from student routes

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
