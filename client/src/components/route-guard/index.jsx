import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();


  if (!authenticated && !location.pathname.includes("/auth")) {
    return <Navigate to="/auth" />;
  }

  // Admin routes - only admins can access
  if (location.pathname.includes("/admin") && user?.role !== "admin") {
    return <Navigate to="/home" />;
  }

  if (
    authenticated &&
    user?.role !== "instructor" &&
    user?.role !== "admin" &&
    (location.pathname.includes("instructor") ||
      location.pathname.includes("/auth"))
  ) {
    return <Navigate to="/home" />;
  }

  if (
    authenticated &&
    user?.role === "instructor" &&
    !location.pathname.includes("instructor") &&
    !location.pathname.includes("admin")
  ) {
    return <Navigate to="/instructor" />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
