const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const authenticateMiddleware = require("../../middleware/auth-middleware");
const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
} = require("../../helpers/cloudinary");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.use(authenticateMiddleware);

const sanitizeFolderName = (value, fallback = "unknown") => {
  if (!value) {
    return fallback;
  }

  const sanitized = value
    .toString()
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/[\s_]+/g, " ")
    .replace(/^[\s\.]+|[\s\.]+$/g, "")
    .trim();

  return sanitized || fallback;
};

const getInstructorIdentifier = (req) =>
  req?.user?.userEmail ||
  req?.user?.email ||
  req?.user?.userName ||
  req?.user?._id ||
  "unknown-instructor";

const getCourseIdentifier = (req) => {
  const courseId = req?.body?.courseId || req?.query?.courseId;
  const courseTitle = req?.body?.courseTitle || req?.query?.courseTitle;

  if (courseId && courseTitle) {
    return `${courseId}-${courseTitle}`;
  }
  if (courseId) {
    return courseId;
  }
  if (courseTitle) {
    return courseTitle;
  }
  return "uncategorized-course";
};

const getInstructorUploadDir = (req) => {
  const folderName = sanitizeFolderName(getInstructorIdentifier(req));
  const courseFolder = sanitizeFolderName(
    getCourseIdentifier(req),
    "uncategorized-course"
  );
  const destination = path.join(uploadDir, folderName, courseFolder);
  fs.mkdirSync(destination, { recursive: true });
  return destination;
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const destination = getInstructorUploadDir(req);
    req._uploadDestination = destination;
    cb(null, destination);
  },
  filename: (_req, file, cb) => {
    const originalName = path.basename(file.originalname || "file");
    const safeName = originalName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    const destination = _req._uploadDestination || getInstructorUploadDir(_req);
    _req._pendingUploadPaths = _req._pendingUploadPaths || [];
    _req._pendingUploadPaths.push(path.join(destination, safeName));
    cb(null, safeName);
  },
});

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const isAllowedLocalFile = (file) => {
  if (!file) return false;
  if (file.mimetype?.startsWith("video/")) return true;
  if (file.mimetype === "application/pdf") return true;
  const ext = path.extname(file.originalname || "").toLowerCase();
  return ext === ".pdf";
};

const localUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (isAllowedLocalFile(file)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only video or PDF files are allowed"));
  },
});

const upload = multer({ storage });

const cleanupFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
    const parentDir = path.dirname(filePath);
    if (parentDir !== uploadDir) {
      const remaining = await fs.promises.readdir(parentDir);
      if (remaining.length === 0) {
        await fs.promises.rmdir(parentDir);
        const instructorDir = path.dirname(parentDir);
        if (instructorDir && instructorDir !== uploadDir) {
          const instructorRemaining = await fs.promises.readdir(instructorDir);
          if (instructorRemaining.length === 0) {
            await fs.promises.rmdir(instructorDir);
          }
        }
      }
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      return;
    }
    console.warn("Failed to remove temp file:", filePath, error.message);
  }
};

const attachAbortCleanup = (req, res, next) => {
  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    const paths = new Set();
    if (req.file?.path) paths.add(req.file.path);
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => file?.path && paths.add(file.path));
    }
    if (Array.isArray(req._pendingUploadPaths)) {
      req._pendingUploadPaths.forEach((filePath) => paths.add(filePath));
    }
    await Promise.all(Array.from(paths).map((filePath) => cleanupFile(filePath)));
  };

  req.on("aborted", cleanup);
  res.on("close", () => {
    if (req.aborted) {
      cleanup();
    }
  });
  next();
};

const buildFileResponse = (file, req) => {
  const folderName = sanitizeFolderName(getInstructorIdentifier(req));
  const courseFolder = sanitizeFolderName(
    getCourseIdentifier(req),
    "uncategorized-course"
  );
  const relativePath = path
    .join(folderName, courseFolder, file.filename)
    .replace(/\\/g, "/");
  const encoded = encodeURIComponent(relativePath);
  const fileUrl = `/media/assets?path=${encoded}`;
  return {
    fileUrl,
    fileKey: relativePath,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
  };
};

const resolveFilePath = (relativePath) => {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolute = path.join(uploadDir, normalized);
  if (!absolute.startsWith(uploadDir)) {
    return null;
  }
  return absolute;
};

const isInstructorOwner = (req, fileKey) => {
  const folderName = sanitizeFolderName(getInstructorIdentifier(req));
  return fileKey?.startsWith(`${folderName}/`);
};

router.post("/upload", attachAbortCleanup, upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: "File is required",
    });
  }

  try {
    const result = await uploadMediaToCloudinary(filePath);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
    });
  } finally {
    await cleanupFile(filePath);
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assest Id is required",
      });
    }

    await deleteMediaFromCloudinary(id);

    res.status(200).json({
      success: true,
      message: "Assest deleted successfully from cloudinary",
    });
  } catch (error) {
    console.error("Delete failed:", error);

    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

router.post(
  "/bulk-upload",
  attachAbortCleanup,
  upload.array("files"),
  async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const filePaths = files.map((fileItem) => fileItem.path).filter(Boolean);

  if (filePaths.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No files were provided for upload",
    });
  }

  try {
    const results = [];
    for (const fileItem of files) {
      const uploaded = await uploadMediaToCloudinary(fileItem.path);
      results.push(uploaded);
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Bulk upload failed:", error);

    res
      .status(500)
      .json({ success: false, message: "Error in bulk uploading files" });
  } finally {
    await Promise.all(filePaths.map((filePath) => cleanupFile(filePath)));
  }
});

router.post(
  "/local-upload",
  attachAbortCleanup,
  localUpload.single("file"),
  async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "File is required",
    });
  }

  return res.status(200).json({
    success: true,
    data: buildFileResponse(file, req),
  });
});

router.post(
  "/local-bulk-upload",
  attachAbortCleanup,
  localUpload.array("files"),
  async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];

  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No files were provided for upload",
    });
  }

  const results = files.map((file) => buildFileResponse(file, req));

  return res.status(200).json({
    success: true,
    data: results,
  });
});

const sendAssetFile = async (req, res, absolutePath) => {
  let stat;
  try {
    stat = await fs.promises.stat(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }
    throw error;
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const videoTypes = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".wmv": "video/x-ms-wmv",
    ".m4v": "video/x-m4v",
  };
  const isVideo = Object.prototype.hasOwnProperty.call(videoTypes, ext);
  if (!isVideo) {
    const fileName = path.basename(absolutePath);
    const encodedName = encodeURIComponent(fileName);
    const contentType =
      ext === ".pdf" ? "application/pdf" : "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stat.size);
    if (req.query.download === "1") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName.replace(/\"/g, "")}"; filename*=UTF-8''${encodedName}`
      );
    }
    return fs.createReadStream(absolutePath).pipe(res);
  }

  const fileSize = stat.size;
  const range = req.headers.range;
  if (!range) {
    res.setHeader("Content-Length", fileSize);
    res.setHeader("Content-Type", videoTypes[ext] || "video/mp4");
    return fs.createReadStream(absolutePath).pipe(res);
  }

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunkSize = end - start + 1;
  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": videoTypes[ext] || "video/mp4",
  });
  return fs.createReadStream(absolutePath, { start, end }).pipe(res);
};

router.get("/assets", async (req, res) => {
  try {
    const rawPath = req.query.path;
    if (!rawPath) {
      return res.status(400).json({
        success: false,
        message: "Path is required",
      });
    }

    const decoded = decodeURIComponent(rawPath);
    const absolutePath = resolveFilePath(decoded);
    if (!absolutePath) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path",
      });
    }

    const sendFileResponse = async () =>
      sendAssetFile(req, res, absolutePath);

    if (req.user?.role === "admin") {
      return sendFileResponse();
    }

    if (req.user?.role === "instructor" && isInstructorOwner(req, decoded)) {
      return sendFileResponse();
    }

    const Course = require("../../models/Course");
    const StudentCourses = require("../../models/StudentCourses");
    const course = await Course.findOne({
      $or: [
        { "curriculum.videoFileKey": decoded },
        { "curriculum.attachmentFileKey": decoded },
      ],
    }).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "File not linked to a course",
      });
    }

    if (req.user?.role === "instructor") {
      if (course.instructorId?.toString() === req.user._id?.toString()) {
        return sendFileResponse();
      }
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (req.user?.role === "user") {
      const studentCourses = await StudentCourses.findOne({
        userId: req.user._id,
      }).lean();
      const hasCourse =
        studentCourses?.courses?.some(
          (item) => item.courseId?.toString() === course._id.toString()
        ) || false;

      const lecture = course.curriculum?.find(
        (item) =>
          item.videoFileKey === decoded || item.attachmentFileKey === decoded
      );
      const isFreePreview = !!lecture?.freePreview;

      if (hasCourse || isFreePreview) {
        return sendFileResponse();
      }
    }

    return res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
  } catch (error) {
    console.error("Asset download failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching asset",
    });
  }
});

router.delete("/local-delete", async (req, res) => {
  try {
    const rawPath = req.query.path;
    if (!rawPath) {
      return res.status(400).json({
        success: false,
        message: "Path is required",
      });
    }

    const decoded = decodeURIComponent(rawPath);
    if (!isInstructorOwner(req, decoded)) {
      const Course = require("../../models/Course");
      const course = await Course.findOne({
        instructorId: req.user._id,
        $or: [
          { "curriculum.videoFileKey": decoded },
          { "curriculum.attachmentFileKey": decoded },
        ],
      }).lean();
      if (!course) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }
    }

    const absolutePath = resolveFilePath(decoded);
    if (!absolutePath) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path",
      });
    }

    await cleanupFile(absolutePath);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Local delete failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting file",
    });
  }
});

module.exports = router;
