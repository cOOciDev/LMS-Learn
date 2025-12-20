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

  const [activeTab, setActiveTab] = useState("course-landing-page");

  // اعتبارسنجی دقیق و شفاف
  const isLandingValid = () => {
    const required = [
      "title",
      "category",
      "level",
      "primaryLanguage",
      "description",
      "pricing",
    ];
    const result = required.every((key) => {
      const value = courseLandingFormData[key];
      const isValid =
        value !== null &&
        value !== undefined &&
        value !== "" &&
        (typeof value !== "number" || value >= 0);
      console.log(
        `[Validation] ${key}:`,
        value,
        "→",
        isValid ? "OK" : "MISSING"
      );
      return isValid;
    });
    console.log("[Validation] Landing Valid:", result);
    return result;
  };

  const isCurriculumValid = () => {
    const hasLectures = courseCurriculumFormData?.length > 0;
    const allComplete =
      courseCurriculumFormData?.every(
        (item) => item.title?.trim() && item.videoUrl && item.public_id
      ) || false;
    console.log(
      "[Validation] Curriculum → lectures:",
      courseCurriculumFormData?.length,
      "all complete:",
      allComplete
    );
    return hasLectures && allComplete;
  };

  const validateFormData = () => {
    const landing = isLandingValid();
    const curriculum = isCurriculumValid();
    const final = landing && curriculum;
    console.log(
      "FINAL VALIDATION RESULT:",
      final ? "READY TO PUBLISH" : "NOT READY"
    );
    return final;
  };

  const handleNext = (nextTab) => {
    console.log("دکمه ذخیره و ادامه کلیک شد → می‌خواد بره به:", nextTab);
    if (nextTab === "curriculum" && !isLandingValid()) {
      toast({
        title: "خطا",
        description: "اطلاعات دوره کامل نیست",
        variant: "destructive",
      });
      return;
    }
    if (nextTab === "settings" && !isCurriculumValid()) {
      toast({
        title: "خطا",
        description: "برنامه درسی کامل نیست",
        variant: "destructive",
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveTab(nextTab);
  };

  const handleCreateCourse = async () => {
    console.log("دکمه انتشار کلیک شد!");

    if (!validateFormData()) {
      toast({
        title: "ناتمام",
        description: "همه فیلدها را کامل کنید.",
        variant: "destructive",
      });
      return;
    }

    const courseData = {
      instructorId: auth?.user?._id,
      instructorName: auth?.user?.userName,
      title: courseLandingFormData.title?.trim(),
      category: courseLandingFormData.category,
      level: courseLandingFormData.level,
      primaryLanguage: courseLandingFormData.primaryLanguage,
      description: courseLandingFormData.description?.trim(),
      pricing: Number(courseLandingFormData.pricing),
      image: courseLandingFormData.image || "",
      curriculum: courseCurriculumFormData.map((item) => ({
        title: item.title?.trim(),
        videoUrl: item.videoUrl,
        public_id: item.public_id,
        freePreview: !!item.freePreview,
      })),
      students: [],
      status: "published",
      isPublished: true,
    };

    console.log("داده نهایی برای ارسال:", courseData);

    try {
      const response = currentEditedCourseId
        ? await updateCourseByIdService(currentEditedCourseId, courseData)
        : await addNewCourseService(courseData);

      console.log("پاسخ سرور:", response);

      if (response?.success) {
        toast({ title: "موفقیت‌آمیز", description: "دوره منتشر شد!" });
        setCourseLandingFormData(courseLandingInitialFormData);
        setCourseCurriculumFormData(
          courseCurriculumInitialFormData.map((item) => ({ ...item }))
        );
        setCurrentEditedCourseId(null);
        navigate("/instructor");
      }
    } catch (error) {
      // این خط مهمه! دقیقاً خطای سرور رو نشون میده
      console.error("خطای کامل سرور:", error.response?.data);
      console.error("پیام خطا:", error.response?.data?.message);
      console.error("لیست خطاها:", error.response?.data?.errors);

      toast({
        title: "خطا در انتشار",
        description:
          error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.message ||
          "خطای ناشناخته",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (params?.courseId) setCurrentEditedCourseId(params.courseId);
  }, [params?.courseId]);

  useEffect(() => {
    if (currentEditedCourseId) {
      console.log(
        "در حال بارگذاری دوره ویرایشی با آیدی:",
        currentEditedCourseId
      );
      const fetchCourse = async () => {
        try {
          const res = await fetchInstructorCourseDetailsService(
            currentEditedCourseId
          );
          console.log("دوره ویرایشی بارگذاری شد:", res);
          if (res?.success) {
            const data = res.data?.course || res.data;
            setCourseLandingFormData({
              ...courseLandingInitialFormData,
              ...data,
            });
            setCourseCurriculumFormData(data.curriculum || []);
          }
        } catch (err) {
          console.error("خطا در بارگذاری دوره:", err);
        }
      };
      fetchCourse();
    }
  }, [currentEditedCourseId]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            {t("instructor.addNewCourseDesc")}
          </h1>

          <Button
            size="lg"
            disabled={!validateFormData()}
            onClick={handleCreateCourse}
            className="font-bold px-10 shadow-lg bg-green-600 hover:bg-green-700 text-white"
          >
            {t("common.submit")}
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-card">
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-8 bg-muted/50 rounded-xl p-1 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <TabsTrigger
                  value="course-landing-page"
                  className="min-w-[100px] px-3 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  {t("instructor.informations")}
                </TabsTrigger>
                <TabsTrigger
                  value="curriculum"
                  disabled={!isLandingValid()}
                  className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  {t("course.curriculum")}
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  disabled={!isCurriculumValid()}
                  className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                >
                  {t("course.courseImage")}
                </TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="course-landing-page" className="mt-0">
              <CourseLanding onNext={() => handleNext("curriculum")} />
            </TabsContent>
            <TabsContent value="curriculum" className="mt-0">
              <CourseCurriculum onNext={() => handleNext("settings")} />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <CourseSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AddNewCoursePage;
