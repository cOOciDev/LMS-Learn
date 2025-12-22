import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import { useLanguage } from "@/context/language-context";
import { fetchStudentBoughtCoursesService } from "@/services";
import { Watch } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MESSAGES = {
  missingStudentId: "شناسه کاربر یافت نشد. لطفاً مجدداً وارد شوید.",
  fetchError: "خطا در دریافت دوره‌ها. لطفاً دوباره تلاش کنید.",
  noCourses: "هنوز دوره‌ای برای شما ثبت نشده است.",
  loading: "در حال بارگذاری دوره‌ها...",
  detailButton: "جزئیات دوره",
  missingCourseId: "شناسه دوره موجود نیست.",
};

const normalizeCoursesPayload = (responseData) => {
  const root = responseData;
  const dataBlock = root?.data ?? root;

  if (Array.isArray(dataBlock)) return dataBlock;
  if (Array.isArray(dataBlock?.courses)) return dataBlock.courses;
  if (Array.isArray(dataBlock?.myCourses)) return dataBlock.myCourses;
  if (Array.isArray(dataBlock?.data)) return dataBlock.data;

  return [];
};

function StudentCoursesPage() {
  const { auth } = useContext(AuthContext);
  const { studentBoughtCoursesList, setStudentBoughtCoursesList } =
    useContext(StudentContext);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchStudentBoughtCourses() {
    setLoading(true);

    if (!auth?.user?._id) {
      setStudentBoughtCoursesList([]);
      setErrorMessage(MESSAGES.missingStudentId);
      setLoading(false);
      return;
    }

    setErrorMessage("");

    try {
      const response = await fetchStudentBoughtCoursesService();
      const normalized = normalizeCoursesPayload(response);
      setStudentBoughtCoursesList(normalized);
    } catch (error) {
      console.error(
        "Failed to load student courses:",
        error?.response?.status,
        error
      );
      setStudentBoughtCoursesList([]);
      setErrorMessage(MESSAGES.fetchError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudentBoughtCourses();
  }, [auth?.user?._id]);

  return (
    <div className="p-4">
      <h1 className="mb-8 text-3xl font-bold">
        {t("studentCourses.title") || t("common.myCourses") || "دوره‌های من"}
      </h1>
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent dark:border-indigo-400"></div>
          <span className="ml-4 text-lg">{t("studentCourses.loading") || MESSAGES.loading}</span>
        </div>
      ) : errorMessage ? (
        <div className="text-center text-xl text-red-500">{errorMessage}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {studentBoughtCoursesList && studentBoughtCoursesList.length > 0 ? (
            studentBoughtCoursesList.map((course) => {
              const courseId = course?.courseId || course?.id || course?._id;
              return (
                <Card key={courseId || course?.title} className="flex flex-col">
                  <CardContent className="p-4 flex-grow">
                    <img
                      src={course?.courseImage || course?.image}
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
                      onClick={() => courseId && navigate(`/course/details/${courseId}`)}
                      className="flex-1"
                      disabled={!courseId}
                      title={!courseId ? MESSAGES.missingCourseId : ""}
                    >
                      <Watch className="mr-2 h-4 w-4" />
                      {t("studentCourses.detailButton") || MESSAGES.detailButton}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <h1 className="text-3xl font-bold text-slate-500 dark:text-slate-300">
              {t("studentCourses.noCourses") || MESSAGES.noCourses}
            </h1>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentCoursesPage;
