import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Globe, Layers, ListChecks } from "lucide-react";
import { createLiveClassPlanService } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";



function CreateLivePlan({ instructorCoursesList = [] }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState(null);

  const weekdays = [
    { label: t("weekDays.Mon"), value: 1 },
    { label: t("weekDays.Tue"), value: 2 },
    { label: t("weekDays.Wed"), value: 3 },
    { label: t("weekDays.Thu"), value: 4 },
    { label: t("weekDays.Fri"), value: 5 },
    { label: t("weekDays.Sat"), value: 6 },
    { label: t("weekDays.Sun"), value: 0 },
  ];
  
  const initialFormState = useMemo(
    () => ({
      title: "",
      courseId: "",
      timezone: defaultTimezone,
      startDate: "",
      endDate: "",
      weekdays: [],
      startTime: "",
      endTime: "",
      minAttendance: "",
    }),
    [defaultTimezone]
  );

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const timezoneOptions = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [defaultTimezone];
    }
  }, [defaultTimezone]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const toggleWeekday = (value) => {
    setForm((prev) => {
      const exists = prev.weekdays.includes(value);
      return {
        ...prev,
        weekdays: exists
          ? prev.weekdays.filter((day) => day !== value)
          : [...prev.weekdays, value],
      };
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = t("createLivePlan.errors.titleRequired");
    if (!form.startDate) nextErrors.startDate = t("createLivePlan.errors.startDateRequired");
    if (!form.endDate) nextErrors.endDate = t("createLivePlan.errors.endDateRequired");
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = t("createLivePlan.errors.endDateAfterStart");
    }
    if (!form.weekdays.length) nextErrors.weekdays = t("createLivePlan.errors.weekdaysRequired");
    if (!form.startTime) nextErrors.startTime = t("createLivePlan.errors.startTimeRequired");
    if (!form.endTime) nextErrors.endTime = t("createLivePlan.errors.endTimeRequired");
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      nextErrors.endTime = t("createLivePlan.errors.endTimeAfterStart");
    }
    if (form.minAttendance === "") {
      nextErrors.minAttendance = t("createLivePlan.errors.minAttendanceRequired");
    }


    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (status) => {
    setSubmitAction(status);
    if (!validate()) {
      setSubmitAction(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        timezone: form.timezone,
        startDate: form.startDate,
        endDate: form.endDate,
        weekdays: form.weekdays,
        dailyStartTime: form.startTime,
        dailyEndTime: form.endTime,
        minAttendanceMinutes: Number(form.minAttendance || 0),
        status,
      };

      if (form.courseId) {
        payload.courseId = form.courseId;
      }

      await createLiveClassPlanService(payload);
      toast({
        title: status === "published" 
          ? t("createLivePlan.buttons.publishPlan")
          : t("createLivePlan.buttons.saveDraft"),
        description: status === "published"
          ? t("createLivePlan.header.description")
          : t("createLivePlan.buttons.saveDraft"),
      });
      setForm(initialFormState);
      navigate("/instructor/live-classes");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t("createLivePlan.errors.minAttendanceRequired")
      toast({
        title: t("createLivePlan.errors.minAttendanceRequired"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <header className="space-y-2">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Layers className="h-6 w-6 text-primary" />
          {t("createLivePlan.header.title")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("createLivePlan.header.description")}
        </p>
      </header>

      <form className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("createLivePlan.form.title")}
          </label>
          <input
            type="text"
            value={form.title}
            onChange={handleChange("title")}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary/70 dark:border-slate-700 dark:bg-slate-900/80"
            placeholder={t("createLivePlan.form.titlePlaceholder")}
            disabled={isSubmitting}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("createLivePlan.form.course")}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900/80">
            <ListChecks className="mr-2 h-4 w-4 text-slate-400" />
            <select
              value={form.courseId}
              onChange={handleChange("courseId")}
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              disabled={isSubmitting}
            >
              <option value="">{t("createLivePlan.form.course")}</option>
              {instructorCoursesList.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("createLivePlan.form.courseDescription")}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("createLivePlan.form.timezone")}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900/80">
            <Globe className="mr-2 h-4 w-4 text-slate-400" />
            <select
              value={form.timezone}
              onChange={handleChange("timezone")}
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              disabled={isSubmitting}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("createLivePlan.form.startDate")}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900/80">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={form.startDate}
              onChange={handleChange("startDate")}
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              disabled={isSubmitting}
            />
          </div>
          {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("createLivePlan.form.endDate")}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900/80">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={handleChange("endDate")}
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              disabled={isSubmitting}
            />
          </div>
          {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("createLivePlan.form.weekdays")}
          </label>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((day) => {
              const isActive = form.weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/80"
                  } ${isSubmitting ? "opacity-70" : ""}`}
                  disabled={isSubmitting}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {errors.weekdays && <p className="text-xs text-red-500">{errors.weekdays}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("createLivePlan.form.dailyStartTime")}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900/80">
            <Clock className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="time"
              value={form.startTime}
              onChange={handleChange("startTime")}
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              disabled={isSubmitting}
            />
          </div>
          {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("createLivePlan.form.dailyEndTime")}
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900/80">
            <Clock className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="time"
              value={form.endTime}
              onChange={handleChange("endTime")}
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              disabled={isSubmitting}
            />
          </div>
          {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("createLivePlan.form.minAttendance")}
          </label>
          <input
            type="number"
            min="0"
            value={form.minAttendance}
            onChange={handleChange("minAttendance")}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-primary/70 dark:border-slate-700 dark:bg-slate-900/80"
            placeholder={t("createLivePlan.form.minAttendancePlaceholder")}
            disabled={isSubmitting}
          />
          {errors.minAttendance && (
            <p className="text-xs text-red-500">{t("createLivePlan.errors.minAttendanceRequired")}</p>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => handleSubmit("draft")}
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${
            isSubmitting && submitAction === "draft" ? "opacity-60" : ""
          }`}
        >
          {isSubmitting && submitAction === "draft" 
            ? t("createLivePlan.buttons.savingDraft")
            : t("createLivePlan.buttons.saveDraft")}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("published")}
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 ${
            isSubmitting && submitAction === "published" ? "opacity-70" : ""
          }`}
        >
          {isSubmitting && submitAction === "published"
            ? t("createLivePlan.buttons.publishingPlan")
            : t("createLivePlan.buttons.publishPlan")}
        </button>
      </div>
    </div>
  );
}

export default CreateLivePlan;
