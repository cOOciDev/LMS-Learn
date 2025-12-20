import { useState } from "react";
import { Outlet } from "react-router-dom";
import InstructorHeader from "./header";
import InstructorSidebar from "./sidebar";
import InstructorMobileSidebar from "./mobile-sidebar";
import InstructorFooter from "./footer";

function InstructorCommonLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <InstructorHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />
      <InstructorMobileSidebar
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-1">
        <InstructorSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="lg:p-2">
            <Outlet />
          </div>
        </main>
      </div>

      <InstructorFooter />
    </div>
  );
}

export default InstructorCommonLayout;
