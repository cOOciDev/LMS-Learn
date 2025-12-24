// client/src/components/instructor-view/courses/add-new-course/course-curriculum.jsx

import MediaProgressbar from "@/components/media-progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import VideoPlayer from "@/components/video-player";
import { InstructorContext } from "@/context/instructor-context";
import { useLanguage } from "@/context/language-context";
import {
  mediaLocalBulkUploadService,
  mediaLocalDeleteService,
  mediaLocalUploadService,
} from "@/services";
import { withAuthToken } from "@/utils/media";
import {
  AlertCircle,
  FileText,
  GripVertical,
  Plus,
  Replace,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useContext, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const LECTURES_PER_GROUP = 5;
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".flv",
  ".wmv",
  ".mpeg",
  ".mpg",
  ".m4v",
  ".3gp",
  ".ogg",
]);
const PDF_EXTENSIONS = new Set([".pdf"]);

const chunkLectures = (lectures, size) => {
  if (!lectures || lectures.length === 0) return [];
  const grouped = [];
  for (let i = 0; i < lectures.length; i += size) {
    grouped.push(lectures.slice(i, i + size));
  }
  return grouped;
};

const isVideoFile = (file) => {
  if (!file) return false;
  if (file.type && file.type.startsWith("video/")) return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return VIDEO_EXTENSIONS.has(`.${ext}`);
};

const isPdfFile = (file) => {
  if (!file) return false;
  if (file.type === "application/pdf") return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return PDF_EXTENSIONS.has(`.${ext}`);
};

function CourseCurriculum({ onNext }) {
  const {
    courseCurriculumFormData,
    setCourseCurriculumFormData,
    mediaUploadProgress,
    setMediaUploadProgress,
    mediaUploadProgressPercentage,
    setMediaUploadProgressPercentage,
  } = useContext(InstructorContext);

  const { t } = useLanguage();
  const { toast } = useToast();

  const bulkUploadRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const { courseLandingFormData } = useContext(InstructorContext);

  const groupedLectures = useMemo(
    () => chunkLectures(courseCurriculumFormData, LECTURES_PER_GROUP),
    [courseCurriculumFormData]
  );

  const uploadedCount = courseCurriculumFormData.filter(
    (lecture) => lecture.videoUrl || lecture.attachmentUrl
  ).length;
  const pendingCount = courseCurriculumFormData.length - uploadedCount;
  const moduleCount = groupedLectures.length;

  const isCurriculumValid = () => {
    if (courseCurriculumFormData.length === 0) return false;
    return courseCurriculumFormData.every(
      (lecture) =>
        lecture.title?.trim() && (lecture.videoUrl || lecture.attachmentUrl)
    );
  };

  const handleSaveAndContinue = () => {
    const normalizedLectures = courseCurriculumFormData
      .map((lecture, index) => {
        if (!lecture) return null;
        const hasMedia = !!(lecture.videoUrl || lecture.attachmentUrl);
        const title = lecture.title?.trim();
        if (!hasMedia && !title) return null;
        if (!title && hasMedia) {
          return {
            ...lecture,
            title: `${t("curriculum.lecture") || "Lecture"} ${index + 1}`,
          };
        }
        return lecture;
      })
      .filter(Boolean);

    if (normalizedLectures.length !== courseCurriculumFormData.length) {
      setCourseCurriculumFormData(normalizedLectures);
    }

    if (
      normalizedLectures.length === 0 ||
      !normalizedLectures.every(
        (lecture) =>
          lecture.title?.trim() && (lecture.videoUrl || lecture.attachmentUrl)
      )
    ) {
      toast({
        title: t("common.error") || "Error",
        description:
          t("curriculum.fillDetails") ||
          "Please complete every lecture title and upload a video or PDF.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("common.success") || "Success",
      description:
        t("common.saveAndContinue") || "Saved. Continue to the next step.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    onNext?.();
  };

  const validateFiles = (files, { allowVideo, allowPdf }) => {
    const valid = [];
    const rejected = [];
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(file);
        return;
      }
      if ((allowVideo && isVideoFile(file)) || (allowPdf && isPdfFile(file))) {
        valid.push(file);
      } else {
        rejected.push(file);
      }
    });
    return { valid, rejected };
  };

  const applyUploadedFileToLecture = (payload, replaceIndex, fileType) => {
    setCourseCurriculumFormData((prev) => {
      const updated = [...prev];
      const nextAvailableIndex =
        replaceIndex !== null && replaceIndex !== undefined
          ? replaceIndex
          : updated.findIndex(
              (lecture) => !lecture.videoUrl && !lecture.attachmentUrl
            );
      const targetIndex =
        nextAvailableIndex !== -1 ? nextAvailableIndex : updated.length;
      const baseLecture =
        updated[targetIndex] ||
        {
          title: "",
          videoUrl: "",
          videoFileKey: "",
          videoFileName: "",
          videoFileType: "",
          videoFileSize: 0,
          attachmentUrl: "",
          attachmentFileKey: "",
          attachmentFileName: "",
          attachmentFileType: "",
          attachmentFileSize: 0,
          freePreview: false,
          public_id: "",
        };

      const nextLecture = { ...baseLecture };
      if (!nextLecture.title?.trim()) {
        nextLecture.title = `${t("curriculum.lecture") || "Lecture"} ${
          targetIndex + 1
        }`;
      }
      if (fileType === "video") {
        nextLecture.videoUrl = payload.fileUrl;
        nextLecture.videoFileKey = payload.fileKey;
        nextLecture.videoFileName = payload.fileName;
        nextLecture.videoFileType = payload.fileType;
        nextLecture.videoFileSize = payload.fileSize;
      } else {
        nextLecture.attachmentUrl = payload.fileUrl;
        nextLecture.attachmentFileKey = payload.fileKey;
        nextLecture.attachmentFileName = payload.fileName;
        nextLecture.attachmentFileType = payload.fileType;
        nextLecture.attachmentFileSize = payload.fileSize;
      }

      updated[targetIndex] = nextLecture;
      return updated;
    });
  };

  const processLectureFiles = async (
    files,
    replaceIndex = null,
    targetType = "auto"
  ) => {
    if (!files || files.length === 0) return;

    const { valid, rejected } = validateFiles(files, {
      allowVideo: targetType !== "attachment",
      allowPdf: targetType !== "video",
    });

    if (rejected.length > 0 && valid.length === 0) {
      toast({
        title: t("common.error") || "Error",
        description:
          t("curriculum.invalidVideo") ||
          "Please select video or PDF files only.",
        variant: "destructive",
      });
      return;
    }

    if (valid.length === 0) return;

    if (rejected.length > 0) {
      toast({
        title: t("common.error") || "Error",
        description: "Some files were skipped. Max size is 200MB.",
        variant: "destructive",
      });
    }

    const formData = new FormData();
    if (replaceIndex !== null) {
      formData.append("file", valid[0]);
    } else {
      valid.forEach((file) => formData.append("files", file));
    }

    setMediaUploadProgress(true);
    setMediaUploadProgressPercentage(0);

    toast({
      title: t("curriculum.uploadStartTitle") || "Uploading files",
      description:
        t("curriculum.uploadStartDescription") ||
        "Uploading your files. Large uploads may take a few minutes.",
    });

    try {
      const response =
        replaceIndex !== null
          ? await mediaLocalUploadService(
              formData,
              setMediaUploadProgressPercentage
            )
          : await mediaLocalBulkUploadService(
              formData,
              setMediaUploadProgressPercentage
            );

      if (!response?.success) {
        throw new Error("Upload failed");
      }

      const payloads = Array.isArray(response.data)
        ? response.data
        : [response.data];

      payloads.forEach((payload, idx) => {
        const file = valid[replaceIndex !== null ? 0 : idx];
        const derivedType = isPdfFile(file) ? "attachment" : "video";
        const fileType = targetType === "auto" ? derivedType : targetType;
        applyUploadedFileToLecture(payload, replaceIndex, fileType);
      });

      toast({
        title: t("common.success") || "Success",
        description: `${valid.length} file(s) uploaded successfully.`,
      });
    } catch (err) {
      const errMessage =
        err?.response?.data?.message || "Upload failed. Please try again.";
      toast({
        title: t("common.error") || "Error",
        description: errMessage,
        variant: "destructive",
      });
      console.error("Upload failed:", errMessage, err);
    } finally {
      setMediaUploadProgress(false);
      setMediaUploadProgressPercentage(0);
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
    processLectureFiles(e.dataTransfer.files);
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

  const handleReplace = async (i, targetType) => {
    const lecture = courseCurriculumFormData[i];
    const fileKey =
      targetType === "attachment"
        ? lecture?.attachmentFileKey
        : lecture?.videoFileKey;
    if (fileKey) await mediaLocalDeleteService(fileKey);
    document.getElementById(`replace-${targetType}-${i}`).click();
  };

  const handleDelete = async (i) => {
    const lecture = courseCurriculumFormData[i];
    if (lecture?.videoFileKey) {
      await mediaLocalDeleteService(lecture.videoFileKey);
    }
    if (lecture?.attachmentFileKey) {
      await mediaLocalDeleteService(lecture.attachmentFileKey);
    }
    setCourseCurriculumFormData((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addLecture = () => {
    setCourseCurriculumFormData((prev) => [
      ...prev,
      {
        title: `${t("curriculum.lecture") || "Lecture"} ${prev.length + 1}`,
        videoUrl: "",
        videoFileKey: "",
        videoFileName: "",
        videoFileType: "",
        videoFileSize: 0,
        attachmentUrl: "",
        attachmentFileKey: "",
        attachmentFileName: "",
        attachmentFileType: "",
        attachmentFileSize: 0,
        public_id: "",
        freePreview: false,
      },
    ]);
  };

  const renderLectureCard = (lecture, index) => (
    <div
      key={`lecture-${index}`}
      className="border border-border rounded-xl overflow-hidden bg-card shadow-md"
    >
      <div className="bg-muted/50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          <span className="font-bold text-foreground">
            {t("curriculum.lecture")} {index + 1}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => handleDelete(index)}
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
            onChange={(e) => handleTitleChange(e.target.value, index)}
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
            onCheckedChange={(c) => handleFreePreview(c, index)}
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
              onClick={() => handleReplace(index, "video")}
            >
              <Replace className="h-4 w-4 ml-2" />{" "}
              {t("curriculum.replaceVideo")}
            </Button>
            <Input
              id={`replace-video-${index}`}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) =>
                processLectureFiles(e.target.files, index, "video")
              }
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
              onChange={(e) =>
                processLectureFiles(e.target.files, index, "video")
              }
            />
          </div>
        )}

        <div className="border-t border-border/50 pt-4">
          {lecture.attachmentUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {lecture.attachmentFileName || "PDF"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lecture.attachmentFileType || "application/pdf"}
                  </p>
                </div>
                <a
                  className="text-xs text-blue-500 hover:underline"
                  href={withAuthToken(lecture.attachmentUrl, { download: true })}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("common.download") || "Download"}
                </a>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleReplace(index, "attachment")}
              >
                <Replace className="h-4 w-4 ml-2" />{" "}
                {t("curriculum.replaceFile") || "Replace file"}
              </Button>
              <Input
                id={`replace-attachment-${index}`}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) =>
                  processLectureFiles(e.target.files, index, "attachment")
                }
              />
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {t("curriculum.uploadLectureFile") || "Upload lecture PDF"}
              </p>
              <Input
                type="file"
                accept="application/pdf"
                className="mx-auto max-w-xs"
                onChange={(e) =>
                  processLectureFiles(e.target.files, index, "attachment")
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
              accept="video/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => processLectureFiles(e.target.files)}
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
              {t("curriculum.uploading") || "Uploading files..."}
            </Label>
            <MediaProgressbar
              isMediaUploading={mediaUploadProgress}
              progress={mediaUploadProgressPercentage}
            />
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              {t("curriculum.largeFilesHint") ||
                "Large uploads can take a few minutes. Please keep this tab open until the bar reaches 100%."}
            </p>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-border/40 bg-card/70 p-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              {t("curriculum.uploadedLectures") || "Uploaded Lectures"}
            </p>
            <p className="text-3xl font-semibold text-foreground">
              {uploadedCount}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("curriculum.totalLectures") || "Total lectures"}:{" "}
              {courseCurriculumFormData.length}
            </p>
          </div>
          <div className="rounded-3xl border border-border/40 bg-card/70 p-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              {t("curriculum.pendingUploads") || "Pending"}
            </p>
            <p className="text-3xl font-semibold text-foreground">
              {pendingCount}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("curriculum.fillDetails") || "Need video or title"}
            </p>
          </div>
          <div className="rounded-3xl border border-border/40 bg-card/70 p-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              {t("curriculum.moduleCount") || "Modules"}
            </p>
            <p className="text-3xl font-semibold text-foreground">
              {moduleCount}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("curriculum.chunkSizeDescription") ||
                `${LECTURES_PER_GROUP} per module`}
            </p>
          </div>
        </div>

        {courseCurriculumFormData.length > 0 && (
          <div className="space-y-6">
            {groupedLectures.map((group, groupIndex) => (
              <details
                key={`module-${groupIndex}`}
                open
                className="overflow-hidden rounded-2xl border border-border/30 bg-card/60 shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-foreground">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                      {t("curriculum.module") || "Module"} {groupIndex + 1}
                    </p>
                    <p className="text-lg font-bold">
                      {group.length} {t("curriculum.lectures") || "Lectures"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {
                      group.filter(
                        (lecture) => lecture.videoUrl || lecture.attachmentUrl
                      ).length
                    }{" "}
                    {t("curriculum.uploadedShort") || "Uploaded"}
                  </span>
                </summary>
                <div className="space-y-5 px-5 pb-5 pt-0">
                  {group.map((lecture, idx) =>
                    renderLectureCard(
                      lecture,
                      groupIndex * LECTURES_PER_GROUP + idx
                    )
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="pt-6 border-t border-border">
          <Button
            onClick={handleSaveAndContinue}
            className="w-full text-lg font-semibold h-12"
            size="lg"
          >
            {t("common.saveAndContinue") || "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CourseCurriculum;
