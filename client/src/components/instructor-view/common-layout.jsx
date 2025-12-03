// client/src/layouts/instructor/common-layout/index.jsx (یا هر مسیری که داری)

import { Outlet } from "react-router-dom";
import InstructorHeader from "./header";
import InstructorSidebar from "./sidebar";
import InstructorFooter from "./footer";

function InstructorCommonLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* هدر */}
      <InstructorHeader />

      {/* بدنه اصلی */}
      <div className="flex flex-1">
        {/* سایدبار */}
        <InstructorSidebar />

        {/* محتوای اصلی */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className=" lg:p-2">
            <Outlet />
          </div>
        </main>
      </div>

      {/* فوتر */}
      <InstructorFooter />
    </div>
  );
}

export default InstructorCommonLayout;