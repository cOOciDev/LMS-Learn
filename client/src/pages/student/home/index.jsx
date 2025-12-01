import banner from "../../../../public/hero.webp";
import { Button } from "@/components/ui/button";
import { useContext, useEffect, useMemo } from "react";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  fetchStudentViewCourseListService,
} from "@/services";
import { AuthContext } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import { useCategories } from "@/context/category-context";
import { buildCategoryOptions } from "@/utils/category";

function StudentHomePage() {
  const { studentViewCoursesList, setStudentViewCoursesList } =
    useContext(StudentContext);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { categories } = useCategories();

  const categoryOptions = useMemo(
    () =>
      buildCategoryOptions({
        categories,
        language,
        t,
      }),
    [categories, language, t]
  );

  function handleNavigateToCoursesPage(getCurrentId) {
    sessionStorage.removeItem("filters");
    const currentFilter = { category: [getCurrentId] };
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate("/courses");
  }

  async function fetchAllStudentViewCourses() {
    const response = await fetchStudentViewCourseListService();
    if (response?.success) {
      setStudentViewCoursesList(response?.data?.courses || []);
    }
  }

  async function handleCourseNavigate(getCurrentCourseId) {
    try {
      const response = await checkCoursePurchaseInfoService(
        getCurrentCourseId,
        auth?.user?._id
      );
      if (response?.success && response?.data?.isEnrolled) {
        navigate(`/course-progress/${getCurrentCourseId}`);
      } else {
        navigate(`/course/details/${getCurrentCourseId}`);
      }
    } catch (error) {
      navigate(`/course/details/${getCurrentCourseId}`);
    }
  }

  useEffect(() => {
    fetchAllStudentViewCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">

      {/* 🔥 HERO / Banner */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between py-16 px-6 lg:px-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-b-[60px] overflow-hidden shadow-xl">
        <div className="lg:w-1/2 z-10 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg animate-fade-in">
            {t("home.heroTitle")}
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-[500px] animate-fade-in delay-100">
            {t("home.heroDescription")}
          </p>

          <Button
            size="lg"
            className="mt-4 font-semibold bg-white text-indigo-600 hover:bg-gray-200 hover:scale-105 transform transition-all shadow-lg"
            onClick={() => navigate("/courses")}
          >
            {t("home.exploreCoursesButton")}
          </Button>
        </div>

        <div className="lg:w-[500px] mt-10 lg:mt-0 z-10 flex justify-center">
          <img
            src={banner}
            alt={t("home.heroImageAlt")}
            className="w-full max-h-[450px] md:max-h-[500px] lg:max-h-[550px] object-cover rounded-3xl shadow-2xl border-4 border-white animate-float"
          />
        </div>

        {/* افکت‌های بک‌گراند */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-400 opacity-20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </section>

      {/* 📌 دسته‌بندی‌ دوره‌ها */}
      <section className="py-16 px-6 lg:px-16 bg-white/90 rounded-t-[60px] shadow-inner transition-colors dark:bg-slate-900/80">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            {t("home.categoriesTitle")}
          </h2>
          <p className="text-gray-600 dark:text-slate-300 text-base max-w-2xl mx-auto">
            {t("home.categoriesDescription")}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {categoryOptions.map((categoryItem) => (
            <Button
              key={categoryItem.id}
              variant="outline"
              className="justify-center h-14 font-semibold text-[15px] rounded-xl border border-slate-200 bg-white text-slate-700 shadow transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-indigo-500"
              onClick={() => handleNavigateToCoursesPage(categoryItem.id)}
            >
              {categoryItem.label}
            </Button>
          ))}
        </div>
      </section>

      {/* 📌 دوره‌های ویژه */}
      <section className="py-16 px-6 lg:px-16 bg-gray-50 transition-colors dark:bg-slate-950">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            {t("home.featuredCoursesTitle")}
          </h2>
          <p className="text-gray-600 dark:text-slate-300 text-base max-w-2xl mx-auto">
            {t("home.featuredCoursesDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
          {studentViewCoursesList?.length > 0 ? (
            studentViewCoursesList.map((courseItem, index) => (
              <div
                key={index}
                onClick={() => handleCourseNavigate(courseItem?._id)}
                className="group border border-gray-200 rounded-2xl overflow-hidden shadow-md cursor-pointer bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center w-full max-w-[280px] dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="relative w-full">
                  <img
                    src={courseItem?.image}
                    alt={courseItem?.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transform transition-all duration-500"
                  />
                  <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {t("home.featuredBadge")}
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-black text-lg group-hover:text-indigo-600 transition-all dark:text-white">
                    {courseItem?.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {courseItem?.instructorName}
                  </p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-[18px]">
                    {courseItem?.pricing} {t("home.currency")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <h1 className="text-xl text-gray-600 dark:text-slate-400 text-center">
              {t("home.noCoursesMessage")}
            </h1>
          )}
        </div>
      </section>

    </div>
  );
}

export default StudentHomePage;
