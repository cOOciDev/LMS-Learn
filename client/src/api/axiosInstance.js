import axios from "axios";

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";
const baseURL = rawBaseUrl.replace(/^\"|\"$/g, "");

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const response = await axios.post(
            `${axiosInstance.defaults.baseURL}/auth/refresh`,
            null,
            { withCredentials: true }
          );

          if (response.data?.success) {
            const newAccessToken = response.data.data.accessToken;
            sessionStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("accessToken", newAccessToken);
            onRefreshed(newAccessToken);
            isRefreshing = false;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          sessionStorage.removeItem("accessToken");
          localStorage.removeItem("accessToken");
          isRefreshing = false;
          onRefreshed(null);
          if (
            !originalRequest ||
            !originalRequest.url?.includes("/auth/check-auth")
          ) {
            window.location.href = "/auth";
          }
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
