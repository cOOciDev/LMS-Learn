// client/src/pages/student/courses/index.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  fetchStudentViewCourseListService,
  fetchStudentLiveClassPlansService,
} from "@/services";
import { ArrowUpDown, Search, Clock, Users, PlayCircle, Radio } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "@/context/category-context";
import { buildCategoryOptions } from "@/utils/category";
import { useLanguage } from "@/context/language-context";

const ITEMS_PER_PAGE = 8;

function StudentViewCoursesPage() {
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    studentViewCoursesList,
    setStudentViewCoursesList,
    loadingState,
    setLoadingState,
    studentLiveClassPlans,
    setStudentLiveClassPlans,
  } = useContext(StudentContext);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [purchasedCourses, setPurchasedCourses] = useState({});

  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { categories } = useCategories();
  const { t, language } = useLanguage();
  const isRTL = language === "fa";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  const categoryOptions = useMemo(
    () => buildCategoryOptions({ categories, language, t }),
    [categories, language, t]
  );

  const filterOptions = {
    category: categoryOptions,
    level: [
      { id: "beginner", label: t("filters.level.beginner") },
      { id: "intermediate", label: t("filters.level.intermediate") },
      { id: "advanced", label: t("filters.level.advanced") },
    ],
    primaryLanguage: [
      { id: "persian", label: t("filters.language.persian") },
      { id: "english", label: t("filters.language.english") },
    ],
  };

  const sortOptions = [
    { id: "newest", label: t("sort.newest") },
    { id: "price-lowtohigh", label: t("sort.priceLowToHigh") },
    { id: "price-hightolow", label: t("sort.priceHighToLow") },
    { id: "title-atoz", label: t("sort.titleAtoZ") },
  ];

  const sortQueryMap = {
    newest: { sortBy: "createdAt", sortOrder: "desc" },
    "price-lowtohigh": { sortBy: "pricing", sortOrder: "asc" },
    "price-hightolow": { sortBy: "pricing", sortOrder: "desc" },
    "title-atoz": { sortBy: "title", sortOrder: "asc" },
  };

  const handleFilterChange = (sectionId, optionId) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (!newFilters[sectionId]) newFilters[sectionId] = [];
      const index = newFilters[sectionId].indexOf(optionId);
      if (index === -1) newFilters[sectionId].push(optionId);
      else newFilters[sectionId].splice(index, 1);
      if (newFilters[sectionId].length === 0) delete newFilters[sectionId];
      return newFilters;
    });
  };

  const fetchCourses = async () => {
    setLoadingState(true);
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        query.set(key, values.join(","));
      }
    });

    const sortInfo = sortQueryMap[sort] || sortQueryMap.newest;
    query.set("sortBy", sortInfo.sortBy);
    query.set("sortOrder", sortInfo.sortOrder);
    if (debouncedSearch) query.set("search", debouncedSearch);

    try {
      const response = await fetchStudentViewCourseListService(query);
      if (response?.success) {
        const courses = response.data?.courses || [];
        setStudentViewCoursesList(courses);
        setResultsTotal(courses.length);

        if (auth?.user?._id) {
          const map = {};
          for (const c of courses) {
            try {
              const res = await checkCoursePurchaseInfoService(
                c._id,
                auth.user._id
              );
              if (res?.success) {
                map[c._id] = {
                  isEnrolled: res.data?.isEnrolled || false,
                  progress: Math.round(res.data?.progress || 0),
                };
              }
            } catch {}
          }
          setPurchasedCourses(map);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
    setCurrentPage(1);
  }, [filters, sort, debouncedSearch]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return studentViewCoursesList.slice(start, start + ITEMS_PER_PAGE);
  }, [studentViewCoursesList, currentPage]);

  const totalPages = Math.ceil(resultsTotal / ITEMS_PER_PAGE);

  const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const fetchLivePlans = async () => {
    if (studentLiveClassPlans.length) return;
    try {
      const response = await fetchStudentLiveClassPlansService({ limit: 6 });
      if (response?.success) {
        setStudentLiveClassPlans(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load live plans:", error);
    }
  };

  useEffect(() => {
    fetchLivePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDuration = (curriculum) => {
    if (!curriculum || curriculum.length === 0) {
      return language === "fa" ? "۰ دقیقه" : "0 min";
    }
    const mins = curriculum.reduce((a, l) => a + (l.duration || 0), 0);
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    if (language === "fa") {
      return h > 0 ? `${h}س ${m}د` : `${m} دقیقه`;
    }
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const goToCourse = async (id) => {
    if (!auth?.user?._id) return navigate(`/course/details/${id}`);
    try {
      const res = await checkCoursePurchaseInfoService(id, auth.user._id);
      if (res?.success && res.data?.isEnrolled) {
        navigate(`/course-progress/${id}`);
      } else {
        navigate(`/course/details/${id}`);
      }
    } catch {
      navigate(`/course/details/${id}`);
    }
  };

  const goToLivePlan = (plan) => {
    if (plan.courseId) {
      navigate(`/course/details/${plan.courseId}`);
    } else {
      navigate(`/live-plan/${plan._id}`);
    }
  };

  const livePlansHighlight = studentLiveClassPlans.slice(0, 3);

  const formatPlanDates = (plan) => {
    try {
      const start = new Date(plan.startDate).toLocaleDateString();
      const end = new Date(plan.endDate).toLocaleDateString();
      return `${start} → ${end}`;
    } catch {
      return `${plan.startDate} → ${plan.endDate}`;
    }
  };

  const formatPlanWeekdays = (plan) => {
    if (!plan.weekdays?.length) return "Flexible schedule";
    return plan.weekdays.map((day) => weekdayShort[day] || day).join(", ");
  };

  return (
    <div className="container mx-auto p-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 text-center lg:text-start">
        {t("coursesPage.title")}
      </h1>

      {livePlansHighlight.length > 0 && (
        <div className="mb-10 rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-indigo-50 p-6 dark:border-purple-500/40 dark:from-purple-900/40 dark:via-slate-900 dark:to-indigo-900/40">
          <div className="flex flex-col gap-3 mb-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-1 text-sm font-medium text-purple-700 dark:text-purple-200">
              <Radio className="h-4 w-4" />
              {t("courses.liveBadge") || "Live Cohorts"}
            </div>
            <h2 className="text-2xl font-semibold">
              Premium Live Programs — limited seats
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              Experience real-time instruction, daily schedules, and attendance-based
              accountability.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {livePlansHighlight.map((plan) => (
              <div
                key={plan._id}
                className="rounded-2xl border border-purple-200 bg-white/80 p-4 shadow-lg dark:border-purple-500/30 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300">
                  <span>LIVE</span>
                  <span>{formatPlanDates(plan)}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {plan.courseId ? "Linked course" : "Standalone session"}
                </p>
                <dl className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <dt>Time</dt>
                    <dd>
                      {plan.dailyStartTime} – {plan.dailyEndTime}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Timezone</dt>
                    <dd>{plan.timezone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Days</dt>
                    <dd>{formatPlanWeekdays(plan)}</dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  className="mt-4 w-full bg-purple-600 text-white hover:bg-purple-700"
                  onClick={() => goToLivePlan(plan)}
                >
                  {plan.courseId ? "View course" : "Explore live plan"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* فیلترها */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t("filters.title")}</h2>
              <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                {t("filters.clearAll")}
              </Button>
            </div>

            {Object.entries(filterOptions).map(([key, opts]) => (
              <div key={key}>
                <h3 className="font-semibold mb-4">
                  {key === "category"
                    ? t("filters.category")
                    : key === "level"
                    ? t("filters.level.title")
                    : t("filters.language.title")}
                </h3>
                <div className="space-y-3">
                  {opts.map((o) => (
                    <Label
                      key={o.id}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Checkbox
                        checked={filters[key]?.includes(o.id) || false}
                        onCheckedChange={() => handleFilterChange(key, o.id)}
                      />
                      <span className="text-sm">{o.label}</span>
                    </Label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* لیست دوره‌ها */}
        <main className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search
                className={`absolute ${
                  isRTL ? "right-3" : "left-3"
                } top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400`}
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("coursesPage.searchPlaceholder")}
                className={`h-12 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <ArrowUpDown
                    className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`}
                  />
                  {sortOptions.find((s) => s.id === sort)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"}>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  {sortOptions.map((s) => (
                    <DropdownMenuRadioItem key={s.id} value={s.id}>
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
            {t("coursesPage.results").replace(
              "{{count}}",
              resultsTotal.toLocaleString()
            )}
          </p>

          {/* کارت‌های بهینه‌شده */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {loadingState ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : paginated.length > 0 ? (
              paginated.map((course) => {
                const bought = purchasedCourses[course._id];
                const isFree = course.pricing === 0;
                const isNew =
                  Date.now() - new Date(course.createdAt) <
                  7 * 24 * 60 * 60 * 1000;

                return (
                  <Card
                    key={course._id}
                    className="group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
                  >
                    {/* تصویر + hover play */}
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <div
                        onClick={() => goToCourse(course._id)}
                        className="cursor-pointer h-full"
                      >
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <PlayCircle className="h-16 w-16 text-white" />
                        </div>
                      </div>

                      {/* بج‌های بالا سمت راست/چپ */}
                      <div
                        className={`absolute top-3 ${
                          isRTL ? "left-3" : "right-3"
                        } flex flex-col gap-2`}
                      >
                        {isFree && (
                          <Badge className="bg-emerald-600 text-xs font-medium">
                            {t("courses.free")}
                          </Badge>
                        )}
                        {isNew && (
                          <Badge className="bg-green-500 text-xs font-medium">
                            {t("courses.new")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* محتوای کارت */}
                    <CardContent className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                        {course.instructorName}
                      </p>

                      {/* اطلاعات کوتاه */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{getDuration(course.curriculum)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{course.enrolledStudents || 0}</span>
                        </div>
                      </div>

                      {/* پیشرفت (اگر خریداری شده) */}
                      {bought?.isEnrolled && bought.progress > 0 && (
                        <div className="mb-4 -mx-5 px-5">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{t("courses.yourProgress")}</span>
                            <span className="font-medium">
                              {bought.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${bought.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* فوتر: قیمت + دکمه */}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {isFree ? (
                              <span className="text-emerald-600">
                                {t("courses.free")}
                              </span>
                            ) : (
                              `${course.pricing.toLocaleString()} ${t(
                                "common.currency"
                              )}`
                            )}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="font-medium"
                          onClick={() => goToCourse(course._id)}
                        >
                          {bought?.isEnrolled
                            ? t("courses.continue")
                            : t("course.viewDetails")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20">
                <h2 className="text-3xl font-bold text-gray-400">
                  {t("courses.noCoursesFound")}
                </h2>
              </div>
            )}
          </div>

          {/* صفحه‌بندی */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium">
                {t("pagination.pageOf", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                {t("pagination.next")}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentViewCoursesPage;
