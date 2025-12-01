import FormControls from "@/components/common-form/form-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseLandingPageFormControls } from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import { useContext, useMemo } from "react";
import { useCategories } from "@/context/category-context";
import { useLanguage } from "@/context/language-context";
import { buildCategoryOptions } from "@/utils/category";

function CourseLanding() {
  const { courseLandingFormData, setCourseLandingFormData } =
    useContext(InstructorContext);
  const { categories, loading } = useCategories();
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

  const landingControls = useMemo(
    () =>
      courseLandingPageFormControls({
        categoryOptions,
        t,
      }),
    [categoryOptions, t]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Landing Page</CardTitle>
      </CardHeader>
      <CardContent>
        <FormControls
          formControls={landingControls}
          formData={courseLandingFormData}
          setFormData={setCourseLandingFormData}
        />
        {loading && categoryOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">
            {t("common.loading") || "Loading categories..."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default CourseLanding;
