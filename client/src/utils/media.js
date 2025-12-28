import axiosInstance from "@/api/axiosInstance";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export const withAuthToken = (rawUrl, { download = false } = {}) => {
  if (!rawUrl) return "";
  const isLocalAsset = rawUrl.includes("/media/assets");
  if (!isLocalAsset) return rawUrl;

  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");
  const url = rawUrl.startsWith("http")
    ? new URL(rawUrl)
    : new URL(rawUrl, API_BASE_URL);

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
    const url = rawUrl.startsWith("http")
      ? new URL(rawUrl)
      : new URL(rawUrl, API_BASE_URL);
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
