import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  fetchStudentLiveClassPlanByIdService,
  checkCoursePurchaseInfoService,
} from "@/services";
import { Loader2, CalendarDays, Clock, MapPin, ArrowLeft } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

function LivePlanDetailsPage() {
  const { planId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const response = await fetchStudentLiveClassPlanByIdService(planId);
        if (response?.success) {
          setPlan(response.data);
          setError("");
        } else {
          setError("Live class plan not found.");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || "Unable to load live class plan."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleJoinCourse = async () => {
    if (!plan?.courseId) return;
    if (!auth?.user?._id) {
      navigate(`/course/details/${plan.courseId}`);
      return;
    }

    try {
      const response = await checkCoursePurchaseInfoService(plan.courseId);
      if (response?.success && response?.data?.isEnrolled) {
        navigate(`/course-progress/${plan.courseId}`);
      } else {
        navigate(`/course/details/${plan.courseId}`);
      }
    } catch {
      navigate(`/course/details/${plan.courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-red-500">{error || "Plan unavailable."}</p>
        <Button className="mt-6" onClick={() => navigate("/courses")}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Live Cohort
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {plan.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {plan.courseId
                ? "Linked to a premium course with live sessions."
                : "Standalone live experience curated by instructor."}
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
            Attendance requirement: {plan.minAttendanceMinutes} minutes
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Duration
                </p>
                <p className="text-sm font-medium">
                  {new Date(plan.startDate).toLocaleDateString()} –{" "}
                  {new Date(plan.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Clock className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Daily schedule
                </p>
                <p className="text-sm font-medium">
                  {plan.dailyStartTime} – {plan.dailyEndTime}
                </p>
                <p className="text-xs text-slate-400">{plan.timezone}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Weekdays
                </p>
                <p className="text-sm font-medium">
                  {plan.weekdays
                    ?.map((day) => weekdayNames[day] || `Day ${day}`)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          {plan.courseId ? (
            <Button className="flex-1 min-w-[200px]" onClick={handleJoinCourse}>
              View linked course
            </Button>
          ) : (
            <Button
              className="flex-1 min-w-[200px]"
              onClick={() => navigate("/courses")}
            >
              See all available live courses
            </Button>
          )}
          <Button
            variant="outline"
            className="min-w-[200px]"
            onClick={() => navigate("/courses")}
          >
            Browse catalog
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LivePlanDetailsPage;

