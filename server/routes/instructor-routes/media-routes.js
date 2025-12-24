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

router.use(authenticateMiddleware);

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const sanitizeFolderName = (value) => {
  if (!value) {
    return "unknown";
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@\.]+/gi, "_")
    .replace(/_+/g, "_");
};

const getInstructorUploadDir = (req) => {
  const instructorEmail =
    req?.user?.userEmail || req?.user?.email || "unknown-instructor";
  const folderName = sanitizeFolderName(instructorEmail);
  const destination = path.join(uploadDir, folderName);
  fs.mkdirSync(destination, { recursive: true });
  return destination;
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    cb(null, getInstructorUploadDir(req));
  },
  filename: (_req, file, cb) => {
    const originalName = path.basename(file.originalname || "file");
    const safeName = originalName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
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
      }
    }
  } catch (error) {
    console.warn("Failed to remove temp file:", filePath, error.message);
  }
};

const buildFileResponse = (file, req) => {
  const instructorEmail =
    req?.user?.userEmail || req?.user?.email || "unknown-instructor";
  const folderName = sanitizeFolderName(instructorEmail);
  const relativePath = path
    .join(folderName, file.filename)
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
  const instructorEmail =
    req?.user?.userEmail || req?.user?.email || "unknown-instructor";
  const folderName = sanitizeFolderName(instructorEmail);
  return fileKey?.startsWith(`${folderName}/`);
};

router.post("/upload", upload.single("file"), async (req, res) => {
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

router.post("/bulk-upload", upload.array("files"), async (req, res) => {
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

router.post("/local-upload", localUpload.single("file"), async (req, res) => {
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

router.post("/local-bulk-upload", localUpload.array("files"), async (req, res) => {
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

    const sendFileResponse = async () => {
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
        if (req.query.download === "1") {
          return res.download(absolutePath, path.basename(absolutePath));
        }
        return res.sendFile(absolutePath);
      }

      const stat = await fs.promises.stat(absolutePath);
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
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
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
