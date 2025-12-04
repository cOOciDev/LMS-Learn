// client/src/components/instructor-view/courses/add-new-course/course-landing.jsx
import { useContext, useMemo } from "react";
import { toast } from "sonner";
import CommonForm from "@/components/common-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseLandingPageFormControls } from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import { useCategories } from "@/context/category-context";
import { useLanguage } from "@/context/language-context";
import { buildCategoryOptions } from "@/utils/category";

function CourseLanding({ onNext }) {
  const { courseLandingFormData, setCourseLandingFormData } = useContext(InstructorContext);
  const { categories, loading } = useCategories();
  const { t, language } = useLanguage();
  const isRTL = language === "fa";

  const categoryOptions = useMemo(
    () => buildCategoryOptions({ categories, language, t }),
    [categories, language, t]
  );

  const landingControls = useMemo(
    () => courseLandingPageFormControls({ categoryOptions, t }),
    [categoryOptions, t]
  );

const validateAndNext = () => {
  const requiredFields = landingControls.filter(item => item.required);

  for (const field of requiredFields) {
    const value = courseLandingFormData[field.name];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      const element = document.getElementById(field.name);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      toast.error(isRTL ? `${field.label} الزامی است` : `${field.label} is required`);
      return false;
    }
  }

  // اضافه شده: چک حداقل ۵ کاراکتر برای عنوان


  toast.success(isRTL ? "به مرحله بعد رفتید!" : "Moved to next step!");
  window.scrollTo({ top: 0, behavior: "smooth" });
  onNext();
  return true;
};

  const handleSubmit = (e) => {
    e.preventDefault();
    validateAndNext();
  };

  return (
    <Card className="border-0 rounded-2xl overflow-hidden shadow-xl">
      <CardHeader className="border-b pb-8 bg-muted/50">
        <div className="text-center">
          <CardTitle className="text-3xl font-extrabold text-foreground">
            {t("courseLanding.title") || "صفحه معرفی دوره"}
          </CardTitle>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("courseLanding.subtitle") || "اطلاعات اصلی دوره را وارد کنید تا جذاب‌تر به نظر برسد"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 lg:p-10 bg-card">
        <div className="max-w-4xl mx-auto">
          <CommonForm
            handleSubmit={handleSubmit}
            buttonText={isRTL ? "ذخیره و ادامه" : "Save & Continue"}
            formControls={landingControls}
            formData={courseLandingFormData}
            setFormData={setCourseLandingFormData}
          />

          {loading && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center gap-4 bg-muted px-8 py-5 rounded-2xl shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-muted-foreground border-t-blue-500"></div>
                <p className="text-lg font-medium text-foreground">
                  در حال بارگذاری دسته‌بندی‌ها...
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CourseLanding;