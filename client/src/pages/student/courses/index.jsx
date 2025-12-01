import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { buildFilterOptions, sortOptions } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  fetchStudentViewCourseListService,
} from "@/services";
import { ArrowUpDownIcon, Search as SearchIcon } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCategories } from "@/context/category-context";
import { buildCategoryOptions } from "@/utils/category";
import { useLanguage } from "@/context/language-context";

function createSearchParamsHelper(filterParams) {
  const queryParams = [];

  for (const [key, value] of Object.entries(filterParams)) {
    if (Array.isArray(value) && value.length > 0) {
      const paramValue = value.join(",");

      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`);
    }
  }

  return queryParams.join("&");
}

function StudentViewCoursesPage() {
  const [sort, setSort] = useState("price-lowtohigh");
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    studentViewCoursesList,
    setStudentViewCoursesList,
    loadingState,
    setLoadingState,
  } = useContext(StudentContext);
  const [resultsTotal, setResultsTotal] = useState(0);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { categories } = useCategories();
  const { t, language } = useLanguage();

  const categoryOptions = useMemo(
    () =>
      buildCategoryOptions({
        categories,
        language,
        t,
      }),
    [categories, language, t]
  );

  const filterOptions = useMemo(
    () =>
      buildFilterOptions({
        categoryOptions,
      }),
    [categoryOptions]
  );

  const sortQueryMap = useMemo(
    () => ({
      "price-lowtohigh": { sortBy: "pricing", sortOrder: "asc" },
      "price-hightolow": { sortBy: "pricing", sortOrder: "desc" },
      "title-atoz": { sortBy: "title", sortOrder: "asc" },
      "title-ztoa": { sortBy: "title", sortOrder: "desc" },
    }),
    []
  );

  function handleFilterOnChange(getSectionId, getCurrentOption) {
    let cpyFilters = { ...filters };
    const indexOfCurrentSeection =
      Object.keys(cpyFilters).indexOf(getSectionId);

    if (indexOfCurrentSeection === -1) {
      cpyFilters = {
        ...cpyFilters,
        [getSectionId]: [getCurrentOption.id],
      };

    } else {
      const indexOfCurrentOption = cpyFilters[getSectionId].indexOf(
        getCurrentOption.id
      );

      if (indexOfCurrentOption === -1)
        cpyFilters[getSectionId].push(getCurrentOption.id);
      else cpyFilters[getSectionId].splice(indexOfCurrentOption, 1);
    }

    setFilters(cpyFilters);
    sessionStorage.setItem("filters", JSON.stringify(cpyFilters));
  }

  async function fetchAllStudentViewCourses(filters, sort, searchValue) {
    setLoadingState(true);
    const query = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        query.set(key, value.join(","));
      }
    });

    const currentSort = sortQueryMap[sort] || {
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    query.set("sortBy", currentSort.sortBy);
    query.set("sortOrder", currentSort.sortOrder);

    if (searchValue) {
      query.set("search", searchValue);
    }

    try {
      const response = await fetchStudentViewCourseListService(query);
      if (response?.success) {
        const courses = response?.data?.courses || [];
        setStudentViewCoursesList(courses);
        setResultsTotal(response?.data?.pagination?.total ?? courses.length);
      } else {
        setStudentViewCoursesList([]);
        setResultsTotal(0);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setStudentViewCoursesList([]);
      setResultsTotal(0);
    } finally {
      setLoadingState(false);
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
    const buildQueryStringForFilters = createSearchParamsHelper(filters);
    setSearchParams(new URLSearchParams(buildQueryStringForFilters));
  }, [filters, setSearchParams]);

  useEffect(() => {
    setSort("price-lowtohigh");
    setFilters(JSON.parse(sessionStorage.getItem("filters")) || {});
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (filters !== null && sort !== null) {
      fetchAllStudentViewCourses(filters, sort, debouncedSearch);
    }
  }, [filters, sort, debouncedSearch]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("filters");
      setSearchTerm("");
    };
  }, []);


  const filterLabels = {
    category: t("coursesPage.filters.category") || t("home.categoriesTitle") || "Categories",
    level: t("coursesPage.filters.level") || t("course.level") || "Level",
    primaryLanguage: t("coursesPage.filters.primaryLanguage") || t("course.primaryLanguage") || "Language",
  };

  const sortLabelMap = {
    "price-lowtohigh": t("coursesPage.sortLabels.priceLowToHigh") || sortOptions[0].label,
    "price-hightolow": t("coursesPage.sortLabels.priceHighToLow") || sortOptions[1].label,
    "title-atoz": t("coursesPage.sortLabels.titleAToZ") || sortOptions[2].label,
    "title-ztoa": t("coursesPage.sortLabels.titleZToA") || sortOptions[3].label,
  };

  const levelLabels = {
    beginner: t("coursesPage.levelOptions.beginner") || "Beginner",
    intermediate: t("coursesPage.levelOptions.intermediate") || "Intermediate",
    advanced: t("coursesPage.levelOptions.advanced") || "Advanced",
  };

  const languageLabels = {
    english: t("coursesPage.languageOptions.english") || "English",
    persian: t("coursesPage.languageOptions.persian") || "Persian",
  };

  const renderOptionLabel = (sectionId, option) => {
    if (sectionId === "level") {
      return levelLabels[option.id] || option.label;
    }
    if (sectionId === "primaryLanguage") {
      return languageLabels[option.id] || option.label;
    }
    return option.label;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        {t("coursesPage.title") || t("common.courses") || "All Courses"}
      </h1>
      <div className="flex flex-col md:flex-row gap-4">
        <aside className="w-full md:w-64 space-y-4">
          <div>
            {Object.keys(filterOptions).map((ketItem, index) => (
              <div key={index} className="p-4 border-b">
                <h3 className="font-bold mb-3">
                  {filterLabels[ketItem] || ketItem.toUpperCase()}
                </h3>
                <div className="grid gap-2 mt-2">
                  {filterOptions[ketItem].map((option) => (
                    <Label key={option.id} className="flex font-medium items-center gap-3">
                      <Checkbox
                        checked={
                          filters &&
                          Object.keys(filters).length > 0 &&
                          filters[ketItem] &&
                          filters[ketItem].indexOf(option.id) > -1
                        }
                        onCheckedChange={() =>
                          handleFilterOnChange(ketItem, option)
                        }
                      />
                      {renderOptionLabel(ketItem, option)}
                    </Label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="w-full md:max-w-sm relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("coursesPage.searchPlaceholder") || "Search courses..."}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 p-5"
                >
                  <ArrowUpDownIcon className="h-4 w-4" />
                  <span className="text-[16px] font-medium">
                    {t("coursesPage.sortBy") || "Sort By"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => setSort(value)}
                >
                  {sortOptions.map((sortItem) => (
                    <DropdownMenuRadioItem
                      value={sortItem.id}
                      key={sortItem.id}
                    >
                      {sortLabelMap[sortItem.id] || sortItem.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-black font-bold">
              {resultsTotal || studentViewCoursesList.length}{" "}
              {t("coursesPage.resultsLabel") || "Results"}
            </span>
          </div>
          <div className="space-y-4">
            {studentViewCoursesList && studentViewCoursesList.length > 0 ? (
              studentViewCoursesList.map((courseItem) => (
                <Card
                  onClick={() => handleCourseNavigate(courseItem?._id)}
                  className="cursor-pointer"
                  key={courseItem?._id}
                >
                  <CardContent className="flex gap-4 p-4">
                    <div className="w-48 h-32 flex-shrink-0">
                      <img
                        src={courseItem?.image}
                        className="w-ful h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {courseItem?.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-1">
                        {t("coursesPage.createdBy") || "Created by"}{" "}
                        <span className="font-bold">
                          {courseItem?.instructorName}
                        </span>
                      </p>
                      <p className="text-[16px] text-gray-600 mt-3 mb-2">
                        {(() => {
                          const lectureCount = courseItem?.curriculum?.length || 0;
                          const lectureLabel =
                            lectureCount === 1
                              ? t("coursesPage.lectureSingular") || "Lecture"
                              : t("coursesPage.lecturePlural") || "Lectures";
                          const levelText =
                            levelLabels[courseItem?.level] ||
                            courseItem?.level?.toUpperCase();
                          return `${lectureCount} ${lectureLabel} · ${
                            t("coursesPage.levelLabel") || "Level"
                          } ${levelText}`;
                        })()}
                      </p>
                      <p className="font-bold text-lg">
                        ${courseItem?.pricing}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : loadingState ? (
              <Skeleton />
            ) : (
              <h1 className="font-extrabold text-4xl">
                {t("coursesPage.noCourses") || t("home.noCoursesMessage") || "No courses found"}
              </h1>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentViewCoursesPage;
