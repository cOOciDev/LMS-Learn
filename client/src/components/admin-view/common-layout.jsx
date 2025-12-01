import { Outlet } from "react-router-dom";
import AdminHeader from "./header";
import AdminSidebar from "./sidebar";
import AdminFooter from "./footer";

function AdminCommonLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-white/70 p-6 backdrop-blur-sm transition-colors dark:bg-slate-900/70 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}

export default AdminCommonLayout;

