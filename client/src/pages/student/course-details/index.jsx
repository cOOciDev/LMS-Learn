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
import { StudentContext } from "@/context/student-context";
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

const MESSAGES = {
  invalidId: "شناسه دوره معتبر نیست. لطفاً از لیست دوره‌ها وارد شوید.",
  notFound: "دوره پیدا نشد.",
  fetchError: "خطا در دریافت اطلاعات دوره. لطفاً دوباره تلاش کنید.",
  retry: "تلاش مجدد",
  backToCourses: "بازگشت به لیست دوره‌ها",
  loading: "در حال بارگذاری اطلاعات دوره...",
};

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [pageError, setPageError] = useState("");

  const notifyError = (description) =>
    toast({ title: "خطا", description, variant: "destructive" });

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
  const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState(null);

  // بخش جدید: دوره‌های دیگر همین استاد
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loadingInstructorCourses, setLoadingInstructorCourses] = useState(false);

  // تابع لود دوره‌های مدرس با تأخیر (برای سرعت بیشتر صفحه)
  const fetchInstructorOtherCourses = useCallback(async () => {
    // اگه هنوز دوره اصلی لود نشده، هیچ کاری نکن
    if (!studentViewCourseDetails?._id) {
      setInstructorCourses([]);
      setLoadingInstructorCourses(false);
      return;
    }

    // اگه آیدی دوره عوض شده، صبر کن تا داده جدید بیاد
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
      console.error("خطا در لود دوره‌های مدرس:", err);
    } finally {
      setLoadingInstructorCourses(false);
    }
  }, [studentViewCourseDetails, currentCourseDetailsId]);
  // هماهنگ‌سازی شناسه دوره
  useEffect(() => {
    if (!id) {
      setPageError(MESSAGES.invalidId);
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

  // فقط وقتی دوره اصلی کامل لود شد، دوره‌های مدرس رو بگیر
  useEffect(() => {
    if (studentViewCourseDetails?._id && !loadingState) {
      fetchInstructorOtherCourses();
    }
  }, [studentViewCourseDetails?._id, loadingState, fetchInstructorOtherCourses]);

  // بقیه توابع اصلی
  async function fetchStudentViewCourseDetails() {
    if (!currentCourseDetailsId) {
      setPageError(MESSAGES.invalidId);
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
        setPageError(MESSAGES.notFound);
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
      setPageError(MESSAGES.fetchError);
    } finally {
      setLoadingState(false);
    }
  }
  const handleSetFreePreview = (item) => {
    setDisplayCurrentVideoFreePreview(normalizePreviewUrl(item?.videoUrl));
  };

  const handleCreatePayment = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const studentId = auth?.user?._id || auth?.user?.id;
    if (!studentId) {
      notifyError("شناسه کاربر معتبر نیست.");
      return;
    }
    const courseId = studentViewCourseDetails?._id || studentViewCourseDetails?.id;
    if (!courseId) {
      notifyError("شناسه دوره معتبر نیست.");
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
        notifyError(res?.message || "در پردازش ثبت‌نام مشکلی پیش آمد.");
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
        const { error } = await stripe.redirectToCheckout({ sessionId: res.data.sessionId });
        if (error) console.error(error);
      }
    } catch (error) {
      notifyError(
        error?.response?.data?.message ||
          "در ثبت‌نام دوره مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
      );
    }
  };

  useEffect(() => {
    if (displayCurrentVideoFreePreview !== null) setShowFreePreviewDialog(true);
  }, [displayCurrentVideoFreePreview]);

  useEffect(() => {
    if (currentCourseDetailsId !== null) fetchStudentViewCourseDetails();
  }, [currentCourseDetailsId, auth?.user?._id]);

  useEffect(() => {
    if (id) setCurrentCourseDetailsId(id);
  }, [id]);

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
          شناسه دوره معتبر نیست.
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          لطفاً از لیست دوره‌ها وارد شوید.
        </p>
        <Button onClick={() => navigate("/courses")} size="lg">
          بازگشت به لیست دوره‌ها
        </Button>
      </div>
    );
  }

  if (pageError && !studentViewCourseDetails) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h3 className="mb-4 text-3xl font-bold text-red-600">{pageError}</h3>
        <Button onClick={fetchStudentViewCourseDetails} size="lg">
          تلاش مجدد
        </Button>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => navigate("/courses")}
        >
          بازگشت به لیست دوره‌ها
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
  const priceLabel = isFreeCourse
    ? "رایگان"
    : `${formattedPrice.toLocaleString("fa-IR")} تومان`;
  const actionLabel = isEnrolled
    ? "ادامه دوره"
    : isFreeCourse
    ? "ثبت‌نام رایگان"
    : "خرید دوره";
  const previewLecture =
    firstFreePreviewIndex !== -1
      ? studentViewCourseDetails.curriculum[firstFreePreviewIndex]
      : studentViewCourseDetails?.curriculum?.[0] || null;
  const previewVideoUrl = normalizePreviewUrl(previewLecture?.videoUrl);
  const dialogPreviewUrl = normalizePreviewUrl(
    displayCurrentVideoFreePreview || previewLecture?.videoUrl
  );

  return (
    <div className="mx-auto max-w-7xl p-4">
      {/* هدر دوره */}
      <div className="rounded-t-lg bg-white p-8 shadow dark:bg-gray-900">
        <h1 className="mb-4 text-3xl font-bold">{studentViewCourseDetails?.title}</h1>
        <p className="mb-4 text-xl">{studentViewCourseDetails?.subtitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span>مدرس: <span className="font-semibold">{studentViewCourseDetails?.instructorName}</span></span>
          <span className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            {studentViewCourseDetails?.primaryLanguage}
          </span>
          <span>{studentViewCourseDetails?.students?.length || 0} دانشجو</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <main className="flex-grow">
          <Card className="mb-8">
            <CardHeader><CardTitle>چه چیزی یاد می‌گیرید</CardTitle></CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(Array.isArray(studentViewCourseDetails?.objectives)
                  ? studentViewCourseDetails.objectives
                  : (studentViewCourseDetails?.objectives || "").split(",").filter(Boolean)
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
            <CardHeader><CardTitle>توضیحات دوره</CardTitle></CardHeader>
            <CardContent className="prose dark:prose-invert">
              {studentViewCourseDetails?.description}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader><CardTitle>برنامه درسی</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {studentViewCourseDetails?.curriculum?.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center ${item.freePreview ? "cursor-pointer hover:text-blue-600" : "text-gray-500"}`}
                    onClick={() => item.freePreview && handleSetFreePreview(item)}
                  >
                    {item.freePreview ? <PlayCircle className="ml-3 h-5 w-5" /> : <Lock className="ml-3 h-5 w-5" />}
                    <span className="text-lg">{item.title}</span>
                    {item.freePreview && <span className="mr-auto text-sm text-green-600">پیش‌نمایش</span>}
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
            {previewVideoUrl ? (
              <video
                controls
                className="h-full w-full object-cover"
                src={previewVideoUrl}
              >
                <source src={previewVideoUrl} type="video/mp4" />
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                ویدیوی پیش‌نمایش موجود نیست.
              </div>
            )}
          </div>
              <div className="mt-6 text-3xl font-bold">{priceLabel}</div>
              <Button type="button" onClick={(e) => handleCreatePayment(e)} className="mt-4 w-full" size="lg">
                {actionLabel}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* دیالوگ پیش‌نمایش */}
      <Dialog open={showFreePreviewDialog} onOpenChange={(open) => !open && setShowFreePreviewDialog(false) && setDisplayCurrentVideoFreePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>پیش‌نمایش دوره</DialogTitle></DialogHeader>
          <div className="aspect-video bg-black">
            {dialogPreviewUrl ? (
              <video
                controls
                className="h-full w-full object-cover"
                src={dialogPreviewUrl}
              >
                <source src={dialogPreviewUrl} type="video/mp4" />
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                ویدیوی پیش‌نمایش موجود نیست.
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

      {/* بخش نهایی: دوره‌های بیشتر از این استاد – همیشه نمایش داده میشه */}
      <div className="mt-20">
        <h2 className="mb-10 text-3xl font-bold text-center md:text-right">
          دوره‌های بیشتر از استاد {studentViewCourseDetails?.instructorName || "در حال بارگذاری..."}
        </h2>

        {/* کل بخش با transition نرم */}
        <div className="min-h-96 transition-all duration-700 ease-in-out">
          {loadingInstructorCourses ? (
            // اسکلتون نرم و بدون چشمک
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
            // دوره‌ها با انیمیشن fade-in
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
                      <div className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white">رایگان</div>
                    ) : (
                      <div className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-sm font-bold text-white">${course.pricing}</div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{course.instructorName}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{course.curriculum?.length || 0} درس</span>
                      <span>{course.students?.length || 0} دانشجو</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // پیام فان بدون چشمک‌نزن!
            <div className="py-24 text-center">
              <div className="mx-auto max-w-lg">
                <div className="mb-8 text-8xl">جستجو کردن</div>
                <h3 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                  استاد {studentViewCourseDetails?.instructorName} فعلاً فقط همین یک شاهکار رو داره!
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  ولی داره تو زیرزمین شبانه‌روز کد می‌زنه
                  <br />
                  <span className="mt-4 inline-block text-3xl text-blue-600">به زودی دوره جدید میاد، قول!</span>
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
