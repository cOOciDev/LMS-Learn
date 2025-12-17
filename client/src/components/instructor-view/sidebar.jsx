import { BarChart, Book, LogOut, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/context/auth-context";
import { InstructorContext } from "@/context/instructor-context";
import { useLanguage } from "@/context/language-context";
import { fetchInstructorCourseListService } from "@/services";

function InstructorSidebar() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { resetCredentials } = useContext(AuthContext);
  const { instructorCoursesList, setInstructorCoursesList } =
    useContext(InstructorContext);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Update active tab based on current route
  useEffect(() => {
    if (
      location.pathname.includes("/instructor/create-new-course") ||
      location.pathname.includes("/instructor/edit-course")
    ) {
      setActiveTab("");
    } else if (location.pathname.startsWith("/instructor/live-classes")) {
      setActiveTab("live-plans");
    } else if (location.pathname === "/instructor") {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

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

  const menuItems = [
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
  ];

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    window.location.href = "/auth";
  }

  function handleMenuClick(item) {
    if (item.routePath) {
      navigate(item.routePath);
      setActiveTab(item.value);
      return;
    }

    if (location.pathname === "/instructor") {
      // If already on instructor page, update URL with tab
      navigate(`/instructor?tab=${item.value}`);
      setActiveTab(item.value);
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
              <menuItem.icon className="mr-1" />
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
