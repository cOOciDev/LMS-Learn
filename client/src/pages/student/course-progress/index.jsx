import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  getCurrentCourseProgressService,
  markLectureAsViewedService,
  resetCourseProgressService,
  submitCourseRatingService,
  getCourseExercisesService,
  submitCourseExerciseService,
  getCourseCertificateStatusService,
} from "@/services";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, Play, Star } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/context/language-context";

function StudentViewCourseProgressPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { studentCurrentCourseProgress, setStudentCurrentCourseProgress } =
    useContext(StudentContext);

  const [lockCourse, setLockCourse] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showCourseCompleteDialog, setShowCourseCompleteDialog] =
    useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const curriculum = studentCurrentCourseProgress?.courseDetails?.curriculum || [];
  const currentIndex = curriculum.findIndex(
    (item) => item._id === currentLecture?._id
  );
  const viewedLectures =
    studentCurrentCourseProgress?.progress?.filter((p) => p.viewed).length || 0;
  const completionPercent = curriculum.length
    ? Math.round((viewedLectures / curriculum.length) * 100)
    : 0;
  const nextLecture = curriculum[currentIndex + 1] || null;
  const journeySteps = useMemo(() => {
    if (!curriculum.length) return [];
    const steps = [];
    const startTitle = curriculum[0]?.title || "Introduction";
    steps.push({
      label: t("course.start") || "Start",
      title: startTitle,
      status: currentIndex > 0 ? "done" : "upcoming",
    });
    if (currentLecture) {
      steps.push({
        label: t("course.now") || "Now",
        title: currentLecture.title,
        status: "current",
      });
    }
    if (nextLecture) {
      steps.push({
        label: t("course.next") || "Next",
        title: nextLecture.title,
        status: "upcoming",
      });
    } else if (curriculum.length > 1) {
      steps.push({
        label: t("course.finish") || "Finish",
        title: curriculum[curriculum.length - 1]?.title || "Final Lecture",
        status: "done",
      });
    }
    return steps;
  }, [curriculum, currentIndex, currentLecture, nextLecture, t]);
  const starLabels = [
    t("student.ratingPoor") || "Needs improvement",
    t("student.ratingFair") || "Fair",
    t("student.ratingGood") || "Good",
    t("student.ratingStrong") || "Very Good",
    t("student.ratingExcellent") || "Excellent",
  ];
  const ratingHelper = ratingValue
    ? starLabels[Math.min(ratingValue, starLabels.length) - 1]
    : "";
  const isRatingDisabled =
    !studentCurrentCourseProgress?.courseDetails?._id ||
    ratingSubmitted ||
    !courseCompleted;
  const { id } = useParams();
  const [accessStatus, setAccessStatus] = useState("loading"); // loading | granted | denied
  const [exerciseData, setExerciseData] = useState({
    lectures: {},
    summary: { totalRequired: 0, submitted: 0 },
  });
  const [exerciseAnswer, setExerciseAnswer] = useState("");
  const [exerciseAttachment, setExerciseAttachment] = useState("");
  const [submittingExercise, setSubmittingExercise] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState(null);
  const accessMessages = {
    loading: t("student.accessLoading") || "Checking access...",
    denied: t("student.accessDenied") || "You do not have access to this course.",
  };
  const currentExercise =
    currentLecture?._id && exerciseData.lectures
      ? exerciseData.lectures[currentLecture._id]
      : null;
  const exerciseStatusValue = currentExercise?.submission?.status;
  const exerciseStatusLabel = exerciseStatusValue
    ? exerciseStatusValue === "approved"
      ? t("student.exerciseStatusApproved") || "Approved"
      : exerciseStatusValue === "rejected"
      ? t("student.exerciseStatusRejected") || "Needs revision"
      : t("student.exerciseStatusPending") || "Pending"
    : null;
  const certificateStatus =
    certificateInfo?.status ||
    (exerciseData.summary.totalRequired > 0 ? "not_requested" : "not_required");
  const certificateStatusMessage =
    certificateStatus === "approved"
      ? t("student.certificateApprovedMessage") || 
        "Certificate issued! Congratulations on completing this course."
      : certificateStatus === "pending"
      ? t("student.certificatePending") || 
        "Your certificate request is waiting for admin approval."
      : certificateStatus === "rejected"
      ? t("student.certificateRejected") || 
        "Your certificate was rejected. Please review the feedback."
      : certificateStatus === "not_requested"
      ? t("student.certificateNotRequested") || 
        "Submit all exercises to request your certificate."
      : "";


  // بقیه فانکشن‌ها بدون تغییر (fetch, progress, rating, etc)
  async function fetchCurrentCourseProgress() {
    if (!auth?.user?._id || !id) return;
    setAccessStatus("loading");
    try {
    const response = await getCurrentCourseProgressService(id);
      if (response?.success) {
        if (!response?.data?.isPurchased) {
          setAccessStatus("denied");
          setLockCourse(true);
          return;
        }
        setAccessStatus("granted");
        setStudentCurrentCourseProgress({
          courseDetails: response?.data?.courseDetails,
          progress: response?.data?.progress || [],
        });
        setCertificateInfo(response?.data?.certificate || null);
        setCourseCompleted(!!response?.data?.completed);

        const curriculum = response?.data?.courseDetails?.curriculum || [];
        if (response?.data?.completed) {
          setCurrentLecture(curriculum[0] || null);
          setShowCourseCompleteDialog(true);
          setShowConfetti(true);
          setCourseCompleted(true);
          return;
        }

        const lastViewedIndex =
          response.data.progress?.reduceRight(
            (acc, item, idx) => (item.viewed ? idx : acc),
            -1
          ) ?? -1;
        const nextLectureIndex = lastViewedIndex + 1;
        setCurrentLecture(
          curriculum[nextLectureIndex] ||
            curriculum[lastViewedIndex] ||
            curriculum[0]
        );
      }
    } catch (err) {
      console.error("Error fetching course progress:", err);
      setAccessStatus("denied");
      setLockCourse(true);
    }
  }

  function handleSelectLecture(lecture) {
    if (lecture && !lockCourse) {
      setCurrentLecture(lecture);
    }
  }

  async function updateCourseProgress() {
    if (!currentLecture || lockCourse) return;
    const response = await markLectureAsViewedService(
      studentCurrentCourseProgress?.courseDetails?._id,
      currentLecture._id
    );
    if (response?.success) fetchCurrentCourseProgress();
  }

  function handleVideoProgress(progress) {
    if (progress.played >= 0.9 && !currentLecture?.viewed) {
      updateCourseProgress();
    }
  }

  async function handleRewatchCourse() {
    const response = await resetCourseProgressService(
      studentCurrentCourseProgress?.courseDetails?._id
    );
    if (response?.success) {
      setCurrentLecture(null);
      setShowConfetti(false);
      setShowCourseCompleteDialog(false);
      setCourseCompleted(false);
      fetchCurrentCourseProgress();
    }
  }

  async function handleSubmitRating() {
    if (ratingValue < 1 || ratingValue > 5)
      return toast({
        title: "خطا",
        description: "امتیاز باید بین ۱ تا ۵ باشد",
        variant: "destructive",
      });
    setRatingSubmitting(true);
    try {
      const response = await submitCourseRatingService({
        courseId: studentCurrentCourseProgress?.courseDetails?._id,
        rating: Number(ratingValue),
        review: reviewText,
      });
      if (response?.success) {
        toast({ title: "ممنون!", description: "نظر شما ثبت شد" });
        setRatingSubmitted(true);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description:
          error?.response?.data?.message ||
          t("course.ratingError") ||
          "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setRatingSubmitting(false);
    }
  }

  async function fetchCourseExercises() {
    if (!id) return;
    try {
      const response = await getCourseExercisesService(id);
      const lectureMap = {};
      response?.data?.lectures?.forEach((lecture) => {
        lectureMap[lecture.lectureId] = lecture;
      });
      setExerciseData({
        lectures: lectureMap,
        summary: response?.data?.summary || { totalRequired: 0, submitted: 0 },
      });
    } catch (error) {
      console.error("Failed to load exercises:", error);
    }
  }

  async function fetchCertificateStatusInfo() {
    if (!id) return;
    try {
      const response = await getCourseCertificateStatusService(id);
      if (response?.success) {
        setCertificateInfo(response?.data);
      }
    } catch (error) {
      console.error("Failed to load certificate status:", error);
    }
  }

  async function handleSubmitExercise() {
    if (!currentLecture?._id) {
      toast({
        title: "خطا",
        description: "ابتدا یک جلسه را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    if (!exerciseAnswer.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً پاسخ تمرین را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setSubmittingExercise(true);
    try {
      const response = await submitCourseExerciseService({
        courseId: id,
        lectureId: currentLecture._id,
        answer: exerciseAnswer,
        attachmentUrl: exerciseAttachment || undefined,
      });
      toast({
        title: t("common.success"),
        description:
          response?.message || "تمرین برای بررسی ارسال شد",
      });
      await fetchCourseExercises();
      await fetchCertificateStatusInfo();
    } catch (error) {
      console.error("Exercise submit failed:", error);
      toast({
        title: t("common.error"),
        description:
          error?.response?.data?.message ||
          "ثبت تمرین با خطا مواجه شد. دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSubmittingExercise(false);
    }
  }

  useEffect(() => {
    if (id && auth?.user?._id) {
      fetchCurrentCourseProgress();
      fetchCourseExercises();
      fetchCertificateStatusInfo();
    }
  }, [id, auth?.user?._id]);

  useEffect(() => {
    if (showConfetti) setTimeout(() => setShowConfetti(false), 15000);
  }, [showConfetti]);

  useEffect(() => {
    if (currentLecture?._id) {
      const currentExercise =
        exerciseData.lectures[currentLecture._id] || null;
      setExerciseAnswer(currentExercise?.submission?.answer || "");
      setExerciseAttachment(currentExercise?.submission?.attachmentUrl || "");
    } else {
      setExerciseAnswer("");
      setExerciseAttachment("");
    }
  }, [currentLecture?._id, exerciseData]);

  if (accessStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-lg font-semibold">{accessMessages.loading}</p>
      </div>
    );
  }

  if (accessStatus === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white gap-4 px-4">
        <h1 className="text-2xl font-bold">{accessMessages.denied}</h1>
        <p className="text-center text-sm text-gray-400">
          برای دسترسی به دوره باید ثبت‌نام یا خرید را کامل کنید.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/course/details/${id}`)}>
            بازگشت به صفحه دوره
          </Button>
          <Button variant="outline" onClick={() => navigate("/student-courses")}>
            دوره‌های من
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="m flex flex-col min-h-screen bg-black text-white">
      {showConfetti && <Confetti />}

      {/* U?O_O? */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-black border-b border-gray-800">
        <Button
          onClick={() => navigate("/student-courses")}
          variant="ghost"
          size="sm"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline ml-1">{t("student.backToCourses") || "My courses"}</span>
        </Button>
        <h1 className="text-sm sm:text-lg font-bold truncate px-4 max-w-full">
          {studentCurrentCourseProgress?.courseDetails?.title ||
            (t("student.loadingCourse") || "Loading course...")}
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 p-4 lg:p-6">
        <div className="flex-1 space-y-6">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            <VideoPlayer
              url={currentLecture?.videoUrl || ""}
              width="100%"
              height="100%"
              onProgress={handleVideoProgress}
              progressData={currentLecture}
              thumbnail={studentCurrentCourseProgress?.courseDetails?.image}
            />
          </div>
          {currentExercise && (
            <div className="rounded-3xl border border-gray-800 bg-[#07070d] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">
                    {t("student.exerciseTitle") || "Practice challenge"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("student.exerciseInstructions") ||
                      "Complete this exercise and submit your answer for review."}
                  </p>
                </div>
                {exerciseStatusLabel && (
                  <span
                    className={`text-xs font-semibold ${
                      exerciseStatusValue === "approved"
                        ? "text-emerald-400"
                        : exerciseStatusValue === "rejected"
                        ? "text-red-400"
                        : "text-amber-300"
                    }`}
                  >
                    {exerciseStatusLabel}
                  </span>
                )}
              </div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-gray-200">
                {currentExercise.exercisePrompt ||
                  t("student.exerciseInstructions") ||
                  ""}
              </div>
              {currentExercise.submission?.feedback && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                    {t("student.exerciseFeedbackLabel") || "Feedback"}
                  </p>
                  <p>{currentExercise.submission.feedback}</p>
                </div>
              )}
              <Textarea
                placeholder={
                  t("student.exerciseAnswerPlaceholder") ||
                  "Write your solution, notes, or include a link to your work."
                }
                value={exerciseAnswer}
                onChange={(e) => setExerciseAnswer(e.target.value)}
                className="bg-white/5 text-white"
              />
              <Input
                placeholder={
                  t("student.exerciseAttachmentPlaceholder") ||
                  "Optional link (GitHub, Google Drive, etc.)"
                }
                value={exerciseAttachment}
                onChange={(e) => setExerciseAttachment(e.target.value)}
                className="bg-white/5 text-white border-none"
              />
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {exerciseData.summary.submitted}/
                  {exerciseData.summary.totalRequired} تمرین ارسال‌شده
                </span>
                {currentExercise.submission?.attachmentUrl && (
                  <a
                    href={currentExercise.submission.attachmentUrl}
                    className="text-blue-400 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    مشاهده فایل
                  </a>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitExercise}
                  disabled={submittingExercise}
                  className="w-full sm:w-auto"
                >
                  {submittingExercise
                    ? t("common.loading") || "Loading..."
                    : t("student.exerciseSubmit") || "Submit exercise"}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-gray-800 bg-gradient-to-r from-slate-900/80 to-black/80 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-gray-400">
              <span>{t("student.coursePath") || "Course journey"}</span>
              <span>{completionPercent}% {t("student.completed") || "completed"}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-300">
              {journeySteps.map((step) => (
                <div
                  key={`${step.label}-${step.title}`}
                  className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 min-w-[140px]"
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-400">
                    {step.label}
                  </p>
                  <p className="text-sm font-semibold text-white truncate">
                    {step.title}
                  </p>
                  <span className="text-[0.6rem] text-emerald-300">
                    {step.status === "current"
                      ? t("student.currentLecture") || "Watching now"
                      : step.status === "upcoming"
                      ? t("student.upNext") || "Up next"
                      : t("student.completed") || "Completed"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {studentCurrentCourseProgress?.courseDetails?.title}
              </span>
              <span>
                {studentCurrentCourseProgress?.courseDetails?.instructorName}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6 flex flex-col">
          <div className="rounded-3xl border border-gray-800 bg-[#06060a] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-white">
                  {t("student.rateCourse") || "Rate this course"}
                </p>
                <p className="text-xs text-gray-400">
                  {t("student.rateHint") ||
                    "Share a quick rating and review to help others."}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {completionPercent}% {t("student.complete") || "complete"}
              </span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const value = idx + 1;
                const filled = ratingValue >= value;
                return (
                  <button
                    key={`star-${value}`}
                    type="button"
                    onClick={() => setRatingValue(value)}
                    className={`
                      p-2 rounded-full transition
                      ${filled ? "bg-amber-400/20 text-amber-400" : "bg-white/5 text-gray-500"}
                    `}
                    aria-label={`${value} ${t("student.stars") || "stars"}`}
                    disabled={isRatingDisabled}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400">{ratingHelper}</p>
            <Textarea
              placeholder={
                t("student.ratePlaceholder") ||
                "Tell us what worked well or where we can improve."
              }
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="bg-white/5 text-white"
              disabled={isRatingDisabled}
            />
            <Button
              onClick={handleSubmitRating}
              disabled={isRatingDisabled || ratingSubmitting}
              className="w-full"
            >
              {ratingSubmitting
                ? t("student.ratingSubmitting") || "Saving..."
                : ratingSubmitted
                ? t("student.ratingSubmitted") || "Rating saved"
                : t("student.submitRating") || "Submit rating"}
            </Button>
            {ratingSubmitted && (
              <p className="text-center text-emerald-400 text-sm">
                {t("student.thanksForRating") ||
                  "Thanks, your review keeps instructors motivated!"}
              </p>
            )}
            {!ratingSubmitted && !courseCompleted && (
              <p className="text-center text-xs text-gray-400">
                {t("student.completeCourseToRate") ||
                  "برای ثبت امتیاز باید دوره را کامل کنید."}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-gray-800 bg-[#06060a] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-white">
                گواهی دوره
              </p>
              <span className="text-xs uppercase text-gray-500">
                {certificateStatus}
              </span>
            </div>
            <p className="text-sm text-gray-300">{certificateStatusMessage}</p>
            {certificateInfo?.certificateCode &&
              certificateStatus === "approved" && (
                <p className="text-xs text-emerald-300">
                  کد مدرک:{" "}
                  <span className="font-semibold">
                    {certificateInfo.certificateCode}
                  </span>
                </p>
              )}
            {certificateInfo?.feedback && certificateStatus === "rejected" && (
              <p className="text-xs text-amber-200">
                {certificateInfo.feedback}
              </p>
            )}
            {exerciseData.summary.totalRequired > 0 && (
              <p className="text-xs text-gray-400">
                {exerciseData.summary.submitted}/
                {exerciseData.summary.totalRequired} تمرین ارسال‌شده
              </p>
            )}
          </div>

          <div className="w-full lg:flex-1 rounded-3xl border border-gray-800 bg-[#0f0f0f]">
            <Tabs defaultValue="content" className="m-3 h-full flex flex-col">
              <TabsList className=" grid grid-cols-2 w-full max-w-xs sm:max-w-sm mx-auto mb-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full p-1 shadow-lg">
                <TabsTrigger
                  value="content"
                  className="rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 hover:text-white"
                >
                  {t("student.allLectures") || "Course content"}
                </TabsTrigger>
                <TabsTrigger
                  value="overview"
                  className="rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 hover:text-white"
                >
                  {t("student.courseOverview") || "Course overview"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="flex-1">
                <ScrollArea className="h-full max-h-screen lg:h-screen">
                  <div className="p-4 space-y-2">
                    {studentCurrentCourseProgress?.courseDetails?.curriculum?.map(
                      (item, index) => {
                        const isViewed =
                          studentCurrentCourseProgress?.progress?.some(
                            (p) => p.lectureId === item._id && p.viewed
                          );
                        const isCurrent = currentLecture?._id === item._id;

                        return (
                          <div
                            key={item._id}
                            onClick={() => handleSelectLecture(item)}
                            className={`
                              flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all
                              ${
                                isCurrent
                                  ? "bg-blue-600/30 border border-blue-500"
                                  : "hover:bg-gray-800"
                              }
                            `}
                          >
                            {isViewed ? (
                              <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                            ) : (
                              <Play className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {index + 1}. {item.title}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="overview" className="flex-1">
                <ScrollArea className="h-full p-6">
                  <h3 className="text-lg font-bold mb-4">
                    {t("student.courseOverviewTitle") ||
                      "Course overview and goals"}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {studentCurrentCourseProgress?.courseDetails?.description}
                  </p>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={lockCourse} onOpenChange={setLockCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access restricted</DialogTitle>
            <DialogDescription>
              {t("student.purchaseToContinue") ||
                "Purchase this course to continue watching the lessons."}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate(`/course/details/${id}`)}>
            {t("student.goToCourse") || "Go to course page"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showCourseCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {t("student.congrats") || "Congratulations!"}
            </DialogTitle>
            <DialogDescription>
              {t("student.courseFinished") ||
                "You have successfully completed this course."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/student-courses")}
                className="w-full"
              >
                {t("student.myCourses") || "My courses"}
              </Button>
              <Button
                onClick={handleRewatchCourse}
                variant="outline"
                className="w-full"
              >
                {t("student.rewatchCourse") || "Rewatch course"}
              </Button>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {ratingSubmitted
                  ? t("student.ratingThanksDialog") ||
                    "Thanks again for sharing your feedback via the rating panel."
                  : t("student.ratePromptDialog") ||
                    "Head to the rating card on the right to share your experience."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseProgressPage;
