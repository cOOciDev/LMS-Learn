import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import { getRoadmapByCategoryService } from "@/services";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/auth-context";

function StudentCategoryRoadmapPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  const progressKey = useMemo(
    () => `roadmapProgress_${slug}_${auth?.user?._id || "guest"}`,
    [slug, auth?.user?._id]
  );

  useEffect(() => {
    loadRoadmap();
  }, [slug]);

  useEffect(() => {
    const storedProgress = Number(localStorage.getItem(progressKey));
    if (!Number.isNaN(storedProgress)) {
      setActiveStep(storedProgress);
    }
  }, [progressKey]);

  async function loadRoadmap() {
    setLoading(true);
    try {
      const response = await getRoadmapByCategoryService(slug);
      if (response?.success) {
        setRoadmap(response.data);
      }
    } catch (error) {
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  }

  function handleComplete(index) {
    if (index !== activeStep) return;
    const totalSteps = roadmap?.steps?.length || 0;
    const nextStep = Math.min(totalSteps, activeStep + 1);
    setActiveStep(nextStep);
    localStorage.setItem(progressKey, nextStep);
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        {t("common.loading") || "Loading..."}
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="p-6 text-center">
        {t("roadmapCategory.notFound") || "No roadmap defined for this category."}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-widest text-slate-400">
          {slug}
        </p>
        <h1 className="text-4xl font-bold">{roadmap.title}</h1>
        <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t("roadmapCategory.subtitle") ||
            "Complete each milestone to unlock the next step in your learning journey."}
        </p>
      </div>

      <div className="space-y-6">
        {roadmap.steps?.map((step, index) => {
          const isUnlocked = index <= activeStep;
          const isCompleted = index < activeStep;
          return (
            <Card
              key={`${roadmap._id}-${index}`}
              className={`border-2 ${
                isCompleted
                  ? "border-green-400"
                  : isUnlocked
                  ? "border-indigo-400"
                  : "border-gray-200 dark:border-slate-800"
              }`}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {t("roadmapCategory.stepLabel", { number: index + 1 }) ||
                        `Step ${index + 1}`}
                      : {step.title}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 dark:text-slate-300 mt-2">
                      {step.description}
                    </CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 text-sm font-medium">
                    {isCompleted
                      ? t("roadmapCategory.completed") || "Completed"
                      : isUnlocked
                      ? t("roadmapCategory.inProgress") || "In progress"
                      : t("roadmapCategory.locked") || "Locked"}
                  </div>
                </div>

                {step.courseId && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/course/details/${step.courseId}`)}
                    >
                      {t("roadmapCategory.viewCourse") || "View Course"}
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => navigate(`/course/details/${step.courseId}`)}
                    >
                      {step.courseTitle}
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <Button
                    onClick={() => handleComplete(index)}
                    disabled={!isUnlocked || isCompleted}
                  >
                    {isCompleted
                      ? t("roadmapCategory.completed") || "Completed"
                      : t("roadmapCategory.completeStep") || "Complete this step"}
                  </Button>
                  {!isUnlocked && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("roadmapCategory.unlockMessage") ||
                        "Complete the previous step to unlock this stage."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default StudentCategoryRoadmapPage;
