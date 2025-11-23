import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
});

axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const tokenString = sessionStorage.getItem("accessToken");
      if (tokenString) {
        const accessToken = JSON.parse(tokenString);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch (error) {
      console.error("Error parsing access token:", error);
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshTokenString = sessionStorage.getItem("refreshToken");
        if (refreshTokenString) {
          const refreshToken = JSON.parse(refreshTokenString);
          const response = await axios.post(
            `${axiosInstance.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );

          if (response.data?.success) {
            const newAccessToken = response.data.data.accessToken;
            sessionStorage.setItem(
              "accessToken",
              JSON.stringify(newAccessToken)
            );
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
