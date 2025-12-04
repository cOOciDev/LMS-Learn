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
} from "@/services";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, Play } from "lucide-react";
import { useContext, useEffect, useState } from "react";
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
  const { id } = useParams();

  // بقیه فانکشن‌ها بدون تغییر (fetch, progress, rating, etc)
  async function fetchCurrentCourseProgress() {
    if (!auth?.user?._id || !id) return;
    const response = await getCurrentCourseProgressService(auth?.user?._id, id);
    if (response?.success) {
      if (!response?.data?.isPurchased) {
        setLockCourse(true);
        return;
      }
      setStudentCurrentCourseProgress({
        courseDetails: response?.data?.courseDetails,
        progress: response?.data?.progress || [],
      });

      const curriculum = response?.data?.courseDetails?.curriculum || [];
      if (response?.data?.completed) {
        setCurrentLecture(curriculum[0] || null);
        setShowCourseCompleteDialog(true);
        setShowConfetti(true);
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
  }

  function handleSelectLecture(lecture) {
    if (lecture && !lockCourse) {
      setCurrentLecture(lecture);
    }
  }

  async function updateCourseProgress() {
    if (!currentLecture || lockCourse) return;
    const response = await markLectureAsViewedService(
      auth?.user?._id,
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
      auth?.user?._id,
      studentCurrentCourseProgress?.courseDetails?._id
    );
    if (response?.success) {
      setCurrentLecture(null);
      setShowConfetti(false);
      setShowCourseCompleteDialog(false);
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
        title: "خطا",
        description: "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setRatingSubmitting(false);
    }
  }

  useEffect(() => {
    if (id && auth?.user?._id) fetchCurrentCourseProgress();
  }, [id, auth?.user?._id]);

  useEffect(() => {
    if (showConfetti) setTimeout(() => setShowConfetti(false), 15000);
  }, [showConfetti]);

  return (
    <div className="m flex flex-col min-h-screen bg-black text-white">
      {showConfetti && <Confetti />}

      {/* هدر */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-black border-b border-gray-800">
        <Button
          onClick={() => navigate("/student-courses")}
          variant="ghost"
          size="sm"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline ml-1">دوره‌های من</span>
        </Button>
        <h1 className="text-sm sm:text-lg font-bold truncate px-4 max-w-full">
          {studentCurrentCourseProgress?.courseDetails?.title ||
            "در حال بارگذاری..."}
        </h1>
        <div className="w-10" /> {/* برای تعادل */}
      </header>

      {/* محتوای اصلی */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* ویدیو + عنوان */}
        <div className="mb-5">
          {/* ویدیو */}
          <div className="aspect-video bg-black">
            <VideoPlayer
              url={currentLecture?.videoUrl || ""}
              width="100%"
              height="100%"
              onProgress={handleVideoProgress}
              progressData={currentLecture}
              thumbnail={studentCurrentCourseProgress?.courseDetails?.image}
            />
          </div>

          {/* عنوان جلسه */}
          <div className="p-5 bg-[#0f0f0f] border-b border-gray-800">
            <h2 className="text-xl sm:text-2xl font-bold">
              {currentLecture?.title || "یک جلسه انتخاب کنید"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              مدرس:{" "}
              {studentCurrentCourseProgress?.courseDetails?.instructorName}
            </p>
          </div>
        </div>

        {/* سایدبار — در موبایل زیر ویدیو، در دسکتاپ کنار */}
        <div className="w-full lg:w-96 bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-gray-800">
          <Tabs defaultValue="content" className="m-3 h-full flex flex-col">
            <TabsList className=" grid grid-cols-2 w-full max-w-xs sm:max-w-sm mx-auto mb-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full rounded-full p-1 shadow-lg">
              <TabsTrigger
                value="content"
                className="rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 hover:text-white"
              >
                جلسات
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="rounded-full py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-400 hover:text-white"
              >
                درباره دوره
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
                <h3 className="text-lg font-bold mb-4">درباره این دوره</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {studentCurrentCourseProgress?.courseDetails?.description}
                </p>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* دیالوگ‌ها */}
      <Dialog open={lockCourse} onOpenChange={setLockCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دسترسی محدود</DialogTitle>
            <DialogDescription>
              برای تماشای این دوره ابتدا باید آن را خریداری کنید.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate(`/course/details/${id}`)}>
            رفتن به صفحه دوره
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showCourseCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">تبریک!</DialogTitle>
            <DialogDescription>
              شما این دوره را با موفقیت به پایان رساندید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/student-courses")}
                className="w-full"
              >
                دوره‌های من
              </Button>
              <Button
                onClick={handleRewatchCourse}
                variant="outline"
                className="w-full"
              >
                تماشای مجدد
              </Button>
            </div>
            {!ratingSubmitted && (
              <div className="space-y-4 border-t pt-4">
                <Label>امتیاز شما (۱-۵)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={ratingValue}
                  onChange={(e) =>
                    setRatingValue(Math.min(5, Math.max(1, +e.target.value)))
                  }
                />
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="نظر خود را بنویسید (اختیاری)"
                  className="min-h-24"
                />
                <Button
                  onClick={handleSubmitRating}
                  disabled={ratingSubmitting}
                  className="w-full"
                >
                  {ratingSubmitting ? "در حال ارسال..." : "ارسال نظر"}
                </Button>
              </div>
            )}
            {ratingSubmitted && (
              <p className="text-center text-green-500 font-bold text-lg">
                ممنون از نظر شما!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseProgressPage;
