import { Outlet, useLocation } from "react-router-dom";
import StudentViewCommonHeader from "./header";
import StudentViewCommonFooter from "./footer";

function StudentViewCommonLayout() {
  const location = useLocation();
  return (
    <div>
      {!location.pathname.includes("course-progress") ? (
        <StudentViewCommonHeader />
      ) : null}

      <Outlet />
      <StudentViewCommonFooter/>
    </div>
  );
}

export default StudentViewCommonLayout;
