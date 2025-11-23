import { BarChart, Book, LogOut } from "lucide-react";
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
    if (location.pathname.includes("/instructor/create-new-course") || 
        location.pathname.includes("/instructor/edit-course")) {
      setActiveTab("");
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
  ];

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    window.location.href = "/auth";
  }

  function handleMenuClick(item) {
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
    <aside className="w-64 bg-white shadow-md hidden md:block border-r">
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t("instructor.instructorDashboard")}</h2>
        </div>
        <nav className="flex-1">
          {menuItems.map((menuItem) => (
            <Button
              className="w-full justify-start mb-2"
              key={menuItem.value}
              variant={activeTab === menuItem.value ? "secondary" : "ghost"}
              onClick={() => handleMenuClick(menuItem)}
            >
              <menuItem.icon className="mr-2 h-4 w-4" />
              {menuItem.label}
            </Button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t">
          <Button
            className="w-full justify-start"
            variant="ghost"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.logout")}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default InstructorSidebar;

