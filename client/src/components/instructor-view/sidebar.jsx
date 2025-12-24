import { BarChart, Bell, Book, LogOut, MessageSquare, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/context/auth-context";
import { InstructorContext } from "@/context/instructor-context";
import { useLanguage } from "@/context/language-context";
import { fetchInstructorCourseListService } from "@/services";
import { useUnreadNotifications } from "@/hooks/use-notifications";

export const INSTRUCTOR_MENU_ITEMS = (t) => [
  {
    icon: BarChart,
    label: t("instructor.instructorDashboard"),
    value: "dashboard",
  },
  {
    icon: Book,
    label: t("common.courses"),
    value: "courses",
  },
  {
    icon: Video,
    label: t("instructor.liveClasses"),
    value: "live-plans",
    routePath: "/instructor/live-classes",
  },
  {
    icon: MessageSquare,
    label: t("common.tickets") || t("common.support"),
    value: "tickets",
    routePath: "/instructor/tickets",
  },
  {
    icon: Bell,
    label: t("notifications.title") || "Notifications",
    value: "notifications",
    routePath: "/instructor/notifications",
  },
];

export function getInstructorActiveTab(pathname, search = "") {
  const params = new URLSearchParams(search);
  const tabFromQuery = params.get("tab");

  if (tabFromQuery) return tabFromQuery;
  if (pathname.includes("/instructor/create-new-course")) return "";
  if (pathname.includes("/instructor/edit-course")) return "";
  if (pathname.startsWith("/instructor/live-classes")) return "live-plans";
  if (pathname.startsWith("/instructor/tickets")) return "tickets";
  if (pathname.startsWith("/instructor/notifications")) return "notifications";
  if (pathname === "/instructor") return "dashboard";
  return "";
}

function InstructorSidebar() {
  const { resetCredentials } = useContext(AuthContext);
  const { instructorCoursesList, setInstructorCoursesList } =
    useContext(InstructorContext);
  const { t } = useLanguage();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = getInstructorActiveTab(
    location.pathname,
    location.search
  );
  const menuItems = INSTRUCTOR_MENU_ITEMS(t).map((item) =>
    item.value === "notifications"
      ? { ...item, badge: unreadCount }
      : item
  );

  async function fetchAllCourses() {
    try {
      const response = await fetchInstructorCourseListService();
      if (response?.success) {
        const data = response?.data;
        if (Array.isArray(data)) {
          setInstructorCoursesList(data);
        } else if (data?.courses) {
          setInstructorCoursesList(data.courses);
        } else {
          setInstructorCoursesList([]);
        }
      } else {
        setInstructorCoursesList([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setInstructorCoursesList([]);
    }
  }

  useEffect(() => {
    fetchAllCourses();
  }, []);

  async function handleLogout() {
    await resetCredentials();
    sessionStorage.clear();
    window.location.href = "/auth";
  }

  function handleMenuClick(item) {
    if (item.routePath) {
      navigate(item.routePath);
      return;
    }

    if (location.pathname === "/instructor") {
      // If already on instructor page, update URL with tab
      navigate(`/instructor?tab=${item.value}`);
    } else {
      // Navigate to instructor page with tab
      navigate(`/instructor?tab=${item.value}`);
    }
  }

  return (
    <aside className="w-64 bg-background border-r-4 border-l-4 border-border/30 dark:border-border/70 shadow-2xl hidden md:flex flex-col">
      <div className="p-6 h-full flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            {t("instructor.instructorDashboard")}
          </h2>
        </div>

        <nav className="flex-1 space-y-2">
            {menuItems.map((menuItem) => (
              <Button
                key={menuItem.value}
                variant={activeTab === menuItem.value ? "default" : "ghost"}
                className="w-full justify-start h-12 px-4 text-base font-medium rounded-xl"
                onClick={() => handleMenuClick(menuItem)}
              >
              <div className="relative mr-2">
                <menuItem.icon className="h-5 w-5" />
                {menuItem.badge > 0 && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                    {menuItem.badge}
                  </span>
                )}
              </div>
              <span>{menuItem.label}</span>
              </Button>
            ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>{t("common.logout")}</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default InstructorSidebar;
