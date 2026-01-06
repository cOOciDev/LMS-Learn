// client/src/components/instructor-view/courses/add-new-course/course-settings.jsx

import MediaProgressbar from "@/components/media-progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InstructorContext } from "@/context/instructor-context";
import { useLanguage } from "@/context/language-context";
import {
  mediaLocalDeleteService,
  mediaLocalUploadService,
  updateCourseByIdService,
} from "@/services";
import { withAuthToken } from "@/utils/media";
import { Upload, Trash2, Replace } from "lucide-react";
import { useContext, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function CourseSettings() {
  const {
    courseLandingFormData,
    setCourseLandingFormData,
    mediaUploadProgress,
    setMediaUploadProgress,
    mediaUploadProgressPercentage,
    setMediaUploadProgressPercentage,
    currentEditedCourseId,
  } = useContext(InstructorContext);

  const { t, language } = useLanguage();
  const isRTL = language === "fa";
  const { toast } = useToast();

  const [dragOver, setDragOver] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast({
        title: "خطا",
        description: "فقط فایل‌های تصویری می‌توانند آپلود شوند.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (currentEditedCourseId) {
      formData.append("courseId", currentEditedCourseId);
    }
    if (courseLandingFormData?.title) {
      formData.append("courseTitle", courseLandingFormData.title);
    }
    formData.append("file", file);

    setMediaUploadProgress(true);
    setMediaUploadProgressPercentage(0);

    try {
      const response = await mediaLocalUploadService(
        formData,
        setMediaUploadProgressPercentage
      );
      if (response?.success) {
        // اگر قبلاً عکسی بود، حذفش کن
        if (courseLandingFormData?.imageFileKey) {
          await mediaLocalDeleteService(courseLandingFormData.imageFileKey);
        }

        const uploadedUrl = response.data.fileUrl;
        const nextLandingData = {
          ...courseLandingFormData,
          image: uploadedUrl,
          imageFileKey: response.data.fileKey,
          imageFileName: response.data.fileName,
          imageFileType: response.data.fileType,
          imageFileSize: response.data.fileSize,
        };
        setCourseLandingFormData(nextLandingData);
        if (currentEditedCourseId) {
          try {
            await updateCourseByIdService(currentEditedCourseId, {
              image: uploadedUrl,
              imageFileKey: response.data.fileKey,
              imageFileName: response.data.fileName,
              imageFileType: response.data.fileType,
              imageFileSize: response.data.fileSize,
            });
          } catch (updateError) {
            toast({
              title: t("common.error") || "Error",
              description:
                t("courseDetails.enrollError") ||
                "Failed to save image. Please click Save.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "موفق",
          description: "تصویر دوره با موفقیت آپلود شد.",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "آپلود تصویر با خطا مواجه شد.",
        variant: "destructive",
      });
    } finally {
      setMediaUploadProgress(false);
      setMediaUploadProgressPercentage(0);
    }
  };

  const handleDeleteImage = async () => {
    if (courseLandingFormData?.imageFileKey) {
      await mediaLocalDeleteService(courseLandingFormData.imageFileKey);
    }
    const nextLandingData = {
      ...courseLandingFormData,
      image: "",
      imageFileKey: "",
      imageFileName: "",
      imageFileType: "",
      imageFileSize: 0,
    };
    setCourseLandingFormData(nextLandingData);
    if (currentEditedCourseId) {
      try {
        await updateCourseByIdService(currentEditedCourseId, {
          image: "",
          imageFileKey: "",
          imageFileName: "",
          imageFileType: "",
          imageFileSize: 0,
        });
      } catch (updateError) {
        toast({
          title: t("common.error") || "Error",
          description:
            t("courseDetails.enrollError") ||
            "Failed to save image. Please click Save.",
          variant: "destructive",
        });
      }
    }
    toast({ description: "تصویر دوره حذف شد." });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isRTL ? "تنظیمات تصویر دوره" : "Course Image Settings"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* نوار پیشرفت آپلود */}
        {mediaUploadProgress && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {isRTL ? "در حال آپلود..." : "Uploading..."}
            </Label>
            <MediaProgressbar
              isMediaUploading={mediaUploadProgress}
              progress={mediaUploadProgressPercentage}
            />
          </div>
        )}

        {/* نمایش تصویر یا باکس آپلود */}
        {courseLandingFormData?.image ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-lg">
              <img
                src={withAuthToken(courseLandingFormData.image)}
                alt="Course cover"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteImage}
                  className="shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById("image-upload").click()}
            >
              <Replace className="h-4 w-4 ml-2" />
              {isRTL ? "جایگزینی تصویر" : "Replace Image"}
            </Button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("image-upload").click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/50 hover:bg-muted/70"
            }`}
          >
            <Upload
              className={`h-12 w-12 mx-auto mb-4 ${
                dragOver ? "text-primary animate-bounce" : "text-muted-foreground"
              }`}
            />
            <p className="text-lg font-medium text-foreground">
              {isRTL
                ? "تصویر کاور دوره را اینجا بکشید یا کلیک کنید"
                : "Drop your course image here or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isRTL
                ? "پشتیبانی از JPG, PNG, WebP • حداکثر ۱۰ مگابایت"
                : "JPG, PNG, WebP • Max 10MB"}
            </p>
          </div>
        )}

        {/* اینپوت مخفی برای کلیک */}
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
      </CardContent>
    </Card>
  );
}

export default CourseSettings;
