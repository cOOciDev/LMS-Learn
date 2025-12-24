const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const withAuthToken = (rawUrl, { download = false } = {}) => {
  if (!rawUrl) return "";
  const isLocalAsset = rawUrl.includes("/media/assets");
  if (!isLocalAsset) return rawUrl;

  const token = sessionStorage.getItem("accessToken");
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
