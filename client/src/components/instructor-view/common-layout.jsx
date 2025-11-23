import { Outlet } from "react-router-dom";
import InstructorHeader from "./header";
import InstructorSidebar from "./sidebar";
import InstructorFooter from "./footer";

function InstructorCommonLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <InstructorHeader />
      <div className="flex flex-1">
        <InstructorSidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <InstructorFooter />
    </div>
  );
}

export default InstructorCommonLayout;

