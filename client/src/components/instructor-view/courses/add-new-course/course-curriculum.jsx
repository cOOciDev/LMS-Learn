// client/src/components/instructor-view/courses/add-new-course/course-curriculum.jsx

import MediaProgressbar from "@/components/media-progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import VideoPlayer from "@/components/video-player";
import { useLanguage } from "@/context/language-context";
import { InstructorContext } from "@/context/instructor-context";
import { mediaBulkUploadService, mediaDeleteService } from "@/services";
import {
  Upload,
  UploadCloud,
  Trash2,
  Replace,
  Plus,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { useContext, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function CourseCurriculum({ onNext }) {
  const {
    courseCurriculumFormData,
    setCourseCurriculumFormData,
    mediaUploadProgress,
    setMediaUploadProgress,
    mediaUploadProgressPercentage,
    setMediaUploadProgressPercentage,
  } = useContext(InstructorContext);

  const { t, language } = useLanguage();
  const isRTL = language === "fa";
  const { toast } = useToast();

  const bulkUploadRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const { courseLandingFormData } = useContext(InstructorContext);
  const isCurriculumValid = () => {
    if (courseCurriculumFormData.length === 0) return false;
    return courseCurriculumFormData.every(
      (lecture) =>
        lecture.title?.trim() && lecture.videoUrl && lecture.public_id
    );
  };

  const handleSaveAndContinue = () => {
    if (!isCurriculumValid()) {
      toast({
        title: isRTL ? "برنامه درسی ناتمام است" : "Curriculum Incomplete",
        description: isRTL
          ? "لطفاً عنوان و ویدیو را برای تمام جلسات وارد کنید."
          : "Please add a title and video for all lectures.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isRTL
        ? "عالی! همه چیز کامل است"
        : "Great! All lectures are complete",
      description: isRTL
        ? "در حال انتقال به تنظیمات..."
        : "Moving to settings...",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    onNext?.();
  };

  const processVideoFiles = async (files, replaceIndex = null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("video/")
    );
    if (validFiles.length === 0) {
      toast({
        title: t("common.error") || "خطا",
        description:
          t("curriculum.invalidVideo") || "فقط فایل ویدیویی مجاز است",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    validFiles.forEach((f) => formData.append("files", f));

    setMediaUploadProgress(true);
    setMediaUploadProgressPercentage(0);

    try {
      const response = await mediaBulkUploadService(
        formData,
        setMediaUploadProgressPercentage
      );
      if (response?.success) {
        const newLectures = response.data.map((item, i) => ({
          title:
            replaceIndex !== null
              ? courseCurriculumFormData[replaceIndex]?.title ||
                `${t("curriculum.lecture") || "Lecture"} ${replaceIndex + 1}`
              : `${t("curriculum.lecture") || "Lecture"} ${
                  courseCurriculumFormData.length + i + 1
                }`,
          videoUrl: item.url,
          public_id: item.public_id,
          freePreview:
            replaceIndex !== null
              ? courseCurriculumFormData[replaceIndex]?.freePreview
              : false,
        }));

        setCourseCurriculumFormData((prev) =>
          replaceIndex !== null
            ? prev.map((l, idx) => (idx === replaceIndex ? newLectures[0] : l))
            : [...prev, ...newLectures]
        );

        setMediaUploadProgress(false);
        setMediaUploadProgressPercentage(0);
        toast({
          title: t("common.success") || "موفق",
          description: `${validFiles.length} ${
            t("curriculum.videosUploaded") || "ویدیو آپلود شد"
          }`,
        });
      }
    } catch (err) {
      toast({
        title: t("common.error"),
        description: t("curriculum.uploadFailed"),
        variant: "destructive",
      });
      setMediaUploadProgress(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processVideoFiles(e.dataTransfer.files);
  };

  const handleTitleChange = (value, i) => {
    setCourseCurriculumFormData((prev) => {
      const updated = [...prev];
      updated[i].title = value;
      return updated;
    });
  };

  const handleFreePreview = (checked, i) => {
    setCourseCurriculumFormData((prev) => {
      const updated = [...prev];
      updated[i].freePreview = checked;
      return updated;
    });
  };

  const handleReplace = async (i) => {
    const publicId = courseCurriculumFormData[i]?.public_id;
    if (publicId) await mediaDeleteService(publicId);
    document.getElementById(`replace-${i}`).click();
  };

  const handleDelete = async (i) => {
    const publicId = courseCurriculumFormData[i]?.public_id;
    if (publicId) await mediaDeleteService(publicId);
    setCourseCurriculumFormData((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addLecture = () => {
    setCourseCurriculumFormData((prev) => [
      ...prev,
      {
        title: "",
        videoUrl: "",
        public_id: "",
        freePreview: false,
      },
    ]);
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl font-bold text-foreground">
            {t("curriculum.title")}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              ref={bulkUploadRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => processVideoFiles(e.target.files)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkUploadRef.current?.click()}
            >
              <Upload className="h-4 w-4 ml-1" /> {t("curriculum.bulkUpload")}
            </Button>
            <Button size="sm" onClick={addLecture}>
              <Plus className="h-4 w-4 ml-1" /> {t("curriculum.addLecture")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {mediaUploadProgress && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {t("curriculum.uploading")}
            </Label>
            <MediaProgressbar
              isMediaUploading={mediaUploadProgress}
              progress={mediaUploadProgressPercentage}
            />
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
            dragOver
              ? "border-blue-500 bg-blue-500/10"
              : "border-border bg-muted/50"
          }`}
        >
          <div className="hidden sm:block">
            <UploadCloud
              className={`h-12 w-12 mx-auto mb-4 ${
                dragOver
                  ? "text-blue-500 animate-bounce"
                  : "text-muted-foreground"
              }`}
            />
            <p className="font-medium text-foreground">
              {t("curriculum.dragDropVideos")}
            </p>
          </div>
          <div className="sm:hidden">
            <Button
              onClick={() => bulkUploadRef.current?.click()}
              className="w-full max-w-xs"
            >
              <Upload className="h-5 w-5 ml-2" />{" "}
              {t("curriculum.selectFromGallery")}
            </Button>
          </div>
        </div>

        {courseCurriculumFormData.length === 0 && (
          <div className="text-center py-16 bg-muted rounded-xl border-2 border-dashed border-border">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {t("curriculum.noLectures")}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {courseCurriculumFormData.map((lecture, i) => (
            <div
              key={i}
              className="border border-border rounded-xl overflow-hidden bg-card shadow-md"
            >
              <div className="bg-muted/50 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold text-foreground">
                    {t("curriculum.lecture")} {i + 1}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <Label className="text-foreground">
                    {t("curriculum.lectureTitle")}
                  </Label>
                  <Input
                    value={lecture.title}
                    onChange={(e) => handleTitleChange(e.target.value, i)}
                    placeholder={t("curriculum.titlePlaceholder")}
                    className="mt-2 bg-background border-border"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">
                    {t("curriculum.freePreview")}
                  </Label>
                  <Switch
                    checked={lecture.freePreview}
                    onCheckedChange={(c) => handleFreePreview(c, i)}
                  />
                </div>

                {lecture.videoUrl ? (
                  <div className="space-y-3">
                    <div className="rounded-lg overflow-hidden bg-black">
                      <VideoPlayer
                        url={lecture.videoUrl}
                        width="100%"
                        height="320px"
                        thumbnail={courseLandingFormData?.image || null}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleReplace(i)}
                    >
                      <Replace className="h-4 w-4 ml-2" />{" "}
                      {t("curriculum.replaceVideo")}
                    </Button>
                    <Input
                      id={`replace-${i}`}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => processVideoFiles(e.target.files, i)}
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("curriculum.uploadLectureVideo")}
                    </p>
                    <Input
                      type="file"
                      accept="video/*"
                      className="mx-auto max-w-xs"
                      onChange={(e) => processVideoFiles(e.target.files, i)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-border">
          <Button
            onClick={handleSaveAndContinue}
            className="w-full text-lg font-semibold h-12"
            size="lg"
          >
            {isRTL ? "ذخیره و ادامه" : "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CourseCurriculum;
