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
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(
      2,
      8
    )}${ext}`;
    cb(null, safeName);
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

module.exports = router;
