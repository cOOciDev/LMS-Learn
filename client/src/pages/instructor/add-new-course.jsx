// client/src/pages/instructor/add-new-course.jsx

import CourseCurriculum from "@/components/instructor-view/courses/add-new-course/course-curriculum";
import CourseLanding from "@/components/instructor-view/courses/add-new-course/course-landing";
import CourseSettings from "@/components/instructor-view/courses/add-new-course/course-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { AuthContext } from "@/context/auth-context";
import { InstructorContext } from "@/context/instructor-context";
import {
  addNewCourseService,
  fetchInstructorCourseDetailsService,
  updateCourseByIdService,
} from "@/services";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

function AddNewCoursePage() {
  const {
    courseLandingFormData,
    courseCurriculumFormData,
    setCourseLandingFormData,
    setCourseCurriculumFormData,
    currentEditedCourseId,
    setCurrentEditedCourseId,
  } = useContext(InstructorContext);

  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  // کنترل تب فعلی
  const [activeTab, setActiveTab] = useState("course-landing-page");

  // اعتبارسنجی مرحله Landing
  const isLandingValid = () => {
    const required = [
      "title",
      "category",
      "level",
      "primaryLanguage",
      "description",
      "pricing",
    ];
    return required.every(
      (key) =>
        courseLandingFormData[key] &&
        courseLandingFormData[key].toString().trim() !== ""
    );
  };

  // اعتبارسنجی مرحله Curriculum
  const isCurriculumValid = () => {
    if (!courseCurriculumFormData || courseCurriculumFormData.length === 0)
      return false;
    return courseCurriculumFormData.every(
      (item) => item.title?.trim() && item.videoUrl && item.public_id
    );
  };

  // اجازه تغییر تب فقط اگر مرحله قبلی معتبر باشه
  const handleTabChange = (value) => {
    if (value === "curriculum" && !isLandingValid()) {
      toast({
        title: t("common.error"),
        description:
          t("instructor.completeLandingFirst") ||
          "لطفاً ابتدا اطلاعات صفحه معرفی دوره را کامل کنید.",
        variant: "destructive",
      });
      return;
    }
    if (value === "settings" && !isCurriculumValid()) {
      toast({
        title: t("common.error"),
        description:
          t("instructor.completeCurriculumFirst") ||
          "لطفاً ابتدا برنامه درسی دوره را کامل کنید.",
        variant: "destructive",
      });
      return;
    }
    setActiveTab(value);
  };

  const validateFormData = () => isLandingValid() && isCurriculumValid();

  async function handleCreateCourse() {
    if (!validateFormData()) {
      toast({
        title: t("common.error"),
        description:
          t("instructor.completeAllSteps") || "لطفاً تمام مراحل را کامل کنید.",
        variant: "destructive",
      });
      if (!isLandingValid()) setActiveTab("course-landing-page");
      else if (!isCurriculumValid()) setActiveTab("curriculum");
      return;
    }

    try {
      const courseFinalFormData = {
        instructorId: auth?.user?._id,
        instructorName: auth?.user?.userName,
        date: new Date(),
        ...courseLandingFormData,
        students: [],
        curriculum: courseCurriculumFormData,
        status: "published",
        isPublished: true,
      };

      const response =
        currentEditedCourseId !== null
          ? await updateCourseByIdService(
              currentEditedCourseId,
              courseFinalFormData
            )
          : await addNewCourseService(courseFinalFormData);

      if (response?.success) {
        toast({
          title: t("common.success"),
          description: currentEditedCourseId
            ? t("instructor.courseUpdated") || "دوره با موفقیت به‌روزرسانی شد!"
            : t("instructor.courseCreated") || "دوره با موفقیت ایجاد شد!",
        });
        setCourseLandingFormData(courseLandingInitialFormData);
        setCourseCurriculumFormData(
          courseCurriculumInitialFormData.map((item) => ({ ...item }))
        );
        setCurrentEditedCourseId(null);
        navigate("/instructor");
      } else {
        toast({
          title: t("common.error"),
          description:
            response?.message || t("common.errorOccurred") || "خطایی رخ داد.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error?.response?.data?.message || t("common.errorOccurred"),
        variant: "destructive",
      });
    }
  }

  async function fetchCurrentCourseDetails() {
    try {
      const response = await fetchInstructorCourseDetailsService(
        currentEditedCourseId
      );
      if (response?.success) {
        const courseData = response?.data?.course || response?.data;
        setCourseLandingFormData({
          ...courseLandingInitialFormData,
          ...courseData,
        });
        setCourseCurriculumFormData(courseData?.curriculum || []);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          t("instructor.loadCourseFailed") ||
          "بارگذاری اطلاعات دوره با خطا مواجه شد.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (currentEditedCourseId !== null) fetchCurrentCourseDetails();
  }, [currentEditedCourseId]);

  useEffect(() => {
    if (params?.courseId) setCurrentEditedCourseId(params?.courseId);
  }, [params?.courseId]);

  const isEditMode = currentEditedCourseId !== null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* هدر صفحه */}
      <div className="mb-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/instructor")}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t("common.back")}
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <h1 className="text-3xl font-extrabold text-foreground">
            {isEditMode
              ? t("instructor.editCourse")
              : t("instructor.createCourse")}
          </h1>

          <Button
            size="lg"
            disabled={!validateFormData()}
            onClick={handleCreateCourse}
            className="font-bold px-8"
          >
            {isEditMode ? t("common.update") : t("common.publish")}
          </Button>
        </div>
      </div>

      {/* کارت اصلی */}
      <Card className="border-0 shadow-xl bg-card">
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-8 bg-muted/50 rounded-xl p-1 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <TabsTrigger
                  value="course-landing-page"
                  className="min-w-[100px] px-3 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <span className="hidden xs:inline">
                    {t("course.courseDetails") || "اطلاعات دوره"}
                  </span>
                  {t("course.courseDetails") || "اطلاعات"}
                </TabsTrigger>

                <TabsTrigger
                  value="curriculum"
                  disabled={!isLandingValid()}
                  className="min-w-[10px] px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <span className="hidden xs:inline">
                    {t("course.curriculum") || "برنامه درسی"}
                  </span>
                  {t("course.curriculum") || "برنامه درسی"}
                </TabsTrigger>

                <TabsTrigger
                  value="settings"
                  disabled={!isCurriculumValid()}
                  className="min-w-[10px] px-3 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  <span className="hidden xs:inline">
                    {t("course.courseImage") || "پوستر"}
                  </span>
                  {t("course.courseImage") || "پوستر"}
                </TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="course-landing-page" className="mt-0">
              <CourseLanding onNext={() => setActiveTab("curriculum")} />
            </TabsContent>

            <TabsContent value="curriculum" className="mt-0">
              <CourseCurriculum onNext={() => setActiveTab("settings")} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <CourseSettings
                onPublish={handleCreateCourse}
                isEditMode={isEditMode}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddNewCoursePage;
