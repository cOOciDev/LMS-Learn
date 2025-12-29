import axiosInstance from "@/api/axiosInstance";

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";
const API_BASE_URL = RAW_API_BASE_URL.replace(/^\"|\"$/g, "");

const getBaseOrigin = () => {
  if (API_BASE_URL) {
    if (API_BASE_URL.startsWith("http")) {
      try {
        return new URL(API_BASE_URL).origin;
      } catch (error) {
        // ignore
      }
    }
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

const resolveMediaUrl = (rawUrl) => {
  const baseOrigin = getBaseOrigin();
  const url = rawUrl.startsWith("http")
    ? new URL(rawUrl)
    : new URL(rawUrl, baseOrigin);

  if (typeof window !== "undefined") {
    const isWindowLocal = ["localhost", "127.0.0.1"].includes(
      window.location.hostname
    );
    const isUrlLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (!isWindowLocal && isUrlLocal) {
      return new URL(url.pathname + url.search, window.location.origin);
    }
  }

  return url;
};

export const withAuthToken = (rawUrl, { download = false } = {}) => {
  if (!rawUrl) return "";
  const isLocalAsset = rawUrl.includes("/media/assets");
  if (!isLocalAsset) return rawUrl;

  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");
  const url = resolveMediaUrl(rawUrl);

  if (token) {
    url.searchParams.set("token", token);
  }
  if (download) {
    url.searchParams.set("download", "1");
  }

  return url.toString();
};

export const extractAssetPath = (rawUrl) => {
  if (!rawUrl) return "";
  try {
    const url = resolveMediaUrl(rawUrl);
    return url.searchParams.get("path") || "";
  } catch (error) {
    return "";
  }
};

export const downloadAsset = async (rawUrl, filename = "") => {
  if (!rawUrl) return;
  const assetPath = extractAssetPath(rawUrl);
  if (!assetPath) {
    const fallbackUrl = withAuthToken(rawUrl, { download: true });
    window.location.assign(fallbackUrl);
    return;
  }

  const response = await axiosInstance.get("/media/assets", {
    params: { path: assetPath, download: 1 },
    responseType: "blob",
  });

  const contentType = response.headers?.["content-type"] || "application/octet-stream";
  const blob = new Blob([response.data], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename || "";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const downloadAssetByPath = async (assetPath, filename = "") => {
  if (!assetPath) return;
  const response = await axiosInstance.get("/media/assets", {
    params: { path: assetPath, download: 1 },
    responseType: "blob",
  });

  const contentType =
    response.headers?.["content-type"] || "application/octet-stream";
  const blob = new Blob([response.data], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename || "";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
