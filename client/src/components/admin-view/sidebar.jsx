import {
  Users,
  UserPlus,
  BarChart3,
  LayoutGrid,
  BookOpenCheck,
  GraduationCap,
  DollarSign,
  MessageCircle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

const NAV_SECTIONS = (t) => [
  {
    title: t("admin.overview") || "Overview",
    items: [
      {
        icon: LayoutGrid,
        label: t("admin.dashboard") || "Dashboard",
        path: "/admin",
      },
      {
        icon: BarChart3,
        label: t("admin.financialReports") || "Financial Reports",
        path: "/admin/financial",
      },
    ],
  },
  {
    title: t("admin.people") || "People",
    items: [
      {
        icon: UserPlus,
        label: t("admin.registerUser") || "Register User",
        path: "/admin/register-user",
      },
      {
        icon: Users,
        label: t("admin.userManagement") || "User Management",
        path: "/admin/users",
      },
      {
        icon: GraduationCap,
        label: t("admin.instructorManagement") || "Instructors",
        path: "/admin/instructors",
      },
    ],
  },
  {
    title: t("admin.learning") || "Learning",
    items: [
      {
        icon: BookOpenCheck,
        label: t("common.courses") || "Courses",
        path: "/admin/courses",
      },
      {
        icon: MessageCircle,
        label: t("admin.messages") || "Messages",
        path: "/admin/messages",
      },
    ],
  },
  {
    title: t("admin.system") || "System",
    items: [
      {
        icon: DollarSign,
        label: t("admin.revenueTools") || "Revenue Tools",
        path: "/admin/financial",
      },
      {
        icon: Settings2,
        label: t("admin.settings") || "Settings",
        path: "/admin/settings",
      },
    ],
  },
];

function AdminSidebar() {
  const { t } = useLanguage();
  const { resetCredentials } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const sections = NAV_SECTIONS(t);

  function handleMenuClick(path) {
    navigate(path);
  }

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    navigate("/auth");
  }

  return (
    <aside className="w-64 bg-white shadow-md border-r">
      <div className="p-4 h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            {t("admin.adminPanel") || "Admin Panel"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.panelSubtitle") || "Manage everything in one place"}
          </p>
        </div>
        <nav className="flex-1 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((menuItem) => {
                  const isActive = location.pathname === menuItem.path;
                  return (
                    <Button
                      className="w-full justify-start"
                      key={menuItem.path}
                      variant={isActive ? "secondary" : "ghost"}
                      onClick={() => handleMenuClick(menuItem.path)}
                    >
                      <menuItem.icon className="mr-2 h-4 w-4" />
                      {menuItem.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 border-t pt-4">
          <Button className="w-full justify-start" variant="destructive" onClick={handleLogout}>
            {t("common.signOut") || "Sign Out"}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
