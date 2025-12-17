import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, Info, Loader2, RefreshCcw, Video } from "lucide-react";
import {
  archiveLiveClassPlanService,
  fetchInstructorLiveClassPlansService,
  publishLiveClassPlanService,
  startInstructorLiveClassService,
} from "@/services";
import { useToast } from "@/hooks/use-toast";
import { InstructorContext } from "@/context/instructor-context";
import CreateLiveEventCard from "./create-live-event-card";
import { useLanguage } from "@/context/language-context";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusBadgeStyles = {
  draft:
    "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600",
  published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/30",
  archived:
    "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/30",
};

function LiveClassesManager({ compact = false }) {
  const { t } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [startingPlanId, setStartingPlanId] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { instructorCoursesList } = useContext(InstructorContext);

  const courseMap = useMemo(() => {
    return instructorCoursesList.reduce((acc, course) => {
      if (course?._id) {
        acc[course._id.toString()] = course.title;
      }
      return acc;
    }, {});
  }, [instructorCoursesList]);

  const resolveCourseTitle = (plan) => {
    if (!plan.courseId) return t("liveClassesManager.plan.standalone");
    const id = typeof plan.courseId === "string" ? plan.courseId : plan.courseId?._id;
    if (!id) return t("liveClassesManager.plan.standalone");
    return courseMap[id] || t("liveClassesManager.plan.courseUnavailable");
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetchInstructorLiveClassPlansService();
      setPlans(response?.success ? response.data || [] : []);
    } catch (error) {
      console.error("Failed to load live class plans", error);
      toast({
        title: t("liveClassesManager.toast.loadFailed.title"),
        description: error?.response?.data?.message || t("liveClassesManager.toast.loadFailed.description"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handlePublish = async (planId) => {
    try {
      await publishLiveClassPlanService(planId);
      toast({
        title: t("liveClassesManager.toast.publishSuccess.title"),
        description: t("liveClassesManager.toast.publishSuccess.description"),
      });
      fetchPlans();
    } catch (error) {
      toast({
        title: t("liveClassesManager.toast.publishFailed.title"),
        description: error?.response?.data?.message || t("liveClassesManager.toast.publishFailed.description"),
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (planId) => {
    try {
      await archiveLiveClassPlanService(planId);
      toast({
        title: t("liveClassesManager.toast.archiveSuccess.title"),
        description: t("liveClassesManager.toast.archiveSuccess.description"),
      });
      fetchPlans();
    } catch (error) {
      toast({
        title: t("liveClassesManager.toast.archiveFailed.title"),
        description: error?.response?.data?.message || t("liveClassesManager.toast.archiveFailed.description"),
        variant: "destructive",
      });
    }
  };

  const handleStartClass = async (planId) => {
    setStartingPlanId(planId);
    try {
      await startInstructorLiveClassService(planId);
      navigate(`/instructor/live-classes/${planId}/host`);
    } catch (error) {
      toast({
        title: t("liveClassesManager.toast.startFailed.title"),
        description: error?.response?.data?.message || t("liveClassesManager.toast.startFailed.description"),
        variant: "destructive",
      });
    } finally {
      setStartingPlanId(null);
    }
  };

  const formatWeekdays = (weekdayValues = []) => {
    if (!weekdayValues.length) return t("liveClassesManager.plan.noDays");
    const sorted = [...weekdayValues].sort();
    return sorted.map((day) => weekdayLabels[day] || day).join(", ");
  };

  const filteredPlans = useMemo(() => {
    if (activeTab === "all") return plans;
    return plans.filter((plan) => plan.status === activeTab);
  }, [plans, activeTab]);

  const visiblePlans = compact ? filteredPlans.slice(0, 3) : filteredPlans;

  const tabOptions = [
    { label: t("liveClassesManager.tabs.all"), value: "all" },
    { label: t("liveClassesManager.tabs.draft"), value: "draft" },
    { label: t("liveClassesManager.tabs.published"), value: "published" },
    { label: t("liveClassesManager.tabs.archived"), value: "archived" },
  ];

  return (
    <section className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Video className="h-6 w-6 text-primary" />
            {t("liveClassesManager.header.title")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("liveClassesManager.header.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchPlans}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {t("liveClassesManager.buttons.refresh")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/instructor/live-classes?tab=create")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <CalendarClock className="h-4 w-4" />
            {t("liveClassesManager.buttons.newLivePlan")}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabOptions.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-primary text-white shadow"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visiblePlans.length ? (
        <div className="space-y-4">
          {visiblePlans.map((plan) => {
            const badgeClass = statusBadgeStyles[plan.status] || statusBadgeStyles.draft;

            return (
              <div
                key={plan._id}
                className="relative rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
              >
                <span
                  className={`absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase ${badgeClass}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {plan.status?.toUpperCase()}
                </span>
                <div className="pr-28">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {plan.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("liveClassesManager.plan.course")}: {resolveCourseTitle(plan)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("liveClassesManager.plan.timezone")}: {plan.timezone}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatWeekdays(plan.weekdays)} · {plan.dailyStartTime} - {plan.dailyEndTime}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("liveClassesManager.plan.attendance")}: {plan.minAttendanceMinutes} {t("liveClassesManager.plan.minutes")}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {plan.status === "draft" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePublish(plan._id)}
                        className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300"
                      >
                        {t("liveClassesManager.buttons.publish")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(plan._id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300"
                      >
                        {t("liveClassesManager.buttons.archive")}
                      </button>
                    </>
                  )}

                  {plan.status === "published" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartClass(plan._id)}
                        disabled={startingPlanId === plan._id}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {startingPlanId === plan._id
                          ? t("liveClassesManager.starting")
                          : t("liveClassesManager.buttons.startClass")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(plan._id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300"
                      >
                        {t("liveClassesManager.buttons.archive")}
                      </button>
                    </>
                  )}

                  {plan.status === "archived" && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("liveClassesManager.plan.archivedNotice")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Info className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t("liveClassesManager.emptyState.title")}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("liveClassesManager.emptyState.description")}
          </p>
        </div>
      )}

      {compact && filteredPlans.length > visiblePlans.length && (
        <button
          type="button"
          onClick={() => navigate("/instructor/live-classes")}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("liveClassesManager.buttons.viewAll")}
        </button>
      )}

      {!compact && (
        <CreateLiveEventCard
          onCreate={() => navigate("/instructor/live-classes?tab=create")}
        />
      )}
    </section>
  );
}

export default LiveClassesManager;
