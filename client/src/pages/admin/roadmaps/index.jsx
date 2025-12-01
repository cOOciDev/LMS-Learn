import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { useCategories } from "@/context/category-context";
import {
  createRoadmapService,
  getAdminRoadmapsService,
  getAllCoursesAdminService,
} from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function AdminRoadmapsPage() {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const { toast } = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categorySlug: "",
  });
  const [steps, setSteps] = useState([
    { title: "", description: "", courseId: "" },
  ]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        id: category.slug || category.id,
        label:
          language === "fa"
            ? category?.translations?.fa || category.name
            : category.name,
      })),
    [categories, language]
  );

  useEffect(() => {
    fetchData();
    fetchCourses();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await getAdminRoadmapsService();
      if (response?.success) {
        setRoadmaps(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load roadmaps:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      const response = await getAllCoursesAdminService({
        limit: 100,
        page: 1,
      });
      if (response?.success) {
        setCourses(response?.data?.courses || []);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  }

  function handleStepChange(index, field, value) {
    setSteps((prev) =>
      prev.map((step, idx) =>
        idx === index ? { ...step, [field]: value } : step
      )
    );
  }

  function addStep() {
    setSteps((prev) => [...prev, { title: "", description: "", courseId: "" }]);
  }

  function removeStep(index) {
    if (steps.length === 1) return;
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.title || !formData.categorySlug) {
      toast({
        title: t("common.error"),
        description: t("admin.roadmapMissingFields") || "Fill required fields.",
        variant: "destructive",
      });
      return;
    }

    if (
      steps.some(
        (step) => !step.title || !step.description || !step.courseId
      )
    ) {
      toast({
        title: t("common.error"),
        description:
          t("admin.roadmapStepValidation") ||
          "Every step needs a title, description, and course.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        steps: steps.map((step, index) => {
          const course = courses.find((c) => c._id === step.courseId);
          return {
            ...step,
            order: index,
            courseTitle: course?.title,
          };
        }),
      };
      const response = await createRoadmapService(payload);
      if (response?.success) {
        toast({
          title: t("common.success"),
          description:
            t("admin.roadmapCreated") || "Roadmap saved successfully.",
        });
        setFormData({ title: "", categorySlug: "" });
        setSteps([{ title: "", description: "", courseId: "" }]);
        fetchData();
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error?.response?.data?.message ||
          t("admin.roadmapCreateFailed") ||
          "Unable to save roadmap.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t("admin.roadmapManagement") || "Roadmap Management"}
        </h1>
        <p className="text-muted-foreground">
          {t("admin.roadmapManagementDescription") ||
            "Design structured learning journeys and connect each step to an existing course."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.createRoadmap") || "Create Roadmap"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("admin.roadmapTitle") || "Roadmap Title"}
                </label>
                <Input
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({ ...formData, title: event.target.value })
                  }
                  placeholder={t("admin.roadmapTitlePlaceholder") || "e.g. Web Development"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("admin.selectCategory") || "Select Category"}
                </label>
                <Select
                  value={formData.categorySlug}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categorySlug: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.selectCategory") || "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {t("admin.roadmapSteps") || "Steps"}
                </h3>
                <Button type="button" variant="outline" onClick={addStep}>
                  {t("admin.addStep") || "Add Step"}
                </Button>
              </div>
              {steps.map((step, index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {t("admin.stepLabel", { number: index + 1 }) ||
                          `Step ${index + 1}`}
                      </h4>
                      {steps.length > 1 && (
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => removeStep(index)}
                        >
                          {t("admin.removeStep") || "Remove"}
                        </Button>
                      )}
                    </div>
                    <Input
                      value={step.title}
                      onChange={(event) =>
                        handleStepChange(index, "title", event.target.value)
                      }
                      placeholder={t("admin.stepTitlePlaceholder") || "Step title"}
                    />
                    <Textarea
                      value={step.description}
                      onChange={(event) =>
                        handleStepChange(index, "description", event.target.value)
                      }
                      placeholder={t("admin.stepDescriptionPlaceholder") || "Describe what learners should achieve in this step"}
                    />
                    <Select
                      value={step.courseId}
                      onValueChange={(value) =>
                        handleStepChange(index, "courseId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("admin.stepSelectCourse") || "Attach course"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              {saving
                ? t("common.loading") || "Saving..."
                : t("admin.saveRoadmap") || "Save Roadmap"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.existingRoadmaps") || "Existing Roadmaps"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>{t("common.loading") || "Loading..."}</p>
          ) : roadmaps.length === 0 ? (
            <p className="text-muted-foreground">
              {t("admin.noRoadmaps") || "No roadmaps defined yet."}
            </p>
          ) : (
            <div className="space-y-4">
              {roadmaps.map((roadmap) => (
                <div
                  key={roadmap._id}
                  className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800/70"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase text-slate-400">
                        {roadmap.categorySlug}
                      </p>
                      <h3 className="text-xl font-semibold">{roadmap.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500">
                      {roadmap.steps?.length || 0}{" "}
                      {t("admin.stepsCountLabel") || "steps"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminRoadmapsPage;
