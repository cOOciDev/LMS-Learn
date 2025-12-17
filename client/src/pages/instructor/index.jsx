import InstructorCourses from "@/components/instructor-view/courses";
import InstructorDashboard from "@/components/instructor-view/dashboard";
import LiveClassesManager from "@/components/instructor-view/live-classes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorContext } from "@/context/instructor-context";
import { useLanguage } from "@/context/language-context";
import { fetchInstructorCourseListService } from "@/services";
import { BarChart, Book, Video } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

function InstructorDashboardpage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const { instructorCoursesList, setInstructorCoursesList } =
    useContext(InstructorContext);
  const { t } = useLanguage();

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab") || "dashboard";
    setActiveTab(tab);
  }, [searchParams, location]);

  async function fetchAllCourses() {
    try {
      const response = await fetchInstructorCourseListService();
      if (response?.success) {
        // Handle both array and object responses
        const data = response?.data;
        if (Array.isArray(data)) {
          setInstructorCoursesList(data);
        } else if (data?.courses) {
          // If API returns { courses: [], pagination: {} }
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
      component: <InstructorDashboard listOfCourses={instructorCoursesList} />,
    },
    {
      icon: Book,
      label: t("common.courses"),
      value: "courses",
      component: <InstructorCourses listOfCourses={instructorCoursesList} />,
    },
    {
      icon: Video,
      label: t("instructor.liveClasses"),
      value: "live-classes",
      component: <LiveClassesManager compact />,
    },
  ];

  function handleTabChange(value) {
    setActiveTab(value);
    setSearchParams({ tab: value });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t("instructor.instructorDashboard")}</h1>
      <Tabs className="m-2"  value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 min-w-[5px] px-1 py-1 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap">
          {menuItems.map((menuItem) => (
            <TabsTrigger key={menuItem.value} value={menuItem.value}>
              <menuItem.icon/>
              {menuItem.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {menuItems.map((menuItem) => (
          <TabsContent key={menuItem.value} value={menuItem.value}>
            {menuItem.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default InstructorDashboardpage;
