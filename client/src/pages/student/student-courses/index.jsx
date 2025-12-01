import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import { useLanguage } from "@/context/language-context";
import { fetchStudentBoughtCoursesService } from "@/services";
import { Watch } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentCoursesPage() {
  const { auth } = useContext(AuthContext);
  const { studentBoughtCoursesList, setStudentBoughtCoursesList } =
    useContext(StudentContext);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Loading state
  const [loading, setLoading] = useState(true);

  async function fetchStudentBoughtCourses() {
    setLoading(true); // Set loading to true when the fetch starts
    const response = await fetchStudentBoughtCoursesService(auth?.user?._id);
    if (response?.success) {
      setStudentBoughtCoursesList(response?.data);
    }
    setLoading(false); // Set loading to false when the fetch completes
  }

  useEffect(() => {
    fetchStudentBoughtCourses();
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-8 text-3xl font-bold">
        {t("studentCourses.title") || t("common.myCourses") || "My Courses"}
      </h1>
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent dark:border-indigo-400"></div>
          <span className="ml-4 text-lg">
            {t("studentCourses.loading") || t("common.loading") || "Loading..."}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {studentBoughtCoursesList && studentBoughtCoursesList.length > 0 ? (
            studentBoughtCoursesList.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <CardContent className="p-4 flex-grow">
                  <img
                    src={course?.courseImage}
                    alt={course?.title}
                    className="h-52 w-full object-cover rounded-md mb-4"
                  />
                  <h3 className="font-bold mb-1">{course?.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {course?.instructorName}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() =>
                      navigate(`/course-progress/${course?.courseId}`)
                    }
                    className="flex-1"
                  >
                    <Watch className="mr-2 h-4 w-4" />
                    {t("studentCourses.startWatching") || "Start Watching"}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <h1 className="text-3xl font-bold text-slate-500 dark:text-slate-300">
              {t("studentCourses.noCourses") || t("home.noCoursesMessage") || "No courses found"}
            </h1>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentCoursesPage;
