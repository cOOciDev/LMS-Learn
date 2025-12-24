// client/src/pages/student/course-details/index.jsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { StudentContext } from "@/context/student-context";
import { withAuthToken } from "@/utils/media";
import {
  checkCoursePurchaseInfoService,
  createPaymentService,
  fetchStudentBoughtCoursesService,
  fetchStudentViewCourseDetailsService,
  fetchStudentViewCourseListService,
} from "@/services";
import { CheckCircle, Globe, Lock, PlayCircle } from "lucide-react";
import { useContext, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js"; 
import { useToast } from "@/hooks/use-toast";
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const normalizeCourseFromResponse = (responseData, courseId) => {
  if (!responseData) return null;

  const root = responseData;
  const dataBlock = root?.data ?? root;

  const pickFromArray = (list) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const matched = list.find(
      (item) => item?._id === courseId || item?.id === courseId
    );
    return matched || list[0];
  };

  if (Array.isArray(dataBlock)) return pickFromArray(dataBlock);
  if (Array.isArray(dataBlock?.courses))
    return pickFromArray(dataBlock.courses);
  if (Array.isArray(dataBlock?.data)) return pickFromArray(dataBlock.data);
  if (Array.isArray(dataBlock?.myCourses))
    return pickFromArray(dataBlock.myCourses);
  if (dataBlock?._id || dataBlock?.id) return dataBlock;
  if (dataBlock?.course) return dataBlock.course;

  return null;
};

const normalizePreviewUrl = (value) => {
  if (!value) return "";
  return value.startsWith("http://") ? value.replace(/^http:/, "https:") : value;
};

const normalizeCourseListPayload = (responseData) => {
  const root = responseData;
  const dataBlock = root?.data ?? root;

  if (Array.isArray(dataBlock)) return dataBlock;
  if (Array.isArray(dataBlock?.courses)) return dataBlock.courses;
  if (Array.isArray(dataBlock?.myCourses)) return dataBlock.myCourses;
  if (Array.isArray(dataBlock?.data)) return dataBlock.data;

  return [];
};

function StudentViewCourseDetailsPage() {
  const {
    studentViewCourseDetails,
    setStudentViewCourseDetails,
    currentCourseDetailsId,
    setCurrentCourseDetailsId,
    loadingState,
    setLoadingState,
    setStudentBoughtCoursesList,
  } = useContext(StudentContext);

  const { auth } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [pageError, setPageError] = useState("");

  const messages = {
    invalidId:
      t("courseDetails.invalidId") ||
      "Invalid course id. Please select a course from the list.",
    notFound: t("courseDetails.notFound") || "Course not found.",
    fetchError:
      t("courseDetails.fetchError") ||
      "Error fetching course details. Please try again.",
    retry: t("courseDetails.retry") || "Retry",
    backToCourses: t("courseDetails.backToCourses") || "Back to courses",
    loading: t("courseDetails.loading") || "Loading course details...",
  };

  const notifyError = (description) =>
    toast({ title: t("common.error") || "Error", description, variant: "destructive" });
  const refreshStudentCourses = async () => {
    if (!auth?.user?._id) return;
    try {
      const response = await fetchStudentBoughtCoursesService();
      const normalized = normalizeCourseListPayload(response);
      setStudentBoughtCoursesList(normalized);
    } catch (refreshError) {
      console.error("Failed to refresh student courses:", refreshError);
    }
  };

  const [displayCurrentVideoFreePreview, setDisplayCurrentVideoFreePreview] = useState(null);
  const [selectedPreviewLecture, setSelectedPreviewLecture] = useState(null);
  const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState(null);

  // ╪¿╪«╪┤ ╪¼╪»█î╪»: ╪»┘ê╪▒┘çΓÇî┘ç╪º█î ╪»█î┌»╪▒ ┘ç┘à█î┘å ╪º╪│╪¬╪º╪»
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loadingInstructorCourses, setLoadingInstructorCourses] = useState(false);

  // ╪¬╪º╪¿╪╣ ┘ä┘ê╪» ╪»┘ê╪▒┘çΓÇî┘ç╪º█î ┘à╪»╪▒╪│ ╪¿╪º ╪¬╪ú╪«█î╪▒ (╪¿╪▒╪º█î ╪│╪▒╪╣╪¬ ╪¿█î╪┤╪¬╪▒ ╪╡┘ü╪¡┘ç)
  const fetchInstructorOtherCourses = useCallback(async () => {
    // ╪º┌»┘ç ┘ç┘å┘ê╪▓ ╪»┘ê╪▒┘ç ╪º╪╡┘ä█î ┘ä┘ê╪» ┘å╪┤╪»┘ç╪î ┘ç█î┌å ┌⌐╪º╪▒█î ┘å┌⌐┘å
    if (!studentViewCourseDetails?._id) {
      setInstructorCourses([]);
      setLoadingInstructorCourses(false);
      return;
    }

    // ╪º┌»┘ç ╪ó█î╪»█î ╪»┘ê╪▒┘ç ╪╣┘ê╪╢ ╪┤╪»┘ç╪î ╪╡╪¿╪▒ ┌⌐┘å ╪¬╪º ╪»╪º╪»┘ç ╪¼╪»█î╪» ╪¿█î╪º╪»
    if (studentViewCourseDetails._id !== currentCourseDetailsId && currentCourseDetailsId) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    setLoadingInstructorCourses(true);

    try {
      const response = await fetchStudentViewCourseListService();

      if (response?.success && Array.isArray(response.data?.courses)) {
        const currentId = studentViewCourseDetails.instructorId;
        const currentName = studentViewCourseDetails.instructorName;

        const filtered = response.data.courses
          .filter(course => {
            const sameId = currentId && (
              course.instructorId === currentId ||
              course.instructor?._id === currentId
            );
            const sameName = course.instructorName === currentName;
            return (sameId || sameName) && course._id !== studentViewCourseDetails._id;
          })
          .slice(0, 8);

        setInstructorCourses(filtered);
      }
    } catch (err) {
      console.error("Failed to load instructor courses:", err);
    } finally {
      setLoadingInstructorCourses(false);
    }
  }, [studentViewCourseDetails, currentCourseDetailsId]);

  async function fetchStudentViewCourseDetails() {
    if (!currentCourseDetailsId) {
      setPageError(messages.invalidId);
      setLoadingState(false);
      setStudentViewCourseDetails(null);
      return;
    }

    setLoadingState(true);
    try {
      if (auth?.user?._id) {
        const checkResponse = await checkCoursePurchaseInfoService(
          currentCourseDetailsId
        );
        if (checkResponse?.success) setPurchaseInfo(checkResponse.data);
        else setPurchaseInfo(null);
      }

      const response = await fetchStudentViewCourseDetailsService(
        currentCourseDetailsId
      );
      const normalizedCourse = normalizeCourseFromResponse(
        response,
        currentCourseDetailsId
      );

      if (!normalizedCourse) {
        setPageError(messages.notFound);
        setStudentViewCourseDetails(null);
      } else {
        setStudentViewCourseDetails(normalizedCourse);
        setPageError("");
      }

      setPurchaseInfo((prev) => ({
        ...(prev || {}),
        enrollment: response?.data?.enrollment || response?.enrollment,
      }));
    } catch (err) {
      console.error(
        "Course details fetch failed:",
        err?.response?.status ?? err?.message,
        err?.response?.data
      );
      setPageError(messages.fetchError);
    } finally {
      setLoadingState(false);
    }
  }

  const handleCreatePayment = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const studentId = auth?.user?._id || auth?.user?.id;
    if (!studentId) {
      notifyError(t("courseDetails.invalidUser") || "Invalid user id.");
      return;
    }
    const courseId =
      studentViewCourseDetails?._id || studentViewCourseDetails?.id;
    if (!courseId) {
      notifyError(t("courseDetails.invalidCourse") || "Invalid course id.");
      return;
    }

    if (purchaseInfo?.isEnrolled) {
      navigate(`/course-progress/${courseId}`);
      return;
    }

    if (!auth?.authenticate) {
      navigate("/auth");
      return;
    }

    const payload = {
      userId: auth.user._id,
      userName: auth.user.userName,
      userEmail: auth.user.userEmail,
      orderStatus: "pending",
      paymentMethod: "stripe",
      paymentStatus: "initiated",
      orderDate: new Date(),
      instructorId: studentViewCourseDetails.instructorId,
      instructorName: studentViewCourseDetails.instructorName,
      courseImage: studentViewCourseDetails.image,
      courseTitle: studentViewCourseDetails.title,
      courseId,
      coursePricing: studentViewCourseDetails.pricing,
    };

    try {
      const res = await createPaymentService(payload);
      if (!res?.success) {
        notifyError(
          res?.message ||
            t("courseDetails.enrollError") ||
            "An error occurred while processing enrollment."
        );
        return;
      }

      if (res.data?.freeEnrollment) {
        await refreshStudentCourses();
        navigate(`/course-progress/${courseId}`);
        return;
      }

      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }

      if (stripePromise && res.data?.sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: res.data.sessionId,
        });
        if (error) console.error(error);
      }
    } catch (error) {
      notifyError(
        error?.response?.data?.message ||
          t("courseDetails.enrollError") ||
          "An error occurred while processing enrollment. Please try again."
      );
    }
  };
  // ┘ç┘à╪º┘ç┘å┌»ΓÇî╪│╪º╪▓█î ╪┤┘å╪º╪│┘ç ╪»┘ê╪▒┘ç
  useEffect(() => {
    if (!id) {
      setPageError(messages.invalidId);
      setLoadingState(false);
      setStudentViewCourseDetails(null);
      setCurrentCourseDetailsId(null);
      setInstructorCourses([]);
      setPurchaseInfo(null);
      return;
    }

    setPageError("");
    setCurrentCourseDetailsId(id);
  }, [id]);

  useEffect(() => {
    if (studentViewCourseDetails?._id && !loadingState) {
      fetchInstructorOtherCourses();
    }
  }, [studentViewCourseDetails?._id, loadingState, fetchInstructorOtherCourses]);

  useEffect(() => {
    if (currentCourseDetailsId !== null) fetchStudentViewCourseDetails();
  }, [currentCourseDetailsId, auth?.user?._id]);

  useEffect(() => {
    if (!location.pathname.includes("course/details")) {
      setStudentViewCourseDetails(null);
      setCurrentCourseDetailsId(null);
    }
  }, [location.pathname]);

  if (loadingState) return <Skeleton className="h-screen w-full" />;

  if (!id) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h3 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {messages.invalidId}
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          {messages.backToCourses}
        </p>
        <Button onClick={() => navigate("/courses")} size="lg">
          {messages.backToCourses}
        </Button>
      </div>
    );
  }

  if (pageError && !studentViewCourseDetails) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h3 className="mb-4 text-3xl font-bold text-red-600">{pageError}</h3>
        <Button onClick={fetchStudentViewCourseDetails} size="lg">
          {messages.retry}
        </Button>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => navigate("/courses")}
        >
          {messages.backToCourses}
        </Button>
      </div>
    );
  }

  const firstFreePreviewIndex =
    studentViewCourseDetails?.curriculum?.findIndex((item) => item.freePreview) ?? -1;
  const isFreeCourse = Number(studentViewCourseDetails?.pricing) <= 0;
  const isEnrolled =
    purchaseInfo?.isEnrolled || purchaseInfo?.enrollment?.isEnrolled;
  const formattedPrice = Number(studentViewCourseDetails?.pricing || 0);
  const priceLocale = language === "fa" ? "fa-IR" : "en-US";
  const priceLabel = isFreeCourse
    ? t("common.free") || "Free"
    : `${formattedPrice.toLocaleString(priceLocale)} ${
        t("common.currency") || "Toman"
      }`;
  const actionLabel = isEnrolled
    ? t("courseDetails.continueCourse") || "Continue course"
    : isFreeCourse
    ? t("courseDetails.freeEnroll") || "Enroll for free"
    : t("courseDetails.buyCourse") || "Buy course";
  const previewLecture =
    firstFreePreviewIndex !== -1
      ? studentViewCourseDetails.curriculum[firstFreePreviewIndex]
      : studentViewCourseDetails?.curriculum?.[0] || null;
  const activePreviewLecture = selectedPreviewLecture || previewLecture;
  const previewVideoUrl = normalizePreviewUrl(activePreviewLecture?.videoUrl);
  const dialogPreviewUrl = normalizePreviewUrl(
    displayCurrentVideoFreePreview || activePreviewLecture?.videoUrl
  );
  const resolvedPreviewUrl = withAuthToken(previewVideoUrl);
  const resolvedDialogUrl = withAuthToken(dialogPreviewUrl);
  return (
    <div className="mx-auto max-w-7xl p-4">
      {/* ┘ç╪»╪▒ ╪»┘ê╪▒┘ç */}
      <div className="rounded-t-lg bg-white p-8 shadow dark:bg-gray-900">
        <h1 className="mb-4 text-3xl font-bold">{studentViewCourseDetails?.title}</h1>
        <p className="mb-4 text-xl">{studentViewCourseDetails?.subtitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span>
            {t("course.instructor") || "Instructor"}: {" "}
            <span className="font-semibold">
              {studentViewCourseDetails?.instructorName}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            {studentViewCourseDetails?.primaryLanguage}
          </span>
          <span>
            {studentViewCourseDetails?.students?.length || 0} {" "}
            {t("course.students") || "Students"}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <main className="flex-grow">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {t("course.whatYouWillLearn") || "What you will learn"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(Array.isArray(studentViewCourseDetails?.objectives)
                  ? studentViewCourseDetails.objectives
                  : (studentViewCourseDetails?.objectives || "")
                      .split(",")
                      .filter(Boolean)
                ).map((obj, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="mr-3">{obj.trim()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {t("courseDetails.descriptionTitle") || "Course description"}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert">
              {studentViewCourseDetails?.description}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("course.curriculum") || "Curriculum"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {studentViewCourseDetails?.curriculum?.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center ${item.freePreview ? "cursor-pointer hover:text-blue-600" : "text-gray-500"}`}
                    onClick={() => item.freePreview && handleSetFreePreview(item)}
                  >
                    {item.freePreview ? (
                      <PlayCircle className="ml-3 h-5 w-5" />
                    ) : (
                      <Lock className="ml-3 h-5 w-5" />
                    )}
                    <span className="text-lg">{item.title}</span>
                    {item.attachmentUrl && (
                      <span className="mr-3 text-xs text-blue-600">
                        {t("course.hasAttachment") || "PDF attached"}
                      </span>
                    )}
                    {item.freePreview && (
                      <span className="mr-auto text-sm text-green-600">
                        {t("courseDetails.freePreview") || "Free preview"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </main>

        <aside className="w-full md:w-96">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="aspect-video overflow-hidden rounded-lg bg-black">
                {resolvedPreviewUrl ? (
                  <video
                    controls
                    className="h-full w-full object-cover"
                    src={resolvedPreviewUrl}
                  >
                    <source src={resolvedPreviewUrl} type="video/mp4" />
                    {t("courseDetails.videoNotSupported") ||
                      "Your browser does not support the video tag."}
                  </video>
                ) : activePreviewLecture?.attachmentUrl ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    <a
                      className="text-blue-500 hover:underline"
                      href={withAuthToken(activePreviewLecture.attachmentUrl, { download: true })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("course.downloadAttachment") || "Download lesson file"}
                    </a>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {t("course.noVideo") || "No video for this lesson."}
                  </div>
                )}
              </div>
              <div className="mt-6 text-3xl font-bold">{priceLabel}</div>
              <Button
                type="button"
                onClick={(e) => handleCreatePayment(e)}
                className="mt-4 w-full"
                size="lg"
              >
                {actionLabel}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ╪»█î╪º┘ä┘ê┌» ┘╛█î╪┤ΓÇî┘å┘à╪º█î╪┤ */}
      <Dialog
        open={showFreePreviewDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowFreePreviewDialog(false);
            setDisplayCurrentVideoFreePreview(null);
            setSelectedPreviewLecture(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t("courseDetails.previewTitle") || "Course preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black">
            {resolvedDialogUrl ? (
              <video
                controls
                className="h-full w-full object-cover"
                src={resolvedDialogUrl}
              >
                <source src={resolvedDialogUrl} type="video/mp4" />
                {t("courseDetails.videoNotSupported") ||
                  "Your browser does not support the video tag."}
              </video>
            ) : activePreviewLecture?.attachmentUrl ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <a
                  className="text-blue-500 hover:underline"
                  href={withAuthToken(activePreviewLecture.attachmentUrl, { download: true })}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("course.downloadAttachment") || "Download lesson file"}
                </a>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("course.noVideo") || "No video for this lesson."}
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {studentViewCourseDetails?.curriculum?.filter((i) => i.freePreview).map((item, i) => (
              <p
                key={i}
                className="cursor-pointer font-medium hover:text-blue-600"
                onClick={() => handleSetFreePreview(item)}
              >
                {item.title}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ╪¿╪«╪┤ ┘å┘ç╪º█î█î: ╪»┘ê╪▒┘çΓÇî┘ç╪º█î ╪¿█î╪┤╪¬╪▒ ╪º╪▓ ╪º█î┘å ╪º╪│╪¬╪º╪» ΓÇô ┘ç┘à█î╪┤┘ç ┘å┘à╪º█î╪┤ ╪»╪º╪»┘ç ┘à█î╪┤┘ç */}
      <div className="mt-20">
        <h2 className="mb-10 text-3xl font-bold text-center md:text-right">{t("courseDetails.moreFromInstructor", { name: studentViewCourseDetails?.instructorName || "" }) || `More from ${studentViewCourseDetails?.instructorName || ""}`}</h2>

        {/* ┌⌐┘ä ╪¿╪«╪┤ ╪¿╪º transition ┘å╪▒┘à */}
        <div className="min-h-96 transition-all duration-700 ease-in-out">
          {loadingInstructorCourses ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden rounded-xl shadow-lg">
                  <div className="aspect-video animate-pulse bg-gray-200 dark:bg-gray-800" />
                  <CardContent className="p-5 space-y-3">
                    <div className="h-6 w-4/5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : instructorCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fadeIn">
              {instructorCourses.map((course, index) => (
                <Card
                  key={course._id}
                  className="group cursor-pointer overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-2xl border"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/course/details/${course._id}`)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.image || "/placeholder.jpg"}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                    />
                    {Number(course.pricing) <= 0 ? (
                      <div className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white">
                        {t("common.free") || "Free"}
                      </div>
                    ) : (
                      <div className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-sm font-bold text-white">
                        ${course.pricing}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {course.instructorName}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {course.curriculum?.length || 0} {t("course.lectures") || "Lectures"}
                      </span>
                      <span>
                        {course.students?.length || 0} {t("course.students") || "Students"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="mx-auto max-w-lg">
                <div className="mb-8 text-8xl">
                  {t("courseDetails.emptyEmoji") || "Search"}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {t("courseDetails.emptyTitle", {
                    name: studentViewCourseDetails?.instructorName || "",
                  }) ||
                    `Instructor ${studentViewCourseDetails?.instructorName || ""} only has this course right now!`}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("courseDetails.emptyDescription") ||
                    "But there might be more coming soon."}
                  <br />
                  <span className="mt-4 inline-block text-3xl text-blue-600">
                    {t("courseDetails.emptyPromise") ||
                      "A new course is coming soon!"}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentViewCourseDetailsPage;
































