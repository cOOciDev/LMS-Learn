import { Users, UserPlus, BarChart, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/language-context";

function AdminSidebar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: BarChart,
      label: t("admin.dashboard") || "Dashboard",
      path: "/admin",
    },
    {
      icon: Users,
      label: t("admin.userManagement") || "User Management",
      path: "/admin/users",
    },
    {
      icon: UserPlus,
      label: t("admin.registerUser") || "Register User",
      path: "/admin/register-user",
    },
    {
      icon: Book,
      label: t("common.courses") || "Courses",
      path: "/admin/courses",
    },
  ];

  function handleMenuClick(path) {
    navigate(path);
  }

  return (
    <aside className="w-64 bg-white shadow-md hidden md:block border-r">
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t("admin.adminPanel") || "Admin Panel"}</h2>
        </div>
        <nav className="flex-1">
          {menuItems.map((menuItem) => (
            <Button
              className="w-full justify-start mb-2"
              key={menuItem.path}
              variant={location.pathname === menuItem.path ? "secondary" : "ghost"}
              onClick={() => handleMenuClick(menuItem.path)}
            >
              <menuItem.icon className="mr-2 h-4 w-4" />
              {menuItem.label}
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default AdminSidebar;

